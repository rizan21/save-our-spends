import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'spread_spends_pwa_dismissed_at';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );
  });

  const [isAndroid] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /android/.test(window.navigator.userAgent.toLowerCase());
  });

  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandalone) {
      return;
    }

    // Intercept Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto show prompt if eligible on Android or iOS and not recently dismissed
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    const isSnoozed = dismissedAt ? Date.now() - parseInt(dismissedAt, 10) < SNOOZE_MS : false;

    if (!isSnoozed && (isIOS || isAndroid)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, isIOS, isAndroid]);

  const openInstallModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsStandalone(true);
        setDeferredPrompt(null);
        setIsOpen(false);
        return true;
      }
    } catch (err) {
      console.error('Failed to execute install prompt:', err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    isOpen,
    isIOS,
    isAndroid,
    isStandalone,
    isInstalled,
    canPromptDirectly: !!deferredPrompt,
    openInstallModal,
    closeInstallModal,
    triggerInstall,
  };
}
