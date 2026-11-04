# Router

## Overview
Client-side hash-based routing module for Spread-Spends. Manages application navigation state between the top-level groups list and individual group detail views (including active tab selection) by synchronizing with window location hash change events.

## Interface
- `AppRoute`: Discriminated union type representing navigation states (`{ page: 'groups' }`, `{ page: 'group'; groupId: string; tab?: GroupTab }`, `{ page: 'privacy' }`, or `{ page: 'terms' }`).
- `useAppRoute()`: React hook returning `{ route: AppRoute, navigateToGroups: () => void, navigateToGroup: (groupId: string, tab?: GroupTab) => void, navigateToPrivacy: () => void, navigateToTerms: () => void }`.

## Invariants
- `window.location.hash` is the authoritative source of truth for active route state.
- Unrecognized or empty hashes safely resolve to `{ page: 'groups' }`.
- Route hashes `#privacy` and `#privacy-policy` resolve to `{ page: 'privacy' }`.
- Route hashes `#terms` and `#terms-of-service` resolve to `{ page: 'terms' }`.
- Valid group tabs are constrained to `GROUP_TABS` (`'overview'`, `'expenses'`, `'balances'`, `'settings'`); legacy `'members'` tab parameter is automatically normalized to `'settings'`.
- Safe for non-browser/SSR execution via `typeof window !== 'undefined'` checks.

## Side Effects
- Attaches and cleans up global `hashchange` event listeners on `window`.
- Mutates `window.location.hash` during `navigateToGroups` and `navigateToGroup` calls.

## Verification
- Run: `bun test`
