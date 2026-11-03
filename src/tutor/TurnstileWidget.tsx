import { useEffect, useRef } from 'react';

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
  useEffect(() => {
    let widgetId: string | undefined;
    const render = () => {
      if (container.current && window.turnstile) {
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''), theme: 'light',
        });
      }
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing) { if (window.turnstile) render(); else existing.addEventListener('load', render, { once: true }); }
    else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true; script.defer = true; script.dataset.turnstile = 'true';
      script.addEventListener('load', render, { once: true }); document.head.append(script);
    }
    return () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [onToken, siteKey]);
  return <div ref={container} aria-label="Human verification" />;
}
