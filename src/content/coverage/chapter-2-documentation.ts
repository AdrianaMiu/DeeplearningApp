import { defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

export const documentationSections = [
  defineSectionActivity('chapter-2', '2.7.1', {
    objectives: ['Discover public functions and classes in an unfamiliar Python module.'],
    explanation: 'Use a module’s documentation to find supported entry points. Interactive inspection can help you discover candidates, but the public API reference establishes which names are intended for callers and what each one does.',
    workedExample: 'When looking for a tensor reduction, inspect the public tensor operations index, then compare the entries for sum and mean.',
    independentTask: 'Find one tensor operation for counting nonzero entries. Record its public name and explain how you found it.',
  }),
  defineSectionActivity('chapter-2', '2.7.2', {
    objectives: ['Verify a function’s signature, defaults and expected output before calling it.'],
    explanation: 'An API reference or docstring describes accepted arguments and return values. Inspect optional parameters and run a tiny example with known output before relying on the call in a larger training pipeline.',
    workedExample: 'For a reduction over axis 1, check the documented dimension and keep-dimension parameters before predicting the output rank.',
    independentTask: 'Look up a reshape operation. Compare two calls, one with an explicit target shape and one with an inferred dimension, and explain the constraint on element count.',
  }),
];

export const documentationClassifications: CoverageClassification[] = [
  { sourceId: '2.7', kind: 'container' },
];
