# Hooks

## Overview
React hooks providing authentication state, group data queries with optimistic mutations, home balance rollups, real-time BroadcastChannel and Web Push synchronization, offline status detection, PWA installation workflows, touch gesture navigation, and theme toggling.

## Interface
- `useAuth()`: Access current Google user, authentication state, demo mode status, login/logout actions, and client ID configuration.
- `useGroupDetail(groupId: string | null)`: Reactive query hook for group data, expenses, settlements, and optimistic mutations (`addExpense`, `updateExpense`, `deleteExpense`, `addSettlement`, etc.).
- `useGroups(currentUser: GoogleUser | null)`: Query hook listing accessible group spreadsheets from Google Drive, with `createGroup` and `importGroup`.
- `useHomeSummary(groups: GoogleDriveFile[], currentUserEmail: string)`: Financial summary rollup across all groups for the home dashboard.
- `useOnlineStatus()`: Reactively tracks network connectivity status (`isOnline`).
- `usePwaInstall()`: PWA installation prompt handling, platform detection (iOS/Android), and standalone display state.
- `useSheetSync(activeGroupId: string | null, currentUserEmail?: string)`: Real-time multi-tab and push notification sync listener via `BroadcastChannel` and Service Worker events.
- `useSwipeableTabs(options?: UseSwipeableTabsOptions)`: Touch gesture handlers and tab sliding transitions for mobile navigation.
- `useTheme()`: Wrapper around `ThemeContext` providing theme state and toggles.
- Helper functions and types: `GroupDataPayload`, `ActiveSettlementItem`, `SheetUpdateEvent`, `GROUP_TABS`, `GroupTab`, `getNextTab`, `getPrevTab`, `getSlideDirection`.

## Invariants
- TanStack React Query cache keys are normalized as `['groups', userEmail]` and `['group-detail', groupId]`.
- Group mutations execute optimistic cache updates immediately, rolling back on failure and invalidating query keys upon settlement.
- Financial summaries (`GroupFinancialSummary` and simplified debts) are recalculated whenever group members, expenses, or settlements change.
- Authentication state syncs reactively across browser windows/tabs via `window` `'storage'` event listeners.
- Multi-tab sync uses `BroadcastChannel('spread_spends_sync')` alongside Service Worker push event listeners, invalidating React Query caches on `SHEET_MODIFIED` events.
- Tab swiping requires a minimum 10px horizontal movement lock, applies rubber-band resistance at list ends, and is suppressed inside dialogs, form inputs, and elements marked with `.no-swipe` or `data-no-swipe`.
- Network errors trigger fallback reads from IndexedDB and localStorage caches (`getCachedGroups`, `getCachedGroupDetail`).

## Side Effects
- Network mutations and queries to Google Sheets and Google Drive APIs via `groupService`.
- Reads and writes to `localStorage`, `sessionStorage`, and `IndexedDB` via `storageService` and `googleAuthService`.
- `BroadcastChannel` message dispatch and listener lifecycle management on `'spread_spends_sync'`.
- Window and navigator event listeners: `'storage'`, `'online'`, `'offline'`, `'beforeinstallprompt'`, `'appinstalled'`, `'touchstart'`, `'touchmove'`, `'touchend'`, `'touchcancel'`, `'focus'`, `'visibilitychange'`, and Service Worker message events.
- Device push subscription registration with Cloudflare Worker KV backend.

## Verification
- Run: `bun test`
