export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

export function scheduleReview(
  timestamp: string,
  currentIntervalIndex: number,
  correct: boolean,
  confidence: number,
): { intervalIndex: number; dueAt: string } {
  const intervalIndex = correct && confidence >= 3
    ? Math.min(Math.max(currentIntervalIndex, -1) + 1, REVIEW_INTERVAL_DAYS.length - 1)
    : 0;
  const due = new Date(timestamp);
  due.setUTCDate(due.getUTCDate() + REVIEW_INTERVAL_DAYS[intervalIndex]);
  return { intervalIndex, dueAt: due.toISOString() };
}

/** Resolve append-only history before determining which concepts are due.
 * Identical event times prefer the later scheduled due date, then the ID,
 * so imported histories produce the same answer regardless of array order. */
export function getDueReviews(reviews: readonly import('./types').ReviewEvent[], now: string): import('./types').ReviewEvent[] {
  const latest = new Map<string, import('./types').ReviewEvent>();
  for (const review of reviews) {
    const previous = latest.get(review.conceptId);
    const timestamp = Date.parse(review.timestamp);
    const previousTimestamp = previous ? Date.parse(previous.timestamp) : NaN;
    if (!previous || timestamp > previousTimestamp || (timestamp === previousTimestamp &&
      (Date.parse(review.dueAt) > Date.parse(previous.dueAt) ||
        (Date.parse(review.dueAt) === Date.parse(previous.dueAt) && review.id > previous.id)))) {
      latest.set(review.conceptId, review);
    }
  }
  const cutoff = Date.parse(now);
  return [...latest.values()].filter((review) => Date.parse(review.dueAt) <= cutoff);
}
