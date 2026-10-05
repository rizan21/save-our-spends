import { describe, test, expect } from 'bun:test';
import {
  computeExpenseDiff,
  computeSettlementDiff,
  formatChangeSummary,
} from '../core/historyTracker';
import type { Expense, Settlement } from '../types/transaction';
import type { Member } from '../types/group';

describe('historyTracker - Diff and Audit Engine', () => {
  const members: Member[] = [
    {
      email: 'alice@test.com',
      name: 'Alice Dev',
      role: 'OWNER',
      status: 'ACTIVE',
      addedBy: 'self',
      joinedAt: '2026-01-01',
    },
    {
      email: 'bob@test.com',
      name: 'Bob Jones',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: 'alice@test.com',
      joinedAt: '2026-01-01',
    },
    {
      email: 'charlie@test.com',
      name: 'Charlie Smith',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: 'alice@test.com',
      joinedAt: '2026-01-01',
    },
  ];

  const baseExpense: Expense = {
    id: 'exp-1',
    date: '2026-09-20',
    description: 'Dinner at Beach',
    category: 'food',
    amount: 100,
    currency: 'USD',
    paidBy: { 'alice@test.com': 100 },
    splitType: 'EQUAL',
    splits: { 'alice@test.com': 50, 'bob@test.com': 50 },
    notes: 'Great food',
    createdBy: 'alice@test.com',
    createdAt: '2026-09-20T19:00:00Z',
    status: 'ACTIVE',
  };

  test('returns null when no fields changed', () => {
    const diff = computeExpenseDiff(
      baseExpense,
      { ...baseExpense },
      'alice@test.com',
      'Alice Dev',
      members
    );
    expect(diff).toBeNull();
  });

  test('detects amount change and generates correct summary', () => {
    const updated: Expense = {
      ...baseExpense,
      amount: 120,
      splits: { 'alice@test.com': 60, 'bob@test.com': 60 },
    };
    const diff = computeExpenseDiff(
      baseExpense,
      updated,
      'bob@test.com',
      'Bob Jones',
      members
    );

    expect(diff).not.toBeNull();
    expect(diff!.editedBy).toBe('bob@test.com');
    expect(diff!.editedByName).toBe('Bob Jones');
    expect(diff!.changes.some((c) => c.field === 'amount')).toBe(true);
    const amountChange = diff!.changes.find((c) => c.field === 'amount');
    expect(amountChange!.oldValue).toBe('$100.00');
    expect(amountChange!.newValue).toBe('$120.00');
  });

  test('detects multiple changes (description, category, notes, paidBy)', () => {
    const updated: Expense = {
      ...baseExpense,
      description: 'Dinner & Drinks at Beach Club',
      category: 'entertainment',
      notes: 'Added cocktail round',
      paidBy: { 'alice@test.com': 50, 'bob@test.com': 50 },
    };

    const diff = computeExpenseDiff(
      baseExpense,
      updated,
      'alice@test.com',
      'Alice Dev',
      members
    );

    expect(diff).not.toBeNull();
    expect(diff!.changes.length).toBe(4);
    expect(diff!.changes.map((c) => c.field)).toEqual([
      'description',
      'category',
      'notes',
      'paidBy',
    ]);
    expect(diff!.summary).toContain('Description');
    expect(diff!.summary).toContain('Category');
  });

  test('detects split changes when participant is added', () => {
    const updated: Expense = {
      ...baseExpense,
      splits: {
        'alice@test.com': 33.34,
        'bob@test.com': 33.33,
        'charlie@test.com': 33.33,
      },
    };

    const diff = computeExpenseDiff(
      baseExpense,
      updated,
      'alice@test.com',
      'Alice Dev',
      members
    );

    expect(diff).not.toBeNull();
    const splitChange = diff!.changes.find((c) => c.field === 'splits');
    expect(splitChange).toBeDefined();
    expect(splitChange!.oldValue).toContain('2 people');
    expect(splitChange!.newValue).toContain('3 people');
  });

  test('detects settlement diff (amount, method, notes)', () => {
    const baseSettlement: Settlement = {
      id: 'set-1',
      date: '2026-09-22',
      payerEmail: 'bob@test.com',
      payerName: 'Bob Jones',
      payeeEmail: 'alice@test.com',
      payeeName: 'Alice Dev',
      amount: 50,
      currency: 'USD',
      paymentMethod: 'Cash',
      notes: 'Initial settlement',
      recordedBy: 'bob@test.com',
      createdAt: '2026-09-22T10:00:00Z',
      status: 'ACTIVE',
    };

    const updatedSettlement: Settlement = {
      ...baseSettlement,
      amount: 60,
      paymentMethod: 'UPI',
      notes: 'Updated UPI transaction ref',
    };

    const diff = computeSettlementDiff(
      baseSettlement,
      updatedSettlement,
      'alice@test.com',
      'Alice Dev',
      members
    );

    expect(diff).not.toBeNull();
    expect(diff!.changes.length).toBe(3);
    expect(diff!.changes.map((c) => c.field)).toEqual([
      'amount',
      'paymentMethod',
      'notes',
    ]);
  });

  test('formatChangeSummary handles 1, 2, and 3+ changes cleanly', () => {
    expect(
      formatChangeSummary([
        { field: 'amount', label: 'Amount', oldValue: '$10', newValue: '$20' },
      ])
    ).toBe('Updated Amount from $10 to $20');

    expect(
      formatChangeSummary([
        { field: 'amount', label: 'Amount', oldValue: '$10', newValue: '$20' },
        { field: 'category', label: 'Category', oldValue: 'food', newValue: 'groceries' },
      ])
    ).toBe('Updated Amount and Category');

    expect(
      formatChangeSummary([
        { field: 'amount', label: 'Amount', oldValue: '$10', newValue: '$20' },
        { field: 'category', label: 'Category', oldValue: 'food', newValue: 'groceries' },
        { field: 'date', label: 'Date', oldValue: '2026-01-01', newValue: '2026-01-02' },
      ])
    ).toBe('Updated Amount, Category, and Date');
  });

  test('detects time changes in expense and settlement', async () => {
    const { combineDateAndTime } = await import('../core/dateTime');

    // Expense time change
    const originalExpense: Expense = {
      ...baseExpense,
      createdAt: combineDateAndTime('2026-09-20', '14:00:00'),
    };
    const updatedExpense: Expense = {
      ...originalExpense,
      createdAt: combineDateAndTime('2026-09-20', '19:30:00'),
    };
    const expDiff = computeExpenseDiff(originalExpense, updatedExpense, 'alice@test.com', 'Alice Dev', members);
    expect(expDiff).not.toBeNull();
    const expTimeChange = expDiff!.changes.find((c) => c.field === 'time');
    expect(expTimeChange).toBeDefined();
    expect(expTimeChange!.oldValue).toBe('14:00:00');
    expect(expTimeChange!.newValue).toBe('19:30:00');

    // Settlement time change
    const originalSettlement: Settlement = {
      id: 'set-99',
      date: '2026-09-22',
      payerEmail: 'bob@test.com',
      payerName: 'Bob Jones',
      payeeEmail: 'alice@test.com',
      payeeName: 'Alice Dev',
      amount: 50,
      currency: 'USD',
      paymentMethod: 'Cash',
      recordedBy: 'bob@test.com',
      createdAt: combineDateAndTime('2026-09-22', '09:15:00'),
      status: 'ACTIVE',
    };
    const updatedSettlement: Settlement = {
      ...originalSettlement,
      createdAt: combineDateAndTime('2026-09-22', '11:45:00'),
    };
    const setDiff = computeSettlementDiff(originalSettlement, updatedSettlement, 'alice@test.com', 'Alice Dev', members);
    expect(setDiff).not.toBeNull();
    const setTimeChange = setDiff!.changes.find((c) => c.field === 'time');
    expect(setTimeChange).toBeDefined();
    expect(setTimeChange!.oldValue).toBe('09:15:00');
    expect(setTimeChange!.newValue).toBe('11:45:00');
  });
});
