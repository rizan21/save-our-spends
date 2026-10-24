# Zoom-Out Architectural Review: Member Soft-Deletion, Drive Permission Audit & Collaborative Restore

*   **Document Evaluated:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md`
*   **Review Standard:** EGM Zoom-Out Standard (Skeptical Architect / Contrarian / YAGNI)
*   **Date:** 2026-10-24

---

## Executive Summary

The proposed design correctly identifies two critical architectural imperatives in Spread-Spends:
1. **Ledger Protection:** Member deletion must never destroy Google Sheets tabs (`Exp_<email>`) or corrupt `=VSTACK(...)` formulas in `All_Expenses`.
2. **Access Control Alignment:** Out-of-band Google Drive permission changes require auditability.

However, the proposal suffers from **premature complexity, speculative state machines, and unnecessary file proliferation**:
- It invents an over-engineered multi-party endorsement voting system with JSON string arrays stored in a brand new Google Sheet tab (`Restore_Requests`).
- It introduces an aggressive "auto-sync" engine that automatically soft-deletes active members based on a single Drive API response without explicit owner confirmation.
- It proposes modifications to existing core components (`debtSimplifier.ts`, `generateAllExpensesFormula`) that **already support** inactive members without any code changes.
- It completely overlooks the application's central state and mutation layer (`useGroupDetail.ts` / TanStack Query cache).
- It prematurely decomposes a 100-line settings component into 6 separate card files across an invented directory path (`src/pages/group/settings/` instead of existing `src/pages/group/members/`).

---

## Key Review Findings

### 1. Blocker: Aggressive Auto-Soft-Deletion in "Sync User List"
* **Severity:** Blocker
* **Affected Scope:** Lines 171–194 (Section 5: Drive Permission Audit & Sync Engine)
* **Critique:**
  The design specifies: `No Permission + ACTIVE ---> Automatically Soft-Delete (Set INACTIVE, preserve Exp_ tab)`.
  In a zero-backend PWA, Google Drive permissions can fail transiently, rate-limit, or encounter eventual consistency lag. If `googleDriveService.getFilePermissions` fails or returns partial data (or if called offline/in demo mode), every active member in the group would be automatically soft-deleted from the spreadsheet without owner confirmation.
  **Recommendation:** The audit engine must be strictly advisory. "Sync User List" should display detected drift (e.g. "Bob has write access in Drive but is marked Inactive in Sheet", "Alice is Active in Sheet but has no Drive permission") and require the owner to click an explicit **"Resolve"** or **"Reconcile"** action. Never mutate member statuses automatically in bulk.

### 2. Major: Speculative State Machine for Collaborative Restore (`Restore_Requests` Tab)
* **Severity:** Major
* **Affected Scope:** Lines 30, 67–75, 148–154, 235–241, 275–286, 379–385
* **Critique:**
  The design specifies a dedicated 7th spreadsheet tab (`Restore_Requests`), storing JSON-stringified arrays in Google Sheets cells, accompanied by an endorsement counter, approval state machine (`PENDING` | `APPROVED` | `DISMISSED`), and custom inline string truncation (`Charlie, Dave and 2 others requested restore`).
  In a lightweight expense-sharing app where groups consist of 2–10 friends or flatmates, a multi-signature democratic endorsement voting queue is speculative complexity (YAGNI). Moreover, having multiple clients concurrently read-modify-write JSON arrays into a single spreadsheet cell reintroduces write-contention risks.
  **Recommendation:** Keep the restore flow minimal: Inactive member cards have a "Request Restore" button for non-owners that reuses the existing `Pending_Invites` system with a simple single-action request, eliminating the dedicated `Restore_Requests` worksheet tab and multi-endorser JSON array.

### 3. Major: Unnecessary Modification of `debtSimplifier.ts` and `sheetSerializer.ts`
* **Severity:** Major
* **Affected Scope:** Lines 155–168, 323–329 (Sections 3 & 4)
* **Critique:**
  Code inspection of `src/core/debtSimplifier.ts` reveals that `calculateBalances` and `simplifyDebts` are **already 100% agnostic** to `MemberStatus`. They iterate over all members and all transaction records regardless of status. Similarly, `generateAllExpensesFormula(memberEmails: string[])` is a pure string-formatting function that simply formats whatever email array is passed to it into `=IFERROR(SORT(VSTACK(...)))`. Reusing them as-is requires **zero lines of code changes**.

### 4. Major: Missing Central State & TanStack Query Layer
* **Severity:** Major
* **Affected Scope:** Lines 266–429 (Detailed Implementation Plan)
* **Critique:**
  The plan lists 21 individual files across types, services, serializers, and UI atoms, but completely omits `src/hooks/useGroupDetail.ts` and `src/pages/group/GroupContext.tsx`. In Spread-Spends, all group mutations live in `useGroupDetail.ts` with optimistic UI updates and TanStack Query cache invalidations. Proposing new business operations without integrating them into `useGroupDetail.ts` creates an architectural disconnect where UI components bypass the cache or lack reactive optimistic updates.

### 5. Nit / Code Health: Premature File Decomposition and Path Divergence
* **Severity:** Nit
* **Affected Scope:** Lines 206–216, 379–409
* **Critique:**
  The existing member UI is cleanly encapsulated in `src/pages/group/members/MembersSection.tsx` (153 lines) and `src/pages/group/members/MemberList.tsx` (101 lines). Fragmenting the view into 6 distinct files across a new directory path `src/pages/group/settings/` is premature. The inactive members list and anomaly badges should simply be added as sub-sections within the existing `MemberList.tsx` / `MembersSection.tsx` structure.

---

## Actionable Recommendations for Simplification

1. **Drop the `Restore_Requests` tab and endorsement counter:** Eliminate the 7th worksheet tab and JSON serialization of endorsers; handle restoration either as an owner-initiated action or a simple 1-click request reusing `Pending_Invites`.
2. **Make "Sync User List" strictly non-destructive (Audit & Prompt):** Never auto-soft-delete members without an explicit owner confirmation modal. Display detected drift with a simple "Fix" or "Reconcile" button.
3. **Reuse `debtSimplifier.ts` and `generateAllExpensesFormula` as-is:** Do not modify existing calculation or formula generation logic; they already handle inactive member emails seamlessly.
4. **Wire mutations into `useGroupDetail.ts`:** Add `softDeleteMember` and `restoreMember` mutations directly into `useGroupDetail` using standard TanStack Query optimistic patterns.
5. **Keep UI changes within `src/pages/group/members/`:** Extend `MemberList.tsx` with an "Inactive Members" section instead of splitting the view into 6 separate card files.
