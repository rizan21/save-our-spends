# Stage 9 Implementation Readiness Report: Member Soft-Deletion & Sync

*   **Target:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md` (Lines 266..445: Detailed Implementation Plan)
*   **Mode:** `STAGE_9_IMPLEMENTATION_READINESS`
*   **Reviewers:** `egm-implementation-readiness` (Pragmatic Tech Lead), `egm-codebase-details` (Codebase Fidelity Auditor), `egm-style` (Architectural Consistency)
*   **Standard:** `implementation-readiness-standard`
*   **Date:** 2026-10-24
*   **Readiness Score:** 42 / 100 (Requires Plan Realignment to Lean 10-File Architecture)

---

## Executive Summary & Readiness Verdict

The Detailed Implementation Plan in lines 266–445 was desynchronized from the Stage 8 architectural decisions (`intermediate_zoom_out_report.md`). It still detailed the abandoned 21-file distributed consensus monolith (the 7th `Restore_Requests` tab, consensus petition voting, autonomous 2-way sync engines, and 6 fictitious UI card files), while completely omitting the core state management layer (`useGroupDetail.ts` TanStack Query mutations and `GroupContext.tsx`).

The review provides a concrete, normalized 10-file implementation specification that:
1. Replaces the 7th `Restore_Requests` tab and consensus voting with 1-click owner `restoreMember` and standard `Pending_Invites`.
2. Demotes the autonomous sync engine to an on-demand, advisory, read-only `auditDrivePermissions` function.
3. Implements optimistic TanStack Query mutations in `src/hooks/useGroupDetail.ts` and exposes them via `GroupContext.tsx`.
4. Keeps UI within existing `src/pages/group/members/MemberList.tsx`.
5. Declares `src/core/sheetSerializer.ts` and `src/core/debtSimplifier.ts` zero-diff since they already support inactive members as-is.

---

## Normalized 10-File Target Files Specification

1.  **`src/types/group.ts`** (Modify: Add `DriveDiscrepancy` and `DriveDiscrepancyType`).
2.  **`src/services/googleDrive.ts`** (Modify: Add `removePermission` with 404 idempotent handling; expand `getFilePermissions` fields).
3.  **`src/services/groupService.ts`** (Modify: Add `softDeleteMember`, `restoreMember`, and read-only `auditDrivePermissions`).
4.  **`src/services/mockGoogleService.ts`** (Modify: Add mock implementations for `softDeleteMember`, `restoreMember`, and `auditDrivePermissions`).
5.  **`src/hooks/useGroupDetail.ts`** (Modify: Add optimistic TanStack Query mutations `softDeleteMemberMutation` and `restoreMemberMutation`).
6.  **`src/pages/group/GroupContext.tsx`** (Modify: Expose `softDeleteMember` and `restoreMember` in context value interface).
7.  **`src/components/common/UserAvatar.tsx`** (Modify: Add `isInactive?: boolean` for `grayscale opacity-60` avatar styling).
8.  **`src/pages/group/members/MemberList.tsx`** (Modify: Render Inactive members sub-list, Remove/Restore buttons, and Audit Permissions modal).
9.  **`src/pages/group/expenses/AddExpenseModal.tsx`** (Modify: Filter inactive members for new expenses while preserving them in edit mode).
10. **`src/pages/group/expenses/TransactionHistoryModal.tsx`** (Modify: Add inline warning when editing/deleting a transaction involving an inactive member).
11. **`src/test/groupService.test.ts`** (Modify: Add unit test coverage for `softDeleteMember`, `restoreMember`, and `auditDrivePermissions`).

---

## Verification Plan Commands

```bash
# 1. TypeScript compilation check (Zero errors allowed)
bun run build

# 2. Automated test suite run
bun test

# 3. Targeted test execution for groupService & member operations
bun test src/test/groupService.test.ts

# 4. Code health and linter validation
bunx oxlint
```
