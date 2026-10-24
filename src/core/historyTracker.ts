import type {
  Expense,
  Settlement,
  ChangeDetail,
  EditHistoryRecord,
  SplitType,
} from '../types/transaction';
import type { Member } from '../types/group';
import { formatCurrency, roundToCents } from './splitCalculator';
import { formatTransactionDateTime } from './dateTime';

function getMemberName(email: string, members: Member[] = []): string {
  const member = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
  return member?.name || email.split('@')[0];
}

function formatPaidBy(paidBy: Record<string, number>, currency: string, members: Member[] = []): string {
  const entries = Object.entries(paidBy || {})
    .filter(([, amt]) => amt > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return 'Nobody';
  return entries
    .map(([email, amt]) => `${getMemberName(email, members)} (${formatCurrency(amt, currency)})`)
    .join(', ');
}

function formatSplits(
  splitType: SplitType,
  splits: Record<string, number>,
  currency: string,
  members: Member[] = []
): string {
  const entries = Object.entries(splits || {})
    .filter(([, amt]) => amt > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (splitType === 'EQUAL') {
    const names = entries.map(([email]) => getMemberName(email, members)).join(', ');
    return `Equal (${entries.length} people: ${names})`;
  }
  const breakdown = entries
    .map(([email, amt]) => `${getMemberName(email, members)}: ${formatCurrency(amt, currency)}`)
    .join(', ');
  return `${splitType} (${breakdown})`;
}

export function formatChangeSummary(changes: ChangeDetail[]): string {
  if (changes.length === 0) return 'No changes';
  if (changes.length === 1) {
    const c = changes[0];
    return `Updated ${c.label} from ${c.oldValue} to ${c.newValue}`;
  }
  const formattedLabels = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
    changes.map((c) => c.label)
  );
  return `Updated ${formattedLabels}`;
}

/**
 * Computes a detailed diff between the original and edited expense.
 * Returns an EditHistoryRecord if there were actual changes, or null if identical.
 */
export function computeExpenseDiff(
  original: Expense,
  updated: Expense,
  editorEmail: string,
  editorName?: string,
  members: Member[] = []
): EditHistoryRecord | null {
  const changes: ChangeDetail[] = [];
  const currency = updated.currency || original.currency || 'USD';

  // 1. Amount
  if (roundToCents(original.amount) !== roundToCents(updated.amount)) {
    changes.push({
      field: 'amount',
      label: 'Amount',
      oldValue: formatCurrency(original.amount, original.currency || currency),
      newValue: formatCurrency(updated.amount, currency),
    });
  }

  // 2. Description
  if (original.description.trim() !== updated.description.trim()) {
    changes.push({
      field: 'description',
      label: 'Description',
      oldValue: original.description.trim(),
      newValue: updated.description.trim(),
    });
  }

  // 3. Category
  if (original.category !== updated.category) {
    changes.push({
      field: 'category',
      label: 'Category',
      oldValue: original.category,
      newValue: updated.category,
    });
  }

  // 4. Date
  if (original.date !== updated.date) {
    changes.push({
      field: 'date',
      label: 'Date',
      oldValue: original.date,
      newValue: updated.date,
    });
  }

  // 4b. Time
  if (original.createdAt && updated.createdAt) {
    const oldTime = formatTransactionDateTime(original.date, original.createdAt).time;
    const newTime = formatTransactionDateTime(updated.date, updated.createdAt).time;
    if (oldTime && newTime && oldTime !== newTime) {
      changes.push({
        field: 'time',
        label: 'Time',
        oldValue: oldTime,
        newValue: newTime,
      });
    }
  }

  // 5. Notes
  const oldNotes = (original.notes || '').trim();
  const newNotes = (updated.notes || '').trim();
  if (oldNotes !== newNotes) {
    changes.push({
      field: 'notes',
      label: 'Notes',
      oldValue: oldNotes || '(none)',
      newValue: newNotes || '(none)',
    });
  }

  // 6. Paid By
  const allPaidEmails = Array.from(
    new Set([...Object.keys(original.paidBy || {}), ...Object.keys(updated.paidBy || {})])
  );
  const hasPaidChanged = allPaidEmails.some(
    (email) => roundToCents(original.paidBy?.[email] || 0) !== roundToCents(updated.paidBy?.[email] || 0)
  );
  if (hasPaidChanged) {
    const originalPaidFormatted = formatPaidBy(original.paidBy, original.currency || currency, members);
    const updatedPaidFormatted = formatPaidBy(updated.paidBy, currency, members);
    changes.push({
      field: 'paidBy',
      label: 'Paid by',
      oldValue: originalPaidFormatted,
      newValue: updatedPaidFormatted,
    });
  }

  // 7. Split Method and Allocation
  const allSplitEmails = Array.from(
    new Set([...Object.keys(original.splits || {}), ...Object.keys(updated.splits || {})])
  );
  const hasSplitsChanged =
    original.splitType !== updated.splitType ||
    allSplitEmails.some(
      (email) => roundToCents(original.splits?.[email] || 0) !== roundToCents(updated.splits?.[email] || 0)
    );
  if (hasSplitsChanged) {
    const originalSplitsFormatted = formatSplits(original.splitType, original.splits, original.currency || currency, members);
    const updatedSplitsFormatted = formatSplits(updated.splitType, updated.splits, currency, members);
    changes.push({
      field: 'splits',
      label: 'Split method',
      oldValue: originalSplitsFormatted,
      newValue: updatedSplitsFormatted,
    });
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    editedAt: new Date().toISOString(),
    editedBy: editorEmail,
    editedByName: editorName || getMemberName(editorEmail, members),
    summary: formatChangeSummary(changes),
    changes,
  };
}

/**
 * Computes a detailed diff between the original and edited settlement.
 * Returns an EditHistoryRecord if there were actual changes, or null if identical.
 */
export function computeSettlementDiff(
  original: Settlement,
  updated: Settlement,
  editorEmail: string,
  editorName?: string,
  members: Member[] = []
): EditHistoryRecord | null {
  const changes: ChangeDetail[] = [];
  const currency = updated.currency || original.currency || 'USD';

  // 1. Amount
  if (roundToCents(original.amount) !== roundToCents(updated.amount)) {
    changes.push({
      field: 'amount',
      label: 'Amount',
      oldValue: formatCurrency(original.amount, original.currency || currency),
      newValue: formatCurrency(updated.amount, currency),
    });
  }

  // 2. Payer
  if (original.payerEmail.toLowerCase() !== updated.payerEmail.toLowerCase()) {
    changes.push({
      field: 'payerEmail',
      label: 'Payer',
      oldValue: getMemberName(original.payerEmail, members),
      newValue: getMemberName(updated.payerEmail, members),
    });
  }

  // 3. Payee
  if (original.payeeEmail.toLowerCase() !== updated.payeeEmail.toLowerCase()) {
    changes.push({
      field: 'payeeEmail',
      label: 'Payee',
      oldValue: getMemberName(original.payeeEmail, members),
      newValue: getMemberName(updated.payeeEmail, members),
    });
  }

  // 4. Payment Method
  if (original.paymentMethod !== updated.paymentMethod) {
    changes.push({
      field: 'paymentMethod',
      label: 'Payment method',
      oldValue: original.paymentMethod,
      newValue: updated.paymentMethod,
    });
  }

  // 5. Date
  if (original.date !== updated.date) {
    changes.push({
      field: 'date',
      label: 'Date',
      oldValue: original.date,
      newValue: updated.date,
    });
  }

  // 5b. Time
  if (original.createdAt && updated.createdAt) {
    const oldTime = formatTransactionDateTime(original.date, original.createdAt).time;
    const newTime = formatTransactionDateTime(updated.date, updated.createdAt).time;
    if (oldTime && newTime && oldTime !== newTime) {
      changes.push({
        field: 'time',
        label: 'Time',
        oldValue: oldTime,
        newValue: newTime,
      });
    }
  }

  // 6. Notes
  const oldNotes = (original.notes || '').trim();
  const newNotes = (updated.notes || '').trim();
  if (oldNotes !== newNotes) {
    changes.push({
      field: 'notes',
      label: 'Notes',
      oldValue: oldNotes || '(none)',
      newValue: newNotes || '(none)',
    });
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    editedAt: new Date().toISOString(),
    editedBy: editorEmail,
    editedByName: editorName || getMemberName(editorEmail, members),
    summary: formatChangeSummary(changes),
    changes,
  };
}
