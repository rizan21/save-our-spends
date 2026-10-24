# Goldfish Review Resolution Report: Member Soft-Deletion & Sync

*   **Target Document:** `docs/designs/member-soft-delete-sync/member-soft-delete-sync.md`
*   **Resolver:** Elephant Agent
*   **Date:** 2026-10-24
*   **Status:** All Findings Resolved

---

## Finding Classification & Action Register

| ID | Origin | Finding | Classification | Action Taken |
|---|---|---|---|---|
| **F-01** | Critic / Comp | Drive sync loop resurrects failed soft-deletions (`writer + INACTIVE`) | **PROPOSE FIX** | Classify `writer + INACTIVE` as an advisory anomaly (`INACTIVE_HAS_WRITE_ACCESS`) with explicit owner remediation buttons: `[Revoke Access]` or `[Restore Member]`. Auto-sync never reactivates silently. |
| **F-02** | Critic | Unauthenticated auto-provisioning of external Drive writers (`writer + Missing`) | **PROPOSE FIX** | Demote auto-add to an advisory audit: classify as `DRIVE_USER_NOT_IN_SHEET` with explicit owner actions: `[Add to Group]` or `[Revoke Access]`. Zero automated sheet mutations. |
| **F-03** | Critic / Zoom-Out | Concurrency collision and over-engineering on `Restore_Requests` tab | **PROPOSE FIX** | Eliminate `Restore_Requests` tab and consensus endorsement array. Owner restores directly with 1 click; non-owner restore requests use existing `Pending_Invites`. |
| **F-04** | Comprehension | Direct owner restore button lacks backing service method | **PROPOSE FIX** | Add `restoreMember(sheetId, email)` method to `groupService`, `mockGoogleService`, and `useGroupDetail.ts`. |
| **F-05** | Comprehension | `AddExpenseModal` participant filter purges inactive members when editing | **PROPOSE FIX** | Update filter predicate in edit mode: `m.status === 'ACTIVE' || isExistingExpenseParticipant(m.email)`. |
| **F-06** | Comprehension | `softDeleteMember` permission ID lookup ambiguity | **PROPOSE FIX** | Specify that `softDeleteMember` queries `getFilePermissions`, performs case-insensitive email match to find `permission.id`, and handles missing permissions safely. |
| **F-07** | Readiness | Missing TanStack Query mutation hooks and `GroupContext` interfaces | **PROPOSE FIX** | Add `softDeleteMemberMutation` and `restoreMemberMutation` to `useGroupDetail.ts` and expose via `GroupContext.tsx`. |
| **F-08** | Readiness / Zoom-Out | Premature UI splintering into 6 card files across non-existent settings directory | **PROPOSE FIX** | Consolidate member management, inactive members sub-list, and the Drive permission audit dialog directly inside `src/pages/group/members/MemberList.tsx`. |
| **F-09** | Critic | Master `All_Expenses` formula `#REF!` ambiguity | **PROPOSE FIX** | Clarify that `generateAllExpensesFormula` operates on all members with confirmed personal tabs in sheet metadata. |
| **F-10** | Critic | Non-standard horizontal rule separators (`----------------`) | **PROPOSE FIX** | Replace all 80-dash separators with standard Markdown `---`. |
