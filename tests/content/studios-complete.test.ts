import { describe, expect, it, vi } from 'vitest';
import { chapterLearningMap } from '../../src/content/course-map';
import { curriculumInventory } from '../../src/content/inventory';
import { learningEntries, learningEntryById } from '../../src/content/lessons';
import manifest from '../../src/content/studio-source-manifest.json';

const studios = learningEntries.filter((entry) => entry.kind === 'chapter-studio');
const remainingIds = [
  'rnn-studio', 'modern-rnn-studio', 'attention-transformers-studio',
  'optimization-studio', 'performance-studio', 'computer-vision-studio',
  'nlp-pretraining-studio', 'nlp-applications-studio', 'reinforcement-learning-studio',
  'gaussian-processes-studio', 'hyperparameter-optimization-studio', 'gan-studio',
  'math-appendix-studio', 'tools-appendix-studio',
];
const appendixSections = {
  'math-appendix-studio': ['A.1', 'A.2', 'A.3', 'A.4', 'A.5', 'A.6', 'A.7', 'A.8', 'A.9', 'A.10', 'A.11'],
  'tools-appendix-studio': ['B.1', 'B.2', 'B.3', 'B.4', 'B.5', 'B.6', 'B.7', 'B.8'],
};

describe('complete chapter studios', () => {
  it('completes all twenty studios', () => {
    expect(studios).toHaveLength(20);
    expect(studios.filter((studio) => remainingIds.includes(studio.id)).map((studio) => studio.id).sort())
      .toEqual([...remainingIds].sort());
    expect(learningEntries).toHaveLength(32);
    expect(learningEntryById.size).toBe(32);
    expect(chapterLearningMap.size).toBe(22);
    for (const path of chapterLearningMap.values()) for (const id of path.coreEntryIds) {
      expect(learningEntryById.get(id)).toMatchObject({ chapterId: path.chapterId, milestoneId: path.milestoneId });
    }
    for (const studio of studios) {
      for (const value of [studio.title, studio.question, studio.purpose, studio.capability,
        ...Object.values(studio.views), studio.predictionPrompt, studio.workedExample,
        studio.independentTask, studio.teachBackPrompt, studio.interaction.title, studio.interaction.instruction]) {
        expect(value.trim()).not.toBe('');
      }
      for (const values of [studio.objectives, studio.prerequisites, studio.conceptIds, studio.misconceptions, studio.sectionCoverage]) {
        expect(values.length).toBeGreaterThan(0);
      }
      expect(studio.sourceRefs.length).toBeGreaterThanOrEqual(2);
      const verified = manifest.studios.find((record) => record.studioId === studio.id);
      expect(verified).toBeDefined();
      for (const ref of studio.sourceRefs) {
        expect(verified?.references).toContainEqual({ sectionId: ref.sectionId, printedStart: ref.printedStart,
          pdfPageStart: ref.pdfPageStart, sourceHash: ref.sourceHash });
        expect(ref.companionCreated).toBe(true);
      }
    }
  });

  it('covers every required appendix section', () => {
    for (const [id, sections] of Object.entries(appendixSections)) {
      const studio = studios.find((entry) => entry.id === id);
      expect(studio, id).toBeDefined();
      expect(studio?.sectionCoverage.map((coverage) => coverage.sectionId)).toEqual(sections);
      expect(studio?.sourceRefs.map((ref) => ref.sectionId)).toEqual(sections);
      expect(studio?.interaction.kind).toBe('decision-canvas');
      if (studio?.interaction.kind === 'decision-canvas') {
        expect(studio.interaction.options.map((option) => option.id)).toEqual(sections);
        for (const option of studio.interaction.options) {
          expect(option.label.trim()).not.toBe('');
          expect(option.feedback.trim()).not.toBe('');
        }
      }
    }
  });

  it('does not promote inventory records', async () => {
    vi.resetModules();
    const { curriculumInventory: inventory } = await import('../../src/content/inventory');
    const countStatuses = () => [...inventory.chapters, ...inventory.sections, ...inventory.exercises, ...inventory.orientation]
      .reduce<Record<string, number>>((counts, record) => {
        counts[record.contentStatus] = (counts[record.contentStatus] ?? 0) + 1;
        return counts;
      }, {});
    const before = countStatuses();
    const serialized = JSON.stringify(inventory);
    await import('../../src/content/lessons');
    expect(countStatuses()).toEqual(before);
    expect(JSON.stringify(inventory)).toBe(serialized);
    expect(inventory).toEqual(curriculumInventory);
  });
});
