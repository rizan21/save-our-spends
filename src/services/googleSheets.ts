import {
  SHEET_TABS,
  HEADERS,
  getMemberTabName,
  generateAllExpensesFormula,
  serializeGroupConfig,
  deserializeGroupConfig,
  serializeMembers,
  deserializeMembers,
  serializePendingInvites,
  serializeSettlements,
  serializeExpenseRow,
  serializeSettlementRow,
} from '../core/sheetSerializer';
import type { GroupConfig, Member } from '../types/group';
import type { GoogleUser } from '../types/google';
import type { Expense, Settlement } from '../types/transaction';

export class GoogleSheetsService {
  /**
   * Initializes a brand-new group spreadsheet with isolated per-person tabs,
   * a master All_Expenses formula tab, and config tabs.
   */
  public async createGroupSpreadsheet(
    token: string,
    groupName: string,
    currency: string,
    owner: GoogleUser,
    initialMemberEmails: string[] = [],
    description?: string
  ): Promise<string> {
    const title = `[SpreadSpends] ${groupName}`;

    const config: GroupConfig = {
      appSignature: 'Spread-Spends',
      schemaVersion: '2.0.0', // updated for per-member tab schema
      groupId: '', // will be set once sheet is created
      groupName,
      description,
      defaultCurrency: currency,
      ownerEmail: owner.email,
      createdAt: new Date().toISOString(),
    };

    const members: Member[] = [
      {
        email: owner.email,
        name: owner.name,
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: new Date().toISOString(),
        picture: owner.picture,
      },
    ];

    for (const email of initialMemberEmails) {
      if (email && email !== owner.email) {
        members.push({
          email,
          name: email.split('@')[0],
          role: 'MEMBER',
          status: 'ACTIVE',
          addedBy: owner.email,
          joinedAt: new Date().toISOString(),
        });
      }
    }

    const memberEmails = members.map((m) => m.email);

    // Dynamic tabs: System tabs + Master All_Expenses view + Isolated tab per person
    const tabDefinitions: Array<{ title: string; rows: string[][] }> = [
      { title: SHEET_TABS.CONFIG, rows: serializeGroupConfig(config) },
      { title: SHEET_TABS.MEMBERS, rows: serializeMembers(members) },
      { title: SHEET_TABS.INVITES, rows: serializePendingInvites([]) },
      { title: SHEET_TABS.SETTLEMENTS, rows: serializeSettlements([]) },
      {
        title: SHEET_TABS.ALL_EXPENSES,
        rows: [
          HEADERS.EXPENSES,
          [generateAllExpensesFormula(memberEmails)],
        ],
      },
    ];

    // Add personal tab for each member
    for (const member of members) {
      tabDefinitions.push({
        title: getMemberTabName(member.email),
        rows: [HEADERS.EXPENSES],
      });
    }

    const body = {
      properties: { title },
      sheets: tabDefinitions.map((tab) => ({
        properties: {
          title: tab.title,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(tab.rows.length + 20, 50),
            columnCount: 20,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: tab.rows.map((row) => ({
              values: row.map((cell) => {
                const str = typeof cell === 'string' ? cell : String(cell);
                return {
                  userEnteredValue: str.startsWith('=')
                    ? { formulaValue: str }
                    : { stringValue: str },
                };
              }),
            })),
          },
        ],
      })),
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const rawMessage = err.error?.message || res.statusText;
      const isScopeOrPermError =
        res.status === 403 ||
        /insufficient.*scope|caller does not have permission|permission_denied/i.test(rawMessage);
      if (isScopeOrPermError) {
        throw new Error(
          'Google Drive permission missing: Save Our Spends needs permission to create spreadsheets in your Google Drive (the drive.file permission). Please re-run Google OAuth in your profile or click Re-authorize with Google to grant Drive access.'
        );
      }
      throw new Error(rawMessage || `Failed to create spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    const sheetId = data.spreadsheetId;

    // Format Column B (Date) as DATE (yyyy-mm-dd) on All_Expenses, Settlements, and member tabs
    const dateTabSheets = (data.sheets || [])
      .filter((s: { properties?: { sheetId?: number; title?: string } }) => {
        const t = s.properties?.title;
        return (
          t === SHEET_TABS.ALL_EXPENSES ||
          t === SHEET_TABS.SETTLEMENTS ||
          (t && t.startsWith('Exp_'))
        );
      })
      .map((s: { properties: { sheetId: number; gridProperties?: { rowCount?: number } } }) => ({
        sheetId: s.properties.sheetId,
        rowCount: s.properties.gridProperties?.rowCount || 50,
      }));

    if (dateTabSheets.length > 0) {
      await this.formatDateColumns(token, sheetId, dateTabSheets).catch(() => {});
    }

    // Update group_id in config
    config.groupId = sheetId;
    await this.updateSheetRange(
      token,
      sheetId,
      `${SHEET_TABS.CONFIG}!A1:B${tabDefinitions[0].rows.length}`,
      serializeGroupConfig(config)
    );

    return sheetId;
  }

  /**
   * Reads all rows from a tab
   */
  public async readTab(token: string, spreadsheetId: string, tabName: string): Promise<string[][]> {
    const range = encodeURIComponent(`${tabName}!A1:Z500`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to read tab ${tabName}: ${res.statusText}`);
    }

    const data = await res.json();
    const values = data.values || [];
    // Normalize to string[][]
    return values.map((row: unknown[]) =>
      row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))
    );
  }

  /**
   * Appends a single row to a tab
   */
  public async appendRow(
    token: string,
    spreadsheetId: string,
    tabName: string,
    row: string[]
  ): Promise<void> {
    const range = encodeURIComponent(`${tabName}!A:A`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to append row to ${tabName}: ${res.statusText}`);
    }
  }

  /**
   * Overwrites/updates a specific range on a tab
   */
  public async updateSheetRange(
    token: string,
    spreadsheetId: string,
    range: string,
    values: string[][]
  ): Promise<void> {
    const encRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encRange}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update range ${range}: ${res.statusText}`);
    }
  }

  /**
   * Updates group description in the Group_Config tab of the Google Sheet.
   */
  public async updateGroupDescription(
    token: string,
    spreadsheetId: string,
    description: string
  ): Promise<void> {
    const configRows = await this.readTab(token, spreadsheetId, SHEET_TABS.CONFIG);
    const config = deserializeGroupConfig(configRows);
    config.description = description;
    const serialized = serializeGroupConfig(config);
    await this.updateSheetRange(
      token,
      spreadsheetId,
      `${SHEET_TABS.CONFIG}!A1:B${serialized.length}`,
      serialized
    );
  }

  /**
   * Reads multiple ranges in parallel in a single HTTP request using values.batchGet
   */
  public async batchReadTabs(
    token: string,
    spreadsheetId: string,
    ranges: string[]
  ): Promise<Array<{ range: string; values: string[][] }>> {
    if (ranges.length === 0) return [];
    const queryParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}&valueRenderOption=UNFORMATTED_VALUE`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to batch read tabs: ${res.statusText}`);
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];
    return valueRanges.map((vr: { range?: string; values?: unknown[][] }) => ({
      range: vr.range || '',
      values: (vr.values || []).map((row: unknown[]) =>
        row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))
      ),
    }));
  }

  /**
   * Adds a new isolated personal tab for a member and writes the headers
   */
  public async addMemberTab(
    token: string,
    spreadsheetId: string,
    memberEmail: string
  ): Promise<string> {
    const tabName = getMemberTabName(memberEmail);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
                gridProperties: {
                  frozenRowCount: 1,
                  rowCount: 50,
                  columnCount: 15,
                },
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // If the tab already exists, continue safely
      if (err.error?.message?.includes('already exists')) {
        return tabName;
      }
      throw new Error(err.error?.message || `Failed to add sheet tab ${tabName}: ${res.statusText}`);
    }

    // Populate header row
    await this.updateSheetRange(token, spreadsheetId, `${tabName}!A1:N1`, [HEADERS.EXPENSES]);

    // Format Column B (Date) as DATE on the new tab
    const replyData = await res.json().catch(() => ({}));
    const newSheet = replyData?.replies?.[0]?.addSheet;
    if (newSheet?.properties?.sheetId !== undefined) {
      await this.formatDateColumns(token, spreadsheetId, [
        {
          sheetId: newSheet.properties.sheetId,
          rowCount: newSheet.properties.gridProperties?.rowCount || 50,
        },
      ]).catch(() => {});
    }

    return tabName;
  }

  /**
   * Applies DATE number formatting (yyyy-mm-dd) to Column B (date column)
   * on the specified tabs in the Google Sheet.
   */
  public async formatDateColumns(
    token: string,
    spreadsheetId: string,
    sheets: Array<{ sheetId: number; rowCount?: number }>
  ): Promise<void> {
    if (sheets.length === 0) return;
    const requests = sheets.map(({ sheetId, rowCount }) => ({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1, // Skip header row
          endRowIndex: Math.max(rowCount || 50, 50),
          startColumnIndex: 1, // Column B (Date)
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'DATE',
              pattern: 'yyyy-mm-dd',
            },
          },
        },
        fields: 'userEnteredFormat.numberFormat',
      },
    }));

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.warn('formatDateColumns batchUpdate failed:', res.status, err);
    }
  }

  /**
   * Ensures Column B (Date) is formatted as DATE (yyyy-mm-dd) across all relevant tabs.
   * Auto-heals existing spreadsheets without modifying underlying data.
   */
  public async ensureTabsDateFormatting(
    token: string,
    spreadsheetId: string
  ): Promise<void> {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    if (!metaRes.ok) {
      const errText = await metaRes.text().catch(() => '');
      console.warn('Failed to fetch spreadsheet properties for date formatting:', metaRes.status, errText);
      return;
    }
    const meta = await metaRes.json().catch(() => ({}));
    const targetSheets = (meta.sheets || [])
      .filter((s: { properties?: { sheetId?: number; title?: string } }) => {
        const t = s.properties?.title;
        return (
          t === SHEET_TABS.ALL_EXPENSES ||
          t === SHEET_TABS.SETTLEMENTS ||
          (t && t.startsWith('Exp_'))
        );
      })
      .map((s: { properties: { sheetId: number; gridProperties?: { rowCount?: number } } }) => ({
        sheetId: s.properties.sheetId,
        rowCount: s.properties.gridProperties?.rowCount || 50,
      }));

    if (targetSheets.length > 0) {
      await this.formatDateColumns(token, spreadsheetId, targetSheets);
    }
  }

  /**
   * Updates the VSTACK formula on the master All_Expenses tab and ensures date formatting.
   */
  public async updateAllExpensesFormula(
    token: string,
    spreadsheetId: string,
    memberEmails: string[]
  ): Promise<void> {
    const formula = generateAllExpensesFormula(memberEmails);
    if (!formula) return;
    await this.updateSheetRange(token, spreadsheetId, `${SHEET_TABS.ALL_EXPENSES}!A2:A2`, [[formula]]);
    await this.ensureTabsDateFormatting(token, spreadsheetId).catch(() => {});
  }

  /**
   * Updates a member's display name in the Members tab of the Google Sheet.
   */
  public async updateMemberName(
    token: string,
    spreadsheetId: string,
    email: string,
    newName: string
  ): Promise<void> {
    const memberRows = await this.readTab(token, spreadsheetId, SHEET_TABS.MEMBERS);
    const members = deserializeMembers(memberRows);
    const target = members.find((m) => m.email === email);
    if (!target) {
      throw new Error(`Member with email ${email} not found`);
    }
    target.name = newName;
    const serialized = serializeMembers(members);
    await this.updateSheetRange(
      token,
      spreadsheetId,
      `${SHEET_TABS.MEMBERS}!A1:G${serialized.length}`,
      serialized
    );
  }

  /**
   * Updates an existing expense row and its history in the author's personal tab (or legacy Expenses tab).
   */
  public async updateExpense(
    token: string,
    spreadsheetId: string,
    expense: Expense
  ): Promise<void> {
    const authorEmail = expense.createdBy;
    const preferredTab = authorEmail ? getMemberTabName(authorEmail) : '';
    let targetTab = preferredTab;
    let rowIndex = -1;

    if (targetTab) {
      try {
        const rows = await this.readTab(token, spreadsheetId, targetTab);
        rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === expense.id);
      } catch {
        rowIndex = -1;
      }
    }

    if (rowIndex === -1) {
      try {
        const rows = await this.readTab(token, spreadsheetId, SHEET_TABS.EXPENSES);
        rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === expense.id);
        if (rowIndex !== -1) {
          targetTab = SHEET_TABS.EXPENSES;
        }
      } catch {
        rowIndex = -1;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Expense with ID ${expense.id} not found in spreadsheet`);
    }

    const serialized = serializeExpenseRow(expense);
    const range = `${targetTab}!A${rowIndex + 1}:N${rowIndex + 1}`;
    await this.updateSheetRange(token, spreadsheetId, range, [serialized]);
  }

  /**
   * Updates an existing settlement row and its history in the Settlements tab.
   */
  public async updateSettlement(
    token: string,
    spreadsheetId: string,
    settlement: Settlement
  ): Promise<void> {
    const rows = await this.readTab(token, spreadsheetId, SHEET_TABS.SETTLEMENTS);
    const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === settlement.id);
    if (rowIndex === -1) {
      throw new Error(`Settlement with ID ${settlement.id} not found in spreadsheet`);
    }

    const serialized = serializeSettlementRow(settlement);
    const range = `${SHEET_TABS.SETTLEMENTS}!A${rowIndex + 1}:N${rowIndex + 1}`;
    await this.updateSheetRange(token, spreadsheetId, range, [serialized]);
  }
}

export const googleSheetsService = new GoogleSheetsService();
