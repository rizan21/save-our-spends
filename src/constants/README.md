# Constants

## Overview
Defines static application-level constants and metadata dictionaries for Spread-Spends. Specifically, it exports metadata definitions and visual styling mappings for all supported expense categories used across charts, summary cards, and breakdowns.

## Interface
- `CategoryMetadata`: Structure defining `name` (string), `hex` (color code string), and `barClass` (Tailwind CSS color class) for category rendering.
- `CATEGORY_META`: Record mapping each `ExpenseCategory` to its corresponding `CategoryMetadata`.

## Invariants
- Exhaustive coverage: Every `ExpenseCategory` variant (`'food'`, `'transport'`, `'lodging'`, `'entertainment'`, `'groceries'`, `'utilities'`, `'shopping'`, `'general'`) is mapped in `CATEGORY_META`.
- Color consistency: Each hex color code and Tailwind background class strictly align for theme visual consistency.
- Immutability: Category metadata values are static, pure declarations that remain constant throughout the application lifecycle.

## Side Effects
- None: Pure constant data structures without runtime state mutation, I/O, or side effects.

## Verification
- Run: `bun test`
