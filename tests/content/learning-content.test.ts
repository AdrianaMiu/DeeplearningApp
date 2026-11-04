import { describe, expect, it } from 'vitest';
import { diagnosticQuestions } from '../../src/content/diagnostic';
import { learningEntries, learningEntryById, lessons } from '../../src/content/lessons';
import { questions } from '../../src/content/questions';

describe('published learning content', () => {
  it('preserves the twelve deep lesson IDs', () => {
    expect(lessons.map((lesson) => lesson.id).sort()).toEqual([
      'autodiff', 'broadcasting', 'chain-rule', 'data-preprocessing',
      'derivatives-gradients', 'linear-algebra-objects', 'linear-regression',
      'probability-expectation', 'products-and-norms', 'reductions',
      'regression-training', 'tensor-shapes',
    ]);
    expect(learningEntries).toHaveLength(18);
    expect(learningEntryById.size).toBe(18);
    expect(learningEntryById.get('missing-entry')).toBeUndefined();
    for (const lesson of lessons) {
      expect(lesson.kind).toBe('deep-lesson');
      expect(lesson.chapterId).toBe(lesson.id === 'linear-regression' || lesson.id === 'regression-training' ? 'chapter-3' : 'chapter-2');
      expect(lesson.milestoneId).toBe(lesson.chapterId === 'chapter-2' ? 'foundations' : 'models');
      expect(learningEntryById.get(lesson.id)).toBe(lesson);
    }
  });

  it('contains the twelve approved reviewed lessons with complete learning anatomy', () => {
    expect(lessons).toHaveLength(12);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(12);
    for (const lesson of lessons) {
      expect(lesson.contentStatus).toBe('reviewed');
      expect(lesson.objectives.length).toBeGreaterThan(0);
      expect(lesson.conceptIds.length).toBeGreaterThan(0);
      expect(lesson.sourceRefs.length).toBeGreaterThan(0);
      expect(lesson.views.intuition.length).toBeGreaterThan(40);
      expect(lesson.views.math.length).toBeGreaterThan(20);
      expect(lesson.views.code.length).toBeGreaterThan(20);
      expect(lesson.views.workConnection.length).toBeGreaterThan(20);
      expect(lesson.predictionPrompt.length).toBeGreaterThan(15);
      expect(lesson.workedExample.length).toBeGreaterThan(20);
      expect(lesson.independentTask.length).toBeGreaterThan(20);
      expect(lesson.misconceptions.length).toBeGreaterThan(0);
      expect(lesson.teachBackPrompt.length).toBeGreaterThan(15);
    }
  });

  it('contains eight diagnostic and thirty-two lesson questions with a useful type mix', () => {
    expect(diagnosticQuestions).toHaveLength(8);
    expect(questions).toHaveLength(32);
    const all = [...diagnosticQuestions, ...questions];
    expect(new Set(all.map((question) => question.id)).size).toBe(40);
    const types = new Set(all.map((question) => question.type));
    expect([...types].sort()).toEqual(
      ['multiple_choice', 'shape', 'numeric', 'code_trace', 'debugging', 'explanation', 'transfer'].sort(),
    );
    expect(all.every((question) => question.sourceRefs.length > 0 && question.hints.length > 0)).toBe(true);
    expect(questions.every((question) => lessons.some((lesson) => lesson.id === question.lessonId))).toBe(true);
  });

  it('labels all authored material as companion-created while preserving precise source IDs', () => {
    const refs = [...lessons.flatMap((lesson) => lesson.sourceRefs), ...questions.flatMap((question) => question.sourceRefs)];
    expect(refs.every((source) => source.companionCreated && /^([23]\.|[23]$)/.test(source.sectionId))).toBe(true);
    expect(refs.every((source) => source.sourceHash.length === 64 && source.pdfPageStart > 0)).toBe(true);
  });
});
