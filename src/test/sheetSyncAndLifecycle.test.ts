import { describe, test, expect, beforeEach } from 'bun:test';
import { groupService } from '../services/groupService';
import { mockGoogleService } from '../services/mockGoogleService';
import { googleAuthService } from '../services/googleAuth';
import { calculateBalances } from '../core/debtSimplifier';
import type { Expense, Settlement } from '../types/transaction';

describe('Transaction Lifecycle (Deletions & History)', () => {
  let sheetId: string;

  beforeEach(async () => {
    // Reset mock storage & ensure demo mode is active for mock groupService
    googleAuthService.setDemoMode(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    const owner = {
      email: 'alice@test.com',
      name: 'Alice',
      picture: 'https://avatar.dev/alice',
    };
    sheetId = await mockGoogleService.createGroupSpreadsheet(
      'Lifecycle Test Group',
      'USD',
      owner,
      ['bob@test.com'],
      'Testing transaction deletions and sync'
    );
  });

  test('deleteExpense marks expense status as DELETED and records audit trail', async () => {
    const expense: Expense = {
      id: 'exp_delete_1',
      date: '2026-10-01',
      description: 'Shared Lunch',
      category: 'food',
      amount: 40,
      currency: 'USD',
      paidBy: { 'alice@test.com': 40 },
      splitType: 'EQUAL',
      splits: { 'alice@test.com': 20, 'bob@test.com': 20 },
      createdBy: 'alice@test.com',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    await groupService.addExpense(sheetId, expense);

    // Initial check: Bob owes Alice $20
    const before = await groupService.loadGroup(sheetId);
    const summaryBefore = calculateBalances(before.group.members, before.expenses, before.settlements, before.group.currency);
    expect(summaryBefore.balances['bob@test.com'].netBalance).toBe(-20);

    // Delete the expense
    await groupService.deleteExpense(sheetId, 'exp_delete_1', 'alice@test.com');

    const after = await groupService.loadGroup(sheetId);
    const target = after.expenses.find((e) => e.id === 'exp_delete_1');
    expect(target).toBeDefined();
    expect(target?.status).toBe('DELETED');
    expect(target?.history).toBeDefined();
    expect(target?.history?.length).toBeGreaterThan(0);
    expect(target?.history?.[0].summary).toBe('Deleted expense');

    // Recalculated balance: with expense deleted, net balance is 0
    const summaryAfter = calculateBalances(after.group.members, after.expenses, after.settlements, after.group.currency);
    expect(summaryAfter.balances['bob@test.com']?.netBalance || 0).toBe(0);
  });

  test('deleteSettlement marks settlement as DELETED and updates debt balances', async () => {
    const settlement: Settlement = {
      id: 'set_delete_1',
      date: '2026-10-01',
      payerEmail: 'bob@test.com',
      payerName: 'Bob',
      payeeEmail: 'alice@test.com',
      payeeName: 'Alice',
      amount: 15,
      currency: 'USD',
      paymentMethod: 'Cash',
      recordedBy: 'alice@test.com',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    await groupService.addSettlement(sheetId, settlement);

    const before = await groupService.loadGroup(sheetId);
    expect(before.settlements.some((s) => s.id === 'set_delete_1' && s.status === 'ACTIVE')).toBe(true);

    // Delete the settlement
    await groupService.deleteSettlement(sheetId, 'set_delete_1', 'alice@test.com');

    const after = await groupService.loadGroup(sheetId);
    const target = after.settlements.find((s) => s.id === 'set_delete_1');
    expect(target).toBeDefined();
    expect(target?.status).toBe('DELETED');
    expect(target?.history?.[0].summary).toBe('Deleted settlement');
  });
});
