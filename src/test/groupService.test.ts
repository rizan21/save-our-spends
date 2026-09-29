import { describe, test, expect, beforeEach } from 'bun:test';
import { groupService } from '../services/groupService';
import { googleAuthService } from '../services/googleAuth';
import { mockGoogleService } from '../services/mockGoogleService';
import { calculateBalances } from '../core/debtSimplifier';

describe('groupService - Unified Facade Lifecycle', () => {
  beforeEach(() => {
    googleAuthService.setDemoMode(true);
    mockGoogleService.resetMockData();
  });

  test('listGroups returns mock groups in demo mode', async () => {
    const groups = await groupService.listGroups('alice.dev@gmail.com');
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups[0].name).toContain('Goa Vacation 2026');
  });

  test('createGroup creates and initializes a complete spreadsheet group', async () => {
    const groupId = await groupService.createGroup('Paris Trip', 'EUR', ['friend@gmail.com']);
    expect(groupId).toBeDefined();

    const data = await groupService.loadGroup(groupId);
    expect(data.group.name).toBe('Paris Trip');
    expect(data.group.currency).toBe('EUR');
    expect(data.group.members.length).toBe(2);
  });

  test('addExpense updates group transactions and recalculates balances', async () => {
    const groups = await groupService.listGroups('alice.dev@gmail.com');
    const groupId = groups[0].id;

    await groupService.addExpense(groupId, {
      id: 'exp-test-01',
      date: '2026-09-25',
      description: 'Sunset Cruise',
      category: 'entertainment',
      amount: 3000,
      currency: 'INR',
      paidBy: { 'alice.dev@gmail.com': 3000 },
      splitType: 'EQUAL',
      splits: {
        'alice.dev@gmail.com': 1000,
        'bob.traveler@gmail.com': 1000,
        'charlie.foodie@gmail.com': 1000,
      },
      createdBy: 'alice.dev@gmail.com',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    const data = await groupService.loadGroup(groupId);
    expect(data.expenses.some((e) => e.id === 'exp-test-01')).toBe(true);

    const summary = calculateBalances(data.group.members, data.expenses, data.settlements, data.group.currency);
    expect(summary.totalSpending).toBeGreaterThan(3000);
    expect(summary.balances['alice.dev@gmail.com'].totalPaid).toBeGreaterThan(3000);
  });

  test('extensible invite lifecycle via groupService', async () => {
    const groups = await groupService.listGroups('alice.dev@gmail.com');
    const groupId = groups[0].id;

    // Bob proposes inviting Zara
    await groupService.proposeInvite(groupId, {
      id: 'inv-zara-01',
      invitedEmail: 'zara.designer@gmail.com',
      invitedByEmail: 'bob.traveler@gmail.com',
      invitedByName: 'Bob Traveler',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    });

    let data = await groupService.loadGroup(groupId);
    expect(data.group.pendingInvites.some((i) => i.id === 'inv-zara-01')).toBe(true);

    // Alice (the owner) approves Zara's invite
    await groupService.approveInvite(groupId, 'inv-zara-01', 'alice.dev@gmail.com');

    data = await groupService.loadGroup(groupId);
    const approvedInvite = data.group.pendingInvites.find((i) => i.id === 'inv-zara-01');
    expect(approvedInvite?.status).toBe('APPROVED');
    expect(data.group.members.some((m) => m.email === 'zara.designer@gmail.com')).toBe(true);

    // Zara logs an expense into her newly provisioned personal tab
    await groupService.addExpense(groupId, {
      id: 'exp-zara-01',
      date: '2026-09-29',
      description: 'Art Gallery Tickets',
      category: 'entertainment',
      amount: 1200,
      currency: 'INR',
      paidBy: { 'zara.designer@gmail.com': 1200 },
      splitType: 'EQUAL',
      splits: {
        'alice.dev@gmail.com': 300,
        'bob.traveler@gmail.com': 300,
        'charlie.foodie@gmail.com': 300,
        'zara.designer@gmail.com': 300,
      },
      createdBy: 'zara.designer@gmail.com',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    data = await groupService.loadGroup(groupId);
    expect(data.expenses.some((e) => e.id === 'exp-zara-01')).toBe(true);
  });

  test('multi-member concurrent writes are isolated with zero collision', async () => {
    const groups = await groupService.listGroups('alice.dev@gmail.com');
    const groupId = groups[0].id;

    // Simulate Alice and Bob adding expenses concurrently
    const writeAlice = groupService.addExpense(groupId, {
      id: 'exp-concurrent-alice',
      date: '2026-09-26',
      description: 'Alice Scuba Diving',
      category: 'entertainment',
      amount: 4000,
      currency: 'INR',
      paidBy: { 'alice.dev@gmail.com': 4000 },
      splitType: 'EQUAL',
      splits: { 'alice.dev@gmail.com': 2000, 'bob.traveler@gmail.com': 2000 },
      createdBy: 'alice.dev@gmail.com',
      createdAt: '2026-09-26T14:00:00.000Z',
      status: 'ACTIVE',
    });

    const writeBob = groupService.addExpense(groupId, {
      id: 'exp-concurrent-bob',
      date: '2026-09-26',
      description: 'Bob Seafood Dinner',
      category: 'food',
      amount: 2500,
      currency: 'INR',
      paidBy: { 'bob.traveler@gmail.com': 2500 },
      splitType: 'EQUAL',
      splits: { 'alice.dev@gmail.com': 1250, 'bob.traveler@gmail.com': 1250 },
      createdBy: 'bob.traveler@gmail.com',
      createdAt: '2026-09-26T14:00:01.000Z',
      status: 'ACTIVE',
    });

    // Execute concurrently
    await Promise.all([writeAlice, writeBob]);

    const data = await groupService.loadGroup(groupId);
    expect(data.expenses.some((e) => e.id === 'exp-concurrent-alice')).toBe(true);
    expect(data.expenses.some((e) => e.id === 'exp-concurrent-bob')).toBe(true);

    const summary = calculateBalances(data.group.members, data.expenses, data.settlements, data.group.currency);
    expect(summary.totalSpending).toBeGreaterThan(6500);
  });

  test('OAuth scopes use least-privilege drive.file scope and exclude restricted scopes', async () => {
    const { OAUTH_SCOPES } = await import('../services/googleAuth');
    expect(OAUTH_SCOPES).toContain('https://www.googleapis.com/auth/drive.file');
    expect(OAUTH_SCOPES).not.toContain('https://www.googleapis.com/auth/spreadsheets');
    expect(OAUTH_SCOPES).not.toContain('https://www.googleapis.com/auth/drive ');
  });

  test('createGroup with description initializes and loads description', async () => {
    const groupId = await groupService.createGroup(
      'Tokyo Trip',
      'JPY',
      ['friend@gmail.com'],
      'Exploring Tokyo sushi places, Akihabara, and shrines.'
    );
    const data = await groupService.loadGroup(groupId);
    expect(data.group.description).toBe('Exploring Tokyo sushi places, Akihabara, and shrines.');
  });

  test('updateGroupDescription updates group description and persists', async () => {
    const groups = await groupService.listGroups('alice.dev@gmail.com');
    const groupId = groups[0].id;

    await groupService.updateGroupDescription(groupId, 'Updated Goa trip notes with beach club reservations.');
    const data = await groupService.loadGroup(groupId);
    expect(data.group.description).toBe('Updated Goa trip notes with beach club reservations.');
  });
});
