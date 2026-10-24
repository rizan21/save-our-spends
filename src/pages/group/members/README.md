# Group Members Tab

## Overview
Group settings and roster management, member invitations, pending invite approval workflows, group description editing, and direct spreadsheet export links.

## Interface
- `MembersSection(props: MembersSectionProps): JSX.Element | null`
- `MemberList(props: MemberListProps): JSX.Element`
- `InviteMemberModal(props: InviteMemberModalProps): JSX.Element`
- `PendingApprovalsList(props: PendingApprovalsListProps): JSX.Element | null`
- Component Props: `MembersSectionProps`, `MemberListProps`, `InviteMemberModalProps`, `PendingApprovalsListProps`

## Invariants
- Only group owners can approve pending member invitations.
- Non-owners proposing invitations create `PENDING` invites awaiting owner approval.
- Duplicate member emails or already pending invite emails are rejected with validation errors.

## Side Effects
- Calls `proposeInvite` and `approveInvite` in Google Sheets backend.
- Updates group description in backend via `updateDescription`.
- Links out to external Google Sheets document.

## Verification
- Run: `bun test`
