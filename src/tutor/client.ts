export type TutorMode = 'hint' | 'explain' | 'feedback' | 'reveal';

export interface TutorRequest {
  lessonId: string;
  conceptIds: string[];
  mode: TutorMode;
  learnerAttempt: string;
  question: string;
  locale: 'en' | 'ro-help';
  recentConversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  turnstileToken: string;
  anonymousClientId: string;
}

export interface TutorResponse {
  reply: string;
  sourceRefs: Array<{ sectionId: string; printedStart: string; pdfPageStart: number }>;
  supportLevel: 'none' | 'hint' | 'explanation' | 'feedback' | 'revealed';
  insufficientEvidence: boolean;
  suggestedNextAttempt: string;
  model: string;
  contentVersion: string;
}

export function anonymousClientId(): string {
  const key = 'deep-learning-companion-anonymous-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export async function requestTutor(input: TutorRequest): Promise<TutorResponse> {
  const endpoint = import.meta.env.VITE_TUTOR_URL;
  if (!endpoint) throw new Error('Tutor is not configured. Continue the lesson without AI.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let response: Response;
  try {
    response = await fetch(`${endpoint.replace(/\/$/, '')}/api/tutor`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new Error('Tutor is taking longer than expected. Please try again.');
    }
    throw new Error('Tutor is temporarily unavailable. Continue the lesson without AI.');
  } finally {
    clearTimeout(timeout);
  }
  const payload = await response.json() as TutorResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message ?? 'Tutor is temporarily unavailable. Continue the lesson without AI.');
  return payload;
}
