# Comprehension & Re-Implementation Audit Report

*   **Target Document:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md`
*   **Evaluator:** Comprehension Goldfish (Naive Reader / External Implementer)
*   **Standard:** Re-Implementation & Comprehension Standard
*   **Date:** 2026-10-24

---

## Executive Summary

An external implementer with zero institutional context **cannot** implement this feature without guessing or asking clarifying questions due to several critical logical contradictions, missing service methods, and unhandled state transitions. Most notably:
1. There is an infinite contradiction loop between failed Drive permission revocation and the "Sync User List" ground-truth reconciliation engine.
2. The UI specifies a direct "Restore" button for owners, but the service architecture only implements a petition approval workflow requiring a non-existent `requestId`.
3. Editing an existing expense involving an inactive member will inadvertently strip that member from splits due to unconditional active-member filtering in `AddExpenseModal`.
4. Multiple edge cases (Drive permission types without email addresses, unparsed JSON in Sheets cells, repeated/duplicate restore endorsements, offline mutations) are either missing or technically contradictory.

---

## Itemized Findings

### Finding 1: Infinite Loop & Contradiction between Drive Revocation Failure and Sync Reconciliation
*   **Severity:** **Blocker**
*   **Affected Scope:** Section 2 (Line 139), Section 5 (Lines 176, 185–187), Detailed Plan Item 2 (Lines 294–298)
*   **Discrepancy:** If Drive permission deletion fails during member removal (e.g. rate limit, network timeout, permission inherited from a shared folder), the member is marked `INACTIVE` in the spreadsheet while retaining `writer` access in Google Drive. When the owner subsequently clicks "Sync User List", the Drive-as-ground-truth reconciliation engine will automatically re-activate the member back to `ACTIVE`, completely undoing the owner's removal.
*   **Resolution:** Require the audit engine to flag `writer + INACTIVE` members as a desynchronized anomaly (`REVOCATION_PENDING` / `DESYNCED_INACTIVE`) rather than auto-reactivating them silently, prompting the owner with explicit remediation buttons ("Retry Revocation" or "Reactivate Member").

### Finding 2: Direct Owner "Restore" Button Lacks Backing Service Method
*   **Severity:** **Blocker**
*   **Affected Scope:** Section 6 (Line 213), Detailed Plan Item 7 (Lines 336–346), Detailed Plan Item 16 (Line 396)
*   **Discrepancy:** `InactiveMembersCard.tsx` specifies a direct "Restore" button for the owner, but `groupService.ts` only provides `approveRestoreRequest(sheetId, requestId)` which requires an existing petition `requestId`. If no non-owner submitted a petition, there is no `requestId`.
*   **Resolution:** Explicitly specify `restoreMember(sheetId: string, email: string): Promise<void>` in `GroupService` and `mockGoogleService` to support direct owner restoration without requiring a petition row.

### Finding 3: Participant Filtering in `AddExpenseModal` Purges Inactive Members During Edits
*   **Severity:** **Major**
*   **Affected Scope:** Section 4 (Lines 164–165), Section 6 (Lines 60–66, 215), Detailed Plan Item 9 (Line 355), Detailed Plan Item 13 (Lines 373–378)
*   **Discrepancy:** The design allows editing existing transactions involving an inactive member after confirming a warning modal. However, the participant selector unconditionally filters `m.status === 'ACTIVE'`, which immediately strips the inactive participant from the payer or splitters list upon opening the form, breaking historical splits.
*   **Resolution:** In edit mode, candidate participants must include active members **plus** any inactive members who are already participants in the transaction being edited: `group.members.filter(m => m.status === 'ACTIVE' || existingParticipantEmails.includes(m.email))`.

### Finding 4: Ambiguous Permission ID Lookup in `softDeleteMember`
*   **Severity:** **Major**
*   **Affected Scope:** Section 2 (Line 135), Section 3.A (Line 145), Detailed Plan Item 3 (Line 313), Detailed Plan Item 7 (Line 340)
*   **Discrepancy:** `removePermission` requires a Drive `permissionId`, but `softDeleteMember(sheetId, email)` is only passed `email`. `permissionId` is not stored in the `Members` tab.
*   **Resolution:** Specify that `softDeleteMember` makes a pre-flight call to `googleDriveService.getFilePermissions(token, sheetId)`, performs a case-insensitive email match to find `permission.id`, and handles cases where no permission ID is found (logs a warning and proceeds with sheet status update).

### Finding 5: Undefined Endorsement Deduplication & Petition State Machine
*   **Severity:** **Major**
*   **Affected Scope:** Section 3.B (Lines 148–154), Detailed Plan Item 1 (Lines 275–284), Detailed Plan Item 7 (Lines 341–343)
*   **Discrepancy:** Endorsing multiple times can cause duplicate emails in `requestedByEmails`. Handling dismissed petitions is unspecified. Malformed JSON in spreadsheet cells will crash naive `JSON.parse`.
*   **Resolution:** Require array deduplication (`Array.from(new Set([...existing, requester.email]))`), define that new petitions create a new row with `crypto.randomUUID()`, and mandate safe `JSON.parse` with `try/catch` fallback returning `[]`.

### Finding 6: Inconsistent Restore Method API Between Mock and Group Service
*   **Severity:** **Major**
*   **Affected Scope:** Detailed Plan Item 4 (Line 320) vs Detailed Plan Item 7 (Line 341)
*   **Discrepancy:** `mockGoogleService` defines `endorseRestoreRequest` separately, while `groupService` combines it into `proposeRestoreRequest`.
*   **Resolution:** Unify the API across both services by providing explicit `endorseRestoreRequest(sheetId: string, requestId: string, endorser: { email: string; name: string })`.

### Finding 7: Incomplete Specification of `SettleUpModal` Filtering
*   **Severity:** **Major**
*   **Affected Scope:** Section 4 (Lines 166–167) vs Detailed Plan Item 10 (Lines 357–361)
*   **Discrepancy:** Detailed Plan Item 10 omits the condition that inactive members should only appear in `SettleUpModal` if they have a non-zero balance or active simplified debt.
*   **Resolution:** Update Detailed Plan Item 10 to include balance-checking logic.

### Finding 8: Unhandled Drive Non-User Permission Types & Undefined Anomaly `id`
*   **Severity:** **Nit**
*   **Discrepancy:** Link-sharing (`anyone`) and domain permissions lack `emailAddress`.
*   **Resolution:** Filter `type === 'user'` during user reconciliation, or handle missing `emailAddress` gracefully.

### Finding 9: Button Label Inconsistency in `TransactionInvolvesDeletedMemberWarningModal`
*   **Severity:** **Nit**
*   **Discrepancy:** When deleting a transaction involving an inactive member, the confirmation button should not say "Proceed with Edit".
*   **Resolution:** Support dynamic action labels (`action: 'edit' | 'delete'`) displaying "Proceed with Edit" or "Proceed with Delete".

### Finding 10: Impossible "Offline" Sheet Mutation Claim
*   **Severity:** **Nit**
*   **Discrepancy:** Spread-Spends has no offline mutation queue; sheet writes fail immediately if offline.
*   **Resolution:** Remove "or offline" from Line 139.

### Finding 11: Missing Header Initialization for `ensureMemberTabExists`
*   **Severity:** **Nit**
*   **Discrepancy:** Provisioning an `Exp_<email>` tab must initialize Row 1 with `HEADERS.EXPENSES`.
*   **Resolution:** Explicitly document that Row 1 is populated with `HEADERS.EXPENSES`.
