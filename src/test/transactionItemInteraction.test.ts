import { describe, test, expect } from 'bun:test';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { TransactionHistoryModal } from '../components/transactions/TransactionHistoryModal';
import type { Expense, Settlement } from '../types/transaction';
import type { Member } from '../types/group';

describe('TransactionItem & History Modal Click & Edit Flow', () => {
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
  ];

  const sampleExpense: Expense = {
    id: 'exp-123',
    date: '2026-09-25',
    description: 'Team Dinner',
    amount: 120,
    currency: 'USD',
    category: 'food',
    paidBy: { 'alice@test.com': 120 },
    splitType: 'EQUAL',
    splits: { 'alice@test.com': 60, 'bob@test.com': 60 },
    createdBy: 'alice@test.com',
    createdAt: '2026-09-25T18:00:00.000Z',
    status: 'ACTIVE',
  };

  const sampleSettlement: Settlement = {
    id: 'set-456',
    date: '2026-09-26',
    payerEmail: 'bob@test.com',
    payerName: 'Bob Jones',
    payeeEmail: 'alice@test.com',
    payeeName: 'Alice Dev',
    amount: 60,
    currency: 'USD',
    paymentMethod: 'UPI',
    recordedBy: 'bob@test.com',
    createdAt: '2026-09-26T10:00:00.000Z',
    status: 'ACTIVE',
  };

  test('clicking expense card triggers onViewHistory to open history modal', () => {
    let viewedItem: unknown = null;
    const onViewHistory = (item: unknown) => {
      viewedItem = item;
    };

    const element = TransactionItem({
      item: { type: 'EXPENSE', data: sampleExpense },
      currentUserEmail: 'alice@test.com',
      currency: 'USD',
      members,
      onViewHistory,
    });

    expect(element.props.role).toBe('button');
    expect(element.props.tabIndex).toBe(0);

    // Simulate clicking the card
    element.props.onClick();
    expect(viewedItem).toEqual({ type: 'EXPENSE', data: sampleExpense });

    // Simulate keyboard navigation (Enter key)
    viewedItem = null;
    let preventedDefault = false;
    element.props.onKeyDown({
      key: 'Enter',
      preventDefault: () => {
        preventedDefault = true;
      },
    });
    expect(preventedDefault).toBe(true);
    expect(viewedItem).toEqual({ type: 'EXPENSE', data: sampleExpense });
  });

  test('clicking settlement card triggers onViewHistory to open history modal', () => {
    let viewedItem: unknown = null;
    const onViewHistory = (item: unknown) => {
      viewedItem = item;
    };

    const element = TransactionItem({
      item: { type: 'SETTLEMENT', data: sampleSettlement },
      currentUserEmail: 'alice@test.com',
      currency: 'USD',
      members,
      onViewHistory,
    });

    expect(element.props.role).toBe('button');
    expect(element.props.tabIndex).toBe(0);

    // Simulate clicking the settlement card
    element.props.onClick();
    expect(viewedItem).toEqual({ type: 'SETTLEMENT', data: sampleSettlement });
  });

  test('TransactionHistoryModal provides Edit Transaction action that invokes onOpenEdit', () => {
    let editOpened = false;
    let modalClosed = false;

    const modalElement = TransactionHistoryModal({
      isOpen: true,
      onClose: () => {
        modalClosed = true;
      },
      transaction: { type: 'EXPENSE', data: sampleExpense },
      members,
      currency: 'USD',
      onOpenEdit: () => {
        editOpened = true;
      },
    });

    expect(modalElement).not.toBeNull();
    // Verify modal has children and structure
    expect(modalElement!.props.isOpen).toBe(true);
    expect(modalElement!.props.title).toBe('Transaction Edit History');

    // Inside the modal body, the footer action triggers edit
    const modalBody = modalElement!.props.children;
    const footerActions = modalBody.props.children[2]; // Footer container
    const editBtn = footerActions.props.children[1]; // Edit button

    expect(editBtn).not.toBeNull();
    // Simulate clicking "Edit Transaction" in history modal
    editBtn.props.onClick();
    expect(modalClosed).toBe(true);
    expect(editOpened).toBe(true);
  });

  test('TransactionHistoryModal renders audit timeline when history is present', () => {
    const expenseWithHistory: Expense = {
      ...sampleExpense,
      history: [
        {
          id: 'rev-1',
          editedAt: '2026-09-26T12:00:00.000Z',
          editedBy: 'bob@test.com',
          editedByName: 'Bob Jones',
          summary: 'Updated Amount from $120.00 to $150.00',
          changes: [
            {
              field: 'amount',
              label: 'Amount',
              oldValue: '$120.00',
              newValue: '$150.00',
            },
          ],
        },
      ],
    };

    const modalElement = TransactionHistoryModal({
      isOpen: true,
      onClose: () => {},
      transaction: { type: 'EXPENSE', data: expenseWithHistory },
      members,
      currency: 'USD',
      onOpenEdit: () => {},
    });

    expect(modalElement).not.toBeNull();
    const modalBody = modalElement!.props.children;
    const timelineSection = modalBody.props.children[1];
    const timelineContent = timelineSection.props.children[1];
    // With 1 edit, the timeline container with revision nodes is rendered
    expect(timelineContent.props.className).toContain('pl-6 space-y-6');
  });

  test('formatTransactionDateTime formats date as DD MMM, YYYY and time as HH:MM:SS', async () => {
    const { formatTransactionDateTime, combineDateAndTime, extractTimeFromTimestamp } = await import('../core/dateTime');

    // 1. Direct format
    const dt = formatTransactionDateTime('2026-09-22', '2026-09-22T14:30:45.000Z');
    expect(dt.date).toBe('22 Sep, 2026');
    expect(dt.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(dt.full).toContain('22 Sep, 2026 • ');

    // 2. Combine and extract
    const combinedIso = combineDateAndTime('2026-10-05', '16:45:30');
    const extractedTime = extractTimeFromTimestamp(combinedIso);
    expect(extractedTime).toBe('16:45:30');

    const combinedDt = formatTransactionDateTime('2026-10-05', combinedIso);
    expect(combinedDt.date).toBe('05 Oct, 2026');
    expect(combinedDt.time).toBe('16:45:30');
    expect(combinedDt.full).toBe('05 Oct, 2026 • 16:45:30');

    // 3. Serial date handling (e.g. from Google Sheets)
    const serialDt = formatTransactionDateTime('46288');
    expect(serialDt.date).toBe('23 Sep, 2026');
  });
});

