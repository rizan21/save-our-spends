import {
  SHEET_TABS,
  HEADERS,
  getMemberTabName,
  generateAllExpensesFormula,
  serializeGroupConfig,
  serializeMembers,
  serializePendingInvites,
  serializeSettlements,
} from '../core/sheetSerializer';
import type { GroupConfig, Member } from '../types/group';
import type { GoogleUser } from '../types/google';

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
    initialMemberEmails: string[] = []
  ): Promise<string> {
    const title = `[SpreadSpends] ${groupName}`;

    const config: GroupConfig = {
      appSignature: 'Spread-Spends',
      schemaVersion: '2.0.0', // updated for per-member tab schema
      groupId: '', // will be set once sheet is created
      groupName,
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
              values: row.map((cell) => ({
                userEnteredValue: {
                  stringValue: typeof cell === 'string' ? cell : String(cell),
                },
              })),
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
      throw new Error(err.error?.message || `Failed to create spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    const sheetId = data.spreadsheetId;

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
    await this.updateSheetRange(token, spreadsheetId, `${tabName}!A1:M1`, [HEADERS.EXPENSES]);
    return tabName;
  }

  /**
   * Updates the VSTACK formula on the master All_Expenses tab
   */
  public async updateAllExpensesFormula(
    token: string,
    spreadsheetId: string,
    memberEmails: string[]
  ): Promise<void> {
    const formula = generateAllExpensesFormula(memberEmails);
    if (!formula) return;
    await this.updateSheetRange(token, spreadsheetId, `${SHEET_TABS.ALL_EXPENSES}!A2:A2`, [[formula]]);
  }
}

export const googleSheetsService = new GoogleSheetsService();
