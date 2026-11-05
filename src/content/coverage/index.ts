import { curriculumInventory } from '../inventory';
import { createCoverageCatalog } from './registry';

// Chapter modules are added here only after their source/content review passes.
export const sectionActivities = [];
export const exerciseActivities = [];
export const coverageClassifications = [];

export const coverageCatalog = createCoverageCatalog({
  inventory: curriculumInventory,
  sectionActivities,
  exerciseActivities,
  classifications: coverageClassifications,
});
