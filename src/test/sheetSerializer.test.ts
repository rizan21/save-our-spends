import { describe, test, expect } from 'bun:test';
import {
  serializeGroupConfig,
  deserializeGroupConfig,
  serializeMembers,
  deserializeMembers,
  serializeExpenses,
  deserializeExpenses,
  serializeSettlements,
  deserializeSettlements,
  serializePendingInvites,
  deserializePendingInvites,
  getMemberTabName,
  generateAllExpensesFormula,
  deserializeMultiTabExpenses,
  parseSheetDate,
  HEADERS,
} from '../core/sheetSerializer';
import type { GroupConfig, Member, PendingInvite } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';

describe('sheetSerializer - Roundtrip conversions', () => {
  test('GroupConfig serialization and deserialization', () => {
    const config: GroupConfig = {
      appSignature: 'Spread-Spends',
      schemaVersion: '1.0.0',
      groupId: 'grp-test-123',
      groupName: 'Mountain Trip 2026',
      defaultCurrency: 'EUR',
      ownerEmail: 'owner@test.com',
      createdAt: '2026-06-01T12:00:00.000Z',
    };

    const rows = serializeGroupConfig(config);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0]).toEqual(['Key', 'Value']);

    const restored = deserializeGroupConfig(rows);
    expect(restored).toEqual(config);
  });

  test('GroupConfig serialization and deserialization with description', () => {
    const configWithDesc: GroupConfig = {
      appSignature: 'Spread-Spends',
      schemaVersion: '1.0.0',
      groupId: 'grp-test-456',
      groupName: 'Goa Trip 2026',
      description: 'Annual beach retreat and food exploration with friends.',
      defaultCurrency: 'INR',
      ownerEmail: 'owner@test.com',
      createdAt: '2026-06-01T12:00:00.000Z',
    };

    const rows = serializeGroupConfig(configWithDesc);
    const restored = deserializeGroupConfig(rows);
    expect(restored).toEqual(configWithDesc);
    expect(restored.description).toBe('Annual beach retreat and food exploration with friends.');
  });

  test('Members serialization and deserialization', () => {
    const members: Member[] = [
      {
        email: 'alice@test.com',
        name: 'Alice',
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        email: 'bob@test.com',
        name: 'Bob Jones',
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: 'alice@test.com',
        joinedAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    const rows = serializeMembers(members);
    const restored = deserializeMembers(rows);
    expect(restored).toEqual(members);
  });

  test('Expenses serialization and deserialization preserves JSON fields and amounts', () => {
    const expenses: Expense[] = [
      {
        id: 'exp-1',
        date: '2026-06-05',
        description: 'Groceries at Supermarket',
        category: 'groceries',
        amount: 85.5,
        currency: 'EUR',
        paidBy: { 'alice@test.com': 85.5 },
        splitType: 'EQUAL',
        splits: { 'alice@test.com': 42.75, 'bob@test.com': 42.75 },
        notes: 'Includes drinks',
        createdBy: 'alice@test.com',
        createdAt: '2026-06-05T18:00:00.000Z',
        status: 'ACTIVE',
      },
    ];

    const rows = serializeExpenses(expenses);
    const restored = deserializeExpenses(rows);
    expect(restored.length).toBe(1);
    expect(restored[0].id).toBe(expenses[0].id);
    expect(restored[0].amount).toBe(85.5);
    expect(restored[0].paidBy).toEqual(expenses[0].paidBy);
    expect(restored[0].splits).toEqual(expenses[0].splits);
    expect(restored[0].notes).toBe('Includes drinks');
  });

  test('Settlements roundtrip', () => {
    const settlements: Settlement[] = [
      {
        id: 'set-1',
        date: '2026-06-06',
        payerEmail: 'bob@test.com',
        payerName: 'Bob Jones',
        payeeEmail: 'alice@test.com',
        payeeName: 'Alice',
        amount: 42.75,
        currency: 'EUR',
        paymentMethod: 'UPI',
        notes: 'Paid via app',
        recordedBy: 'bob@test.com',
        createdAt: '2026-06-06T10:00:00.000Z',
        status: 'ACTIVE',
      },
    ];

    const rows = serializeSettlements(settlements);
    const restored = deserializeSettlements(rows);
    expect(restored).toEqual(settlements);
  });

  test('PendingInvites roundtrip', () => {
    const invites: PendingInvite[] = [
      {
        id: 'inv-1',
        invitedEmail: 'charlie@test.com',
        invitedByEmail: 'bob@test.com',
        invitedByName: 'Bob Jones',
        status: 'PENDING',
        requestedAt: '2026-06-07T09:00:00.000Z',
      },
    ];

    const rows = serializePendingInvites(invites);
    const restored = deserializePendingInvites(rows);
    expect(restored).toEqual(invites);
  });

  test('getMemberTabName sanitizes illegal characters for Google Sheets tabs', () => {
    expect(getMemberTabName('alice@example.com')).toBe('Exp_alice@example.com');
    expect(getMemberTabName('user[test]?name:dir/file\\sub*end@domain.com')).toBe(
      'Exp_user_test__name_dir_file_sub_end@domain.com'
    );
  });

  test('Expenses with history serialization and deserialization roundtrip', () => {
    const expensesWithHistory: Expense[] = [
      {
        id: 'exp-hist-1',
        date: '2026-06-05',
        description: 'Groceries at Supermarket',
        category: 'groceries',
        amount: 95.0,
        currency: 'EUR',
        paidBy: { 'alice@test.com': 95.0 },
        splitType: 'EQUAL',
        splits: { 'alice@test.com': 47.5, 'bob@test.com': 47.5 },
        createdBy: 'alice@test.com',
        createdAt: '2026-06-05T18:00:00.000Z',
        status: 'ACTIVE',
        history: [
          {
            id: 'hist-1',
            editedAt: '2026-06-06T10:00:00.000Z',
            editedBy: 'bob@test.com',
            editedByName: 'Bob Jones',
            summary: 'Updated Amount from €85.50 to €95.00',
            changes: [
              {
                field: 'amount',
                label: 'Amount',
                oldValue: '€85.50',
                newValue: '€95.00',
              },
            ],
          },
        ],
      },
    ];

    const rows = serializeExpenses(expensesWithHistory);
    const restored = deserializeExpenses(rows);
    expect(restored.length).toBe(1);
    expect(restored[0].history).toBeDefined();
    expect(restored[0].history?.length).toBe(1);
    expect(restored[0].history?.[0].summary).toBe('Updated Amount from €85.50 to €95.00');
    expect(restored[0].history?.[0].changes[0].field).toBe('amount');
  });

  test('generateAllExpensesFormula produces valid VSTACK formula', () => {
    expect(generateAllExpensesFormula([])).toBe('');
    expect(generateAllExpensesFormula(['alice@test.com'])).toBe(
      `=IFERROR(SORT('Exp_alice@test.com'!A2:N, 2, FALSE), "")`
    );
    expect(generateAllExpensesFormula(['alice@test.com', 'bob@test.com'])).toBe(
      `=IFERROR(SORT(VSTACK('Exp_alice@test.com'!A2:N, 'Exp_bob@test.com'!A2:N), 2, FALSE), "")`
    );
  });

  test('deserializeMultiTabExpenses aggregates across multiple member tabs and sorts chronologically', () => {
    const aliceExpense: Expense = {
      id: 'exp-alice-1',
      date: '2026-06-01',
      description: 'Breakfast',
      category: 'food',
      amount: 20,
      currency: 'USD',
      paidBy: { 'alice@test.com': 20 },
      splitType: 'EQUAL',
      splits: { 'alice@test.com': 10, 'bob@test.com': 10 },
      createdBy: 'alice@test.com',
      createdAt: '2026-06-01T08:00:00.000Z',
      status: 'ACTIVE',
    };

    const bobExpense: Expense = {
      id: 'exp-bob-1',
      date: '2026-06-01',
      description: 'Dinner',
      category: 'food',
      amount: 60,
      currency: 'USD',
      paidBy: { 'bob@test.com': 60 },
      splitType: 'EQUAL',
      splits: { 'alice@test.com': 30, 'bob@test.com': 30 },
      createdBy: 'bob@test.com',
      createdAt: '2026-06-01T20:00:00.000Z',
      status: 'ACTIVE',
    };

    const tabsData = [
      {
        tabName: 'Exp_alice@test.com',
        rows: serializeExpenses([aliceExpense]),
      },
      {
        tabName: 'Exp_bob@test.com',
        rows: serializeExpenses([bobExpense]),
      },
    ];

    const aggregated = deserializeMultiTabExpenses(tabsData);
    expect(aggregated.length).toBe(2);
    // Bob's dinner happened at 20:00, Alice's breakfast at 08:00 -> Bob's is first
    expect(aggregated[0].id).toBe('exp-bob-1');
    expect(aggregated[1].id).toBe('exp-alice-1');
  });

  test('parseSheetDate normalizes Google Sheets serial date numbers to YYYY-MM-DD', () => {
    // 46300 is 2026-10-05
    expect(parseSheetDate('46300')).toBe('2026-10-05');
    // 46296 is 2026-10-01
    expect(parseSheetDate('46296')).toBe('2026-10-01');
    // Standard ISO string is preserved
    expect(parseSheetDate('2026-10-05')).toBe('2026-10-05');
    // Empty or undefined
    expect(parseSheetDate('')).toBe('');
    expect(parseSheetDate(undefined)).toBe('');
  });

  test('deserializeExpenses converts serial date numbers from Google Sheets unformatted values', () => {
    const rawRows = [
      HEADERS.EXPENSES,
      [
        'exp-serial-1',
        '46300', // Serial date for 2026-10-05
        'Lunch',
        'food',
        '25.0',
        'USD',
        JSON.stringify({ 'alice@test.com': 25 }),
        'EQUAL',
        JSON.stringify({ 'alice@test.com': 25 }),
        '',
        'alice@test.com',
        '2026-10-05T12:00:00.000Z',
        'ACTIVE',
        '[]',
      ],
      [
        'exp-serial-2',
        '46296', // Serial date for 2026-10-01
        'Coffee',
        'food',
        '5.0',
        'USD',
        JSON.stringify({ 'bob@test.com': 5 }),
        'EQUAL',
        JSON.stringify({ 'bob@test.com': 5 }),
        '',
        'bob@test.com',
        '2026-10-01T09:00:00.000Z',
        'ACTIVE',
        '[]',
      ],
    ];

    const expenses = deserializeExpenses(rawRows);
    expect(expenses.length).toBe(2);
    expect(expenses[0].date).toBe('2026-10-05');
    expect(expenses[1].date).toBe('2026-10-01');
  });

  test('deserializeSettlements converts serial date numbers from Google Sheets unformatted values', () => {
    const rawRows = [
      HEADERS.SETTLEMENTS,
      [
        'set-serial-1',
        '46300', // Serial date for 2026-10-05
        'bob@test.com',
        'Bob',
        'alice@test.com',
        'Alice',
        '50',
        'USD',
        'UPI',
        '',
        'bob@test.com',
        '2026-10-05T15:00:00.000Z',
        'ACTIVE',
        '[]',
      ],
    ];

    const settlements = deserializeSettlements(rawRows);
    expect(settlements.length).toBe(1);
    expect(settlements[0].date).toBe('2026-10-05');
  });
});
