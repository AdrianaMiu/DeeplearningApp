import { z } from 'zod';
import { BOOK_SOURCE_HASH, CONTENT_VERSION, tutorContexts, type TutorContext } from './context';

export function buildRagFilter(context: TutorContext): string {
  // Identity check prevents callers from constructing their own retrieval scope.
  if (tutorContexts[context.lessonId] !== context || !context.sourceRefs.length) throw new Error('Unknown reviewed context');
  const literal = (value: string) => JSON.stringify(value);
  return `sourceHash = ${literal(BOOK_SOURCE_HASH)} AND contentVersion = ${literal(CONTENT_VERSION)} AND (${context.sourceRefs.map((ref) => `sectionId = ${literal(ref.sectionId)}`).join(' OR ')})`;
}

const groundingSchema = z.object({
  groundingChunks: z.array(z.object({ retrievedContext: z.object({
    customMetadata: z.array(z.object({ key: z.string(), stringValue: z.string().optional(), numericValue: z.number().optional() })),
  }) })).default([]),
  groundingSupports: z.array(z.object({ groundingChunkIndices: z.array(z.number().int().nonnegative()) })).default([]),
});

export function mapGroundingCitations(metadata: unknown, context: TutorContext) {
  if (metadata === undefined) return [];
  const parsed = groundingSchema.safeParse(metadata);
  const invalid = () => new Error('MALFORMED_TUTOR_RESPONSE');
  if (!parsed.success) throw invalid();
  const refs = parsed.data.groundingChunks.map((chunk) => {
    const entries = chunk.retrievedContext.customMetadata;
    if (new Set(entries.map((entry) => entry.key)).size !== entries.length) throw invalid();
    const fields = new Map(entries.map((entry) => [entry.key, entry.stringValue]));
    const sectionId = fields.get('sectionId');
    const ref = context.sourceRefs.find((candidate) => candidate.sectionId === sectionId);
    const root = sectionId?.split('.')[0];
    const chapterId = root && (/^\d+$/.test(root) ? `chapter-${root}` : `appendix-${root.toLowerCase()}`);
    if (!ref || fields.get('sourceHash') !== BOOK_SOURCE_HASH || fields.get('contentVersion') !== CONTENT_VERSION || fields.get('chapterId') !== chapterId) throw invalid();
    return ref;
  });
  const cited = parsed.data.groundingSupports.flatMap((support) => support.groundingChunkIndices);
  if (cited.some((index) => !refs[index])) throw invalid();
  return [...new Set(cited.map((index) => refs[index]))];
}
