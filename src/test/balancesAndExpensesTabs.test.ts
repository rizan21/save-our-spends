import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BalancesSummary } from '../pages/group/balances/BalancesSummary';
import { TransactionList } from '../pages/group/expenses/TransactionList';
import type { GroupFinancialSummary, SimplifiedDebt } from '../types/balance';
import type { Member } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';

describe('Balances and Expenses Tab UI Refactoring', () => {
  const members: Member[] = [
    {
      email: 'alice@test.com',
      name: 'Alice',
      role: 'OWNER',
      status: 'ACTIVE',
      addedBy: 'self',
      joinedAt: '2026-01-01',
    },
    {
      email: 'bob@test.com',
      name: 'Bob',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: 'alice@test.com',
      joinedAt: '2026-01-01',
    },
    {
      email: 'charlie@test.com',
      name: 'Charlie',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: 'alice@test.com',
      joinedAt: '2026-01-01',
    },
  ];

  const simplifiedDebts: SimplifiedDebt[] = [
    {
      fromEmail: 'bob@test.com',
      fromName: 'Bob',
      toEmail: 'alice@test.com',
      toName: 'Alice',
      amount: 50,
      currency: 'USD',
    },
    {
      fromEmail: 'charlie@test.com',
      fromName: 'Charlie',
      toEmail: 'bob@test.com',
      toName: 'Bob',
      amount: 25,
      currency: 'USD',
    },
  ];

  const mockFinancialSummary: GroupFinancialSummary = {
    totalSpending: 150,
    currency: 'USD',
    balances: {
      'alice@test.com': {
        email: 'alice@test.com',
        name: 'Alice',
        totalPaid: 100,
        totalOwed: 50,
        netBalance: 50,
      },
      'bob@test.com': {
        email: 'bob@test.com',
        name: 'Bob',
        totalPaid: 50,
        totalOwed: 75,
        netBalance: -25,
      },
      'charlie@test.com': {
        email: 'charlie@test.com',
        name: 'Charlie',
        totalPaid: 0,
        totalOwed: 25,
        netBalance: -25,
      },
    },
    simplifiedDebts,
  };

  test('TransactionList does not display active settlements widget', () => {
    const expenses: Expense[] = [
      {
        id: 'exp-1',
        date: '2026-10-01',
        description: 'Groceries',
        amount: 50,
        currency: 'USD',
        category: 'groceries',
        paidBy: { 'alice@test.com': 50 },
        splitType: 'EQUAL',
        splits: { 'alice@test.com': 25, 'bob@test.com': 25 },
        createdBy: 'alice@test.com',
        createdAt: '2026-10-01T12:00:00Z',
        status: 'ACTIVE',
      },
    ];
    const settlements: Settlement[] = [];

    const html = renderToStaticMarkup(
      React.createElement(TransactionList, {
        expenses,
        settlements,
        currentUserEmail: 'alice@test.com',
        currency: 'USD',
        members,
        simplifiedDebts,
        onOpenAddExpense: () => {},
      })
    );

    // Verify it renders the feed without active settlements header
    expect(html).toContain('Groceries');
    expect(html).not.toContain('Active Settlements');
  });

  test('BalancesSummary renders all member balances inline without popup modal or paid/share values', () => {
    const cardHtml = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: mockFinancialSummary,
        currentUserEmail: 'alice@test.com',
        members,
        currency: 'USD',
      })
    );

    // Card contains Member Balances title and all members inline
    expect(cardHtml).toContain('Member Balances');
    expect(cardHtml).not.toContain('role="dialog"');
    expect(cardHtml).not.toContain('lucide-chevron-right');

    // Shows all members with net positions
    expect(cardHtml).toContain('Alice');
    expect(cardHtml).toContain('(You)');
    expect(cardHtml).toContain('+$50.00');
    expect(cardHtml).toContain('Bob');
    expect(cardHtml).toContain('-$25.00');
    expect(cardHtml).toContain('Charlie');

    // No paid/share values or redundant labels
    expect(cardHtml).not.toContain('Paid $');
    expect(cardHtml).not.toContain('Share $');
    expect(cardHtml).not.toContain('Total Spent');
    expect(cardHtml).not.toContain('You get back');
    expect(cardHtml).not.toContain('You owe');
  });

  test('BalancesSummary correctly displays when user owes money', () => {
    // Bob owes money (-$25 net)
    const html = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: mockFinancialSummary,
        currentUserEmail: 'bob@test.com',
        members,
        currency: 'USD',
      })
    );

    expect(html).toContain('Member Balances');
    expect(html).toContain('(You)');
    expect(html).toContain('-$25.00');
  });

  test('BalancesSummary displays settled when balance is zero', () => {
    const settledSummary: GroupFinancialSummary = {
      totalSpending: 0,
      currency: 'USD',
      balances: {
        'alice@test.com': {
          email: 'alice@test.com',
          name: 'Alice',
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
        },
      },
      simplifiedDebts: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: settledSummary,
        currentUserEmail: 'alice@test.com',
        members,
        currency: 'USD',
      })
    );

    expect(html).toContain('Member Balances');
    expect(html).toContain('Settled');
  });
});
