import { describe, test, expect, beforeEach } from 'bun:test';
import { groupService } from '../services/groupService';
import { mockGoogleService } from '../services/mockGoogleService';
import { calculateBalances } from '../core/debtSimplifier';
import workerHandler from '../../worker/src/index';
import type { Expense, Settlement } from '../types/transaction';

describe('Transaction Lifecycle (Delete & Sheet Sync)', () => {
  let sheetId: string;

  beforeEach(async () => {
    // Reset mock storage
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

describe('Cloudflare Worker Push Relay & KV Handlers', () => {
  // In-memory KV Mock for Worker unit tests
  function createMockKV() {
    const map = new Map<string, string>();
    return {
      get: async (k: string) => map.get(k) || null,
      put: async (k: string, v: string) => {
        map.set(k, v);
      },
      delete: async (k: string) => {
        map.delete(k);
      },
    };
  }

  test('worker health endpoint returns healthy state', async () => {
    const req = new Request('https://worker.dev/api/health', { method: 'GET' });
    const res = await workerHandler.fetch(req, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
  });

  test('worker registers device push subscriptions into KV store', async () => {
    const kv = createMockKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };

    const subscribeReq = new Request('https://worker.dev/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'bob@test.com',
        groupIds: ['group_101'],
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test_token_bob',
          keys: { p256dh: 'BNc_fake_p256', auth: 'fake_auth_token' },
        },
      }),
    });

    const res = await workerHandler.fetch(subscribeReq, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.registeredGroups).toBe(1);

    // Verify stored in KV
    const stored = await kv.get('group:group_101');
    expect(stored).not.toBeNull();
    const list = JSON.parse(stored!);
    expect(list.length).toBe(1);
    expect(list[0].userEmail).toBe('bob@test.com');
  });

  test('worker notify filters out actor and targets remaining group members', async () => {
    const kv = createMockKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };

    // Register Bob and Carol in group_101
    await kv.put(
      'group:group_101',
      JSON.stringify([
        {
          userEmail: 'alice@test.com',
          endpoint: 'https://fcm.googleapis.com/alice',
          keys: { p256dh: 'key_a', auth: 'auth_a' },
        },
        {
          userEmail: 'bob@test.com',
          endpoint: 'https://fcm.googleapis.com/bob',
          keys: { p256dh: 'key_b', auth: 'auth_b' },
        },
      ])
    );

    // Alice makes an edit and notifies
    const notifyReq = new Request('https://worker.dev/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: 'group_101',
        groupName: 'Dinner Club',
        actorEmail: 'alice@test.com',
        action: 'TRANSACTION_ADDED',
        summary: 'Alice added "Pizza" ($30.00)',
      }),
    });

    const res = await workerHandler.fetch(notifyReq, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Should target Bob (1 recipient), excluding Alice
    expect(data.recipientsTotal).toBe(1);
  });

  test('worker notify filters by senderEndpoint allowing same user multi-device notifications', async () => {
    const kv = createMockKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };

    // Alice has two devices registered: laptop and phone
    await kv.put(
      'group:group_multi',
      JSON.stringify([
        {
          userEmail: 'alice@test.com',
          endpoint: 'https://fcm.googleapis.com/alice_laptop',
          keys: { p256dh: 'key_laptop', auth: 'auth_laptop' },
        },
        {
          userEmail: 'alice@test.com',
          endpoint: 'https://fcm.googleapis.com/alice_phone',
          keys: { p256dh: 'key_phone', auth: 'auth_phone' },
        },
        {
          userEmail: 'bob@test.com',
          endpoint: 'https://fcm.googleapis.com/bob_tablet',
          keys: { p256dh: 'key_bob', auth: 'auth_bob' },
        },
      ])
    );

    // Alice makes an edit from her laptop
    const notifyReq = new Request('https://worker.dev/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: 'group_multi',
        actorEmail: 'alice@test.com',
        senderEndpoint: 'https://fcm.googleapis.com/alice_laptop',
        action: 'TRANSACTION_MODIFIED',
        summary: 'Alice modified "Snacks"',
      }),
    });

    const res = await workerHandler.fetch(notifyReq, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Alice's phone and Bob's tablet should both receive the notification (2 recipients)
    expect(data.recipientsTotal).toBe(2);
  });

  test('worker notify delivers to all devices when includeSender is true (test notifications)', async () => {
    const kv = createMockKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };

    await kv.put(
      'group:group_test',
      JSON.stringify([
        {
          userEmail: 'alice@test.com',
          endpoint: 'https://fcm.googleapis.com/alice_device',
          keys: { p256dh: 'key_alice', auth: 'auth_alice' },
        },
      ])
    );

    const testReq = new Request('https://worker.dev/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: 'group_test',
        actorEmail: 'alice@test.com',
        senderEndpoint: 'https://fcm.googleapis.com/alice_device',
        includeSender: true,
        action: 'TEST',
        title: 'Test Notification',
        summary: 'Testing push delivery',
      }),
    });

    const res = await workerHandler.fetch(testReq, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Even though senderEndpoint matches alice_device, includeSender preserves it
    expect(data.recipientsTotal).toBe(1);
  });
});
