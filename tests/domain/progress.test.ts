import { describe, expect, it } from 'vitest';
import type { Attempt } from '../../src/domain/types';
import { deriveConceptProgress, recommendNextTask } from '../../src/domain/progress';
import { REVIEW_INTERVAL_DAYS, scheduleReview } from '../../src/domain/review';

const attempt = (overrides: Partial<Attempt>): Attempt => ({
  id: crypto.randomUUID(),
  questionId: 'q-default',
  questionVersion: 1,
  conceptIds: ['broadcasting'],
  response: 'answer',
  timestamp: '2026-01-01T10:00:00.000Z',
  score: 1,
  gradingMethod: 'deterministic',
  confidence: 4,
  hintsUsed: 0,
  solutionRevealed: false,
  tutorSupportLevel: 'none',
  applicationEvidence: false,
  ...overrides,
});

describe('review scheduling', () => {
  it('uses the transparent 1, 3, 7, 14, and 30 day sequence', () => {
    expect(REVIEW_INTERVAL_DAYS).toEqual([1, 3, 7, 14, 30]);
    expect(scheduleReview('2026-01-01T10:00:00.000Z', 2, true, 5)).toMatchObject({
      intervalIndex: 3,
      dueAt: '2026-01-15T10:00:00.000Z',
    });
  });

  it('returns an incorrect or low-confidence attempt to an early review without deleting evidence', () => {
    expect(scheduleReview('2026-01-01T10:00:00.000Z', 4, false, 5).intervalIndex).toBe(0);
    expect(scheduleReview('2026-01-01T10:00:00.000Z', 3, true, 2).intervalIndex).toBe(0);
  });
});

describe('deriveConceptProgress', () => {
  it('does not count hinted, revealed, or AI-provisional answers as independent evidence', () => {
    const result = deriveConceptProgress('broadcasting', [
      attempt({ id: 'hinted', hintsUsed: 1 }),
      attempt({ id: 'revealed', solutionRevealed: true }),
      attempt({ id: 'ai', gradingMethod: 'ai_provisional' }),
    ], '2026-01-03T00:00:00.000Z');
    expect(result.state).toBe('practiced');
    expect(result.evidenceIds).toEqual([]);
  });

  it('requires two distinct independent successes including application evidence for demonstrated', () => {
    const result = deriveConceptProgress('broadcasting', [
      attempt({ id: 'a', questionId: 'q1' }),
      attempt({ id: 'b', questionId: 'q2', applicationEvidence: true, timestamp: '2026-01-02T10:00:00.000Z' }),
    ], '2026-01-03T00:00:00.000Z');
    expect(result.state).toBe('demonstrated');
    expect(result.evidenceIds).toEqual(['a', 'b']);
  });

  it('requires a later unseen unassisted check after at least seven days for retained', () => {
    const result = deriveConceptProgress('broadcasting', [
      attempt({ id: 'a', questionId: 'q1' }),
      attempt({ id: 'b', questionId: 'q2', applicationEvidence: true, timestamp: '2026-01-02T10:00:00.000Z' }),
      attempt({ id: 'c', questionId: 'q3', timestamp: '2026-01-10T10:00:00.000Z' }),
    ], '2026-01-11T00:00:00.000Z');
    expect(result.state).toBe('retained');
  });
});

describe('recommendNextTask', () => {
  it('prioritizes a blocking prerequisite, then due review, then unfinished objective', () => {
    expect(recommendNextTask({ blockingPrerequisite: 'linear-algebra', dueReviews: ['broadcasting'], nextObjective: 'calculus' })).toEqual({
      id: 'linear-algebra', reason: 'This prerequisite unlocks your current goal.', kind: 'prerequisite',
    });
    expect(recommendNextTask({ dueReviews: ['broadcasting'], nextObjective: 'calculus' }).kind).toBe('review');
    expect(recommendNextTask({ dueReviews: [], nextObjective: 'calculus' }).kind).toBe('objective');
  });
});
