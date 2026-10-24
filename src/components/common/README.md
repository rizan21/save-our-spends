# Common Components

## Overview
Reusable foundational design system primitives including buttons, modal dialogs, navigation headers, avatars, theme toggles, badges, category icons, and crash recovery error boundaries.

## Interface
- `Badge({ children, variant, className }: BadgeProps): JSX.Element`
- `Button({ children, className, variant, size, isLoading, disabled, ...props }: ButtonProps): JSX.Element`
- `CategoryIcon({ category, className, size }: CategoryIconProps): JSX.Element`
- `ErrorBoundary`: Class component catching runtime render errors with hash reset recovery.
- `Modal({ isOpen, onClose, title, description, children, maxWidth, closeOnBack, showCloseButton }: ModalProps): JSX.Element | null`
- `Navbar({ user, onLogin, onLogout, onOpenEditProfile, showInstallButton, onOpenInstall }: NavbarProps): JSX.Element`
- `ThemeToggle({ className, size }: ThemeToggleProps): JSX.Element`
- `UserAvatar({ name, picture, size, className }: UserAvatarProps): JSX.Element`

## Invariants
- `Modal` locks `document.body.style.overflow` to `'hidden'` while mounted and intercepts Escape key and browser back button navigation.
- `ErrorBoundary` catches unhandled descendant rendering failures and resets `window.location.hash` upon user recovery.
- `UserAvatar` falls back to deterministic initials and background color hashing if profile picture URL is absent or fails to load.
- `Button` disables click interaction and displays an animated SVG spinner when `isLoading` or `disabled` is true.

## Side Effects
- Mutates DOM `document.body.style.overflow` and attaches global keydown window event listeners in `Modal`.
- Pushes modal navigation history to `window.history` via `pushModal`.
- Mutates `window.location.hash` on `ErrorBoundary` reset.
- Toggles light/dark theme class and persists preference to local storage via `ThemeToggle`.

## Verification
- Run: `bun test`
