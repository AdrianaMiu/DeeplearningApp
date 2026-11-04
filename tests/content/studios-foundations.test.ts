import { describe, expect, it } from 'vitest';
import { learningEntries } from '../../src/content/lessons';

const foundationIds = [
  'builders-guide-studio', 'classification-studio', 'cnn-studio',
  'introduction-studio', 'mlp-studio', 'modern-cnn-studio',
];
const studios = learningEntries.filter((entry) => entry.kind === 'chapter-studio')
  .filter((studio) => foundationIds.includes(studio.id));

describe('chapter studio foundations', () => {
  it('authors the first six chapter studios', () => {
    expect(studios.map((studio) => studio.id).sort()).toEqual([
      'builders-guide-studio', 'classification-studio', 'cnn-studio',
      'introduction-studio', 'mlp-studio', 'modern-cnn-studio',
    ]);
    for (const studio of studios) {
      for (const value of [studio.title, studio.question, studio.purpose, studio.capability,
        ...Object.values(studio.views), studio.predictionPrompt, studio.workedExample,
        studio.independentTask, studio.teachBackPrompt]) expect(value.trim()).not.toBe('');
      for (const values of [studio.objectives, studio.prerequisites, studio.conceptIds, studio.misconceptions, studio.sectionCoverage]) expect(values.length).toBeGreaterThan(0);
      expect(studio.interaction.title).not.toBe('');
      expect(studio.interaction.instruction).not.toBe('');
      expect(studio.sourceRefs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses verified source locations', () => {
    expect(studios.length).toBe(6);
    for (const studio of studios) for (const ref of studio.sourceRefs) {
      expect(ref.sourceHash).toBe('93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56');
      expect(ref.pdfPageStart).toBeGreaterThan(0);
    }
  });
});
