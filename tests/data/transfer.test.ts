import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Attempt, ExerciseProgressRecord, LearnerSettings, ProgressExportV1 } from '../../src/domain/types';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';
import {
  exportProgress,
  importProgress,
  previewImport,
  resetProgress,
} from '../../src/data/transfer';

const contentVersion = 'd2l-2026.11-v1';

function attempt(id: string, timestamp = '2026-11-03T08:00:00.000Z', questionId = 'diagnostic-tensor-shape'): Attempt {
  return {
    id,
    questionId,
    questionVersion: 1,
    conceptIds: ['tensor-shapes'],
    response: '[6, 4]',
    timestamp,
    score: 1,
    gradingMethod: 'deterministic',
    confidence: 4,
    hintsUsed: 0,
    solutionRevealed: false,
    tutorSupportLevel: 'none',
    applicationEvidence: false,
  };
}

function settings(updatedAt: string, language: LearnerSettings['language'] = 'en'): LearnerSettings {
  return {
    id: 'learner-settings',
    language,
    normalSessionMinutes: 25,
    minimumSessionMinutes: 8,
    reviewBudgetMinutes: 10,
    guidedOrder: true,
    lowEnergyMode: false,
    diagnosticCompleted: false,
    diagnosticSkipped: false,
    updatedAt,
  };
}

function payload(overrides: Partial<ProgressExportV1> = {}): ProgressExportV1 {
  return {
    schemaVersion: 1,
    contentVersion,
    exportedAt: '2026-11-03T09:00:00.000Z',
    attempts: [],
    reviews: [],
    sessions: [],
    notes: [],
    exerciseProgress: [],
    settings: settings('2026-11-03T08:00:00.000Z'),
    ...overrides,
  };
}

describe('local learning data transfer', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;

  beforeEach(() => {
    db = createLearningDatabase(`learning-test-${crypto.randomUUID()}`);
    repository = new LearningRepository(db);
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('round-trips guided lesson reasoning in a version 1 backup', async () => {
    const session = { id: 'guided', lessonId: 'tensor-shapes', goal: 'Shapes', startedAt: '2026-11-03T08:00:00.000Z', updatedAt: '2026-11-03T08:00:00.000Z', resumeStep: 'reflect', prediction: 'My guess', reflection: 'My explanation', workedRevealed: true };
    await repository.saveSession(session);
    const backup = await exportProgress(db, contentVersion);
    await resetProgress(db);
    await importProgress(db, JSON.stringify(backup), 'merge');
    expect(await repository.getSessions()).toEqual([session]);
  });

  it('keeps attempts append-only and rejects a duplicate UUID', async () => {
    await repository.appendAttempt(attempt('attempt-1'));

    await expect(repository.appendAttempt(attempt('attempt-1'))).rejects.toThrow();
    await expect(repository.getAttempts()).resolves.toEqual([attempt('attempt-1')]);
  });

  it('merges newer same-ID lesson reasoning without rolling it back from older backups', async () => {
    const older = { id: 'guided', lessonId: 'tensor-shapes', goal: 'Shapes', startedAt: '2026-11-03T08:00:00.000Z', updatedAt: '2026-11-03T08:00:00.000Z', resumeStep: 'predict', prediction: 'Old guess', reflection: '' };
    const newer = { ...older, updatedAt: '2026-11-04T08:00:00.000Z', resumeStep: 'reflect', prediction: 'Revised guess', reflection: 'New explanation', workedRevealed: true };
    await repository.saveSession(older);
    await importProgress(db, JSON.stringify(payload({ sessions: [newer] })), 'merge');
    expect(await repository.getSessions()).toEqual([newer]);
    await importProgress(db, JSON.stringify(payload({ sessions: [older] })), 'merge');
    expect(await repository.getSessions()).toEqual([newer]);
  });

  it('merges distinct attempts while ignoring identical UUIDs', async () => {
    await repository.appendAttempt(attempt('attempt-1'));
    await repository.saveSettings(settings('2026-11-03T07:00:00.000Z'));

    const result = await importProgress(
      db,
      JSON.stringify(payload({ attempts: [attempt('attempt-1'), attempt('attempt-2')] })),
      'merge',
    );

    expect(result).toMatchObject({ mode: 'merge', added: { attempts: 1 } });
    await expect(repository.getAttempts()).resolves.toHaveLength(2);
  });

  it('merges only newer same-ID exercise workflow records', async () => {
    const older: ExerciseProgressRecord = { id: '1.9.exercise.1', exerciseId: '1.9.exercise.1', state: 'deferred',
      linkedAttemptIds: [], updatedAt: '2026-11-03T08:00:00.000Z' };
    const newer: ExerciseProgressRecord = { ...older, state: 'completed', linkedAttemptIds: ['attempt-1'],
      completedAt: '2026-11-04T08:00:00.000Z', updatedAt: '2026-11-04T08:00:00.000Z' };
    await repository.saveExerciseProgress(older);
    await importProgress(db, JSON.stringify(payload({ attempts: [attempt('attempt-1', undefined, '1.9.exercise.1')], exerciseProgress: [newer] })), 'merge');
    expect(await repository.getExerciseProgress()).toEqual([newer]);
    await importProgress(db, JSON.stringify(payload({ exerciseProgress: [older] })), 'merge');
    expect(await repository.getExerciseProgress()).toEqual([newer]);
  });

  it('rejects exercise evidence links that resolve to no imported or existing attempt', async () => {
    const unsupported: ExerciseProgressRecord = { id: '1.9.exercise.1', exerciseId: '1.9.exercise.1',
      state: 'completed', linkedAttemptIds: ['invented'], completedAt: '2026-11-04T08:00:00.000Z',
      updatedAt: '2026-11-04T08:00:00.000Z' };
    await expect(importProgress(db, JSON.stringify(payload({ exerciseProgress: [unsupported] })), 'replace'))
      .rejects.toThrow(/linked attempt invented does not exist/i);
    await repository.appendAttempt(attempt('already-local', undefined, '1.9.exercise.1'));
    await expect(importProgress(db, JSON.stringify(payload({ exerciseProgress: [{ ...unsupported,
      linkedAttemptIds: ['already-local'] }] })), 'merge')).resolves.toMatchObject({ mode: 'merge' });
  });

  it('imports older version 1 backups without an exercise progress property', async () => {
    const oldBackup = payload();
    const { exerciseProgress: _omitted, ...withoutExerciseProgress } = oldBackup;
    await importProgress(db, JSON.stringify(withoutExerciseProgress), 'replace');
    expect(await repository.getExerciseProgress()).toEqual([]);
  });

  it('keeps the newest settings record during merge', async () => {
    await repository.saveSettings(settings('2026-11-03T10:00:00.000Z', 'ro-help'));

    await importProgress(
      db,
      JSON.stringify(payload({ settings: settings('2026-11-03T08:00:00.000Z', 'en') })),
      'merge',
    );
    expect((await repository.getSettings()).language).toBe('ro-help');

    await importProgress(
      db,
      JSON.stringify(payload({ settings: settings('2026-11-04T08:00:00.000Z', 'en') })),
      'merge',
    );
    expect((await repository.getSettings()).language).toBe('en');
  });

  it('replaces all learner data only after a valid payload is ready', async () => {
    await repository.appendAttempt(attempt('old-attempt'));
    await repository.saveSettings(settings('2026-11-03T07:00:00.000Z'));

    await importProgress(
      db,
      JSON.stringify(payload({ attempts: [attempt('new-attempt')] })),
      'replace',
    );

    await expect(repository.getAttempts()).resolves.toEqual([attempt('new-attempt')]);
  });

  it('previews counts and rejects invalid imports without changing stored data', async () => {
    await repository.appendAttempt(attempt('safe-attempt'));

    const valid = JSON.stringify(payload({ attempts: [attempt('incoming')] }));
    expect(previewImport(valid)).toMatchObject({
      valid: true,
      contentVersion,
      counts: { attempts: 1, reviews: 0, sessions: 0, notes: 0 },
    });

    await expect(importProgress(db, '{"schemaVersion":2}', 'replace')).rejects.toThrow();
    await expect(repository.getAttempts()).resolves.toEqual([attempt('safe-attempt')]);
  });

  it('round-trips every local learner collection and can reset them', async () => {
    const original = payload({
      attempts: [attempt('round-trip', undefined, '1.9.exercise.1')],
      reviews: [{
        id: 'review-1',
        conceptId: 'tensor-shapes',
        attemptId: 'round-trip',
        timestamp: '2026-11-03T08:05:00.000Z',
        intervalIndex: 0,
        dueAt: '2026-11-04T08:05:00.000Z',
      }],
      sessions: [{
        id: 'session-1',
        lessonId: 'tensor-shapes-operations',
        goal: 'Understand shape transformations',
        startedAt: '2026-11-03T08:00:00.000Z',
        updatedAt: '2026-11-03T08:10:00.000Z',
        resumeStep: 'independent-task',
      }],
      notes: [{
        id: 'note-1',
        conceptId: 'tensor-shapes',
        title: 'Shape rule',
        body: 'Dimensions describe axis lengths.',
        tags: ['tensor'],
        createdAt: '2026-11-03T08:02:00.000Z',
        updatedAt: '2026-11-03T08:02:00.000Z',
      }],
      exerciseProgress: [{
        id: '1.9.exercise.1', exerciseId: '1.9.exercise.1', state: 'completed', linkedAttemptIds: ['round-trip'],
        attemptedAt: '2026-11-03T08:00:00.000Z', completedAt: '2026-11-03T08:05:00.000Z', updatedAt: '2026-11-03T08:05:00.000Z',
      }],
      settings: settings('2026-11-03T08:15:00.000Z', 'ro-help'),
    });
    await importProgress(db, JSON.stringify(original), 'replace');

    const exported = await exportProgress(db, contentVersion, new Date('2026-11-03T12:00:00.000Z'));
    expect(exported).toEqual({ ...original, exportedAt: '2026-11-03T12:00:00.000Z' });

    await resetProgress(db);
    await expect(repository.getAttempts()).resolves.toEqual([]);
    await expect(repository.getNotes()).resolves.toEqual([]);
  });
});
