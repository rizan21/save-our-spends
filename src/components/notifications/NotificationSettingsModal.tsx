import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Bell, BellOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  groupName: string;
  isPushEnabled: boolean;
  notificationPermission: NotificationPermission;
  isPushSupported: boolean;
  lastSyncTime: Date;
  onEnableNotifications: () => Promise<boolean>;
  onSendTestNotification: () => Promise<boolean>;
  onManualSync: () => void;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  isPushEnabled,
  notificationPermission,
  isPushSupported,
  lastSyncTime,
  onEnableNotifications,
  onManualSync,
}: NotificationSettingsModalProps) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleEnable = async () => {
    setIsSubscribing(true);
    setTestResult(null);
    try {
      const ok = await onEnableNotifications();
      if (ok) {
        setTestResult('Push notifications successfully enabled!');
      } else if (Notification.permission === 'denied') {
        setTestResult('Notification permission was blocked in your browser. Please allow notifications in site settings.');
      } else {
        setTestResult('Could not enable push notifications. Check network connection.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSyncNow = () => {
    onManualSync();
    setTestResult('Sheet synchronized with latest data!');
    setTimeout(() => {
      setTestResult((cur) => (cur === 'Sheet synchronized with latest data!' ? null : cur));
    }, 3000);
  };

  const isDenied = notificationPermission === 'denied';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications & Sync">
      <div className="space-y-4 text-sm">
        {/* Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPushEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : isDenied
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isPushEnabled ? (
                <Bell className="w-5 h-5 fill-emerald-500/20" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {isPushEnabled
                  ? 'Notifications Active'
                  : isDenied
                  ? 'Notifications Blocked'
                  : 'Notifications Off'}
              </h4>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
              isPushEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : isDenied
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isPushEnabled ? 'Active' : isDenied ? 'Blocked' : 'Disabled'}
          </span>
        </div>

        {/* Browser Permission Warning if blocked */}
        {isDenied && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notifications blocked in browser</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                To enable notifications, click the site settings / lock icon in your browser's address bar and set Notifications to "Allow", then reload the page.
              </p>
            </div>
          </div>
        )}

        {/* Result Feedback Banner */}
        {testResult && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
          {!isPushEnabled && isPushSupported && !isDenied && (
            <Button
              onClick={handleEnable}
              isLoading={isSubscribing}
              className="w-full justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Web Push Notifications</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleSyncNow}
            className="w-full justify-center gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Sheet Now</span>
          </Button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Last sheet sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
    </Modal>
  );
}
