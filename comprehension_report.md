# Stage 6: Comprehension & Re-Implementation Audit Report (`comprehension_report.md`)

**Target Document**: [`/home/zz/Projects/Spread-Spends/design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md)
**Audited Scopes**:
- `FeatureRange`: Lines 1–243 (`Overview`, `The Problem`, `Goals`, `Non-Goals`, `CUJs`, `Technical Plan`, `Alternatives Considered`, `Non-Functional Requirements`)
- `DetailedRange`: Lines 244–449 (`Detailed Implementation Plan`, `Verification Plan`)

---

## Executive Summary

Auditing [`design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md) from a zero-context implementer perspective against `/home/zz/Projects/Spread-Spends/src/` surfaced **1 Blocker**, **4 Major**, and **2 Nit** comprehension/specification discrepancies between the plan instructions and the actual component/hook contracts.

---

## Findings

### 🔴 Blocker 1: Incorrect Mutation Signature & State Setter Name for `onDelete` in `GroupDetailPage.tsx`

* **Severity**: 🔴 Blocker
* **Affected Scope**: `DetailedRange` (Line 405) & `FeatureRange` (`Technical Plan -> 2.E`, Line 189)
* **Discrepancy Description & Rationale**:
  Line 405 instructs the implementer:
  > *"Pass `onDelete` to `<TransactionHistoryModal />` that calls `await deleteExpense(item.data.id)` when `item.type === 'EXPENSE'` or `await deleteSettlement(item.data.id)` when `item.type === 'SETTLEMENT'`, then sets `viewingHistoryTransaction(null)`."*

  Inspecting [`useGroupDetail.ts`](file:///home/zz/Projects/Spread-Spends/src/hooks/useGroupDetail.ts#L173-L205), [`GroupContext.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupContext.tsx#L20-L23), and [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L71-L75) reveals three contract mismatches:
  1. `deleteExpense` and `deleteSettlement` do **not** accept a bare `string` ID. Their signatures are:
     - `deleteExpense: (params: { expenseId: string; editorEmail?: string }) => Promise<unknown>`
     - `deleteSettlement: (params: { settlementId: string; editorEmail?: string }) => Promise<unknown>`
  2. In [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L71), `viewingHistoryTransaction` is the state value, while the state setter is `setViewingHistoryTransaction(null)`.
  3. At the `<TransactionHistoryModal />` call site in [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L326-L343), the transaction variable in scope is `currentViewingTransaction` (not `item`).
* **Actionable Fix**:
  Update Line 405 to specify the exact object signature and state setter:
  `deleteExpense({ expenseId: currentViewingTransaction.data.id, editorEmail: currentUser?.email })` / `deleteSettlement({ settlementId: currentViewingTransaction.data.id, editorEmail: currentUser?.email })` followed by `setViewingHistoryTransaction(null)`.

---

### 🟡 Major 1: Ambiguous Component Ownership of `PendingApprovalsList` and Mismatched Subtitle String in `MembersSection.tsx` / `MemberList.tsx`

* **Severity**: 🟡 Major
* **Affected Scope**: `FeatureRange` (`CUJ 5` Line 100; `Technical Plan -> 1` Line 133; `Technical Plan -> 2.D` Lines 176–178) vs `DetailedRange` (Lines 344–358)
* **Discrepancy Description & Rationale**:
  1. **Duplicate Rendering Risk for `PendingApprovalsList`**: Line 348 states:
     > *"Render **Card 2 (`Members`)**: renders `PendingApprovalsList` (if any pending invites exist) and `MemberList`."*
     In the current codebase, [`MemberList.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MemberList.tsx#L34-L40) **already renders `<PendingApprovalsList />` internally** above the `Active Members` card, whereas [`MembersSection.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MembersSection.tsx#L31-L53) only renders `<MemberList />` and `<DirectSheetsLink />`.
  2. **Wrong Subtitle & Badge Text Referenced in `MemberList.tsx`**: Line 355 states:
     > *"Delete `<p>{activeMembers.length} active members in this sheet</p>` and render `<Badge variant="emerald">Owner</Badge>` only when `m.role === 'OWNER'`"*
     In [`MemberList.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MemberList.tsx#L45-L48), the subtitle `<p>` is actually `"People with edit permissions on this group Google Sheet."`, and lines 92–94 currently render `<Badge variant="emerald" className="gap-1 font-semibold"><Shield className="w-3 h-3" /> Group Owner</Badge>`.
* **Actionable Fix**:
  - In Line 348, clarify that `<MemberList />` already encapsulates `<PendingApprovalsList />` and the `Active Members` card.
  - In Line 355, reference the exact `<p>` subtitle (`"People with edit permissions on this group Google Sheet."`) and explicitly state replacing `<Shield /> Group Owner` with `Owner`.

---

### 🟡 Major 2: Non-Existent `VALID_TABS` Symbol in `useAppRoute.ts` and Unspecified Invalid-Tab Fallback

* **Severity**: 🟡 Major
* **Affected Scope**: `FeatureRange` (`Technical Plan -> 2.C` Line 166) vs `DetailedRange` (`[Modify] ./src/router/useAppRoute.ts` Line 325)
* **Discrepancy Description & Rationale**:
  Line 325 instructs:
  > *"Update `VALID_TABS` via `GROUP_TABS` so `'settings'` is recognized as a valid tab identifier."*
  Inspecting [`src/router/useAppRoute.ts`](file:///home/zz/Projects/Spread-Spends/src/router/useAppRoute.ts#L8-L17) shows that `VALID_TABS` **does not exist** in the file (`parseHash` currently uses `const tab = (params.get('tab') as GroupTab) || undefined;`).
* **Actionable Fix**:
  Update Line 325 to specify importing `GROUP_TABS` from `../hooks/useSwipeableTabs` in [`useAppRoute.ts`](file:///home/zz/Projects/Spread-Spends/src/router/useAppRoute.ts) and validating `rawTab = params.get('tab')` against `GROUP_TABS` (falling back to `undefined` if not in `GROUP_TABS`).

---

### 🟡 Major 3: `GroupHeader.tsx` `tabRefs` Type Error & Unused Props Under Strict `tsc -b` / ESLint Checks

* **Severity**: 🟡 Major
* **Affected Scope**: `DetailedRange` (`[Modify] ./src/components/groups/GroupHeader.tsx` Lines 329–334 & `Verification Plan` Line 449)
* **Discrepancy Description & Rationale**:
  1. In [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx#L59-L64), `tabRefs` is typed as `useRef<Record<GroupTab, HTMLButtonElement | null>>` and initialized with `{ overview: null, expenses: null, balances: null, members: null }`. Renaming `'members'` to `'settings'` in `GroupTab` without updating `tabRefs` to `settings: null` causes a TypeScript build error.
  2. Removing the `Invite`, `Sheet`, and `Notify` buttons and subtitle from `GroupHeader.tsx` leaves `financialSummary`, `currency`, `onOpenInvite`, `isPushEnabled`, `onToggleNotifications`, `onOpenNotificationSettings`, and icons (`ExternalLink`, `UserPlus`, `Users`, `Bell`, `BellOff`, `Badge`) unused, which will fail `tsc -b` and `bun run lint`.
* **Actionable Fix**:
  Update Lines 331–334 to explicitly list updating `tabRefs` key `members: null` to `settings: null`, replacing `Users` icon import with `Settings`, and removing unused destructured props and imports.

---

### 🟡 Major 4: Mismatched Subtitle Text & Unspecified Flex Alignment in `MemberSpendings.tsx`

* **Severity**: 🟡 Major
* **Affected Scope**: `DetailedRange` (`[Modify] ./src/pages/group/balances/MemberSpendings.tsx` Line 416)
* **Discrepancy Description & Rationale**:
  1. In [`MemberSpendings.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/balances/MemberSpendings.tsx#L59-L61), the actual subtitle string is `"How much each member paid out of pocket versus consumed in expenses."` (not `"Total amount paid upfront vs actual share of expenses"`).
  2. Each bar's header is `<div className="flex items-center justify-between text-xs">`. Deleting `<span>Paid</span>` and `<span>Consumed</span>` makes the currency `<span>` the first flex child in a `justify-between` container, causing the amount to jump to the left unless `justify-end` or an inline flex row is used.
* **Actionable Fix**:
  Update Line 416 to quote the exact subtitle and specify right-aligning the amount (`justify-end`) or placing the bar and amount in a single `flex items-center gap-2` row.

---

### 🟢 Nit 1: Notification Status Card Reference in `NotificationSettingsModal.tsx`

* **Severity**: 🟢 Nit
* **Affected Scope**: `DetailedRange` (`[Modify] ./src/components/notifications/NotificationSettingsModal.tsx` Line 431)
* **Discrepancy Description & Rationale**:
  In [`NotificationSettingsModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/notifications/NotificationSettingsModal.tsx#L83-L116), the top card displays `"Notifications Active"` / `"Notifications Blocked"` / `"Notifications Off"` (not `"Instant Sheet Sync"`).
* **Actionable Fix**:
  Update Line 431 to reference the top notification status card (`"Notifications Active"` / `"Notifications Blocked"` / `"Notifications Off"`) and specify removing its `<p>` subtext line (lines 108–114).

---

### 🟢 Nit 2: State Variable Name Mismatch (`expenseTime` / `settlementTime` vs `time`) in `AddExpenseModal.tsx` and `SettleUpModal.tsx`

* **Severity**: 🟢 Nit
* **Affected Scope**: `DetailedRange` (Line 389 & Line 425)
* **Discrepancy Description & Rationale**:
  In both [`AddExpenseModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/AddExpenseModal.tsx#L113) and [`SettleUpModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/settlement/SettleUpModal.tsx#L53), the state variable is named `time` (`const [time, setTime] = useState(...)`).
* **Actionable Fix**:
  Update Line 389 and Line 425 to reference the actual state variable `time` (`extractTimeFromTimestamp(...).slice(0, 5)`).
