# Goldfish Implementation Readiness Report (Stage 9)

**Target:** [`/home/zz/Projects/Spread-Spends/design_draft.md`](file:///home/zz/Projects/Spread-Spends/design_draft.md#L250-L458) (`DetailedRange`: lines 250–458)
**Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
**Summary:** **5 🔴 Blockers**, **8 🟡 Major**, **4 🟢 Nits**

---

## 🔴 Blockers (Will Cause Compile, Runtime, or Test Failures)

### 1. Non-Existent `this.isDemoMode()` Method Call in `GoogleAuthService` - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** [Line 259](file:///home/zz/Projects/Spread-Spends/design_draft.md#L259)
* **Discrepancy Description**: Line 259 instructs:
  > In `initClient()` and `requestLogin()`, when `!clientId && !this.isDemoMode()`, call `console.error(...)`
  In [`./src/services/googleAuth.ts`](file:///home/zz/Projects/Spread-Spends/src/services/googleAuth.ts#L22), `this.isDemoMode` is a private `boolean` property (`private isDemoMode: boolean = false;`), not a method (the public getter is `this.getIsDemoMode()` on line 92). Calling `this.isDemoMode()` causes a TypeScript compile error (`Type 'Boolean' has no call signatures`) and a runtime `TypeError`. Additionally, the console error message on line 259 (`'[Spread-Spends] Missing Google OAuth Client ID. Please set VITE_GOOGLE_CLIENT_ID in your .env file.'`) contradicts the message specified in Architecture Section 2A on line 163 (`'[Spread-Spends] Missing VITE_GOOGLE_CLIENT_ID environment variable. Provide VITE_GOOGLE_CLIENT_ID in your .env file.'`).
* **Rationale & Recommendation**: Change `!this.isDemoMode()` on line 259 to `!this.isDemoMode` (or `!this.getIsDemoMode()`), and unify the exact `console.error` string between lines 163 and 259.

---

### 2. Non-Existent `setIsInstallModalOpen` Identifier in `App.tsx` - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** [Line 286](file:///home/zz/Projects/Spread-Spends/design_draft.md#L286)
* **Discrepancy Description**: Line 286 instructs:
  > Pass `onLogout={logout}`, `showInstallButton={!isStandalone}`, and `onOpenInstall={() => { setIsEditProfileOpen(false); setIsInstallModalOpen(true); }}` to `<EditProfileModal />`.
  In [`./src/App.tsx`](file:///home/zz/Projects/Spread-Spends/src/App.tsx#L43-L52), install modal visibility is managed by `usePwaInstall()`, which exports `openInstallModal: () => void` and `closeInstallModal: () => void`—there is no `setIsInstallModalOpen` state setter in `App.tsx`. Using `setIsInstallModalOpen(true)` fails `tsc -b` with `Cannot find name 'setIsInstallModalOpen'`.
* **Rationale & Recommendation**: Update line 286 to call `openInstallModal()`:
  `onOpenInstall={() => { setIsEditProfileOpen(false); openInstallModal(); }}`.

---

### 3. Unspecified Unused Locals, Destructured Props, & Imports Under Strict `noUnusedLocals` / `noUnusedParameters` - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** [Lines 269, 280, 294, 305, 309–310, 317, 335, 339–342, 345, 359, 362, 368, 378–384, 402, 408, 420–421, 432, 439–441](file:///home/zz/Projects/Spread-Spends/design_draft.md#L269-L441)
* **Discrepancy Description**: [`tsconfig.app.json`](file:///home/zz/Projects/Spread-Spends/tsconfig.app.json#L20-L21) enforces `"noUnusedLocals": true` and `"noUnusedParameters": true`, and the Verification Plan (line 457) requires `bun run build` (`tsc -b && vite build`) and `bun run lint` (`oxlint`) to pass with zero errors. The plan omits mandatory cleanup of variables, destructured props, and imports that become unused when executing the specified JSX deletions in 14 files:
  1. [`LoginScreen.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/auth/LoginScreen.tsx#L1-L37) (line 269): Deleting the Client ID config block and `"Why Google Sheets?"` card leaves `useState`, `Key`, `CheckCircle2`, `ShieldCheck`, `ExternalLink`, `ArrowRight`, `Button`, and destructured props `clientId`, `onSaveClientId` unused.
  2. [`EditProfileModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/auth/EditProfileModal.tsx#L6) (line 280): Removing `"Google Account Photo"` leaves `Sparkles` unused.
  3. [`InstallAppModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/pwa/InstallAppModal.tsx#L6-L8) (line 294): Removing the 3 perk cards leaves `WifiOff`, `Zap`, `CheckCircle2` unused.
  4. [`GroupList.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupList.tsx#L2-L46) (line 305): Removing `"Active Settlements"` leaves `HandCoins`, `UserAvatar`, and destructured props `activeSettlements`, `onSettleDebt` unused.
  5. [`GroupCard.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/groups/GroupCard.tsx#L1) (lines 309–310): Removing the `Table` icon box and replacing the inline owner/shared spans with `<Badge variant="emerald">Owner</Badge>` requires importing `Badge` from `../../components/common/Badge` and removing unused `Table`, `UserCheck`, `Shield` imports.
  6. [`CreateGroupModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/groups/CreateGroupModal.tsx#L4-L55) (line 317): Removing the `Description` and `Invite Members` inputs leaves `Plus`, `X`, `Users` imports and `description`, `memberEmailInput`, `memberEmails`, `handleAddMember`, `handleRemoveMember` unused.
  7. [`groupSections.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/groupSections.tsx#L2) (line 335): Changing `icon: Users` to `icon: Settings` requires replacing `Users` with `Settings` in the `lucide-react` import.
  8. [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx#L54) (lines 339–342): Removing the `"Currency: X • Y members"` subtitle leaves `const currency = ...` (line 54) unused; `Settings` must also be added to the `lucide-react` import.
  9. [`SummarySection.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/summary/SummarySection.tsx#L1-L106) (line 345): Rendering only `<CategoryPieChart />` leaves `useState`, `FormEvent`, `ExpenseCategory`, `formatCurrency`, `formatTransactionDateTime`, `CATEGORY_META`, `CategoryIcon`, `Button`, `Badge`, `UserAvatar`, 11 `lucide-react` icons, and all description/stats/recent-expenses locals unused.
  10. [`DirectSheetsLink.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/export/DirectSheetsLink.tsx#L1) & [`MemberList.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/MemberList.tsx#L1) & [`InviteMemberModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/members/InviteMemberModal.tsx#L4) (lines 359, 362, 368): Leaves `Sheet, CheckCircle, Database` (`DirectSheetsLink.tsx`), `Shield` (`MemberList.tsx`), and `ShieldCheck, Clock` (`InviteMemberModal.tsx`) unused.
  11. [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx#L3-L185) (lines 378–384): Removing inline buttons, `Edited (n)`, and payer text leaves `Pencil, History, Trash2` imports, destructured props `onEdit`, `onDelete`, and locals `hasHistory`, `payerEmails`, `singlePayerEmail`, `singlePayerMember`, `primaryPayerName` unused.
  12. [`AddExpenseModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/AddExpenseModal.tsx#L310-L322) (line 402): Deleting `"Net Impact for this Expense"` leaves `balancePreview` (lines 310–322) unused.
  13. [`BalancesSummary.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/balances/BalancesSummary.tsx#L4-L30) (lines 420–421): Removing the modal and sub-labels leaves destructured props `isModalOpen: controlledModalOpen`, `onOpenModal`, `onCloseModal` (lines 27–29) and `ArrowDownLeft, ArrowUpRight` (line 4) unused.
  14. [`SettleUpModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/settlement/SettleUpModal.tsx#L4-L155) (line 432) & [`NotificationSettingsModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/notifications/NotificationSettingsModal.tsx#L4-L67) (lines 439–441): Deleting the preview box in `SettleUpModal.tsx` leaves `UserAvatar`, `ArrowRight`, `currentPayer`, `currentPayee` unused; deleting the subtext, marketing cards, test notification button, and KV debug link in `NotificationSettingsModal.tsx` leaves `Send, ShieldCheck, Zap` imports, `isSendingTest`, `handleSendTest`, and destructured props `groupId`, `groupName`, `onSendTestNotification` unused.
* **Rationale & Recommendation**: Explicitly specify removing all unused imports, destructured props, and local variables in each file's **Changes** block so `tsc -b` and `oxlint` succeed on the first pass.

---

### 4. `TransactionHistoryModal` Direct Function Call in Tests vs. Hook State & Missing `revDt` Variable - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** [Lines 406–410, 451–452](file:///home/zz/Projects/Spread-Spends/design_draft.md#L406-L410) (and [Line 197](file:///home/zz/Projects/Spread-Spends/design_draft.md#L197))
* **Discrepancy Description**:
  1. In [`./src/test/transactionItemInteraction.test.ts`](file:///home/zz/Projects/Spread-Spends/src/test/transactionItemInteraction.test.ts#L117-L176), `TransactionHistoryModal({...})` is invoked **directly as a plain TypeScript function**. While line 409 rightly notes that `<details>` avoids calling `useState`, Section 2E (line 197) mentions setting an `isDeleting` loading/disabled guard on the footer buttons until `onDelete` settles.
  2. Line 409 references `{revDt.full}`, whereas [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx#L55-L61) defines `formatDateTime(record.editedAt)`.
* **Rationale & Recommendation**: Keep `TransactionHistoryModal` completely hook-free (omitting `isDeleting` on line 197, consistent with line 410) and replace `{revDt.full}` on line 409 with `{formatDateTime(record.editedAt)}` (and specify importing `ChevronDown` and `Trash2` from `lucide-react`, while removing unused `CheckCircle2`).

---

### 5. Unspecified Formatting for `exp.paidBy` and `exp.splits` (`Record<string, number>`) in `TransactionHistoryModal` - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** [Line 407](file:///home/zz/Projects/Spread-Spends/design_draft.md#L407)
* **Discrepancy Description**: Line 407 instructs:
  > In the top summary card, render compact read-only lines for `Paid by` (`exp.paidBy`), `Split` (`exp.splits`), and `Notes` (`data.notes`, when present).
  In [`./src/types/transaction.ts`](file:///home/zz/Projects/Spread-Spends/src/types/transaction.ts), `exp.paidBy` and `exp.splits` are `Record<string, number>` objects mapping email addresses to numeric amounts—they cannot be interpolated directly as React children (`Objects are not valid as a React child`). Moreover, `transaction` in `TransactionHistoryModal` is a discriminated union (`EXPENSE | SETTLEMENT`), so `paidBy` and `splits` only exist when `isExpense` is true.
* **Rationale & Recommendation**: Specify the exact rendering rule for `Paid by`, `Split`, and `Notes` in `TransactionHistoryModal.tsx`:
  - Guard `Paid by` and `Split` with `isExpense`: format each entry in `Object.entries(exp.paidBy)` and `Object.entries(exp.splits)` (filtering `amt > 0`) as `${getMember(email)?.name || email.split('@')[0]} (${formatCurrency(amt, data.currency || currency)})` joined by `, `.
  - Render `Notes: {data.notes}` when `data.notes` is truthy (for both expenses and settlements).

---

## 🟡 Major Issues (Codebase Mismatches & Implementation Ambiguities)

### 6. `useAuth.ts` Does Not Have a `clientId` State Property - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** [Lines 260–262](file:///home/zz/Projects/Spread-Spends/design_draft.md#L260-L262)
* **Discrepancy Description**: [`./src/hooks/useAuth.ts`](file:///home/zz/Projects/Spread-Spends/src/hooks/useAuth.ts#L40-L73) does not have a `clientId` property or state; it exports `setCustomClientId` and `getCustomClientId` callbacks, which [`./src/App.tsx`](file:///home/zz/Projects/Spread-Spends/src/App.tsx#L39-L40) destructures and passes to `<LoginScreen />`.
* **Rationale & Recommendation**: Specify that `setCustomClientId` in `useAuth.ts` becomes a no-op and `getCustomClientId` returns `googleAuthService.getClientId()`, while `LoginScreenProps` keeps `clientId?: string` and `onSaveClientId?: (id: string) => void` as optional interface properties (without destructuring them in `LoginScreen`).

---

### 7. Inaccurate State/Handler Names and Target Strings in `LoginScreen.tsx`, `EditProfileModal.tsx`, and `OfflineIndicator.tsx` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** [Lines 266–269, 280–282, 289](file:///home/zz/Projects/Spread-Spends/design_draft.md#L266-L289)
* **Discrepancy Description**:
  - **Line 266 (`LoginScreen.tsx`)**: Actual subtitle is `"Expense sharing powered natively by your Google Sheets"`.
  - **Line 267 (`LoginScreen.tsx`)**: Actual helper text below the sign-in button is `"Sign in with your Google account to create and access your group spreadsheets."`.
  - **Line 269 (`LoginScreen.tsx`)**: Actual local identifiers are `showConfig`, `clientIdInput`, `savedSuccess`, and `handleSave`.
  - **Lines 280–282 (`EditProfileModal.tsx`)**: Actual strings are `"Profile picture is set to your connected Google account."`, `"This name will be shown on expense splits, shared groups, and settlement receipts."`, and `"Save Changes"`.
  - **Line 289 (`OfflineIndicator.tsx`)**: Actual strings are `"Offline Mode — viewing cached groups, expenses, and balances."` and `"Back online — ready to sync with Google Sheets."`.
* **Rationale & Recommendation**: Update lines 266–269, 280–282, and 289 to reference the exact identifier names and strings present in the codebase.

---

### 8. Inaccurate Strings & Non-Existent `handleClose` in `InstallAppModal.tsx`, `CreateGroupModal.tsx`, and `OpenGroupModal.tsx` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** [Lines 294–295, 316–323](file:///home/zz/Projects/Spread-Spends/design_draft.md#L294-L323)
* **Discrepancy Description**:
  - **`InstallAppModal.tsx` (lines 294–295)**: Actual headings/notes are `"How to install on Android Chrome / Edge / Firefox"`, `"How to install on iPhone & iPad (Safari)"`, and `"Once installed, launch Spread-Spends directly from your home screen for full offline viewing."`, plus the `"One-Tap Install Ready"` subtext.
  - **`CreateGroupModal.tsx` (lines 316–318)**: Reset happens inside `handleSubmit` (`setCurrency('INR')`), and the submit button currently reads `"Create Group Sheet"`.
  - **`OpenGroupModal.tsx` (lines 322–323)**: `<Modal>` has no `description` prop; remove the top `drive.file` `<p>` paragraph, the `"Pick any shared spreadsheet from your Drive."` subtext, and the `"Paste a link shared with you..."` helper text.
* **Rationale & Recommendation**: Align lines 294–295 and 316–323 with the exact elements and strings in `InstallAppModal.tsx`, `CreateGroupModal.tsx`, and `OpenGroupModal.tsx`.

---

### 9. Donut Center Text Replacement & Empty-State Subtext in `CategoryPieChart.tsx` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** [Lines 346–351](file:///home/zz/Projects/Spread-Spends/design_draft.md#L346-L351)
* **Discrepancy Description**:
  1. In [`CategoryPieChart.tsx:195-197`](file:///home/zz/Projects/Spread-Spends/src/pages/group/summary/CategoryPieChart.tsx#L195-L197), `Avg {formatCurrency(avgExpense, currency)}` replaces the `{activeExpenses.length} {activeExpenses.length === 1 ? 'expense' : 'expenses'}` span beneath `{formatCurrency(totalSpend, currency)}`.
  2. When `activeExpenses.length === 0`, [`CategoryPieChart.tsx:102-104`](file:///home/zz/Projects/Spread-Spends/src/pages/group/summary/CategoryPieChart.tsx#L102-L104) renders explanatory subtext (`"Add your first group expense to see spending distribution and insights broken down by category."`).
* **Rationale & Recommendation**: Explicitly state on line 351 that `Avg {formatCurrency(avgExpense, currency)}` replaces `{activeExpenses.length} expense(s)`, and specify removing the empty-state `<p>` subtext on lines 102–104.

---

### 10. `MembersSection.tsx` Card 1 (`Group Info`) State Migration & Props Compatibility - Severity: 🟡 Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** [Lines 352–368](file:///home/zz/Projects/Spread-Spends/design_draft.md#L352-L368)
* **Discrepancy Description**:
  1. In `MembersSection.tsx` Card 1 (`Group Info`), specify what renders when `group.description` is empty (show `"No description"` without explanatory subtext).
  2. In `PendingApprovalsList.tsx`, the `<p>` paragraph is `{isOwner ? 'As the Google Sheet owner...' : 'Invitations proposed by members...'}`.
  3. In `InviteMemberModal.tsx`, the label is `"Google Account Email"` and the button is `{isOwner ? 'Add Member' : 'Propose Invite'}` (shortened from `'Grant Access & Add'` / `'Submit Invitation Request'`).
* **Rationale & Recommendation**: Update lines 355–368 with these exact strings.

---

### 11. Inline Notes Removal in `TransactionItem.tsx` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** [Lines 378–384](file:///home/zz/Projects/Spread-Spends/design_draft.md#L378-L384)
* **Discrepancy Description**: [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx#L84) renders `{s.notes && <span>• {s.notes}</span>}` on settlement rows and `{exp.notes && <span>• {exp.notes}</span>}` on expense rows.
* **Rationale & Recommendation**: Explicitly state in lines 380 and 383 that inline `{exp.notes && <span>• {exp.notes}</span>}` and `{s.notes && <span>• {s.notes}</span>}` are removed from `TransactionItem.tsx`.

---

### 12. `AddExpenseModal.tsx` Category Popover Layout & Step 3 `"Select all"` Button Disposition - Severity: 🟡 Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** [Lines 393–402](file:///home/zz/Projects/Spread-Spends/design_draft.md#L393-L402)
* **Discrepancy Description**:
  1. Specify that the `Name` input and `<button type="button" aria-label="Select category">` share a `relative flex items-center gap-2` row under the `"Name *"` label, with the floating category grid popover positioned `absolute left-0 top-full mt-2 z-30`.
  2. Specify that in Step 3 (`EQUAL` split), the `"Select all" / "Deselect all"` button (`handleToggleAllMembers`) is retained inside a `flex justify-end` container when `"Select who shares this expense..."` is removed.
* **Rationale & Recommendation**: Update lines 395 and 402 with these exact layout instructions.

---

### 13. `SettleUpModal.tsx` Preview Box Position & `NotificationSettingsModal.tsx` Handler Name - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** [Lines 432, 434, 441](file:///home/zz/Projects/Spread-Spends/design_draft.md#L432-L441)
* **Discrepancy Description**:
  - In `SettleUpModal.tsx`, the preview box is located **below** the `Who paid?` / `Paid to whom?` selects, and the submit button replaces `{initialSettlement ? 'Save Changes' : 'Record Payment in Sheet'}` with `"Save"`.
  - In `NotificationSettingsModal.tsx`, the local handler is named `handleSendTest` (and `isSendingTest`).
* **Rationale & Recommendation**: Change `"above"` to `"below"` on line 432 and `"handleSendTestNotification"` to `"handleSendTest"` on line 441.

---

## 🟢 Nits (Style, Clarity, & Minor Consistency)

### 14. `GroupHeader.tsx` Variable Name `tabs` vs `tabsConfig` - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** [Line 342](file:///home/zz/Projects/Spread-Spends/design_draft.md#L342)
* **Recommendation**: Rename `tabs` to `tabsConfig` on line 342.

---

### 15. `BalancesSummary.tsx` Variable Name `isMe` vs `isCurrentUser` & Optional Props - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** [Lines 420–421](file:///home/zz/Projects/Spread-Spends/design_draft.md#L420-L421)
* **Recommendation**: Use `isCurrentUser` on line 421 and note that `BalancesSummaryProps` retains `isModalOpen?: boolean`, `onOpenModal?: () => void`, and `onCloseModal?: () => void` as optional interface properties (without destructuring them).

---

### 16. `SimplifiedDebtsList.tsx` Prop Expression `debt` vs `d` - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** [Line 427](file:///home/zz/Projects/Spread-Spends/design_draft.md#L427)
* **Recommendation**: Use `{formatCurrency(d.amount, d.currency)}` on line 427 to match the existing iterator variable `d`.

---

### 17. Test File Re-Export Paths in Section 6 - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** [Lines 449–452](file:///home/zz/Projects/Spread-Spends/design_draft.md#L449-L452)
* **Recommendation**: Note that the barrel re-export files in `src/components/settlements/` and `src/components/transactions/` remain intact so test imports continue to resolve cleanly.
