import { describe, test, expect, beforeEach } from 'bun:test';
import { googleAuthService } from '../services/googleAuth';
import { groupService } from '../services/groupService';
import { mockGoogleService } from '../services/mockGoogleService';
import { serializeMembers, deserializeMembers } from '../core/sheetSerializer';
import type { Member } from '../types/group';

// Polyfill localStorage for node/bun test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
    key: (idx: number) => Object.keys(store)[idx] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

describe('User Profile - Custom Username & Google Profile Picture', () => {
  beforeEach(() => {
    localStorage.clear();
    googleAuthService.setDemoMode(true);
    mockGoogleService.resetMockData();
  });

  test('User starts with Google profile picture and Google account name', () => {
    const user = googleAuthService.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe('demo.alice@example.com');
    expect(user?.picture).toBeDefined();
    expect(user?.picture).toContain('https://images.unsplash.com');
    expect(user?.googleName).toBe('Demo Alice (Owner)');
    expect(user?.name).toBe('Demo Alice (Owner)');
  });

  test('User can edit their user name and retain Google profile picture', () => {
    const updated = googleAuthService.updateUserName('Alice In Wonderland');
    expect(updated.name).toBe('Alice In Wonderland');
    expect(updated.googleName).toBe('Demo Alice (Owner)');
    // Profile picture MUST remain set to Google account picture
    expect(updated.picture).toContain('https://images.unsplash.com');

    // Current user reflects updated name
    const current = googleAuthService.getCurrentUser();
    expect(current?.name).toBe('Alice In Wonderland');
    expect(current?.picture).toBe(updated.picture);

    // Persisted in localStorage
    expect(localStorage.getItem('spread_spends_user_name_demo.alice@example.com')).toBe('Alice In Wonderland');
  });

  test('updateUserName rejects empty or whitespace-only names', () => {
    expect(() => googleAuthService.updateUserName('')).toThrow('User name cannot be empty');
    expect(() => googleAuthService.updateUserName('   ')).toThrow('User name cannot be empty');
  });

  test('User can reset their user name back to the original Google account name', () => {
    googleAuthService.updateUserName('Alice Hacker');
    expect(googleAuthService.getCurrentUser()?.name).toBe('Alice Hacker');

    const reset = googleAuthService.resetUserNameToGoogle();
    expect(reset.name).toBe('Demo Alice (Owner)');
    expect(reset.picture).toBeDefined();
    expect(localStorage.getItem('spread_spends_user_name_demo.alice@example.com')).toBeNull();
  });

  test('Creating group sets owner member picture to Google account picture', async () => {
    const groupId = await groupService.createGroup('Alps Hike 2026', 'EUR', ['bob@example.com']);
    const data = await groupService.loadGroup(groupId);

    const ownerMember = data.group.members.find((m) => m.email === 'demo.alice@example.com');
    expect(ownerMember).toBeDefined();
    expect(ownerMember?.picture).toBeDefined();
    expect(ownerMember?.picture).toContain('https://images.unsplash.com');
  });

  test('updateMemberName updates member display name in group spreadsheet', async () => {
    const groups = await groupService.listGroups('demo.alice@example.com');
    const groupId = groups[0].id;

    // Update Alice's name in the group
    await groupService.updateMemberName(groupId, 'demo.alice@example.com', 'Alice Superstar');

    const data = await groupService.loadGroup(groupId);
    const aliceMember = data.group.members.find((m) => m.email === 'demo.alice@example.com');
    expect(aliceMember?.name).toBe('Alice Superstar');
  });

  test('sheetSerializer roundtrip preserves member pictures', () => {
    const membersWithPic: Member[] = [
      {
        email: 'alice@test.com',
        name: 'Alice',
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: '2026-01-01T00:00:00.000Z',
        picture: 'https://lh3.googleusercontent.com/a/alice-photo',
      },
      {
        email: 'bob@test.com',
        name: 'Bob Jones',
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: 'alice@test.com',
        joinedAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    const rows = serializeMembers(membersWithPic);
    expect(rows[0]).toContain('Picture');
    expect(rows[1]).toContain('https://lh3.googleusercontent.com/a/alice-photo');

    const deserialized = deserializeMembers(rows);
    expect(deserialized[0].picture).toBe('https://lh3.googleusercontent.com/a/alice-photo');
    expect(deserialized[1].picture).toBeUndefined();
  });

  test('All group members have profile pictures loaded and viewable by other users', async () => {
    const data = await groupService.loadGroup('mock-sheet-goa-2026');
    const members = data.group.members;

    expect(members.length).toBeGreaterThanOrEqual(3);

    const alice = members.find((m) => m.email === 'demo.alice@example.com');
    const bob = members.find((m) => m.email === 'demo.bob@example.com');
    const charlie = members.find((m) => m.email === 'demo.charlie@example.com');

    expect(alice?.picture).toBeDefined();
    expect(bob?.picture).toBeDefined();
    expect(charlie?.picture).toBeDefined();

    expect(bob?.picture).toContain('https://images.unsplash.com');
    expect(charlie?.picture).toContain('https://images.unsplash.com');
    // Ensure Bob and Charlie have distinct profile pictures
    expect(bob?.picture).not.toBe(charlie?.picture);
  });

  test('New members added directly or approved receive profile pictures', async () => {
    const groupId = 'mock-sheet-goa-2026';

    // 1. Add direct member
    await mockGoogleService.addDirectMember(groupId, 'demo.david@example.com', 'demo.alice@example.com');
    let data = await groupService.loadGroup(groupId);
    const david = data.group.members.find((m) => m.email === 'demo.david@example.com');
    expect(david).toBeDefined();
    expect(david?.picture).toBeDefined();
    expect(david?.picture).toContain('https://images.unsplash.com');

    // 2. Propose & approve invite
    await groupService.proposeInvite(groupId, {
      id: 'inv-eva-99',
      invitedEmail: 'demo.eva@example.com',
      invitedByEmail: 'demo.alice@example.com',
      invitedByName: 'Demo Alice',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    });

    await groupService.approveInvite(groupId, 'inv-eva-99', 'demo.alice@example.com');
    data = await groupService.loadGroup(groupId);
    const eva = data.group.members.find((m) => m.email === 'demo.eva@example.com');
    expect(eva).toBeDefined();
    expect(eva?.picture).toBeDefined();
    expect(eva?.picture).toContain('dicebear.com');
  });
});
