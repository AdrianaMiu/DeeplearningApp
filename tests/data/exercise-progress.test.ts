import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';
import type { ExerciseProgressRecord } from '../../src/domain/types';

const base = (change: Partial<ExerciseProgressRecord> = {}): ExerciseProgressRecord => ({
  id: '1.9.exercise.1',
  exerciseId: '1.9.exercise.1',
  state: 'not_started',
  linkedAttemptIds: [],
  updatedAt: '2026-11-05T10:00:00.000Z',
  ...change,
});

describe('individual exercise progress', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;

  beforeEach(() => {
    db = createLearningDatabase(`exercise-progress-${crypto.randomUUID()}`);
    repository = new LearningRepository(db);
  });
  afterEach(async () => { db.close(); await db.delete(); });

  it('persists workflow state independently from mastery attempts', async () => {
    const discussed = base({ state: 'discussed', note: 'Compared approaches with the tutor.' });
    await repository.saveExerciseProgress(discussed);
    expect(await repository.getExerciseProgress()).toEqual([discussed]);
    expect(await repository.getAttempts()).toEqual([]);
  });

  it('requires evidence before an exercise can be attempted or completed', async () => {
    await expect(repository.saveExerciseProgress(base({ state: 'completed' }))).rejects.toThrow(/linked attempt/i);
    const completed = base({ state: 'completed', linkedAttemptIds: ['attempt-1'], completedAt: '2026-11-05T10:00:00.000Z' });
    await repository.saveExerciseProgress(completed);
    expect(await repository.getExerciseProgress()).toEqual([completed]);
  });

  it('rejects stale updates and mismatched stable IDs', async () => {
    await repository.saveExerciseProgress(base({ state: 'deferred', updatedAt: '2026-11-06T10:00:00.000Z' }));
    await expect(repository.saveExerciseProgress(base({ state: 'discussed' }))).rejects.toThrow(/older/i);
    await expect(repository.saveExerciseProgress(base({ exerciseId: '1.9.exercise.2' }))).rejects.toThrow(/match/i);
  });

  it('upgrades a version 1 database without losing existing learner records', async () => {
    db.close();
    await db.delete();
    const legacy = new Dexie(db.name);
    legacy.version(1).stores({
      attempts: '&id, questionId, timestamp, *conceptIds', reviews: '&id, conceptId, attemptId, timestamp, dueAt',
      sessions: '&id, lessonId, updatedAt', notes: '&id, conceptId, updatedAt, *tags', settings: '&id, updatedAt',
    });
    await legacy.table('attempts').add({ id: 'legacy-attempt', questionId: 'q', questionVersion: 1, conceptIds: [], response: '',
      timestamp: '2026-11-01T10:00:00.000Z', score: 0, gradingMethod: 'deterministic', confidence: 1,
      hintsUsed: 0, solutionRevealed: false, tutorSupportLevel: 'none', applicationEvidence: false });
    legacy.close();

    db = createLearningDatabase(db.name);
    repository = new LearningRepository(db);
    expect((await repository.getAttempts()).map((item) => item.id)).toEqual(['legacy-attempt']);
    expect(await repository.getExerciseProgress()).toEqual([]);
  });
});
