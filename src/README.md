# Source (`src`)

## Overview
Main frontend application codebase for Spread-Spends. Implements a 100% client-side expense sharing Progressive Web App powered by Google Sheets and Google Drive, with offline persistence and zero external notification services.

## Local Interface & Invariants
- `App()`: Root React application component wrapping the application with `ThemeProvider`, `QueryClientProvider`, and `SpreadSpendsInner`.
- `main.tsx`: Application DOM entrypoint registering the Service Worker and mounting `App` into `#root`.
- Invariants:
  - Global query client disables automatic window refocus refetching (`refetchOnWindowFocus: false`) and limits query retries to 1.
  - PWA service worker is registered eagerly at bootstrap via `registerServiceWorker()`.

## Subdirectories & System Boundaries
- [Components](./components/README.md): Design system primitives, authentication modals, group headers, and PWA dialogs.
- [Constants](./constants/README.md): Static expense category metadata, color codes, and Tailwind utility classes.
- [Context](./context/README.md): Application theme context provider managing light, dark, and system themes.
- [Core](./core/README.md): Domain financial calculation algorithms, debt simplification, and Google Sheets tabular serialization.
- [Hooks](./hooks/README.md): React state, optimistic data queries, real-time sync, and mobile gesture hooks.
- [Pages](./pages/README.md): Top-level application route views (`groups` dashboard and `group` detail workspace).
- [Router](./router/README.md): Lightweight hash-based client-side router synchronizing with `window.location.hash`.
- [Services](./services/README.md): Google API clients (Drive, Sheets), and IndexedDB persistence.
- [Types](./types/README.md): TypeScript domain interfaces, balance models, and Google API ambient declarations.

## Verification
- Run: `bun test`
