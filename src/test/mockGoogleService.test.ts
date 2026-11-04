import { describe, test, expect, beforeEach } from 'bun:test';
import { mockGoogleService } from '../services/mockGoogleService';

describe('mockGoogleService - Drive & Sheets Lifecycle', () => {
  beforeEach(() => {
    mockGoogleService.resetMockData();
  });

  test('listSpreadSpendsFiles discovers owned and shared sheets', async () => {
    const aliceFiles = await mockGoogleService.listSpreadSpendsFiles('demo.alice@example.com');
    expect(aliceFiles.length).toBeGreaterThanOrEqual(1);
    expect(aliceFiles[0].name).toContain('Goa Vacation 2026');

    // Bob is a shared member
    const bobFiles = await mockGoogleService.listSpreadSpendsFiles('demo.bob@example.com');
    expect(bobFiles.length).toBeGreaterThanOrEqual(1);
    expect(bobFiles[0].shared).toBe(true);

    // Stranger has no access
    const strangerFiles = await mockGoogleService.listSpreadSpendsFiles('stranger@test.com');
    expect(strangerFiles.length).toBe(0);
  });

  test('createGroupSpreadsheet initializes tabs and permissions', async () => {
    const owner = { email: 'test.owner@example.com', name: 'Test Owner' };
    const sheetId = await mockGoogleService.createGroupSpreadsheet(
      'Weekend Trek',
      'USD',
      owner,
      ['friend@example.com']
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
    const files = await mockGoogleService.listSpreadSpendsFiles('demo.alice@example.com');
    const sheetId = files[0].id;

    // Bob proposes inviting Eve
    const invite = {
      id: 'inv-eve-99',
      invitedEmail: 'demo.eve@example.com',
      invitedByEmail: 'demo.bob@example.com',
      invitedByName: 'Demo Bob',
      status: 'PENDING' as const,
      requestedAt: new Date().toISOString(),
    };
    await mockGoogleService.proposeInvite(sheetId, invite);

    let data = await mockGoogleService.loadGroupData(sheetId);
    expect(data.group.pendingInvites.some((i) => i.invitedEmail === 'demo.eve@example.com')).toBe(true);

    // Eve cannot see the group yet
    let eveFiles = await mockGoogleService.listSpreadSpendsFiles('demo.eve@example.com');
    expect(eveFiles.length).toBe(0);

    // Non-owner cannot approve
    expect(
      mockGoogleService.approveInvite(sheetId, 'inv-eve-99', 'demo.bob@example.com')
    ).rejects.toThrow();

    // Owner approves invite
    await mockGoogleService.approveInvite(sheetId, 'inv-eve-99', 'demo.alice@example.com');

    // Now Eve has writer access and can see the group!
    eveFiles = await mockGoogleService.listSpreadSpendsFiles('demo.eve@example.com');
    expect(eveFiles.length).toBe(1);

    // Group members list includes Eve as ACTIVE
    data = await mockGoogleService.loadGroupData(sheetId);
    expect(data.group.members.some((m) => m.email === 'demo.eve@example.com')).toBe(true);
  });

  test('supports creating, listing, and deleting custom group spreadsheets in demo mode', async () => {
    const owner = { email: 'demo.alice@example.com', name: 'Demo Alice' };
    const customSheetId = await mockGoogleService.createGroupSpreadsheet(
      'Pokemon Tournament 2026',
      'USD',
      owner,
      []
    );

    // listSpreadSpendsFiles returns created groups
    const files = await mockGoogleService.listSpreadSpendsFiles('demo.alice@example.com');
    expect(files.some((f) => f.name.includes('Pokemon Tournament 2026'))).toBe(true);

    // deleteGroupSpreadsheet explicitly deletes mock groups
    await mockGoogleService.deleteGroupSpreadsheet(customSheetId);
    expect(mockGoogleService.getMockSheet(customSheetId)).toBeUndefined();
    const afterDelete = await mockGoogleService.listSpreadSpendsFiles('demo.alice@example.com');
    expect(afterDelete.some((f) => f.id === customSheetId)).toBe(false);
  });
});
