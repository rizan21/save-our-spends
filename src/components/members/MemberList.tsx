import { UserPlus, Shield, User } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { PendingApprovalsList } from './PendingApprovalsList';
import type { Member, PendingInvite } from '../../types/group';

export interface MemberListProps {
  members: Member[];
  pendingInvites: PendingInvite[];
  currentUserEmail: string;
  isOwner: boolean;
  onOpenInviteModal: () => void;
  onApproveInvite: (inviteId: string) => Promise<unknown>;
  isApproving: boolean;
}

export function MemberList({
  members,
  pendingInvites,
  currentUserEmail,
  isOwner,
  onOpenInviteModal,
  onApproveInvite,
  isApproving,
}: MemberListProps) {
  return (
    <div className="space-y-6">
      {/* Pending Approvals Section */}
      <PendingApprovalsList
        pendingInvites={pendingInvites}
        isOwner={isOwner}
        currentUserEmail={currentUserEmail}
        onApproveInvite={onApproveInvite}
        isApproving={isApproving}
      />

      {/* Active Members Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Active Members ({members.length})</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              People with edit permissions on this group Google Sheet.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenInviteModal} className="gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Invite</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => {
            const isMe = m.email === currentUserEmail;
            const isMemberOwner = m.role === 'OWNER';

            return (
              <div key={m.email} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs ${
                      isMemberOwner
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isMemberOwner ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>{m.name || m.email}</span>
                      {isMe && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.email}</div>
                  </div>
                </div>

                <div>
                  {isMemberOwner ? (
                    <Badge variant="emerald" className="gap-1 font-semibold">
                      <Shield className="w-3 h-3" /> Group Owner
                    </Badge>
                  ) : (
                    <Badge variant="slate">Member</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
