import type { CurriculumInventory } from '../../domain/types';
import { coverageClassificationSchema, exerciseActivitySchema, sectionActivitySchema } from './schema';
import type {
  ChapterCoverageSummary, CoverageClassification, CoverageIssue, ExerciseActivity, SectionActivity,
} from './types';

interface CoverageCatalogInput {
  inventory: CurriculumInventory;
  sectionActivities: readonly unknown[];
  exerciseActivities: readonly unknown[];
  classifications: readonly unknown[];
}

function rawId(value: unknown): string | undefined {
  return value && typeof value === 'object' && 'sourceId' in value && typeof value.sourceId === 'string'
    ? value.sourceId : undefined;
}

function normalizeProse(value: string): string {
  return value.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function createCoverageCatalog(input: CoverageCatalogInput) {
  const sections = new Map(input.inventory.sections.map((item) => [item.id, item]));
  const exercises = new Map(input.inventory.exercises.map((item) => [item.id, item]));
  const chapters = new Set(input.inventory.chapters.map((item) => item.id));
  const chapterCache = new Map<string, string>();
  function sectionChapter(sectionId: string, seen = new Set<string>()): string | undefined {
    if (chapterCache.has(sectionId)) return chapterCache.get(sectionId);
    if (seen.has(sectionId)) return undefined;
    seen.add(sectionId);
    const parent = sections.get(sectionId)?.parentId;
    const chapterId = parent && (chapters.has(parent) ? parent : sectionChapter(parent, seen));
    if (chapterId) chapterCache.set(sectionId, chapterId);
    return chapterId;
  }

  const issues: CoverageIssue[] = [];
  const invalid = new Set<string>();
  const add = (issue: CoverageIssue) => {
    issues.push(issue);
    if (issue.sourceId) invalid.add(issue.sourceId);
  };
  const identityCounts = new Map<string, number>();
  for (const value of [...input.sectionActivities, ...input.exerciseActivities]) {
    const sourceId = rawId(value);
    if (sourceId) identityCounts.set(sourceId, (identityCounts.get(sourceId) ?? 0) + 1);
  }
  for (const [sourceId, count] of identityCounts) if (count > 1) {
    add({ code: 'DUPLICATE_ACTIVITY_ID', sourceId, message: `Activity ${sourceId} occurs ${count} times.` });
  }

  const sectionActivities = new Map<string, SectionActivity>();
  const exerciseActivities = new Map<string, ExerciseActivity>();
  function validateActivity(value: unknown, kind: 'section' | 'exercise') {
    const sourceId = rawId(value);
    const parsed = (kind === 'section' ? sectionActivitySchema : exerciseActivitySchema).safeParse(value);
    if (!parsed.success) {
      add({ code: 'INVALID_ACTIVITY', sourceId, message: parsed.error.issues.map((item) => `${item.path.join('.')}: ${item.message}`).join('; ') });
      return;
    }
    const activity = value as SectionActivity | ExerciseActivity;
    const source = kind === 'section' ? sections.get(activity.sourceId) : exercises.get(activity.sourceId);
    if (!source) {
      add({ code: 'UNKNOWN_SOURCE_ID', sourceId: activity.sourceId, message: `Unknown ${kind} source ${activity.sourceId}.` });
      return;
    }
    const sourceSectionId = kind === 'section' ? activity.sourceId : (source as { sectionId: string }).sectionId;
    if (sectionChapter(sourceSectionId) !== activity.chapterId) {
      add({ code: 'CHAPTER_MISMATCH', sourceId: activity.sourceId, message: `Activity ${activity.sourceId} belongs to another chapter.` });
    }
    const sourceRef = activity.sourceRefs.find((ref) => ref.sectionId === sourceSectionId);
    if (!sourceRef || sourceRef.sourceHash !== input.inventory.sourceHash
      || sourceRef.pdfPageStart < source.source.pdfPageStart) {
      add({ code: 'SOURCE_REFERENCE_MISMATCH', sourceId: activity.sourceId, message: `Activity ${activity.sourceId} does not cite its indexed source.` });
    }
    if (kind === 'section') sectionActivities.set(activity.sourceId, activity as SectionActivity);
    else exerciseActivities.set(activity.sourceId, activity as ExerciseActivity);
  }
  input.sectionActivities.forEach((value) => validateActivity(value, 'section'));
  input.exerciseActivities.forEach((value) => validateActivity(value, 'exercise'));

  const proseOwners = new Map<string, string>();
  const proseFields = (activity: SectionActivity | ExerciseActivity): string[] => 'explanation' in activity
    ? [activity.explanation, activity.workedExample, activity.independentTask]
    : [activity.prompt];
  for (const activity of [...sectionActivities.values(), ...exerciseActivities.values()]) {
    if (invalid.has(activity.sourceId)) continue;
    for (const prose of proseFields(activity)) {
      const normalized = normalizeProse(prose);
      const owner = proseOwners.get(normalized);
      if (owner && owner !== activity.sourceId) {
        add({ code: 'DUPLICATE_CONTENT', sourceId: activity.sourceId,
          message: `Activity ${activity.sourceId} repeats reviewed teaching prose from ${owner}.` });
        break;
      }
      proseOwners.set(normalized, activity.sourceId);
    }
  }

  const classifications = new Map<string, CoverageClassification>();
  for (const value of input.classifications) {
    const parsed = coverageClassificationSchema.safeParse(value);
    const sourceId = rawId(value);
    if (!parsed.success) {
      add({ code: 'INVALID_CLASSIFICATION', sourceId, message: parsed.error.issues.map((item) => `${item.path.join('.')}: ${item.message}`).join('; ') });
      continue;
    }
    const classification = value as CoverageClassification;
    if (!sections.has(classification.sourceId)) {
      add({ code: 'UNKNOWN_SOURCE_ID', sourceId: classification.sourceId, message: `Unknown classified source ${classification.sourceId}.` });
      continue;
    }
    if (classifications.has(classification.sourceId)) {
      add({ code: 'INVALID_CLASSIFICATION', sourceId: classification.sourceId, message: `Source ${classification.sourceId} has multiple classifications.` });
      continue;
    }
    classifications.set(classification.sourceId, classification);
    if (identityCounts.has(classification.sourceId)) {
      add({ code: 'ACTIVITY_CLASSIFICATION_CONFLICT', sourceId: classification.sourceId, message: `Source ${classification.sourceId} cannot be both authored and non-substantive.` });
    }
  }

  const summaries = new Map<string, ChapterCoverageSummary>();
  for (const chapter of input.inventory.chapters) {
    const chapterSections = input.inventory.sections.filter((item) => sectionChapter(item.id) === chapter.id);
    const chapterExercises = input.inventory.exercises.filter((item) => sectionChapter(item.sectionId) === chapter.id);
    const authoredSections = chapterSections.filter((item) => sectionActivities.has(item.id) && !invalid.has(item.id));
    const authoredExercises = chapterExercises.filter((item) => exerciseActivities.has(item.id) && !invalid.has(item.id));
    const classified = chapterSections.filter((item) => classifications.has(item.id) && !invalid.has(item.id));
    summaries.set(chapter.id, {
      chapterId: chapter.id,
      sourceSectionCount: chapterSections.length,
      exerciseCount: chapterExercises.length,
      authoredSectionCount: authoredSections.length,
      authoredExerciseCount: authoredExercises.length,
      classifiedNonSubstantiveCount: classified.length,
      unclassifiedSectionCount: chapterSections.length - authoredSections.length - classified.length,
      remainingExerciseCount: chapterExercises.length - authoredExercises.length,
    });
  }

  return {
    validateCoverage: (): CoverageIssue[] => issues.map((issue) => ({ ...issue })),
    getSectionActivity: (sourceId: string): SectionActivity | undefined => invalid.has(sourceId) ? undefined : sectionActivities.get(sourceId),
    getExerciseActivity: (sourceId: string): ExerciseActivity | undefined => invalid.has(sourceId) ? undefined : exerciseActivities.get(sourceId),
    getClassification: (sourceId: string): CoverageClassification | undefined => invalid.has(sourceId) ? undefined : classifications.get(sourceId),
    getChapterCoverageSummary: (chapterId: string): ChapterCoverageSummary => summaries.get(chapterId) ?? {
      chapterId, sourceSectionCount: 0, exerciseCount: 0, authoredSectionCount: 0, authoredExerciseCount: 0,
      classifiedNonSubstantiveCount: 0, unclassifiedSectionCount: 0, remainingExerciseCount: 0,
    },
  };
}

export type CoverageCatalog = ReturnType<typeof createCoverageCatalog>;
