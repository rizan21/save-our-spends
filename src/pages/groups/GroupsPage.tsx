import { useState } from 'react';
import { GroupList } from '../../components/groups/GroupList';
import { CreateGroupModal } from './CreateGroupModal';
import { OpenGroupModal } from './OpenGroupModal';
import { useGroups } from '../../hooks/useGroups';
import { useHomeSummary } from '../../hooks/useHomeSummary';
import type { GoogleUser } from '../../types/google';
import type { SimplifiedDebt } from '../../types/balance';

export interface GroupsPageProps {
  user: GoogleUser | null;
  onSelectGroup: (groupId: string, debt?: SimplifiedDebt) => void;
  onLogin: () => void;
  onReauthorize?: () => Promise<unknown>;
}

export function GroupsPage({
  user,
  onSelectGroup,
  onLogin,
  onReauthorize,
}: GroupsPageProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isOpenGroupModalOpen, setIsOpenGroupModalOpen] = useState(false);

  // Groups query & mutations
  const {
    groups,
    isLoading: isGroupsLoading,
    isRefetching: isGroupsRefetching,
    refetch: refetchGroups,
    createGroup,
    importGroup,
  } = useGroups(user);

  // Home aggregate balances & active settlements across all groups
  const {
    groupBalances,
    activeSettlements,
    totalYouAreOwed,
    totalYouOwe,
    currency: homeCurrency,
  } = useHomeSummary(groups, user?.email || '');

  const handleCreateGroup = async (
    name: string,
    currency: string,
    initialMembers: string[],
    description?: string
  ) => {
    const newSheetId = await createGroup({ name, currency, initialMembers, description });
    onSelectGroup(newSheetId);
  };

  const handleOpenGroup = async (file: { id: string }) => {
    await importGroup(file as Parameters<typeof importGroup>[0]);
    onSelectGroup(file.id);
  };

  return (
    <>
      <GroupList
        groups={groups}
        currentUserEmail={user?.email || ''}
        isLoading={isGroupsLoading}
        isRefetching={isGroupsRefetching}
        groupBalances={groupBalances}
        activeSettlements={activeSettlements}
        totalYouAreOwed={totalYouAreOwed}
        totalYouOwe={totalYouOwe}
        currency={homeCurrency}
        onSelectGroup={onSelectGroup}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenImportModal={() => setIsOpenGroupModalOpen(true)}
        onSettleDebt={(groupId, debt) => {
          onSelectGroup(groupId, debt);
        }}
        onRefresh={refetchGroups}
        onLogin={onLogin}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        onReauthorize={onReauthorize}
      />

      {/* Open / Import Shared Group Modal */}
      <OpenGroupModal
        isOpen={isOpenGroupModalOpen}
        onClose={() => setIsOpenGroupModalOpen(false)}
        onOpenGroup={handleOpenGroup}
      />
    </>
  );
}
