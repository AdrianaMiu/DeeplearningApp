import type { SourceRef } from '../../domain/types';
import { curriculumInventory } from '../inventory';

export function sectionSourceRef(sectionId: string): SourceRef {
  const source = curriculumInventory.sections.find((item) => item.id === sectionId)?.source;
  if (!source) throw new Error(`Unknown section source ${sectionId}.`);
  return { ...source, companionCreated: true };
}

export function exerciseSourceRef(exerciseId: string): SourceRef {
  const exercise = curriculumInventory.exercises.find((item) => item.id === exerciseId);
  if (!exercise) throw new Error(`Unknown exercise source ${exerciseId}.`);
  return { ...exercise.source, companionCreated: true };
}
