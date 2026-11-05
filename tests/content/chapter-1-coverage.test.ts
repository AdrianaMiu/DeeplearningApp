import { describe, expect, it } from 'vitest';
import { curriculumInventory } from '../../src/content/inventory';
import { createCoverageCatalog } from '../../src/content/coverage/registry';
import { chapter1Classifications, chapter1ExerciseActivities, chapter1SectionActivities } from '../../src/content/coverage/chapter-1';
import { coverageCatalog } from '../../src/content/coverage';

describe('complete Chapter 1 companion coverage', () => {
  const catalog = createCoverageCatalog({ inventory: curriculumInventory,
    sectionActivities: chapter1SectionActivities,
    exerciseActivities: chapter1ExerciseActivities,
    classifications: chapter1Classifications,
  });

  it('covers every substantive section and every individual exercise', () => {
    expect(catalog.validateCoverage()).toEqual([]);
    expect(catalog.getChapterCoverageSummary('chapter-1')).toEqual({
      chapterId: 'chapter-1', sourceSectionCount: 17, exerciseCount: 4,
      authoredSectionCount: 15, authoredExerciseCount: 4,
      classifiedNonSubstantiveCount: 2, unclassifiedSectionCount: 0, remainingExerciseCount: 0,
    });
    expect(chapter1Classifications).toEqual(expect.arrayContaining([
      { sourceId: '1.8', kind: 'summary' }, { sourceId: '1.9', kind: 'exercise-heading' },
    ]));
  });

  it('uses distinct original learning tasks rather than repeated title templates', () => {
    expect(new Set(chapter1SectionActivities.map((item) => item.explanation)).size).toBe(15);
    expect(new Set(chapter1SectionActivities.map((item) => item.independentTask)).size).toBe(15);
    expect(new Set(chapter1ExerciseActivities.map((item) => item.prompt)).size).toBe(4);
    expect(chapter1SectionActivities.every((item) => item.explanation.length >= 120)).toBe(true);
    expect(chapter1ExerciseActivities.every((item) => item.hints.length >= 2)).toBe(true);
  });

  it('is included in the production coverage catalog', () => {
    expect(coverageCatalog.getChapterCoverageSummary('chapter-1')).toMatchObject({
      authoredSectionCount: 15, authoredExerciseCount: 4, unclassifiedSectionCount: 0, remainingExerciseCount: 0,
    });
  });
});
