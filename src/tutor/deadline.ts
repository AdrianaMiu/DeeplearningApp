/** Shared transport utilities contain no Worker configuration or book content. */
export class DeadlineError extends Error {
  constructor() { super('Request deadline expired'); this.name = 'DeadlineError'; }
}

export async function withDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds: number): Promise<T> {
  if (milliseconds <= 0) throw new DeadlineError();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { reject(new DeadlineError()); controller.abort(); }, milliseconds);
  });
  try { return await Promise.race([operation(controller.signal), expired]); }
  finally { clearTimeout(timer!); }
}

export async function readText(response: Response | Request, signal: AbortSignal): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) { cancel(); throw new DeadlineError(); }
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new DeadlineError();
      if (done) return text + decoder.decode();
      text += decoder.decode(value, { stream: true });
    }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

export async function fetchJson(fetcher: typeof fetch, input: RequestInfo | URL, init: RequestInit, milliseconds: number) {
  return withDeadline(async (signal) => {
    const response = await fetcher(input, { ...init, signal });
    if (signal.aborted) { void response.body?.cancel().catch(() => {}); throw new DeadlineError(); }
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      return { status: response.status, ok: false, payload: undefined as unknown };
    }
    return { status: response.status, ok: true, payload: JSON.parse(await readText(response, signal)) as unknown };
  }, milliseconds);
}
