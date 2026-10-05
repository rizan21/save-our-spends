import { useState } from 'react';
import type { GroupFinancialSummary } from '../../../types/balance';
import type { Member } from '../../../types/group';
import type { Expense } from '../../../types/transaction';
import { BalancesSummary } from './BalancesSummary';
import { MemberSpendings } from './MemberSpendings';
import { useGroupContext } from '../GroupContext';

export interface BalancesSectionProps {
  summary?: GroupFinancialSummary | null;
  currentUserEmail?: string;
  currentUserPicture?: string;
  members?: Member[];
  expenses?: Expense[];
  currency?: string;
}

export function BalancesSection(props: BalancesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const context = useGroupContext();

  const summary = props.summary !== undefined ? props.summary : (context?.financialSummary || null);
  const currentUserEmail = props.currentUserEmail || context?.currentUser?.email || '';
  const currentUserPicture = props.currentUserPicture || context?.currentUser?.picture;
  const members = props.members || context?.group.members || [];
  const expenses = props.expenses || context?.expenses || [];
  const currency = props.currency || summary?.currency || context?.currency || 'USD';

  return (
    <div className="space-y-6">
      <BalancesSummary
        summary={summary}
        currentUserEmail={currentUserEmail}
        currentUserPicture={currentUserPicture}
        members={members}
        currency={currency}
        isModalOpen={isModalOpen}
        onOpenModal={() => setIsModalOpen(true)}
        onCloseModal={() => setIsModalOpen(false)}
      />
      <MemberSpendings
        members={members}
        expenses={expenses}
        currentUserEmail={currentUserEmail}
        currentUserPicture={currentUserPicture}
        currency={currency}
      />
    </div>
  );
}
