# Stage 9 Implementation Readiness Test Report

**Target:** `docs/designs/floating-add-expense-button.md` (`lines 180-231`)  
**Standard:** `resources/document_standards/implementation-readiness-standard.md`  
**Reviewer Lenses:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`

---

## Executive Summary
* **Total Findings:** 8
* 🔴 **Blockers:** 1
* 🟡 **Major:** 4
* 🟢 **Nits:** 3
* **Status:** **Action Required Prior to Code Implementation**

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Test Framework Mismatch (Vitest / RTL vs `bun:test`) - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** `Lines 209-217` (Section 4: `src/test/FloatingActionButton.test.tsx`)
* **Discrepancy Description**: The plan specifies creating a unit test using *"Vitest / React Testing Library Unit Test"* to verify DOM interactions (`aria-label`, click handlers, tooltip presence with `role="tooltip"`). However, inspecting `package.json` and `bun.lock` reveals that neither `vitest` nor `@testing-library/react` (nor `@testing-library/dom`, `happy-dom`, or `jsdom`) are installed. The project's test suite exclusively uses `bun:test` (e.g., `src/test/sheetSerializer.test.ts` imports from `bun:test`).
* **Rationale & Recommendation**: Executing this plan as written will immediately fail due to unresolvable imports. 
  - **Option A (Recommended if DOM testing is required):** Explicitly add `@testing-library/react` and `happy-dom` to `devDependencies` in `package.json`, and document the setup required for `bun test` to execute React component DOM tests.
  - **Option B (Zero-dependency):** Specify testing component structure using React's native JSX runtime / test utilities compatible with `bun:test`, or adjust the test specification to avoid Vitest/RTL dependencies.

---

### 2. Invalid Typecheck Command for Composite Project (`tsc --noEmit`) - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** `Line 220` (Verification Plan: Compilation & Typecheck)
* **Discrepancy Description**: Line 220 instructs running `tsc --noEmit` as an alternative to `bun run build`. However, root `tsconfig.json` is a composite project references configuration (`"files": []`, `"references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]`). In composite TypeScript setups, invoking `tsc --noEmit` without `-b` causes TypeScript error `TS6307: File is not listed within the file list of project`.
* **Rationale & Recommendation**: Align the verification instruction with the actual project script defined in `package.json` line 9 (`"typecheck": "tsc -b"`). Replace `tsc --noEmit` with `bun run typecheck` or `tsc -b`.

---

### 3. Prop Naming & HTML ARIA Attribute Inconsistency (`ariaHidden` vs `aria-hidden`) - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness` & `egm-codebase-details`
* **Affected Scope:** `Lines 188 & 206` vs `Line 135`
* **Discrepancy Description**: 
  - Line 188 defines the props contract as accepting camelCase `ariaHidden`.
  - Line 206 directs passing `ariaHidden={isAnyModalOpen}`.
  - However, in Technical Plan Architecture line 135, it states: `Pass tabIndex={isAnyModalOpen ? -1 : 0} and aria-hidden={isAnyModalOpen}`.
  - Furthermore, in standard React / DOM typing, ARIA attributes are hyphenated (`aria-hidden`), while standard HTML attributes are camelCased (`tabIndex`).
* **Rationale & Recommendation**: Introduce consistency across props contracts and JSX usage. Standardize on `aria-hidden?: boolean` in `FloatingActionButtonProps` and `<FloatingActionButton aria-hidden={isAnyModalOpen} />`.

---

### 4. Incomplete Viewport Coordinate Classes in Component Plan - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Line 191` vs `Line 108`
* **Discrepancy Description**: Line 191 only specifies: `Incorporate safe-area inset padding: bottom-[calc(1.5rem+env(safe-area-inset-bottom))]`. It omits the horizontal anchor classes (`right-6 sm:right-8`), z-index (`z-40`), and desktop vertical position (`sm:bottom-8` or `sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]`) defined in line 108. An engineer implementing strictly from the Detailed Implementation Plan (Section 1) would produce an unanchored or improperly positioned button.
* **Rationale & Recommendation**: Consolidate the full positioning specification into line 191: `fixed right-6 sm:right-8 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] z-40`.

---

### 5. Missing Component Directory Standard Sections for `README.md` - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Lines 193-198` (Section 2: `src/components/common/README.md`)
* **Discrepancy Description**: The plan states "Document `FloatingActionButton` under the common component index, detailing its purpose, props, and accessibility guidelines." However, `src/components/common/README.md` follows a rigid structure: `## Interface`, `## Invariants`, `## Side Effects`, and `## Verification`. The plan does not specify the contract additions for `Invariants` or `Interface`.
* **Rationale & Recommendation**: Specify the exact entries to be added to `src/components/common/README.md`:
  - `## Interface`: `- FloatingActionButton(props: FloatingActionButtonProps): JSX.Element`
  - `## Invariants`: `Remains fixed at viewport bottom-right outside swipe containers; suppressed from tab order and accessibility tree (tabIndex=-1, aria-hidden=true) when any dialog is mounted.`

---

### 6. Underspecified Icon Sizing and Default Fallback Props - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Lines 188-189`
* **Discrepancy Description**: The plan mentions that `icon` is optional and defaults to Lucide `Plus`, but fails to specify the icon dimension, stroke width, or whether it inherits parent text color inside the 56px (`w-14 h-14`) button.
* **Rationale & Recommendation**: Explicitly define the default icon rendering implementation: `<Icon className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />` with `Plus` from `lucide-react`.

---

### 7. Missing Defensive `type="button"` Attribute - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** `Line 189`
* **Discrepancy Description**: The plan does not mandate `type="button"` on the generated `<button>`. While currently positioned at page level in `GroupDetailPage`, buttons without explicit `type` default to `type="submit"` in HTML/React.
* **Rationale & Recommendation**: Add `type="button"` to the component responsibilities for `FloatingActionButton.tsx`.

---

### 8. Verification Command Inconsistencies - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** `Lines 220-222`
* **Discrepancy Description**: Lines 220–222 provide disjunctive CLI options (`oxlint` or `bun run lint`; `bun run build` or `tsc --noEmit`).
* **Rationale & Recommendation**: Standardize on canonical `package.json` script names:
  - Lint: `bun run lint`
  - Typecheck: `bun run typecheck`
  - Build: `bun run build`
  - Test: `bun run test`
