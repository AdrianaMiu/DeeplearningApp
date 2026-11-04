import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TurnstileWidget } from '../../src/tutor/TurnstileWidget';

afterEach(() => {
  delete window.turnstile;
  document.querySelectorAll('script[data-turnstile]').forEach((script) => script.remove());
});

function challenge() {
  if (!document.querySelector('script[data-turnstile]')) {
    const script = document.createElement('script');
    script.dataset.turnstile = 'true';
    document.head.append(script);
  }
  const options: Record<string, unknown>[] = [];
  const remove = vi.fn();
  window.turnstile = { render: vi.fn((_element, value) => { options.push(value); return `widget-${options.length}`; }), remove };
  return { options, remove, call: (index: number, name: string, ...args: string[]) => act(() => (options[index][name] as (...values: string[]) => void)(...args)) };
}

describe('TurnstileWidget', () => {
  it.each(['expired-callback', 'timeout-callback'])('clears and renews verification on %s, ignoring removed callbacks', (callback) => {
    const widget = challenge();
    const onToken = vi.fn();
    render(<TurnstileWidget siteKey="site-key" onToken={onToken} />);
    widget.call(0, 'callback', 'old-token');
    widget.call(0, callback);
    expect(onToken).toHaveBeenLastCalledWith('');
    expect(widget.remove).toHaveBeenCalledWith('widget-1');
    expect(widget.options).toHaveLength(2);
    widget.call(1, 'callback', 'fresh-token');
    widget.call(0, 'callback', 'stale-token');
    widget.call(0, 'expired-callback');
    expect(onToken).toHaveBeenLastCalledWith('fresh-token');
  });

  it('offers a manual retry after challenge failure', () => {
    const widget = challenge();
    const onToken = vi.fn();
    render(<TurnstileWidget siteKey="site-key" onToken={onToken} />);
    expect(screen.getByText(/verification.*in progress/i)).toBeInTheDocument();
    widget.call(0, 'error-callback');
    expect(onToken).toHaveBeenLastCalledWith('');
    widget.call(0, 'callback', 'token-from-failed-challenge');
    expect(onToken).toHaveBeenLastCalledWith('');
    fireEvent.click(screen.getByRole('button', { name: /retry verification/i }));
    expect(widget.options).toHaveLength(2);
    widget.call(1, 'callback', 'retry-token');
    expect(onToken).toHaveBeenLastCalledWith('retry-token');
  });

  it('removes its widget and ignores callbacks after unmount', () => {
    const widget = challenge();
    const onToken = vi.fn();
    const { unmount } = render(<TurnstileWidget siteKey="site-key" onToken={onToken} />);
    unmount();
    expect(widget.remove).toHaveBeenCalledWith('widget-1');
    widget.call(0, 'callback', 'late-token');
    expect(onToken).not.toHaveBeenCalled();
  });

  it.each([false, true])('cleans up pending script listeners (existing script: %s)', (existing) => {
    if (existing) {
      const script = document.createElement('script');
      script.dataset.turnstile = 'true';
      document.head.append(script);
    }
    const { unmount } = render(<TurnstileWidget siteKey="site-key" onToken={vi.fn()} />);
    const script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')!;
    const removeListener = vi.spyOn(script, 'removeEventListener');
    unmount();
    expect(removeListener).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('error', expect.any(Function));
    const widget = challenge();
    fireEvent.load(script);
    expect(widget.options).toHaveLength(0);
  });

  it('allows retrying after the verification script fails to load', () => {
    render(<TurnstileWidget siteKey="site-key" onToken={vi.fn()} />);
    const script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')!;
    fireEvent.error(script);
    fireEvent.click(screen.getByRole('button', { name: /retry verification/i }));
    const nextScript = document.querySelector<HTMLScriptElement>('script[data-turnstile]')!;
    expect(nextScript).not.toBe(script);
    const widget = challenge();
    fireEvent.load(nextScript);
    expect(widget.options).toHaveLength(1);
  });
});
