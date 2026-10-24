import type { Group } from '../../../types/group';
import type { Expense } from '../../../types/transaction';
import type { GroupFinancialSummary } from '../../../types/balance';
import { CategoryPieChart } from './CategoryPieChart';
import { GroupInfoCard } from './GroupInfoCard';
import { useGroupContext } from '../GroupContext';

export interface SummarySectionProps {
  group?: Group;
  expenses?: Expense[];
  financialSummary?: GroupFinancialSummary | null;
  onNavigateToExpenses?: () => void;
  onOpenAddExpense?: () => void;
  onViewExpense?: (expense: Expense) => void;
  onUpdateDescription?: (description: string) => Promise<unknown>;
  isUpdatingDescription?: boolean;
}

export function SummarySection(props: SummarySectionProps) {
  const context = useGroupContext();

  const group = props.group || context?.group;
  const expenses = props.expenses || context?.expenses || [];
  const financialSummary = props.financialSummary !== undefined ? props.financialSummary : (context?.financialSummary || null);
  const onOpenAddExpense = props.onOpenAddExpense || (() => context?.openAddExpense());

  if (!group) return null;

  const currency = financialSummary?.currency || group.currency || 'INR';

  return (
    <div className="space-y-6">
      <GroupInfoCard group={group} />
      <CategoryPieChart
        expenses={expenses}
        currency={currency}
        onOpenAddExpense={onOpenAddExpense}
      />
    </div>
  );
}

// Re-export as GroupOverview for backward compatibility
export { SummarySection as GroupOverview };
