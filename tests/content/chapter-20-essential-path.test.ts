import { describe, expect, it } from 'vitest';
import { chapter20EssentialLessons } from '../../src/content/essential-lessons/chapter-20';
import { chapter20EssentialQuestionSeeds } from '../../src/content/essential-questions/chapter-20';
import { chapterLearningMap } from '../../src/content/course-map';
import { getChapterLearningSummary, validateLearningCatalog } from '../../src/content/catalog';
import { coverageCatalog } from '../../src/content/coverage';
import { curriculumInventory } from '../../src/content/inventory';
import { learningEntryById, lessons } from '../../src/content/lessons';
import { questions } from '../../src/content/questions';

describe('Chapter 20 essential path', () => {
  it('offers both reviewed deep lessons after the existing GAN studio', () => {
    expect(chapter20EssentialLessons.map((lesson) => lesson.id)).toEqual(['gan-training-step', 'dcgan-practice']);
    expect(chapterLearningMap.get('chapter-20')?.coreEntryIds).toEqual(['gan-studio', 'gan-training-step', 'dcgan-practice']);
    expect(validateLearningCatalog()).toEqual([]);
    expect(getChapterLearningSummary('chapter-20')).toMatchObject({
      availability: 'available', deepLessonCount: 2, studioCount: 1,
      availableEntryIds: ['gan-studio', 'gan-training-step', 'dcgan-practice'],
    });
    for (const lesson of chapter20EssentialLessons) {
      expect(lesson).toMatchObject({ kind: 'deep-lesson', chapterId: 'chapter-20', milestoneId: 'broader', contentStatus: 'reviewed' });
      expect(learningEntryById.get(lesson.id)).toBe(lesson);
      expect(lessons).toContain(lesson);
      for (const text of [lesson.title, lesson.question, ...Object.values(lesson.views), lesson.predictionPrompt,
        lesson.workedExample, lesson.independentTask, lesson.teachBackPrompt]) expect(text.trim()).not.toBe('');
      for (const values of [lesson.objectives, lesson.prerequisites, lesson.conceptIds, lesson.misconceptions]) {
        expect(values.length).toBeGreaterThan(0);
        expect(values.every((value) => value.trim().length > 0)).toBe(true);
      }
      expect(lesson.durationMinutes).toBeGreaterThan(0);
      expect(lesson.sourceRefs.length).toBeGreaterThan(0);
      for (const ref of lesson.sourceRefs) {
        expect(ref.sectionId).toMatch(/^20\.[12](\.|$)/);
        const indexed = curriculumInventory.sections.find((section) => section.id === ref.sectionId)!;
        expect(indexed).toBeDefined();
        expect(ref).toMatchObject({ ...indexed.source, companionCreated: true });
        expect(ref.printedEnd).toBe(ref.printedStart);
        expect(ref.pdfPageEnd).toBe(ref.pdfPageStart);
      }
    }
  });

  it('adds three distinct checks with application evidence for each new lesson', () => {
    expect(chapter20EssentialQuestionSeeds.map((seed) => seed.id)).toEqual(['q33', 'q34', 'q35', 'q36', 'q37', 'q38']);
    const items = questions.filter((question) => chapter20EssentialQuestionSeeds.some((seed) => seed.id === question.id));
    expect(items).toHaveLength(6);
    for (const lesson of chapter20EssentialLessons) {
      const checks = items.filter((question) => question.lessonId === lesson.id);
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
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  });

  it('keeps detailed coverage and source inventory statuses unchanged', () => {
    expect(curriculumInventory.chapters).toHaveLength(22);
    expect(curriculumInventory.sections).toHaveLength(1019);
    expect(curriculumInventory.exercises).toHaveLength(609);
    expect(curriculumInventory.orientation).toHaveLength(2);
    const records = [...curriculumInventory.chapters, ...curriculumInventory.sections,
      ...curriculumInventory.exercises, ...curriculumInventory.orientation];
    expect(records.filter((record) => record.contentStatus === 'unconverted')).toHaveLength(1652);
    expect(coverageCatalog.getChapterCoverageSummary('chapter-20')).toEqual({
      chapterId: 'chapter-20', sourceSectionCount: 14, exerciseCount: 3,
      authoredSectionCount: 0, authoredExerciseCount: 0, classifiedNonSubstantiveCount: 0,
      unclassifiedSectionCount: 14, remainingExerciseCount: 3,
    });
  });
});
