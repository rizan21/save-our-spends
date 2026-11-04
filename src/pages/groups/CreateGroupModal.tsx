import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, currency: string, initialMembers: string[], description?: string) => Promise<unknown>;
  onReauthorize?: () => Promise<unknown>;
}

const COMMON_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  onReauthorize,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMissingDriveConsent = Boolean(
    error &&
      (/drive\.file|google drive permission|caller does not have permission|insufficient.*scope/i.test(
        error
      ))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateGroup(name.trim(), currency, [], undefined);
      setName('');
      setCurrency('INR');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReauthorize = async () => {
    if (!onReauthorize) return;
    setIsReauthorizing(true);
    try {
      await onReauthorize();
      setError(null);
    } catch (authErr) {
      setError(authErr instanceof Error ? authErr.message : 'Re-authorization failed');
    } finally {
      setIsReauthorizing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs rounded-xl space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-rose-900 dark:text-rose-100">
                  {isMissingDriveConsent ? 'Google Drive Permission Required' : 'Failed to Create Group'}
                </span>
                <p className="leading-relaxed text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              </div>
            </div>
            {isMissingDriveConsent && onReauthorize && (
              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReauthorize}
                  isLoading={isReauthorizing}
                  className="text-xs bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 gap-1.5 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-authorize with Google</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Group Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Group Name
          </label>
          <input
            type="text"
            placeholder="e.g. Goa Trip 2026, Apartment 4B"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            autoFocus
          />
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
