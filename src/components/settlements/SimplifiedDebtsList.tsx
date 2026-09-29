import { ArrowRight, CheckCircle2, HandCoins } from 'lucide-react';
import { Button } from '../common/Button';
import { formatCurrency } from '../../core/splitCalculator';
import type { SimplifiedDebt } from '../../types/balance';

export interface SimplifiedDebtsListProps {
  debts: SimplifiedDebt[];
  currentUserEmail: string;
  onSettleDebt: (debt: SimplifiedDebt) => void;
}

export function SimplifiedDebtsList({
  debts,
  currentUserEmail,
  onSettleDebt,
}: SimplifiedDebtsListProps) {

  if (debts.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-xs space-y-2">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-sm text-slate-800">No debts to settle</h4>
        <p className="text-xs text-slate-400">
          All group expenses are completely balanced out!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Suggested Settlements</h3>
          <p className="text-xs text-slate-500 mt-0.5">
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
                  ? 'border-emerald-200 bg-emerald-50/30 shadow-xs'
                  : 'border-slate-200/70 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <span className="font-semibold text-slate-900">
                  {isPayer ? 'You' : d.fromName}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  owes <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="font-semibold text-slate-900">
                  {isPayee ? 'You' : d.toName}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="font-bold text-slate-900 text-sm">
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
