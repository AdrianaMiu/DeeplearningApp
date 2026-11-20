import { expect, it } from 'vitest';
import { coverageCatalog } from '../../src/content/coverage';

it('covers all indexed Chapter 4 sections and exercises without catalog issues', () => {
  expect(coverageCatalog.validateCoverage()).toEqual([]);
  expect(coverageCatalog.getChapterCoverageSummary('chapter-4')).toMatchObject({
    sourceSectionCount: 45,
    exerciseCount: 30,
    unclassifiedSectionCount: 0,
    remainingExerciseCount: 0,
  });
});
