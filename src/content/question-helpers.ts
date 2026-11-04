import type { Question, QuestionType } from '../domain/types';
import { learningEntryById } from './lessons';

export interface QuestionSeed {
  id: string; lessonId: string; type: QuestionType; prompt: string;
  answer: string | number | string[]; explanation: string; application?: boolean;
  options?: string[]; tolerance?: number; hints?: string[]; rubric?: string[];
}

export function makeQuestion(seed: QuestionSeed, index: number): Question {
  const lesson = learningEntryById.get(seed.lessonId);
  if (!lesson) throw new Error(`Unknown lesson ${seed.lessonId}`);
  return {
    id: seed.id,
    version: 1,
    lessonId: seed.lessonId,
    conceptIds: lesson.conceptIds,
    sourceRefs: lesson.sourceRefs,
    type: seed.type,
    prompt: seed.prompt,
    options: seed.options,
    answer: seed.answer,
    tolerance: seed.tolerance,
    rubric: seed.rubric ?? (seed.type === 'explanation' || seed.type === 'transfer' ? ['States the rule', 'Applies it to the given case', 'Uses shapes or quantities as evidence'] : undefined),
    hints: seed.hints ?? [`Return to the ${lesson.title} rule and identify the relevant axes or quantities.`, 'Work one step at a time before checking the result.'],
    misconceptionTags: lesson.misconceptions.map((_, misconceptionIndex) => `${lesson.id}-m${misconceptionIndex + 1}`),
    explanation: seed.explanation,
    difficulty: ((index % 3) + 1) as 1 | 2 | 3,
    applicationEvidence: Boolean(seed.application),
  };
}
