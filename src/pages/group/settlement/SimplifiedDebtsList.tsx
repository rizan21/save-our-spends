import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, HandCoins } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { formatCurrency } from '../../../core/splitCalculator';
import type { SimplifiedDebt } from '../../../types/balance';
import type { Member } from '../../../types/group';

export interface SimplifiedDebtsListProps {
  debts: SimplifiedDebt[];
  currentUserEmail: string;
  members?: Member[];
  onSettleDebt: (debt: SimplifiedDebt) => void;
}

export function SimplifiedDebtsList({
  debts,
  currentUserEmail,
  members = [],
  onSettleDebt,
}: SimplifiedDebtsListProps) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.email.toLowerCase(), m])),
    [members]
  );

  if (debts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs space-y-2">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No debts to settle</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          All group expenses are completely balanced out!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Suggested Settlements</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Optimized to clear all balances in the fewest possible payments.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {debts.map((d, idx) => {
          const isPayer = d.fromEmail === currentUserEmail;
          const isPayee = d.toEmail === currentUserEmail;
          const isMyDebt = isPayer || isPayee;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                isMyDebt
                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                  : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <UserAvatar
                    name={d.fromName}
                    picture={memberMap.get(d.fromEmail.toLowerCase())?.picture}
                    size="xs"
                  />
                  <span>{isPayer ? 'You' : d.fromName}</span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  owes <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <UserAvatar
                    name={d.toName}
                    picture={memberMap.get(d.toEmail.toLowerCase())?.picture}
                    size="xs"
                  />
                  <span>{isPayee ? 'You' : d.toName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatCurrency(d.amount, d.currency)}
                </span>
                <Button
                  size="sm"
                  variant={isMyDebt ? 'primary' : 'outline'}
                  onClick={() => onSettleDebt(d)}
                  className="gap-1 py-1 text-xs"
                >
                  <HandCoins className="w-3.5 h-3.5" />
                  <span>Settle</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
