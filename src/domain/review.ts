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
