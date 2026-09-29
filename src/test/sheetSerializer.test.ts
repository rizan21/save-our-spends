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
    expect(getMemberTabName('alice@gmail.com')).toBe('Exp_alice@gmail.com');
    expect(getMemberTabName('user[test]?name:dir/file\\sub*end@domain.com')).toBe(
      'Exp_user_test__name_dir_file_sub_end@domain.com'
    );
  });

  test('generateAllExpensesFormula produces valid VSTACK formula', () => {
    expect(generateAllExpensesFormula([])).toBe('');
    expect(generateAllExpensesFormula(['alice@test.com'])).toBe(
      `=IFERROR(SORT('Exp_alice@test.com'!A2:M, 2, FALSE), "")`
    );
    expect(generateAllExpensesFormula(['alice@test.com', 'bob@test.com'])).toBe(
      `=IFERROR(SORT(VSTACK('Exp_alice@test.com'!A2:M, 'Exp_bob@test.com'!A2:M), 2, FALSE), "")`
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
});
