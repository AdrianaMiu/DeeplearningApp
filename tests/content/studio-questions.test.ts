import { describe, expect, it } from 'vitest';
import { chapterStudios } from '../../src/content/studios';
import { questions } from '../../src/content/questions';

const studioQuestions = questions.filter((question) => question.id.startsWith('studio-'));

describe('studio chapter checks', () => {
  it('provides four mixed questions for every studio', () => {
    expect(studioQuestions).toHaveLength(80);
    for (const studio of chapterStudios) {
      const prefix = studio.chapterId.replace('chapter-', '').replace('appendix-', '').toLowerCase();
      const expectedIds = [1, 2, 3, 4].map((n) => `studio-${prefix}-q${n}`);
      expect(studio.chapterCheckQuestionIds, studio.id).toEqual(expectedIds);
      const items = studioQuestions.filter((question) => question.lessonId === studio.id);
      expect(items.map((question) => question.id), studio.id).toEqual(expectedIds);
      expect(new Set(items.map((question) => question.type)).size).toBeGreaterThanOrEqual(3);
      expect(items.some((question) => question.applicationEvidence)).toBe(true);
    }
  });

  it('resolves every chapter check to its own studio', () => {
    for (const studio of chapterStudios) {
      expect(studio.chapterCheckQuestionIds, studio.id).toHaveLength(4);
      for (const id of studio.chapterCheckQuestionIds) {
        expect(questions.find((question) => question.id === id)).toMatchObject({ lessonId: studio.id });
      }
    }
  });

  it('supplies specific teaching support and companion source metadata', () => {
    expect(studioQuestions).toHaveLength(80);
    for (const question of studioQuestions) {
      const studio = chapterStudios.find((entry) => entry.id === question.lessonId)!;
      expect(question.sourceRefs).toEqual(studio.sourceRefs);
      expect(question.sourceRefs.every((source) => source.companionCreated)).toBe(true);
      expect(question.conceptIds).toEqual(studio.conceptIds);
      expect(question.misconceptionTags.length).toBeGreaterThan(0);
      expect(question.hints.length).toBeGreaterThan(0);
      expect(question.hints.every((hint) => hint.trim().length > 15)).toBe(true);
      expect(question.explanation.length).toBeGreaterThan(35);
      if (question.type === 'multiple_choice') {
        expect(question.options?.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.options).size).toBe(question.options?.length);
        expect(question.options).toContain(question.answer);
      }
      if (['debugging', 'transfer', 'explanation'].includes(question.type)) {
        expect(question.rubric?.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
