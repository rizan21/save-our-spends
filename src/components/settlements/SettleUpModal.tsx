import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Member } from '../../types/group';
import type { PaymentMethod, Settlement } from '../../types/transaction';
import type { SimplifiedDebt } from '../../types/balance';
import { Calendar, CreditCard, DollarSign, FileText } from 'lucide-react';

export interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserEmail: string;
  currency: string;
  prefillDebt?: SimplifiedDebt | null;
  onAddSettlement: (settlement: Settlement) => Promise<unknown>;
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
}: SettleUpModalProps) {
  const [payerEmail, setPayerEmail] = useState(() => prefillDebt?.fromEmail || currentUserEmail);
  const [payeeEmail, setPayeeEmail] = useState(() => {
    if (prefillDebt) return prefillDebt.toEmail;
    const other = members.find((m) => m.email !== currentUserEmail);
    return other?.email || '';
  });
  const [amountStr, setAmountStr] = useState(() => (prefillDebt ? prefillDebt.amount.toString() : ''));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
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
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    try {
      await onAddSettlement(settlement);
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
      title="Record a Payment"
      description="Record money paid between members to clear debts."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Payer and Payee Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Who paid?
            </label>
            <select
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.name || m.email} {m.email === currentUserEmail ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paid to whom?
            </label>
            <select
              value={payeeEmail}
              onChange={(e) => setPayeeEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.name || m.email} {m.email === currentUserEmail ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            Amount ({currency})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
            autoFocus
          />
        </div>

        {/* Payment Method & Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Paid via bank transfer, Cash at hotel"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record Payment in Sheet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
