# Stage 8: Intermediate Zoom Out Review (`intermediate_zoom_out_report.md`)

**Target Document**: [`design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md) (lines 1–458)  
**Reference Report**: [`zoom_out_report.md`](file:///home/zz/Projects/Spread-Spends/zoom_out_report.md)

---

## 1. Stage 5 Remediation Verification

All 4 findings from Stage 5 (`zoom_out_report.md`) have been verified against the updated design document:

1. **Stage 5 Finding #1 (🟡 Major — Stateful Audit Expansion vs. Native `<details>`)**: **Resolved** (lines 41, 91, 199, 404, 409, 452). The design now specifies native HTML `<details className="group">` and `<summary>` elements for collapsible audit revisions without React `useState`.
2. **Stage 5 Finding #2 (🟡 Major — Reusing `DirectSheetsLink.tsx` in `MembersSection.tsx`)**: **Resolved** (lines 100, 134, 184, 355, 358). Card 1 (`Group Info`) in [`MembersSection.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MembersSection.tsx) now directly reuses the simplified `<DirectSheetsLink group={group} />` component instead of duplicating the anchor markup and orphaning `DirectSheetsLink.tsx`.
3. **Stage 5 Finding #3 (🟢 Nit — Dead Modal State & Imports in `BalancesSummary.tsx`)**: **Resolved** (lines 209, 420). The plan explicitly removes `internalModalOpen`, `handleOpen`/`handleClose`, and unused `useState`, `ChevronRight`, `Modal`, and `Button` imports.
4. **Stage 5 Finding #4 (🟢 Nit — Unused Action Props & Icon Imports in `GroupHeader.tsx`)**: **Resolved** (lines 184, 340). The plan explicitly removes unused destructured props (`financialSummary`, `onOpenInvite`, `isPushEnabled`, `onToggleNotifications`, `onOpenNotificationSettings`) and unused imports (`ExternalLink`, `UserPlus`, `Users`, `Bell`, `BellOff`, `Badge`).

---

## 2. Remaining Findings (Post-Stages 6 & 7)

No **🔴 Blocker** or **🟡 Major** issues remain. Two **🟢 Nit** items were identified from the Stage 6/7 additions to prevent an internal contradiction and `tsc -b` (`noUnusedLocals`) build errors:

### 1. 🟢 Nit: Contradictory `isDeleting` State Guard in `TransactionHistoryModal.tsx`
* **Severity**: Nit
* **Affected Scope**: `Technical Plan > 2.E` (line 197 vs. line 199) and `Detailed Implementation Plan > 4` (lines 409–410)
* **Simplicity Rationale**:
  * Line 199 and line 409 explicitly state that [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx) avoids React `useState` hooks so that direct plain-function invocations in [`src/test/transactionItemInteraction.test.ts`](file:///home/zz/Projects/Spread-Spends/src/test/transactionItemInteraction.test.ts#L117-L184) continue to work without throwing `Invalid hook call`.
  * However, line 197 (added during Stage 7 remediation) mentions setting an `isDeleting` loading/disabled guard on the footer buttons until `onDelete` settles.
  * Removing the `isDeleting` local state mention on line 197 keeps `TransactionHistoryModal` stateless (`window.confirm` → `await onDelete()` → `onClose()`) and compatible with `transactionItemInteraction.test.ts`.

---

### 2. 🟢 Nit: Unused Variables and Icon Imports Left in `TransactionItem.tsx` After Stripping Inline Actions & Payer Text
* **Severity**: Nit
* **Affected Scope**: `Detailed Implementation Plan > 4` (lines 375–384)
* **Simplicity Rationale**:
  * Removing the inline `Edit`, `Delete`, and `History` buttons, the `Edited (n)` badge, and the `{primaryPayerName} paid` text from [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx) leaves `Pencil`, `History`, and `Trash2` imports, destructured `onEdit` and `onDelete` props, `hasHistory`, and payer derivation variables (`payerEmails`, `singlePayerEmail`, `singlePayerMember`, `primaryPayerName`) unused, which would fail `tsc -b` (`noUnusedLocals`).
* **Recommendation**:
  * Note in the [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx) plan item (lines 378–380) to remove the unused `Pencil`, `History`, and `Trash2` imports, unused `hasHistory` and `primaryPayerName` locals, and unused `onEdit`/`onDelete` destructured variables.
