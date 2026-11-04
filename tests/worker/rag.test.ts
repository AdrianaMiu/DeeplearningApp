import { describe, expect, it, vi } from 'vitest';
import { buildRagFilter, mapGroundingCitations } from '../../worker/src/rag';
import { generateGroundedTutorReply } from '../../worker/src/gemini';
import { BOOK_SOURCE_HASH, CONTENT_VERSION, tutorContexts } from '../../worker/src/context';
import { chapterStudios } from '../../src/content/studios';
const context = tutorContexts['tensor-shapes'];
const result = { reply: 'Try naming the remaining axis.', sourceSectionIds: ['2.1.2'], supportLevel: 'hint', insufficientEvidence: false, suggestedNextAttempt: 'Name it.' };
const chunk = (sectionId = '2.1.2') => ({ retrievedContext: { pageNumber: 9999, customMetadata: [
  { key: 'sourceHash', stringValue: BOOK_SOURCE_HASH }, { key: 'contentVersion', stringValue: CONTENT_VERSION },
  { key: 'sectionId', stringValue: sectionId }, { key: 'chapterId', stringValue: 'chapter-2' },
] } });
describe('private book retrieval', () => {
  it('builds RAG filters only from the lesson allowlist', () => {
    expect(buildRagFilter(context)).toBe(`sourceHash = "${BOOK_SOURCE_HASH}" AND contentVersion = "${CONTENT_VERSION}" AND (sectionId = "2.1.1" OR sectionId = "2.1.2" OR sectionId = "2.1.3")`);
    expect(() => buildRagFilter({ ...context, sourceRefs: [{ sectionId: '" OR x', printedStart: '1', pdfPageStart: 1 }] })).toThrow();
  });
  it('maps valid File Search citations', () => {
    expect(mapGroundingCitations({ groundingChunks: [chunk()], groundingSupports: [{ groundingChunkIndices: [0] }] }, context))
      .toEqual([{ sectionId: '2.1.2', printedStart: '33', pdfPageStart: 73 }]);
  });
  it('rejects citations outside the current chapter', () => {
    expect(() => mapGroundingCitations({ groundingChunks: [chunk('9.1')], groundingSupports: [{ groundingChunkIndices: [0] }] }, context)).toThrow('MALFORMED_TUTOR_RESPONSE');
  });
  it('falls back safely when RAG is unavailable', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }));
    const reply = await generateGroundedTutorReply({ prompt: 'Companion context', responseJsonSchema: {} }, context,
      { GEMINI_API_KEY: 'fixture', GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/private', RAG_CONTENT_VERSION: 'wrong' }, fetcher);
    expect(reply.sourceRefs).toEqual([context.sourceRefs[1]]);
    expect(reply.grounding).toBe('companion');
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).not.toHaveProperty('tools');
  });
  it('sends supported File Search plus structured output and replaces model page values', async () => {
    let outbound: Record<string, unknown> = {};
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      outbound = JSON.parse(String(init?.body));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...result, pdfPageStart: 9999 }) }] }, groundingMetadata: { groundingChunks: [chunk()], groundingSupports: [{ groundingChunkIndices: [0] }] } }] });
    });
    const reply = await generateGroundedTutorReply({ prompt: 'Reviewed context', responseJsonSchema: { type: 'object' } }, context,
      { GEMINI_API_KEY: 'fixture', GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/private', RAG_CONTENT_VERSION: CONTENT_VERSION, RAG_SOURCE_HASH: BOOK_SOURCE_HASH }, fetcher);
    expect(outbound.tools).toEqual([{ fileSearch: { fileSearchStoreNames: ['fileSearchStores/private'], metadataFilter: buildRagFilter(context) } }]);
    expect(outbound.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
    expect(reply.sourceRefs).toEqual([context.sourceRefs[1]]);
    expect(JSON.stringify(reply)).not.toContain('9999');
    expect(reply.grounding).toBe('book');
  });
  it.each(['foreign-section', 'wrong-hash', 'unknown-index', 'uncited-answer'])('rejects %s grounding', async (failure) => {
    const citation = chunk(failure === 'foreign-section' ? '9.1' : '2.1.2');
    if (failure === 'wrong-hash') citation.retrievedContext.customMetadata[0].stringValue = 'wrong';
    const fetcher = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(failure === 'uncited-answer' ? { ...result, sourceSectionIds: ['2.1.1'] } : result) }] }, groundingMetadata: { groundingChunks: [citation], groundingSupports: [{ groundingChunkIndices: [failure === 'unknown-index' ? 42 : 0] }] } }] }));
    await expect(generateGroundedTutorReply({ prompt: 'Reviewed context', responseJsonSchema: {} }, context,
      { GEMINI_API_KEY: 'fixture', GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/private', RAG_CONTENT_VERSION: CONTENT_VERSION, RAG_SOURCE_HASH: BOOK_SOURCE_HASH }, fetcher))
      .rejects.toMatchObject({ code: 'MALFORMED_TUTOR_RESPONSE' });
  });
  it('does not show unsupported generated claims when retrieved evidence is missing', async () => {
    const fetcher = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }));
    const reply = await generateGroundedTutorReply({ prompt: 'Reviewed context', responseJsonSchema: {} }, context,
      { GEMINI_API_KEY: 'fixture', GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/private', RAG_CONTENT_VERSION: CONTENT_VERSION, RAG_SOURCE_HASH: BOOK_SOURCE_HASH }, fetcher);
    expect(reply).toMatchObject({ insufficientEvidence: true, sourceRefs: [] });
    expect(reply.reply).not.toBe(result.reply);
  });
  it('requires both manifest source and content identity before enabling retrieval', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }));
    await generateGroundedTutorReply({ prompt: 'Reviewed context', responseJsonSchema: {} }, context,
      { GEMINI_API_KEY: 'fixture', GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/private', RAG_CONTENT_VERSION: CONTENT_VERSION, RAG_SOURCE_HASH: 'wrong' }, fetcher);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).not.toHaveProperty('tools');
  });
  it('has reviewed context and verified page metadata for all twenty studios', () => {
    for (const studio of chapterStudios) {
      const server = tutorContexts[studio.id];
      expect(server.conceptIds).toEqual(studio.conceptIds);
      expect(server.summary).toBe([studio.views.intuition, studio.views.math, studio.workedExample, ...studio.misconceptions].join(' '));
      expect(server.sourceRefs).toEqual(studio.sourceRefs.map(({ sectionId, printedStart, pdfPageStart }) => ({ sectionId, printedStart, pdfPageStart })));
    }
  });
});
