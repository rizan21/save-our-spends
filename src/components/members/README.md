# Members Components

## Overview
Group membership management component stubs, providing backward-compatible re-exports for member rosters, invitation modals, and pending approval lists.

## Interface
- `InviteMemberModal`: Re-exported from `src/pages/group/members/InviteMemberModal`.
- `MemberList`: Re-exported from `src/pages/group/members/MemberList`.
- `PendingApprovalsList`: Re-exported from `src/pages/group/members/PendingApprovalsList`.

## Invariants
- Maintains backward compatibility by forwarding all exports directly from `src/pages/group/members/`.

## Side Effects
- None directly; delegates to underlying member page components.

## Verification
- Run: `bun test`
