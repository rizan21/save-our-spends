import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type { Member } from '../../../types/group';
import type { PaymentMethod, Settlement } from '../../../types/transaction';
import type { SimplifiedDebt } from '../../../types/balance';
import { computeSettlementDiff } from '../../../core/historyTracker';
import { combineDateAndTime, extractTimeFromTimestamp } from '../../../core/dateTime';
import { Calendar, Clock, CreditCard, DollarSign, FileText } from 'lucide-react';

export interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserEmail: string;
  currency: string;
  prefillDebt?: SimplifiedDebt | null;
  onAddSettlement?: (settlement: Settlement) => Promise<unknown>;
  onEditSettlement?: (settlement: Settlement) => Promise<unknown>;
  initialSettlement?: Settlement | null;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Digital Wallet',
  'Other',
];

export function SettleUpModal({
  isOpen,
  onClose,
  members,
  currentUserEmail,
  currency,
  prefillDebt,
  onAddSettlement,
  onEditSettlement,
  initialSettlement,
}: SettleUpModalProps) {
  const [payerEmail, setPayerEmail] = useState(() => initialSettlement?.payerEmail || prefillDebt?.fromEmail || currentUserEmail);
  const [payeeEmail, setPayeeEmail] = useState(() => {
    if (initialSettlement) return initialSettlement.payeeEmail;
    if (prefillDebt) return prefillDebt.toEmail;
    const other = members.find((m) => m.email !== currentUserEmail);
    return other?.email || '';
  });
  const [amountStr, setAmountStr] = useState(() => (initialSettlement ? initialSettlement.amount.toString() : prefillDebt ? prefillDebt.amount.toString() : ''));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => initialSettlement?.paymentMethod || 'UPI');
  const [date, setDate] = useState(() => initialSettlement?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => extractTimeFromTimestamp(initialSettlement?.createdAt).slice(0, 5));
  const [isTimeCustomized, setIsTimeCustomized] = useState(false);
  const [notes, setNotes] = useState(() => initialSettlement?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr) || 0;

    if (amount <= 0) {
      setError('Please enter an amount greater than 0');
      return;
    }
    if (!payerEmail || !payeeEmail) {
      setError('Please select both payer and payee');
      return;
    }
    if (payerEmail === payeeEmail) {
      setError('Payer and payee cannot be the same person');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payer = members.find((m) => m.email === payerEmail);
    const payee = members.find((m) => m.email === payeeEmail);
    const createdAt = !initialSettlement && !isTimeCustomized
      ? new Date().toISOString()
      : combineDateAndTime(date, time);

    if (initialSettlement) {
      const updatedSettlement: Settlement = {
        ...initialSettlement,
        date,
        createdAt,
        payerEmail,
        payerName: payer?.name || payerEmail,
        payeeEmail,
        payeeName: payee?.name || payeeEmail,
        amount: Math.round(amount * 100) / 100,
        currency,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const diff = computeSettlementDiff(
        initialSettlement,
        updatedSettlement,
        currentUserEmail,
        members.find((m) => m.email === currentUserEmail)?.name,
        members
      );

      if (diff) {
        updatedSettlement.history = [...(initialSettlement.history || []), diff];
      }

      try {
        if (onEditSettlement) {
          await onEditSettlement(updatedSettlement);
        }
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update settlement');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const settlement: Settlement = {
      id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      payerEmail,
      payerName: payer?.name || payerEmail,
      payeeEmail,
      payeeName: payee?.name || payeeEmail,
      amount: Math.round(amount * 100) / 100,
      currency,
      paymentMethod,
      notes: notes.trim() || undefined,
      recordedBy: currentUserEmail,
      createdAt,
      status: 'ACTIVE',
    };

    try {
      if (onAddSettlement) {
        await onAddSettlement(settlement);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSettlement ? 'Edit Settlement Payment' : 'Record a Payment'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Payer and Payee Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Who paid?
            </label>
            <select
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.email} value={m.email} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {m.name || m.email} {m.email === currentUserEmail ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Paid to whom?
            </label>
            <select
              value={payeeEmail}
              onChange={(e) => setPayeeEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.email} value={m.email} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {m.name || m.email} {m.email === currentUserEmail ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Amount ({currency})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
            autoFocus
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIsTimeCustomized(true);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setIsTimeCustomized(true);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Paid via bank transfer, Cash at hotel"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
