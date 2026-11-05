import { curriculumInventory } from '../inventory';
import { createCoverageCatalog } from './registry';
import { chapter1Classifications, chapter1ExerciseActivities, chapter1SectionActivities } from './chapter-1';

// Chapter modules are added here only after their source/content review passes.
export const sectionActivities = [...chapter1SectionActivities];
export const exerciseActivities = [...chapter1ExerciseActivities];
export const coverageClassifications = [...chapter1Classifications];

export const coverageCatalog = createCoverageCatalog({
  inventory: curriculumInventory,
  sectionActivities,
  exerciseActivities,
  classifications: coverageClassifications,
});
