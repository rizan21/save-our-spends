import type { GoogleDriveFile } from '../types/google';
import type { Group, PendingInvite } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';
import { googleAuthService } from './googleAuth';
import { googleDriveService } from './googleDrive';
import { googleSheetsService } from './googleSheets';
import { mockGoogleService } from './mockGoogleService';
import {
  deserializeGroupConfig,
  deserializeMembers,
  deserializePendingInvites,
  deserializeSettlements,
  deserializeMultiTabExpenses,
  getMemberTabName,
  serializeExpenseRow,
  serializeMembers,
  serializePendingInvites,
  serializeSettlementRow,
  SHEET_TABS,
} from '../core/sheetSerializer';
import { pushNotificationService } from './pushNotificationService';


export class GroupService {
  private getAuthToken(): string {
    const token = googleAuthService.getAccessToken();
    if (!token && !googleAuthService.getIsDemoMode()) {
      throw new Error('You must be signed in with Google to perform this action.');
    }
    return token || '';
  }

  /**
   * Discovers and lists all SpreadSpends groups available to the user.
   */
  public async listGroups(userEmail: string): Promise<GoogleDriveFile[]> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.listSpreadSpendsFiles(userEmail);
    }
    const token = this.getAuthToken();
    return await googleDriveService.listSpreadSpendsFiles(token);
  }

  /**
   * Creates a new group spreadsheet on the group owner's Google account.
   */
  public async createGroup(
    name: string,
    currency: string,
    initialMembers: string[] = [],
    description?: string
  ): Promise<string> {
    const user = googleAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User must be logged in to create a group.');
    }

    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.createGroupSpreadsheet(name, currency, user, initialMembers, description);
    }

    const token = this.getAuthToken();
    const sheetId = await googleSheetsService.createGroupSpreadsheet(
      token,
      name,
      currency,
      user,
      initialMembers,
      description
    );

    // Grant edit permissions to initial members
    for (const email of initialMembers) {
      if (email && email !== user.email) {
        try {
          await googleDriveService.grantPermission(token, sheetId, email, 'writer');
        } catch (err) {
          console.error(`Failed to grant permission to ${email}:`, err);
        }
      }
    }

    return sheetId;
  }

  /**
   * Loads complete group state: config, members, invites, expenses (across personal tabs), and settlements.
   */
  public async loadGroup(sheetId: string): Promise<{
    group: Group;
    expenses: Expense[];
    settlements: Settlement[];
  }> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.loadGroupData(sheetId);
    }

    const token = this.getAuthToken();

    // 1. Fetch metadata tabs and drive permissions in parallel
    const [configRows, memberRows, inviteRows, settlementRows, drivePermissions] = await Promise.all([
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.CONFIG),
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.MEMBERS),
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.INVITES),
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.SETTLEMENTS),
      googleDriveService.getFilePermissions(token, sheetId).catch(() => []),
    ]);

    const config = deserializeGroupConfig(configRows);
    const members = deserializeMembers(memberRows);
    const pendingInvites = deserializePendingInvites(inviteRows);
    const settlements = deserializeSettlements(settlementRows);

    // Build permissions photo map
    const permPhotoMap = new Map<string, string>();
    for (const p of drivePermissions) {
      if (p.emailAddress && p.photoLink) {
        permPhotoMap.set(p.emailAddress.toLowerCase(), p.photoLink);
      }
    }

    const currentUser = googleAuthService.getCurrentUser();
    let memberRowsNeedUpdate = false;

    for (const m of members) {
      const emailLower = m.email.toLowerCase();
      // Sync current user's Google picture if available
      if (currentUser && currentUser.email.toLowerCase() === emailLower && currentUser.picture) {
        if (m.picture !== currentUser.picture) {
          m.picture = currentUser.picture;
          memberRowsNeedUpdate = true;
        }
      } else if (!m.picture && permPhotoMap.has(emailLower)) {
        m.picture = permPhotoMap.get(emailLower);
      }
    }

    // If current user's picture was updated/added, sync back to the Members tab
    if (memberRowsNeedUpdate) {
      const serialized = serializeMembers(members);
      googleSheetsService.updateSheetRange(
        token,
        sheetId,
        `${SHEET_TABS.MEMBERS}!A1:G${serialized.length}`,
        serialized
      ).catch((err) => console.warn('Could not sync member profile picture to sheet:', err));
    }

    // 2. Fetch all personal member tabs (and fallback to legacy Expenses tab if needed)
    const memberRanges = members.map((m) => `${getMemberTabName(m.email)}!A1:Z500`);
    let tabsData: Array<{ tabName: string; rows: string[][] }> = [];

    if (memberRanges.length > 0) {
      try {
        const batchResult = await googleSheetsService.batchReadTabs(token, sheetId, memberRanges);
        tabsData = batchResult.map((res) => {
          const rawTab = res.range.split('!')[0] || '';
          const tabName = rawTab.replace(/^'|'$/g, '');
          return {
            tabName,
            rows: res.values,
          };
        });
      } catch {
        // If batchReadTabs failed (e.g. some member tabs not yet provisioned)
        // Attempt to read each member tab individually
        const individualResults = await Promise.allSettled(
          members.map(async (m) => {
            const tabName = getMemberTabName(m.email);
            const rows = await googleSheetsService.readTab(token, sheetId, tabName);
            return { tabName, rows };
          })
        );
        for (const res of individualResults) {
          if (res.status === 'fulfilled' && res.value.rows) {
            tabsData.push(res.value);
          }
        }
      }
    }

    // If no member tabs found or returning data, check for legacy Expenses tab (schema v1)
    if (tabsData.length === 0) {
      try {
        const legacyExpenses = await googleSheetsService.readTab(token, sheetId, SHEET_TABS.EXPENSES);
        if (legacyExpenses && legacyExpenses.length > 0) {
          tabsData = [{ tabName: SHEET_TABS.EXPENSES, rows: legacyExpenses }];
        }
      } catch {
        tabsData = [];
      }
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
   * Updates group description in the group spreadsheet config.
   */
  public async updateGroupDescription(sheetId: string, description: string): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.updateGroupDescription(sheetId, description);
    }
    const token = this.getAuthToken();
    return await googleSheetsService.updateGroupDescription(token, sheetId, description);
  }

  /**
   * Updates a member's display name in the group spreadsheet.
   */
  public async updateMemberName(sheetId: string, email: string, newName: string): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.updateMemberName(sheetId, email, newName);
    }
    const token = this.getAuthToken();
    return await googleSheetsService.updateMemberName(token, sheetId, email, newName);
  }

  /**
   * Appends an expense to the logging user's isolated personal tab (zero write contention).
   */
  public async addExpense(sheetId: string, expense: Expense): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.appendExpense(sheetId, expense);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: expense.createdBy,
        action: 'TRANSACTION_ADDED',
        summary: `${expense.createdBy?.split('@')[0] || 'Someone'} added "${expense.description}" (${expense.currency} ${expense.amount})`,
      }).catch(() => {});
      return;
    }

    const token = this.getAuthToken();
    const authorEmail = expense.createdBy || googleAuthService.getCurrentUser()?.email;
    if (!authorEmail) {
      throw new Error('Expense author is required');
    }

    const targetTab = getMemberTabName(authorEmail);
    const row = serializeExpenseRow(expense);

    try {
      await googleSheetsService.appendRow(token, sheetId, targetTab, row);
    } catch {
      // Provision personal tab if not yet present
      await googleSheetsService.addMemberTab(token, sheetId, authorEmail);
      await googleSheetsService.appendRow(token, sheetId, targetTab, row);
    }

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: authorEmail,
      action: 'TRANSACTION_ADDED',
      summary: `${authorEmail.split('@')[0]} added "${expense.description}" (${expense.currency} ${expense.amount})`,
    }).catch(() => {});
  }

  /**
   * Appends a settlement payment to the group spreadsheet.
   */
  public async addSettlement(sheetId: string, settlement: Settlement): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.appendSettlement(sheetId, settlement);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: settlement.payerEmail,
        action: 'TRANSACTION_ADDED',
        summary: `${settlement.payerName || settlement.payerEmail} paid ${settlement.payeeName || settlement.payeeEmail} (${settlement.currency} ${settlement.amount})`,
      }).catch(() => {});
      return;
    }

    const token = this.getAuthToken();
    const row = serializeSettlementRow(settlement);
    await googleSheetsService.appendRow(token, sheetId, SHEET_TABS.SETTLEMENTS, row);

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: settlement.payerEmail,
      action: 'TRANSACTION_ADDED',
      summary: `${settlement.payerName || settlement.payerEmail} paid ${settlement.payeeName || settlement.payeeEmail} (${settlement.currency} ${settlement.amount})`,
    }).catch(() => {});
  }

  /**
   * Updates an existing expense and records its change history.
   */
  public async updateExpense(sheetId: string, expense: Expense): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.updateExpense(sheetId, expense);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: expense.createdBy,
        action: 'TRANSACTION_MODIFIED',
        summary: `${expense.createdBy?.split('@')[0] || 'Someone'} updated "${expense.description}"`,
      }).catch(() => {});
      return;
    }

    const token = this.getAuthToken();
    await googleSheetsService.updateExpense(token, sheetId, expense);

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: expense.createdBy,
      action: 'TRANSACTION_MODIFIED',
      summary: `${expense.createdBy?.split('@')[0] || 'Someone'} updated "${expense.description}"`,
    }).catch(() => {});
  }

  /**
   * Deletes an existing expense by marking its status as DELETED.
   */
  public async deleteExpense(sheetId: string, expenseId: string, editorEmail?: string): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.deleteExpense(sheetId, expenseId, editorEmail);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: editorEmail,
        action: 'TRANSACTION_REMOVED',
        summary: `${editorEmail?.split('@')[0] || 'Someone'} deleted an expense`,
      }).catch(() => {});
      return;
    }

    const groupData = await this.loadGroup(sheetId);
    const target = groupData.expenses.find((e) => e.id === expenseId);
    if (!target) {
      throw new Error(`Expense with ID ${expenseId} not found`);
    }

    target.status = 'DELETED';
    if (editorEmail) {
      const history = target.history || [];
      history.push({
        id: `hist_del_${Date.now()}`,
        editedAt: new Date().toISOString(),
        editedBy: editorEmail,
        summary: 'Deleted expense',
        changes: [{ field: 'status', label: 'Status', oldValue: 'ACTIVE', newValue: 'DELETED' }],
      });
      target.history = history;
    }

    const token = this.getAuthToken();
    await googleSheetsService.updateExpense(token, sheetId, target);

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: editorEmail,
      action: 'TRANSACTION_REMOVED',
      summary: `${editorEmail?.split('@')[0] || 'Someone'} deleted an expense`,
    }).catch(() => {});
  }

  /**
   * Updates an existing settlement and records its change history.
   */
  public async updateSettlement(sheetId: string, settlement: Settlement): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.updateSettlement(sheetId, settlement);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: settlement.payerEmail,
        action: 'TRANSACTION_MODIFIED',
        summary: `Settlement updated: ${settlement.payerName} paid ${settlement.payeeName}`,
      }).catch(() => {});
      return;
    }

    const token = this.getAuthToken();
    await googleSheetsService.updateSettlement(token, sheetId, settlement);

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: settlement.payerEmail,
      action: 'TRANSACTION_MODIFIED',
      summary: `Settlement updated: ${settlement.payerName} paid ${settlement.payeeName}`,
    }).catch(() => {});
  }

  /**
   * Deletes an existing settlement by marking its status as DELETED.
   */
  public async deleteSettlement(sheetId: string, settlementId: string, editorEmail?: string): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      await mockGoogleService.deleteSettlement(sheetId, settlementId, editorEmail);
      pushNotificationService.notifyGroupMembers({
        groupId: sheetId,
        actorEmail: editorEmail,
        action: 'TRANSACTION_REMOVED',
        summary: `${editorEmail?.split('@')[0] || 'Someone'} deleted a settlement`,
      }).catch(() => {});
      return;
    }

    const groupData = await this.loadGroup(sheetId);
    const target = groupData.settlements.find((s) => s.id === settlementId);
    if (!target) {
      throw new Error(`Settlement with ID ${settlementId} not found`);
    }

    target.status = 'DELETED';
    if (editorEmail) {
      const history = target.history || [];
      history.push({
        id: `hist_del_${Date.now()}`,
        editedAt: new Date().toISOString(),
        editedBy: editorEmail,
        summary: 'Deleted settlement',
        changes: [{ field: 'status', label: 'Status', oldValue: 'ACTIVE', newValue: 'DELETED' }],
      });
      target.history = history;
    }

    const token = this.getAuthToken();
    await googleSheetsService.updateSettlement(token, sheetId, target);

    pushNotificationService.notifyGroupMembers({
      groupId: sheetId,
      actorEmail: editorEmail,
      action: 'TRANSACTION_REMOVED',
      summary: `${editorEmail?.split('@')[0] || 'Someone'} deleted a settlement`,
    }).catch(() => {});
  }

  /**
   * Extensible invite: Propose a new invite (lands in Pending_Invites).
   */
  public async proposeInvite(sheetId: string, invite: PendingInvite): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.proposeInvite(sheetId, invite);
    }

    const token = this.getAuthToken();
    const inviteRows = await googleSheetsService.readTab(token, sheetId, SHEET_TABS.INVITES);
    const current = deserializePendingInvites(inviteRows);

    if (current.some((inv) => inv.invitedEmail === invite.invitedEmail && inv.status === 'PENDING')) {
      throw new Error(`An invite is already pending for ${invite.invitedEmail}`);
    }

    current.push(invite);
    await googleSheetsService.updateSheetRange(
      token,
      sheetId,
      `${SHEET_TABS.INVITES}!A1:G${current.length + 1}`,
      serializePendingInvites(current)
    );
  }

  /**
   * Extensible invite: Owner approves a pending invite.
   * 1. Calls Google Drive API to grant 'writer' permission to the invited email.
   * 2. Promotes the user into the 'Members' tab.
   * 3. Updates 'Pending_Invites' row to 'APPROVED'.
   * 4. Provisions the member's personal tab and updates All_Expenses formula.
   */
  public async approveInvite(
    sheetId: string,
    inviteId: string,
    approverEmail: string
  ): Promise<void> {
    if (googleAuthService.getIsDemoMode()) {
      return await mockGoogleService.approveInvite(sheetId, inviteId, approverEmail);
    }

    const token = this.getAuthToken();

    // 1. Read invites and members
    const [inviteRows, memberRows] = await Promise.all([
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.INVITES),
      googleSheetsService.readTab(token, sheetId, SHEET_TABS.MEMBERS),
    ]);

    const invites = deserializePendingInvites(inviteRows);
    const target = invites.find((i) => i.id === inviteId);
    if (!target) {
      throw new Error('Invite not found');
    }

    // 2. Execute Google Drive permission grant
    await googleDriveService.grantPermission(token, sheetId, target.invitedEmail, 'writer');

    // 3. Mark approved
    target.status = 'APPROVED';
    target.approvedAt = new Date().toISOString();

    // 4. Add to active members
    const members = deserializeMembers(memberRows);
    if (!members.some((m) => m.email === target.invitedEmail)) {
      members.push({
        email: target.invitedEmail,
        name: target.invitedEmail.split('@')[0],
        role: 'MEMBER',
        status: 'ACTIVE',
        addedBy: approverEmail,
        joinedAt: new Date().toISOString(),
      });
    }

    // 5. Update both tabs
    await Promise.all([
      googleSheetsService.updateSheetRange(
        token,
        sheetId,
        `${SHEET_TABS.INVITES}!A1:G${invites.length + 1}`,
        serializePendingInvites(invites)
      ),
      googleSheetsService.updateSheetRange(
        token,
        sheetId,
        `${SHEET_TABS.MEMBERS}!A1:G${members.length + 1}`,
        serializeMembers(members)
      ),
    ]);

    // 6. Provision new member's personal tab and update master formula
    try {
      await googleSheetsService.addMemberTab(token, sheetId, target.invitedEmail);
      await googleSheetsService.updateAllExpensesFormula(
        token,
        sheetId,
        members.map((m) => m.email)
      );
    } catch (err) {
      console.warn('Failed to provision member tab or update master formula:', err);
    }
  }
}

export const groupService = new GroupService();
