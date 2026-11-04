# Auth Components

## Overview
Authentication and user identity management UI components, providing Google sign-in onboarding and profile display-name editing modals.

## Interface
- `EditProfileModal({ isOpen, onClose, user, onSaveName, onResetName, onLogout, showInstallButton, onOpenInstall, onReauthorizeGoogle }: EditProfileModalProps): JSX.Element`
- `EditProfileModalProps`
- `LoginScreen({ onLogin, isLoading, error, clientId, onSaveClientId, showInstallButton, onOpenInstall }: LoginScreenProps): JSX.Element`
- `LoginScreenProps`

## Invariants
- User display name in `EditProfileModal` must be non-empty and maximum 50 characters.
- Google email and profile picture in `EditProfileModal` are immutable and displayed read-only.
- `LoginScreen` disables the Google Sign-in button when `isLoading` is true.

## Side Effects
- Registers dialog navigation history entries with `pushModal` when `EditProfileModal` opens.
- Triggers Google OAuth login flow via `onLogin` callback.
- Invokes PWA install prompt via `onOpenInstall`.

## Verification
- Run: `bun test`
