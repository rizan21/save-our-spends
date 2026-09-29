import type { Member } from '../../types/group';
import type { Expense } from '../../types/transaction';
import { formatCurrency } from '../../core/splitCalculator';
import { ArrowLeftRight } from 'lucide-react';

export interface MemberSpendingsProps {
  members: Member[];
  expenses: Expense[];
  currentUserEmail: string;
  currency?: string;
}

export function MemberSpendings({
  members,
  expenses,
  currentUserEmail,
  currency = 'USD',
}: MemberSpendingsProps) {
  const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');

  // Compute how much each member paid and consumed
  const paidMap = new Map<string, number>();
  const consumedMap = new Map<string, number>();

  for (const m of members) {
    paidMap.set(m.email, 0);
    consumedMap.set(m.email, 0);
  }

  for (const exp of activeExpenses) {
    // Paid out of pocket
    for (const [payerEmail, paidAmount] of Object.entries(exp.paidBy || {})) {
      const currentPaid = paidMap.get(payerEmail) || 0;
      paidMap.set(payerEmail, currentPaid + paidAmount);
    }
    // Consumed share
    for (const [consumerEmail, consumedAmount] of Object.entries(exp.splits || {})) {
      const currentConsumed = consumedMap.get(consumerEmail) || 0;
      consumedMap.set(consumerEmail, currentConsumed + consumedAmount);
    }
  }

  const memberSpendings = members.map((m) => {
    const paid = paidMap.get(m.email) || 0;
    const consumed = consumedMap.get(m.email) || 0;
    return {
      member: m,
      paid,
      consumed,
    };
  });

  // Calculate highest amount among all paid and consumed to proportionally scale bars
  const maxAmount = Math.max(
    ...memberSpendings.map((s) => Math.max(s.paid, s.consumed)),
    1
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Spending & Consumption</h3>
            <p className="text-xs text-slate-500">
              How much each member paid out of pocket versus consumed in expenses.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600">Consumed</span>
          </div>
        </div>
      </div>

      {/* Member Spendings List */}
      {activeExpenses.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No expenses recorded yet to show spending and consumption.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {memberSpendings.map(({ member, paid, consumed }) => {
            const isMe = member.email === currentUserEmail;
            const paidWidth = paid > 0 ? Math.max((paid / maxAmount) * 100, 2) : 0;
            const consumedWidth = consumed > 0 ? Math.max((consumed / maxAmount) * 100, 2) : 0;

            return (
              <div key={member.email} className="py-4 space-y-2.5 first:pt-1 last:pb-1">
                {/* Member Header */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800">
                      {member.name} {isMe && <span className="text-xs text-emerald-600 font-semibold">(You)</span>}
                    </span>
                  </div>
                </div>

                {/* Dual Visual Bars */}
                <div className="space-y-2 pl-9">
                  {/* Paid Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Paid</span>
                      <span className="font-bold text-slate-900">{formatCurrency(paid, currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${paidWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Consumed Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Consumed</span>
                      <span className="font-bold text-slate-900">{formatCurrency(consumed, currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${consumedWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
