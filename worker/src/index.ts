import { z } from 'zod';

import { CONTENT_VERSION, tutorContexts } from './context';
import { generateGroundedTutorReply, TutorProviderError } from './gemini';
import { DeadlineError, fetchJson, readText, withDeadline } from '../../src/tutor/deadline';

interface RateLimiter { limit(input: { key: string }): Promise<{ success: boolean }> }
interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface TutorEnv {
  GEMINI_API_KEY: string;
  GEMINI_FILE_SEARCH_STORE?: string;
  RAG_CONTENT_VERSION?: string;
  RAG_SOURCE_HASH?: string;
  TURNSTILE_SECRET: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMITER: RateLimiter;
  DAILY_LIMITS: KvNamespace;
}

const conversationSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(800) });
const requestSchema = z.object({
  lessonId: z.string(),
  conceptIds: z.array(z.string()).max(8),
  mode: z.enum(['hint', 'explain', 'feedback', 'reveal']),
  learnerAttempt: z.string(),
  question: z.string().max(4_000),
  locale: z.enum(['en', 'ro-help']),
  recentConversation: z.array(conversationSchema).max(6),
  turnstileToken: z.string().min(1),
  anonymousClientId: z.string().min(8).max(128),
});

type Fetcher = typeof fetch;
const totalWorkerBudgetMs = 25_000;

function corsOrigin(request: Request, env: TutorEnv): string | undefined {
  const origin = request.headers.get('origin') ?? '';
  if (origin === env.ALLOWED_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return undefined;
}

function json(body: unknown, status = 200, origin?: string): Response {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('access-control-allow-methods', 'POST, OPTIONS');
    headers.set('access-control-allow-headers', 'content-type');
    headers.set('vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function safeError(code: string, message: string, status: number, origin?: string) {
  return json({ code, message }, status, origin);
}

async function verifyTurnstile(token: string, secret: string, fetcher: Fetcher, remaining: () => number): Promise<boolean> {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  const response = await fetchJson(fetcher, 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: form }, Math.min(5_000, remaining()));
  return response.ok && (response.payload as { success?: boolean })?.success === true;
}

async function enforceDailyLimits(env: TutorEnv, clientId: string, remaining: () => number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const clientKey = `client:${day}:${clientId}`;
  const globalKey = `global:${day}`;
  const [clientCount, globalCount] = await withDeadline(() => Promise.all([env.DAILY_LIMITS.get(clientKey), env.DAILY_LIMITS.get(globalKey)]), remaining());
  const client = Number(clientCount ?? 0);
  const global = Number(globalCount ?? 0);
  if (client >= 25 || global >= 250) return false;
  await withDeadline(() => Promise.all([
    env.DAILY_LIMITS.put(clientKey, String(client + 1), { expirationTtl: 172_800 }),
    env.DAILY_LIMITS.put(globalKey, String(global + 1), { expirationTtl: 172_800 }),
  ]), remaining());
  return true;
}

export async function handleTutorRequest(request: Request, env: TutorEnv, fetcher: Fetcher = fetch): Promise<Response> {
  const deadline = Date.now() + totalWorkerBudgetMs;
  const remaining = () => deadline - Date.now();
  const url = new URL(request.url);
  if (url.pathname === '/health' && request.method === 'GET') {
    return json({ ok: true, service: 'deep-learning-companion-tutor' });
  }

  const origin = corsOrigin(request, env);
  if (!origin) return safeError('ORIGIN_NOT_ALLOWED', 'This origin cannot use the tutor.', 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: json({}, 200, origin).headers });
  if (url.pathname !== '/api/tutor' || request.method !== 'POST') return safeError('NOT_FOUND', 'Route not found.', 404, origin);

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > 24_000) return safeError('PAYLOAD_TOO_LARGE', 'Tutor request is too large.', 413, origin);
  let raw: string;
  try { raw = await withDeadline((signal) => readText(request, signal), remaining()); } catch (reason) {
    if (reason instanceof DeadlineError) return safeError('TUTOR_TIMEOUT', 'Tutor took too long to respond. Please try again.', 504, origin);
    return safeError('INVALID_PAYLOAD', 'Unable to read request.', 400, origin);
  }
  if (raw.length > 24_000) return safeError('PAYLOAD_TOO_LARGE', 'Tutor request is too large.', 413, origin);

  let unknownBody: unknown;
  try { unknownBody = JSON.parse(raw); } catch { return safeError('INVALID_PAYLOAD', 'Request must be valid JSON.', 400, origin); }
  if (typeof unknownBody === 'object' && unknownBody !== null && 'learnerAttempt' in unknownBody
    && typeof (unknownBody as { learnerAttempt?: unknown }).learnerAttempt === 'string'
    && (unknownBody as { learnerAttempt: string }).learnerAttempt.length > 4_000) {
    return safeError('PAYLOAD_TOO_LARGE', 'Learner attempt is limited to 4,000 characters.', 413, origin);
  }
  const parsed = requestSchema.safeParse(unknownBody);
  if (!parsed.success) return safeError('INVALID_PAYLOAD', 'Tutor request is malformed or uses an unsupported mode.', 400, origin);
  const body = parsed.data;
  const context = tutorContexts[body.lessonId];
  if (!context || body.conceptIds.some((id) => !context.conceptIds.includes(id))) {
    return safeError('UNKNOWN_CONTENT', 'Tutoring is available only for reviewed lesson content.', 400, origin);
  }

  if (!body.learnerAttempt.trim()) {
    return json({
      reply: 'Make a first attempt—even a partial one—so I can respond to your reasoning.',
      sourceRefs: [], supportLevel: 'none', insufficientEvidence: true,
      suggestedNextAttempt: 'Write what you predict and why.', model: 'none', contentVersion: CONTENT_VERSION,
    }, 200, origin);
  }

  try {
    const rate = await withDeadline(() => env.RATE_LIMITER.limit({ key: body.anonymousClientId }), remaining());
    if (!rate.success) return safeError('RATE_LIMITED', 'Tutor limit reached. Continue the lesson and try again shortly.', 429, origin);

    let humanVerified = false;
    try { humanVerified = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET, fetcher, remaining); } catch { /* safe failure */ }
    if (!humanVerified) return safeError('TURNSTILE_FAILED', 'Human verification expired. Please retry.', 403, origin);
    if (!await enforceDailyLimits(env, body.anonymousClientId, remaining)) return safeError('DAILY_LIMIT_REACHED', 'Today’s tutor allowance is complete. All non-AI learning tools remain available.', 429, origin);

    const prompt = [
      'You are a concise deep-learning coach. Use only the supplied companion context.',
      `Mode: ${body.mode}. Locale: ${body.locale}. Preserve English technical terms when locale is ro-help.`,
      `Lesson context: ${context.summary}`,
      `Allowed source section IDs: ${context.sourceRefs.map((sourceRef) => sourceRef.sectionId).join(', ')}`,
      `Question: ${body.question}`,
      `Learner attempt: ${body.learnerAttempt}`,
      `Recent conversation: ${JSON.stringify(body.recentConversation.slice(-6))}`,
      'Return only allowed source section IDs. If context is insufficient, set insufficientEvidence true. Never invent a page, equation, or citation.',
    ].join('\n');

    const responseJsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        reply: { type: 'string', description: 'A concise response grounded only in the supplied lesson context.' },
        sourceSectionIds: {
          type: 'array',
          maxItems: 5,
          items: { type: 'string', enum: context.sourceRefs.map((sourceRef) => sourceRef.sectionId) },
          description: 'Only section IDs that directly support the response.',
        },
        supportLevel: { type: 'string', enum: ['hint', 'explanation', 'feedback', 'revealed'] },
        insufficientEvidence: { type: 'boolean' },
        suggestedNextAttempt: { type: 'string' },
      },
      required: ['reply', 'sourceSectionIds', 'supportLevel', 'insufficientEvidence', 'suggestedNextAttempt'],
    };

    const result = await generateGroundedTutorReply({ prompt, responseJsonSchema }, context, env, fetcher, remaining);
    return json({ ...result, contentVersion: CONTENT_VERSION }, 200, origin);
  } catch (reason) {
    if (reason instanceof TutorProviderError) return safeError(reason.code, reason.message, reason.status, origin);
    if (reason instanceof DeadlineError) return safeError('TUTOR_TIMEOUT', 'Tutor took too long to respond. Please try again.', 504, origin);
    return safeError('TUTOR_UNAVAILABLE', 'Tutor is temporarily unavailable. Continue without AI.', 503, origin);
  }
}

export default { fetch: (request: Request, env: TutorEnv) => handleTutorRequest(request, env) };
