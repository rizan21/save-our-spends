import { useState, type FormEvent } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Group } from '../../../types/group';
import type { GoogleUser } from '../../../types/google';
import { Button } from '../../../components/common/Button';
import { MemberList } from './MemberList';
import { DirectSheetsLink } from '../../../components/export/DirectSheetsLink';
import { useGroupContext } from '../GroupContext';

export interface MembersSectionProps {
  group?: Group;
  currentUser?: GoogleUser | null;
  currentUserEmail?: string;
  currentUserPicture?: string;
  isOwner?: boolean;
  onOpenInviteModal?: () => void;
  onOpenEditProfile?: () => void;
  onApproveInvite?: (inviteId: string) => Promise<unknown>;
  isApprovingInvite?: boolean;
  onUpdateDescription?: (description: string) => Promise<unknown>;
  isUpdatingDescription?: boolean;
}

export function MembersSection(props: MembersSectionProps) {
  const context = useGroupContext();

  const group = props.group || context?.group;
  const currentUser = props.currentUser || context?.currentUser;
  const currentUserEmail = props.currentUserEmail || currentUser?.email || '';
  const currentUserPicture = props.currentUserPicture || currentUser?.picture;
  const isOwner = props.isOwner !== undefined ? props.isOwner : (context?.isOwner ?? false);
  const isApproving = props.isApprovingInvite !== undefined ? props.isApprovingInvite : (context?.isApprovingInvite ?? false);
  const onUpdateDescription = props.onUpdateDescription || ((desc: string) => context?.updateDescription(desc) || Promise.resolve());
  const isUpdatingDescription = props.isUpdatingDescription !== undefined ? props.isUpdatingDescription : (context?.isUpdatingDescription ?? false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(group?.description || '');
  const [descError, setDescError] = useState<string | null>(null);

  if (!group) return null;

  const formattedCreatedAt = new Date(group.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleSaveDescription = async (e: FormEvent) => {
    e.preventDefault();
    setDescError(null);
    try {
      await onUpdateDescription(descriptionInput.trim());
      setIsEditingDescription(false);
    } catch (err) {
      setDescError(err instanceof Error ? err.message : 'Failed to update description');
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Group Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Group Info</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Created {formattedCreatedAt} • Currency: {group.currency}
            </p>
          </div>
          {!isEditingDescription && (
            <button
              type="button"
              onClick={() => {
                setDescriptionInput(group.description || '');
                setIsEditingDescription(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
              title="Edit group description"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <form onSubmit={handleSaveDescription} className="space-y-3">
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Group description..."
              rows={2}
              className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            {descError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{descError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" isLoading={isUpdatingDescription} className="gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDescriptionInput(group.description || '');
                  setIsEditingDescription(false);
                  setDescError(null);
                }}
                disabled={isUpdatingDescription}
                className="gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-200 break-words">
            {group.description || 'No description'}
          </p>
        )}

        <DirectSheetsLink group={group} />
      </div>

      {/* Card 2: Members */}
      <MemberList
        members={group.members}
        pendingInvites={group.pendingInvites}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUser?.name}
        currentUserPicture={currentUserPicture}
        isOwner={isOwner}
        onOpenInviteModal={props.onOpenInviteModal || (() => context?.openInviteModal())}
        onApproveInvite={
          props.onApproveInvite ||
          (async (inviteId: string) => {
            if (context && currentUser) {
              await context.approveInvite({ inviteId, approverEmail: currentUser.email });
            }
          })
        }
        isApproving={isApproving}
        onOpenEditProfile={props.onOpenEditProfile || context?.openEditProfile}
      />
    </div>
  );
}
