import { expect, it } from 'vitest';
import { coverageCatalog } from '../../src/content/coverage';
import { curriculumInventory } from '../../src/content/inventory';

it('covers every indexed section and exercise from linear algebra through autodiff', () => {
  const inScope = (id: string) => /^2\.[345](\.|$)/.test(id);
  const missingSections = curriculumInventory.sections.filter(({ id }) =>
    inScope(id) && !coverageCatalog.getSectionActivity(id) && !coverageCatalog.getClassification(id),
  );
  const missingExercises = curriculumInventory.exercises.filter(({ id, sectionId }) =>
    inScope(sectionId) && !coverageCatalog.getExerciseActivity(id),
  );

  expect(coverageCatalog.validateCoverage()).toEqual([]);
  expect(missingSections.map(({ id }) => id)).toEqual([]);
  expect(missingExercises.map(({ id }) => id)).toEqual([]);
});

it('has no remaining source coverage gaps in Chapter 2', () => {
  expect(coverageCatalog.getChapterCoverageSummary('chapter-2')).toMatchObject({
    unclassifiedSectionCount: 0,
    remainingExerciseCount: 0,
  });
});

it('covers each indexed section and exercise from 3.1 through 3.4', () => {
  const inScope = (id: string) => /^3\.[1-4](\.|$)/.test(id);
  const sections = curriculumInventory.sections.filter(({ id }) => inScope(id));
  const exercises = curriculumInventory.exercises.filter(({ sectionId }) => inScope(sectionId));

  expect(sections.filter(({ id }) =>
    !coverageCatalog.getSectionActivity(id) && !coverageCatalog.getClassification(id),
  ).map(({ id }) => id)).toEqual([]);
  expect(exercises.filter(({ id }) => !coverageCatalog.getExerciseActivity(id)).map(({ id }) => id)).toEqual([]);
});

it('has no remaining source coverage gaps in Chapter 3', () => {
  expect(coverageCatalog.getChapterCoverageSummary('chapter-3')).toMatchObject({
    unclassifiedSectionCount: 0,
    remainingExerciseCount: 0,
  });
});
