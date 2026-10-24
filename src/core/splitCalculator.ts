/**
 * Precision split calculation engine for group expense transactions.
 * All math operations use integer cents to guarantee penny conservation (no lost or gained cents).
 */

export interface SplitResult {
  splits: Record<string, number>;
  isValid: boolean;
  error?: string;
  difference?: number;
}

/**
 * Rounds a floating point currency amount to 2 decimal places.
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Formats a numeric currency amount using Intl.NumberFormat.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(Math.abs(amount));
  } catch {
    return `${currency} ${Math.abs(amount).toFixed(2)}`;
  }
}

/**
 * Splits an amount equally among participants, deterministically distributing
 * any remainder cents so that the sum of splits exactly equals totalAmount.
 */
export function calculateEqualSplit(
  totalAmount: number,
  participants: string[]
): SplitResult {
  if (participants.length === 0) {
    return { splits: {}, isValid: false, error: 'No participants provided' };
  }

  if (totalAmount <= 0) {
    const zeroSplits: Record<string, number> = {};
    for (const p of participants) zeroSplits[p] = 0;
    return { splits: zeroSplits, isValid: true };
  }

  const totalCents = Math.round(totalAmount * 100);
  const n = participants.length;
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents % n;

  const splits: Record<string, number> = {};
  participants.forEach((p, idx) => {
    // First 'remainderCents' participants receive an extra 1 cent
    const cents = idx < remainderCents ? baseCents + 1 : baseCents;
    splits[p] = cents / 100;
  });

  return { splits, isValid: true };
}

/**
 * Validates and returns exact user-specified amounts.
 * Verifies that sum of exact splits equals totalAmount.
 */
export function calculateExactSplit(
  totalAmount: number,
  exactAmounts: Record<string, number>
): SplitResult {
  const targetCents = Math.round(totalAmount * 100);
  let sumCents = 0;
  const splits: Record<string, number> = {};

  for (const [p, amount] of Object.entries(exactAmounts)) {
    const cents = Math.round(amount * 100);
    sumCents += cents;
    splits[p] = cents / 100;
  }

  const diffCents = targetCents - sumCents;
  if (diffCents !== 0) {
    return {
      splits,
      isValid: false,
      difference: diffCents / 100,
      error: `Split sum (${(sumCents / 100).toFixed(2)}) does not match total (${(targetCents / 100).toFixed(2)}). Difference: ${(diffCents / 100).toFixed(2)}`,
    };
  }

  return { splits, isValid: true };
}

/**
 * Splits by percentages. Validates that percentages sum to 100%
 * and distributes fractional cents using largest remainder method.
 */
export function calculatePercentageSplit(
  totalAmount: number,
  percentages: Record<string, number>
): SplitResult {
  const percentSum = Object.values(percentages).reduce((a, b) => a + b, 0);
  if (Math.abs(percentSum - 100) > 0.01) {
    return {
      splits: {},
      isValid: false,
      difference: 100 - percentSum,
      error: `Percentages sum to ${percentSum.toFixed(2)}%, expected 100%`,
    };
  }

  const totalCents = Math.round(totalAmount * 100);
  const rawSplits: Array<{ email: string; baseCents: number; fraction: number }> = [];
  let allocatedCents = 0;

  for (const [email, pct] of Object.entries(percentages)) {
    const exactCents = (totalCents * pct) / 100;
    const baseCents = Math.floor(exactCents);
    const fraction = exactCents - baseCents;
    allocatedCents += baseCents;
    rawSplits.push({ email, baseCents, fraction });
  }

  // Sort by fraction descending to distribute remaining cents
  rawSplits.sort((a, b) => b.fraction - a.fraction);
  let remainderCents = totalCents - allocatedCents;

  const splits: Record<string, number> = {};
  for (const item of rawSplits) {
    const extra = remainderCents > 0 ? 1 : 0;
    splits[item.email] = (item.baseCents + extra) / 100;
    if (remainderCents > 0) remainderCents--;
  }

  return { splits, isValid: true };
}

/**
 * Splits by proportional shares (e.g. Alice: 2 shares, Bob: 1 share).
 * Uses largest remainder method to ensure total cent sum matches.
 */
export function calculateSharesSplit(
  totalAmount: number,
  shares: Record<string, number>
): SplitResult {
  for (const [, shareCount] of Object.entries(shares)) {
    if (isNaN(shareCount) || shareCount < 0) {
      return {
        splits: {},
        isValid: false,
        error: 'Shares must be non-negative numbers',
      };
    }
  }

  const totalShares = Object.values(shares).reduce((a, b) => a + b, 0);
  if (totalShares <= 0) {
    return {
      splits: {},
      isValid: false,
      error: 'Total shares must be greater than zero',
    };
  }

  const totalCents = Math.round(totalAmount * 100);
  const rawSplits: Array<{ email: string; baseCents: number; fraction: number }> = [];
  let allocatedCents = 0;
  const splits: Record<string, number> = {};

  for (const [email, shareCount] of Object.entries(shares)) {
    if (shareCount <= 0) {
      splits[email] = 0;
      continue;
    }
    const exactCents = (totalCents * shareCount) / totalShares;
    const baseCents = Math.floor(exactCents);
    const fraction = exactCents - baseCents;
    allocatedCents += baseCents;
    rawSplits.push({ email, baseCents, fraction });
  }

  rawSplits.sort((a, b) => b.fraction - a.fraction);
  let remainderCents = totalCents - allocatedCents;

  for (const item of rawSplits) {
    const extra = remainderCents > 0 ? 1 : 0;
    splits[item.email] = (item.baseCents + extra) / 100;
    if (remainderCents > 0) remainderCents--;
  }

  return { splits, isValid: true };
}

/**
 * Validates multi-payer amounts.
 */
export function validatePaidBy(
  totalAmount: number,
  paidBy: Record<string, number>
): { isValid: boolean; difference?: number; error?: string } {
  const targetCents = Math.round(totalAmount * 100);
  let sumCents = 0;

  for (const amount of Object.values(paidBy)) {
    sumCents += Math.round(amount * 100);
  }

  const diffCents = targetCents - sumCents;
  if (diffCents !== 0) {
    return {
      isValid: false,
      difference: diffCents / 100,
      error: `Payer total (${(sumCents / 100).toFixed(2)}) does not match total amount (${(targetCents / 100).toFixed(2)})`,
    };
  }

  return { isValid: true };
}
