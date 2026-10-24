# Transactions Components

## Overview
Expense tracking and transaction history component stubs, providing backward-compatible re-exports for expense modals, audit history timelines, transaction items, and expense lists.

## Interface
- `AddExpenseModal`: Re-exported from `src/pages/group/expenses/AddExpenseModal`.
- `TransactionHistoryModal`: Re-exported from `src/pages/group/expenses/TransactionHistoryModal`.
- `TransactionItem`: Re-exported from `src/pages/group/expenses/TransactionItem`.
- `TransactionList`: Re-exported from `src/pages/group/expenses/TransactionList`.

## Invariants
- Maintains backward compatibility by forwarding all exports directly from `src/pages/group/expenses/`.

## Side Effects
- None directly; delegates to underlying expense page components.

## Verification
- Run: `bun test`
