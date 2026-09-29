import type { GroupConfig, Member, PendingInvite } from '../types/group';
import type { Expense, Settlement, ExpenseCategory, SplitType, PaymentMethod } from '../types/transaction';

export const SHEET_TABS = {
  CONFIG: 'Group_Config',
  MEMBERS: 'Members',
  INVITES: 'Pending_Invites',
  ALL_EXPENSES: 'All_Expenses',
  EXPENSES: 'Expenses',
  SETTLEMENTS: 'Settlements',
} as const;

export const HEADERS = {
  CONFIG: ['Key', 'Value'],
  MEMBERS: ['Email', 'Display Name', 'Role', 'Status', 'Added By', 'Joined At'],
  INVITES: ['Invite ID', 'Invited Email', 'Invited By Email', 'Invited By Name', 'Status', 'Requested At', 'Approved At'],
  EXPENSES: [
    'ID',
    'Date',
    'Description',
    'Category',
    'Amount',
    'Currency',
    'Paid By (JSON)',
    'Split Type',
    'Split Details (JSON)',
    'Notes',
    'Created By',
    'Created At',
    'Status',
  ],
  SETTLEMENTS: [
    'ID',
    'Date',
    'Payer Email',
    'Payer Name',
    'Payee Email',
    'Payee Name',
    'Amount',
    'Currency',
    'Payment Method',
    'Notes',
    'Recorded By',
    'Created At',
    'Status',
  ],
};

/* ==================== Group Config ==================== */

export function serializeGroupConfig(config: GroupConfig): string[][] {
  const rows: string[][] = [
    HEADERS.CONFIG,
    ['app_signature', config.appSignature],
    ['schema_version', config.schemaVersion],
    ['group_id', config.groupId],
    ['group_name', config.groupName],
  ];

  if (config.description !== undefined) {
    rows.push(['group_description', config.description]);
  }

  rows.push(
    ['default_currency', config.defaultCurrency],
    ['owner_email', config.ownerEmail],
    ['created_at', config.createdAt]
  );

  return rows;
}

export function deserializeGroupConfig(rows: string[][]): GroupConfig {
  const map: Record<string, string> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[0]) {
      map[row[0].trim()] = (row[1] ?? '').trim();
    }
  }

  const result: GroupConfig = {
    appSignature: map['app_signature'] || 'Spread-Spends',
    schemaVersion: map['schema_version'] || '1.0.0',
    groupId: map['group_id'] || '',
    groupName: map['group_name'] || 'Unnamed Group',
    defaultCurrency: map['default_currency'] || 'USD',
    ownerEmail: map['owner_email'] || '',
    createdAt: map['created_at'] || new Date().toISOString(),
  };

  if ('group_description' in map) {
    result.description = map['group_description'];
  }

  return result;
}

/* ==================== Members ==================== */

export function serializeMembers(members: Member[]): string[][] {
  const hasPictures = members.some((m) => !!m.picture);
  const headers = hasPictures ? [...HEADERS.MEMBERS, 'Picture'] : HEADERS.MEMBERS;
  const rows: string[][] = [headers];
  for (const m of members) {
    const row = [
      m.email,
      m.name,
      m.role,
      m.status,
      m.addedBy,
      m.joinedAt,
    ];
    if (hasPictures) {
      row.push(m.picture || '');
    }
    rows.push(row);
  }
  return rows;
}

export function deserializeMembers(rows: string[][]): Member[] {
  if (!rows || rows.length <= 1) return [];
  const members: Member[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const member: Member = {
      email: r[0].trim(),
      name: (r[1] ?? '').trim() || r[0].trim(),
      role: (r[2] as Member['role']) || 'MEMBER',
      status: (r[3] as Member['status']) || 'ACTIVE',
      addedBy: (r[4] ?? '').trim(),
      joinedAt: (r[5] ?? '').trim() || new Date().toISOString(),
    };
    if (r[6] && r[6].trim()) {
      member.picture = r[6].trim();
    }
    members.push(member);
  }
  return members;
}

/* ==================== Pending Invites ==================== */

export function serializePendingInvites(invites: PendingInvite[]): string[][] {
  const rows: string[][] = [HEADERS.INVITES];
  for (const inv of invites) {
    rows.push([
      inv.id,
      inv.invitedEmail,
      inv.invitedByEmail,
      inv.invitedByName,
      inv.status,
      inv.requestedAt,
      inv.approvedAt || '',
    ]);
  }
  return rows;
}

export function deserializePendingInvites(rows: string[][]): PendingInvite[] {
  if (!rows || rows.length <= 1) return [];
  const invites: PendingInvite[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    invites.push({
      id: r[0].trim(),
      invitedEmail: (r[1] ?? '').trim(),
      invitedByEmail: (r[2] ?? '').trim(),
      invitedByName: (r[3] ?? '').trim(),
      status: (r[4] as PendingInvite['status']) || 'PENDING',
      requestedAt: (r[5] ?? '').trim() || new Date().toISOString(),
      approvedAt: r[6] ? r[6].trim() : undefined,
    });
  }
  return invites;
}

/* ==================== Expenses ==================== */

export function serializeExpenseRow(exp: Expense): string[] {
  return [
    exp.id,
    exp.date,
    exp.description,
    exp.category,
    exp.amount.toString(),
    exp.currency,
    JSON.stringify(exp.paidBy),
    exp.splitType,
    JSON.stringify(exp.splits),
    exp.notes || '',
    exp.createdBy,
    exp.createdAt,
    exp.status,
  ];
}

export function serializeExpenses(expenses: Expense[]): string[][] {
  const rows: string[][] = [HEADERS.EXPENSES];
  for (const exp of expenses) {
    rows.push(serializeExpenseRow(exp));
  }
  return rows;
}

export function deserializeExpenses(rows: string[][]): Expense[] {
  if (!rows || rows.length <= 1) return [];
  const expenses: Expense[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;

    let paidBy: Record<string, number> = {};
    try {
      paidBy = r[6] ? JSON.parse(r[6]) : {};
    } catch {
      // Fallback if cell has raw email
      if (r[6]) paidBy[r[6].trim()] = parseFloat(r[4]) || 0;
    }

    let splits: Record<string, number> = {};
    try {
      splits = r[8] ? JSON.parse(r[8]) : {};
    } catch {
      splits = {};
    }

    expenses.push({
      id: r[0].trim(),
      date: (r[1] ?? '').trim(),
      description: (r[2] ?? '').trim(),
      category: (r[3] as ExpenseCategory) || 'general',
      amount: parseFloat(r[4]) || 0,
      currency: (r[5] ?? 'USD').trim(),
      paidBy,
      splitType: (r[7] as SplitType) || 'EQUAL',
      splits,
      notes: r[9] ? r[9].trim() : undefined,
      createdBy: (r[10] ?? '').trim(),
      createdAt: (r[11] ?? '').trim() || new Date().toISOString(),
      status: (r[12] as Expense['status']) || 'ACTIVE',
    });
  }
  return expenses;
}

/* ==================== Settlements ==================== */

export function serializeSettlementRow(set: Settlement): string[] {
  return [
    set.id,
    set.date,
    set.payerEmail,
    set.payerName,
    set.payeeEmail,
    set.payeeName,
    set.amount.toString(),
    set.currency,
    set.paymentMethod,
    set.notes || '',
    set.recordedBy,
    set.createdAt,
    set.status,
  ];
}

export function serializeSettlements(settlements: Settlement[]): string[][] {
  const rows: string[][] = [HEADERS.SETTLEMENTS];
  for (const s of settlements) {
    rows.push(serializeSettlementRow(s));
  }
  return rows;
}

export function deserializeSettlements(rows: string[][]): Settlement[] {
  if (!rows || rows.length <= 1) return [];
  const settlements: Settlement[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;

    settlements.push({
      id: r[0].trim(),
      date: (r[1] ?? '').trim(),
      payerEmail: (r[2] ?? '').trim(),
      payerName: (r[3] ?? '').trim(),
      payeeEmail: (r[4] ?? '').trim(),
      payeeName: (r[5] ?? '').trim(),
      amount: parseFloat(r[6]) || 0,
      currency: (r[7] ?? 'USD').trim(),
      paymentMethod: (r[8] as PaymentMethod) || 'Cash',
      notes: r[9] ? r[9].trim() : undefined,
      recordedBy: (r[10] ?? '').trim(),
      createdAt: (r[11] ?? '').trim() || new Date().toISOString(),
      status: (r[12] as Settlement['status']) || 'ACTIVE',
    });
  }
  return settlements;
}

/* ==================== Per-Person Tabs & Master View ==================== */

/**
 * Generates a sanitized Google Sheets tab name for a member's isolated ledger.
 * Tab names cannot exceed 100 characters and cannot contain [ ] * ? : / \
 */
export function getMemberTabName(email: string): string {
  const sanitized = email.trim().replace(/[[\]*?:/\\]/g, '_').toLowerCase();
  return `Exp_${sanitized}`.slice(0, 100);
}

/**
 * Generates a native Google Sheets formula for the master All_Expenses tab.
 * Dynamically stacks all active member tabs using VSTACK, sorted by date descending.
 */
export function generateAllExpensesFormula(memberEmails: string[]): string {
  const validEmails = memberEmails.filter(Boolean);
  if (validEmails.length === 0) return '';
  if (validEmails.length === 1) {
    const tab = getMemberTabName(validEmails[0]);
    return `=IFERROR(SORT('${tab}'!A2:M, 2, FALSE), "")`;
  }
  const ranges = validEmails.map((e) => `'${getMemberTabName(e)}'!A2:M`);
  return `=IFERROR(SORT(VSTACK(${ranges.join(', ')}), 2, FALSE), "")`;
}

/**
 * Deserializes expenses across multiple member tabs, merging and sorting them chronologically.
 */
export function deserializeMultiTabExpenses(
  tabsData: Array<{ tabName: string; rows: string[][] }>
): Expense[] {
  const allExpenses: Expense[] = [];
  const seenIds = new Set<string>();

  for (const tab of tabsData) {
    const expenses = deserializeExpenses(tab.rows);
    for (const exp of expenses) {
      if (!seenIds.has(exp.id)) {
        seenIds.add(exp.id);
        allExpenses.push(exp);
      }
    }
  }

  // Sort descending: newest date/time first
  allExpenses.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime();
    const timeB = new Date(b.createdAt || b.date).getTime();
    return timeB - timeA;
  });

  return allExpenses;
}



