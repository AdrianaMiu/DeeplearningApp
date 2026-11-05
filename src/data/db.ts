import Dexie, { type EntityTable } from 'dexie';

import type {
  Attempt,
  ExerciseProgressRecord,
  LearnerSettings,
  NoteRecord,
  ReviewEvent,
  SessionRecord,
} from '../domain/types';

export class LearningDatabase extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>;
  reviews!: EntityTable<ReviewEvent, 'id'>;
  sessions!: EntityTable<SessionRecord, 'id'>;
  notes!: EntityTable<NoteRecord, 'id'>;
  settings!: EntityTable<LearnerSettings, 'id'>;
  exerciseProgress!: EntityTable<ExerciseProgressRecord, 'id'>;

  constructor(name = 'deep-learning-companion') {
    super(name);
    this.version(1).stores({
      attempts: '&id, questionId, timestamp, *conceptIds',
      reviews: '&id, conceptId, attemptId, timestamp, dueAt',
      sessions: '&id, lessonId, updatedAt',
      notes: '&id, conceptId, updatedAt, *tags',
      settings: '&id, updatedAt',
    });
    this.version(2).stores({
      attempts: '&id, questionId, timestamp, *conceptIds',
      reviews: '&id, conceptId, attemptId, timestamp, dueAt',
      sessions: '&id, lessonId, updatedAt',
      notes: '&id, conceptId, updatedAt, *tags',
      settings: '&id, updatedAt',
      exerciseProgress: '&id, exerciseId, state, updatedAt, *linkedAttemptIds',
    });
  }
}

export function createLearningDatabase(name?: string): LearningDatabase {
  return new LearningDatabase(name);
}

export const learningDatabase = createLearningDatabase();
