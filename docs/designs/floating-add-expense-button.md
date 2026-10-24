# Omnipresent Floating Action Button (FAB) for Group Detail Screen

*   **Author:** Spread-Spends Engineering
*   **Status:** Proposed
*   **Date:** 2026-10-24

--------------------------------------------------------------------------------

## Overview

This design introduces a permanently visible Floating Action Button (FAB) anchored to the bottom-right viewport on the [GroupDetailPage](file:///home/zz/Projects/Spread-Spends/src/pages/group/GroupDetailPage.tsx) across all four group tabs (`overview`, `expenses`, `balances`, `settings`). The button renders across all viewport sizes (mobile and desktop) to provide immediate one-tap expense logging regardless of scroll depth, coexisting permanently alongside the existing header button in [GroupHeader.tsx](file:///home/zz/Projects/Spread-Spends/src/components/groups/GroupHeader.tsx) and featuring an accessible hover tooltip on desktop devices.

## The Problem

Logging transactions is the primary operational interaction in Spread-Spends. On mobile viewports (<640px), reaching the header "Add Expense" button requires awkward top-of-screen thumb stretches. On desktop viewports, long transaction lists or balances tables require significant reverse scrolling back to the top header to record an expense.

To solve this across all devices without introducing layout conflicts:
1. **Ergonomic Access:** A fixed bottom-right circular button (`bottom-6 right-6 sm:bottom-8 sm:right-8`) provides immediate thumb reach on mobile and instant click access on desktop without scrolling back to the top.
2. **Desktop Clarity:** On mouse-driven desktop displays, the FAB features a lightweight, non-intrusive tooltip (`Add expense`) on hover to clarify its action without adding visual clutter.
3. **Occlusion Prevention:** A universal bottom clearance buffer (`pb-20 sm:pb-24` with `env(safe-area-inset-bottom)`) guarantees that the bottom-most list items in transaction streams, member cards, or settlement buttons are never obstructed by the floating button.

## Goals

*   **Universal Ergonomics & Access:** Provide permanent bottom-right access to "Add Expense" on all devices and screen sizes.
*   **Cross-Tab Continuity:** Maintain button presence across all four group views (`overview`, `expenses`, `balances`, `settings`).
*   **Desktop Affordance:** Provide an accessible, non-interfering tooltip on desktop pointer hover (`hidden sm:group-hover:flex`).
*   **Complete Occlusion Immunity:** Ensure the bottom-most elements on any tab can scroll completely clear of the FAB using responsive bottom padding (`pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-24`).
*   **Gesture & Layering Isolation:** Mount the FAB outside swipeable tab wrappers to prevent touch drag interference during tab sliding.

## Non-Goals

*   **Speed-Dial Actions:** No expandable multi-button speed dial. The button remains strictly single-purpose for logging expenses.
*   **Global Outside-Group Presence:** The FAB will not appear on the root `GroupsPage` where no group context exists.
*   **Scroll-Driven Retraction:** The button will not hide or slide away during scrolling.

## Open Questions

*   None currently identified.

## Critical User Journeys (CUJs)

### CUJ 1: One-Handed Mobile Expense Logging

*   **Given**: A user is viewing an active group on a mobile smartphone with a view of the `expenses` tab.
*   **When**: The user taps the floating `+` button in the bottom-right corner.
*   **Then**: The existing `AddExpenseModal` opens immediately without requiring scroll to top.

### CUJ 2: Desktop Long-List Expense Entry with Hover Tooltip

*   **Given**: A desktop user has scrolled down through 50+ transactions in a group.
*   **When**: The user hovers the cursor over the bottom-right FAB.
*   **Then**: A tooltip appears to the left reading "Add expense" without capturing pointer events. Clicking the button opens `AddExpenseModal` immediately.

### CUJ 3: Inspection of Bottom-Most Transaction without Blockage

*   **Given**: A user is viewing a long transaction list on mobile or desktop.
*   **When**: The user scrolls to the absolute bottom of the page.
*   **Then**: Due to bottom clearance padding, the final transaction item and its edit/delete triggers rest entirely above the FAB footprint.

### CUJ 4: Tab Swiping Across Group Sections

*   **Given**: A mobile user swipes horizontally across tabs from `overview` to `expenses`.
*   **When**: The swipe gesture occurs.
*   **Then**: The FAB remains anchored at its fixed viewport coordinates and does not move with tab slide animations.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### Architectural Overview

The implementation creates a reusable `FloatingActionButton` component and mounts it within `GroupDetailPage.tsx`, linking directly to the existing modal state handlers.

```
+------------------------------------------------------------------------+
|                                Viewport                                |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  | Navbar (sticky, z-30)                                            |  |
|  +------------------------------------------------------------------+  |
|  | GroupDetailPage                                                  |  |
|  |   +-----------------------------------------------------------+  |  |
|  |   | GroupHeader (static header "Add Expense" button)          |  |  |
|  |   +-----------------------------------------------------------+  |  |
|  |   | GroupTabsContainer (horizontal swipe translations)        |  |  |
|  |   |   - Active Section (pb-[calc(5rem+env(safe-area-inset...))|  |  |
|  |   +-----------------------------------------------------------+  |  |
|  |                                                                  |  |
|  |   [ Tooltip ] [ FAB (fixed, z-40) ] <--- Outside Swipe Container |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  [ AddExpenseModal (fixed overlay, z-50) ] <--- Overlays FAB & Page    |
+------------------------------------------------------------------------+
```

### 1. Component Design: `FloatingActionButton.tsx`

Created at `src/components/common/FloatingActionButton.tsx`.

*   **Props Contract:**
    *   `onClick: () => void`: Trigger function.
    *   `ariaLabel?: string`: Accessible text name (defaults to `"Add expense"`).
    *   `tooltipText?: string`: Tooltip text on desktop hover (defaults to `"Add expense"`).
    *   `icon?: React.ComponentType<{ className?: string }>`: Lucide icon component (defaults to `Plus`).
    *   `className?: string`: Optional styling overrides.
    *   `disabled?: boolean`: Disabled state toggle.
*   **Styling & Positioning:**
    *   Fixed container: `fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 bottom-[calc(1.5rem+env(safe-area-inset-bottom))]`.
    *   Button target: `w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/40 hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all duration-150 cursor-pointer`.
*   **Desktop Tooltip Affordance:**
    *   Container: `relative group`.
    *   Tooltip element: positioned to the left of the button (`absolute right-full mr-3 top-1/2 -translate-y-1/2`).
    *   Visibility: `hidden sm:group-hover:flex` (strictly suppressed on touch/mobile devices; shown on pointer hover).
    *   Non-Interference: `pointer-events-none select-none` with `role="tooltip"`.
    *   Styling: `px-2.5 py-1 text-xs font-semibold text-white bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-xs rounded-lg shadow-md whitespace-nowrap`.

### 2. Integration into `GroupDetailPage.tsx`

*   **DOM Placement:**
    *   Mounted as a sibling to `GroupTabsContainer` and modals inside `GroupDetailPage.tsx`.
    *   Placement outside `GroupTabsContainer` ensures it remains unaffected by swipe gesture translation (`dragOffset`).
*   **Action Binding:**
    ```tsx
    <FloatingActionButton
      onClick={() => {
        setEditingExpense(null);
        setIsAddExpenseOpen(true);
      }}
      ariaLabel="Add expense"
      tooltipText="Add expense"
    />
    ```
*   **Z-Index & Modal Layering:**
    *   Modals in `Modal.tsx` render at `z-50`. The FAB renders at `z-40`, so active modals overlay the FAB.
    *   Pass `tabIndex={isAnyModalOpen ? -1 : 0}` and `aria-hidden={isAnyModalOpen}` to prevent keyboard focus retention behind open dialogs.

### 3. Scroll Clearance & Padding Architecture

*   Apply `pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-24` to `GroupTabsContainer` in `GroupDetailPage.tsx`.
*   Ensures that on both mobile and desktop screens, lists have sufficient vertical scroll space so the bottom-most items can scroll entirely clear of the FAB footprint.

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative 1: Omnipresent FAB on Both Desktop and Mobile (Selected)

*   **Pros**: Instant access to expense creation from any scroll position across all screen sizes. Solves reverse-scrolling fatigue on long desktop transaction tables.
*   **Cons**: Coexists with the header button on desktop viewports.
*   **Reason for Selection**: Selected per user preference. Dual presence is mitigated by keeping the header button as the primary top CTA and treating the FAB as a persistent floating trigger with an unobtrusive hover tooltip.

### Alternative 2: Mobile-Only FAB (`sm:hidden`)

*   **Pros**: Avoids duplicate buttons on desktop screens.
*   **Cons**: Desktop users on long transaction lists must scroll all the way back to the top header to log an expense.
*   **Reason for Rejection**: Deprives desktop users of bottom-anchored quick access on long pages.

### Alternative 3: Scroll-Driven FAB Visibility (IntersectionObserver)

*   **Pros**: Hides FAB when header button is visible.
*   **Cons**: Scroll jitter, observer recalculation overhead, and unpredictable button pop-in.
*   **Reason for Rejection**: Unnecessary complexity compared to consistent, predictable visibility.

### Alternative 4: Multi-Action Speed-Dial Menu

*   **Pros**: Surfaces secondary actions from a single touch target.
*   **Cons**: Adds a required second tap to the primary action (>80% of volume).
*   **Reason for Rejection**: Slows down the core flow of fast expense logging.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Security & Privacy:** None. The component is purely a client-side presentational trigger invoking existing modal flows.
*   **Performance & Rendering:** Zero runtime listeners or scroll event recalculations. Pure CSS layout and CSS pseudo-classes (`group-hover`).
*   **Accessibility Standards:** Conforms to WCAG 2.1 AA: 56px touch target exceeds the 44×44px minimum, visible high-contrast focus rings, `aria-label="Add expense"`, and `role="tooltip"` with pointer-events disabled.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Target Files to Create/Modify

#### 1. `package.json` (Modify)

*   **Type / Scope**: Dependency Configuration.
*   **Proposed Changes**:
    *   Add `@testing-library/react` and `happy-dom` to `devDependencies` to enable React DOM component assertions inside `bun test`.

#### 2. `src/components/common/FloatingActionButton.tsx` (Create)

*   **Type / Scope**: TypeScript React Component.
*   **Proposed Responsibilities**:
    *   Expose `FloatingActionButtonProps` interface accepting `onClick: () => void`, optional `ariaLabel?: string`, `tooltipText?: string`, `icon?: React.ComponentType<{ className?: string }>`, `className?: string`, `disabled?: boolean`, `tabIndex?: number`, and `'aria-hidden'?: boolean`.
    *   Render a defensive `<button type="button" ...>` with circular 56px sizing (`w-14 h-14 rounded-full`), emerald background (`bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white`), and high-contrast focus rings.
    *   Render default Lucide `Plus` icon with explicit dimensions: `<Icon className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />`.
    *   Render a desktop-only CSS hover tooltip (`hidden sm:group-hover:flex`) positioned to the left (`right-full mr-3 top-1/2 -translate-y-1/2`) with `role="tooltip"` and `pointer-events-none`.
    *   Enforce full viewport anchoring: `fixed right-6 sm:right-8 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] z-40`.

#### 3. `src/components/common/README.md` (Modify)

*   **Type / Scope**: Markdown Component Directory Documentation.
*   **Proposed Responsibilities**:
    *   Append `FloatingActionButton` under `## Interface`: `- FloatingActionButton(props: FloatingActionButtonProps): JSX.Element`.
    *   Append under `## Invariants`: `Remains fixed at viewport bottom-right outside swipe containers; suppressed from tab order and accessibility tree (tabIndex=-1, aria-hidden=true) when any modal dialog is mounted.`

#### 4. `src/pages/group/GroupDetailPage.tsx` (Modify)

*   **Type / Scope**: React Page Orchestrator.
*   **Proposed Responsibilities**:
    *   Import `FloatingActionButton` from `../../components/common/FloatingActionButton`.
    *   Render `<FloatingActionButton>` adjacent to `GroupTabsContainer` and modals.
    *   Wire `onClick` to reset `editingExpense` to `null` and set `isAddExpenseOpen` to `true`.
    *   Pass `tabIndex={isAnyModalOpen ? -1 : 0}` and `aria-hidden={isAnyModalOpen}`.
    *   Update `GroupTabsContainer` className to include `pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-24` ensuring complete bottom scroll clearance.

#### 5. `src/test/FloatingActionButton.test.tsx` (Create)

*   **Type / Scope**: `bun:test` with `@testing-library/react` Component Test.
*   **Proposed Responsibilities**:
    *   Verify the button renders with default Lucide `Plus` icon, `type="button"`, and default `aria-label="Add expense"`.
    *   Verify clicking triggers the `onClick` callback.
    *   Verify desktop tooltip text renders with `role="tooltip"` and `pointer-events-none`.
    *   Verify `disabled`, `tabIndex`, and `aria-hidden` attribute propagation.

### Verification Plan

*   **Static Analysis & Linting**: Run `bun run lint` to verify code style and import hygiene.
*   **Typecheck**: Run `bun run typecheck` (`tsc -b`) to verify composite project TypeScript typings.
*   **Compilation & Build**: Run `bun run build` (`tsc -b && vite build`) to confirm production asset generation with zero errors.
*   **Unit Tests**: Run `bun run test` (`bun test`) to ensure all unit tests pass.
*   **Manual Verification Across CUJs**:
    *   Verify CUJ 1 on simulated mobile viewport (375px width): FAB sits at bottom right, taps cleanly trigger `AddExpenseModal`.
    *   Verify CUJ 2 on desktop viewport (1280px width): FAB sits at bottom right, hovering reveals "Add expense" tooltip, clicking triggers `AddExpenseModal`.
    *   Verify CUJ 3: Scroll down a long transaction list; verify bottom-most transaction is entirely clear of the FAB.
    *   Verify CUJ 4: Swipe horizontally between `overview`, `expenses`, `balances`, and `settings`; verify FAB remains static and does not slide.

--------------------------------------------------------------------------------

*Drafted with EGM*
