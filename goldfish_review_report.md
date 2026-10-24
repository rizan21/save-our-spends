Status: resolved

# Goldfish Annotated Review Report

**Target:** [`/home/zz/Projects/Spread-Spends/design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md#L250-L457) (`250..457`)

## Prioritized Findings & AI Suggestions

### [Issue 1] [`egm-codebase-details`] - Severity: High
*   **Affected Scope:** [Lines 163, 258-259](file:///home/zz/Projects/Spread-Spends/design_draft.md#L258-L259) (`Detailed Implementation Plan -> 1. Authentication, Shell, & PWA Components`)
*   **Discrepancy Description:** Line 259 instructs calling `!this.isDemoMode()` inside `GoogleAuthService`, whereas `this.isDemoMode` in `src/services/googleAuth.ts` is a private `boolean` property (and the getter is `this.getIsDemoMode()`). Calling `this.isDemoMode()` causes a TypeScript compile error (`Type 'Boolean' has no call signatures`) and runtime `TypeError`. Additionally, the `console.error` string on line 259 differs slightly from line 163.
*   **Rationale:** Prevents a TypeScript compilation and runtime error in `src/services/googleAuth.ts` and unifies the console error message across the document.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique. `this.isDemoMode` is a boolean field on `GoogleAuthService`, not a method.
*   ***Proposed Edit:***
    *   Location: Line 259 (`./src/services/googleAuth.ts`)
    *   Change: Replace `!this.isDemoMode()` with `!this.isDemoMode` and unify the `console.error` message to `'[Spread-Spends] Missing VITE_GOOGLE_CLIENT_ID environment variable. Provide VITE_GOOGLE_CLIENT_ID in your .env file.'` (matching line 163), plus remove the unused `CLIENT_ID_STORAGE_KEY` constant and update `setClientId()` to a no-op.

### [Issue 2] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: High
*   **Affected Scope:** [Line 286](file:///home/zz/Projects/Spread-Spends/design_draft.md#L286) (`Detailed Implementation Plan -> 1. Authentication, Shell, & PWA Components`)
*   **Discrepancy Description:** Line 286 instructs passing `onOpenInstall={() => { setIsEditProfileOpen(false); setIsInstallModalOpen(true); }}` in `App.tsx`, but `usePwaInstall()` in `src/App.tsx` exposes `openInstallModal: () => void` rather than `setIsInstallModalOpen`.
*   **Rationale:** Prevents `Cannot find name 'setIsInstallModalOpen'` when running `tsc -b`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique. `src/App.tsx` destructures `openInstallModal` from `usePwaInstall()`.
*   ***Proposed Edit:***
    *   Location: Line 286 (`./src/App.tsx`)
    *   Change: Replace `setIsInstallModalOpen(true)` with `openInstallModal()`.

### [Issue 3] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: High
*   **Affected Scope:** [Lines 263-442](file:///home/zz/Projects/Spread-Spends/design_draft.md#L263-L442) (`Detailed Implementation Plan -> Sections 1-5`)
*   **Discrepancy Description:** `tsconfig.app.json` enforces `"noUnusedLocals": true` and `"noUnusedParameters": true`. Deleting the specified UI sections across 14 component files leaves unused imports, destructured props, and local variables that will fail `bun run build` (`tsc -b`) and `bun run lint` (`oxlint`) unless explicitly listed for removal.
*   **Rationale:** Ensures implementers remove every newly unused import, prop, and local variable so `tsc -b` and `oxlint` pass on the first run.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique. Explicitly listing the unused imports, destructured props, and local variables for each of the 14 files makes the implementation instructions self-contained under strict TypeScript checks.
*   ***Proposed Edit:***
    *   Location: Lines 263–442 across `LoginScreen.tsx`, `EditProfileModal.tsx`, `InstallAppModal.tsx`, `GroupList.tsx`, `GroupCard.tsx`, `CreateGroupModal.tsx`, `groupSections.tsx`, `GroupHeader.tsx`, `SummarySection.tsx`, `DirectSheetsLink.tsx`, `MemberList.tsx`, `InviteMemberModal.tsx`, `TransactionItem.tsx`, `AddExpenseModal.tsx`, `BalancesSummary.tsx`, `SettleUpModal.tsx`, and `NotificationSettingsModal.tsx`.
    *   Change: Add explicit instructions in each file's **Changes** block to remove all unused imports, destructured props, and local variables (and add required imports such as `Badge` in `GroupCard.tsx` and `Settings` in `groupSections.tsx` / `GroupHeader.tsx`).

### [Issue 4] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: High
*   **Affected Scope:** [Lines 197, 406-410](file:///home/zz/Projects/Spread-Spends/design_draft.md#L406-L410) (`Technical Plan -> 2E` & `Detailed Implementation Plan -> 4. Expenses Feed, Add Expense Wizard, & Transaction History Modal`)
*   **Discrepancy Description:** In `src/test/transactionItemInteraction.test.ts`, `TransactionHistoryModal({...})` is called directly as a plain TypeScript function outside a React render cycle, so introducing a `useState` hook (such as `isDeleting` mentioned on line 197) will throw `Invalid hook call`. Additionally, line 409 references `{revDt.full}`, whereas `TransactionHistoryModal.tsx` defines `formatDateTime(record.editedAt)`.
*   **Rationale:** Keeps `TransactionHistoryModal` completely hook-free so direct function invocation in tests succeeds, and uses the existing `formatDateTime(record.editedAt)` helper.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique. Removing the `isDeleting` mention from line 197 and using `{formatDateTime(record.editedAt)}` (plus importing `ChevronDown` and `Trash2` and removing unused `CheckCircle2`) guarantees compatibility with `transactionItemInteraction.test.ts`.
*   ***Proposed Edit:***
    *   Location: Lines 197 and 406–410 (`./src/pages/group/expenses/TransactionHistoryModal.tsx`)
    *   Change: Remove the `isDeleting` hook state mention on line 197, replace `{revDt.full}` on line 409 with `{formatDateTime(record.editedAt)}`, and specify importing `ChevronDown, Trash2` from `lucide-react` while removing unused `CheckCircle2`.

### [Issue 5] [`egm-implementation-readiness`] - Severity: High
*   **Affected Scope:** [Line 407](file:///home/zz/Projects/Spread-Spends/design_draft.md#L407) (`Detailed Implementation Plan -> 4. Expenses Feed, Add Expense Wizard, & Transaction History Modal`)
*   **Discrepancy Description:** Line 407 instructs rendering `Paid by` (`exp.paidBy`), `Split` (`exp.splits`), and `Notes` (`data.notes`) in `TransactionHistoryModal`, without specifying how to format the `Record<string, number>` maps or guard `paidBy`/`splits` with `isExpense`.
*   **Rationale:** Prevents attempting to render raw `Record<string, number>` objects as React children and ensures clean formatting for both expenses and settlements.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique. Specifying the exact `Object.entries(...)` formatting and `isExpense` guard removes all ambiguity.
*   ***Proposed Edit:***
    *   Location: Line 407 (`./src/pages/group/expenses/TransactionHistoryModal.tsx`)
    *   Change: Specify guarding `Paid by` and `Split` with `isExpense` (`const exp = transaction.data as GroupExpense`), formatting entries where `amt > 0` as `${getMember(email)?.name || email.split('@')[0]} (${formatCurrency(amt, data.currency || currency)})` joined by `', '`, and rendering `Notes: {data.notes}` when `data.notes` is truthy.

### [Issue 6] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 260-262](file:///home/zz/Projects/Spread-Spends/design_draft.md#L260-L262) (`Detailed Implementation Plan -> 1. Authentication, Shell, & PWA Components`)
*   **Discrepancy Description:** `src/hooks/useAuth.ts` does not have a `clientId` state property; it exports `setCustomClientId` and `getCustomClientId` callbacks used by `App.tsx`.
*   **Rationale:** Aligns the `useAuth.ts` instruction with the actual exports of `src/hooks/useAuth.ts` and `src/App.tsx`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 260–262 (`./src/hooks/useAuth.ts`)
    *   Change: Specify that `setCustomClientId` becomes a no-op and `getCustomClientId` returns `googleAuthService.getClientId()`, while `LoginScreenProps` keeps `clientId?: string` and `onSaveClientId?: (id: string) => void` as optional interface props without destructuring them.

### [Issue 7] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 266-269, 280-282, 289](file:///home/zz/Projects/Spread-Spends/design_draft.md#L266-L289) (`Detailed Implementation Plan -> 1. Authentication, Shell, & PWA Components`)
*   **Discrepancy Description:** Target strings and state variable names in `LoginScreen.tsx`, `EditProfileModal.tsx`, and `OfflineIndicator.tsx` differ slightly from the exact strings/identifiers in the files.
*   **Rationale:** Ensures exact string and identifier matching during implementation.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 266–269, 280–282, and 289
    *   Change: Update strings and variable names to match the exact source code in `LoginScreen.tsx` (`showConfig`, `clientIdInput`, `savedSuccess`, `handleSave`), `EditProfileModal.tsx` (`"Google Account Photo"`, `"Profile picture is set to your connected Google account."`, `"This name will be shown on expense splits, shared groups, and settlement receipts."`, `"Save Changes"`), and `OfflineIndicator.tsx` (`"Offline Mode — viewing cached groups, expenses, and balances."` and `"Back online — ready to sync with Google Sheets."`).

### [Issue 8] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: Medium
*   **Affected Scope:** [Lines 294-295, 316-323](file:///home/zz/Projects/Spread-Spends/design_draft.md#L294-L323) (`Detailed Implementation Plan -> Sections 1-2`)
*   **Discrepancy Description:** Minor string and handler name discrepancies in `InstallAppModal.tsx`, `CreateGroupModal.tsx` (`handleSubmit` resets `setCurrency('INR')` rather than `handleClose`, and button text is `"Create Group Sheet"`), and `OpenGroupModal.tsx`.
*   **Rationale:** Matches exact codebase identifiers and strings.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 294–295 and 316–323
    *   Change: Align headings/strings in `InstallAppModal.tsx`, reference `handleSubmit` (`setCurrency('INR')`) and `"Create Group Sheet"` in `CreateGroupModal.tsx`, and reference the exact `<p>` paragraphs in `OpenGroupModal.tsx`.

### [Issue 9] [`egm-implementation-readiness`, `egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 346-351](file:///home/zz/Projects/Spread-Spends/design_draft.md#L346-L351) (`Detailed Implementation Plan -> 3. Group Header, Navigation Tabs, Overview, & Settings Tab`)
*   **Discrepancy Description:** In `CategoryPieChart.tsx`, `Avg {formatCurrency(avgExpense, currency)}` replaces the `{activeExpenses.length} expense(s)` span in the unhovered donut center, and the empty-state explanatory `<p>` paragraph should also be removed.
*   **Rationale:** Prevents four stacked text lines inside the 104px donut hole and removes empty-state subtext.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 349–351 (`./src/pages/group/summary/CategoryPieChart.tsx`)
    *   Change: Specify removing the empty-state `<p>` subtext (`"Add your first group expense to see spending distribution..."`) and replacing `{activeExpenses.length} {activeExpenses.length === 1 ? 'expense' : 'expenses'}` in the unhovered donut center with `Avg {formatCurrency(avgExpense, currency)}`.

### [Issue 10] [`egm-implementation-readiness`, `egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 352-368](file:///home/zz/Projects/Spread-Spends/design_draft.md#L352-L368) (`Detailed Implementation Plan -> 3. Group Header, Navigation Tabs, Overview, & Settings Tab`)
*   **Discrepancy Description:** Specify the empty-description fallback (`"No description"`) in `MembersSection.tsx` Card 1, and match exact strings in `PendingApprovalsList.tsx` and `InviteMemberModal.tsx`.
*   **Rationale:** Eliminates guesswork when migrating the description editor into `MembersSection.tsx` and editing `PendingApprovalsList.tsx` / `InviteMemberModal.tsx`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 355–368 (`MembersSection.tsx`, `PendingApprovalsList.tsx`, `InviteMemberModal.tsx`)
    *   Change: Specify rendering `"No description"` when `group.description` is empty in `MembersSection.tsx`, reference `{isOwner ? 'As the Google Sheet owner...' : 'Invitations proposed by members...'}` in `PendingApprovalsList.tsx`, and reference `"Google Account Email"` and `'Grant Access & Add'` / `'Submit Invitation Request'` in `InviteMemberModal.tsx`.

### [Issue 11] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: Medium
*   **Affected Scope:** [Lines 378-384](file:///home/zz/Projects/Spread-Spends/design_draft.md#L378-L384) (`Detailed Implementation Plan -> 4. Expenses Feed, Add Expense Wizard, & Transaction History Modal`)
*   **Discrepancy Description:** `TransactionItem.tsx` currently renders inline `{exp.notes && <span>• {exp.notes}</span>}` and `{s.notes && <span>• {s.notes}</span>}` on feed rows.
*   **Rationale:** Explicitly instructs removing inline notes from `TransactionItem.tsx` rows so only `{dt.date}` (for expenses) and `{dt.date} • {s.paymentMethod}` (for settlements) appear on the secondary line.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 380 and 383 (`./src/pages/group/expenses/TransactionItem.tsx`)
    *   Change: Explicitly state that `{exp.notes && ...}` and `{s.notes && ...}` are removed from the secondary metadata line of expense and settlement rows.

### [Issue 12] [`egm-implementation-readiness`, `egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 393-402](file:///home/zz/Projects/Spread-Spends/design_draft.md#L393-L402) (`Detailed Implementation Plan -> 4. Expenses Feed, Add Expense Wizard, & Transaction History Modal`)
*   **Discrepancy Description:** Specify the flex container and popover positioning for the `CategoryIcon` button beside `Name` in Step 1 of `AddExpenseModal.tsx`, and clarify that the `"Select all" / "Deselect all"` button in Step 3 (`EQUAL` split) is retained when `"Select who shares this expense..."` is removed.
*   **Rationale:** Ensures clean layout and preserves the `"Select all"` toggle in Step 3.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 395 and 402 (`./src/pages/group/expenses/AddExpenseModal.tsx`)
    *   Change: Specify wrapping the `Name` input and `<button type="button" aria-label="Select category">` in a `relative flex items-center gap-2` row with the category popover positioned `absolute left-0 top-full mt-2 z-30`, and keeping the `"Select all" / "Deselect all"` button in Step 3 inside a `flex justify-end` container.

### [Issue 13] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [Lines 432, 434, 441](file:///home/zz/Projects/Spread-Spends/design_draft.md#L432-L441) (`Detailed Implementation Plan -> 5. Balances Tab, Settle Up Modal, & Notification Settings Modal`)
*   **Discrepancy Description:** In `SettleUpModal.tsx`, the preview box is located below (not above) the `Who paid?` / `Paid to whom?` selects, and in `NotificationSettingsModal.tsx` the test notification handler is named `handleSendTest` (with state `isSendingTest`).
*   **Rationale:** Matches exact source code locations and identifier names.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 432, 434, and 441
    *   Change: Change `"above"` to `"below"` on line 432, reference `{initialSettlement ? 'Save Changes' : 'Record Payment in Sheet'}` on line 434, and reference `handleSendTest` / `isSendingTest` on line 441.

### [Issue 14] [`egm-codebase-details`, `egm-style`] - Severity: Low
*   **Affected Scope:** [Line 342](file:///home/zz/Projects/Spread-Spends/design_draft.md#L342) (`Detailed Implementation Plan -> 3. Group Header, Navigation Tabs, Overview, & Settings Tab`)
*   **Discrepancy Description:** `GroupHeader.tsx` names its tab configuration array `tabsConfig` rather than `tabs`.
*   **Rationale:** Matches the exact variable identifier in `GroupHeader.tsx`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Line 342 (`./src/components/groups/GroupHeader.tsx`)
    *   Change: Replace `tabs` with `tabsConfig`.

### [Issue 15] [`egm-codebase-details`] - Severity: Low
*   **Affected Scope:** [Lines 420-421](file:///home/zz/Projects/Spread-Spends/design_draft.md#L420-L421) (`Detailed Implementation Plan -> 5. Balances Tab, Settle Up Modal, & Notification Settings Modal`)
*   **Discrepancy Description:** `BalancesSummary.tsx` uses `isCurrentUser` rather than `isMe`.
*   **Rationale:** Matches the exact local variable name in `BalancesSummary.tsx`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Line 421 (`./src/pages/group/balances/BalancesSummary.tsx`)
    *   Change: Replace `isMe` with `isCurrentUser` and note keeping `isModalOpen?`, `onOpenModal?`, and `onCloseModal?` as optional interface props on `BalancesSummaryProps` without destructuring them.

### [Issue 16] [`egm-codebase-details`, `egm-style`] - Severity: Low
*   **Affected Scope:** [Line 427](file:///home/zz/Projects/Spread-Spends/design_draft.md#L427) (`Detailed Implementation Plan -> 5. Balances Tab, Settle Up Modal, & Notification Settings Modal`)
*   **Discrepancy Description:** `SimplifiedDebtsList.tsx` maps over `debts` using iterator variable `d` rather than `debt`.
*   **Rationale:** Matches the exact variable name in `SimplifiedDebtsList.tsx`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Line 427 (`./src/pages/group/settlement/SimplifiedDebtsList.tsx`)
    *   Change: Replace `{formatCurrency(debt.amount, debt.currency)}` with `{formatCurrency(d.amount, d.currency)}`.

### [Issue 17] [`egm-codebase-details`, `egm-style`] - Severity: Low
*   **Affected Scope:** [Lines 449-452](file:///home/zz/Projects/Spread-Spends/design_draft.md#L449-L452) (`Detailed Implementation Plan -> 6. Automated Test Suite Updates`)
*   **Discrepancy Description:** `balancesAndExpensesTabs.test.ts` and `transactionItemInteraction.test.ts` import components via barrel re-export files in `src/components/settlements/` and `src/components/transactions/`.
*   **Rationale:** Clarifies that the barrel re-export files remain intact.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid critique.
*   ***Proposed Edit:***
    *   Location: Lines 449–452 (`6. Automated Test Suite Updates`)
    *   Change: Add a note that barrel re-export files in `src/components/settlements/` and `src/components/transactions/` remain intact.
