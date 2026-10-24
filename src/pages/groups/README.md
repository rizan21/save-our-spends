# Groups Page

## Overview
Groups listing and dashboard landing page supporting group selection, group creation modal, Google Drive / Sheets URL import, and summary balance aggregation.

## Interface
- `GroupsPage(props: GroupsPageProps): JSX.Element`
- `GroupsPageProps`
- `GroupCard(props: GroupCardProps): JSX.Element`
- `GroupCardProps`
- `CreateGroupModal(props: CreateGroupModalProps): JSX.Element`
- `CreateGroupModalProps`
- `OpenGroupModal(props: OpenGroupModalProps): JSX.Element`
- `OpenGroupModalProps`

## Invariants
- Group name is required and trimmed before creation.
- Selecting a group navigates the hash router to `#group=<groupId>`.
- Non-empty spreadsheet URL or valid Drive ID string (>=15 alphanumeric chars) is required when importing via manual input.
- Demo mode routes Drive picker requests to mock spreadsheet `mock-sheet-goa-2026`.

## Side Effects
- Creates new spreadsheet groups via `useGroups().createGroup`.
- Imports shared Google Sheets files via `useGroups().importGroup`.
- Triggers Google Picker modal via Google Drive API if authenticated.
- Mutates browser hash route via `onSelectGroup`.

## Verification
- Run: `bun test`
