import { describe, expect, it } from 'vitest';
import { chapterLearningMap } from '../../src/content/course-map';
import { getChapterLearningSummary, validateLearningCatalog } from '../../src/content/catalog';
import { coverageCatalog } from '../../src/content/coverage';
import { curriculumInventory } from '../../src/content/inventory';
import { learningEntries, learningEntryById, lessons } from '../../src/content/lessons';
import { questions } from '../../src/content/questions';

const lessonIds = ['gp-posterior-inference', 'gp-regression-practice'];
const essentialLessons = lessons.filter((lesson) => lesson.chapterId === 'chapter-18');

describe('Chapter 18 essential path', () => {
  it('makes two reviewed deep lessons available after the existing GP studio', () => {
    expect(essentialLessons.map((lesson) => lesson.id)).toEqual(lessonIds);
    expect(chapterLearningMap.get('chapter-18')?.coreEntryIds).toEqual(['gaussian-processes-studio', ...lessonIds]);
    expect(validateLearningCatalog()).toEqual([]);
    expect(getChapterLearningSummary('chapter-18')).toMatchObject({
      availability: 'available', deepLessonCount: 2, studioCount: 1, questionCount: 4,
      availableEntryIds: ['gaussian-processes-studio', ...lessonIds],
    });
    for (const lesson of essentialLessons) {
      expect(lesson).toMatchObject({ kind: 'deep-lesson', chapterId: 'chapter-18', milestoneId: 'broader', contentStatus: 'reviewed' });
      expect(learningEntryById.get(lesson.id)).toBe(lesson);
      for (const text of [lesson.title, lesson.question, ...Object.values(lesson.views), lesson.predictionPrompt,
        lesson.workedExample, lesson.independentTask, lesson.teachBackPrompt]) expect(text.trim()).not.toBe('');
      for (const values of [lesson.objectives, lesson.prerequisites, lesson.conceptIds, lesson.misconceptions]) {
        expect(values.length).toBeGreaterThan(0);
        expect(values.every((value) => value.trim().length > 0)).toBe(true);
      }
      expect(lesson.durationMinutes).toBeGreaterThan(0);
      expect(lesson.sourceRefs.length).toBeGreaterThan(0);
      for (const ref of lesson.sourceRefs) {
        expect(ref.sectionId).toMatch(/^18\.[23](\.|$)/);
        const indexed = curriculumInventory.sections.find((section) => section.id === ref.sectionId)!;
        expect(indexed).toBeDefined();
        expect(ref).toMatchObject({ ...indexed.source, companionCreated: true });
        expect(ref.printedEnd).toBe(ref.printedStart);
        expect(ref.pdfPageEnd).toBe(ref.pdfPageStart);
      }
    }
  });

  it('provides original conceptual, covariance, and application checks for each lesson', () => {
    const items = questions.filter((question) => lessonIds.includes(question.lessonId ?? ''));
    expect(items.map((question) => question.id)).toEqual(['q45', 'q46', 'q47', 'q48', 'q49', 'q50']);
    for (const lessonId of lessonIds) {
      const lesson = learningEntryById.get(lessonId)!;
      const checks = items.filter((question) => question.lessonId === lessonId);
      expect(checks).toHaveLength(3);
      expect(checks.map((question) => question.type)).toEqual(['multiple_choice', 'numeric', 'debugging']);
      expect(checks.filter((question) => question.applicationEvidence)).toHaveLength(1);
      for (const check of checks) {
        expect(check.sourceRefs).toEqual(lesson.sourceRefs);
        expect(check.conceptIds).toEqual(lesson.conceptIds);
        expect(check.hints.every((hint) => hint.trim().length > 15)).toBe(true);
        expect(check.explanation.length).toBeGreaterThan(35);
        if (check.type === 'debugging') expect(check.rubric?.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(items.find((question) => question.id === 'q46')).toMatchObject({ answer: 0.8, tolerance: 0.001 });
    expect(items.find((question) => question.id === 'q49')).toMatchObject({ answer: 2.1, tolerance: 0.001 });
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    expect(new Set(questions.map((question) => question.prompt)).size).toBe(questions.length);
  });

  it('gives the new lessons distinct teaching prose alongside the studio', () => {
    const entries = learningEntries.filter((entry) => entry.chapterId === 'chapter-18');
    expect(entries).toHaveLength(3);
    for (const select of [
      (entry: typeof entries[number]) => entry.workedExample,
      (entry: typeof entries[number]) => entry.independentTask,
      (entry: typeof entries[number]) => entry.teachBackPrompt,
      ...(['intuition', 'math', 'code', 'workConnection'] as const).map((view) => (entry: typeof entries[number]) => entry.views[view]),
    ]) expect(new Set(entries.map(select)).size).toBe(3);
  });

  it('leaves detailed source and exercise coverage unconverted', () => {
    expect(curriculumInventory.chapters).toHaveLength(22);
    expect(curriculumInventory.sections).toHaveLength(1019);
    expect(curriculumInventory.exercises).toHaveLength(609);
    expect(curriculumInventory.orientation).toHaveLength(2);
    const records = [...curriculumInventory.chapters, ...curriculumInventory.sections,
      ...curriculumInventory.exercises, ...curriculumInventory.orientation];
    expect(records.filter((record) => record.contentStatus === 'unconverted')).toHaveLength(1652);
    expect(coverageCatalog.getChapterCoverageSummary('chapter-18')).toEqual({
      chapterId: 'chapter-18', sourceSectionCount: 19, exerciseCount: 18,
      authoredSectionCount: 0, authoredExerciseCount: 0, classifiedNonSubstantiveCount: 0,
      unclassifiedSectionCount: 19, remainingExerciseCount: 18,
    });
  });
});
