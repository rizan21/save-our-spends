import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '../services/groupService';
import { cacheGroups, getCachedGroups, getImportedGroups, saveImportedGroup } from '../services/storageService';
import type { GoogleDriveFile, GoogleUser } from '../types/google';

export function useGroups(currentUser: GoogleUser | null) {
  const queryClient = useQueryClient();
  const queryKey = ['groups', currentUser?.email || 'guest'];

  const groupsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<GoogleDriveFile[]> => {
      if (!currentUser) return [];
      try {
        const [live, imported] = await Promise.all([
          groupService.listGroups(currentUser.email),
          getImportedGroups(),
        ]);

        const map = new Map<string, GoogleDriveFile>();
        for (const f of live) map.set(f.id, f);
        for (const f of imported) {
          if (!map.has(f.id)) map.set(f.id, f);
        }

        const combined = Array.from(map.values());
        cacheGroups(combined);
        return combined;
      } catch (err) {
        const cached = await getCachedGroups();
        if (cached && cached.length > 0) {
          return cached;
        }
        throw err;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 30, // 30 seconds
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({
      name,
      currency,
      initialMembers,
      description,
    }: {
      name: string;
      currency: string;
      initialMembers: string[];
      description?: string;
    }) => {
      return await groupService.createGroup(name, currency, initialMembers, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const importGroupMutation = useMutation({
    mutationFn: async (file: GoogleDriveFile) => {
      await saveImportedGroup(file);
      return file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    isRefetching: groupsQuery.isRefetching,
    error: groupsQuery.error,
    refetch: groupsQuery.refetch,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    importGroup: importGroupMutation.mutateAsync,
    isImporting: importGroupMutation.isPending,
  };
}
