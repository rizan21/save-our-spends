import { describe, test, expect, beforeEach } from 'bun:test';
import { mockGoogleService } from '../services/mockGoogleService';

describe('mockGoogleService - Drive & Sheets Lifecycle', () => {
  beforeEach(() => {
    mockGoogleService.resetMockData();
  });

  test('listSpreadSpendsFiles discovers owned and shared sheets', async () => {
    const aliceFiles = await mockGoogleService.listSpreadSpendsFiles('alice.dev@gmail.com');
    expect(aliceFiles.length).toBeGreaterThanOrEqual(1);
    expect(aliceFiles[0].name).toContain('Goa Vacation 2026');

    // Bob is a shared member
    const bobFiles = await mockGoogleService.listSpreadSpendsFiles('bob.traveler@gmail.com');
    expect(bobFiles.length).toBeGreaterThanOrEqual(1);
    expect(bobFiles[0].shared).toBe(true);

    // Stranger has no access
    const strangerFiles = await mockGoogleService.listSpreadSpendsFiles('stranger@test.com');
    expect(strangerFiles.length).toBe(0);
  });

  test('createGroupSpreadsheet initializes tabs and permissions', async () => {
    const owner = { email: 'test.owner@gmail.com', name: 'Test Owner' };
    const sheetId = await mockGoogleService.createGroupSpreadsheet(
      'Weekend Trek',
      'USD',
      owner,
      ['friend@gmail.com']
    );

    const { group, expenses, settlements } = await mockGoogleService.loadGroupData(sheetId);
    expect(group.name).toBe('Weekend Trek');
    expect(group.currency).toBe('USD');
    expect(group.members.length).toBe(2);
    expect(group.members[0].role).toBe('OWNER');
    expect(group.members[1].role).toBe('MEMBER');
    expect(expenses.length).toBe(0);
    expect(settlements.length).toBe(0);
  });

  test('member proposes invite and owner approves it', async () => {
    const files = await mockGoogleService.listSpreadSpendsFiles('alice.dev@gmail.com');
    const sheetId = files[0].id;

    // Bob proposes inviting Eve
    const invite = {
      id: 'inv-eve-99',
      invitedEmail: 'eve.hiker@gmail.com',
      invitedByEmail: 'bob.traveler@gmail.com',
      invitedByName: 'Bob Traveler',
      status: 'PENDING' as const,
      requestedAt: new Date().toISOString(),
    };
    await mockGoogleService.proposeInvite(sheetId, invite);

    let data = await mockGoogleService.loadGroupData(sheetId);
    expect(data.group.pendingInvites.some((i) => i.invitedEmail === 'eve.hiker@gmail.com')).toBe(true);

    // Eve cannot see the group yet
    let eveFiles = await mockGoogleService.listSpreadSpendsFiles('eve.hiker@gmail.com');
    expect(eveFiles.length).toBe(0);

    // Non-owner cannot approve
    expect(
      mockGoogleService.approveInvite(sheetId, 'inv-eve-99', 'bob.traveler@gmail.com')
    ).rejects.toThrow();

    // Owner approves invite
    await mockGoogleService.approveInvite(sheetId, 'inv-eve-99', 'alice.dev@gmail.com');

    // Now Eve has writer access and can see the group!
    eveFiles = await mockGoogleService.listSpreadSpendsFiles('eve.hiker@gmail.com');
    expect(eveFiles.length).toBe(1);

    // Group members list includes Eve as ACTIVE
    data = await mockGoogleService.loadGroupData(sheetId);
    expect(data.group.members.some((m) => m.email === 'eve.hiker@gmail.com')).toBe(true);
  });
});
