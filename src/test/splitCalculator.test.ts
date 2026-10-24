import { describe, test, expect } from 'bun:test';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validatePaidBy,
  roundToCents,
} from '../core/splitCalculator';

describe('splitCalculator - Math & Precision', () => {
  test('calculateEqualSplit divides cleanly without losing remainder cents', () => {
    // 100 split 3 ways: 33.34 + 33.33 + 33.33 = 100.00
    const res = calculateEqualSplit(100, ['a@test.com', 'b@test.com', 'c@test.com']);
    expect(res.isValid).toBe(true);
    expect(res.splits['a@test.com']).toBe(33.34);
    expect(res.splits['b@test.com']).toBe(33.33);
    expect(res.splits['c@test.com']).toBe(33.33);

    const sum = Object.values(res.splits).reduce((a, b) => a + b, 0);
    expect(roundToCents(sum)).toBe(100);
  });

  test('calculateEqualSplit with 7 participants and $10 total', () => {
    const participants = ['1', '2', '3', '4', '5', '6', '7'];
    const res = calculateEqualSplit(10, participants);
    expect(res.isValid).toBe(true);

    const sum = Object.values(res.splits).reduce((a, b) => a + b, 0);
    expect(roundToCents(sum)).toBe(10);
    // 1000 cents / 7 = 142 cents each (1.42) + 6 remainder cents
    expect(res.splits['1']).toBe(1.43);
    expect(res.splits['6']).toBe(1.43);
    expect(res.splits['7']).toBe(1.42);
  });

  test('calculateExactSplit validates exact matches and rejects discrepancies', () => {
    const valid = calculateExactSplit(50, {
      'a@test.com': 20,
      'b@test.com': 30,
    });
    expect(valid.isValid).toBe(true);
    expect(valid.splits['a@test.com']).toBe(20);

    const invalid = calculateExactSplit(50, {
      'a@test.com': 20,
      'b@test.com': 29.5,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.difference).toBe(0.5);
  });

  test('calculatePercentageSplit calculates and conserves pennies', () => {
    // 33.33%, 33.33%, 33.34% of $100
    const res = calculatePercentageSplit(100, {
      'a@test.com': 33.33,
      'b@test.com': 33.33,
      'c@test.com': 33.34,
    });
    expect(res.isValid).toBe(true);
    const sum = Object.values(res.splits).reduce((a, b) => a + b, 0);
    expect(roundToCents(sum)).toBe(100);

    // Invalid percentages (don't sum to 100)
    const invalid = calculatePercentageSplit(100, {
      'a@test.com': 50,
      'b@test.com': 40,
    });
    expect(invalid.isValid).toBe(false);
  });

  test('calculateSharesSplit calculates weighted proportions correctly', () => {
    // Alice 2 shares, Bob 1 share of $90 -> Alice $60, Bob $30
    const res = calculateSharesSplit(90, {
      'alice@test.com': 2,
      'bob@test.com': 1,
    });
    expect(res.isValid).toBe(true);
    expect(res.splits['alice@test.com']).toBe(60);
    expect(res.splits['bob@test.com']).toBe(30);

    // Uneven shares with penny rounding: $100 with shares 1, 1, 1 -> 33.34, 33.33, 33.33
    const uneven = calculateSharesSplit(100, {
      'a@test.com': 1,
      'b@test.com': 1,
      'c@test.com': 1,
    });
    expect(uneven.isValid).toBe(true);
    const sum = Object.values(uneven.splits).reduce((a, b) => a + b, 0);
    expect(roundToCents(sum)).toBe(100);
  });

  test('calculateSharesSplit supports decimal shares and zero shares', () => {
    // Decimal shares: 0.5 and 1.5 of $100 -> $25 and $75
    const decimals = calculateSharesSplit(100, {
      'alice@test.com': 0.5,
      'bob@test.com': 1.5,
    });
    expect(decimals.isValid).toBe(true);
    expect(decimals.splits['alice@test.com']).toBe(25);
    expect(decimals.splits['bob@test.com']).toBe(75);

    // Uneven decimal shares with penny conservation: 0.33 and 0.67 of $10
    const unevenDecimals = calculateSharesSplit(10, {
      'alice@test.com': 0.33,
      'bob@test.com': 0.67,
    });
    expect(unevenDecimals.isValid).toBe(true);
    expect(unevenDecimals.splits['alice@test.com']).toBe(3.3);
    expect(unevenDecimals.splits['bob@test.com']).toBe(6.7);
    expect(roundToCents(unevenDecimals.splits['alice@test.com'] + unevenDecimals.splits['bob@test.com'])).toBe(10);

    // Zero shares: Alice 0 shares gets $0, Bob & Charlie split $90
    const withZero = calculateSharesSplit(90, {
      'alice@test.com': 0,
      'bob@test.com': 1,
      'charlie@test.com': 2,
    });
    expect(withZero.isValid).toBe(true);
    expect(withZero.splits['alice@test.com']).toBe(0);
    expect(withZero.splits['bob@test.com']).toBe(30);
    expect(withZero.splits['charlie@test.com']).toBe(60);

    // All zero shares fails validation
    const allZero = calculateSharesSplit(50, {
      'alice@test.com': 0,
      'bob@test.com': 0,
    });
    expect(allZero.isValid).toBe(false);
    expect(allZero.error).toBe('Total shares must be greater than zero');

    // Negative shares fails validation
    const negative = calculateSharesSplit(50, {
      'alice@test.com': -0.5,
      'bob@test.com': 1.5,
    });
    expect(negative.isValid).toBe(false);
    expect(negative.error).toBe('Shares must be non-negative numbers');
  });

  test('validatePaidBy verifies multi-payer total against expense amount', () => {
    const valid = validatePaidBy(150, {
      'alice@test.com': 100,
      'bob@test.com': 50,
    });
    expect(valid.isValid).toBe(true);

    const invalid = validatePaidBy(150, {
      'alice@test.com': 100,
      'bob@test.com': 40,
    });
    expect(invalid.isValid).toBe(false);
  });
});
