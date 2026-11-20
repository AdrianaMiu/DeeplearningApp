import { curriculumInventory } from '../inventory';
import { createCoverageCatalog } from './registry';
import { classificationFoundationSections, classificationFoundationExercises, classificationFoundationClassifications } from './chapter-4-foundations';
import { classificationTrainingSections, classificationTrainingExercises, classificationTrainingClassifications } from './chapter-4-training';
import { classificationGeneralizationSections, classificationGeneralizationExercises, classificationGeneralizationClassifications } from './chapter-4-generalization';
import { documentationClassifications, documentationSections } from './chapter-2-documentation';
import { probabilityClassifications, probabilityExercises, probabilitySections } from './chapter-2-probability';
import { regressionClassifications, regressionExercises, regressionSections } from './chapter-3-regression';
import { trainingClassifications, trainingExercises, trainingSections } from './chapter-3-training';
import { conciseClassifications, conciseExercises, conciseSections } from './chapter-3-concise';
import { generalizationClassifications, generalizationExercises, generalizationSections } from './chapter-3-generalization';
import { weightDecayClassifications, weightDecayExercises, weightDecaySections } from './chapter-3-weight-decay';
import { remainingAlgebraExercises } from './chapter-2-algebra-exercises';
import { autodiffClassifications, autodiffExercises, autodiffSections } from './chapter-2-autodiff';
import { calculusClassifications, calculusExercises, calculusSections } from './chapter-2-calculus';
import { linearAlgebraClassifications, linearAlgebraExercises, linearAlgebraSections } from './chapter-2-linear-algebra';
import { chapter1Classifications, chapter1ExerciseActivities, chapter1SectionActivities } from './chapter-1';
import {
  chapter2DataManipulationClassifications,
  chapter2DataManipulationExercises,
  chapter2DataManipulationSections,
} from './chapter-2-data-manipulation';

// Chapter modules are added here only after their source/content review passes.
export const sectionActivities = [
  ...chapter1SectionActivities, ...chapter2DataManipulationSections, ...linearAlgebraSections,
  ...calculusSections, ...autodiffSections, ...probabilitySections, ...documentationSections,
  ...regressionSections, ...trainingSections, ...conciseSections, ...generalizationSections, ...weightDecaySections,
  ...classificationFoundationSections, ...classificationTrainingSections, ...classificationGeneralizationSections,
];
export const exerciseActivities = [
  ...chapter1ExerciseActivities, ...chapter2DataManipulationExercises, ...linearAlgebraExercises,
  ...remainingAlgebraExercises, ...calculusExercises, ...autodiffExercises, ...probabilityExercises,
  ...regressionExercises, ...trainingExercises, ...conciseExercises, ...generalizationExercises, ...weightDecayExercises,
  ...classificationFoundationExercises, ...classificationTrainingExercises, ...classificationGeneralizationExercises,
];
export const coverageClassifications = [
  ...chapter1Classifications, ...chapter2DataManipulationClassifications, ...linearAlgebraClassifications,
  ...calculusClassifications, ...autodiffClassifications, ...probabilityClassifications,
  ...documentationClassifications, ...regressionClassifications, ...trainingClassifications,
  ...conciseClassifications, ...generalizationClassifications, ...weightDecayClassifications,
  ...classificationFoundationClassifications, ...classificationTrainingClassifications, ...classificationGeneralizationClassifications,
];

export const coverageCatalog = createCoverageCatalog({
  inventory: curriculumInventory,
  sectionActivities,
  exerciseActivities,
  classifications: coverageClassifications,
});
