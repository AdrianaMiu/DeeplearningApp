import { describe, expect, it } from 'vitest';
import { BOOK_SHA256, curriculumInventory } from '../../src/content/inventory';

describe('curriculum inventory', () => {
  it('represents every chapter and both appendices', () => {
    expect(BOOK_SHA256).toBe('93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56');
    expect(curriculumInventory.chapters.filter((chapter) => /^chapter-/.test(chapter.id))).toHaveLength(20);
    expect(curriculumInventory.chapters.map((chapter) => chapter.id)).toEqual(
      expect.arrayContaining(['appendix-a', 'appendix-b']),
    );
  });

  it('includes every required appendix section and orientation record', () => {
    const ids = new Set(curriculumInventory.sections.map((section) => section.id));
    for (let index = 1; index <= 11; index += 1) expect(ids.has(`A.${index}`)).toBe(true);
    for (let index = 1; index <= 8; index += 1) expect(ids.has(`B.${index}`)).toBe(true);
    expect(curriculumInventory.orientation.map((item) => item.id)).toEqual(
      expect.arrayContaining(['orientation-installation', 'orientation-notation']),
    );
  });

  it('uses unique stable IDs and source metadata without book prose', () => {
    const records = [
      ...curriculumInventory.chapters,
      ...curriculumInventory.sections,
      ...curriculumInventory.exercises,
      ...curriculumInventory.orientation,
    ];
    expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
    expect(curriculumInventory.exercises.length).toBeGreaterThan(100);
    expect(curriculumInventory.exercises.every((exercise) => !('prompt' in exercise))).toBe(true);
    expect(curriculumInventory.sections.every((section) => section.source.printedStart.length > 0)).toBe(true);
  });
});
