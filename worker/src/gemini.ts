import { z } from 'zod';
import { DeadlineError, fetchJson } from '../../src/tutor/deadline';
import { BOOK_SOURCE_HASH, CONTENT_VERSION, type AllowedSourceRef, type TutorContext } from './context';
import { buildRagFilter, mapGroundingCitations } from './rag';

export class TutorProviderError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
const malformed = () => new TutorProviderError('MALFORMED_TUTOR_RESPONSE', 'Tutor response could not be grounded in the reviewed source.', 502);
const timeout = () => new TutorProviderError('TUTOR_TIMEOUT', 'Tutor took too long to respond. Please try again.', 504);
const modelResponseSchema = z.object({
  reply: z.string().min(1).max(6_000),
  sourceSectionIds: z.array(z.string()).max(5),
  supportLevel: z.enum(['hint', 'explanation', 'feedback', 'revealed']),
  insufficientEvidence: z.boolean(),
  suggestedNextAttempt: z.string().min(1).max(1_000),
});

export interface GeminiEnv { GEMINI_API_KEY: string; GEMINI_FILE_SEARCH_STORE?: string; RAG_CONTENT_VERSION?: string; RAG_SOURCE_HASH?: string }
export type GroundedTutorResult = Omit<z.infer<typeof modelResponseSchema>, 'sourceSectionIds'> & { sourceRefs: AllowedSourceRef[]; model: string; grounding: 'book' | 'companion' };

export async function generateGroundedTutorReply(
  input: { prompt: string; responseJsonSchema: object }, context: TutorContext, env: GeminiEnv,
  fetcher: typeof fetch = fetch, remaining: () => number = () => 25_000,
): Promise<GroundedTutorResult> {
  const ragEnabled = Boolean(env.GEMINI_FILE_SEARCH_STORE && env.RAG_CONTENT_VERSION === CONTENT_VERSION && env.RAG_SOURCE_HASH === BOOK_SOURCE_HASH);
  let lastError: unknown;
  for (const model of ['gemini-3.8-flash', 'gemini-3.6-flash']) {
    if (remaining() <= 0) throw timeout();
    try {
      const response = await fetchJson(fetcher, `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: ragEnabled ? `${input.prompt}\nYou may also use retrieved book passages. Cite only supporting allowed sections.` : input.prompt }] }],
          ...(ragEnabled ? { tools: [{ fileSearch: { fileSearchStoreNames: [env.GEMINI_FILE_SEARCH_STORE], metadataFilter: buildRagFilter(context) } }] } : {}),
          generationConfig: { thinkingConfig: { thinkingLevel: 'low' }, maxOutputTokens: 800,
            responseMimeType: 'application/json', responseJsonSchema: input.responseJsonSchema },
        }),
      }, Math.min(10_000, remaining()));
      if (!response.ok) {
        if ([400, 401, 403].includes(response.status)) throw new TutorProviderError('TUTOR_CONFIGURATION_ERROR', 'Gemini access is not configured correctly. Check the Worker API key and model access.', 503);
        if (response.status === 429) throw new TutorProviderError('RATE_LIMITED', 'Gemini quota is temporarily exhausted. Continue without AI and try again later.', 429);
        lastError = new TutorProviderError('TUTOR_BUSY', 'Gemini is currently busy. Please try again shortly.', 503);
        if (response.status < 500) throw lastError;
        continue;
      }
      const envelope = z.object({ candidates: z.array(z.object({
        finishReason: z.string().optional(), groundingMetadata: z.unknown().optional(),
        content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })) }),
      })).min(1) }).safeParse(response.payload);
      if (!envelope.success) throw malformed();
      const candidate = envelope.data.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== 'STOP') throw malformed();
      const text = candidate.content.parts.filter((part) => !part.thought).map((part) => part.text ?? '').join('');
      let decoded: unknown;
      try { decoded = JSON.parse(text); } catch { throw malformed(); }
      const result = modelResponseSchema.safeParse(decoded);
      if (!result.success) throw malformed();
      const refs = result.data.sourceSectionIds.map((id) => context.sourceRefs.find((ref) => ref.sectionId === id));
      if (refs.some((ref) => !ref)) throw malformed();
      let sourceRefs = refs as AllowedSourceRef[];
      let insufficientEvidence = result.data.insufficientEvidence;
      if (ragEnabled) {
        let citations: AllowedSourceRef[];
        try { citations = mapGroundingCitations(candidate.groundingMetadata, context); } catch { throw malformed(); }
        if (!citations.length) {
          // Do not present an ungrounded model answer as book evidence.
          return { reply: 'The book search did not return verified evidence for this question.', sourceRefs: [],
            supportLevel: result.data.supportLevel, insufficientEvidence: true,
            suggestedNextAttempt: 'Use the reviewed lesson explanation and try a narrower question.', model, grounding: 'companion' };
        }
        if (sourceRefs.some((ref) => !citations.some((citation) => citation.sectionId === ref.sectionId))) throw malformed();
        sourceRefs = citations;
        insufficientEvidence ||= !sourceRefs.length;
      }
      const { sourceSectionIds: _ids, ...reply } = result.data;
      return { ...reply, insufficientEvidence, sourceRefs, model, grounding: ragEnabled ? 'book' : 'companion' };
    } catch (reason) {
      if (reason instanceof TutorProviderError) throw reason;
      // Invalid JSON is malformed content; stream/network failures may retry the fallback model.
      if (reason instanceof SyntaxError) throw malformed();
      lastError = reason;
    }
  }
  if (lastError instanceof DeadlineError) throw timeout();
  if (lastError instanceof TutorProviderError) throw lastError;
  throw new TutorProviderError('TUTOR_UNAVAILABLE', 'Tutor is temporarily unavailable. Continue without AI.', 503);
}
