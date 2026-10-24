import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExpensesSection } from '../pages/group/expenses/ExpensesSection';
import { MembersSection } from '../pages/group/members/MembersSection';
import type { Group } from '../types/group';
import type { Expense } from '../types/transaction';

describe('Section Components - ExpensesSection & MembersSection', () => {
  const sampleGroup: Group = {
    id: 'grp-sec-1',
    name: 'Alps Hiking',
    description: 'Mountain adventures with friends',
    currency: 'EUR',
    ownerEmail: 'alice@test.com',
    createdAt: '2026-05-01',
    driveFileUrl: 'https://docs.google.com/spreadsheets/d/grp-sec-1/edit',
    pendingInvites: [],
    members: [
      {
        email: 'alice@test.com',
        name: 'Alice Dev',
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: '2026-05-01',
      },
    ],
  };

  const sampleExpense: Expense = {
    id: 'exp-alps-1',
    date: '2026-05-02',
    description: 'Trail Passes',
    amount: 4000,
    currency: 'EUR',
    category: 'entertainment',
    paidBy: { 'alice@test.com': 4000 },
    splitType: 'EQUAL',
    splits: { 'alice@test.com': 4000 },
    createdBy: 'alice@test.com',
    createdAt: '2026-05-02T08:00:00Z',
    status: 'ACTIVE',
  };

  test('ExpensesSection renders transaction list with expenses and active currency', () => {
    const html = renderToStaticMarkup(
      React.createElement(ExpensesSection, {
        expenses: [sampleExpense],
        settlements: [],
        currentUserEmail: 'alice@test.com',
        currency: 'EUR',
        members: sampleGroup.members,
        simplifiedDebts: [],
      })
    );

    expect(html).toContain('Trail Passes');
    expect(html).toContain('€4,000.00');
  });

  test('MembersSection renders description, direct sheets link, and member list', () => {
    const html = renderToStaticMarkup(
      React.createElement(MembersSection, {
        group: sampleGroup,
        currentUserEmail: 'alice@test.com',
        isOwner: true,
      })
    );

    expect(html).toContain('Mountain adventures with friends');
    expect(html).toContain('Open in Google Sheets');
    expect(html).toContain('Alice Dev');
    expect(html).toContain('Owner');
    expect(html).toContain('Edit group description');
  });

  test('MembersSection returns null if group is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(MembersSection, {
        group: undefined,
      })
    );
    expect(html).toBe('');
  });
});
