import { z } from 'zod';

import { CONTENT_VERSION, tutorContexts, type AllowedSourceRef } from './context';

interface RateLimiter { limit(input: { key: string }): Promise<{ success: boolean }> }
interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface TutorEnv {
  GEMINI_API_KEY: string;
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

const sourceRefSchema = z.object({
  sectionId: z.string(), printedStart: z.string(), pdfPageStart: z.number().int().positive(),
});
const modelResponseSchema = z.object({
  reply: z.string().min(1).max(6_000),
  sourceRefs: z.array(sourceRefSchema).max(5),
  supportLevel: z.enum(['hint', 'explanation', 'feedback', 'revealed']),
  insufficientEvidence: z.boolean(),
  suggestedNextAttempt: z.string().min(1).max(1_000),
});

type Fetcher = typeof fetch;
const model = 'gemini-3.8-flash';

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

async function verifyTurnstile(token: string, secret: string, fetcher: Fetcher): Promise<boolean> {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

async function enforceDailyLimits(env: TutorEnv, clientId: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const clientKey = `client:${day}:${clientId}`;
  const globalKey = `global:${day}`;
  const [clientCount, globalCount] = await Promise.all([env.DAILY_LIMITS.get(clientKey), env.DAILY_LIMITS.get(globalKey)]);
  const client = Number(clientCount ?? 0);
  const global = Number(globalCount ?? 0);
  if (client >= 25 || global >= 250) return false;
  await Promise.all([
    env.DAILY_LIMITS.put(clientKey, String(client + 1), { expirationTtl: 172_800 }),
    env.DAILY_LIMITS.put(globalKey, String(global + 1), { expirationTtl: 172_800 }),
  ]);
  return true;
}

function citationsAllowed(citations: AllowedSourceRef[], allowlist: AllowedSourceRef[]): boolean {
  return citations.every((citation) => allowlist.some((allowed) =>
    allowed.sectionId === citation.sectionId
    && allowed.printedStart === citation.printedStart
    && allowed.pdfPageStart === citation.pdfPageStart,
  ));
}

export async function handleTutorRequest(request: Request, env: TutorEnv, fetcher: Fetcher = fetch): Promise<Response> {
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
  try { raw = await request.text(); } catch { return safeError('INVALID_PAYLOAD', 'Unable to read request.', 400, origin); }
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

  const rate = await env.RATE_LIMITER.limit({ key: body.anonymousClientId });
  if (!rate.success) return safeError('RATE_LIMITED', 'Tutor limit reached. Continue the lesson and try again shortly.', 429, origin);
  if (!await enforceDailyLimits(env, body.anonymousClientId)) return safeError('DAILY_LIMIT_REACHED', 'Today’s tutor allowance is complete. All non-AI learning tools remain available.', 429, origin);

  let humanVerified = false;
  try { humanVerified = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET, fetcher); } catch { /* safe failure */ }
  if (!humanVerified) return safeError('TURNSTILE_FAILED', 'Human verification expired. Please retry.', 403, origin);

  const prompt = [
    'You are a concise deep-learning coach. Use only the supplied companion context.',
    `Mode: ${body.mode}. Locale: ${body.locale}. Preserve English technical terms when locale is ro-help.`,
    `Lesson context: ${context.summary}`,
    `Allowed citations: ${JSON.stringify(context.sourceRefs)}`,
    `Question: ${body.question}`,
    `Learner attempt: ${body.learnerAttempt}`,
    `Recent conversation: ${JSON.stringify(body.recentConversation.slice(-6))}`,
    'If context is insufficient, set insufficientEvidence true. Never invent a page, equation, or citation.',
  ].join('\n');

  try {
    const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 800, responseMimeType: 'application/json' },
      }),
    });
    if (!response.ok) return safeError(response.status === 429 ? 'RATE_LIMITED' : 'TUTOR_UNAVAILABLE', 'Tutor is temporarily unavailable. Continue without AI.', response.status === 429 ? 429 : 503, origin);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return safeError('MALFORMED_TUTOR_RESPONSE', 'Tutor returned an unusable response. Continue without AI.', 502, origin);
    let decoded: unknown;
    try { decoded = JSON.parse(text); } catch { return safeError('MALFORMED_TUTOR_RESPONSE', 'Tutor returned an unusable response. Continue without AI.', 502, origin); }
    const result = modelResponseSchema.safeParse(decoded);
    if (!result.success || !citationsAllowed(result.data.sourceRefs, context.sourceRefs)) {
      return safeError('MALFORMED_TUTOR_RESPONSE', 'Tutor response could not be grounded in the reviewed source.', 502, origin);
    }
    return json({ ...result.data, model, contentVersion: CONTENT_VERSION }, 200, origin);
  } catch {
    return safeError('TUTOR_UNAVAILABLE', 'Tutor is temporarily unavailable. Continue without AI.', 503, origin);
  }
}

export default { fetch: (request: Request, env: TutorEnv) => handleTutorRequest(request, env) };
