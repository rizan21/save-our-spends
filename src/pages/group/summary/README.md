# Group Summary Tab

## Overview
Group overview tab featuring interactive SVG donut chart of category-based expenditures and breakdown analytics.

## Interface
- `SummarySection(props: SummarySectionProps): JSX.Element | null` (also exported as `GroupOverview`)
- `GroupInfoCard(props: GroupInfoCardProps): JSX.Element`
- `CategoryPieChart(props: CategoryPieChartProps): JSX.Element`
- `SummarySectionProps`, `GroupInfoCardProps`, `CategoryPieChartProps`

## Invariants
- Immutable Group Metadata: Group description, creation date, and owner details are rendered strictly read-only on the Overview tab.
- Only active expenses (`status === 'ACTIVE'`) contribute to spending calculations and percentage donut slices.
- Sum of category percentages equals 100% when active expenses exist; gracefully displays empty state when 0.
- Clicking or hovering on chart segments toggles category focus without mutating underlying expense entities.

## Side Effects
- Consumes `GroupContext` when direct props are omitted.
- Can trigger `onOpenAddExpense` modal callback from empty state or context.

## Verification
- Run: `bun test`
