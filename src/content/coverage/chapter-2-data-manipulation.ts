import type { CoverageClassification, ExerciseActivity, SectionActivity } from './types';
import { exerciseSourceRef, sectionSourceRef } from './source-ref';

const section = (
  sourceId: string, objectives: string[], explanation: string, workedExample: string, independentTask: string,
): SectionActivity => ({ sourceId, chapterId: 'chapter-2', contentStatus: 'reviewed', objectives, explanation,
  workedExample, independentTask, sourceRefs: [sectionSourceRef(sourceId)] });

export const chapter2DataManipulationSections: SectionActivity[] = [
  section('2.1', ['Explain why tensors are the basic data container for deep learning.', 'Connect shape, dtype, and device to an operation.'],
    'A tensor is a multidimensional, typed array whose shape describes the organization of its values. Deep-learning programs rely on tensors because the same abstraction supports batches, model parameters, and accelerator-friendly numerical operations; shape and dtype are therefore part of the meaning, not incidental metadata.',
    'A batch of 32 RGB images with height 28 and width 28 can be represented by shape (32, 3, 28, 28); the leading axis selects an example while the remaining axes describe each example.',
    'Design tensor shapes for a batch of text embeddings and a batch of grayscale images. Label every axis and state one operation that requires two axes to agree.'),
  section('2.1.1', ['Construct tensors from ranges and constants.', 'Predict element counts after reshaping.'],
    'Tensor construction separates the values being created from the view used to organize them. A contiguous range can be reshaped only when the requested dimensions multiply to the same element count; inferring one dimension is safe only when the other dimensions determine it exactly.',
    'Twelve values can form shapes (12,), (3, 4), or (2, 2, 3). Reshaping changes axis interpretation while preserving the values and their count.',
    'Create a shape plan for 48 sequential values using three different ranks. For each plan, identify what one index along every axis could represent.'),
  section('2.1.2', ['Use slicing rules to predict output shape.', 'Distinguish scalar selection from range selection.'],
    'Indexing chooses positions while slicing chooses ranges, so apparently similar expressions can return objects with different ranks. A single integer usually removes an axis, whereas a one-element slice preserves it; assignments through an indexed view can update a structured region at once.',
    'For a tensor shaped (4, 5), selecting row 1 yields shape (5,), while selecting rows 1:2 yields shape (1, 5). Selecting all rows and columns 2:4 yields shape (4, 2).',
    'Without running code, predict the values and shapes produced by five indexes into a (3, 4, 2) tensor, including a negative index and a one-element slice.'),
  section('2.1.3', ['Differentiate elementwise and reduction operations.', 'Track shape through a short tensor expression.'],
    'Elementwise operations pair corresponding entries and generally preserve shape, while reductions combine entries along selected axes and may remove or retain those axes. Concatenation changes one chosen dimension but requires the other dimensions to remain compatible.',
    'Adding two (2, 3) tensors produces (2, 3); summing across axis 1 produces (2,), or (2, 1) when the reduced dimension is retained for later broadcasting.',
    'Trace shape and meaning through an expression that applies an elementwise square, a row reduction, and concatenation. Explain where an incompatible shape would fail.'),
  section('2.1.4', ['Apply broadcasting compatibility from the trailing axes.', 'Explain implicit expansion without imagining copied data.'],
    'Broadcasting compares dimensions from right to left. Each pair is compatible when the sizes match or one size is 1; missing leading dimensions behave like size 1. The operation acts as if singleton values repeat, but implementations can use a view-like expansion instead of materializing copies.',
    'Shapes (3, 1) and (1, 4) broadcast to (3, 4): the first varies by row and the second by column. Shapes (3, 2) and (3,) fail because their trailing sizes 2 and 3 conflict.',
    'Analyze four shape pairs axis by axis, including one incompatible pair. For compatible pairs, give the result shape and describe which operand is expanded conceptually.'),
  section('2.1.5', ['Recognize in-place updates by object identity.', 'Explain why unnecessary allocation matters in training loops.'],
    'An expression may allocate a new tensor and rebind a variable, while an in-place assignment writes into existing storage. Reusing memory can reduce pressure in large training loops, but mutation also changes any alias sharing that storage and can interfere with gradient bookkeeping, so it must be intentional.',
    'If Y refers to storage A, assigning Y = Y + X may bind Y to new storage B. Writing Y[:] = Y + X preserves storage A, so another reference to A observes the update.',
    'Compare rebinding, slice assignment, and an in-place arithmetic method. Predict object identity and alias behavior, then state when clarity is more important than reuse.'),
  section('2.1.6', ['Convert between tensors and host-language arrays or scalars.', 'Identify when conversion can copy, share, or detach data.'],
    'Tensor libraries interoperate with array libraries and native scalars, but conversion is not semantically free. Depending on device, dtype, and API, memory may be shared or copied; extracting a scalar also discards its tensor shape and usually removes it from automatic-differentiation tracking.',
    'A CPU tensor and an array may share storage under a zero-copy conversion, so mutating one can affect the other. A tensor on an accelerator must first move data to host memory before ordinary array code can use it.',
    'Write a conversion checklist covering device, dtype, ownership, gradient tracking, and scalar extraction. Apply it to a tensor that must be passed to a plotting library.'),
];

const exercise = (number: number, prompt: string, hints: string[], criteria: string[]): ExerciseActivity => {
  const sourceId = `2.1.8.exercise.${number}`;
  return { sourceId, chapterId: 'chapter-2', contentStatus: 'reviewed', prompt, hints,
    evaluation: { kind: 'rubric', criteria }, sourceRefs: [exerciseSourceRef(sourceId)] };
};

export const chapter2DataManipulationExercises: ExerciseActivity[] = [
  exercise(1, 'Build a tensor-shape audit for a small image batch: construct it, select examples and channels, apply one reduction, and record the predicted and observed shape after every operation.',
    ['Write predictions before executing any code.', 'Include one integer index and one slice that preserve different ranks.'],
    ['Every operation has a justified shape prediction.', 'The audit distinguishes indexing, elementwise work, and reduction.', 'Any incorrect prediction is corrected with an axis-level explanation.']),
  exercise(2, 'Investigate broadcasting and memory behavior with two compatible operands and one incompatible pair, then compare rebinding with an in-place update using object identity or storage evidence.',
    ['Compare dimensions from the trailing side.', 'Keep an alias before the update so the memory behavior is observable.'],
    ['Derives compatible result shapes axis by axis.', 'Explains the incompatible pair precisely.', 'Uses evidence to distinguish allocation from mutation.', 'Notes one risk of mutation.']),
];

export const chapter2DataManipulationClassifications: CoverageClassification[] = [
  { sourceId: '2.1.7', kind: 'summary' },
  { sourceId: '2.1.8', kind: 'exercise-heading' },
];
