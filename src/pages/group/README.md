# Group Workspace (`src/pages/group`)

## Overview
Primary group container orchestrating swipeable group tab sections (Overview, Expenses, Balances, Settings), modal visibility state, and React GroupProvider context.

## Interface
- `GroupDetailPage(props: GroupDetailPageProps): JSX.Element`
- `GroupDetailPageProps`
- `GroupProvider(props: GroupProviderProps): JSX.Element`, `useGroupContext(): GroupContextValue | null`
- `GROUP_SECTIONS: GroupSectionConfig[]`
- Tab Subdirectories:
  - [Summary Tab](./summary/README.md): Group overview and interactive category spending donut chart.
  - [Balances Tab](./balances/README.md): Member balances and spending vs. consumption visualizers.
  - [Settlement Tab](./settlement/README.md): Debt simplification and payment recording modal.
  - [Expenses Tab](./expenses/README.md): Expense feed, multi-step creation wizard, and audit diff timelines.
  - [Members Tab](./members/README.md): Member roster, invite workflows, and pending approvals.

## Invariants
- Swipe gestures and tab transitions are disabled whenever any modal is open.
- If group data fails to load or access is denied, an error fallback card with retry option is rendered.
- Derives owner privileges dynamically by matching `group.ownerEmail` against `currentUser.email`.

## Side Effects
- Fetches and synchronizes group data from Google Drive via `useGroupDetail(groupId)`.
- Dispatches state updates and triggers modals across all child tab components through `GroupProvider`.

## Verification
- Run: `bun test`
