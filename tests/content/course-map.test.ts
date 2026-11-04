import { describe, expect, it } from 'vitest';
import { chapterLearningMap, milestones } from '../../src/content/course-map';
import { curriculumInventory } from '../../src/content/inventory';

describe('complete book course map', () => {
  it('defines the six approved milestones', () => {
    expect(milestones).toHaveLength(6);
    expect(milestones.map(({ id, title, order, chapterIds }) => ({ id, title, order, chapterIds }))).toEqual([
      { id: 'foundations', title: 'Foundations', order: 1, chapterIds: ['chapter-1', 'chapter-2'] },
      { id: 'models', title: 'Train and evaluate models', order: 2, chapterIds: ['chapter-3', 'chapter-4', 'chapter-5', 'chapter-6'] },
      { id: 'vision', title: 'Visual representations', order: 3, chapterIds: ['chapter-7', 'chapter-8'] },
      { id: 'sequences', title: 'Sequences and attention', order: 4, chapterIds: ['chapter-9', 'chapter-10', 'chapter-11'] },
      { id: 'systems', title: 'Optimization, performance, and applications', order: 5, chapterIds: ['chapter-12', 'chapter-13', 'chapter-14', 'chapter-15', 'chapter-16'] },
      { id: 'broader', title: 'Broader methods and consolidation', order: 6, chapterIds: ['chapter-17', 'chapter-18', 'chapter-19', 'chapter-20', 'appendix-a', 'appendix-b'] },
    ]);
    expect(milestones.every((milestone) => milestone.purpose.trim().length > 0)).toBe(true);
  });

  it('maps every book unit to one core path', () => {
    expect(chapterLearningMap.size).toBe(22);
    expect([...chapterLearningMap.keys()].sort()).toEqual(curriculumInventory.chapters.map((chapter) => chapter.id).sort());
    expect([...chapterLearningMap.values()].map(({ chapterId, coreEntryIds }) => [chapterId, coreEntryIds])).toEqual([
      ['chapter-1', ['introduction-studio']],
      ['chapter-2', ['tensor-shapes', 'broadcasting', 'data-preprocessing', 'linear-algebra-objects', 'reductions', 'products-and-norms', 'derivatives-gradients', 'chain-rule', 'autodiff', 'probability-expectation']],
      ['chapter-3', ['linear-regression', 'regression-training']],
      ['chapter-4', ['classification-studio']],
      ['chapter-5', ['mlp-studio']],
      ['chapter-6', ['builders-guide-studio']],
      ['chapter-7', ['cnn-studio']],
      ['chapter-8', ['modern-cnn-studio']],
      ['chapter-9', ['rnn-studio']],
      ['chapter-10', ['modern-rnn-studio']],
      ['chapter-11', ['attention-transformers-studio']],
      ['chapter-12', ['optimization-studio']],
      ['chapter-13', ['performance-studio']],
      ['chapter-14', ['computer-vision-studio']],
      ['chapter-15', ['nlp-pretraining-studio']],
      ['chapter-16', ['nlp-applications-studio']],
      ['chapter-17', ['reinforcement-learning-studio']],
      ['chapter-18', ['gaussian-processes-studio']],
      ['chapter-19', ['hyperparameter-optimization-studio']],
      ['chapter-20', ['gan-studio']],
      ['appendix-a', ['math-appendix-studio']],
      ['appendix-b', ['tools-appendix-studio']],
    ]);
    for (const milestone of milestones) {
      for (const chapterId of milestone.chapterIds) {
        expect(chapterLearningMap.get(chapterId)?.milestoneId).toBe(milestone.id);
      }
    }
    const coreEntryIds = [...chapterLearningMap.values()].flatMap((path) => path.coreEntryIds);
    expect(new Set(coreEntryIds).size).toBe(32);
  });
});
