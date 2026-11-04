import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestTutor, type TutorRequest } from '../../src/tutor/client';

const input: TutorRequest = {
  lessonId: 'tensor-shapes',
  conceptIds: ['tensor-shape'],
  mode: 'hint',
  learnerAttempt: 'I think axis 0 remains.',
  question: 'Which axis remains?',
  locale: 'en',
  recentConversation: [],
  turnstileToken: 'verified-token',
  anonymousClientId: 'client-12345678',
};

describe('tutor client', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('bounds and cancels a stalled response body', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_TUTOR_URL', 'https://tutor.example');
    const cancel = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({ cancel }))));
    const pending = expect(requestTutor(input)).rejects.toThrow(/taking longer than expected/i);
    await vi.advanceTimersByTimeAsync(30_000);
    await pending;
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('classifies malformed and failed bodies safely', async () => {
    vi.stubEnv('VITE_TUTOR_URL', 'https://tutor.example');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('broken json')));
    await expect(requestTutor(input)).rejects.toThrow(/unusable response/i);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('private transport details')); } }))));
    await expect(requestTutor(input)).rejects.toThrow(/temporarily unavailable/i);
  });

  it('stops a request after 30 seconds and reports that the tutor took too long', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_TUTOR_URL', 'https://tutor.example');
    const stalledFetch = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }));
    vi.stubGlobal('fetch', stalledFetch);

    const pending = requestTutor(input);
    await vi.waitFor(() => expect(stalledFetch).toHaveBeenCalledOnce());
    expect(stalledFetch.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);

    const rejection = expect(pending).rejects.toThrow(/taking longer than expected/i);
    await vi.advanceTimersByTimeAsync(30_000);
    await rejection;
  });
});
