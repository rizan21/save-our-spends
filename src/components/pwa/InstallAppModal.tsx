import { useState } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

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

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await onTriggerInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install Spread-Spends"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setPlatformOverride('android')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedPlatform === 'ios'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iOS (Safari)</span>
          </button>
        </div>

        {/* Android View */}
        {selectedPlatform === 'android' && (
          <div className="space-y-4">
            {canPromptDirectly ? (
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 text-center space-y-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-5 h-5" />
                </div>
                <Button
                  onClick={handleInstallClick}
                  isLoading={isInstalling}
                  className="w-full gap-2 py-3 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Spread-Spends Now</span>
                </Button>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* iOS View */}
        {selectedPlatform === 'ios' && (
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
        )}
      </div>
    </Modal>
  );
}
