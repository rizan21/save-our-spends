import { CategoryIcon } from '../common/CategoryIcon';
import { UserAvatar } from '../common/UserAvatar';
import { HandCoins } from 'lucide-react';
import type { Expense, Settlement } from '../../types/transaction';
import type { Member } from '../../types/group';
import { formatCurrency } from '../../core/splitCalculator';

export interface TransactionItemProps {
  item: { type: 'EXPENSE'; data: Expense } | { type: 'SETTLEMENT'; data: Settlement };
  currentUserEmail: string;
  currency: string;
  members?: Member[];
}

export function TransactionItem({ item, currentUserEmail, currency, members = [] }: TransactionItemProps) {

  if (item.type === 'SETTLEMENT') {
    const s = item.data;
    const isPayer = s.payerEmail === currentUserEmail;
    const isPayee = s.payeeEmail === currentUserEmail;
    const payerMember = members.find((m) => m.email.toLowerCase() === s.payerEmail.toLowerCase());
    const payeeMember = members.find((m) => m.email.toLowerCase() === s.payeeEmail.toLowerCase());

    return (
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
            <HandCoins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <UserAvatar name={s.payerName} picture={payerMember?.picture} size="xs" />
                <span>{isPayer ? 'You' : s.payerName}</span>
              </span>
              <span className="text-slate-400 font-normal">paid</span>
              <span className="inline-flex items-center gap-1">
                <UserAvatar name={s.payeeName} picture={payeeMember?.picture} size="xs" />
                <span>{isPayee ? 'You' : s.payeeName}</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              <span>{s.date}</span> • <span className="text-teal-700 font-medium">{s.paymentMethod}</span>
              {s.notes && <span> • {s.notes}</span>}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-slate-900">
            {formatCurrency(s.amount, currency)}
          </div>
          <div className="text-[11px] font-medium">
            {isPayer && <span className="text-slate-500">You paid</span>}
            {isPayee && <span className="text-emerald-600">You received</span>}
            {!isPayer && !isPayee && <span className="text-slate-400">Settled</span>}
          </div>
        </div>
      </div>
    );
  }

  // EXPENSE
  const exp = item.data;
  const userPaid = exp.paidBy[currentUserEmail] || 0;
  const userOwed = exp.splits[currentUserEmail] || 0;
  const userNet = userPaid - userOwed;

  // Single payer name or "multiple people"
  const payerEmails = Object.keys(exp.paidBy);
  const singlePayerEmail = payerEmails.length === 1 ? payerEmails[0] : null;
  const singlePayerMember = singlePayerEmail
    ? members.find((m) => m.email.toLowerCase() === singlePayerEmail.toLowerCase())
    : null;
  const primaryPayerName = singlePayerEmail
    ? singlePayerEmail === currentUserEmail
      ? 'You'
      : singlePayerMember?.name || singlePayerEmail.split('@')[0]
    : `${payerEmails.length} people`;

  return (
    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <CategoryIcon category={exp.category} size="md" />
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">
            {exp.description}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
            <span>{exp.date}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              {singlePayerMember && (
                <UserAvatar
                  name={singlePayerMember.name}
                  picture={singlePayerMember.picture}
                  size="xs"
                />
              )}
              <span>{primaryPayerName} paid {formatCurrency(exp.amount, currency)}</span>
            </span>
            {exp.notes && <span>• {exp.notes}</span>}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        {userNet > 0.005 ? (
          <div>
            <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">
              You lent
            </div>
            <div className="text-sm font-bold text-emerald-600">
              +{formatCurrency(userNet, currency)}
            </div>
          </div>
        ) : userNet < -0.005 ? (
          <div>
            <div className="text-[10px] text-rose-500 font-medium uppercase tracking-wider">
              You borrowed
            </div>
            <div className="text-sm font-bold text-rose-600">
              -{formatCurrency(userNet, currency)}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Not involved
            </div>
            <div className="text-sm font-medium text-slate-400">
              {formatCurrency(0, currency)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
