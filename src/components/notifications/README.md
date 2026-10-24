# Notifications Components

## Overview
Web push notification settings and sheet synchronization modal, providing permission management, status badges, and manual sync triggers.

## Interface
- `NotificationSettingsModal({ isOpen, onClose, groupId, groupName, isPushEnabled, notificationPermission, isPushSupported, lastSyncTime, onEnableNotifications, onSendTestNotification, onManualSync }: NotificationSettingsModalProps): JSX.Element`
- `NotificationSettingsModalProps`

## Invariants
- Displays distinct badge states (Active, Blocked, Disabled) based on `isPushEnabled` and `notificationPermission`.
- Hides push notification activation button if push notifications are unsupported or denied in browser site settings.

## Side Effects
- Invokes browser push notification permission request and registration via `onEnableNotifications`.
- Triggers immediate Google Sheets data refresh via `onManualSync`.
- Schedules auto-dismissal timeout for sync feedback banner.

## Verification
- Run: `bun test`
