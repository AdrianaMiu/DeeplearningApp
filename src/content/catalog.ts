import { z } from 'zod';
import type { ChapterLearningPath, CurriculumInventory, LearningEntry, Milestone, SourceRef } from '../domain/types';
import { chapterLearningMap as defaultPaths, milestones as defaultMilestones } from './course-map';
import { curriculumInventory } from './inventory';
import { learningEntries } from './lessons';
import sourceManifest from './studio-source-manifest.json';
import { createCoverageCatalog, type CoverageCatalog } from './coverage/registry';
import { coverageCatalog as productionCoverageCatalog } from './coverage';

export interface CatalogIssue {
  code: 'DUPLICATE_ENTRY_ID' | 'MISSING_CORE_ENTRY' | 'UNKNOWN_CHAPTER_ID' | 'UNKNOWN_MILESTONE_ID'
    | 'UNKNOWN_SECTION_ID' | 'INVALID_PAGE_SPAN' | 'SOURCE_HASH_MISMATCH' | 'MANIFEST_REFERENCE_MISSING' | 'INVALID_ENTRY';
  message: string;
  entryId?: string;
  chapterId?: string;
  sectionId?: string;
}

export interface ChapterLearningSummary {
  chapterId: string;
  milestoneId: ChapterLearningPath['milestoneId'] | undefined;
  title: string;
  purpose?: string;
  capability?: string;
  coreEntryIds: string[];
  availableEntryIds: string[];
  studioCount: number;
  deepLessonCount: number;
  questionCount: number;
  sourceSectionCount: number;
  exerciseCount: number;
  authoredSectionCount: number;
  authoredExerciseCount: number;
  classifiedNonSubstantiveCount: number;
  unclassifiedSectionCount: number;
  remainingExerciseCount: number;
  availability: 'available' | 'partial' | 'indexed';
  issues: CatalogIssue[];
}

interface SourceManifest {
  sourceHash: string;
  sourcePageCount: number;
  studios: { studioId: string; references: Pick<SourceRef, 'sectionId' | 'printedStart' | 'pdfPageStart' | 'sourceHash'>[] }[];
}

interface CatalogInput {
  entries: readonly unknown[];
  chapterLearningMap?: ReadonlyMap<string, ChapterLearningPath>;
  milestones?: readonly Milestone[];
  inventory?: CurriculumInventory;
  sourceManifest?: SourceManifest;
  coverageCatalog?: CoverageCatalog;
}

const text = z.string().trim().min(1);
const texts = z.array(text).min(1);
const control = z.object({ id: text, label: text, min: z.number(), max: z.number(), step: z.number().positive(), initial: z.number() });
const interactionBase = { title: text, instruction: text };
const interaction = z.discriminatedUnion('kind', [
  z.object({ ...interactionBase, kind: z.literal('parameter-lab'), controls: z.array(control).min(1), model: z.enum(['softmax', 'dropout', 'optimizer', 'rbf-kernel', 'search-budget', 'gan-balance']) }),
  z.object({ ...interactionBase, kind: z.literal('shape-path'), steps: z.array(z.object({ label: text, inputShape: z.array(z.number().int().positive()), outputShape: z.array(z.number().int().positive()), explanation: text })).min(1) }),
  z.object({ ...interactionBase, kind: z.literal('sequence-stepper'), steps: z.array(z.object({ label: text, input: text, state: text, output: text, explanation: text })).min(1) }),
  z.object({ ...interactionBase, kind: z.literal('matrix-explorer'), matrix: z.array(z.array(z.number()).min(1)).min(1), operation: z.enum(['attention', 'matmul', 'eigen']) }),
  z.object({ ...interactionBase, kind: z.literal('decision-canvas'), prompt: text, options: z.array(z.object({ id: text, label: text, feedback: text, recommended: z.boolean().optional() })).min(1) }),
  z.object({ ...interactionBase, kind: z.literal('distribution-explorer'), controls: z.array(control).min(1), observations: z.array(z.number()), model: z.enum(['normal', 'bernoulli', 'gaussian-process']) }),
]);
const entrySchema = z.object({
  id: text, kind: z.enum(['deep-lesson', 'chapter-studio']), chapterId: text, milestoneId: text,
  title: text, question: text, objectives: texts, prerequisites: z.array(text), conceptIds: texts,
  sourceRefs: z.array(z.object({ sectionId: z.string(), printedStart: z.string(), printedEnd: z.string().optional(),
    pdfPageStart: z.number(), pdfPageEnd: z.number().optional(), sourceHash: z.string(), companionCreated: z.literal(true) })).min(1),
  views: z.object({ intuition: text, math: text, code: text, workConnection: text }),
  predictionPrompt: text, workedExample: text, independentTask: text, misconceptions: texts, teachBackPrompt: text,
  contentStatus: z.enum(['reviewed', 'published']), durationMinutes: z.number().positive(),
});
const studioSchema = entrySchema.extend({ kind: z.literal('chapter-studio'), purpose: text, capability: text,
  sectionCoverage: z.array(z.object({ sectionId: text, objective: text, depth: z.enum(['introduced', 'practiced', 'reference']) })).min(1),
  interaction, chapterCheckQuestionIds: z.array(text),
});

/** Build once per catalog; malformed fixtures never need to touch the static content arrays. */
export function createLearningCatalog(input: CatalogInput) {
  const paths = input.chapterLearningMap ?? defaultPaths;
  const milestones = input.milestones ?? defaultMilestones;
  const inventory = input.inventory ?? curriculumInventory;
  const manifest = input.sourceManifest ?? sourceManifest;
  const coverage = input.coverageCatalog ?? createCoverageCatalog({
    inventory, sectionActivities: [], exerciseActivities: [], classifications: [],
  });
  const chaptersById = new Map(inventory.chapters.map((chapter) => [chapter.id, chapter]));
  const sectionsById = new Map(inventory.sections.map((section) => [section.id, section]));
  const sectionChapterById = new Map<string, string>();
  function sectionChapter(sectionId: string, seen = new Set<string>()): string | undefined {
    if (sectionChapterById.has(sectionId)) return sectionChapterById.get(sectionId);
    if (seen.has(sectionId)) return undefined;
    seen.add(sectionId);
    const parentId = sectionsById.get(sectionId)?.parentId;
    const chapterId = parentId && (chaptersById.has(parentId) ? parentId : sectionChapter(parentId, seen));
    if (chapterId) sectionChapterById.set(sectionId, chapterId);
    return chapterId || undefined;
  }
  const milestonesById = new Map(milestones.map((milestone) => [milestone.id, milestone]));
  const manifestById = new Map(manifest.studios.map((studio) => [studio.studioId, studio]));
  const entriesById = new Map<string, LearningEntry>();
  const identityCounts = new Map<string, number>();
  const invalidIds = new Set<string>();
  const issues: CatalogIssue[] = [];
  const add = (issue: CatalogIssue) => {
    issues.push(issue);
    if (issue.entryId) invalidIds.add(issue.entryId);
  };
  for (const raw of input.entries) {
    if (raw && typeof raw === 'object' && 'id' in raw && typeof raw.id === 'string') {
      identityCounts.set(raw.id, (identityCounts.get(raw.id) ?? 0) + 1);
    }
  }
  // Identity issues precede entry/source issues; missing paths are reported last in course order.
  for (const [entryId, count] of identityCounts) if (count > 1) {
    add({ code: 'DUPLICATE_ENTRY_ID', entryId, message: `Entry ID ${entryId} occurs ${count} times.` });
  }
  for (const raw of input.entries) {
    const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : undefined;
    const context = { entryId: typeof record?.id === 'string' ? record.id : undefined,
      chapterId: typeof record?.chapterId === 'string' ? record.chapterId : undefined };
    const parsed = (record?.kind === 'chapter-studio' ? studioSchema : entrySchema).safeParse(raw);
    if (!parsed.success) {
      add({ ...context, code: 'INVALID_ENTRY', message: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
      continue;
    }
    // Validate without transforming or replacing the authored content.
    const entry = raw as LearningEntry;
    entriesById.set(entry.id, entry);
    if (!chaptersById.has(entry.chapterId)) add({ ...context, code: 'UNKNOWN_CHAPTER_ID', message: `Unknown chapter ${entry.chapterId}.` });
    const milestone = milestonesById.get(entry.milestoneId);
    if (!milestone) add({ ...context, code: 'UNKNOWN_MILESTONE_ID', message: `Unknown milestone ${entry.milestoneId}.` });
    else if (!milestone.chapterIds.includes(entry.chapterId) || paths.get(entry.chapterId)?.milestoneId !== entry.milestoneId) {
      add({ ...context, code: 'INVALID_ENTRY', message: 'Entry chapter and milestone do not match the course path.' });
    }
    if (entry.kind === 'chapter-studio' && (manifest.sourceHash !== inventory.sourceHash || manifest.sourcePageCount !== inventory.sourcePageCount)) {
      add({ ...context, code: manifest.sourceHash !== inventory.sourceHash ? 'SOURCE_HASH_MISMATCH' : 'INVALID_PAGE_SPAN', message: 'Studio source manifest does not describe the current book.' });
    }
    for (const ref of entry.sourceRefs) {
      const refContext = { ...context, sectionId: ref.sectionId };
      if (!sectionsById.has(ref.sectionId)) add({ ...refContext, code: 'UNKNOWN_SECTION_ID', message: `Unknown source section ${ref.sectionId}.` });
      else if (sectionChapter(ref.sectionId) !== entry.chapterId) add({ ...refContext, code: 'INVALID_ENTRY', message: 'Source section belongs to another chapter.' });
      if (ref.sourceHash !== inventory.sourceHash) add({ ...refContext, code: 'SOURCE_HASH_MISMATCH', message: 'Source reference hash differs from the indexed book.' });
      const printedStart = Number(ref.printedStart);
      const printedEnd = Number(ref.printedEnd ?? ref.printedStart);
      const pdfEnd = ref.pdfPageEnd ?? ref.pdfPageStart;
      if (!/^\d+$/.test(ref.printedStart) || !/^\d+$/.test(ref.printedEnd ?? ref.printedStart)
        || printedStart < 1 || printedEnd < printedStart || !Number.isInteger(ref.pdfPageStart) || !Number.isInteger(pdfEnd)
        || ref.pdfPageStart < 1 || pdfEnd < ref.pdfPageStart || pdfEnd > inventory.sourcePageCount
        || ref.pdfPageStart !== printedStart + 40 || pdfEnd !== printedEnd + 40) {
        add({ ...refContext, code: 'INVALID_PAGE_SPAN', message: 'Source pages must be ordered, within the book, and use the verified printed/PDF offset.' });
      }
      if (entry.kind === 'chapter-studio' && !manifestById.get(entry.id)?.references.some((verified) =>
        verified.sectionId === ref.sectionId && verified.printedStart === ref.printedStart
        && verified.pdfPageStart === ref.pdfPageStart && verified.sourceHash === ref.sourceHash)) {
        add({ ...refContext, code: 'MANIFEST_REFERENCE_MISSING', message: 'Studio reference is absent from the verified source manifest.' });
      }
    }
    if (entry.kind === 'chapter-studio') for (const coverage of entry.sectionCoverage) {
      if (!sectionsById.has(coverage.sectionId)) add({ ...context, sectionId: coverage.sectionId, code: 'UNKNOWN_SECTION_ID', message: `Unknown coverage section ${coverage.sectionId}.` });
      else if (sectionChapter(coverage.sectionId) !== entry.chapterId) add({ ...context, sectionId: coverage.sectionId, code: 'INVALID_ENTRY', message: 'Covered section belongs to another chapter.' });
    }
  }
  for (const path of paths.values()) for (const entryId of path.coreEntryIds) {
    if (!identityCounts.has(entryId)) add({ code: 'MISSING_CORE_ENTRY', entryId, chapterId: path.chapterId, message: `Core entry ${entryId} is missing.` });
    else {
      const entry = entriesById.get(entryId);
      if (entry && (entry.chapterId !== path.chapterId || entry.milestoneId !== path.milestoneId)) {
        add({ code: 'INVALID_ENTRY', entryId, chapterId: path.chapterId, message: 'Core entry does not belong to its declared chapter path.' });
      }
    }
  }
  const availableEntries = [...entriesById.values()].filter((entry) => !invalidIds.has(entry.id));
  const availableById = new Map(availableEntries.map((entry) => [entry.id, entry]));
  const sectionCounts = new Map<string, number>();
  const exerciseCounts = new Map<string, number>();
  for (const section of inventory.sections) {
    const chapterId = sectionChapter(section.id);
    if (chapterId) sectionCounts.set(chapterId, (sectionCounts.get(chapterId) ?? 0) + 1);
  }
  for (const exercise of inventory.exercises) {
    const chapterId = sectionChapter(exercise.sectionId);
    if (chapterId) exerciseCounts.set(chapterId, (exerciseCounts.get(chapterId) ?? 0) + 1);
  }
  const summariesById = new Map<string, ChapterLearningSummary>();
  for (const chapter of inventory.chapters) {
    const path = paths.get(chapter.id);
    const coreEntryIds = path?.coreEntryIds ?? [];
    const entries = coreEntryIds.flatMap((id) => availableById.get(id) ? [availableById.get(id)!] : []);
    const studios = entries.filter((entry) => entry.kind === 'chapter-studio');
    const detailed = coverage.getChapterCoverageSummary(chapter.id);
    summariesById.set(chapter.id, {
      chapterId: chapter.id, milestoneId: path?.milestoneId, title: chapter.title,
      purpose: studios[0]?.purpose, capability: studios[0]?.capability,
      coreEntryIds: [...coreEntryIds], availableEntryIds: entries.map((entry) => entry.id),
      studioCount: studios.length, deepLessonCount: entries.length - studios.length,
      questionCount: studios.reduce((total, studio) => total + studio.chapterCheckQuestionIds.length, 0),
      sourceSectionCount: sectionCounts.get(chapter.id) ?? 0, exerciseCount: exerciseCounts.get(chapter.id) ?? 0,
      authoredSectionCount: detailed.authoredSectionCount, authoredExerciseCount: detailed.authoredExerciseCount,
      classifiedNonSubstantiveCount: detailed.classifiedNonSubstantiveCount,
      unclassifiedSectionCount: detailed.unclassifiedSectionCount, remainingExerciseCount: detailed.remainingExerciseCount,
      availability: entries.length === 0 ? 'indexed' : entries.length === coreEntryIds.length ? 'available' : 'partial',
      issues: issues.filter((issue) => issue.chapterId === chapter.id || (issue.entryId !== undefined && coreEntryIds.includes(issue.entryId))),
    });
  }
  return {
    getAvailableLearningEntries: (): LearningEntry[] => [...availableEntries],
    validateLearningCatalog: (): CatalogIssue[] => issues.map((issue) => ({ ...issue })),
    getChapterLearningSummary(chapterId: string): ChapterLearningSummary {
      const summary = summariesById.get(chapterId);
      return summary ? { ...summary, coreEntryIds: [...summary.coreEntryIds], availableEntryIds: [...summary.availableEntryIds], issues: summary.issues.map((issue) => ({ ...issue })) }
        : { chapterId, milestoneId: undefined, title: chapterId, coreEntryIds: [], availableEntryIds: [], studioCount: 0,
          deepLessonCount: 0, questionCount: 0, sourceSectionCount: 0, exerciseCount: 0, availability: 'indexed',
          authoredSectionCount: 0, authoredExerciseCount: 0, classifiedNonSubstantiveCount: 0,
          unclassifiedSectionCount: 0, remainingExerciseCount: 0,
          issues: [{ code: 'UNKNOWN_CHAPTER_ID', chapterId, message: `Unknown chapter ${chapterId}.` }] };
    },
  };
}

// Production maps and validation are constructed once at module scope, outside render paths.
const catalog = createLearningCatalog({ entries: learningEntries, coverageCatalog: productionCoverageCatalog });
export const { getAvailableLearningEntries, getChapterLearningSummary, validateLearningCatalog } = catalog;
