import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleOnline = () => {
      setShowRestored(true);
      timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
    };

    const handleOffline = () => {
      clearTimeout(timer);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
