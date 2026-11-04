import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { GroupService } from '../services/groupService';
import { googleAuthService } from '../services/googleAuth';
import { googleSheetsService } from '../services/googleSheets';
import { googleDriveService } from '../services/googleDrive';
import { HEADERS, SHEET_TABS } from '../core/sheetSerializer';
import type { Expense, Settlement } from '../types/transaction';
import type { GoogleUser } from '../types/google';
import type { PendingInvite } from '../types/group';

describe('groupService - Real Google API Execution Path (Non-Demo)', () => {
  let groupService: GroupService;
  const mockOwner: GoogleUser = {
    email: 'alice@real.com',
    name: 'Alice Real',
    googleName: 'Alice Real',
    picture: 'https://example.com/alice.jpg',
  };

  beforeEach(() => {
    groupService = new GroupService();
    googleAuthService.setDemoMode(false);
    (googleAuthService as any).user = mockOwner;
    (googleAuthService as any).token = {
      accessToken: 'real-access-token-999',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'drive',
      issuedAt: Date.now(),
    };
  });

  afterEach(() => {
    googleAuthService.setDemoMode(true);
  });

  test('listGroups invokes googleDriveService.listSpreadSpendsFiles', async () => {
    const origList = googleDriveService.listSpreadSpendsFiles;
    const mockFiles = [
      { id: 'real-sheet-1', name: '[SpreadSpends] Real Group', mimeType: 'spreadsheet' },
    ];
    googleDriveService.listSpreadSpendsFiles = mock(async () => mockFiles as any);

    try {
      const files = await groupService.listGroups('alice@real.com');
      expect(files.length).toBe(1);
      expect(files[0].id).toBe('real-sheet-1');
      expect(googleDriveService.listSpreadSpendsFiles).toHaveBeenCalled();
    } finally {
      googleDriveService.listSpreadSpendsFiles = origList;
    }
  });

  test('createGroup creates spreadsheet and grants writer permissions to initial members', async () => {
    const origCreate = googleSheetsService.createGroupSpreadsheet;
    const origGrant = googleDriveService.grantPermission;

    googleSheetsService.createGroupSpreadsheet = mock(async () => 'new-created-sheet-id');
    const grantedEmails: string[] = [];
    googleDriveService.grantPermission = mock(async (_token, _fileId, email) => {
      grantedEmails.push(email);
      return { id: 'perm-id', role: 'writer' };
    });

    try {
      const sheetId = await groupService.createGroup('Rome Trip', 'EUR', [
        'bob@real.com',
        'charlie@real.com',
      ]);
      expect(sheetId).toBe('new-created-sheet-id');
      expect(googleSheetsService.createGroupSpreadsheet).toHaveBeenCalled();
      expect(grantedEmails).toContain('bob@real.com');
      expect(grantedEmails).toContain('charlie@real.com');
      expect(grantedEmails).not.toContain('alice@real.com');
    } finally {
      googleSheetsService.createGroupSpreadsheet = origCreate;
      googleDriveService.grantPermission = origGrant;
    }
  });

  test('createGroup throws error if user is not authenticated', async () => {
    (googleAuthService as any).user = null;
    expect(groupService.createGroup('Fail Trip', 'USD')).rejects.toThrow('User must be logged in');
  });

  test('createGroup throws clear drive.file error when user lacks Drive permission', async () => {
    (googleAuthService as any).token = {
      accessToken: 'token-no-drive',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'https://www.googleapis.com/auth/userinfo.email',
      issuedAt: Date.now(),
    };
    expect(groupService.createGroup('Blocked Trip', 'USD')).rejects.toThrow(
      /Google Drive permission missing.*drive\.file/
    );
  });

  test('loadGroup loads config, members, invites, settlements, and member expenses', async () => {
    const origRead = googleSheetsService.readTab;
    const origBatch = googleSheetsService.batchReadTabs;
    const origPerms = googleDriveService.getFilePermissions;
    const origFormula = googleSheetsService.updateAllExpensesFormula;
    const origUpdate = googleSheetsService.updateSheetRange;

    googleSheetsService.updateSheetRange = mock(async () => {});

    googleSheetsService.readTab = mock(async (_token, _sheetId, tabName) => {
      if (tabName === SHEET_TABS.CONFIG) {
        return [
          HEADERS.CONFIG,
          ['app_signature', 'Spread-Spends'],
          ['schema_version', '2.0.0'],
          ['group_id', 'sheet-123'],
          ['group_name', 'Loaded Group'],
          ['default_currency', 'USD'],
          ['owner_email', 'alice@real.com'],
          ['created_at', '2026-01-01'],
        ];
      }
      if (tabName === SHEET_TABS.MEMBERS) {
        return [
          HEADERS.MEMBERS,
          ['alice@real.com', 'Alice Real', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
        ];
      }
      if (tabName === SHEET_TABS.INVITES) {
        return [HEADERS.INVITES];
      }
      if (tabName === SHEET_TABS.SETTLEMENTS) {
        return [
          HEADERS.SETTLEMENTS,
          ['set-1', '2026-01-02', 'bob@real.com', 'Bob', 'alice@real.com', 'Alice', '20.00', 'USD', 'Cash', '', 'bob@real.com', '2026-01-02', 'ACTIVE', ''],
        ];
      }
      return [];
    });

    googleDriveService.getFilePermissions = mock(async () => [
      { id: 'p1', emailAddress: 'alice@real.com', role: 'owner', type: 'user', photoLink: 'https://example.com/p1.jpg' },
    ]);

    googleSheetsService.batchReadTabs = mock(async () => [
      {
        range: 'Exp_alice@real.com!A1:N10',
        values: [
          HEADERS.EXPENSES,
          ['exp-1', '2026-01-01', 'Coffee', 'food', '5.00', 'USD', '{"alice@real.com":500}', 'EQUAL', '{"alice@real.com":500}', '', 'alice@real.com', '2026-01-01', 'ACTIVE', ''],
        ],
      },
    ]);

    googleSheetsService.updateAllExpensesFormula = mock(async () => {});

    try {
      const data = await groupService.loadGroup('sheet-123');
      expect(data.group.name).toBe('Loaded Group');
      expect(data.group.members.length).toBe(1);
      expect(data.expenses.length).toBe(1);
      expect(data.settlements.length).toBe(1);
      expect(data.group.driveFileUrl).toContain('sheet-123');
    } finally {
      googleSheetsService.readTab = origRead;
      googleSheetsService.batchReadTabs = origBatch;
      googleDriveService.getFilePermissions = origPerms;
      googleSheetsService.updateAllExpensesFormula = origFormula;
      googleSheetsService.updateSheetRange = origUpdate;
    }
  });

  test('updateGroupDescription and updateMemberName invoke sheets service', async () => {
    const origDesc = googleSheetsService.updateGroupDescription;
    const origName = googleSheetsService.updateMemberName;

    let descUpdated = '';
    let nameUpdated = '';

    googleSheetsService.updateGroupDescription = mock(async (_token, _sheetId, desc) => {
      descUpdated = desc;
    });
    googleSheetsService.updateMemberName = mock(async (_token, _sheetId, _email, name) => {
      nameUpdated = name;
    });

    try {
      await groupService.updateGroupDescription('sheet-123', 'Updated Note');
      expect(descUpdated).toBe('Updated Note');

      await groupService.updateMemberName('sheet-123', 'bob@real.com', 'Bobby');
      expect(nameUpdated).toBe('Bobby');
    } finally {
      googleSheetsService.updateGroupDescription = origDesc;
      googleSheetsService.updateMemberName = origName;
    }
  });

  test('addExpense checks/creates author member tab and appends expense row', async () => {
    const origRead = googleSheetsService.readTab;
    const origAppend = googleSheetsService.appendRow;
    const origAddTab = googleSheetsService.addMemberTab;

    let appendedTab = '';
    let appendedRow: string[] = [];

    googleSheetsService.readTab = mock(async () => []);
    googleSheetsService.appendRow = mock(async (_token, _sheetId, tabName, row) => {
      appendedTab = tabName;
      appendedRow = row;
    });
    googleSheetsService.addMemberTab = mock(async () => 'Exp_alice@real.com');

    try {
      const sampleExpense: Expense = {
        id: 'exp-real-001',
        date: '2026-10-20',
        description: 'Gelato',
        amount: 1500,
        currency: 'EUR',
        category: 'food',
        paidBy: { 'alice@real.com': 1500 },
        splitType: 'EQUAL',
        splits: { 'alice@real.com': 1500 },
        createdBy: 'alice@real.com',
        createdAt: '2026-10-20T14:00:00.000Z',
        status: 'ACTIVE',
      };

      await groupService.addExpense('sheet-123', sampleExpense);
      expect(appendedTab).toContain('Exp_alice');
      expect(appendedRow[0]).toBe('exp-real-001');
      expect(appendedRow[2]).toBe('Gelato');
    } finally {
      googleSheetsService.readTab = origRead;
      googleSheetsService.appendRow = origAppend;
      googleSheetsService.addMemberTab = origAddTab;
    }
  });

  test('updateExpense and deleteExpense updates row with soft-deletion history', async () => {
    const origUpdate = googleSheetsService.updateExpense;
    let updatedExpenseData: any = null;

    googleSheetsService.updateExpense = mock(async (_token, _sheetId, exp) => {
      updatedExpenseData = exp;
    });

    const sampleExpense: Expense = {
      id: 'exp-del-1',
      date: '2026-10-20',
      description: 'Dinner',
      amount: 5000,
      currency: 'USD',
      category: 'food',
      paidBy: { 'alice@real.com': 5000 },
      splitType: 'EQUAL',
      splits: { 'alice@real.com': 5000 },
      createdBy: 'alice@real.com',
      createdAt: '2026-10-20T12:00:00.000Z',
      status: 'ACTIVE',
    };

    // Mock loadGroup to return sampleExpense
    const origLoad = groupService.loadGroup;
    groupService.loadGroup = mock(async () => ({
      group: {} as any,
      expenses: [sampleExpense],
      settlements: [],
    }));

    try {
      await groupService.updateExpense('sheet-123', sampleExpense);
      expect(googleSheetsService.updateExpense).toHaveBeenCalled();

      await groupService.deleteExpense('sheet-123', 'exp-del-1', 'alice@real.com');
      expect(updatedExpenseData).toBeDefined();
      expect(updatedExpenseData?.status).toBe('DELETED');
      expect(updatedExpenseData?.history?.[0].summary).toBe('Deleted expense');
    } finally {
      googleSheetsService.updateExpense = origUpdate;
      groupService.loadGroup = origLoad;
    }
  });

  test('addSettlement, updateSettlement and deleteSettlement perform settlement lifecycle', async () => {
    const origAppend = googleSheetsService.appendRow;
    const origUpdate = googleSheetsService.updateSettlement;

    let appendedRow: string[] = [];
    let updatedSettlementData: any = null;

    googleSheetsService.appendRow = mock(async (_token, _sheetId, _tab, row) => {
      appendedRow = row;
    });
    googleSheetsService.updateSettlement = mock(async (_token, _sheetId, set) => {
      updatedSettlementData = set;
    });

    const sampleSettlement: Settlement = {
      id: 'set-live-1',
      date: '2026-10-21',
      payerEmail: 'bob@real.com',
      payerName: 'Bob Real',
      payeeEmail: 'alice@real.com',
      payeeName: 'Alice Real',
      amount: 2500,
      currency: 'USD',
      paymentMethod: 'UPI',
      recordedBy: 'bob@real.com',
      createdAt: '2026-10-21T10:00:00.000Z',
      status: 'ACTIVE',
    };

    const origLoad = groupService.loadGroup;
    groupService.loadGroup = mock(async () => ({
      group: {} as any,
      expenses: [],
      settlements: [sampleSettlement],
    }));

    try {
      await groupService.addSettlement('sheet-123', sampleSettlement);
      expect(appendedRow[0]).toBe('set-live-1');

      await groupService.updateSettlement('sheet-123', sampleSettlement);
      expect(googleSheetsService.updateSettlement).toHaveBeenCalled();

      await groupService.deleteSettlement('sheet-123', 'set-live-1', 'bob@real.com');
      expect(updatedSettlementData?.status).toBe('DELETED');
      expect(updatedSettlementData?.history?.[0].summary).toBe('Deleted settlement');
    } finally {
      googleSheetsService.appendRow = origAppend;
      googleSheetsService.updateSettlement = origUpdate;
      groupService.loadGroup = origLoad;
    }
  });

  test('proposeInvite, approveInvite and rejectInvite manage pending invite lifecycle', async () => {
    const origRead = googleSheetsService.readTab;
    const origUpdate = googleSheetsService.updateSheetRange;
    const origGrant = googleDriveService.grantPermission;
    const origAddTab = googleSheetsService.addMemberTab;
    const origFormula = googleSheetsService.updateAllExpensesFormula;

    let grantedEmail = '';

    googleSheetsService.readTab = mock(async (_token, _sheetId, tabName) => {
      if (tabName === SHEET_TABS.INVITES) {
        return [
          HEADERS.INVITES,
          ['inv-1', 'pending@real.com', 'bob@real.com', 'Bob', 'PENDING', '2026-01-01', ''],
        ];
      }
      if (tabName === SHEET_TABS.MEMBERS) {
        return [
          HEADERS.MEMBERS,
          ['alice@real.com', 'Alice Real', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
        ];
      }
      return [];
    });

    googleSheetsService.updateSheetRange = mock(async () => {});

    googleDriveService.grantPermission = mock(async (_token, _fileId, email) => {
      grantedEmail = email;
      return { id: 'p-new', role: 'writer' };
    });

    googleSheetsService.addMemberTab = mock(async () => 'Exp_pending@real.com');
    googleSheetsService.updateAllExpensesFormula = mock(async () => {});

    try {
      // Proposing invite when one is already pending throws error
      const dupInvite: PendingInvite = {
        id: 'inv-dup',
        invitedEmail: 'pending@real.com',
        invitedByEmail: 'bob@real.com',
        invitedByName: 'Bob Traveler',
        status: 'PENDING',
        requestedAt: '2026-01-02',
      };
      expect(groupService.proposeInvite('sheet-123', dupInvite)).rejects.toThrow(
        'An invite is already pending'
      );

      // Approving invite grants Drive permission and updates members
      await groupService.approveInvite('sheet-123', 'inv-1', 'alice@real.com');
      expect(grantedEmail).toBe('pending@real.com');
      expect(googleSheetsService.addMemberTab).toHaveBeenCalled();
    } finally {
      googleSheetsService.readTab = origRead;
      googleSheetsService.updateSheetRange = origUpdate;
      googleDriveService.grantPermission = origGrant;
      googleSheetsService.addMemberTab = origAddTab;
      googleSheetsService.updateAllExpensesFormula = origFormula;
    }
  });

  test('softDeleteMember marks member INACTIVE and revokes Drive permission', async () => {
    const origRead = googleSheetsService.readTab;
    const origUpdate = googleSheetsService.updateSheetRange;
    const origPerms = googleDriveService.getFilePermissions;
    const origRevoke = googleDriveService.removePermission;

    let updatedMembersRows: string[][] = [];
    let revokedPermId = '';

    googleSheetsService.readTab = mock(async () => [
      HEADERS.MEMBERS,
      ['alice@real.com', 'Alice', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
      ['bob@real.com', 'Bob', 'MEMBER', 'ACTIVE', 'alice@real.com', '2026-01-01'],
    ]);

    googleSheetsService.updateSheetRange = mock(async (_token, _sheetId, _range, values) => {
      updatedMembersRows = values;
    });

    googleDriveService.getFilePermissions = mock(async () => [
      { id: 'perm-bob', emailAddress: 'bob@real.com', role: 'writer', type: 'user' },
    ]);

    googleDriveService.removePermission = mock(async (_token, _fileId, permId) => {
      revokedPermId = permId;
    });

    try {
      await groupService.softDeleteMember('sheet-123', 'bob@real.com');
      const bobRow = updatedMembersRows.find((r) => r[0] === 'bob@real.com');
      expect(bobRow?.[3]).toBe('INACTIVE');
      expect(revokedPermId).toBe('perm-bob');
    } finally {
      googleSheetsService.readTab = origRead;
      googleSheetsService.updateSheetRange = origUpdate;
      googleDriveService.getFilePermissions = origPerms;
      googleDriveService.removePermission = origRevoke;
    }
  });

  test('softDeleteMember protects group owner from deletion', async () => {
    const origRead = googleSheetsService.readTab;
    googleSheetsService.readTab = mock(async () => [
      HEADERS.MEMBERS,
      ['alice@real.com', 'Alice', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
    ]);

    try {
      expect(groupService.softDeleteMember('sheet-123', 'alice@real.com')).rejects.toThrow(
        'Cannot remove the group owner'
      );
    } finally {
      googleSheetsService.readTab = origRead;
    }
  });

  test('restoreMember reactivates member and re-grants Drive permission', async () => {
    const origRead = googleSheetsService.readTab;
    const origUpdate = googleSheetsService.updateSheetRange;
    const origGrant = googleDriveService.grantPermission;

    let updatedMembersRows: string[][] = [];
    let grantedEmail = '';

    googleSheetsService.readTab = mock(async () => [
      HEADERS.MEMBERS,
      ['alice@real.com', 'Alice', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
      ['bob@real.com', 'Bob', 'MEMBER', 'INACTIVE', 'alice@real.com', '2026-01-01'],
    ]);

    googleSheetsService.updateSheetRange = mock(async (_token, _sheetId, _range, values) => {
      updatedMembersRows = values;
    });

    googleDriveService.grantPermission = mock(async (_token, _fileId, email) => {
      grantedEmail = email;
      return { id: 'perm-new', role: 'writer' };
    });

    try {
      await groupService.restoreMember('sheet-123', 'bob@real.com');
      const bobRow = updatedMembersRows.find((r) => r[0] === 'bob@real.com');
      expect(bobRow?.[3]).toBe('ACTIVE');
      expect(grantedEmail).toBe('bob@real.com');
    } finally {
      googleSheetsService.readTab = origRead;
      googleSheetsService.updateSheetRange = origUpdate;
      googleDriveService.grantPermission = origGrant;
    }
  });

  test('auditDrivePermissions correctly flags missing permissions and inactive members with access', async () => {
    const origRead = googleSheetsService.readTab;
    const origPerms = googleDriveService.getFilePermissions;

    googleSheetsService.readTab = mock(async () => [
      HEADERS.MEMBERS,
      ['alice@real.com', 'Alice', 'OWNER', 'ACTIVE', 'self', '2026-01-01'],
      ['bob@real.com', 'Bob', 'MEMBER', 'ACTIVE', 'alice@real.com', '2026-01-01'],
      ['carol@real.com', 'Carol', 'MEMBER', 'INACTIVE', 'alice@real.com', '2026-01-01'],
    ]);

    googleDriveService.getFilePermissions = mock(async () => [
      { id: 'perm-alice', emailAddress: 'alice@real.com', role: 'owner', type: 'user' },
      { id: 'perm-carol', emailAddress: 'carol@real.com', role: 'writer', type: 'user' },
    ]);

    try {
      const discrepancies = await groupService.auditDrivePermissions('sheet-123');
      expect(discrepancies.length).toBe(2);

      const missingBob = discrepancies.find((d) => d.email === 'bob@real.com');
      expect(missingBob?.type).toBe('MISSING_DRIVE_PERMISSION');

      const inactiveCarol = discrepancies.find((d) => d.email === 'carol@real.com');
      expect(inactiveCarol?.type).toBe('INACTIVE_HAS_WRITE_ACCESS');
      expect(inactiveCarol?.permissionId).toBe('perm-carol');
    } finally {
      googleSheetsService.readTab = origRead;
      googleDriveService.getFilePermissions = origPerms;
    }
  });

  test('grantDriveWriterPermission and revokeDrivePermission call drive service with auth token', async () => {
    const origGrant = googleDriveService.grantPermission;
    const origRemove = googleDriveService.removePermission;

    let grantedRole = '';
    let removedId = '';

    googleDriveService.grantPermission = mock(async (_token, _fileId, _email, role) => {
      grantedRole = role;
      return { id: 'p1', role };
    });

    googleDriveService.removePermission = mock(async (_token, _fileId, permId) => {
      removedId = permId;
    });

    try {
      await groupService.grantDriveWriterPermission('sheet-123', 'newuser@real.com');
      expect(grantedRole).toBe('writer');

      await groupService.revokeDrivePermission('sheet-123', 'perm-old-99');
      expect(removedId).toBe('perm-old-99');
    } finally {
      googleDriveService.grantPermission = origGrant;
      googleDriveService.removePermission = origRemove;
    }
  });
});
