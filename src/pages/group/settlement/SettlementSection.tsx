import type { SimplifiedDebt } from '../../../types/balance';
import type { Member } from '../../../types/group';
import { SimplifiedDebtsList } from './SimplifiedDebtsList';
import { useGroupContext } from '../GroupContext';

export interface SettlementSectionProps {
  debts?: SimplifiedDebt[];
  currentUserEmail?: string;
  members?: Member[];
  onSettleDebt?: (debt: SimplifiedDebt) => void;
}

export function SettlementSection(props: SettlementSectionProps) {
  const context = useGroupContext();

  const debts = props.debts || context?.financialSummary?.simplifiedDebts || [];
  const currentUserEmail = props.currentUserEmail || context?.currentUser?.email || '';
  const members = props.members || context?.group.members || [];

  return (
    <div className="space-y-6">
      <SimplifiedDebtsList
        debts={debts}
        currentUserEmail={currentUserEmail}
        members={members}
        onSettleDebt={props.onSettleDebt || ((debt) => context?.openSettleUp(debt))}
      />
    </div>
  );
}
