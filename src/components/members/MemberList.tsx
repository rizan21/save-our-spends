import { UserPlus, Shield, Pencil } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { UserAvatar } from '../common/UserAvatar';
import { PendingApprovalsList } from './PendingApprovalsList';
import type { Member, PendingInvite } from '../../types/group';

export interface MemberListProps {
  members: Member[];
  pendingInvites: PendingInvite[];
  currentUserEmail: string;
  currentUserPicture?: string;
  isOwner: boolean;
  onOpenInviteModal: () => void;
  onApproveInvite: (inviteId: string) => Promise<unknown>;
  isApproving: boolean;
  onOpenEditProfile?: () => void;
}

export function MemberList({
  members,
  pendingInvites,
  currentUserEmail,
  currentUserPicture,
  isOwner,
  onOpenInviteModal,
  onApproveInvite,
  isApproving,
  onOpenEditProfile,
}: MemberListProps) {
  return (
    <div className="space-y-6">
      {/* Pending Approvals Section */}
      <PendingApprovalsList
        pendingInvites={pendingInvites}
        isOwner={isOwner}
        onApproveInvite={onApproveInvite}
        isApproving={isApproving}
      />

      {/* Active Members Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Active Members ({members.length})</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              People with edit permissions on this group Google Sheet.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenInviteModal} className="gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Invite</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => {
            const isMe = m.email === currentUserEmail;
            const isMemberOwner = m.role === 'OWNER';
            const memberPic = isMe ? (currentUserPicture || m.picture) : m.picture;

            return (
              <div key={m.email} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <UserAvatar name={m.name || m.email} picture={memberPic} size="md" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{m.name || m.email}</span>
                      {isMe && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold">
                          YOU
                        </span>
                      )}
                      {isMe && onOpenEditProfile && (
                        <button
                          type="button"
                          onClick={onOpenEditProfile}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                          title="Edit your display name"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit name</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{m.email}</div>
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
