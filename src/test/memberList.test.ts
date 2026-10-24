import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemberList } from '../pages/group/members/MemberList';
import { PendingApprovalsList } from '../pages/group/members/PendingApprovalsList';
import type { Member, PendingInvite } from '../types/group';

describe('MemberList & PendingApprovalsList Component Interactions', () => {
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
      name: 'Charlie Inactive',
      role: 'MEMBER',
      status: 'INACTIVE',
      addedBy: 'alice@test.com',
      joinedAt: '2026-01-01',
    },
  ];

  const pendingInvites: PendingInvite[] = [
    {
      id: 'inv-1',
      invitedEmail: 'dave@test.com',
      invitedByEmail: 'bob@test.com',
      invitedByName: 'Bob Jones',
      status: 'PENDING',
      requestedAt: '2026-02-01',
    },
  ];

  test('renders active members, owner badge, and inactive member status badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberList, {
        members,
        pendingInvites: [],
        currentUserEmail: 'alice@test.com',
        isOwner: true,
        onOpenInviteModal: () => {},
        onApproveInvite: async () => {},
        isApproving: false,
      })
    );

    // Alice has Owner badge
    expect(html).toContain('Alice Dev');
    expect(html).toContain('Owner');

    // Bob has MEMBER
    expect(html).toContain('Bob Jones');

    // Charlie is INACTIVE and has restore button
    expect(html).toContain('Charlie Inactive');
    expect(html).toContain('(Removed)');
    expect(html).toContain('Restore');
  });

  test('owner view renders Sync Drive Permissions and Invite buttons', () => {
    const handleOpenInvite = () => {};

    const html = renderToStaticMarkup(
      React.createElement(MemberList, {
        members,
        pendingInvites: [],
        currentUserEmail: 'alice@test.com',
        isOwner: true,
        onOpenInviteModal: handleOpenInvite,
        onApproveInvite: async () => {},
        isApproving: false,
        groupId: 'grp-audit-1',
      })
    );

    expect(html).toContain('Invite');
    expect(html).toContain('Sync member list with Drive file sharing permissions');
  });

  test('non-owner cannot see soft-delete remove buttons for other members', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberList, {
        members,
        pendingInvites: [],
        currentUserEmail: 'bob@test.com',
        isOwner: false, // Bob is regular member
        onOpenInviteModal: () => {},
        onApproveInvite: async () => {},
        isApproving: false,
      })
    );

    // Remove buttons are hidden for non-owners
    expect(html).not.toContain('Remove member (soft-delete)');
  });

  test('PendingApprovalsList renders pending invite cards and handles approval', () => {
    const handleApprove = async (_id: string) => {};

    const html = renderToStaticMarkup(
      React.createElement(PendingApprovalsList, {
        pendingInvites,
        isOwner: true,
        onApproveInvite: handleApprove,
        isApproving: false,
      })
    );

    expect(html).toContain('Pending Invitations');
    expect(html).toContain('dave@test.com');
    expect(html).toContain('Invited by Bob Jones');
    expect(html).toContain('Approve');
  });

  test('PendingApprovalsList returns null when invites array is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PendingApprovalsList, {
        pendingInvites: [],
        isOwner: true,
        onApproveInvite: async () => {},
        isApproving: false,
      })
    );
    expect(html).toBe('');
  });
});
