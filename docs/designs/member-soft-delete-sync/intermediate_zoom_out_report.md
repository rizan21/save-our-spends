# Stage 8 Intermediate Zoom-Out Architectural Audit: Cutting the Distributed Systems Monolith

*   **Target Document:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md`
*   **Standard:** EGM Zoom-Out Standard (Skeptical Architect / Contrarian / YAGNI)
*   **Evaluator:** Skeptical Architect (Zoom-Out Goldfish)
*   **Date:** 2026-10-24
*   **Target Report Path:** `docs/designs/member-soft-delete-sync/intermediate_zoom_out_report.md`

---

## 1. Executive Summary & Architectural Re-Evaluation

The Member Soft-Deletion & Sync feature set out to solve three concrete, bounded problems:
1. Prevent spreadsheet formula corruption (`=VSTACK(...)`) when members depart by soft-deleting rather than deleting tabs.
2. Revoke Google Drive edit permissions for departing members.
3. Warn users when editing historical expenses involving inactive members so settled balances aren't accidentally distorted.

However, over the course of drafting and reviewing (Stages 1 through 7), the proposal has suffered from **severe mitigation compounding**. To patch edge cases in speculative sub-features, reviewers and drafters have added layer upon layer of distributed systems machinery:
- A multi-party democratic endorsement voting queue with JSON cell serialization was proposed for restoring members.
- When write collision was identified (Critic #3), it was patched by proposing an append-only event sourcing sheet (`Restore_Requests`) with dynamic read-time aggregation.
- An autonomous bidirectional sync engine was proposed to reconcile Google Drive and Google Sheets.
- When it was discovered that sync creates infinite reactivation loops (Comprehension #1, Critic #1) and invites ledger hijacking (Critic #2), the engine was burdened with complex anomaly classification state machines.
- When concurrent Drive API mutations risked quota exhaustion (Critic #4), the plan called for an asynchronous client-side mutation throttler with exponential backoff.
- A 100-line UI view in `MembersSection.tsx` was fragmented into 6 separate card components across an invented directory path (`src/pages/group/settings/`), spanning **21 planned target files**.

**Verdict:** If implemented as currently drafted and patched, this feature will turn a lightweight, zero-backend PWA into a brittle, over-engineered distributed systems monolith. The accumulated mitigations are treating symptoms of features that **never needed to exist in the first place (YAGNI)**.

We must strip away the speculative bloat and return to a clean, minimal, bulletproof design that honors Spread-Spends' zero-backend architecture.

---

## 2. Itemized Simplification & De-Escalation Mandates

### Finding 1: Kill the `Restore_Requests` Tab and Collaborative Voting Protocol
*   **Severity:** Blocker (Over-Engineering / YAGNI)
*   **Simplification Mandate:**
    1. **Delete the `Restore_Requests` worksheet tab completely.** Do not create a 7th tab.
    2. **Direct Owner Restore:** The group owner can restore any soft-deleted member with 1 click from the Inactive Members list (`restoreMember(sheetId, email)`).
    3. **Non-Owner Restore:** If a non-owner wants to bring back an inactive member, they can simply click "Request Restore", which creates a standard `PendingInvite` in the existing `Pending_Invites` tab.
    4. **Codebase Elimination:** This immediately deletes 3 mock methods, 4 service methods, 2 serializer functions, 1 custom card component, and the need for an append-only event log.

### Finding 2: Demote "Sync Engine" to an On-Demand Advisory Audit (Inspect & Prompt)
*   **Severity:** Blocker (Architectural Risk / Monolith Creep)
*   **Simplification Mandate:**
    1. Drive Permissions are an **Audit Check, NOT an Autonomous Event Bus**.
    2. The button in settings is an on-demand **"Audit Drive Permissions"** action.
    3. The audit is **strictly read-only and advisory**. It compares `drive.permissions.list` against `group.members` and renders a simple diff card with explicit 1-click owner remediation:
       - *Member in sheet is Active, but missing from Drive* -> Display **[Grant Access]** button.
       - *Member in sheet is Inactive, but still has Drive write access* -> Display **[Revoke Access]** button.
       - *Drive editor is missing from sheet* -> Display **[Add to Group]** or **[Revoke Access]** button.
       - *Drive viewer/commenter* -> Display **[Upgrade to Editor]** or **[Revoke Access]** button.
    4. **Never mutate Google Sheets or Google Drive automatically.** Every action is an explicit, single-user owner click.
    5. **Eliminates:** Rate-limiting throttler, bulk rollback transactions, automated state sync matrices, and the zombie resurrection loop.

### Finding 3: Collapse UI Splintering Back into `src/pages/group/members/`
*   **Severity:** Major (Premature Decomposition / Path Divergence)
*   **Simplification Mandate:**
    1. Keep all member and permission UI within `src/pages/group/members/`.
    2. Extend `MemberList.tsx`:
       - Active Members list renders as it currently does, adding a "Remove" button for owners.
       - Add an "Inactive Members" section below Active Members rendering soft-deleted members with grayscale avatars and an owner "Restore" button.
       - Add an "Audit Drive Permissions" button that displays an inline advisory list if discrepancies are found.
    3. Drop all 6 speculative card files. UI footprint drops from 6 new files to **1 modified file** (`MemberList.tsx`).

### Finding 4: Ground State Mutations in `useGroupDetail.ts` (TanStack Query)
*   **Severity:** Major (Architectural Omission)
*   **Simplification Mandate:**
    1. Add two straightforward mutations to `src/hooks/useGroupDetail.ts`:
       - `softDeleteMemberMutation`: Optimistically sets `member.status = 'INACTIVE'` in the query cache, calls `groupService.softDeleteMember`, and invalidates queries on error/settle.
       - `restoreMemberMutation`: Optimistically sets `member.status = 'ACTIVE'`, calls `groupService.restoreMember`, and invalidates queries on error/settle.
    2. Wire these mutations into `MemberList.tsx` via `useGroupContext()`.

### Finding 5: Zero-Diff on Core Calculators and Formula Generators
*   **Severity:** Major (Unnecessary Refactoring)
*   **Simplification Mandate:**
    1. **Do not modify `debtSimplifier.ts`.** `calculateBalances` and `simplifyDebts` are already status-agnostic.
    2. **Do not modify `generateAllExpensesFormula`.** When calling `updateAllExpensesFormula`, simply pass `group.members.map(m => m.email)`.
    3. The only calculation-related change needed is UI filtering:
       - In `AddExpenseModal.tsx`: `members.filter(m => m.status === 'ACTIVE' || isExistingExpenseParticipant(m.email))`.

---

## 3. Complexity Delta: Monolith Proposal vs. Lean Minimalist Design

| Dimension | Monolithic Proposal (Stages 1–7) | Lean Minimalist Design (Stage 8 Zoom-Out) | Reduction / Gain |
|---|---|---|---|
| **Spreadsheet Tabs** | 7 tabs (new `Restore_Requests` tab) | 6 tabs (zero new tabs) | **-1 worksheet tab, -1 `batchGet` query** |
| **Restore Model** | Multi-party endorsement voting, JSON cells or append-only event log, status machine | 1-click Owner "Restore" button; standard pending invite if requested by peer | **100% elimination of consensus voting complexity** |
| **Drive Permission Sync** | Autonomous 2-way sync engine, auto-soft-delete, auto-reactivate, auto-provisioning | Advisory "Check Permissions" audit; 100% manual, explicit owner remediation | **Eliminates resurrection loops, security holes & quota risk** |
| **API Throttling** | Client-side rate-limit throttler with exponential backoff & batch queues | Standard single-action REST calls (owner remediation is single-target) | **Zero throttler boilerplate needed** |
| **UI Components** | 6 new card files in new `src/pages/group/settings/` | Enhance existing `MemberList.tsx` with Inactive list and Audit panel | **Zero new directories; -5 files deleted** |
| **State Management** | Bypassed cache; direct service calls scattered across UI atoms | Standard TanStack Query optimistic mutations in `useGroupDetail.ts` | **Consistent, reactive, single source of truth** |
| **Total Files Touched** | 21 target files | ~10 target files | **~50% reduction in implementation surface** |

---

## 4. Revised, Lean Scope of Target Files (~10 files)

1. `src/types/group.ts`: Add audit discrepancy types if needed.
2. `src/services/googleDrive.ts`: Add `removePermission(token, fileId, permissionId)` and expand `getFilePermissions` fields.
3. `src/services/groupService.ts`: Add `softDeleteMember`, `restoreMember`, and `auditDrivePermissions`.
4. `src/services/mockGoogleService.ts`: Mirror the 3 methods above for demo mode.
5. `src/hooks/useGroupDetail.ts`: Add `softDeleteMember` and `restoreMember` optimistic mutations.
6. `src/components/common/UserAvatar.tsx`: Add `isInactive?: boolean` for grayscale avatar styling.
7. `src/pages/group/members/MemberList.tsx`: Render Inactive Members sub-list and owner "Audit Permissions" dialog.
8. `src/pages/group/expenses/AddExpenseModal.tsx`: Filter inactive members from new transactions while preserving them in edit mode.
9. `src/pages/group/expenses/TransactionItem.tsx`: Show `(Removed)` badge next to inactive members.
10. `src/pages/group/expenses/TransactionHistoryModal.tsx`: Show confirmation warning modal when editing or deleting an expense involving an inactive member.
