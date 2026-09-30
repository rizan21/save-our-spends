import { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share,
  PlusSquare,
  WifiOff,
  Zap,
  CheckCircle2,
  Smartphone,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { Button } from '../common/Button';

export interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  canPromptDirectly: boolean;
  onTriggerInstall: () => Promise<boolean>;
}

export function InstallAppModal({
  isOpen,
  onClose,
  isIOS,
  canPromptDirectly,
  onTriggerInstall,
}: InstallAppModalProps) {
  // Allow user to manually toggle between iOS and Android guide tabs
  const [platformOverride, setPlatformOverride] = useState<'ios' | 'android' | null>(null);
  const selectedPlatform = platformOverride ?? (isIOS ? 'ios' : 'android');

  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await onTriggerInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                <WifiOff className="w-3 h-3" />
                Offline Viewing Ready
              </span>
              <h2 id="install-modal-title" className="text-xl font-bold tracking-tight text-white mt-1">
                Install Spread-Spends
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed">
            Install the web app on your home screen to view your expense groups, balances, and debts anytime — even without internet.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Installation Guide
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setPlatformOverride('android')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPlatform === 'android'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatformOverride('ios')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPlatform === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS / iPhone</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto">
          {/* Key Offline Perks */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex flex-col items-center">
              <WifiOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Offline</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">View expenses anywhere</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 flex flex-col items-center">
              <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-1" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Load</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Opens in fullscreen</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
              <CheckCircle2 className="w-5 h-5 text-slate-700 dark:text-slate-300 mb-1" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto Sync</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Syncs when reconnected</span>
            </div>
          </div>

          {/* Android View */}
          {selectedPlatform === 'android' && (
            <div className="space-y-4">
              {canPromptDirectly ? (
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      One-Tap Install Ready
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Your browser is ready to add Spread-Spends directly to your home screen.
                    </p>
                  </div>
                  <Button
                    onClick={handleInstallClick}
                    isLoading={isInstalling}
                    className="w-full gap-2 py-3 shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Android</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    How to install on Android Chrome / Edge / Firefox
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="leading-snug">
                        Tap the browser menu (
                        <MoreVertical className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-300 -mt-0.5" />
                        <strong> three dots</strong>) in the top-right corner of your browser.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="leading-snug">
                        Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div className="leading-snug">
                        Confirm <strong>Install</strong> to add the app icon for instant offline access.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* iOS View */}
          {selectedPlatform === 'ios' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                How to install on iPhone & iPad (Safari)
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/60">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="leading-snug">
                    Open in <strong>Safari</strong> and tap the <strong>Share</strong> button (
                    <Share className="w-3.5 h-3.5 inline text-sky-600 dark:text-sky-400 -mt-0.5" />
                    ) in the toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/60">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="leading-snug">
                    Scroll down the share sheet and tap{' '}
                    <strong>
                      <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-300 -mt-0.5" /> Add to
                      Home Screen
                    </strong>
                    .
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/60">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="leading-snug">
                    Tap <strong>Add</strong> in the top-right corner. The app will appear on your home
                    screen!
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  Once installed, launch Spread-Spends directly from your home screen for full offline viewing.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
            Maybe later
          </Button>

          <Button
            size="sm"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
