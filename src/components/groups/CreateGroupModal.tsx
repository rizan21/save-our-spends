import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Plus, X, Users, DollarSign } from 'lucide-react';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, currency: string, initialMembers: string[]) => Promise<unknown>;
}

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
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
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const email = memberEmailInput.trim().toLowerCase();
    if (!email) return;
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (memberEmails.includes(email)) {
      setError('Member email already added');
      return;
    }
    setMemberEmails([...memberEmails, email]);
    setMemberEmailInput('');
    setError(null);
  };

  const handleRemoveMember = (email: string) => {
    setMemberEmails(memberEmails.filter((m) => m !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateGroup(name.trim(), currency, memberEmails);
      setName('');
      setMemberEmails([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      description="Creates a formatted Google Sheet in your Google Drive."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Group Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Group Name
          </label>
          <input
            type="text"
            placeholder="e.g. Goa Trip 2026, Apartment 4B, Tokyo Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            autoFocus
          />
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Members */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Invite Members by Email (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="friend@gmail.com"
              value={memberEmailInput}
              onChange={(e) => setMemberEmailInput(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddMember}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {/* Member Pills */}
          {memberEmails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {memberEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(email)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Group Sheet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
