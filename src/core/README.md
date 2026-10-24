# Core Domain Engine (`src/core`)

## Overview
The `src/core` module encapsulates pure domain logic, financial calculation engines, tabular Google Sheets serialization, and audit trail diffing for Spread-Spends. It enforces integer-cent financial precision across multi-payer and complex split expense scenarios, performs debt simplification using a greedy min-cash-flow algorithm, and manages bidirectional mappings between TypeScript models and spreadsheet cell matrices.

## Interface
- **Split Calculation & Precision Math (`splitCalculator.ts`)**:
  - `calculateEqualSplit(totalAmount: number, participants: string[]): SplitResult`
  - `calculateExactSplit(totalAmount: number, exactAmounts: Record<string, number>): SplitResult`
  - `calculatePercentageSplit(totalAmount: number, percentages: Record<string, number>): SplitResult`
  - `calculateSharesSplit(totalAmount: number, shares: Record<string, number>): SplitResult`
  - `validatePaidBy(totalAmount: number, paidBy: Record<string, number>): { isValid: boolean; difference?: number; error?: string }`
  - `roundToCents(amount: number): number`
  - `formatCurrency(amount: number, currency?: string): string`
- **Debt Simplification & Balances (`debtSimplifier.ts`)**:
  - `calculateBalances(members: Member[], expenses: Expense[], settlements: Settlement[], currency?: string): GroupFinancialSummary`
  - `simplifyDebts(balances: Record<string, MemberBalance>, currency?: string): SimplifiedDebt[]`
- **Sheet Serialization & Tabular Schemas (`sheetSerializer.ts`)**:
  - `serializeGroupConfig(config: GroupConfig): string[][]` / `deserializeGroupConfig(rows: string[][]): GroupConfig`
  - `serializeMembers(members: Member[]): string[][]` / `deserializeMembers(rows: string[][]): Member[]`
  - `serializePendingInvites(invites: PendingInvite[]): string[][]` / `deserializePendingInvites(rows: string[][]): PendingInvite[]`
  - `serializeExpenses(expenses: Expense[]): string[][]` / `deserializeExpenses(rows: string[][]): Expense[]`
  - `serializeSettlements(settlements: Settlement[]): string[][]` / `deserializeSettlements(rows: string[][]): Settlement[]`
  - `getMemberTabName(email: string): string`
  - `generateAllExpensesFormula(memberEmails: string[]): string`
  - `deserializeMultiTabExpenses(tabsData: Array<{ tabName: string; rows: string[][] }>): Expense[]`
  - `parseSheetDate(raw: string | undefined): string`
  - Constants: `SHEET_TABS`, `HEADERS`
- **Transaction History & Audit Diffing (`historyTracker.ts`)**:
  - `computeExpenseDiff(original: Expense, updated: Expense, editorEmail: string, editorName?: string, members?: Member[]): EditHistoryRecord | null`
  - `computeSettlementDiff(original: Settlement, updated: Settlement, editorEmail: string, editorName?: string, members?: Member[]): EditHistoryRecord | null`
  - `formatChangeSummary(changes: ChangeDetail[]): string`
- **Date & Time Normalization (`dateTime.ts`)**:
  - `formatTransactionDateTime(dateStr: string, createdAtStr?: string): FormattedDateTime`
  - `combineDateAndTime(dateStr: string, timeStr?: string): string`
  - `extractTimeFromTimestamp(createdAtStr?: string): string`

## Invariants
- **Penny Conservation**: All split computations are executed using integer cents (`Math.round(amount * 100)`) to eliminate IEEE 754 floating-point drift. The sum of allocated splits must equal the total transaction amount.
- **Zero-Sum Solvency**: In any closed settlement system, the sum of all members' net balances must equal zero (`sum(netBalance) === 0`).
- **Deterministic Cent Allocation**: Remainder cents in equal splits are assigned deterministically to the first `remainderCents` participants. Percentage and share calculations distribute remainder cents via the largest remainder method.
- **Tombstone Status Filtering**: Any transaction with `status === 'DELETED'` is strictly excluded from group balance, spending, and debt simplification aggregations.
- **Tab Name Sanitization**: Google Sheets tab names generated from email addresses strip forbidden characters (`[ ] * ? : / \`) and are truncated to 100 characters.
- **Audit Diff Integrity**: Diff generation returns `null` if no tracked fields were modified, ensuring no empty or redundant history records are committed.
- **Header Row Preservation**: Serialized Google Sheet matrices preserve standard column headers at index 0; deserializers skip index 0.

## Side Effects
- Reads system clock (`Date.now()`, `new Date()`) during fallback timestamp parsing and edit history ID creation.
- Uses `Math.random()` to generate unique edit history entry IDs.

## Verification
- Run: `bun test`
