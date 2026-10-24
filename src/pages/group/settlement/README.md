# Group Settlement Tab

## Overview
Debt simplification display, suggested settlements between members, and payment recording modal with audit history tracking.

## Interface
- `SettlementSection(props: SettlementSectionProps): JSX.Element`
- `SimplifiedDebtsList(props: SimplifiedDebtsListProps): JSX.Element`
- `SettleUpModal(props: SettleUpModalProps): JSX.Element`
- `SettlementSectionProps`, `SimplifiedDebtsListProps`, `SettleUpModalProps`

## Invariants
- Payer and payee must be distinct members.
- Payment amount must be strictly greater than 0 and rounded to two decimal places.
- Modifying an existing settlement computes an audit diff and appends it to `settlement.history`.

## Side Effects
- Calls `onAddSettlement` / `useGroupDetail().addSettlement` or `onEditSettlement` to persist transactions to Google Sheets.
- Dispatches `openSettleUp` via `GroupContext`.

## Verification
- Run: `bun test`
