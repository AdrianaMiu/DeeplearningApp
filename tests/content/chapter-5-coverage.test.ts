import { expect, it } from 'vitest';
import { coverageCatalog } from '../../src/content/coverage';

it('covers each Chapter 5 section and exercise in the production catalog', () => {
  expect(coverageCatalog.validateCoverage()).toEqual([]);
  expect(coverageCatalog.getChapterCoverageSummary('chapter-5')).toMatchObject({
    sourceSectionCount: 46,
    exerciseCount: 42,
    unclassifiedSectionCount: 0,
    remainingExerciseCount: 0,
  });
});
