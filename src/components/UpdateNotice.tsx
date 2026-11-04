import { useEffect, useState } from 'react';

/** Let the browser activate a waiting worker only after every controlled tab closes. */
export function UpdateNotice() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const onState = () => {
      if (!disposed && installing?.state === 'installed' && navigator.serviceWorker.controller) setReady(true);
    };
    const onUpdate = () => {
      installing?.removeEventListener('statechange', onState);
      installing = registration?.installing ?? null;
      installing?.addEventListener('statechange', onState);
      onState();
    };
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then((result) => {
      if (disposed) return;
      registration = result;
      if (result.waiting && navigator.serviceWorker.controller) setReady(true);
      result.addEventListener('updatefound', onUpdate);
      if (result.installing) onUpdate();
    }).catch(() => { /* The app remains usable without offline support. */ });
    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', onUpdate);
      installing?.removeEventListener('statechange', onState);
    };
  }, []);
  return ready ? <div className="update-notice" role="status">An update is ready. Save your work, then close all app tabs and reopen the app to use it.</div> : null;
}
