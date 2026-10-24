# Stage 5: Initial Zoom Out Review (`zoom_out_report.md`)

**Target Document**: [`design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md) (lines 1–449)  
**Overall Assessment**: The design stays tightly focused on the root problem—eliminating explanatory/marketing clutter, fixing 412px mobile horizontal overflow, and removing redundant UI widgets across all 15 screens and modals. No Blocker issues were found, and the component consolidation aligns with the existing architecture. Two **Major** simplicity/reuse issues and two **Nit** dead-code cleanup items were identified.

---

## Findings

### 1. 🟡 Major: Stateful Audit Expansion in `TransactionHistoryModal` vs. Native `<details>` & Plain-Function Unit Tests
* **Affected Scope**: `Technical Plan > 2.E` (line 191), `Detailed Implementation Plan > 4` (line 401), and `Detailed Implementation Plan > 6` (lines 443–444)
* **Simplicity Rationale**:
  1. **Native Platform Alternative (YAGNI)**: Lines 191 and 401 propose adding a React state map (`expandedIds` / `expandedRevisions: Record<string, boolean>`) and custom toggle state logic in [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx) so audit trail entries start collapsed and expand on click. HTML's native `<details>` and `<summary>` elements provide default-collapsed disclosure behavior, keyboard accessibility, and click toggling out of the box with zero React state (`useState`) and zero event handler boilerplate.
  2. **Test Harness Compatibility**: [`src/test/transactionItemInteraction.test.ts`](file:///home/zz/Projects/Spread-Spends/src/test/transactionItemInteraction.test.ts#L117-L184) currently invokes `TransactionHistoryModal({ ... })` directly as a plain function rather than inside `renderToStaticMarkup(React.createElement(...))`. Calling `useState` inside a component invoked as a plain function outside a React render dispatcher throws an `Invalid hook call` runtime error.
* **Recommendation**:
  * Use native `<details className="group">` / `<summary>` elements for each audit revision item in [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx) (which requires no `useState` hook and works both in direct function calls and SSR markup), **or** explicitly specify in Section 6 (lines 443–444) that [`transactionItemInteraction.test.ts`](file:///home/zz/Projects/Spread-Spends/src/test/transactionItemInteraction.test.ts) must wrap `TransactionHistoryModal` calls in `React.createElement` / `renderToStaticMarkup`.

---

### 2. 🟡 Major: Duplicating `"Open in Google Sheets"` While Also Rewriting an Unreferenced `DirectSheetsLink.tsx`
* **Affected Scope**: `Technical Plan > 2.D` (line 177) and `Detailed Implementation Plan > 3` (lines 347–352)
* **Simplicity Rationale**:
  * Line 347 instructs [`MembersSection.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MembersSection.tsx) to build an inline `"Open in Google Sheets"` link button inside Card 1 (`Group Info`), and line 349 instructs it to *"Stop rendering `<DirectSheetsLink />`"*.
  * Immediately after, lines 350–352 instruct modifying [`DirectSheetsLink.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/export/DirectSheetsLink.tsx) to *"Reduce to a compact `'Open in Google Sheets'` anchor button without the `'Raw Google Spreadsheet Access'` paragraph or feature badges"*.
  * [`DirectSheetsLink.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/export/DirectSheetsLink.tsx) is not imported anywhere else in `./src/` (nor in `./src/test/`). Rewriting `DirectSheetsLink.tsx` into a compact button while simultaneously ceasing to use it and duplicating the exact same anchor button inline in `MembersSection.tsx` creates dead code and duplicate markup.
* **Recommendation**:
  * Reuse the simplified `<DirectSheetsLink group={group} />` directly inside Card 1 (`Group Info`) of [`MembersSection.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MembersSection.tsx) instead of duplicating the anchor button inline and leaving `DirectSheetsLink.tsx` orphaned.

---

### 3. 🟢 Nit: Dead Modal State, Handlers, and Imports in `BalancesSummary.tsx`
* **Affected Scope**: `Technical Plan > 2.F` (line 201) and `Detailed Implementation Plan > 5` (lines 409–413)
* **Simplicity Rationale**:
  * Removing the `<Modal>` popup and `ChevronRight` trigger from [`BalancesSummary.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/balances/BalancesSummary.tsx#L31-L48) leaves `internalModalOpen` (`useState`), `isOpen`, `handleOpen`, `handleClose`, and imports (`useState`, `ChevronRight`, `Modal`, `Button`) unused, which will fail `tsc -b` (`noUnusedLocals`) and `bun run lint` during the Verification Plan (line 449).
* **Recommendation**:
  * Explicitly note in the [`BalancesSummary.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/balances/BalancesSummary.tsx) plan item (lines 411–413) to remove `internalModalOpen` state, `handleOpen`/`handleClose` handlers, and unused `Modal`, `Button`, and `ChevronRight` imports.

---

### 4. 🟢 Nit: Unused Action Props & Icon Imports in `GroupHeader.tsx`
* **Affected Scope**: `Detailed Implementation Plan > 3` (lines 329–334)
* **Simplicity Rationale**:
  * Line 333 removes the `Invite`, `Sheet`, and `Notify` buttons from [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx#L33-L52). Those buttons were the only consumers in `GroupHeader.tsx` of the destructured props `onOpenInvite`, `isPushEnabled`, `onToggleNotifications`, and `onOpenNotificationSettings`, as well as the `ExternalLink`, `UserPlus`, `Bell`, and `BellOff` icons. Leaving them destructured in `GroupHeader` will trigger unused-variable errors under `tsc -b` and `eslint`.
* **Recommendation**:
  * Specify cleaning up the unused destructured props (`onOpenInvite`, `isPushEnabled`, `onToggleNotifications`, `onOpenNotificationSettings`) and unused `lucide-react` icon imports in [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx).
