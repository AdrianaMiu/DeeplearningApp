import { z } from 'zod';

const text = z.string().trim().min(1);
const instructionalText = (minimum: number) => z.string().trim().min(minimum);
const objectives = z.array(instructionalText(15)).min(1);
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
  objectives,
  explanation: instructionalText(100),
  workedExample: instructionalText(50),
  independentTask: instructionalText(50),
});

export const exerciseActivitySchema = z.object({
  ...base,
  prompt: instructionalText(60),
  hints: z.array(instructionalText(15)).min(2),
  evaluation: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('answer'), answer: text, explanation: instructionalText(30) }),
    z.object({ kind: z.literal('rubric'), criteria: z.array(instructionalText(15)).min(1) }),
  ]),
});

export const coverageClassificationSchema = z.object({
  sourceId: text,
  kind: z.enum(['container', 'summary', 'exercise-heading', 'empty-placeholder', 'reference']),
});
