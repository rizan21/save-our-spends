import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '../services/groupService';
import { cacheGroupDetail, getCachedGroupDetail } from '../services/storageService';
import { calculateBalances } from '../core/debtSimplifier';
import type { Group, PendingInvite } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';
import type { GroupFinancialSummary } from '../types/balance';

export interface GroupDataPayload {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
}

export function useGroupDetail(groupId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['group-detail', groupId];

  const groupQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<GroupDataPayload | null> => {
      if (!groupId) return null;
      try {
        const data = await groupService.loadGroup(groupId);
        cacheGroupDetail(groupId, data);
        return data;
      } catch (err) {
        const cached = await getCachedGroupDetail<GroupDataPayload>(groupId);
        if (cached) return cached;
        throw err;
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 15, // 15 seconds
  });

  // Calculate real-time financial balances whenever data changes
  const financialSummary: GroupFinancialSummary | null = groupQuery.data?.group?.members
    ? calculateBalances(
        groupQuery.data.group.members,
        groupQuery.data.expenses || [],
        groupQuery.data.settlements || [],
        groupQuery.data.group.currency || 'USD'
      )
    : null;

  // 1. Optimistic Add Expense
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.addExpense(groupId, expense);
      return expense;
    },
    onMutate: async (newExpense: Expense) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          expenses: [newExpense, ...previous.expenses],
        });
      }

      return { previous };
    },
    onError: (_err, _newExpense, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 2. Optimistic Add Settlement
  const addSettlementMutation = useMutation({
    mutationFn: async (settlement: Settlement) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.addSettlement(groupId, settlement);
      return settlement;
    },
    onMutate: async (newSettlement: Settlement) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          settlements: [newSettlement, ...previous.settlements],
        });
      }

      return { previous };
    },
    onError: (_err, _newSettlement, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Optimistic Update Expense
  const updateExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.updateExpense(groupId, expense);
      return expense;
    },
    onMutate: async (updatedExpense: Expense) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          expenses: previous.expenses.map((e) =>
            e.id === updatedExpense.id ? updatedExpense : e
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _updatedExpense, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Optimistic Update Settlement
  const updateSettlementMutation = useMutation({
    mutationFn: async (settlement: Settlement) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.updateSettlement(groupId, settlement);
      return settlement;
    },
    onMutate: async (updatedSettlement: Settlement) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          settlements: previous.settlements.map((s) =>
            s.id === updatedSettlement.id ? updatedSettlement : s
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _updatedSettlement, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Optimistic Propose Invite
  const proposeInviteMutation = useMutation({
    mutationFn: async (invite: PendingInvite) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.proposeInvite(groupId, invite);
      return invite;
    },
    onMutate: async (newInvite: PendingInvite) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          group: {
            ...previous.group,
            pendingInvites: [...previous.group.pendingInvites, newInvite],
          },
        });
      }

      return { previous };
    },
    onError: (_err, _newInvite, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Optimistic Approve Invite
  const approveInviteMutation = useMutation({
    mutationFn: async ({
      inviteId,
      approverEmail,
    }: {
      inviteId: string;
      approverEmail: string;
    }) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.approveInvite(groupId, inviteId, approverEmail);
    },
    onMutate: async ({ inviteId, approverEmail }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        const targetInvite = previous.group.pendingInvites.find((i) => i.id === inviteId);
        const updatedInvites = previous.group.pendingInvites.map((i) =>
          i.id === inviteId
            ? { ...i, status: 'APPROVED' as const, approvedAt: new Date().toISOString() }
            : i
        );

        const newMembers = [...previous.group.members];
        if (targetInvite && !newMembers.some((m) => m.email === targetInvite.invitedEmail)) {
          newMembers.push({
            email: targetInvite.invitedEmail,
            name: targetInvite.invitedEmail.split('@')[0],
            role: 'MEMBER',
            status: 'ACTIVE',
            addedBy: approverEmail,
            joinedAt: new Date().toISOString(),
          });
        }

        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          group: {
            ...previous.group,
            members: newMembers,
            pendingInvites: updatedInvites,
          },
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 5. Optimistic Update Description
  const updateDescriptionMutation = useMutation({
    mutationFn: async (description: string) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.updateGroupDescription(groupId, description);
      return description;
    },
    onMutate: async (newDescription: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          group: {
            ...previous.group,
            description: newDescription,
          },
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 6. Optimistic Update Member Name
  const updateMemberNameMutation = useMutation({
    mutationFn: async ({ email, newName }: { email: string; newName: string }) => {
      if (!groupId) throw new Error('No group selected');
      await groupService.updateMemberName(groupId, email, newName);
      return { email, newName };
    },
    onMutate: async ({ email, newName }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupDataPayload>(queryKey);

      if (previous) {
        const updatedMembers = previous.group.members.map((m) =>
          m.email === email ? { ...m, name: newName } : m
        );
        queryClient.setQueryData<GroupDataPayload>(queryKey, {
          ...previous,
          group: {
            ...previous.group,
            members: updatedMembers,
          },
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<GroupDataPayload>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    group: groupQuery.data?.group || null,
    expenses: groupQuery.data?.expenses || [],
    settlements: groupQuery.data?.settlements || [],
    financialSummary,
    isLoading: groupQuery.isLoading,
    isRefetching: groupQuery.isRefetching,
    error: groupQuery.error,
    refetch: groupQuery.refetch,
    // Mutations
    addExpense: addExpenseMutation.mutateAsync,
    isAddingExpense: addExpenseMutation.isPending,
    updateExpense: updateExpenseMutation.mutateAsync,
    isUpdatingExpense: updateExpenseMutation.isPending,
    addSettlement: addSettlementMutation.mutateAsync,
    isAddingSettlement: addSettlementMutation.isPending,
    updateSettlement: updateSettlementMutation.mutateAsync,
    isUpdatingSettlement: updateSettlementMutation.isPending,
    proposeInvite: proposeInviteMutation.mutateAsync,
    isProposingInvite: proposeInviteMutation.isPending,
    approveInvite: approveInviteMutation.mutateAsync,
    isApprovingInvite: approveInviteMutation.isPending,
    updateDescription: updateDescriptionMutation.mutateAsync,
    isUpdatingDescription: updateDescriptionMutation.isPending,
    updateMemberName: updateMemberNameMutation.mutateAsync,
    isUpdatingMemberName: updateMemberNameMutation.isPending,
  };
}
