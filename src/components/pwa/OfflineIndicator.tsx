import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-950 px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2 border-b border-amber-600/30 sticky top-16 z-20 shadow-xs">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>Offline Mode — viewing cached groups, expenses, and balances.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2 sticky top-16 z-20 shadow-xs animate-in fade-in duration-300">
        <Wifi className="w-3.5 h-3.5 shrink-0" />
        <span>Back online — ready to sync with Google Sheets.</span>
      </div>
    );
  }

  return null;
}
