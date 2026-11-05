import { curriculumInventory } from '../inventory';
import { createCoverageCatalog } from './registry';
import { chapter1Classifications, chapter1ExerciseActivities, chapter1SectionActivities } from './chapter-1';
import {
  chapter2DataManipulationClassifications,
  chapter2DataManipulationExercises,
  chapter2DataManipulationSections,
} from './chapter-2-data-manipulation';

// Chapter modules are added here only after their source/content review passes.
export const sectionActivities = [...chapter1SectionActivities, ...chapter2DataManipulationSections];
export const exerciseActivities = [...chapter1ExerciseActivities, ...chapter2DataManipulationExercises];
export const coverageClassifications = [...chapter1Classifications, ...chapter2DataManipulationClassifications];

export const coverageCatalog = createCoverageCatalog({
  inventory: curriculumInventory,
  sectionActivities,
  exerciseActivities,
  classifications: coverageClassifications,
});
