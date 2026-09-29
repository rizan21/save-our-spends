import { ShieldAlert, Check, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import type { PendingInvite } from '../../types/group';

export interface PendingApprovalsListProps {
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  currentUserEmail: string;
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
    <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600" />
        <span>Pending Invitations ({activePending.length})</span>
      </div>

      <p className="text-xs text-amber-800 leading-relaxed">
        {isOwner
          ? 'As the Google Sheet owner, only you can grant edit permissions on this spreadsheet in Google Drive.'
          : 'Invitations proposed by members are awaiting approval from the Google Sheet owner before edit permissions can be granted.'}
      </p>

      <div className="divide-y divide-amber-200/60 pt-1">
        {activePending.map((inv) => (
          <div
            key={inv.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div>
              <div className="font-semibold text-slate-900 text-sm">
                {inv.invitedEmail}
              </div>
              <div className="text-amber-800/80 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Invited by {inv.invitedByName || inv.invitedByEmail} on{' '}
                  {new Date(inv.requestedAt).toLocaleDateString()}
                </span>
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-medium rounded-lg text-xs">
                Pending Owner Review
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
