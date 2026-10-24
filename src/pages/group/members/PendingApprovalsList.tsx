import { ShieldAlert, Check, Clock } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { PendingInvite } from '../../../types/group';

export interface PendingApprovalsListProps {
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  onApproveInvite: (inviteId: string) => Promise<unknown>;
  isApproving: boolean;
}

export function PendingApprovalsList({
  pendingInvites,
  isOwner,
  onApproveInvite,
  isApproving,
}: PendingApprovalsListProps) {
  const activePending = pendingInvites.filter((i) => i.status === 'PENDING');

  if (activePending.length === 0) return null;

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-900/40 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <span>Pending Invitations ({activePending.length})</span>
      </div>

      <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40 pt-1">
        {activePending.map((inv) => (
          <div
            key={inv.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={inv.invitedEmail.split('@')[0]} size="sm" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {inv.invitedEmail}
                </div>
                <div className="text-amber-800/80 dark:text-amber-400/80 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Invited by {inv.invitedByName || inv.invitedByEmail} on{' '}
                    {new Date(inv.requestedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {isOwner ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onApproveInvite(inv.id)}
                  isLoading={isApproving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Grant Access</span>
                </Button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium rounded-lg text-xs">
                Pending Owner Review
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
