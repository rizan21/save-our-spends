# Group Expenses Tab

## Overview
Comprehensive transaction management, filtered expense/settlement feeds, 3-step expense creation/edit wizard (equal, exact, percentage, shares), and audit trail diff modals.

## Interface
- `ExpensesSection(props: ExpensesSectionProps): JSX.Element`
- `TransactionList(props: TransactionListProps): JSX.Element`
- `TransactionItem(props: TransactionItemProps): JSX.Element`
- `type UnifiedTransactionItem`
- `AddExpenseModal(props: AddExpenseModalProps): JSX.Element`
- `TransactionHistoryModal(props: TransactionHistoryModalProps): JSX.Element | null`
- Component Props: `ExpensesSectionProps`, `TransactionListProps`, `TransactionItemProps`, `AddExpenseModalProps`, `TransactionHistoryModalProps`

## Invariants
- Payer amounts (`paidBy`) must exactly equal total expense amount before transitioning to Step 3.
- Split sum (`splits`) must balance with the total amount for `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARES` modes.
- Deleted transactions (`status === 'DELETED'`) are filtered out of active lists.
- Editing an expense preserves previous revisions in history and logs editor metadata.

## Side Effects
- Mutates group transactions via `addExpense`, `updateExpense`, `deleteExpense`, `updateSettlement`, `deleteSettlement`.
- Prompts window confirmation dialog on transaction deletion.
- Interacts with `GroupContext` for navigation and transaction viewing.

## Verification
- Run: `bun test`
