export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for immediate updates
          reg.update().catch(() => {});
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      doRegister();
    } else {
      window.addEventListener('load', doRegister);
    }
  }
}
