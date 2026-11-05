import { z } from 'zod';

import type { ProgressExportV1 } from '../domain/types';
import type { LearningDatabase } from './db';
import { LearningRepository } from './repository';

const isoDate = z.string().datetime({ offset: true });
const supportLevel = z.enum(['none', 'hint', 'explanation', 'feedback', 'revealed']);

const attemptSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  questionVersion: z.number().int().positive(),
  conceptIds: z.array(z.string().min(1)),
  response: z.string(),
  timestamp: isoDate,
  score: z.number().min(0).max(1),
  gradingMethod: z.enum(['deterministic', 'rubric', 'ai_provisional']),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  hintsUsed: z.number().int().nonnegative(),
  solutionRevealed: z.boolean(),
  tutorSupportLevel: supportLevel,
  applicationEvidence: z.boolean(),
}).strict();

const reviewSchema = z.object({
  id: z.string().min(1),
  conceptId: z.string().min(1),
  attemptId: z.string().min(1),
  timestamp: isoDate,
  intervalIndex: z.number().int().nonnegative(),
  dueAt: isoDate,
}).strict();

const sessionSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1).optional(),
  goal: z.string(),
  startedAt: isoDate,
  updatedAt: isoDate,
  completedAt: isoDate.optional(),
  resumeStep: z.string(),
  prediction: z.string().optional(),
  workedRevealed: z.boolean().optional(),
  reflection: z.string().optional(),
}).strict();

const noteSchema = z.object({
  id: z.string().min(1),
  conceptId: z.string().min(1).optional(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict();

const exerciseProgressSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  state: z.enum(['not_started', 'attempted', 'completed', 'deferred', 'discussed']),
  linkedAttemptIds: z.array(z.string().min(1)),
  updatedAt: isoDate,
  attemptedAt: isoDate.optional(),
  completedAt: isoDate.optional(),
  note: z.string().optional(),
}).strict().superRefine((value, context) => {
  if (value.id !== value.exerciseId) context.addIssue({ code: 'custom', message: 'Exercise progress IDs must match.' });
  if ((value.state === 'attempted' || value.state === 'completed') && value.linkedAttemptIds.length === 0) {
    context.addIssue({ code: 'custom', message: `${value.state} exercise progress requires a linked attempt.` });
  }
});

const settingsSchema = z.object({
  id: z.literal('learner-settings'),
  language: z.enum(['en', 'ro-help']),
  normalSessionMinutes: z.number().int().positive(),
  minimumSessionMinutes: z.number().int().positive(),
  reviewBudgetMinutes: z.number().int().nonnegative(),
  guidedOrder: z.boolean(),
  lowEnergyMode: z.boolean(),
  diagnosticCompleted: z.boolean(),
  diagnosticSkipped: z.boolean(),
  updatedAt: isoDate,
}).strict();

export const progressExportV1Schema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1),
  exportedAt: isoDate,
  attempts: z.array(attemptSchema),
  reviews: z.array(reviewSchema),
  sessions: z.array(sessionSchema),
  notes: z.array(noteSchema),
  exerciseProgress: z.array(exerciseProgressSchema).optional().default([]),
  settings: settingsSchema,
}).strict();

export type ImportMode = 'merge' | 'replace';

export type ImportPreview =
  | {
      valid: true;
      contentVersion: string;
      exportedAt: string;
      counts: { attempts: number; reviews: number; sessions: number; notes: number; exerciseProgress: number };
    }
  | { valid: false; error: string };

export interface ImportResult {
  mode: ImportMode;
  added: { attempts: number; reviews: number; sessions: number; notes: number; exerciseProgress: number };
}

function decode(raw: string): ProgressExportV1 {
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const result = progressExportV1Schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Unsupported or invalid progress file: ${result.error.issues[0]?.message ?? 'validation failed'}`);
  }
  return result.data;
}

export function previewImport(raw: string): ImportPreview {
  try {
    const value = decode(raw);
    return {
      valid: true,
      contentVersion: value.contentVersion,
      exportedAt: value.exportedAt,
      counts: {
        attempts: value.attempts.length,
        reviews: value.reviews.length,
        sessions: value.sessions.length,
        notes: value.notes.length,
        exerciseProgress: value.exerciseProgress.length,
      },
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid progress file.' };
  }
}

async function unseen<T extends { id: string }>(
  values: T[],
  existingKeys: string[],
): Promise<T[]> {
  const seen = new Set(existingKeys);
  return values.filter((value) => {
    if (seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

export async function importProgress(
  db: LearningDatabase,
  raw: string,
  mode: ImportMode,
): Promise<ImportResult> {
  const value = decode(raw);
  const added = { attempts: 0, reviews: 0, sessions: 0, notes: 0, exerciseProgress: 0 };

  await db.transaction('rw', [db.attempts, db.reviews, db.sessions, db.notes, db.exerciseProgress, db.settings], async () => {
    if (mode === 'replace') {
      await Promise.all(db.tables.map((table) => table.clear()));
      await Promise.all([
        db.attempts.bulkAdd(value.attempts),
        db.reviews.bulkAdd(value.reviews),
        db.sessions.bulkAdd(value.sessions),
        db.notes.bulkAdd(value.notes),
        db.exerciseProgress.bulkAdd(value.exerciseProgress),
        db.settings.add(value.settings),
      ]);
      added.attempts = value.attempts.length;
      added.reviews = value.reviews.length;
      added.sessions = value.sessions.length;
      added.notes = value.notes.length;
      added.exerciseProgress = value.exerciseProgress.length;
      return;
    }

    const localSessions = new Map((await db.sessions.toArray()).map((session) => [session.id, session]));
    const sessions = value.sessions.filter((session) => {
      const local = localSessions.get(session.id);
      return !local || Date.parse(session.updatedAt) > Date.parse(local.updatedAt);
    });
    const localExerciseProgress = new Map((await db.exerciseProgress.toArray()).map((record) => [record.id, record]));
    const exerciseProgress = value.exerciseProgress.filter((record) => {
      const local = localExerciseProgress.get(record.id);
      return !local || Date.parse(record.updatedAt) > Date.parse(local.updatedAt);
    });
    const [attempts, reviews, notes, currentSettings] = await Promise.all([
      unseen(value.attempts, (await db.attempts.toCollection().primaryKeys()) as string[]),
      unseen(value.reviews, (await db.reviews.toCollection().primaryKeys()) as string[]),
      unseen(value.notes, (await db.notes.toCollection().primaryKeys()) as string[]),
      db.settings.get('learner-settings'),
    ]);
    await Promise.all([
      db.attempts.bulkAdd(attempts),
      db.reviews.bulkAdd(reviews),
      db.sessions.bulkPut(sessions),
      db.notes.bulkAdd(notes),
      db.exerciseProgress.bulkPut(exerciseProgress),
      !currentSettings || value.settings.updatedAt > currentSettings.updatedAt
        ? db.settings.put(value.settings)
        : Promise.resolve('learner-settings'),
    ]);
    added.attempts = attempts.length;
    added.reviews = reviews.length;
    added.sessions = sessions.filter((session) => !localSessions.has(session.id)).length;
    added.notes = notes.length;
    added.exerciseProgress = exerciseProgress.filter((record) => !localExerciseProgress.has(record.id)).length;
  });

  return { mode, added };
}

export async function exportProgress(
  db: LearningDatabase,
  contentVersion: string,
  now = new Date(),
): Promise<ProgressExportV1> {
  const snapshot = await new LearningRepository(db).snapshot();
  return {
    schemaVersion: 1,
    contentVersion,
    exportedAt: now.toISOString(),
    ...snapshot,
  };
}

export async function resetProgress(db: LearningDatabase): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
}
