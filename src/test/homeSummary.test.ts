import { describe, test, expect, beforeEach } from 'bun:test';
import { groupService } from '../services/groupService';
import { googleAuthService } from '../services/googleAuth';
import { mockGoogleService } from '../services/mockGoogleService';
import { calculateBalances } from '../core/debtSimplifier';
import type { SimplifiedDebt } from '../types/balance';

describe('Home Page Active Settlements & Balances aggregation', () => {
  beforeEach(() => {
    googleAuthService.setDemoMode(true);
    mockGoogleService.resetMockData();
  });

  test('Goa Vacation 2026 active settlements correctly compute for Alice (demo owner)', async () => {
    const userEmail = 'alice.dev@gmail.com';
    const groups = await groupService.listGroups(userEmail);
    expect(groups.length).toBeGreaterThanOrEqual(1);

    const data = await groupService.loadGroup(groups[0].id);
    const summary = calculateBalances(
      data.group.members,
      data.expenses,
      data.settlements,
      data.group.currency
    );

    // Filter active settlements involving Alice
    const activeForAlice: SimplifiedDebt[] = summary.simplifiedDebts.filter(
      (d) => d.fromEmail === userEmail || d.toEmail === userEmail
    );

    // In Goa Vacation 2026:
    // Bob owes Alice 1,300 and Charlie owes Alice 4,800
    expect(activeForAlice.length).toBe(2);
    expect(activeForAlice.every((d) => d.toEmail === userEmail)).toBe(true);

    const bobDebt = activeForAlice.find((d) => d.fromEmail === 'bob.traveler@gmail.com');
    const charlieDebt = activeForAlice.find((d) => d.fromEmail === 'charlie.foodie@gmail.com');

    expect(bobDebt).toBeDefined();
    expect(bobDebt?.amount).toBe(1300);

    expect(charlieDebt).toBeDefined();
    expect(charlieDebt?.amount).toBe(4800);

    // Total Alice is owed: 1,300 + 4,800 = 6,100
    const totalAliceOwed = activeForAlice.reduce((acc, d) => acc + d.amount, 0);
    expect(totalAliceOwed).toBe(6100);
  });

  test('settling an active debt reduces active settlements on the home page', async () => {
    const userEmail = 'alice.dev@gmail.com';
    const groups = await groupService.listGroups(userEmail);
    const groupId = groups[0].id;

    // Bob settles up 1,300 with Alice
    await groupService.addSettlement(groupId, {
      id: 'set-bob-full-settle',
      date: '2026-09-27',
      payerEmail: 'bob.traveler@gmail.com',
      payerName: 'Bob Traveler',
      payeeEmail: userEmail,
      payeeName: 'Alice Dev (Owner)',
      amount: 1300,
      currency: 'INR',
      paymentMethod: 'UPI',
      recordedBy: 'bob.traveler@gmail.com',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    const data = await groupService.loadGroup(groupId);
    const summary = calculateBalances(
      data.group.members,
      data.expenses,
      data.settlements,
      data.group.currency
    );

    const activeForAlice = summary.simplifiedDebts.filter(
      (d) => d.fromEmail === userEmail || d.toEmail === userEmail
    );

    // Now only Charlie owes Alice (4,800); Bob is completely settled up!
    expect(activeForAlice.length).toBe(1);
    expect(activeForAlice[0].fromEmail).toBe('charlie.foodie@gmail.com');
    expect(activeForAlice[0].amount).toBe(4800);

    // Bob's balance in the group is now exactly 0
    expect(summary.balances['bob.traveler@gmail.com'].netBalance).toBe(0);
  });

  test('Member spending and consumption sums conserve total group spending', async () => {
    const userEmail = 'alice.dev@gmail.com';
    const groups = await groupService.listGroups(userEmail);
    const data = await groupService.loadGroup(groups[0].id);

    const activeExpenses = data.expenses.filter((e) => e.status === 'ACTIVE');
    const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalPaid = activeExpenses.reduce((sum, e) => {
      const expPaid = Object.values(e.paidBy || {}).reduce((s, a) => s + a, 0);
      return sum + expPaid;
    }, 0);

    const totalConsumed = activeExpenses.reduce((sum, e) => {
      const expConsumed = Object.values(e.splits || {}).reduce((s, a) => s + a, 0);
      return sum + expConsumed;
    }, 0);

    expect(totalPaid).toBe(totalExpenses);
    expect(totalConsumed).toBe(totalExpenses);
    expect(totalPaid).toBe(totalConsumed);
  });
});
