# Stage 7 Critic Review Report: Member Soft-Deletion, Drive Permission Audit & Collaborative Restore

*   **Target Document:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md` (Lines 1–265)
*   **Standard:** `feature-spec-standard`
*   **Reviewers:** `egm-design` (Hostile Architecture), `egm-structural` (Structural Layout), `egm-style` (Technical Style & Copy)
*   **Date:** 2026-10-24
*   **Consolidated Status:** 🔴 3 Blockers | 🟡 4 Major | 🟢 3 Nits

---

## Executive Summary & Triage

The Stage 7 Critic Review audited the core feature specification (lines 1–265) of the Member Soft-Deletion, Drive Permission Audit & Collaborative Restore design. While the specification demonstrates solid architectural alignment with Spread-Spends' decentralized client-side model, severe failure modes were identified in the permission synchronization state machine and collaborative petition concurrency. Specifically, a failed Drive revocation can trigger an involuntary reactivation loop upon running sync, external Drive shares can silently compromise ledger formula generation, and concurrent petition endorsements risk silent data overwrites on shared Google Sheets rows.

---

## Prioritized Findings

### 1. Permission Sync Loop Resurrects Failed Soft-Deletions
*   **Severity:** 🔴 **Blocker**
*   **Lens:** `egm-design`
*   **Affected Scope:** Lines 139, 173–187, 198–202
*   **Discrepancy:** In Section 2, the spec states that if Drive permission deletion fails during member removal, the user is marked `INACTIVE` in the sheet and flagged as an anomaly. However, Section 5 defines an automated sync rule: `writer + INACTIVE ---> Automatically Reactivate (Set ACTIVE)`. If Drive revocation fails or times out, the next time the owner runs "Sync User List", the sync engine will automatically re-activate the member back to `ACTIVE`, completely undoing the owner's removal.
*   **Recommendation:** `writer + INACTIVE` must never automatically reactivate. Classify this state as `ZOMBIE_WRITER_ACCESS` in the Anomalous Members list with explicit owner remediation buttons: **[Retry Revoke Drive Access]** and **[Reactivate Member]**.

### 2. Unauthenticated Auto-Provisioning of External Writers
*   **Severity:** 🔴 **Blocker**
*   **Lens:** `egm-design`
*   **Affected Scope:** Lines 177, 188–190
*   **Discrepancy:** The rule `writer + Missing ---> Automatically Add (Set ACTIVE, provision Exp_ tab)` creates an attack surface. Any existing Drive writer could share the spreadsheet with a third party. Clicking "Sync User List" would immediately provision a new personal tab, update the `All_Expenses` formula, and enroll the external user into the ledger without owner verification.
*   **Recommendation:** Classify untracked Drive writers (`writer + Missing`) as `UNTRACKED_WRITER_ACCESS` in the Anomalous Members section with owner remediation buttons: **[Add to Group & Provision Tab]** or **[Revoke Drive Access]**.

### 3. Concurrent Mutation Overwrite on Shared `Restore_Requests` Tab
*   **Severity:** 🔴 **Blocker**
*   **Lens:** `egm-design`
*   **Affected Scope:** Lines 120, 148–153
*   **Discrepancy:** Storing collaborative restore endorsements as a JSON array string in a single spreadsheet cell (`Requested By Emails`) causes write collision. If two members click "+ Endorse Restore" around the same time, both read the cell, append their email, and write back the entire cell. The second write will overwrite the first endorser's entry.
*   **Recommendation:** Replace the monolithic JSON array row with an append-only endorsement log model: each endorsement writes an independent row `['Request ID', 'Target Email', 'Endorser Email', 'Endorser Name', 'Timestamp']`. The UI aggregates endorsements dynamically on read.

### 4. Unbatched Drive API Mutations and Undefined Rate-Limit Recovery
*   **Severity:** 🟡 **Major**
*   **Lens:** `egm-design`
*   **Affected Scope:** Lines 135–140, 200–201
*   **Discrepancy:** Reconciling multiple anomalies with unthrottled concurrent HTTP requests against Google Drive v3 API risks exceeding Google Cloud rate limits (10 requests/sec).
*   **Recommendation:** Specify a client-side mutation throttler with exponential backoff and define rollback toast alerts on API errors.

### 5. Inconsistent Representation of State Sync Logic
*   **Severity:** 🟡 **Major**
*   **Lens:** `egm-structural`
*   **Affected Scope:** Lines 173–181, 198–202
*   **Discrepancy:** Section 5 bifurcates sync logic into an ASCII code block and a partial Markdown table, creating ambiguity for edge cases like `reader + INACTIVE`.
*   **Recommendation:** Unify Section 5 into a single comprehensive Markdown reconciliation matrix detailing `Drive Permission`, `Spreadsheet Status`, `Classification Type`, `Execution Mode`, and `Remediation Details`.

### 6. Tab Discovery Ambiguity for Master `All_Expenses` Formula
*   **Severity:** 🟡 **Major**
*   **Lens:** `egm-design`, `egm-style`
*   **Affected Scope:** Lines 25, 155–157
*   **Discrepancy:** If an inactive member's tab was deleted out-of-band in Google Sheets, referencing it in `=VSTACK('Exp_user'!A2:N)` will cause a fatal `#REF!` error across the entire expense ledger.
*   **Recommendation:** Explicitly specify that `generateAllExpensesFormula` only references tabs confirmed to exist in the live spreadsheet metadata.

### 7. Historical Edit Interceptor Scope & Form Lifecycle Ambiguity
*   **Severity:** 🟡 **Major**
*   **Lens:** `egm-design`, `egm-structural`
*   **Affected Scope:** Lines 60–66, 215
*   **Discrepancy:** Unclear whether the warning modal triggers on clicking "Edit" or submitting the form.
*   **Recommendation:** Clarify that the modal triggers upon form submission if the transaction includes any inactive participant, or immediately upon clicking "Delete Expense".

### 8. Terminology Fragmentation: "Soft-Delete" vs "Remove" vs "Inactivate"
*   **Severity:** 🟢 **Nit**
*   **Recommendation:** Standardize UI terms as "Remove Member", "(Removed)" badge, and "Inactive Members"; standardize architecture terms as "soft-delete" action and `status: 'INACTIVE'`.

### 9. Non-Standard Horizontal Rule Separators
*   **Severity:** 🟢 **Nit**
*   **Recommendation:** Replace 80-dash separators with standard `---`.

### 10. Passive Phrasing and Missing Interface Detail
*   **Severity:** 🟢 **Nit**
*   **Recommendation:** Convert passive voice in Section 1 to active voice and explicitly document the updated `GoogleDrivePermission` interface.
