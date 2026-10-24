import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GROUP_SECTIONS } from '../pages/group/groupSections';
import { BalancesSection } from '../pages/group/balances/BalancesSection';
import { SettlementSection } from '../pages/group/settlement/SettlementSection';
import { SummarySection } from '../pages/group/summary/SummarySection';
import type { Group } from '../types/group';
import type { GroupFinancialSummary, SimplifiedDebt } from '../types/balance';
import type { Expense } from '../types/transaction';

describe('Modular Page & Sub-Page Architecture', () => {
  const mockGroup: Group = {
    id: 'grp_test_1',
    name: 'Road Trip 2026',
    currency: 'USD',
    ownerEmail: 'alice@test.com',
    createdAt: '2026-05-01T10:00:00Z',
    members: [
      {
        email: 'alice@test.com',
        name: 'Alice',
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: '2026-05-01',
      },
      {
        email: 'bob@test.com',
        name: 'Bob',
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: 'alice@test.com',
        joinedAt: '2026-05-01',
      },
    ],
    pendingInvites: [],
  };

  const mockSimplifiedDebts: SimplifiedDebt[] = [
    {
      fromEmail: 'bob@test.com',
      fromName: 'Bob',
      toEmail: 'alice@test.com',
      toName: 'Alice',
      amount: 45,
      currency: 'USD',
    },
  ];

  const mockFinancialSummary: GroupFinancialSummary = {
    totalSpending: 90,
    currency: 'USD',
    balances: {
      'alice@test.com': {
        email: 'alice@test.com',
        name: 'Alice',
        totalPaid: 90,
        totalOwed: 45,
        netBalance: 45,
      },
      'bob@test.com': {
        email: 'bob@test.com',
        name: 'Bob',
        totalPaid: 0,
        totalOwed: 45,
        netBalance: -45,
      },
    },
    simplifiedDebts: mockSimplifiedDebts,
  };

  const mockExpenses: Expense[] = [
    {
      id: 'exp_1',
      date: '2026-05-02',
      description: 'Gas station refill',
      amount: 90,
      currency: 'USD',
      category: 'transport',
      paidBy: { 'alice@test.com': 90 },
      splitType: 'EQUAL',
      splits: { 'alice@test.com': 45, 'bob@test.com': 45 },
      createdBy: 'alice@test.com',
      createdAt: '2026-05-02T12:00:00Z',
      status: 'ACTIVE',
    },
  ];

  test('GROUP_SECTIONS registry declares all 4 primary sub-page tabs with render handlers', () => {
    const sectionIds = GROUP_SECTIONS.map((s) => s.id);
    expect(sectionIds).toEqual(['overview', 'expenses', 'balances', 'settings']);

    for (const section of GROUP_SECTIONS) {
      expect(section.id).toBeDefined();
      expect(section.label).toBeDefined();
      expect(section.icon).toBeDefined();
      expect(typeof section.render).toBe('function');
    }
  });

  test('SummarySection renders category spending chart with average expense in center', () => {
    const html = renderToStaticMarkup(
      React.createElement(SummarySection, {
        group: mockGroup,
        expenses: mockExpenses,
        financialSummary: mockFinancialSummary,
        onNavigateToExpenses: () => {},
        onOpenAddExpense: () => {},
        onUpdateDescription: async () => {},
      })
    );

    expect(html).toContain('Spending by Category');
    expect(html).toContain('$90.00');
    expect(html).toContain('Avg $90.00');
    expect(html).toContain('Transport');
  });

  test('SummarySection renders immutable group metadata card with description, created date, and owner', () => {
    const groupWithDesc: Group = {
      ...mockGroup,
      description: 'Annual family road trip vacation across western national parks',
      createdAt: '2026-05-01T10:00:00Z',
    };

    const html = renderToStaticMarkup(
      React.createElement(SummarySection, {
        group: groupWithDesc,
        expenses: mockExpenses,
        financialSummary: mockFinancialSummary,
        onNavigateToExpenses: () => {},
        onOpenAddExpense: () => {},
      })
    );

    expect(html).toContain('About Group');
    expect(html).toContain('Annual family road trip vacation across western national parks');
    expect(html).toContain('Created');
    expect(html).toContain('May 1, 2026');
    expect(html).toContain('Alice');
    expect(html).toContain('Owner');
  });

  test('SummarySection renders fallback placeholder when group description is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(SummarySection, {
        group: { ...mockGroup, description: undefined },
        expenses: [],
        financialSummary: null,
      })
    );

    expect(html).toContain('About Group');
    expect(html).toContain('No description provided.');
    expect(html).toContain('Owner');
    expect(html).toContain('Alice');
  });

  test('BalancesSection renders member balances and spending consumption breakdown', () => {
    const html = renderToStaticMarkup(
      React.createElement(BalancesSection, {
        summary: mockFinancialSummary,
        currentUserEmail: 'alice@test.com',
        members: mockGroup.members,
        expenses: mockExpenses,
        currency: 'USD',
      })
    );

    expect(html).toContain('Member Balances');
    expect(html).toContain('Spending &amp; Consumption');
    expect(html).toContain('Alice');
    expect(html).toContain('(You)');
    expect(html).toContain('+$45.00');
  });

  test('SettlementSection renders suggested settlements debts list', () => {
    const html = renderToStaticMarkup(
      React.createElement(SettlementSection, {
        debts: mockSimplifiedDebts,
        currentUserEmail: 'alice@test.com',
        members: mockGroup.members,
        onSettleDebt: () => {},
      })
    );

    expect(html).toContain('Suggested Settlements');
    expect(html).toContain('Bob');
    expect(html).not.toContain('owes');
    expect(html).toContain('$45.00');
    expect(html).toContain('Settle');
  });
});
