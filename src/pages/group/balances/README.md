# Group Balances Tab

## Overview
Net balance visualization, per-member balance breakdown, and dual visual spending vs. consumption bars.

## Interface
- `BalancesSection(props: BalancesSectionProps): JSX.Element`
- `BalancesSummary(props: BalancesSummaryProps): JSX.Element | null`
- `MemberSpendings(props: MemberSpendingsProps): JSX.Element`
- `BalancesSectionProps`, `BalancesSummaryProps`, `MemberSpendingsProps`

## Invariants
- Current authenticated user's balance is hoisted to the top of the balances summary list.
- Net balance differences within 0.005 are treated as settled (0.00).
- Bar widths scale proportionally against `max(max(paid, consumed), 1)` across all group members.

## Side Effects
- Consumes `GroupContext` for `financialSummary`, `members`, `expenses`, and `currentUser`.
- Maintains local modal open state in `BalancesSection`.

## Verification
- Run: `bun test`
