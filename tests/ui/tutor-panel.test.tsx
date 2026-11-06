import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TutorPanel } from '../../src/tutor/TutorPanel';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete window.turnstile;
  document.querySelectorAll('script[data-turnstile]').forEach((script) => script.remove());
});

describe('TutorPanel', () => {
  it.each([true, false])('uses a fresh token for the next production request after success=%s', async (success) => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
    vi.stubEnv('VITE_TUTOR_URL', 'https://tutor.example');
    const callbacks: Record<string, unknown>[] = [];
    const remove = vi.fn();
    const script = document.createElement('script');
    script.dataset.turnstile = 'true';
    document.head.append(script);
    window.turnstile = { render: vi.fn((_element, options) => { callbacks.push(options); return `widget-${callbacks.length}`; }), remove };
    let settle!: (response: Response) => void;
    const fetchTutor = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { settle = resolve; }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ reply: 'Second reply', suggestedNextAttempt: 'Try again', sourceRefs: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchTutor);
    const user = userEvent.setup();
    render(<TutorPanel lessonId="tensor-shapes" conceptIds={['tensor-shape']} learnerAttempt="My shape is 3" />);
    await user.click(screen.getByRole('checkbox', { name: /i understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to tutor/i }));
    await user.type(screen.getByLabelText(/question for the tutor/i), 'What axis remains?');
    const ask = screen.getByRole('button', { name: /ask for a hint/i });
    expect(ask).toBeDisabled();
    act(() => (callbacks[0].callback as (token: string) => void)('first-token'));
    await user.click(ask);
    expect(JSON.parse(fetchTutor.mock.calls[0][1].body)).toMatchObject({ turnstileToken: 'first-token', learnerAttempt: 'My shape is 3', question: 'What axis remains?' });
    expect(ask).toBeDisabled();
    await act(async () => settle(new Response(JSON.stringify(success
      ? { reply: 'First reply', suggestedNextAttempt: 'Try again', sourceRefs: [] }
      : { message: 'Human verification expired. Please retry.' }), { status: success ? 200 : 400 })));
    expect(await screen.findByText(success ? 'First reply' : 'Human verification expired. Please retry.')).toBeInTheDocument();
    // A consumed token must never enable a second request.
    expect(ask).toBeDisabled();
    act(() => (callbacks[0].callback as (token: string) => void)('late-token'));
    expect(ask).toBeDisabled();
    await user.click(ask);
    expect(fetchTutor).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(callbacks).toHaveLength(2));
    expect(remove).toHaveBeenCalledWith('widget-1');
    expect(screen.getByLabelText(/question for the tutor/i)).toHaveValue('What axis remains?');
    act(() => (callbacks[1].callback as (token: string) => void)('second-token'));
    await user.click(ask);
    expect(await screen.findByText('Second reply')).toBeInTheDocument();
    const secondBody = JSON.parse(fetchTutor.mock.calls[1][1].body);
    expect(secondBody).toMatchObject({ turnstileToken: 'second-token', learnerAttempt: 'My shape is 3' });
    expect(secondBody.recentConversation).toEqual(success ? [
      { role: 'user', content: 'What axis remains?' },
      { role: 'assistant', content: 'First reply' },
    ] : []);
  });

  it('renews verification after synchronous client-id failure while preserving the question and reply', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
    vi.stubEnv('VITE_TUTOR_URL', 'https://tutor.example');
    const callbacks: Record<string, unknown>[] = [];
    const remove = vi.fn();
    window.turnstile = { render: vi.fn((_element, options) => { callbacks.push(options); return `widget-${callbacks.length}`; }), remove };
    const fetchTutor = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      reply: 'Retained tutor reply', suggestedNextAttempt: 'Try another axis', sourceRefs: [],
      supportLevel: 'hint', insufficientEvidence: false, model: 'test-model', contentVersion: 'test-version',
    }), { status: 200 })));
    vi.stubGlobal('fetch', fetchTutor);
    const user = userEvent.setup();
    render(<TutorPanel lessonId="tensor-shapes" conceptIds={['tensor-shape']} learnerAttempt="My shape is 3" />);
    await user.click(screen.getByRole('checkbox', { name: /i understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to tutor/i }));
    await user.type(screen.getByLabelText(/question for the tutor/i), 'What axis remains?');
    const ask = screen.getByRole('button', { name: /ask for a hint/i });
    act(() => (callbacks[0].callback as (token: string) => void)('first-token'));
    await user.click(ask);
    expect(await screen.findByText('Retained tutor reply')).toBeInTheDocument();
    await waitFor(() => expect(callbacks).toHaveLength(2));

    act(() => (callbacks[1].callback as (token: string) => void)('pre-failure-token'));
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Storage access denied', 'SecurityError');
    });
    await user.click(ask);
    expect(await screen.findByText('Tutor is temporarily unavailable.')).toBeInTheDocument();
    expect(fetchTutor).toHaveBeenCalledTimes(1);
    expect(ask).toBeDisabled();
    expect(screen.getByLabelText(/question for the tutor/i)).toHaveValue('What axis remains?');
    expect(screen.getByText('Retained tutor reply')).toBeInTheDocument();
    await waitFor(() => expect(callbacks).toHaveLength(3));
    expect(remove).toHaveBeenCalledWith('widget-2');
    act(() => (callbacks[1].callback as (token: string) => void)('stale-token'));
    expect(ask).toBeDisabled();
    act(() => (callbacks[2].callback as (token: string) => void)('recovery-token'));
    await user.click(ask);
    await waitFor(() => expect(fetchTutor).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchTutor.mock.calls[1][1].body)).toMatchObject({
      turnstileToken: 'recovery-token', question: 'What axis remains?', learnerAttempt: 'My shape is 3',
    });
  });

  it.each([
    ['book', 'Book source'], ['companion', 'Companion explanation'], [undefined, 'Companion explanation'],
  ] as const)('labels grounding=%s and supports older Worker responses', async (grounding, label) => {
    const user = userEvent.setup();
    const requestTutor = vi.fn().mockResolvedValue({
      reply: 'Name the remaining axis.', suggestedNextAttempt: 'Explain its size.',
      sourceRefs: [{ sectionId: '2.1.2', printedStart: '33', pdfPageStart: 73 }],
      ...(grounding ? { grounding } : {}),
    });
    render(<TutorPanel lessonId="tensor-shapes" conceptIds={['tensor-shape']} learnerAttempt="My shape is 3" requestTutor={requestTutor} />);
    expect(screen.getByText(/indexed book.*conversation fragments.*processed by Gemini/i)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /i understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to tutor/i }));
    await user.type(screen.getByLabelText(/question for the tutor/i), 'What axis remains?');
    await user.click(screen.getByRole('button', { name: /ask for a hint/i }));
    expect(await screen.findByText(new RegExp(`${label}.*2\\.1\\.2.*print p\\. 33.*PDF p\\. 73`))).toBeInTheDocument();
  });

  it('discloses Gemini privacy terms before first use and keeps failure non-blocking', async () => {
    const user = userEvent.setup();
    const requestTutor = vi.fn().mockRejectedValue(new Error('Tutor is temporarily unavailable.'));
    render(<TutorPanel lessonId="tensor-shapes" conceptIds={['tensor-shape']} learnerAttempt="My shape is 3" requestTutor={requestTutor} />);

    expect(screen.getByText(/free-tier prompts may be used/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ask for a hint/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /i understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to tutor/i }));
    await user.type(screen.getByLabelText(/question for the tutor/i), 'What axis remains?');
    await user.click(screen.getByRole('button', { name: /ask for a hint/i }));
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/continue the lesson without ai/i)).toBeInTheDocument();
  });
});
