import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BalancesSummary } from '../components/settlements/BalancesSummary';
import { TransactionList } from '../components/transactions/TransactionList';
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

  test('BalancesSummary card points arrow right, removes hints, removes paid/share values, and opens clean popup without balance summary or total group spendings or all members label', () => {
    // 1. Initial closed card state
    const cardHtml = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: mockFinancialSummary,
        currentUserEmail: 'alice@test.com',
        members,
        currency: 'USD',
        isModalOpen: false,
      })
    );

    // Card contains Member Balances title and right chevron
    expect(cardHtml).toContain('Member Balances');
    expect(cardHtml).toContain('lucide-chevron-right');

    // Shows user's balance and net status
    expect(cardHtml).toContain('(You)');
    expect(cardHtml).toContain('You get back');
    expect(cardHtml).toContain('+$50.00');

    // No text hints like (tap to see all) or (click title or tap ...)
    expect(cardHtml).not.toContain('tap to see all');
    expect(cardHtml).not.toContain('Click title or tap');

    // No paid/share values under user names
    expect(cardHtml).not.toContain('Paid $');
    expect(cardHtml).not.toContain('Share $');

    // No total spent on the member balances card
    expect(cardHtml).not.toContain('Total Spent');

    // 2. Opened modal state: clean member balances popup
    const modalHtml = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: mockFinancialSummary,
        currentUserEmail: 'alice@test.com',
        members,
        currency: 'USD',
        isModalOpen: true,
      })
    );

    // Modal is rendered with dialog semantics
    expect(modalHtml).toContain('role="dialog"');
    expect(modalHtml).toContain('Member Balances');

    // Removed: cross button from header
    expect(modalHtml).not.toContain('aria-label="Close modal"');
    expect(modalHtml).not.toContain('lucide-x');
    // Removed: balance summary banner
    expect(modalHtml).not.toContain('Your Balance Summary');
    // Removed: total group spendings in popup
    expect(modalHtml).not.toContain('Total Group Spending');
    // Removed: all members label
    expect(modalHtml).not.toContain('All Members');

    // Shows member list with net positions
    expect(modalHtml).toContain('Alice');
    expect(modalHtml).toContain('(You)');
    expect(modalHtml).toContain('+$50.00');
    expect(modalHtml).toContain('You get back');
    expect(modalHtml).toContain('Bob');
    expect(modalHtml).toContain('-$25.00');
    expect(modalHtml).toContain('Owes');
    expect(modalHtml).toContain('Charlie');
    expect(modalHtml).toContain('Done');

    // No paid/share values under names in modal either
    expect(modalHtml).not.toContain('Paid $');
    expect(modalHtml).not.toContain('Share $');
  });

  test('BalancesSummary correctly displays when user owes money', () => {
    // Bob owes money (-$25 net)
    const html = renderToStaticMarkup(
      React.createElement(BalancesSummary, {
        summary: mockFinancialSummary,
        currentUserEmail: 'bob@test.com',
        members,
        currency: 'USD',
        isModalOpen: true,
      })
    );

    expect(html).toContain('Member Balances');
    expect(html).toContain('(You)');
    expect(html).toContain('You owe');
    expect(html).toContain('-$25.00');
  });

  test('BalancesSummary displays settled up when balance is zero', () => {
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
        isModalOpen: false,
      })
    );

    expect(html).toContain('Member Balances');
    expect(html).toContain('Settled');
    expect(html).toContain('All settled up');
  });
});
