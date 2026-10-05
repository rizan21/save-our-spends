import type { Group } from '../../../types/group';
import type { GoogleUser } from '../../../types/google';
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
}

export function MembersSection(props: MembersSectionProps) {
  const context = useGroupContext();

  const group = props.group || context?.group;
  const currentUser = props.currentUser || context?.currentUser;
  const currentUserEmail = props.currentUserEmail || currentUser?.email || '';
  const currentUserPicture = props.currentUserPicture || currentUser?.picture;
  const isOwner = props.isOwner !== undefined ? props.isOwner : (context?.isOwner ?? false);
  const isApproving = props.isApprovingInvite !== undefined ? props.isApprovingInvite : (context?.isApprovingInvite ?? false);

  if (!group) return null;

  return (
    <div className="space-y-6">
      <MemberList
        members={group.members}
        pendingInvites={group.pendingInvites}
        currentUserEmail={currentUserEmail}
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
      <DirectSheetsLink group={group} />
    </div>
  );
}
