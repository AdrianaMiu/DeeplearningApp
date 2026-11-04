import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render(element: HTMLElement, options: Record<string, unknown>): string;
      remove(widgetId: string): void;
    };
  }
}

export function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  useEffect(() => {
    let active = true;
    let widgetId: string | undefined;
    const fail = () => {
      if (!active) return;
      active = false;
      onToken('');
      setStatus('failed');
    };
    const renew = () => {
      if (!active) return;
      // Retire callbacks immediately, before React runs the effect cleanup.
      active = false;
      onToken('');
      setStatus('pending');
      setGeneration((value) => value + 1);
    };
    const render = () => {
      if (!active || widgetId !== undefined || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (!active) return;
          onToken(token);
          setStatus('verified');
        },
        'expired-callback': renew,
        'timeout-callback': renew,
        'error-callback': fail,
        theme: 'light',
      });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    const scriptFailed = () => {
      if (!active) return;
      script?.remove();
      fail();
    };
    if (window.turnstile) render();
    else {
      const needsScript = !script;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = 'true';
      }
      script.addEventListener('load', render, { once: true });
      script.addEventListener('error', scriptFailed, { once: true });
      if (needsScript) document.head.append(script);
    }
    return () => {
      active = false;
      script?.removeEventListener('load', render);
      script?.removeEventListener('error', scriptFailed);
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [generation, onToken, siteKey]);

  return <div><div ref={container} aria-label="Human verification" />
    {status === 'pending' && <p role="status">Human verification is in progress. Complete the challenge to ask the tutor.</p>}
    {status === 'failed' && <><p role="status">Human verification failed. Retry verification to ask the tutor.</p><button className="button button--quiet" onClick={() => {
      setStatus('pending');
      setGeneration((value) => value + 1);
    }}>Retry verification</button></>}
  </div>;
}
