import type { Expense, Settlement } from '../../../types/transaction';
import type { Member } from '../../../types/group';
import type { SimplifiedDebt } from '../../../types/balance';
import { TransactionList } from './TransactionList';
import { useGroupContext } from '../GroupContext';

export interface ExpensesSectionProps {
  expenses?: Expense[];
  settlements?: Settlement[];
  currentUserEmail?: string;
  currency?: string;
  members?: Member[];
  simplifiedDebts?: SimplifiedDebt[];
  onOpenAddExpense?: () => void;
  onSettleDebt?: (debt: SimplifiedDebt) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  onEditSettlement?: (settlement: Settlement) => void;
  onDeleteSettlement?: (settlement: Settlement) => void;
  onViewHistory?: (item: { type: 'EXPENSE'; data: Expense } | { type: 'SETTLEMENT'; data: Settlement }) => void;
}

const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_SETTLEMENTS: Settlement[] = [];

export function ExpensesSection(props: ExpensesSectionProps) {
  const context = useGroupContext();

  const expenses = props.expenses || context?.expenses || EMPTY_EXPENSES;
  const settlements = props.settlements || context?.settlements || EMPTY_SETTLEMENTS;
  const currentUserEmail = props.currentUserEmail || context?.currentUser?.email || '';
  const currency = props.currency || context?.currency || 'USD';
  const members = props.members || context?.group.members || [];
  const simplifiedDebts = props.simplifiedDebts || context?.financialSummary?.simplifiedDebts || [];

  return (
    <TransactionList
      expenses={expenses}
      settlements={settlements}
      currentUserEmail={currentUserEmail}
      currency={currency}
      members={members}
      simplifiedDebts={simplifiedDebts}
      onOpenAddExpense={props.onOpenAddExpense || (() => context?.openAddExpense())}
      onSettleDebt={props.onSettleDebt || ((debt) => context?.openSettleUp(debt))}
      onEditExpense={props.onEditExpense || ((exp) => context?.openEditExpense(exp))}
      onDeleteExpense={
        props.onDeleteExpense ||
        ((exp) => context?.deleteExpense({ expenseId: exp.id, editorEmail: currentUserEmail }))
      }
      onEditSettlement={props.onEditSettlement || ((set) => context?.openEditSettlement(set))}
      onDeleteSettlement={
        props.onDeleteSettlement ||
        ((set) => context?.deleteSettlement({ settlementId: set.id, editorEmail: currentUserEmail }))
      }
      onViewHistory={props.onViewHistory || ((item) => context?.viewTransactionHistory(item))}
    />
  );
}
