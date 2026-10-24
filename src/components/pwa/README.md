# PWA Components

## Overview
Progressive Web App (PWA) utilities, offering responsive installation dialogs for Android and iOS and real-time offline status indicators.

## Interface
- `InstallAppModal({ isOpen, onClose, isIOS, isAndroid, canPromptDirectly, onTriggerInstall }: InstallAppModalProps): JSX.Element`
- `InstallAppModalProps`
- `OfflineIndicator(): JSX.Element | null`

## Invariants
- `InstallAppModal` defaults to the user's detected mobile OS platform while permitting tab switching between Android and iOS instructions.
- `OfflineIndicator` displays an amber warning bar while `isOnline` is false, and displays a temporary emerald 'Back online' banner for 3.5 seconds upon reconnection.

## Side Effects
- `InstallAppModal` triggers native PWA install prompt via `onTriggerInstall`.
- `OfflineIndicator` sets and clears `setTimeout` timers for reconnection feedback dismissal.

## Verification
- Run: `bun test`
