import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import type { Expense, Settlement } from '../../../types/transaction';
import type { Member } from '../../../types/group';
import { formatCurrency } from '../../../core/splitCalculator';
import { formatTransactionDateTime } from '../../../core/dateTime';
import {
  Clock,
  Pencil,
  ArrowRight,
  HandCoins,
  Calendar,
  CheckCircle2,
  History,
} from 'lucide-react';

export interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction:
    | { type: 'EXPENSE'; data: Expense }
    | { type: 'SETTLEMENT'; data: Settlement }
    | null;
  members?: Member[];
  currency: string;
  onOpenEdit?: () => void;
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
  transaction,
  members = [],
  currency,
  onOpenEdit,
}: TransactionHistoryModalProps) {
  if (!transaction) return null;

  const isExpense = transaction.type === 'EXPENSE';
  const data = transaction.data;
  const history = data.history || [];
  const dt = formatTransactionDateTime(data.date, data.createdAt);

  const getMember = (email: string) =>
    members.find((m) => m.email.toLowerCase() === email.toLowerCase());

  const creatorEmail = (isExpense
    ? (data as Expense).createdBy
    : (data as Settlement).recordedBy) || '';
  const creatorMember = getMember(creatorEmail);
  const creatorName = creatorMember?.name || (creatorEmail ? creatorEmail.split('@')[0] : 'User');

  const formatDateTime = (isoString: string) => {
    try {
      return formatTransactionDateTime(isoString, isoString).full;
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Edit History"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {isExpense ? (
              <CategoryIcon category={(data as Expense).category} size="md" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                {isExpense
                  ? (data as Expense).description
                  : `${(data as Settlement).payerName} paid ${(data as Settlement).payeeName}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {dt.date}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">{dt.time}</span>
                <span>•</span>
                <span>Created by {creatorName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(data.amount, data.currency || currency)}
              </div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{data.status}</span>
              </div>
            </div>

            {onOpenEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenEdit();
                }}
                className="gap-1.5 hidden sm:inline-flex text-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Audit Trail ({history.length} {history.length === 1 ? 'edit' : 'edits'})</span>
            </h4>
            {history.length > 0 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Newest modifications first
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  No modifications recorded
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  This transaction has not been edited. All details remain exactly as originally logged by {creatorName}.
                </p>
              </div>
              {onOpenEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onOpenEdit();
                  }}
                  className="gap-1.5 text-xs mx-auto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Transaction Now</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {/* Display edits in reverse chronological order */}
              {[...history].reverse().map((record, revIdx) => {
                const revNumber = history.length - revIdx;
                const editor = getMember(record.editedBy);
                const displayName = record.editedByName || editor?.name || record.editedBy.split('@')[0];

                return (
                  <div key={record.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      {revNumber}
                    </div>

                    {/* Revision Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={displayName}
                            picture={editor?.picture}
                            size="xs"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {displayName}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            edited this transaction
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDateTime(record.editedAt)}
                        </span>
                      </div>

                      {/* Summary sentence */}
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        {record.summary}
                      </p>

                      {/* Before / After Field Diffs Table */}
                      <div className="space-y-2 pt-1">
                        {record.changes.map((change, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0 min-w-24">
                              {change.label}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                              {/* Before */}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/50 font-mono text-[11px] line-through decoration-rose-400">
                                {change.oldValue}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              {/* After */}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 font-mono text-[11px] font-semibold">
                                {change.newValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Initial Creation Event Node at the base */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-100 dark:ring-slate-850 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                  •
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={creatorName}
                      picture={creatorMember?.picture}
                      size="xs"
                    />
                    <span className="text-slate-600 dark:text-slate-300">
                      Originally created by <strong className="text-slate-900 dark:text-white">{creatorName}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatDateTime(data.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>

          {onOpenEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onOpenEdit();
              }}
              className="gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Transaction</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
