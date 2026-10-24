import { describe, test, expect, mock, afterEach } from 'bun:test';
import { googleSheetsService } from '../services/googleSheets';
import { SHEET_TABS, HEADERS } from '../core/sheetSerializer';
import type { GoogleUser } from '../types/google';
import type { Expense, Settlement } from '../types/transaction';

describe('googleSheetsService - Google Sheets API v4 Integration', () => {
  const originalFetch = globalThis.fetch;
  const mockToken = 'test-mock-token-xyz';
  const spreadsheetId = 'sheet-id-12345';

  const mockOwner: GoogleUser = {
    email: 'alice@example.com',
    name: 'Alice Dev',
    googleName: 'Alice Dev',
    picture: 'https://example.com/alice.jpg',
  };

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
  });

  test('createGroupSpreadsheet constructs correct API v4 payload with system and per-member tabs', async () => {
    const fetchCalls: Array<{ url: string; body: any }> = [];

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      fetchCalls.push({ url: url.toString(), body });

      if (url.toString() === 'https://sheets.googleapis.com/v4/spreadsheets') {
        return new Response(
          JSON.stringify({
            spreadsheetId: 'created-sheet-999',
            sheets: [
              { properties: { sheetId: 1, title: SHEET_TABS.ALL_EXPENSES } },
              { properties: { sheetId: 2, title: SHEET_TABS.SETTLEMENTS } },
              { properties: { sheetId: 3, title: 'Exp_alice@example.com' } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const createdId = await googleSheetsService.createGroupSpreadsheet(
      mockToken,
      'Goa Trip 2026',
      'INR',
      mockOwner,
      ['bob@example.com'],
      'Trip with friends'
    );

    expect(createdId).toBe('created-sheet-999');

    // First call is POST /spreadsheets
    const createCall = fetchCalls[0];
    expect(createCall.url).toBe('https://sheets.googleapis.com/v4/spreadsheets');
    expect(createCall.body.properties.title).toBe('[SpreadSpends] Goa Trip 2026');

    // Verify tabs created: Config, Members, Invites, Settlements, All_Expenses, Exp_alice, Exp_bob
    const sheetTitles = createCall.body.sheets.map((s: any) => s.properties.title);
    expect(sheetTitles).toContain(SHEET_TABS.CONFIG);
    expect(sheetTitles).toContain(SHEET_TABS.MEMBERS);
    expect(sheetTitles).toContain(SHEET_TABS.INVITES);
    expect(sheetTitles).toContain(SHEET_TABS.SETTLEMENTS);
    expect(sheetTitles).toContain(SHEET_TABS.ALL_EXPENSES);
    expect(sheetTitles.some((t: string) => t.includes('Exp_alice'))).toBe(true);
    expect(sheetTitles.some((t: string) => t.includes('Exp_bob'))).toBe(true);

    // Verify All_Expenses formula is inserted as a formulaValue
    const allExpensesSheet = createCall.body.sheets.find(
      (s: any) => s.properties.title === SHEET_TABS.ALL_EXPENSES
    );
    expect(allExpensesSheet).toBeDefined();
    const formulaCell = allExpensesSheet.data[0].rowData[1].values[0];
    expect(formulaCell.userEnteredValue.formulaValue).toBeDefined();
    expect(formulaCell.userEnteredValue.formulaValue).toContain('VSTACK');
  });

  test('readTab queries sheet values with proper range encoding and returns empty array on empty data', async () => {
    let capturedUrl = '';
    (globalThis as any).fetch = mock(async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(JSON.stringify({ values: [['id', 'name'], ['1', 'Alice']] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const rows = await googleSheetsService.readTab(mockToken, spreadsheetId, SHEET_TABS.MEMBERS);
    expect(rows.length).toBe(2);
    expect(rows[1][1]).toBe('Alice');
    expect(capturedUrl).toContain(encodeURIComponent(SHEET_TABS.MEMBERS));

    // When values is missing
    (globalThis as any).fetch = mock(async () => {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const emptyRows = await googleSheetsService.readTab(mockToken, spreadsheetId, 'EmptyTab');
    expect(emptyRows).toEqual([]);
  });

  test('readTab throws error when API returns non-ok status', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), {
        status: 401,
      });
    });

    expect(
      googleSheetsService.readTab(mockToken, spreadsheetId, SHEET_TABS.CONFIG)
    ).rejects.toThrow('Invalid Credentials');
  });

  test('appendRow posts row with USER_ENTERED value input option', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
    });

    const sampleRow = ['exp-1', '2026-10-01', 'Dinner', '50.00'];
    await googleSheetsService.appendRow(mockToken, spreadsheetId, 'Exp_alice', sampleRow);

    expect(capturedUrl).toContain('valueInputOption=USER_ENTERED');
    expect(capturedUrl).toContain('insertDataOption=INSERT_ROWS');
    expect(capturedBody.values).toEqual([sampleRow]);
  });

  test('updateSheetRange puts updated values to specified range', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ updatedCells: 4 }), { status: 200 });
    });

    const range = `${SHEET_TABS.CONFIG}!A1:B2`;
    const newValues = [['Key', 'Val'], ['app', 'Spread-Spends']];
    await googleSheetsService.updateSheetRange(mockToken, spreadsheetId, range, newValues);

    expect(capturedUrl).toContain(encodeURIComponent(range));
    expect(capturedUrl).toContain('valueInputOption=USER_ENTERED');
    expect(capturedBody.values).toEqual(newValues);
  });

  test('updateGroupDescription modifies description in Group_Config tab', async () => {
    let putValues: any = null;
    (globalThis as any).fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        putValues = JSON.parse(init.body as string).values;
        return new Response(JSON.stringify({ updatedCells: 10 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          values: [
            HEADERS.CONFIG,
            ['app_signature', 'Spread-Spends'],
            ['schema_version', '2.0.0'],
            ['group_id', spreadsheetId],
            ['group_name', 'Test Group'],
            ['group_description', 'Old Description'],
            ['default_currency', 'USD'],
            ['owner_email', 'alice@test.com'],
            ['created_at', '2026-01-01'],
          ],
        }),
        { status: 200 }
      );
    });

    await googleSheetsService.updateGroupDescription(
      mockToken,
      spreadsheetId,
      'Updated Vacation Notes'
    );
    expect(putValues).toBeDefined();
    const descRow = putValues.find((r: string[]) => r[0] === 'group_description');
    expect(descRow[1]).toBe('Updated Vacation Notes');
  });

  test('batchReadTabs queries multiple ranges in a single batchGet request', async () => {
    let capturedUrl = '';
    (globalThis as any).fetch = mock(async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(
        JSON.stringify({
          valueRanges: [
            { range: '_Config!A1:B10', values: [['k1', 'v1']] },
            { range: '_Members!A1:G10', values: [['m1', 'v2']] },
          ],
        }),
        { status: 200 }
      );
    });

    const result = await googleSheetsService.batchReadTabs(mockToken, spreadsheetId, [
      '_Config!A1:B10',
      '_Members!A1:G10',
    ]);

    expect(result.length).toBe(2);
    expect(result[0].values[0]).toEqual(['k1', 'v1']);
    expect(capturedUrl).toContain('values:batchGet');
    expect(capturedUrl).toContain(encodeURIComponent('_Config!A1:B10'));

    // Empty ranges input returns immediately without fetch
    const emptyResult = await googleSheetsService.batchReadTabs(mockToken, spreadsheetId, []);
    expect(emptyResult).toEqual([]);
  });

  test('addMemberTab issues batchUpdate AddSheetRequest, adds header, and handles existing tab', async () => {
    const urlsCalled: string[] = [];
    (globalThis as any).fetch = mock(async (url: string | URL | Request, _init?: RequestInit) => {
      const urlStr = url.toString();
      urlsCalled.push(urlStr);

      if (urlStr.includes(':batchUpdate')) {
        return new Response(
          JSON.stringify({
            replies: [{ addSheet: { properties: { sheetId: 101, title: 'Exp_bob@example.com' } } }],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const tabName = await googleSheetsService.addMemberTab(mockToken, spreadsheetId, 'bob@example.com');
    expect(tabName).toContain('Exp_bob');
    expect(urlsCalled.some((u) => u.includes(':batchUpdate'))).toBe(true);

    // If already exists, does not throw
    (globalThis as any).fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          error: { message: "A sheet with the name 'Exp_bob@example.com' already exists" },
        }),
        { status: 400 }
      );
    });

    const safeTabName = await googleSheetsService.addMemberTab(
      mockToken,
      spreadsheetId,
      'bob@example.com'
    );
    expect(safeTabName).toContain('Exp_bob');
  });

  test('ensureTabsDateFormatting applies DATE number formatting to date columns', async () => {
    let batchRequests: any = null;

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes(':batchUpdate')) {
        batchRequests = JSON.parse(init?.body as string).requests;
        return new Response(JSON.stringify({ replies: [] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          sheets: [
            { properties: { sheetId: 10, title: SHEET_TABS.ALL_EXPENSES, gridProperties: { rowCount: 60 } } },
            { properties: { sheetId: 11, title: SHEET_TABS.CONFIG } }, // Not targeted
          ],
        }),
        { status: 200 }
      );
    });

    await googleSheetsService.ensureTabsDateFormatting(mockToken, spreadsheetId);
    expect(batchRequests).toBeDefined();
    expect(batchRequests.length).toBe(1);
    expect(batchRequests[0].repeatCell.range.sheetId).toBe(10);
    expect(batchRequests[0].repeatCell.cell.userEnteredFormat.numberFormat.pattern).toBe('yyyy-mm-dd');
  });

  test('updateAllExpensesFormula updates formula and invokes formatting', async () => {
    let updatedRange = '';
    let updatedFormula = '';

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (init?.method === 'PUT') {
        updatedRange = urlStr;
        updatedFormula = JSON.parse(init.body as string).values[0][0];
        return new Response(JSON.stringify({ updatedCells: 1 }), { status: 200 });
      }
      return new Response(JSON.stringify({ sheets: [] }), { status: 200 });
    });

    await googleSheetsService.updateAllExpensesFormula(mockToken, spreadsheetId, [
      'alice@test.com',
      'bob@test.com',
    ]);
    expect(updatedRange).toContain('All_Expenses');
    expect(updatedFormula).toContain('VSTACK');
  });

  test('updateMemberName updates member row accurately in _Members tab', async () => {
    let capturedValues: any = null;

    (globalThis as any).fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        capturedValues = JSON.parse(init.body as string).values;
        return new Response(JSON.stringify({ updatedCells: 5 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          values: [
            HEADERS.MEMBERS,
            ['alice@example.com', 'Alice Original', 'OWNER', 'ACTIVE', 'self', '2026-01-01', ''],
            ['bob@example.com', 'Bob Original', 'MEMBER', 'ACTIVE', 'alice', '2026-01-01', ''],
          ],
        }),
        { status: 200 }
      );
    });

    await googleSheetsService.updateMemberName(
      mockToken,
      spreadsheetId,
      'bob@example.com',
      'Robert The Great'
    );

    expect(capturedValues).toBeDefined();
    const bobRow = capturedValues.find((r: string[]) => r[0] === 'bob@example.com');
    expect(bobRow[1]).toBe('Robert The Great');
  });

  test('updateMemberName throws error when member email is not found', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          values: [
            HEADERS.MEMBERS,
            ['alice@example.com', 'Alice', 'OWNER', 'ACTIVE', 'self', '2026-01-01', ''],
          ],
        }),
        { status: 200 }
      );
    });

    expect(
      googleSheetsService.updateMemberName(
        mockToken,
        spreadsheetId,
        'nonexistent@example.com',
        'Nobody'
      )
    ).rejects.toThrow('not found');
  });

  test('updateExpense finds expense row in member tab and updates it', async () => {
    let updatedRange = '';
    let updatedValues: any = null;

    const sampleExpense: Expense = {
      id: 'exp-target-001',
      date: '2026-10-15',
      description: 'Groceries',
      amount: 4500,
      currency: 'INR',
      category: 'groceries',
      paidBy: { 'alice@example.com': 4500 },
      splitType: 'EQUAL',
      splits: { 'alice@example.com': 2250, 'bob@example.com': 2250 },
      createdBy: 'alice@example.com',
      createdAt: '2026-10-15T12:00:00.000Z',
      status: 'ACTIVE',
    };

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (init?.method === 'PUT') {
        updatedRange = urlStr;
        updatedValues = JSON.parse(init.body as string).values;
        return new Response(JSON.stringify({ updatedRows: 1 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          values: [
            HEADERS.EXPENSES,
            ['exp-target-001', '2026-10-15', 'Groceries', '45.00', 'INR'],
          ],
        }),
        { status: 200 }
      );
    });

    await googleSheetsService.updateExpense(mockToken, spreadsheetId, sampleExpense);
    expect(decodeURIComponent(updatedRange)).toContain('A2:N2');
    expect(updatedValues[0][0]).toBe('exp-target-001');
    expect(updatedValues[0][2]).toBe('Groceries');
  });

  test('updateSettlement updates row in _Settlements tab and throws if not found', async () => {
    let updatedValues: any = null;

    const sampleSettlement: Settlement = {
      id: 'set-target-001',
      date: '2026-10-16',
      payerEmail: 'bob@example.com',
      payerName: 'Bob Jones',
      payeeEmail: 'alice@example.com',
      payeeName: 'Alice Dev',
      amount: 2250,
      currency: 'INR',
      paymentMethod: 'UPI',
      recordedBy: 'bob@example.com',
      createdAt: '2026-10-16T10:00:00.000Z',
      status: 'ACTIVE',
    };

    (globalThis as any).fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        updatedValues = JSON.parse(init.body as string).values;
        return new Response(JSON.stringify({ updatedRows: 1 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          values: [
            HEADERS.SETTLEMENTS,
            ['set-target-001', '2026-10-16', 'bob@example.com', 'alice@example.com', '22.50'],
          ],
        }),
        { status: 200 }
      );
    });

    await googleSheetsService.updateSettlement(mockToken, spreadsheetId, sampleSettlement);
    expect(updatedValues[0][0]).toBe('set-target-001');

    // Not found test
    (globalThis as any).fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          values: [HEADERS.SETTLEMENTS],
        }),
        { status: 200 }
      );
    });

    expect(
      googleSheetsService.updateSettlement(mockToken, spreadsheetId, sampleSettlement)
    ).rejects.toThrow('not found');
  });
});
