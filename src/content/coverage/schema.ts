import { z } from 'zod';

const text = z.string().trim().min(1);
const texts = z.array(text).min(1);
const sourceRef = z.object({
  sectionId: text,
  printedStart: text,
  printedEnd: text.optional(),
  pdfPageStart: z.number().int().positive(),
  pdfPageEnd: z.number().int().positive().optional(),
  sourceHash: text,
  companionCreated: z.literal(true),
});
const base = {
  sourceId: text,
  chapterId: text,
  contentStatus: z.enum(['reviewed', 'published']),
  sourceRefs: z.array(sourceRef).min(1),
};

export const sectionActivitySchema = z.object({
  ...base,
  objectives: texts,
  explanation: text,
  workedExample: text,
  independentTask: text,
});

export const exerciseActivitySchema = z.object({
  ...base,
  prompt: text,
  hints: z.array(text).min(2),
  evaluation: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('answer'), answer: text, explanation: text }),
    z.object({ kind: z.literal('rubric'), criteria: z.array(text).min(1) }),
  ]),
});

export const coverageClassificationSchema = z.object({
  sourceId: text,
  kind: z.enum(['container', 'summary', 'exercise-heading', 'empty-placeholder', 'reference']),
});
