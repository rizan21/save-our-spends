# Owner-Managed Member Soft-Deletion, Drive Permission Audit & Multi-Member Restore

* **Author:** Spread-Spends Engineering
* **Date:** 2026-10-24
* **Task Directory:** `docs/designs/member-soft-delete-sync/`

## Overview

In a decentralized, client-side expense application backed by Google Sheets and Google Drive, managing group membership requires reconciling user records in spreadsheet cells with access permissions in Google Drive. 

This feature provides:
1. Owner-initiated soft-deletion of members, revoking their Google Drive edit access while preserving their personal spreadsheet tab (`Exp_<email>`), formulas, and historical financial transactions.
2. Distinct visual treatment for removed members: grayscale avatars and `(Removed)` prefixes across transactions and balances, with confirmation warnings when editing historical records that include them.
3. Multi-member collaborative restore requests, allowing non-owners to endorse restoring a removed peer before owner approval.
4. An owner-driven Drive permission audit in Group Settings that compares Google Drive sharing lists against spreadsheet members, categorizing users into active, inactive, and anomalous permission states with one-click remediation.

## Analysis

### 1. Financial Ledger Integrity and Formula Continuity
* **Tab Preservation**: Transactions logged by individual members reside in per-member worksheets (`Exp_<email>`) to prevent concurrent write contention. Soft-deleting a member must never delete or rename their personal tab.
* **Master Formula Rollup**: The `=IFERROR(SORT(VSTACK('Exp_a'!A2:N, ...), 2, FALSE), "")` formula in `All_Expenses` references tabs for all members with historical transactions. Dropping an inactive member from the formula would cause their past expenses to disappear from the ledger. Tab generation formulas must retain all member tabs that contain records, regardless of active or inactive status.
* **Balance and Debt Simplification**: When a member is soft-deleted, their historical contributions and debts remain part of the group's net balances. Active members can view these debts and record settlements with the removed member to clear balances.

### 2. User Experience and Historical Record Guards
* **Visual Hierarchy**: Removed members are rendered with grayscale avatars (`filter: grayscale(100%) opacity-75`) and a `(Removed)` badge or prefix in transaction lists, history logs, balances, and settlement screens.
* **New Expense Selection Guard**: Removed members are removed from the member picker in the expense creation wizard. New expenses cannot allocate shares or payments to removed members.
* **Historical Edit Confirmation Modal**: If an existing expense or settlement that includes a soft-deleted member is edited or deleted, the application displays a confirmation prompt: "Adding or editing a transaction with deleted users might irreversibly change the transaction. Do you want to proceed?" All members must confirm before saving changes.

### 3. Drive Permission Synchronization and Anomaly Detection
* **Out-of-Band Permission Drift**: Because Google Drive file sharing can be modified directly in the Google Drive web interface without notifying the app, spreadsheet membership can drift out of sync with Drive permissions.
* **On-Demand Permission Audit**: An owner-accessible "Sync User List" button in Group Settings queries `drive.permissions.list`. The audit identifies:
  * **Lost Writer**: Member is marked `ACTIVE` in the sheet, but lacks `writer` permission in Drive. Remediation: Re-grant Drive writer permission or mark inactive.
  * **Ghost Writer**: User has `writer` permission in Drive, but is missing from the `Members` tab. Remediation: Add to `Members` as active, or remove Drive permission.
  * **Zombie Access**: Member is marked `INACTIVE` in the sheet, but still holds `writer` permission in Drive. Remediation: Delete Drive permission.
  * **Anomalous Roles**: User holds `reader` or `commenter` permissions instead of `writer`. Remediation: Upgrade to `writer` or remove access.
  * **Multiple Owners**: Additional Google account holds `owner` role. Remediation: Surface advisory warning.
* **Least-Privilege Drive API Scope**: Drive permissions are managed via `drive.file` scope using `permissions.create`, `permissions.delete`, and `permissions.update`.

### 4. Collaborative Multi-Member Restore Petitions
* **Democratic Request Queue**: Non-owners cannot directly grant Drive permissions or reactivate members. Instead, any non-owner can submit or endorse a restore petition for a soft-deleted member.
* **Endorsement Aggregation**: The restore request aggregates petitioning users (`{User A}, {User B} and {N} others requested restore`) to prevent duplicate rows.
* **Owner Approval**: The group owner reviews pending restore requests in Settings, approving them to re-grant Drive `writer` access and reset member status to `ACTIVE`.

### 5. Settings Screen Structural Organization
The Group Settings tab is organized into six functional sections:
1. **Group Description & Currency**: Metadata and group identifier.
2. **Pending Invitations**: Direct invites to new email addresses awaiting acceptance or owner approval.
3. **Restore Requests**: Petitions from existing members to restore removed peers, displaying petitioning member lists and owner approval controls.
4. **Active Members**: List of active contributors with soft-delete action buttons for the owner.
5. **Inactive Members**: Soft-deleted contributors with grayscale avatars, outstanding balances, and restore action buttons.
6. **Anomalous Members**: Discrepancies discovered during Drive permission sync with one-click remediation controls.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Implement owner soft-deletion of members, updating member status to `INACTIVE` in the `Members` sheet and deleting their Google Drive file permission.
  * Retain `Exp_<email>` tabs and maintain them in the `All_Expenses` `VSTACK` formula for soft-deleted members.
  * Include soft-deleted members in `calculateBalances` and `simplifyDebts` computations.
  * Display grayscale avatars and `(Removed)` name formatting for inactive members.
  * Filter soft-deleted members out of new expense participant pickers.
  * Display a confirmation warning modal when any user attempts to edit or delete a transaction containing an inactive member.
  * Implement collaborative multi-member restore petitions with aggregated endorsement lists and owner approval.
  * Add a "Sync User List" button in Group Settings that compares Drive file permissions against the `Members` tab and flags discrepancies.
  * Provide one-click remediation for anomalous Drive permissions (add missing member, upgrade role to writer, or revoke access).
  * Structure Group Settings into six distinct cards: Description, Pending Invitations, Restore Requests, Active Members, Inactive Members, and Anomalous Members.

* **Out-of-Scope Non-Goals:**
  * Permanent hard deletion of user tabs or historical transactions from Google Sheets.
  * Background cron or automated polling of Drive permissions (sync is user-triggered to conserve API quotas).
  * Automated migration of Google Workspace group permissions or service accounts.

## Key Decisions & Staging for Next Steps

1. **Restore Request Persistence**:
   * *Decision*: Use a dedicated `Restore_Requests` tab in the spreadsheet (`['Request ID', 'Target Email', 'Target Name', 'Requested By Emails', 'Requested By Names', 'Status', 'Requested At', 'Approved At']`). This prevents overloading `Pending_Invites` and keeps schemas modular.
2. **Sync Execution Model**:
   * *Decision*: Sync runs on-demand via the "Sync User List" button in Settings, avoiding automatic Drive API requests on routine view transitions.
3. **Settlement Interactions**:
   * *Decision*: Active members can continue to record settlements with inactive members to resolve outstanding balances, but cannot add inactive members to new split expenses.
4. **Staging for `/egm-draft`**:
   * Ready for formal system design specification covering data schema additions, Google Drive permission API client methods, mock services, UI component breakdowns, and unit test specifications.
