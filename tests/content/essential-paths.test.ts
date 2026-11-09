import { describe, expect, it } from 'vitest';
import { chapterLearningMap } from '../../src/content/course-map';
import { learningEntries, lessons } from '../../src/content/lessons';
import { questions } from '../../src/content/questions';
import { gradeQuestion } from '../../src/domain/grading';

const chapterIds = ['chapter-18', 'chapter-19', 'chapter-20'];
const essentialLessons = lessons.filter((lesson) => chapterIds.includes(lesson.chapterId));

describe('Chapters 18–20 integrated essential paths', () => {
  it.each([
    ['q35', 'Use disjoint optimizers; detach fake images only for D; preserve the G-to-D gradient for G; compare both networks’ parameters around each phase.'],
    ['q38', 'Map real pixels with x/127.5−1 to [−1,1]; check shapes and ranges; inspect fixed and fresh latent samples for quality and diversity alongside both losses.'],
    ['q41', 'Select by validation means over predeclared shared seeds and resources; freeze the choice before fresh untouched test evaluation; log configurations, seeds, splits, scores, resources, and failed or stopped costs.'],
    ['q44', 'Check full-resource pilot curves for ranking reversals and justify the grace period; compare at common final resource under matched hardware and budgets, recording all accelerator costs and wall time.'],
    ['q47', 'Add noise only to the training diagonal and leave cross-covariances unchanged; condition for the latent posterior; add fresh noise variance for the next reading and label the bands separately.'],
    ['q50', 'Use stable solves, check precision and small recorded jitter sensitivity; estimate noise separately; compare kernel or regime alternatives with deployment-matched held-out residuals and predictive intervals.'],
  ])('grades diagnosis %s deterministically with application evidence', (id, correctAnswer) => {
    const question = questions.find((item) => item.id === id)!;
    expect(question).toMatchObject({ type: 'multiple_choice', version: 2, applicationEvidence: true });
    expect(question.rubric).toBeUndefined();
    expect(question.options!.length).toBeGreaterThanOrEqual(3);
    expect(new Set(question.options).size).toBe(question.options!.length);
    expect(question.answer).toBe(correctAnswer);
    expect(question.options).toContain(correctAnswer);
    for (const option of question.options!) {
      expect(gradeQuestion(question, option).score).toBe(option === correctAnswer ? 1 : 0);
    }
    expect(gradeQuestion(question, '').score).toBe(0);
  });

  it.each(chapterIds)('keeps the three-entry %s path within the approved 30–45 minute scope', (chapterId) => {
    const ids = chapterLearningMap.get(chapterId)!.coreEntryIds;
    const entries = ids.map((id) => learningEntries.find((entry) => entry.id === id)!);
    expect(entries).toHaveLength(3);
    const minutes = entries.reduce((total, entry) => total + entry.durationMinutes, 0);
    expect(minutes).toBeGreaterThanOrEqual(30);
    expect(minutes).toBeLessThanOrEqual(45);
  });

  it('does not repeat normalized teaching prose across the six new lessons', () => {
    expect(essentialLessons).toHaveLength(6);
    const prose = essentialLessons.flatMap((lesson) => [
      ...Object.values(lesson.views), lesson.workedExample, lesson.independentTask,
      lesson.predictionPrompt, lesson.teachBackPrompt, ...lesson.misconceptions,
    ].map((value) => value.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, ' ').trim()));
    expect(new Set(prose).size).toBe(prose.length);
  });
});
