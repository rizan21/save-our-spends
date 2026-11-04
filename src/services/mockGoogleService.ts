import type { GoogleDriveFile, GoogleUser } from '../types/google';
import type { DriveDiscrepancy, Group, GroupConfig, Member, PendingInvite } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';
import {
  deserializeGroupConfig,
  deserializeMembers,
  deserializePendingInvites,
  deserializeSettlements,
  deserializeExpenses,
  deserializeMultiTabExpenses,
  getMemberTabName,
  generateAllExpensesFormula,
  HEADERS,
  serializeExpenseRow,
  serializeGroupConfig,
  serializeMembers,
  serializePendingInvites,
  serializeSettlementRow,
  serializeSettlements,
  SHEET_TABS,
} from '../core/sheetSerializer';

export interface MockSpreadsheet {
  id: string;
  name: string;
  ownerEmail: string;
  sharedWith: string[]; // emails with writer permissions
  tabs: Record<string, string[][]>;
}

const STORAGE_KEY = 'spread_spends_mock_data_v3';

export const MOCK_AVATARS: Record<string, string> = {
  'demo.alice@example.com': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
  'demo.bob@example.com': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  'demo.charlie@example.com': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
  'demo.david@example.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
};

export function getMockUserAvatar(email: string): string {
  const normalized = email.toLowerCase().trim();
  if (MOCK_AVATARS[normalized]) {
    return MOCK_AVATARS[normalized];
  }
  const seed = encodeURIComponent(normalized.split('@')[0]);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

// Seed sample data for an instant rich experience
function getInitialMockSpreadsheets(): Record<string, MockSpreadsheet> {
  const goaId = 'mock-sheet-goa-2026';
  const ownerEmail = 'demo.alice@example.com';
  const bobEmail = 'demo.bob@example.com';
  const charlieEmail = 'demo.charlie@example.com';
  const davidEmail = 'demo.david@example.com';

  const config: GroupConfig = {
    appSignature: 'Spread-Spends',
    schemaVersion: '1.0.0',
    groupId: goaId,
    groupName: 'Goa Vacation 2026',
    description: 'Trip to Goa with friends! Exploring beaches, seafood shacks, and bike rides across North & South Goa.',
    defaultCurrency: 'INR',
    ownerEmail,
    createdAt: '2026-09-20T10:00:00.000Z',
  };

  const members: Member[] = [
    {
      email: ownerEmail,
      name: 'Demo Alice (Owner)',
      role: 'OWNER',
      status: 'ACTIVE',
      addedBy: 'self',
      joinedAt: '2026-09-20T10:00:00.000Z',
      picture: MOCK_AVATARS[ownerEmail],
    },
    {
      email: bobEmail,
      name: 'Demo Bob',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: ownerEmail,
      joinedAt: '2026-09-20T11:00:00.000Z',
      picture: MOCK_AVATARS[bobEmail],
    },
    {
      email: charlieEmail,
      name: 'Demo Charlie',
      role: 'MEMBER',
      status: 'ACTIVE',
      addedBy: ownerEmail,
      joinedAt: '2026-09-20T11:30:00.000Z',
      picture: MOCK_AVATARS[charlieEmail],
    },
  ];

  const pendingInvites: PendingInvite[] = [
    {
      id: 'inv-david-01',
      invitedEmail: davidEmail,
      invitedByEmail: bobEmail,
      invitedByName: 'Demo Bob',
      status: 'PENDING',
      requestedAt: '2026-09-28T14:30:00.000Z',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-beach-villa',
      date: '2026-09-21',
      description: 'Beachside Villa Booking (3 Nights)',
      category: 'lodging',
      amount: 15000,
      currency: 'INR',
      paidBy: { [ownerEmail]: 15000 },
      splitType: 'EQUAL',
      splits: {
        [ownerEmail]: 5000,
        [bobEmail]: 5000,
        [charlieEmail]: 5000,
      },
      notes: 'Booked directly via Anjuna homestay',
      createdBy: ownerEmail,
      createdAt: '2026-09-21T12:00:00.000Z',
      status: 'ACTIVE',
    },
    {
      id: 'exp-curries-shack',
      date: '2026-09-22',
      description: "Dinner at Curlies Shack",
      category: 'food',
      amount: 3600,
      currency: 'INR',
      paidBy: { [bobEmail]: 3600 },
      splitType: 'EQUAL',
      splits: {
        [ownerEmail]: 1200,
        [bobEmail]: 1200,
        [charlieEmail]: 1200,
      },
      notes: 'Seafood platter and drinks',
      createdBy: bobEmail,
      createdAt: '2026-09-22T21:30:00.000Z',
      status: 'ACTIVE',
      history: [
        {
          id: 'edit-curlies-01',
          editedAt: '2026-09-23T08:15:00.000Z',
          editedBy: bobEmail,
          editedByName: 'Demo Bob',
          summary: 'Updated Amount and Notes',
          changes: [
            {
              field: 'amount',
              label: 'Amount',
              oldValue: '₹3,200.00',
              newValue: '₹3,600.00',
            },
            {
              field: 'notes',
              label: 'Notes',
              oldValue: 'Seafood platter',
              newValue: 'Seafood platter and drinks',
            },
          ],
        },
      ],
    },
    {
      id: 'exp-scooter-rental',
      date: '2026-09-23',
      description: 'Activa Rentals & Fuel',
      category: 'transport',
      amount: 2100,
      currency: 'INR',
      paidBy: { [charlieEmail]: 2100 },
      splitType: 'EQUAL',
      splits: {
        [ownerEmail]: 700,
        [bobEmail]: 700,
        [charlieEmail]: 700,
      },
      createdBy: charlieEmail,
      createdAt: '2026-09-23T10:00:00.000Z',
      status: 'ACTIVE',
    },
  ];

  const settlements: Settlement[] = [
    {
      id: 'set-bob-alice-01',
      date: '2026-09-24',
      payerEmail: bobEmail,
      payerName: 'Demo Bob',
      payeeEmail: ownerEmail,
      payeeName: 'Demo Alice (Owner)',
      amount: 2000,
      currency: 'INR',
      paymentMethod: 'UPI',
      notes: 'Paid via UPI to Demo Alice',
      recordedBy: bobEmail,
      createdAt: '2026-09-24T18:00:00.000Z',
      status: 'ACTIVE',
    },
  ];

  return {
    [goaId]: {
      id: goaId,
      name: '[SpreadSpends] Goa Vacation 2026',
      ownerEmail,
      sharedWith: [bobEmail, charlieEmail],
      tabs: {
        [SHEET_TABS.CONFIG]: serializeGroupConfig(config),
        [SHEET_TABS.MEMBERS]: serializeMembers(members),
        [SHEET_TABS.INVITES]: serializePendingInvites(pendingInvites),
        [SHEET_TABS.SETTLEMENTS]: serializeSettlements(settlements),
        [SHEET_TABS.ALL_EXPENSES]: [
          HEADERS.EXPENSES,
          [generateAllExpensesFormula([ownerEmail, bobEmail, charlieEmail])],
        ],
        [getMemberTabName(ownerEmail)]: [
          HEADERS.EXPENSES,
          serializeExpenseRow(expenses[0]),
        ],
        [getMemberTabName(bobEmail)]: [
          HEADERS.EXPENSES,
          serializeExpenseRow(expenses[1]),
        ],
        [getMemberTabName(charlieEmail)]: [
          HEADERS.EXPENSES,
          serializeExpenseRow(expenses[2]),
        ],
      },
    },
  };
}

class MockGoogleService {
  private sheets: Record<string, MockSpreadsheet> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        // Clean legacy v1 and v2 stores containing real-looking emails
        localStorage.removeItem('spread_spends_mock_data_v1');
        localStorage.removeItem('spread_spends_mock_data_v2');

        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.sheets = JSON.parse(raw);
          return;
        }
      } catch {
        // Fallback to default
      }
    }
    this.sheets = getInitialMockSpreadsheets();
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sheets));
      } catch {
        // Ignore quota/private mode errors
      }
    }
  }

  public resetMockData() {
    this.sheets = getInitialMockSpreadsheets();
    this.saveToStorage();
  }

  /**
   * Searches Drive for spreadsheets the user owns or has access to.
   */
  public async listSpreadSpendsFiles(userEmail: string): Promise<GoogleDriveFile[]> {
    return Object.values(this.sheets)
      .filter((s) => s.ownerEmail === userEmail || s.sharedWith.includes(userEmail))
      .map((s) => ({
        id: s.id,
        name: s.name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        webViewLink: `https://docs.google.com/spreadsheets/d/${s.id}/edit`,
        owners: [{ emailAddress: s.ownerEmail, displayName: s.ownerEmail.split('@')[0] }],
        shared: s.ownerEmail !== userEmail,
      }));
  }

  /**
   * Deletes a spreadsheet from the mock Drive.
   */
  public async deleteGroupSpreadsheet(sheetId: string): Promise<void> {
    delete this.sheets[sheetId];
    this.saveToStorage();
  }

  /**
   * Creates a new group spreadsheet in the mock Drive.
   */
  public async createGroupSpreadsheet(
    groupName: string,
    currency: string,
    owner: GoogleUser,
    initialMemberEmails: string[] = [],
    description?: string
  ): Promise<string> {
    const sheetId = `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const config: GroupConfig = {
      appSignature: 'Spread-Spends',
      schemaVersion: '1.0.0',
      groupId: sheetId,
      groupName,
      description,
      defaultCurrency: currency,
      ownerEmail: owner.email,
      createdAt: new Date().toISOString(),
    };

    const members: Member[] = [
      {
        email: owner.email,
        name: owner.name,
        role: 'OWNER',
        status: 'ACTIVE',
        addedBy: 'self',
        joinedAt: new Date().toISOString(),
        picture: owner.picture,
      },
    ];

    const sharedWith: string[] = [];
    for (const email of initialMemberEmails) {
      if (email && email !== owner.email) {
        members.push({
          email,
          name: email.split('@')[0],
          role: 'MEMBER',
          status: 'ACTIVE',
          addedBy: owner.email,
          joinedAt: new Date().toISOString(),
          picture: getMockUserAvatar(email),
        });
        sharedWith.push(email);
      }
    }

    const memberEmails = members.map((m) => m.email);
    const tabs: Record<string, string[][]> = {
      [SHEET_TABS.CONFIG]: serializeGroupConfig(config),
      [SHEET_TABS.MEMBERS]: serializeMembers(members),
      [SHEET_TABS.INVITES]: serializePendingInvites([]),
      [SHEET_TABS.SETTLEMENTS]: serializeSettlements([]),
      [SHEET_TABS.ALL_EXPENSES]: [
        HEADERS.EXPENSES,
        [generateAllExpensesFormula(memberEmails)],
      ],
    };

    for (const member of members) {
      tabs[getMemberTabName(member.email)] = [HEADERS.EXPENSES];
    }

    this.sheets[sheetId] = {
      id: sheetId,
      name: `[SpreadSpends] ${groupName}`,
      ownerEmail: owner.email,
      sharedWith,
      tabs,
    };

    this.saveToStorage();
    return sheetId;
  }

  /**
   * Updates group description in mock storage.
   */
  public async updateGroupDescription(sheetId: string, description: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) {
      throw new Error(`Spreadsheet with ID ${sheetId} not found in mock store`);
    }

    const config = deserializeGroupConfig(sheet.tabs[SHEET_TABS.CONFIG] || []);
    config.description = description;
    sheet.tabs[SHEET_TABS.CONFIG] = serializeGroupConfig(config);
    this.saveToStorage();
  }

  /**
   * Loads full group data across all member tabs.
   */
  public async loadGroupData(sheetId: string): Promise<{
    group: Group;
    expenses: Expense[];
    settlements: Settlement[];
  }> {
    const sheet = this.sheets[sheetId];
    if (!sheet) {
      throw new Error(`Spreadsheet with ID ${sheetId} not found in mock store`);
    }

    const config = deserializeGroupConfig(sheet.tabs[SHEET_TABS.CONFIG] || []);
    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    for (const m of members) {
      if (!m.picture) {
        m.picture = getMockUserAvatar(m.email);
      }
    }
    const pendingInvites = deserializePendingInvites(sheet.tabs[SHEET_TABS.INVITES] || []);
    const settlements = deserializeSettlements(sheet.tabs[SHEET_TABS.SETTLEMENTS] || []);

    // Gather all personal member tabs
    const tabsData: Array<{ tabName: string; rows: string[][] }> = [];
    for (const m of members) {
      const tabName = getMemberTabName(m.email);
      if (sheet.tabs[tabName]) {
        tabsData.push({ tabName, rows: sheet.tabs[tabName] });
      }
    }
    // Also include legacy Expenses tab if present
    if (sheet.tabs[SHEET_TABS.EXPENSES]) {
      tabsData.push({ tabName: SHEET_TABS.EXPENSES, rows: sheet.tabs[SHEET_TABS.EXPENSES] });
    }

    const expenses = deserializeMultiTabExpenses(tabsData);

    const group: Group = {
      id: sheetId,
      name: config.groupName,
      description: config.description,
      currency: config.defaultCurrency,
      ownerEmail: config.ownerEmail,
      createdAt: config.createdAt,
      members,
      pendingInvites,
      driveFileUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
    };

    return { group, expenses, settlements };
  }

  /**
   * Appends an expense row to the author's isolated personal tab (zero write contention).
   */
  public async appendExpense(sheetId: string, expense: Expense): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    const authorEmail = expense.createdBy || sheet.ownerEmail;
    const authorTab = getMemberTabName(authorEmail);

    if (!sheet.tabs[authorTab]) {
      sheet.tabs[authorTab] = [HEADERS.EXPENSES];
    }

    sheet.tabs[authorTab].push(serializeExpenseRow(expense));
    this.saveToStorage();
  }

  /**
   * Appends a settlement row.
   */
  public async appendSettlement(sheetId: string, settlement: Settlement): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    const setTab = sheet.tabs[SHEET_TABS.SETTLEMENTS] || [];
    setTab.push(serializeSettlementRow(settlement));
    sheet.tabs[SHEET_TABS.SETTLEMENTS] = setTab;
    this.saveToStorage();
  }

  /**
   * Updates an existing expense row and preserves history.
   */
  public async updateExpense(sheetId: string, expense: Expense): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    let updated = false;
    for (const [tabName, rows] of Object.entries(sheet.tabs)) {
      if (tabName.startsWith('Exp_') || tabName === SHEET_TABS.EXPENSES) {
        const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === expense.id);
        if (rowIndex !== -1) {
          rows[rowIndex] = serializeExpenseRow(expense);
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      throw new Error(`Expense with ID ${expense.id} not found in sheet`);
    }

    this.saveToStorage();
  }

  /**
   * Updates an existing settlement row and preserves history.
   */
  public async updateSettlement(sheetId: string, settlement: Settlement): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    const setTab = sheet.tabs[SHEET_TABS.SETTLEMENTS] || [];
    const rowIndex = setTab.findIndex((r, idx) => idx > 0 && r[0] === settlement.id);
    if (rowIndex === -1) {
      throw new Error(`Settlement with ID ${settlement.id} not found in sheet`);
    }

    setTab[rowIndex] = serializeSettlementRow(settlement);
    this.saveToStorage();
  }

  /**
   * Deletes an expense by marking its status as DELETED.
   */
  public async deleteExpense(sheetId: string, expenseId: string, editorEmail?: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    let updated = false;
    for (const [tabName, rows] of Object.entries(sheet.tabs)) {
      if (tabName.startsWith('Exp_') || tabName === SHEET_TABS.EXPENSES) {
        const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === expenseId);
        if (rowIndex !== -1) {
          const expense = deserializeExpenses([rows[0], rows[rowIndex]])[0];
          if (expense) {
            expense.status = 'DELETED';
            if (editorEmail) {
              const history = expense.history || [];
              history.push({
                id: `hist_del_${Date.now()}`,
                editedAt: new Date().toISOString(),
                editedBy: editorEmail,
                summary: 'Deleted expense',
                changes: [{ field: 'status', label: 'Status', oldValue: 'ACTIVE', newValue: 'DELETED' }],
              });
              expense.history = history;
            }
            rows[rowIndex] = serializeExpenseRow(expense);
            updated = true;
            break;
          }
        }
      }
    }

    if (!updated) {
      throw new Error(`Expense with ID ${expenseId} not found in sheet`);
    }

    this.saveToStorage();
  }

  /**
   * Deletes a settlement by marking its status as DELETED.
   */
  public async deleteSettlement(sheetId: string, settlementId: string, editorEmail?: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    const setTab = sheet.tabs[SHEET_TABS.SETTLEMENTS] || [];
    const rowIndex = setTab.findIndex((r, idx) => idx > 0 && r[0] === settlementId);
    if (rowIndex === -1) {
      throw new Error(`Settlement with ID ${settlementId} not found in sheet`);
    }

    const settlements = deserializeSettlements([setTab[0], setTab[rowIndex]]);
    const settlement = settlements[0];
    if (settlement) {
      settlement.status = 'DELETED';
      if (editorEmail) {
        const history = settlement.history || [];
        history.push({
          id: `hist_del_${Date.now()}`,
          editedAt: new Date().toISOString(),
          editedBy: editorEmail,
          summary: 'Deleted settlement',
          changes: [{ field: 'status', label: 'Status', oldValue: 'ACTIVE', newValue: 'DELETED' }],
        });
        settlement.history = history;
      }
      setTab[rowIndex] = serializeSettlementRow(settlement);
    }

    this.saveToStorage();
  }

  /**
   * Member proposes an invite (stored in Pending_Invites).
   */
  public async proposeInvite(sheetId: string, invite: PendingInvite): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    const currentInvites = deserializePendingInvites(sheet.tabs[SHEET_TABS.INVITES] || []);
    // Prevent duplicates
    if (currentInvites.some((inv) => inv.invitedEmail === invite.invitedEmail && inv.status === 'PENDING')) {
      throw new Error(`An invite is already pending for ${invite.invitedEmail}`);
    }

    currentInvites.push(invite);
    sheet.tabs[SHEET_TABS.INVITES] = serializePendingInvites(currentInvites);
    this.saveToStorage();
  }

  /**
   * Group owner approves a pending invite.
   * This simulates granting Google Drive writer permissions and moves the user to Members.
   */
  public async approveInvite(sheetId: string, inviteId: string, approverEmail: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');
    if (sheet.ownerEmail !== approverEmail) {
      throw new Error('Only the group owner can approve invites and grant Google Drive permissions');
    }

    const invites = deserializePendingInvites(sheet.tabs[SHEET_TABS.INVITES] || []);
    const target = invites.find((inv) => inv.id === inviteId);
    if (!target) throw new Error('Invite not found');

    target.status = 'APPROVED';
    target.approvedAt = new Date().toISOString();

    // Grant Drive permission
    if (!sheet.sharedWith.includes(target.invitedEmail)) {
      sheet.sharedWith.push(target.invitedEmail);
    }

    // Add to active members
    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    if (!members.some((m) => m.email === target.invitedEmail)) {
      members.push({
        email: target.invitedEmail,
        name: target.invitedEmail.split('@')[0],
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: approverEmail,
        joinedAt: new Date().toISOString(),
        picture: getMockUserAvatar(target.invitedEmail),
      });
    }

    // Provision personal tab for the new member
    const newMemberTab = getMemberTabName(target.invitedEmail);
    if (!sheet.tabs[newMemberTab]) {
      sheet.tabs[newMemberTab] = [HEADERS.EXPENSES];
    }

    // Update master formula
    sheet.tabs[SHEET_TABS.ALL_EXPENSES] = [
      HEADERS.EXPENSES,
      [generateAllExpensesFormula(members.map((m) => m.email))],
    ];

    sheet.tabs[SHEET_TABS.INVITES] = serializePendingInvites(invites);
    sheet.tabs[SHEET_TABS.MEMBERS] = serializeMembers(members);
    this.saveToStorage();
  }

  /**
   * Owner directly adds an invitee (bypasses pending state).
   */
  public async addDirectMember(sheetId: string, memberEmail: string, ownerEmail: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');

    if (!sheet.sharedWith.includes(memberEmail)) {
      sheet.sharedWith.push(memberEmail);
    }

    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    if (!members.some((m) => m.email === memberEmail)) {
      members.push({
        email: memberEmail,
        name: memberEmail.split('@')[0],
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: ownerEmail,
        joinedAt: new Date().toISOString(),
        picture: getMockUserAvatar(memberEmail),
      });
      const newMemberTab = getMemberTabName(memberEmail);
      if (!sheet.tabs[newMemberTab]) {
        sheet.tabs[newMemberTab] = [HEADERS.EXPENSES];
      }
      sheet.tabs[SHEET_TABS.ALL_EXPENSES] = [
        HEADERS.EXPENSES,
        [generateAllExpensesFormula(members.map((m) => m.email))],
      ];
      sheet.tabs[SHEET_TABS.MEMBERS] = serializeMembers(members);
      this.saveToStorage();
    }
  }

  /**
   * Updates a member's display name in mock storage.
   */
  public async updateMemberName(sheetId: string, email: string, newName: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) {
      throw new Error(`Spreadsheet with ID ${sheetId} not found in mock store`);
    }

    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    const target = members.find((m) => m.email === email);
    if (!target) {
      throw new Error(`Member with email ${email} not found`);
    }
    target.name = newName;
    sheet.tabs[SHEET_TABS.MEMBERS] = serializeMembers(members);
    this.saveToStorage();
  }

  /**
   * Soft-deletes a member in mock store: marks status 'INACTIVE' and removes from sharedWith.
   */
  public async softDeleteMember(sheetId: string, memberEmail: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');
    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    const target = members.find((m) => m.email.toLowerCase() === memberEmail.toLowerCase());
    if (!target) throw new Error(`Member ${memberEmail} not found`);
    if (target.role === 'OWNER') throw new Error('Cannot remove the group owner');

    target.status = 'INACTIVE';
    sheet.tabs[SHEET_TABS.MEMBERS] = serializeMembers(members);
    sheet.sharedWith = sheet.sharedWith.filter((e) => e.toLowerCase() !== memberEmail.toLowerCase());
    this.saveToStorage();
  }

  /**
   * Restores an inactive member in mock store: marks status 'ACTIVE' and restores to sharedWith.
   */
  public async restoreMember(sheetId: string, memberEmail: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) throw new Error('Sheet not found');
    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    const target = members.find((m) => m.email.toLowerCase() === memberEmail.toLowerCase());
    if (!target) throw new Error(`Member ${memberEmail} not found`);

    target.status = 'ACTIVE';
    sheet.tabs[SHEET_TABS.MEMBERS] = serializeMembers(members);
    if (!sheet.sharedWith.some((e) => e.toLowerCase() === memberEmail.toLowerCase())) {
      sheet.sharedWith.push(memberEmail);
    }
    this.saveToStorage();
  }

  /**
   * Audits mock permissions comparing sheet members against sharedWith.
   */
  public getMockSheet(sheetId: string): MockSpreadsheet | undefined {
    return this.sheets[sheetId];
  }

  public async auditDrivePermissions(sheetId: string): Promise<DriveDiscrepancy[]> {
    const sheet = this.sheets[sheetId];
    if (!sheet) return [];
    const members = deserializeMembers(sheet.tabs[SHEET_TABS.MEMBERS] || []);
    const discrepancies: DriveDiscrepancy[] = [];

    for (const m of members) {
      const hasDrive = sheet.sharedWith.some((e) => e.toLowerCase() === m.email.toLowerCase());
      if (m.status === 'ACTIVE' && m.role !== 'OWNER' && !hasDrive) {
        discrepancies.push({ email: m.email, name: m.name, type: 'MISSING_DRIVE_PERMISSION' });
      } else if (m.status === 'INACTIVE' && hasDrive) {
        discrepancies.push({
          email: m.email,
          name: m.name,
          type: 'INACTIVE_HAS_WRITE_ACCESS',
          permissionId: `mock-perm-${m.email}`,
        });
      }
    }

    // Check sharedWith users not present in sheet
    for (const email of sheet.sharedWith) {
      if (email.toLowerCase() === sheet.ownerEmail.toLowerCase()) continue;
      const inSheet = members.some((m) => m.email.toLowerCase() === email.toLowerCase());
      if (!inSheet) {
        discrepancies.push({
          email,
          name: email.split('@')[0],
          type: 'DRIVE_USER_NOT_IN_SHEET',
          permissionId: `mock-perm-${email}`,
        });
      }
    }

    return discrepancies;
  }

  public async removePermission(sheetId: string, permissionId: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) return;
    const emailPrefix = 'mock-perm-';
    if (permissionId.startsWith(emailPrefix)) {
      const email = permissionId.slice(emailPrefix.length);
      sheet.sharedWith = sheet.sharedWith.filter((e) => e.toLowerCase() !== email.toLowerCase());
      this.saveToStorage();
    }
  }

  public async shareSpreadsheetWithUser(sheetId: string, email: string): Promise<void> {
    const sheet = this.sheets[sheetId];
    if (!sheet) return;
    if (!sheet.sharedWith.some((e) => e.toLowerCase() === email.toLowerCase())) {
      sheet.sharedWith.push(email);
      this.saveToStorage();
    }
  }
}

export const mockGoogleService = new MockGoogleService();
