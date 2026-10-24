# Settlements Components

## Overview
Debt settlement and balance visualization component stubs, providing backward-compatible re-exports for net balances, member spending bars, debt simplification lists, and settlement modals.

## Interface
- `BalancesSummary`: Re-exported from `src/pages/group/balances/BalancesSummary`.
- `MemberSpendings`: Re-exported from `src/pages/group/balances/MemberSpendings`.
- `SettleUpModal`: Re-exported from `src/pages/group/settlement/SettleUpModal`.
- `SimplifiedDebtsList`: Re-exported from `src/pages/group/settlement/SimplifiedDebtsList`.

## Invariants
- Maintains backward compatibility by forwarding all exports directly from `src/pages/group/balances/` and `src/pages/group/settlement/`.

## Side Effects
- None directly; delegates to underlying balance and settlement page components.

## Verification
- Run: `bun test`
