import { useQueries } from '@tanstack/react-query';
import { groupService } from '../services/groupService';
import { cacheGroupDetail } from '../services/storageService';
import { calculateBalances } from '../core/debtSimplifier';
import type { GoogleDriveFile } from '../types/google';
import type { SimplifiedDebt } from '../types/balance';
import type { GroupDataPayload } from './useGroupDetail';

export interface ActiveSettlementItem {
  groupId: string;
  groupName: string;
  debt: SimplifiedDebt;
}

export function useHomeSummary(groups: GoogleDriveFile[], currentUserEmail: string) {
  const groupQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: ['group-detail', g.id],
      queryFn: async (): Promise<GroupDataPayload | null> => {
        const data = await groupService.loadGroup(g.id);
        cacheGroupDetail(g.id, data);
        return data;
      },
      staleTime: 1000 * 30, // 30s
      enabled: !!g.id && !!currentUserEmail,
    })),
  });

  const isLoading = groupQueries.some((q) => q.isLoading);

  const groupBalances: Record<string, { netBalance: number; currency: string }> = {};
  const activeSettlements: ActiveSettlementItem[] = [];

  let totalYouAreOwed = 0;
  let totalYouOwe = 0;
  let primaryCurrency = 'USD';

  for (const q of groupQueries) {
    if (q.data && q.data.group) {
      const { group, expenses, settlements } = q.data;
      const summary = calculateBalances(
        group.members,
        expenses,
        settlements,
        group.currency
      );
      const groupId = group.id;
      const groupName = group.name;
      const currency = group.currency;
      primaryCurrency = currency;
      const userBalance = summary.balances[currentUserEmail]?.netBalance || 0;
      groupBalances[groupId] = { netBalance: userBalance, currency };

      if (userBalance > 0.005) {
        totalYouAreOwed += userBalance;
      } else if (userBalance < -0.005) {
        totalYouOwe += Math.abs(userBalance);
      }

      for (const debt of summary.simplifiedDebts) {
        // Collect debts where the user is either the payer or payee
        if (debt.fromEmail === currentUserEmail || debt.toEmail === currentUserEmail) {
          activeSettlements.push({
            groupId,
            groupName,
            debt,
          });
        }
      }
    }
  }

  // Sort so settlements where someone owes the user appear first, then newest/highest
  activeSettlements.sort((a, b) => {
    const aIsPayee = a.debt.toEmail === currentUserEmail ? 1 : 0;
    const bIsPayee = b.debt.toEmail === currentUserEmail ? 1 : 0;
    if (aIsPayee !== bIsPayee) return bIsPayee - aIsPayee;
    return b.debt.amount - a.debt.amount;
  });

  return {
    isLoading,
    groupBalances,
    activeSettlements,
    totalYouAreOwed,
    totalYouOwe,
    currency: primaryCurrency,
  };
}
