import type { ExerciseActivity, SectionActivity } from './types';
import { exerciseSourceRef, sectionSourceRef } from './source-ref';

type SectionContent = Pick<SectionActivity, 'objectives' | 'explanation' | 'workedExample' | 'independentTask'>;
type ExerciseContent = Pick<ExerciseActivity, 'prompt' | 'hints' | 'evaluation'>;

export function defineSectionActivity(
  chapterId: string, sourceId: string, content: SectionContent,
): SectionActivity {
  return { chapterId, sourceId, contentStatus: 'reviewed', ...content,
    sourceRefs: [sectionSourceRef(sourceId)] };
}

export function defineExerciseActivity(
  chapterId: string, sourceId: string, content: ExerciseContent,
): ExerciseActivity {
  return { chapterId, sourceId, contentStatus: 'reviewed', ...content,
    sourceRefs: [exerciseSourceRef(sourceId)] };
}
