import { describe, expect, it } from 'vitest';

import { chapter18EssentialLessons } from '../../src/content/essential-lessons/chapter-18';
import { chapter19EssentialLessons } from '../../src/content/essential-lessons/chapter-19';
import { chapter20EssentialLessons } from '../../src/content/essential-lessons/chapter-20';
import { tutorContexts } from '../../worker/src/context';

const essentialLessons = [...chapter18EssentialLessons, ...chapter19EssentialLessons, ...chapter20EssentialLessons];

describe('essential lesson tutor contexts', () => {
  it.each(essentialLessons)('matches reviewed concepts and allowed citations for $id', (lesson) => {
    const contexts = Object.values(tutorContexts).filter((context) => context.lessonId === lesson.id);
    expect(contexts).toHaveLength(1);
    expect(tutorContexts[lesson.id]).toBe(contexts[0]);
    expect(contexts[0].conceptIds).toEqual(lesson.conceptIds);
    expect(contexts[0].sourceRefs).toEqual(lesson.sourceRefs.map(({ sectionId, printedStart, pdfPageStart }) => ({
      sectionId, printedStart, pdfPageStart,
    })));
    expect(contexts[0].summary.trim().length).toBeGreaterThan(0);
  });
});
