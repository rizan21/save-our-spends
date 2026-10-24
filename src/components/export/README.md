# Export Components

## Overview
External integration and data export components providing direct hyperlinks to underlying Google Spreadsheets.

## Interface
- `DirectSheetsLink({ group }: DirectSheetsLinkProps): JSX.Element | null`
- `DirectSheetsLinkProps`

## Invariants
- Renders nothing (returns `null`) if `group.driveFileUrl` is undefined or empty.

## Side Effects
- Opens external Google Sheets URL in a new browser tab with `rel="noreferrer"`.

## Verification
- Run: `bun test`
