import { describe, expect, it } from 'vitest';
import { curriculumInventory } from '../../src/content/inventory';
import { createCoverageCatalog } from '../../src/content/coverage/registry';
import {
  chapter2DataManipulationClassifications,
  chapter2DataManipulationExercises,
  chapter2DataManipulationSections,
} from '../../src/content/coverage/chapter-2-data-manipulation';
import { coverageCatalog } from '../../src/content/coverage';

describe('Chapter 2 data-manipulation coverage batch', () => {
  const catalog = createCoverageCatalog({
    inventory: curriculumInventory,
    sectionActivities: chapter2DataManipulationSections,
    exerciseActivities: chapter2DataManipulationExercises,
    classifications: chapter2DataManipulationClassifications,
  });

  it('covers section 2.1 without overstating the rest of Chapter 2', () => {
    expect(catalog.validateCoverage()).toEqual([]);
    expect(catalog.getChapterCoverageSummary('chapter-2')).toEqual({
      chapterId: 'chapter-2', sourceSectionCount: 55, exerciseCount: 45,
      authoredSectionCount: 12, authoredExerciseCount: 7,
      classifiedNonSubstantiveCount: 3, unclassifiedSectionCount: 40, remainingExerciseCount: 38,
    });
  });

  it('provides distinct reviewed learning activities and exercise workflows', () => {
    expect(new Set(chapter2DataManipulationSections.map((item) => item.explanation)).size).toBe(12);
    expect(chapter2DataManipulationSections.every((item) => item.explanation.length >= 120)).toBe(true);
    expect(chapter2DataManipulationExercises).toHaveLength(7);
    expect(chapter2DataManipulationExercises.every((item) => item.hints.length >= 2)).toBe(true);
  });

  it('is included as an honest partial batch in the production catalog', () => {
    expect(coverageCatalog.getChapterCoverageSummary('chapter-2')).toMatchObject({
      authoredSectionCount: 12, authoredExerciseCount: 7,
      unclassifiedSectionCount: 40, remainingExerciseCount: 38,
    });
  });
});
