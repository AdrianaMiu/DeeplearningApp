import type { ChapterLearningPath, Milestone } from '../domain/types';

export const milestones: Milestone[] = [
  {
    id: 'foundations', title: 'Foundations', order: 1,
    purpose: 'Build the tensor, mathematical, and data reasoning needed to study deep learning.',
    chapterIds: ['chapter-1', 'chapter-2'],
  },
  {
    id: 'models', title: 'Train and evaluate models', order: 2,
    purpose: 'Connect model definitions, training loops, and evaluation to reliable learning experiments.',
    chapterIds: ['chapter-3', 'chapter-4', 'chapter-5', 'chapter-6'],
  },
  {
    id: 'vision', title: 'Visual representations', order: 3,
    purpose: 'Trace how convolutional architectures turn local patterns into visual representations.',
    chapterIds: ['chapter-7', 'chapter-8'],
  },
  {
    id: 'sequences', title: 'Sequences and attention', order: 4,
    purpose: 'Reason about sequence state, recurrent computation, and attention-based representations.',
    chapterIds: ['chapter-9', 'chapter-10', 'chapter-11'],
  },
  {
    id: 'systems', title: 'Optimization, performance, and applications', order: 5,
    purpose: 'Improve training efficiency and apply learned representations to vision and language tasks.',
    chapterIds: ['chapter-12', 'chapter-13', 'chapter-14', 'chapter-15', 'chapter-16'],
  },
  {
    id: 'broader', title: 'Broader methods and consolidation', order: 6,
    purpose: 'Explore broader learning methods and consolidate the mathematics and tools used throughout the book.',
    chapterIds: ['chapter-17', 'chapter-18', 'chapter-19', 'chapter-20', 'appendix-a', 'appendix-b'],
  },
];

// Core identities remain stable; catalog.ts derives availability from validated authored entries.
const coreEntryIdsByChapter = new Map<string, string[]>([
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

export const chapterLearningMap = new Map<string, ChapterLearningPath>(
  milestones.flatMap((milestone) => milestone.chapterIds.map((chapterId) => [chapterId, {
    chapterId,
    milestoneId: milestone.id,
    coreEntryIds: coreEntryIdsByChapter.get(chapterId)!,
  }])),
);
