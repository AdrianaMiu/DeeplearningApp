import type {
  Attempt,
  LearnerSettings,
  NoteRecord,
  ReviewEvent,
  SessionRecord,
} from '../domain/types';
import type { LearningDatabase } from './db';

export interface LearningSnapshot {
  attempts: Attempt[];
  reviews: ReviewEvent[];
  sessions: SessionRecord[];
  notes: NoteRecord[];
  settings: LearnerSettings;
}

export const defaultLearnerSettings = (updatedAt = new Date(0).toISOString()): LearnerSettings => ({
  id: 'learner-settings',
  language: 'en',
  normalSessionMinutes: 25,
  minimumSessionMinutes: 8,
  reviewBudgetMinutes: 10,
  guidedOrder: true,
  lowEnergyMode: false,
  diagnosticCompleted: false,
  diagnosticSkipped: false,
  updatedAt,
});

export class LearningRepository {
  constructor(readonly db: LearningDatabase) {}

  appendAttempt(value: Attempt): Promise<string> {
    return this.db.attempts.add(value);
  }

  appendReview(value: ReviewEvent): Promise<string> {
    return this.db.reviews.add(value);
  }

  saveSession(value: SessionRecord): Promise<string> {
    return this.db.sessions.put(value);
  }

  saveNote(value: NoteRecord): Promise<string> {
    return this.db.notes.put(value);
  }

  saveSettings(value: LearnerSettings): Promise<string> {
    return this.db.settings.put(value);
  }

  getAttempts(): Promise<Attempt[]> {
    return this.db.attempts.orderBy('timestamp').toArray();
  }

  getReviews(): Promise<ReviewEvent[]> {
    return this.db.reviews.orderBy('timestamp').toArray();
  }

  getSessions(): Promise<SessionRecord[]> {
    return this.db.sessions.orderBy('updatedAt').toArray();
  }

  getNotes(): Promise<NoteRecord[]> {
    return this.db.notes.orderBy('updatedAt').toArray();
  }

  async getSettings(): Promise<LearnerSettings> {
    return (await this.db.settings.get('learner-settings')) ?? defaultLearnerSettings();
  }

  async snapshot(): Promise<LearningSnapshot> {
    const [attempts, reviews, sessions, notes, settings] = await Promise.all([
      this.getAttempts(),
      this.getReviews(),
      this.getSessions(),
      this.getNotes(),
      this.getSettings(),
    ]);
    return { attempts, reviews, sessions, notes, settings };
  }
}
