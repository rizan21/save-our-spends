import { describe, test, expect } from 'bun:test';
import { calculateBalances, simplifyDebts } from '../core/debtSimplifier';
import type { Member } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';

describe('debtSimplifier - Balances & Greedy Min Cash Flow', () => {
  const members: Member[] = [
    { email: 'alice@test.com', name: 'Alice', role: 'OWNER', status: 'ACTIVE', addedBy: 'self', joinedAt: '2026-01-01' },
    { email: 'bob@test.com', name: 'Bob', role: 'MEMBER', status: 'ACTIVE', addedBy: 'alice@test.com', joinedAt: '2026-01-01' },
    { email: 'charlie@test.com', name: 'Charlie', role: 'MEMBER', status: 'ACTIVE', addedBy: 'alice@test.com', joinedAt: '2026-01-01' },
  ];

  test('simple two-person expense', () => {
    // Alice paid $60 for Alice and Bob ($30 each)
    const expenses: Expense[] = [
      {
        id: '1',
        date: '2026-01-01',
        description: 'Dinner',
        category: 'food',
        amount: 60,
        currency: 'USD',
        paidBy: { 'alice@test.com': 60 },
        splitType: 'EQUAL',
        splits: { 'alice@test.com': 30, 'bob@test.com': 30 },
        createdBy: 'alice@test.com',
        createdAt: '2026-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    const summary = calculateBalances(members, expenses, []);
    expect(summary.totalSpending).toBe(60);
    expect(summary.balances['alice@test.com'].netBalance).toBe(30); // Alice is owed $30
    expect(summary.balances['bob@test.com'].netBalance).toBe(-30); // Bob owes $30
    expect(summary.balances['charlie@test.com'].netBalance).toBe(0);

    // Simplified debt: Bob pays Alice $30
    expect(summary.simplifiedDebts.length).toBe(1);
    expect(summary.simplifiedDebts[0].fromEmail).toBe('bob@test.com');
    expect(summary.simplifiedDebts[0].toEmail).toBe('alice@test.com');
    expect(summary.simplifiedDebts[0].amount).toBe(30);
  });

  test('circular debt resolves to zero', () => {
    // Alice pays $30 for Bob (Bob owes Alice 30)
    // Bob pays $30 for Charlie (Charlie owes Bob 30)
    // Charlie pays $30 for Alice (Alice owes Charlie 30)
    // Everyone net balance = 0, no transactions needed!
    const expenses: Expense[] = [
      {
        id: '1',
        date: '2026-01-01',
        description: 'Exp 1',
        category: 'food',
        amount: 30,
        currency: 'USD',
        paidBy: { 'alice@test.com': 30 },
        splitType: 'EXACT',
        splits: { 'bob@test.com': 30 },
        createdBy: 'alice@test.com',
        createdAt: '2026-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
      {
        id: '2',
        date: '2026-01-02',
        description: 'Exp 2',
        category: 'food',
        amount: 30,
        currency: 'USD',
        paidBy: { 'bob@test.com': 30 },
        splitType: 'EXACT',
        splits: { 'charlie@test.com': 30 },
        createdBy: 'bob@test.com',
        createdAt: '2026-01-02T00:00:00Z',
        status: 'ACTIVE',
      },
      {
        id: '3',
        date: '2026-01-03',
        description: 'Exp 3',
        category: 'food',
        amount: 30,
        currency: 'USD',
        paidBy: { 'charlie@test.com': 30 },
        splitType: 'EXACT',
        splits: { 'alice@test.com': 30 },
        createdBy: 'charlie@test.com',
        createdAt: '2026-01-03T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    const summary = calculateBalances(members, expenses, []);
    expect(summary.balances['alice@test.com'].netBalance).toBe(0);
    expect(summary.balances['bob@test.com'].netBalance).toBe(0);
    expect(summary.balances['charlie@test.com'].netBalance).toBe(0);
    expect(summary.simplifiedDebts.length).toBe(0);
  });

  test('settlement accurately reduces outstanding debt', () => {
    // Alice paid $100 for Bob
    const expenses: Expense[] = [
      {
        id: '1',
        date: '2026-01-01',
        description: 'Hotel',
        category: 'lodging',
        amount: 100,
        currency: 'USD',
        paidBy: { 'alice@test.com': 100 },
        splitType: 'EXACT',
        splits: { 'bob@test.com': 100 },
        createdBy: 'alice@test.com',
        createdAt: '2026-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    // Bob settles $60 to Alice
    const settlements: Settlement[] = [
      {
        id: 's1',
        date: '2026-01-02',
        payerEmail: 'bob@test.com',
        payerName: 'Bob',
        payeeEmail: 'alice@test.com',
        payeeName: 'Alice',
        amount: 60,
        currency: 'USD',
        paymentMethod: 'Cash',
        recordedBy: 'bob@test.com',
        createdAt: '2026-01-02T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    const summary = calculateBalances(members, expenses, settlements);
    expect(summary.balances['alice@test.com'].netBalance).toBe(40); // Alice still owed $40
    expect(summary.balances['bob@test.com'].netBalance).toBe(-40); // Bob still owes $40

    expect(summary.simplifiedDebts.length).toBe(1);
    expect(summary.simplifiedDebts[0].amount).toBe(40);
  });

  test('multi-party balance conservation invariant: sum of net balances is zero', () => {
    const balances = {
      'p1@test.com': { email: 'p1@test.com', name: 'P1', totalPaid: 150, totalOwed: 50, netBalance: 100 },
      'p2@test.com': { email: 'p2@test.com', name: 'P2', totalPaid: 0, totalOwed: 60, netBalance: -60 },
      'p3@test.com': { email: 'p3@test.com', name: 'P3', totalPaid: 20, totalOwed: 60, netBalance: -40 },
    };

    const debts = simplifyDebts(balances, 'USD');
    // Total debts should equal total negative balance (60 + 40 = 100)
    const totalSettled = debts.reduce((sum, d) => sum + d.amount, 0);
    expect(totalSettled).toBe(100);
    expect(debts.length).toBe(2); // P2 pays P1 60, P3 pays P1 40
  });

  test('calculateBalances dynamically adopts currency from active transactions', () => {
    const expenses: Expense[] = [
      {
        id: 'exp-inr',
        date: '2026-09-21',
        description: 'Goa Villa',
        category: 'lodging',
        amount: 15000,
        currency: 'INR',
        paidBy: { 'alice@test.com': 15000 },
        splitType: 'EQUAL',
        splits: { 'alice@test.com': 5000, 'bob@test.com': 5000, 'charlie@test.com': 5000 },
        createdBy: 'alice@test.com',
        createdAt: '2026-09-21T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    // Default currency passed as 'USD', but transaction is 'INR'
    const summary = calculateBalances(members, expenses, [], 'USD');
    expect(summary.totalSpending).toBe(15000);
    expect(summary.currency).toBe('INR');
    expect(summary.simplifiedDebts[0].currency).toBe('INR');
  });

  test('calculateBalances creates dynamic balance entries for external or unlisted members', () => {
    // Expense paid by external@test.com and split with guest@test.com (neither in members)
    const expenses: Expense[] = [
      {
        id: 'exp-external',
        date: '2026-09-22',
        description: 'Airport Taxi',
        category: 'transport',
        amount: 80,
        currency: 'USD',
        paidBy: { 'external@test.com': 80 },
        splitType: 'EQUAL',
        splits: { 'guest@test.com': 80 },
        createdBy: 'external@test.com',
        createdAt: '2026-09-22T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    // Settlement between external payer and payee
    const settlements: Settlement[] = [
      {
        id: 'set-external',
        date: '2026-09-23',
        payerEmail: 'guest@test.com',
        payerName: 'Guest User',
        payeeEmail: 'external@test.com',
        payeeName: 'External User',
        amount: 30,
        currency: 'USD',
        paymentMethod: 'Cash',
        recordedBy: 'guest@test.com',
        createdAt: '2026-09-23T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    const summary = calculateBalances(members, expenses, settlements, 'USD');
    expect(summary.balances['external@test.com']).toBeDefined();
    expect(summary.balances['guest@test.com']).toBeDefined();

    // external@test.com: paid 80 exp, received 30 set -> totalPaid 80, totalOwed 30, netBalance 50
    expect(summary.balances['external@test.com'].netBalance).toBe(50);
    // guest@test.com: paid 30 set, owed 80 exp -> totalPaid 30, totalOwed 80, netBalance -50
    expect(summary.balances['guest@test.com'].netBalance).toBe(-50);

    expect(summary.simplifiedDebts.length).toBe(1);
    expect(summary.simplifiedDebts[0].fromEmail).toBe('guest@test.com');
    expect(summary.simplifiedDebts[0].toEmail).toBe('external@test.com');
    expect(summary.simplifiedDebts[0].amount).toBe(50);
  });
});
