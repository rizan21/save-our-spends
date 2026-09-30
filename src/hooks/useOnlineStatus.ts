import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    () => true
  );
  return { isOnline };
}
