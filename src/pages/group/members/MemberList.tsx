import { useState } from 'react';
import {
  UserPlus,
  Pencil,
  UserMinus,
  RotateCcw,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { Modal } from '../../../components/common/Modal';
import { PendingApprovalsList } from './PendingApprovalsList';
import { useGroupContext } from '../GroupContext';
import { groupService } from '../../../services/groupService';
import type { Member, PendingInvite, DriveDiscrepancy } from '../../../types/group';

export interface MemberListProps {
  members: Member[];
  pendingInvites: PendingInvite[];
  currentUserEmail: string;
  currentUserName?: string;
  currentUserPicture?: string;
  isOwner: boolean;
  onOpenInviteModal: (initialEmail?: string) => void;
  onApproveInvite: (inviteId: string) => Promise<unknown>;
  isApproving: boolean;
  onOpenEditProfile?: () => void;
  groupId?: string;
  onSoftDeleteMember?: (email: string) => Promise<unknown>;
  isSoftDeleting?: boolean;
  onRestoreMember?: (email: string) => Promise<unknown>;
  isRestoring?: boolean;
}

export function MemberList({
  members,
  pendingInvites,
  currentUserEmail,
  currentUserName,
  currentUserPicture,
  isOwner,
  onOpenInviteModal,
  onApproveInvite,
  isApproving,
  onOpenEditProfile,
  groupId,
  onSoftDeleteMember,
  isSoftDeleting,
  onRestoreMember,
  isRestoring,
}: MemberListProps) {
  const context = useGroupContext();
  const targetGroupId = groupId || context?.group?.id;
  const softDeleteMember = onSoftDeleteMember || context?.softDeleteMember;
  const isSoftDeletingMember = isSoftDeleting ?? context?.isSoftDeletingMember ?? false;
  const restoreMember = onRestoreMember || context?.restoreMember;
  const isRestoringMember = isRestoring ?? context?.isRestoringMember ?? false;

  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [restoringEmail, setRestoringEmail] = useState<string | null>(null);

  // Audit State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [discrepancies, setDiscrepancies] = useState<DriveDiscrepancy[] | null>(null);
  const [remediatingEmail, setRemediatingEmail] = useState<string | null>(null);

  const activeMembers = members.filter((m) => m.status !== 'INACTIVE');
  const inactiveMembers = members.filter((m) => m.status === 'INACTIVE');

  const handleRemoveMember = async (m: Member) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${m.name || m.email}? Their Drive access will be revoked, but historical transactions and tabs will be preserved.`
    );
    if (!confirmed) return;

    setDeletingEmail(m.email);
    try {
      if (softDeleteMember) {
        await softDeleteMember(m.email);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setDeletingEmail(null);
    }
  };

  const handleRestoreMember = async (m: Member) => {
    setRestoringEmail(m.email);
    try {
      if (restoreMember) {
        await restoreMember(m.email);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore member');
    } finally {
      setRestoringEmail(null);
    }
  };

  const handleRunAudit = async () => {
    if (!targetGroupId) return;
    setIsAuditing(true);
    setAuditError(null);
    try {
      const results = await groupService.auditDrivePermissions(targetGroupId);
      setDiscrepancies(results);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Failed to audit permissions');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOpenAudit = () => {
    setIsAuditModalOpen(true);
    void handleRunAudit();
  };

  const handleRemediate = async (
    action: () => Promise<unknown>,
    emailKey: string
  ) => {
    setRemediatingEmail(emailKey);
    try {
      await action();
      await handleRunAudit();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remediate discrepancy');
    } finally {
      setRemediatingEmail(null);
    }
  };

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
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Active Members ({activeMembers.length})
          </h3>
          <div className="flex items-center gap-2">
            {isOwner && targetGroupId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenAudit}
                className="gap-1.5 text-slate-700 dark:text-slate-300"
                title="Sync member list with Drive file sharing permissions"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sync</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onOpenInviteModal()} className="gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Invite</span>
            </Button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeMembers.map((m) => {
            const isMe = m.email === currentUserEmail;
            const isMemberOwner = m.role === 'OWNER';
            const memberPic = isMe ? currentUserPicture || m.picture : m.picture;
            const memberName = isMe && currentUserName ? currentUserName : m.name || m.email;
            const isThisDeleting = deletingEmail === m.email || (isSoftDeletingMember && deletingEmail === m.email);

            return (
              <div key={m.email} className="py-3 flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={memberName} picture={memberPic} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{memberName}</span>
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
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{m.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isMemberOwner ? (
                    <Badge variant="emerald">Owner</Badge>
                  ) : null}

                  {isOwner && !isMemberOwner && !isMe && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(m)}
                      disabled={isThisDeleting}
                      isLoading={isThisDeleting}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 px-2 py-1 h-auto text-xs gap-1"
                      title="Remove member (soft-delete)"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inactive Members Section */}
      {inactiveMembers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Inactive Members ({inactiveMembers.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Removed members retain historical records and can settle remaining debts.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {inactiveMembers.map((m) => {
              const isMe = m.email === currentUserEmail;
              const memberPic = isMe ? currentUserPicture || m.picture : m.picture;
              const memberName = isMe && currentUserName ? currentUserName : m.name || m.email;
              const isThisRestoring = restoringEmail === m.email || (isRestoringMember && restoringEmail === m.email);

              return (
                <div key={m.email} className="py-3 flex items-center justify-between text-xs sm:text-sm gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={memberName} picture={memberPic} size="md" isInactive />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{memberName}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                          (Removed)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreMember(m)}
                        disabled={isThisRestoring}
                        isLoading={isThisRestoring}
                        className="gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs px-2.5 py-1 h-auto"
                        title="Restore member to active status"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenInviteModal(m.email)}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Propose re-inviting this member"
                      >
                        Request Restore
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advisory Drive Permissions Audit Modal */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Sync Drive Permissions"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compares active members against Google Drive sharing permissions for this spreadsheet.
              Zero automatic mutations occur without your approval.
            </p>

            {isAuditing && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Syncing Google Drive permissions...</span>
              </div>
            )}

            {auditError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{auditError}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleRunAudit}>
                  Retry
                </Button>
              </div>
            )}

            {!isAuditing && !auditError && discrepancies !== null && (
              <>
                {discrepancies.length === 0 ? (
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>All Google Drive permissions match the active member list. No discrepancies found.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{discrepancies.length} discrepancy found</span>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {discrepancies.map((d, idx) => {
                        const emailKey = `${d.type}-${d.email}`;
                        const isWorking = remediatingEmail === emailKey;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  {d.name ? `${d.name} (${d.email})` : d.email}
                                </span>
                              </div>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                {d.type === 'MISSING_DRIVE_PERMISSION' && 'Missing Drive Access'}
                                {d.type === 'INACTIVE_HAS_WRITE_ACCESS' && 'Inactive Has Access'}
                                {d.type === 'DRIVE_USER_NOT_IN_SHEET' && 'Not In Sheet'}
                                {d.type === 'READ_ONLY_ACCESS' && 'View-Only'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {d.type === 'MISSING_DRIVE_PERMISSION' &&
                                'Active member does not have Google Drive file access.'}
                              {d.type === 'INACTIVE_HAS_WRITE_ACCESS' &&
                                'Removed member still has write permissions on Google Drive.'}
                              {d.type === 'DRIVE_USER_NOT_IN_SHEET' &&
                                'User has Drive access but is not recorded in the spreadsheet members list.'}
                              {d.type === 'READ_ONLY_ACCESS' &&
                                'User has read-only permission instead of write access.'}
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                              {d.type === 'MISSING_DRIVE_PERMISSION' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isWorking}
                                    isLoading={isWorking}
                                    onClick={() =>
                                      handleRemediate(
                                        () =>
                                          targetGroupId
                                            ? groupService.grantDriveWriterPermission(targetGroupId, d.email)
                                            : Promise.resolve(),
                                        emailKey
                                      )
                                    }
                                  >
                                    Grant Access
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-600 hover:text-rose-700"
                                    disabled={isWorking}
                                    onClick={() =>
                                      handleRemediate(
                                        () => (softDeleteMember ? softDeleteMember(d.email) : Promise.resolve()),
                                        emailKey
                                      )
                                    }
                                  >
                                    Remove Member
                                  </Button>
                                </>
                              )}

                              {d.type === 'INACTIVE_HAS_WRITE_ACCESS' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isWorking}
                                    isLoading={isWorking}
                                    onClick={() =>
                                      handleRemediate(
                                        () =>
                                          targetGroupId && d.permissionId
                                            ? groupService.revokeDrivePermission(targetGroupId, d.permissionId)
                                            : Promise.resolve(),
                                        emailKey
                                      )
                                    }
                                  >
                                    Revoke Access
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={isWorking}
                                    onClick={() =>
                                      handleRemediate(
                                        () => (restoreMember ? restoreMember(d.email) : Promise.resolve()),
                                        emailKey
                                      )
                                    }
                                  >
                                    Restore Member
                                  </Button>
                                </>
                              )}

                              {d.type === 'DRIVE_USER_NOT_IN_SHEET' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isWorking}
                                    onClick={() => {
                                      setIsAuditModalOpen(false);
                                      onOpenInviteModal(d.email);
                                    }}
                                  >
                                    Add to Group
                                  </Button>
                                  {d.permissionId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-rose-600 hover:text-rose-700"
                                      disabled={isWorking}
                                      isLoading={isWorking}
                                      onClick={() =>
                                        handleRemediate(
                                          () =>
                                            targetGroupId && d.permissionId
                                              ? groupService.revokeDrivePermission(targetGroupId, d.permissionId)
                                              : Promise.resolve(),
                                          emailKey
                                        )
                                      }
                                    >
                                      Revoke Access
                                    </Button>
                                  )}
                                </>
                              )}

                              {d.type === 'READ_ONLY_ACCESS' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={isWorking}
                                    isLoading={isWorking}
                                    onClick={() =>
                                      handleRemediate(
                                        () =>
                                          targetGroupId
                                            ? groupService.grantDriveWriterPermission(targetGroupId, d.email)
                                            : Promise.resolve(),
                                        emailKey
                                      )
                                    }
                                  >
                                    Upgrade to Writer
                                  </Button>
                                  {d.permissionId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-rose-600 hover:text-rose-700"
                                      disabled={isWorking}
                                      isLoading={isWorking}
                                      onClick={() =>
                                        handleRemediate(
                                          () =>
                                            targetGroupId && d.permissionId
                                              ? groupService.revokeDrivePermission(targetGroupId, d.permissionId)
                                              : Promise.resolve(),
                                          emailKey
                                        )
                                      }
                                    >
                                      Revoke Access
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Refresh Sync</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAuditModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}