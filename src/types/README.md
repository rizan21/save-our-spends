# Types

## Overview
Core TypeScript domain models, interfaces, and ambient type definitions for group expenses, member balances, debt simplification, Google APIs, and user identities.

## Interface
- **Balance & Summary Types (`balance.ts`)**:
  - `MemberBalance`: Per-member financial ledger balance tracking total paid, total owed, and net balance.
  - `SimplifiedDebt`: Bilateral settlement transaction representation between debtor and creditor.
  - `GroupFinancialSummary`: Aggregated group financial statistics, member balances, and simplified debt matrix.
- **Google & Identity Types (`google.ts`)**:
  - `GoogleUser`: Authenticated Google user profile and local override state.
  - `GoogleOAuthToken`: Google OAuth 2.0 access token metadata and expiration.
  - `GoogleDriveFile`: Representation of Google Drive spreadsheet files and ownership metadata.
  - `GoogleDocsView`, `GooglePickerBuilder`, `GooglePickerResponse`: Type signatures for Google Picker file selection dialogs.
  - Ambient `window` extensions for Google Identity Services (`gapi`, `google.accounts.oauth2`, `google.picker`).
- **Group & Member Models (`group.ts`)**:
  - `MemberRole` (`'OWNER' | 'MEMBER'`), `MemberStatus` (`'ACTIVE' | 'INACTIVE'`), `Member`.
  - `InviteStatus` (`'PENDING' | 'APPROVED' | 'REJECTED'`), `PendingInvite`.
  - `GroupConfig`, `Group`.
- **Transaction Models (`transaction.ts`)**:
  - `SplitType` (`'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES'`), `ExpenseCategory`, `PaymentMethod`.
  - `ChangeDetail`, `EditHistoryRecord`.
  - `Expense`: Core domain interface for group expenses supporting multi-payer allocations and split shares.
  - `Settlement`: Core domain interface for direct peer-to-peer balance settlements.

## Invariants
- All definitions are compile-time type declarations with zero runtime emission (erasable syntax compliant).
- Financial monetary amounts are represented as floating numbers in standard currency units and require cent-level rounding precision to avoid accumulation drift.
- `netBalance` sign convention: positive indicates credit owed to member, negative indicates debt owed by member.
- Transaction soft-deletion invariant: deleted records retain status `'DELETED'` to preserve audit histories.
- Group ID is strictly equivalent to the backing Google Drive Spreadsheet file ID.

## Side Effects
- None: Pure compile-time type definitions and global ambient declarations.

## Verification
- Run: `bun test`
