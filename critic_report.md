# Goldfish Critic Review Report (`critic_report.md`)

**Target:** [`design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md#L1-L243) (`FeatureRange`: lines 1–243)
**Reviewers:** `egm-design` (Hostile Design Critic), `egm-structural` (Structural Layout Validator), `egm-style` (Technical Copy Editor)

## Summary of Findings
* 🔴 **Blockers:** 2
* 🟡 **Major:** 5
* 🟢 **Nits:** 4

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. False "You are not involved" Classification When `userPaid === userOwed` (`userNet === 0`) - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 41, 89, 184–186](file:///home/zz/Projects/Spread-Spends/design_draft.md#L184-L186)
* **Discrepancy Description**: Section `2.E` (lines 184–186) defines expense involvement solely as `const isInvolved = Math.abs(userNet) > 0.005`, where `userNet = userPaid - userOwed`. If a user paid for an expense and consumed an equal amount (`userPaid > 0` and `userOwed === userPaid`, so `userNet === 0`), `Math.abs(userNet) > 0.005` evaluates to `false`. The row then hides the total expense amount and displays `"You are not involved"`, even though the user directly paid and participated in the expense.
* **Rationale & Recommendation**: A user is involved in an expense whenever they contributed to `paidBy` or `splits`. Update the involvement check in lines 41, 89, and 184–186 to `const isInvolved = userPaid > 0.005 || userOwed > 0.005`. When `isInvolved` is true and `Math.abs(userNet) <= 0.005`, display the total expense amount on top and `"Settled"` (or `₹0.00` in muted slate) below; only show `"You are not involved"` (and hide `exp.amount`) when both `userPaid <= 0.005` and `userOwed <= 0.005`.

---

### 2. Unvalidated Legacy/Invalid `tab` Hash Parameter Renders a Blank Screen - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 163–167, 210–214](file:///home/zz/Projects/Spread-Spends/design_draft.md#L163-L167)
* **Discrepancy Description**: Line 166 states that [`useAppRoute.ts`](file:///home/zz/Projects/Spread-Spends/src/router/useAppRoute.ts#L8-L17) validates `tab=settings` in hash URLs (`#group=<id>&tab=settings`). However, `parseHash` in `useAppRoute.ts` currently performs an unchecked type cast (`params.get('tab') as GroupTab`) without runtime validation against `GROUP_TABS`. If a user opens a bookmarked link, shared URL, or browser history entry containing the legacy `#group=<id>&tab=members` (or any invalid tab string), `activeTab` becomes `'members'`, causing `GROUP_SECTIONS.find((s) => s.id === activeTab)` in [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L238) to return `undefined` and render an empty tab panel (`null`).
* **Rationale & Recommendation**: Specify in Section `2.C` (line 166) that `parseHash` in `useAppRoute.ts` (and `initialTab` normalization in `useSwipeableTabs.ts`) must validate the parsed `tab` string against `GROUP_TABS`, mapping legacy `'members'` to `'settings'` and falling back to `'overview'` for any unrecognized value.

---

### 3. Stripping Payer, Splits, and Notes from `TransactionItem` Leaves No Read-Only Place to View Them in `TransactionHistoryModal` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 28, 41, 89–91, 182–192, 225–226](file:///home/zz/Projects/Spread-Spends/design_draft.md#L182-L192)
* **Discrepancy Description**: The spec removes payer attribution (`"X paid"`), expense/settlement `notes`, and (when uninvolved) the total expense amount from `TransactionItem` rows under the assumption that tapping the row opens [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx#L72-L125) with full transaction details (lines 28, 220). In reality, `TransactionHistoryModal`'s header card only displays `description`, `date/time`, `Created by {creatorName}`, and `amount`—it does not render who paid (`exp.paidBy`), the split breakdown (`exp.splits`), or `data.notes`. A user tapping an unedited expense row cannot see who paid, how it was split, or its notes without entering the `Edit` wizard.
* **Rationale & Recommendation**: Specify in Section `2.E` (lines 188–192) that `TransactionHistoryModal`'s header summary card must display the payer summary (`paidBy`), participant split summary (`splits`), and `notes` (when present) so tapping a minimalist row in `TransactionList` actually reveals the details removed from the feed row.

---

### 4. `SimplifiedDebtsList` Single-Line Flex Row Risks Horizontal Overflow on 412px Viewports - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 34, 99, 203, 218–220](file:///home/zz/Projects/Spread-Spends/design_draft.md#L200-L204)
* **Discrepancy Description**: In Alternative B (lines 218–220), the spec notes that rendering two full member names, two avatars, and an amount on a 412px viewport causes wrapping or overflow. Yet in `SimplifiedDebtsList` (lines 99 and 203), the spec forces `[FromAvatar] Name owes -> [ToAvatar] Name`, `{formatCurrency(debt.amount, debt.currency)}`, and the `"Settle"` button onto a single horizontal flex row (`flex items-center justify-between gap-2`) without removing `"owes"` or defining truncation constraints. On a 412px screen (~340px card inner width), two full names plus avatars, amount, and button will overflow or crush the button.
* **Rationale & Recommendation**: Update line 99 and line 203 to specify: (1) drop the word `"owes"` in `SimplifiedDebtsList` so it reads `[FromAvatar] Name → [ToAvatar] Name`, (2) apply `min-w-0 flex-1` and `truncate` on the participant names container, and (3) apply `shrink-0` on the right-hand amount and `"Settle"` button container.

---

### 5. Soft-Delete Button in `TransactionHistoryModal` Lacks Confirmation Guard and Async Loading State - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 41, 91, 188–190, 239](file:///home/zz/Projects/Spread-Spends/design_draft.md#L188-L190)
* **Discrepancy Description**: Previously, clicking the inline delete icon in [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx#L136) guarded against accidental deletion with `window.confirm(...)`. Moving `Delete` into the footer of `TransactionHistoryModal` right next to `Edit` and `Close` without a confirmation guard or an `isDeleting` disabled state creates two mobile UX failure modes: (1) an accidental tap immediately mutates the Google Sheet to `status = 'DELETED'`, and (2) while `await deleteExpense(...)` is in flight over the network, the user can tap `Delete` or `Edit` repeatedly.
* **Rationale & Recommendation**: Update Section `2.E` (line 189) to require either a confirmation prompt (`window.confirm` or inline `"Confirm Delete?"` toggle) and an `isDeleting` loading/disabled state on the `TransactionHistoryModal` footer buttons until the `onDelete` promise settles.

---

### 6. Unaddressed `Notify` Action and Unused Notification Props After Removing `Notify` from `GroupHeader` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** [Lines 19, 37, 100, 127, 177](file:///home/zz/Projects/Spread-Spends/design_draft.md#L176-L179)
* **Discrepancy Description**: Line 19 and line 37 remove `Invite`, `Sheet`, and `Notify` from `GroupHeader`, keeping only `+ Add Expense` and `Settle Up`. While `Invite` remains in `Settings -> Card 2 (Members)` and `Sheet` moves to `Settings -> Card 1 (Group Info)`, the spec never states what happens to `Notify` inside `GroupDetailPage` (or the now-unused `isPushEnabled`, `onToggleNotifications`, and `onOpenNotificationSettings` props in [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx#L34-L36) and [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L256-L258)).
* **Rationale & Recommendation**: Explicitly state in Section `2.D` (line 177) whether `Notifications` is accessible exclusively from the Home screen (`GroupList` header Bell icon) and clean up unused notification props on `GroupHeader`, or include a compact notification toggle/button inside `Settings` Card 1 (`Group Info`).

---

### 7. Disconnected Orphan Nodes in Architecture Mermaid Diagram - Severity: 🟡 Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** [Lines 111–149](file:///home/zz/Projects/Spread-Spends/design_draft.md#L111-L149)
* **Discrepancy Description**: In the Technical Plan Mermaid `flowchart TD` (lines 111–149), several nodes are declared inside subgraphs without any directed edges connecting them to the rest of the graph: `Offline` in `AppShell` (line 115), all three nodes (`HomeHeader`, `OwedOwe`, `Cards`) in `HomeView` (lines 121–123), and `GHeader` in `GroupView` (line 127). Specifically, `GHeader` (`+ Add Expense`, `Settle Up`) has no edges to `AddModal`, `SettleModal`, or `GTabs`, and `HomeView` has no edge to `GroupView`.
* **Rationale & Recommendation**: Connect the orphan nodes in the Mermaid diagram (e.g., `Cards -->|Select Group| GHeader`, `GHeader -->|Tap + Add Expense| AddModal`, `GHeader -->|Tap Settle Up| SettleModal`, and `HomeHeader --- OwedOwe --- Cards`) so the diagram represents a cohesive component and navigation graph rather than floating boxes.

---

### 8. Asymmetric File Link Formatting in Technical Plan - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** [Lines 153–204](file:///home/zz/Projects/Spread-Spends/design_draft.md#L153-L204)
* **Discrepancy Description**: In Section `2. Core Architectural Changes`, subsection `C` (lines 164–167) formats repository files as clickable `file://` Markdown links (`[useSwipeableTabs.ts](file:///...)`), whereas subsections `A`, `B`, `D`, `E`, and `F` format file names as plain unlinked inline code (`googleAuth.ts`, `Navbar.tsx`, `SummarySection.tsx`, etc.).
* **Rationale & Recommendation**: Format the primary file references in subsections `A`–`F` consistently using clickable `[basename](file:///home/zz/Projects/Spread-Spends/src/...)` links to match subsection `C`.

---

### 9. Non-Standard 80-Hyphen Horizontal Rules and Mixed Arrow Glyphs (`$\rightarrow$` vs `->`) - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** [Lines 7, 48, 80, 81, 103, 163, 196, 206, 232, 234, 242](file:///home/zz/Projects/Spread-Spends/design_draft.md#L163-L242)
* **Discrepancy Description**:
  1. Section dividers on lines 7, 103, 206, 234, and 242 use 80-character hyphen strings (`--------------------------------------------------------------------------------`) instead of standard 3-character Markdown horizontal rules (`---`).
  2. Arrow notation alternates between inline LaTeX math (`$\rightarrow$` on lines 163 and 232) and ASCII (`->` on lines 48, 80, 81, 130, 191, 196).
* **Rationale & Recommendation**: Replace 80-hyphen dividers with `---` and standardize prose/button arrows to Unicode `→` (or clarify whether `"Who Paid →"` uses a Unicode arrow or icon instead of literal ASCII `->`).

---

### 10. Unspecified Zero-Balance Fallback Text in `GroupCard` and `BalancesSummary` - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** [Lines 72, 99, 201](file:///home/zz/Projects/Spread-Spends/design_draft.md#L72-L201)
* **Discrepancy Description**: Line 72 states that `GroupCard` displays `"the signed colored net balance (+₹X or -₹Y without 'YOU ARE OWED' / 'YOU OWE' labels)"`, and line 201 states that `BalancesSummary` removes `"All settled up"` sub-labels, but neither line in `FeatureRange` specifies what text renders when a group's or member's net balance is `0` (`"Settled up"` vs `"Settled"`).
* **Rationale & Recommendation**: Explicitly state the zero-balance text in line 72 (`"Settled up"` when net balance is zero) and line 201 (`"Settled"` when net balance is zero) to match the implementation plan.

---

### 11. Informal Wording and Process Meta-Commentary in Problem & Open Questions - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** [Lines 21, 52](file:///home/zz/Projects/Spread-Spends/design_draft.md#L21-L52)
* **Discrepancy Description**: Line 21 uses informal phrasing (`"squishes the label onto two lines"`), and line 52 includes conversational process commentary (`"None. All 15 screen specifications and edge cases have been resolved during brainstorming."`).
* **Rationale & Recommendation**: Replace `"squishes the label onto two lines"` with `"wraps the label onto two lines"` on line 21, and simplify line 52 to `"None."`.
