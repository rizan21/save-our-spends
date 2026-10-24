import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Mail, AlertCircle } from 'lucide-react';
import type { Member, PendingInvite } from '../../../types/group';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  existingMembers: Member[];
  pendingInvites: PendingInvite[];
  currentUserEmail: string;
  currentUserName: string;
  onInvite: (email: string) => Promise<unknown>;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  isOwner,
  existingMembers,
  pendingInvites,
  onInvite,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (existingMembers.some((m) => m.email.toLowerCase() === targetEmail)) {
      setError('This user is already an active member of the group');
      return;
    }

    if (
      pendingInvites.some(
        (i) => i.invitedEmail.toLowerCase() === targetEmail && i.status === 'PENDING'
      )
    ) {
      setError('An invitation is already pending for this email');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onInvite(targetEmail);
      setEmail('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Member"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Google Account Email
          </label>
          <input
            type="email"
            placeholder="colleague@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            autoFocus
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isOwner ? 'Add Member' : 'Propose Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
