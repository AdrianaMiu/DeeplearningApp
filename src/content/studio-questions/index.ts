import { makeQuestion } from '../question-helpers';
import { foundationQuestionSeeds } from './foundations';
import { sequenceQuestionSeeds } from './sequences';
import { systemsQuestionSeeds } from './systems';
import { advancedQuestionSeeds } from './advanced';

// Original companion checks: source references locate the concepts, not copied exercises.
export const studioQuestions = [
  ...foundationQuestionSeeds, ...sequenceQuestionSeeds,
  ...systemsQuestionSeeds, ...advancedQuestionSeeds,
].map(makeQuestion);
