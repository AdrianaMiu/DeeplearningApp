import type { Attempt, ConceptState } from './types';

export interface ConceptProgress {
  conceptId: string;
  state: ConceptState;
  needsReview: boolean;
  evidenceIds: string[];
}

const isIndependentSuccess = (attempt: Attempt) =>
  attempt.score >= 1
  && attempt.gradingMethod !== 'ai_provisional'
  && attempt.hintsUsed === 0
  && !attempt.solutionRevealed
  && attempt.tutorSupportLevel === 'none';

export function deriveConceptProgress(conceptId: string, attempts: Attempt[], now: string): ConceptProgress {
  const relevant = attempts
    .filter((attempt) => attempt.conceptIds.includes(conceptId))
    .slice()
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  const independentByQuestion = new Map<string, Attempt>();
  for (const item of relevant.filter(isIndependentSuccess)) {
    if (!independentByQuestion.has(item.questionId)) independentByQuestion.set(item.questionId, item);
  }
  const independent = [...independentByQuestion.values()];
  const evidenceIds = independent.map((item) => item.id);
  let state: ConceptState = relevant.length === 0 ? 'not_started' : 'learning';
  if (relevant.some((item) => item.score >= 0.7)) state = 'practiced';
  const demonstrationIndex = independent.findIndex((item, index) =>
    index >= 1 && independent.slice(0, index + 1).some((candidate) => candidate.applicationEvidence),
  );
  if (demonstrationIndex >= 1) {
    state = 'demonstrated';
    const demonstratedAt = new Date(independent[demonstrationIndex].timestamp).getTime();
    const retained = independent.slice(demonstrationIndex + 1).some((item) =>
      new Date(item.timestamp).getTime() - demonstratedAt >= 7 * 86_400_000,
    );
    if (retained) state = 'retained';
  }
  const latest = relevant.at(-1);
  const needsReview = Boolean(latest && (latest.score < 0.7 || new Date(now).getTime() - new Date(latest.timestamp).getTime() >= 30 * 86_400_000));
  return { conceptId, state, needsReview, evidenceIds };
}

export interface RecommendationInput {
  blockingPrerequisite?: string;
  dueReviews?: string[];
  nextObjective?: string;
  learnerSelected?: string;
}

export function recommendNextTask(input: RecommendationInput): { id: string; kind: 'prerequisite' | 'review' | 'objective' | 'selected'; reason: string } {
  if (input.blockingPrerequisite) return { id: input.blockingPrerequisite, kind: 'prerequisite', reason: 'This prerequisite unlocks your current goal.' };
  if (input.dueReviews?.length) return { id: input.dueReviews[0], kind: 'review', reason: 'This review is due within today’s learning budget.' };
  if (input.nextObjective) return { id: input.nextObjective, kind: 'objective', reason: 'This is the next unfinished objective in your path.' };
  return { id: input.learnerSelected ?? 'orientation', kind: 'selected', reason: 'You selected this topic.' };
}
