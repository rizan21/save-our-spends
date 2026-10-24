# Minimalist UI Overhaul

* **Author:** zz
* **Date:** 2026-10-24

## Overview

Spread-Spends currently suffers from excessive explanatory text, marketing callouts inside functional screens, redundant summary cards, and horizontal overflow on 412px mobile viewports (Pixel 9). This overhaul strips every screen and modal down to essential data and controls, consolidates navigation and account actions, and eliminates runtime developer/debug artifacts from the production UI.

## Analysis

### Cross-Cutting Findings & Resolved Decisions from Goldfish Reviews

1. **Full Tab Route Key Migration (`members` -> `settings`)**
   - In [`useSwipeableTabs.ts`](file:///home/zz/Projects/Spread-Spends/src/hooks/useSwipeableTabs.ts#L3), `GROUP_TABS` will be updated to `['overview', 'expenses', 'balances', 'settings'] as const` (`type GroupTab = (typeof GROUP_TABS)[number]`).
   - All references in [`GroupHeader.tsx`](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx), [`groupSections.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/groupSections.tsx), [`useAppRoute.ts`](file:///home/zz/Projects/Spread-Spends/src/router/useAppRoute.ts), and all unit/integration tests in `src/test/` will be updated in lockstep to use `'settings'` as the key and `'Settings'` as the label.

2. **Expense Row Amount Display (`TransactionItem.tsx`)**
   - When the current user is involved (`Math.abs(userNet) > 0.005`), the expense row shows the **total expense amount** (`formatCurrency(exp.amount, currency)`) alongside the signed colored user-involved delta (`+₹94.61` in emerald or `-₹100.00` in rose), without `"You lent"` / `"You borrowed"` text labels.
   - When the current user is **not involved** (`Math.abs(userNet) <= 0.005`), the total expense amount is hidden and the right side displays only `"You are not involved"` in muted grey.

3. **Settlement Row Display (`TransactionItem.tsx`)**
   - Settlement rows keep both the small avatars and member names (`[PayerAvatar] PayerName paid [PayeeAvatar] PayeeName`) formatted cleanly on a single compact line with short `Date • PaymentMethod` underneath and the settlement amount on the right (without `"You received"` / `"You paid"` / `"Settled"` sub-labels).

4. **Soft-Delete Plumbing & Active Count Fix (`TransactionHistoryModal.tsx` & `TransactionList.tsx`)**
   - Moving the `Delete` action out of [`TransactionItem.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionItem.tsx) and into [`TransactionHistoryModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionHistoryModal.tsx) adds an `onDelete` prop to `TransactionHistoryModalProps` wired in [`GroupDetailPage.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx#L326-L343) to call `deleteExpense` / `deleteSettlement` (which soft-delete by setting `status: 'DELETED'` in [`groupService.ts`](file:///home/zz/Projects/Spread-Spends/src/services/groupService.ts#L340-L451)).
   - In [`TransactionList.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/TransactionList.tsx#L79-L100), the filter pills (`All`, `Expenses`, `Settlements`) will compute counts from active items (`status !== 'DELETED'`) so soft-deleted rows do not inflate the badge numbers.

5. **Time Input Format (`HH:MM` vs `HH:MM:SS`)**
   - Both [`AddExpenseModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/expenses/AddExpenseModal.tsx#L771) and [`SettleUpModal.tsx`](file:///home/zz/Projects/Spread-Spends/src/pages/group/settlement/SettleUpModal.tsx#L306) remove `step="1"` from `<input type="time" />` and format the time state to 5-character `"HH:MM"` so seconds are hidden while remaining compatible with `combineDateAndTime`.

6. **Category Popover Positioning on Mobile (`AddExpenseModal` Step 1)**
   - Replacing the static category chip grid with an icon button beside the `Name` input that opens a floating popover includes outside-click and Escape-key dismissal so it does not trap focus or clip outside the modal container on 412px screens.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Strip all explanatory subtitles, helper paragraphs, and marketing cards across all 15 screens and modals.
  - Consolidate `Install App` and `Sign Out` into `EditProfileModal`; keep only `ThemeToggle` and `UserAvatar` in the top-right `Navbar`.
  - Remove runtime OAuth Client ID editing/storage from `LoginScreen` and `googleAuth.ts`; rely strictly on `import.meta.env.VITE_GOOGLE_CLIENT_ID` and log a `console.error` when missing.
  - Fix all mobile horizontal overflow in `GroupList`, `GroupCard`, `GroupHeader`, and `AddExpenseModal` Step 3.
  - Make `CategoryPieChart` (with `Avg` expense in the donut center) the sole component on the `Overview` tab; move editable Group Description, Created Date, Currency, and `"Open in Google Sheets"` button to Card 1 of the renamed `Settings` tab (`settings` route key).
  - Simplify `TransactionItem` rows (no inline edit/delete/history icons, no `Edited (n)` badge, no `HH:MM:SS`, show total amount + signed user delta when involved or `"You are not involved"` without total amount when uninvolved; compact `[Avatar] Name paid [Avatar] Name` for settlements).
  - Add soft-delete `Delete` button and default-collapsed audit trail items to `TransactionHistoryModal`.
  - Render all members inline in `BalancesSummary` (eliminating the Member Balances popup modal) and compact `MemberSpendings` and `SimplifiedDebtsList`.
  - Remove debug controls (`Send Test Notification`, `Verify subscriptions in KV`) from `NotificationSettingsModal`.
  - Update all affected unit and integration tests in `src/test/`.
* **Out-of-Scope Non-Goals:**
  - Changing the Google Sheets storage schema or spreadsheet formulas.
  - Adding new backend/Cloudflare Worker endpoints.
  - Changing the 3-step wizard sequence in `AddExpenseModal`.

## Key Decisions & Staging for Next Steps

1. **Screen 1 (`Navbar`, `OfflineIndicator`)**: Top-right navbar has only `ThemeToggle` + `UserAvatar`. `Install App` and `Sign Out` move into `EditProfileModal`. `OfflineIndicator` copy becomes `"Offline"` / `"Back online"`.
2. **Screen 2 (`LoginScreen`, `googleAuth.ts`)**: Delete subtitle, helper text, `"Why Google Sheets?"`, and OAuth Client ID input. Log `console.error` when `VITE_GOOGLE_CLIENT_ID` is missing in `env`. Rename install button to `"Install App"`.
3. **Screen 3 (`InstallAppModal`)**: Keep only `Android | iOS` switcher and the 3 steps (or 1-tap install button). Delete perks, subtitles, headings, and footer buttons.
4. **Screen 4 (`GroupList`, `GroupCard`)**: Delete subtitle; put 3 icon buttons (`RefreshCw`, `Bell`, `FolderDown`) + `"+ New"` pill on the `Your Groups` title row; combine `Owed` / `Owe` into a 2-column grid on mobile; remove `Active Settlements` from home screen; on `GroupCard`, remove green table icon, `"• Google Sheet"`, `"Shared with you"` badge, and `"YOU ARE OWED"` / `"YOU OWE"` labels (keep `"Owner"` badge and signed colored amount).
5. **Screen 5 (`CreateGroupModal`, `OpenGroupModal`)**: `CreateGroupModal` keeps only `Group Name` and `Currency` (default `'INR'`), button `"Create"`. `OpenGroupModal` deletes `drive.file` paragraph and card subtext.
6. **Screen 6 (`EditProfileModal`)**: Compact `[Avatar] email` header, `Display Name` input with inline `Restore`, `Save` button, plus `Install App` and `Sign Out` buttons.
7. **Screen 7 (`GroupHeader`, `groupSections`, `useSwipeableTabs`)**: Delete owner/shared badge and currency/member count subtitle; keep only `+ Add Expense` and `Settle Up` buttons; rename tabs and keys to `Overview ('overview') | Expenses ('expenses') | Balances ('balances') | Settings ('settings')`.
8. **Screen 8 (`SummarySection`, `CategoryPieChart`)**: Delete Group Overview card, 3 metric cards, and Recent Expenses from `Overview`. Show `Avg {currency}` inside the center of `CategoryPieChart` below Total Spending; delete chart subtitles/helper text.
9. **Screen 9 (`TransactionList`, `TransactionItem`)**: Remove inline `Edit`/`Delete`/`History` icons and `Edited (n)` badge. Expense row shows `CategoryIcon`, `Name`, `Date` on left; on right, if involved, show total amount + signed colored user delta (`+₹X` / `-₹Y`), and if not involved, hide total amount and show only `"You are not involved"`. Settlement row shows `HandCoins`, `[PayerAvatar] PayerName paid [PayeeAvatar] PayeeName`, `Date • Method` on left, and amount on right. Fix active filter counts in `TransactionList`.
10. **Screen 10 (`AddExpenseModal`)**: Keep 3 steps without subtitles; buttons `"Who Paid ->"` and `"Who Owes ->"`. Step 1: rename `Description` to `Name`, put `CategoryIcon` button beside `Name` with a floating popover picker, `HH:MM` time, `+ Add note` toggle. Step 2: remove helper text, member emails, and `"Exact match!"` text. Step 3: full-width 4-column split bar without `"Split method"` label, remove `"Select who shares..."` and `"NET IMPACT"` box.
11. **Screen 11 (`TransactionHistoryModal`)**: Remove `"ACTIVE"` badge, `"Newest modifications first"`, `"edited this transaction"`, and summary sentence box. Add soft-delete `"Delete"` button alongside `"Edit"`. Collapse audit trail items by default (showing editor avatar, name, and time; expand on click to show field diffs).
12. **Screen 12 (`BalancesSummary`, `MemberSpendings`, `SimplifiedDebtsList`)**: Inline all member balances in `BalancesSummary` (delete popup modal) and remove `"You get back"` / `"Owes"` sub-labels. Remove `MemberSpendings` subtitle and per-bar `"Paid"` / `"Consumed"` labels. Single-line debt rows in `SimplifiedDebtsList` without subtitle.
13. **Screen 13 (`SettleUpModal`)**: Delete subtitle and `Payer pays -> Recipient` preview box; `HH:MM` time; button `"Save"`.
14. **Screen 14 (`Settings` Tab: `MembersSection`, `MemberList`, `PendingApprovalsList`, `InviteMemberModal`)**: Card 1 (`Group Info`): editable description, `Created [Date] • Currency: [INR]`, and `"Open in Google Sheets"` button (delete `DirectSheetsLink` marketing card). Card 2 (`Members`): `PendingApprovalsList` (no paragraph) + `MemberList` (no subtitle, only `"Owner"` badge). `InviteMemberModal`: title `"Invite Member"`, no subtitle, no permission info box.
15. **Screen 15 (`NotificationSettingsModal`)**: Title `"Notifications & Sync"`, strip `[SpreadSpends]` prefix/subtext, delete `"0ms Local Sync"` and `"Zero Financial Data"` paragraphs, delete `"Send Test Notification"` button and `"Verify subscriptions in KV (debug)"` link.
