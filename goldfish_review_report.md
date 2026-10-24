# Goldfish Annotated Review Report

**Status:** resolved
**Target:** `docs/designs/floating-add-expense-button.md` (`lines 180-231`)

## Prioritized Findings & AI Suggestions

### 1. Test Framework Mismatch (Vitest / RTL vs bun:test) [`egm-codebase-details`] - Severity: High
* **Affected Scope:** [Lines 209-217](docs/designs/floating-add-expense-button.md#L209-L217) (Section 4: `src/test/FloatingActionButton.test.tsx`)
* **Discrepancy Description:** The plan specifies creating a unit test using *"Vitest / React Testing Library Unit Test"* to verify DOM interactions (`aria-label`, click handlers, tooltip presence). However, `package.json` has neither `vitest` nor `@testing-library/react` installed; the project test suite exclusively runs on `bun:test`.
* **Rationale:** Executing the plan as written will result in unresolvable test imports during verification.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Explicitly add `@testing-library/react` and `happy-dom` to `devDependencies` in `package.json` as part of the plan (or document using `bun:test` with `@testing-library/react`), ensuring clean DOM assertions for the new component.
* **Proposed Edit:**
  * Location: `docs/designs/floating-add-expense-button.md` Section 4 & Target Files
  * Change: Add `package.json` to Target Files to install `@testing-library/react` and `happy-dom` for component testing under `bun test`, and update Section 4 to specify `bun:test` with React Testing Library.

### 2. Invalid Typecheck Command for Composite Project (`tsc --noEmit`) [`egm-codebase-details`] - Severity: Medium
* **Affected Scope:** [Line 220](docs/designs/floating-add-expense-button.md#L220) (Verification Plan: Compilation & Typecheck)
* **Discrepancy Description:** Instructs running `tsc --noEmit` as an alternative to `bun run build`, but root `tsconfig.json` is a composite project configuration requiring `-b`.
* **Rationale:** Invoking `tsc --noEmit` fails in composite TypeScript setups with TS6307.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Align with `package.json` line 9 (`"typecheck": "tsc -b"`).
* **Proposed Edit:**
  * Location: Line 220
  * Change: Replace `tsc --noEmit` with `bun run typecheck` (`tsc -b`).

### 3. Prop Naming & HTML ARIA Attribute Inconsistency (`ariaHidden` vs `aria-hidden`) [`egm-implementation-readiness`] - Severity: Medium
* **Affected Scope:** [Lines 188 & 206](docs/designs/floating-add-expense-button.md#L188) vs [Line 135](docs/designs/floating-add-expense-button.md#L135)
* **Discrepancy Description:** Inconsistent naming between camelCase `ariaHidden` in props contract and standard hyphenated `aria-hidden` in React DOM attributes.
* **Rationale:** Standard React TypeScript DOM typings use `aria-hidden?: boolean`.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Standardize on standard React DOM naming convention (`aria-hidden?: boolean`).
* **Proposed Edit:**
  * Location: Lines 188 & 206
  * Change: Standardize to `'aria-hidden'?: boolean` in `FloatingActionButtonProps` and `<FloatingActionButton aria-hidden={isAnyModalOpen} />`.

### 4. Incomplete Viewport Coordinate Classes in Component Plan [`egm-implementation-readiness`] - Severity: Medium
* **Affected Scope:** [Line 191](docs/designs/floating-add-expense-button.md#L191)
* **Discrepancy Description:** Omits horizontal anchoring (`right-6 sm:right-8`), z-index (`z-40`), and desktop vertical position.
* **Rationale:** A developer following Section 1 strictly would miss horizontal coordinates and z-index.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Provide the consolidated Tailwind layout class string directly in the implementation specification.
* **Proposed Edit:**
  * Location: Line 191
  * Change: Replace with: `fixed right-6 sm:right-8 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] z-40`.

### 5. Missing Component Directory Standard Sections for `README.md` [`egm-implementation-readiness`] - Severity: Medium
* **Affected Scope:** [Lines 193-198](docs/designs/floating-add-expense-button.md#L193-L198)
* **Discrepancy Description:** Lacks the required `## Interface` and `## Invariants` additions mandated by `src/components/common/README.md`.
* **Rationale:** Subdirectory READMEs in Spread-Spends adhere to rigid structural standards.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Provide the verbatim Markdown additions for `src/components/common/README.md`.
* **Proposed Edit:**
  * Location: Lines 193-198
  * Change: Explicitly specify adding `FloatingActionButton` under `## Interface` and documenting its z-index layering and modal suppression under `## Invariants`.

### 6. Underspecified Icon Sizing and Default Fallback Props [`egm-implementation-readiness`] - Severity: Low
* **Affected Scope:** [Lines 188-189](docs/designs/floating-add-expense-button.md#L188-L189)
* **Discrepancy Description:** Icon dimensions and stroke width are omitted from the detailed component responsibilities.
* **Rationale:** Ensures visual parity with the 56px touch target.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Explicitly specify `<Icon className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />` with Lucide `Plus`.
* **Proposed Edit:**
  * Location: Lines 188-189
  * Change: Add explicit icon styling `<Icon className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />`.

### 7. Missing Defensive `type="button"` Attribute [`egm-codebase-details`] - Severity: Low
* **Affected Scope:** [Line 189](docs/designs/floating-add-expense-button.md#L189)
* **Discrepancy Description:** Does not mandate `type="button"`, which can cause default form submission behavior if rendered inside forms.
* **Rationale:** Defensive HTML standard for non-submit buttons.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Specify `type="button"` on the `<button>` element.
* **Proposed Edit:**
  * Location: Line 189
  * Change: Add `type="button"` to button attributes.

### 8. Verification Command Inconsistencies [`egm-style`] - Severity: Low
* **Affected Scope:** [Lines 220-222](docs/designs/floating-add-expense-button.md#L220-L222)
* **Discrepancy Description:** Uses inconsistent or disjunctive CLI strings.
* **Rationale:** Standardizing on `package.json` scripts reduces ambiguity.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Specify the exact commands from `package.json`: `bun run lint`, `bun run typecheck`, `bun run build`, and `bun run test`.
* **Proposed Edit:**
  * Location: Lines 220-222
  * Change: Use canonical script names.
