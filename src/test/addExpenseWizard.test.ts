import { describe, test, expect } from 'bun:test';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validatePaidBy,
  roundToCents,
} from '../core/splitCalculator';

describe('Add Expense Multi-Page Wizard Flow', () => {
  const members = [
    { email: 'alice@example.com', name: 'Alice', joinedAt: '', role: 'OWNER' as const },
    { email: 'bob@example.com', name: 'Bob', joinedAt: '', role: 'MEMBER' as const },
    { email: 'carol@example.com', name: 'Carol', joinedAt: '', role: 'MEMBER' as const },
  ];

  test('Page 1 validation: amount and description requirements', () => {
    const isValid = (amount: number, description: string) =>
      amount > 0 && description.trim().length > 0;

    expect(isValid(0, 'Lunch')).toBe(false);
    expect(isValid(-10, 'Lunch')).toBe(false);
    expect(isValid(25, '')).toBe(false);
    expect(isValid(25, '   ')).toBe(false);
    expect(isValid(25.5, 'Lunch with team')).toBe(true);
  });

  test('Page 2 validation: Single Payer assigns full amount', () => {
    const totalAmount = 60;
    const singlePayer = 'alice@example.com';
    const paidBy = { [singlePayer]: totalAmount };

    const validation = validatePaidBy(totalAmount, paidBy);
    expect(validation.isValid).toBe(true);
    expect(paidBy[singlePayer]).toBe(60);
  });

  test('Page 2 validation: Multiple Payers must sum to total amount', () => {
    const totalAmount = 100;

    // Incomplete sum
    const incomplete = validatePaidBy(totalAmount, {
      'alice@example.com': 40,
      'bob@example.com': 30,
    });
    expect(incomplete.isValid).toBe(false);
    expect(incomplete.difference).toBe(30);

    // Over-allocated sum
    const over = validatePaidBy(totalAmount, {
      'alice@example.com': 60,
      'bob@example.com': 50,
    });
    expect(over.isValid).toBe(false);
    expect(over.difference).toBe(-10);

    // Exact sum
    const exact = validatePaidBy(totalAmount, {
      'alice@example.com': 40,
      'bob@example.com': 35,
      'carol@example.com': 25,
    });
    expect(exact.isValid).toBe(true);
  });

  test('Page 3 split: Exact amounts split validation', () => {
    const totalAmount = 75;

    const validSplit = calculateExactSplit(totalAmount, {
      'alice@example.com': 25,
      'bob@example.com': 25,
      'carol@example.com': 25,
    });
    expect(validSplit.isValid).toBe(true);
    expect(validSplit.splits['alice@example.com']).toBe(25);

    const invalidSplit = calculateExactSplit(totalAmount, {
      'alice@example.com': 20,
      'bob@example.com': 25,
      'carol@example.com': 25,
    });
    expect(invalidSplit.isValid).toBe(false);
    expect(invalidSplit.difference).toBe(5);
  });

  test('Page 3 split: Percentage split validation and precision', () => {
    const totalAmount = 100;

    const valid = calculatePercentageSplit(totalAmount, {
      'alice@example.com': 50,
      'bob@example.com': 30,
      'carol@example.com': 20,
    });
    expect(valid.isValid).toBe(true);
    expect(valid.splits['alice@example.com']).toBe(50);
    expect(valid.splits['bob@example.com']).toBe(30);
    expect(valid.splits['carol@example.com']).toBe(20);

    const invalid = calculatePercentageSplit(totalAmount, {
      'alice@example.com': 50,
      'bob@example.com': 30,
      'carol@example.com': 15,
    });
    expect(invalid.isValid).toBe(false);
  });

  test('Page 3 split: Shares split proportional allocation', () => {
    const totalAmount = 90;

    const result = calculateSharesSplit(totalAmount, {
      'alice@example.com': 3,
      'bob@example.com': 2,
      'carol@example.com': 1,
    });
    expect(result.isValid).toBe(true);
    // 3/6 = $45, 2/6 = $30, 1/6 = $15
    expect(result.splits['alice@example.com']).toBe(45);
    expect(result.splits['bob@example.com']).toBe(30);
    expect(result.splits['carol@example.com']).toBe(15);
  });

  test('Page 3 net impact conservation: sum of net differences is always zero', () => {
    const totalAmount = 120;
    const paidBy = {
      'alice@example.com': 120,
      'bob@example.com': 0,
      'carol@example.com': 0,
    };
    const split = calculateEqualSplit(totalAmount, members.map((m) => m.email));
    expect(split.isValid).toBe(true);

    let netSum = 0;
    for (const m of members) {
      const paid = paidBy[m.email as keyof typeof paidBy] || 0;
      const owed = split.splits[m.email] || 0;
      const net = roundToCents(paid - owed);
      netSum = roundToCents(netSum + net);
    }

    expect(netSum).toBe(0);
  });
});
