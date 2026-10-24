# Groups Components

## Overview
Expense group management and navigation components, including group listings, group detail headers with tab navigation, swipeable tab panel containers, and backward-compatible modal exports.

## Interface
- `GroupHeader({ group, currentUserEmail, financialSummary, activeTab, onTabChange, onBack, onOpenAddExpense, onOpenSettleUp, onOpenInvite, isPushEnabled, onToggleNotifications, onOpenNotificationSettings }: GroupHeaderProps): JSX.Element`
- `GroupList({ groups, currentUserEmail, isLoading, isRefetching, groupBalances, activeSettlements, totalYouAreOwed, totalYouOwe, currency, isPushEnabled, onOpenNotifications, onSelectGroup, onOpenCreateGroup, onOpenImportModal, onSettleDebt, onRefresh, onLogin }: GroupListProps): JSX.Element`
- `GroupTabsContainer({ activeTab, slideDirection, dragOffset, isDragging, touchHandlers, children, className }: GroupTabsContainerProps): JSX.Element`
- Re-exports from `src/pages`:
  - `CategoryPieChart` (from `../../pages/group/summary/CategoryPieChart`)
  - `CreateGroupModal` (from `../../pages/groups/CreateGroupModal`)
  - `GroupCard` (from `../../pages/groups/GroupCard`)
  - `GroupOverview` (from `../../pages/group/summary/SummarySection`)
  - `OpenGroupModal` (from `../../pages/groups/OpenGroupModal`)

## Invariants
- `GroupHeader` provides ARIA tablist semantics and auto-scrolls the active tab button into center view on mobile.
- `GroupHeader` keyboard navigation enables cycling through tabs using Left and Right arrow keys.
- `GroupList` renders an informational Google sign-in splash card when `currentUserEmail` is empty.
- `GroupTabsContainer` applies hardware-accelerated 3D translations during active swipe-dragging.

## Side Effects
- Smooth-scrolls active tab DOM element into view via `Element.scrollIntoView`.
- Triggers group refetching, modal openings, and group navigation callbacks.

## Verification
- Run: `bun test`
