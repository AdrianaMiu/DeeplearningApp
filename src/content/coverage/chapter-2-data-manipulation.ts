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
  section('2.2', ['Trace raw tabular data into a model-ready tensor.', 'Identify decisions hidden inside preprocessing.'],
    'Data preprocessing turns external records into a numerical representation with explicit rows, columns, types, and missing-value rules. The transformation is part of the learning system: a model cannot recover distinctions that parsing discarded, and inconsistent training and inference transformations create silent distribution shift.',
    'A house table containing area, neighborhood, and price needs numeric parsing, a representation for neighborhood, a policy for absent area values, and a separate target column before tensor conversion.',
    'Design a preprocessing contract for a five-column dataset. State each output column, its type, its missing-value policy, and one invariant checked before training.'),
  section('2.2.1', ['Read a delimited dataset without losing its schema.', 'Inspect records before numerical conversion.'],
    'Reading a dataset is more than opening a file: delimiters, headers, encodings, quoting, and inferred types determine the table that downstream code sees. Early inspection should confirm row count, column names, representative values, and missing markers before any irreversible conversion is applied.',
    'If an identifier contains leading zeros, automatic integer inference changes its meaning; loading it as text preserves the identifier while genuinely numeric measurement columns can remain numeric.',
    'Specify four checks immediately after loading a delivery dataset, including one check for schema drift and one for a value that could be parsed into the wrong type.'),
  section('2.2.2', ['Separate numeric and categorical preparation.', 'Choose a defensible missing-data strategy.'],
    'Numeric columns can often be imputed from a statistic computed on training data, while categorical columns require an explicit vocabulary or indicator representation. The fitted preprocessing parameters must come only from the training split; computing them on all data leaks information from evaluation examples.',
    'Replace missing training-set temperatures with the training mean, and expand a weather category into indicator columns with a defined unknown category for values not seen during fitting.',
    'Prepare a mixed table with two numeric and two categorical columns. Explain how every missing value is handled and where each fitted preprocessing parameter is stored.'),
  section('2.2.3', ['Convert a prepared table to a tensor with controlled dtype.', 'Verify row and feature alignment.'],
    'Tensor conversion requires a homogeneous numerical representation, so dataframe labels and mixed host-language objects cannot simply be assumed to survive. Choose the dtype deliberately, preserve the row order used for targets, and assert the expected two-dimensional feature shape before training.',
    'After encoding, 100 examples with seven feature columns should produce a feature tensor shaped (100, 7) and a target tensor whose leading dimension is also 100.',
    'Write conversion assertions for features and targets, including dtype, finite values, matching example counts, and the exact feature width expected by the model.'),
  section('2.2.4', ['Explain why preprocessing is a learned pipeline component.', 'Recognize leakage and deployment mismatch.'],
    'Preprocessing choices encode assumptions about scale, categories, missingness, and future inputs. Treating them as a fitted, versioned pipeline makes the assumptions testable and repeatable; ad hoc notebook transformations are difficult to reproduce and can behave differently when deployed.',
    'A category vocabulary fitted on the complete dataset leaks evaluation information, while a vocabulary fitted on training data with an unknown bucket can process future categories consistently.',
    'Audit a proposed preprocessing notebook for leakage, irreproducible state, and training-serving mismatch. Give one concrete test for each failure class.'),
];

const exercise = (number: number, prompt: string, hints: string[], criteria: string[]): ExerciseActivity => {
  const sourceId = `2.1.8.exercise.${number}`;
  return { sourceId, chapterId: 'chapter-2', contentStatus: 'reviewed', prompt, hints,
    evaluation: { kind: 'rubric', criteria }, sourceRefs: [exerciseSourceRef(sourceId)] };
};

const preprocessingExercise = (number: number, prompt: string, hints: string[], criteria: string[]): ExerciseActivity => {
  const sourceId = `2.2.5.exercise.${number}`;
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
  preprocessingExercise(1, 'Create a schema audit for a small CSV-like dataset before cleaning it, covering headers, inferred types, missing markers, identifiers, and one malformed row.',
    ['Inspect raw values before choosing conversions.', 'Treat identifiers separately from measured quantities.'],
    ['Reports each column and inferred type.', 'Finds a realistic parsing risk.', 'Defines a check that fails on schema drift.']),
  preprocessingExercise(2, 'Design a leakage-safe preprocessing pipeline for mixed numeric and categorical features, and state exactly which values are learned from the training split.',
    ['Separate fitting the transformation from applying it.', 'Include a policy for previously unseen categories.'],
    ['Identifies every fitted statistic or vocabulary.', 'Uses training data only for fitting.', 'Handles unknown categories and missing numeric values.']),
  preprocessingExercise(3, 'Given 240 table rows, six prepared feature columns, and one target column, specify the feature and target tensor shapes and a set of assertions that must pass before training.',
    ['The example axis must agree between features and targets.', 'Check dtype and finite values as well as shape.'],
    ['States compatible feature and target shapes.', 'Checks example alignment.', 'Checks numerical dtype and invalid values.']),
  preprocessingExercise(4, 'Compare mean imputation with adding a missingness indicator for a sensor value, then explain a situation where the fact that a value is missing carries predictive information.',
    ['Ask why the measurement might be absent.', 'Distinguish replacing a value from preserving the missingness signal.'],
    ['Explains both transformations.', 'Provides a plausible informative-missingness mechanism.', 'Notes a deployment risk if missingness patterns change.']),
  preprocessingExercise(5, 'Write a training-versus-serving consistency checklist for a preprocessing pipeline and propose a regression test using one representative record.',
    ['Version the transformation state together with the model.', 'Compare the exact output vector, not only whether conversion succeeds.'],
    ['Covers column order, dtype, fitted state, and unknown values.', 'Defines a reproducible expected vector.', 'Explains how the test detects pipeline drift.']),
];

export const chapter2DataManipulationClassifications: CoverageClassification[] = [
  { sourceId: '2.1.7', kind: 'summary' },
  { sourceId: '2.1.8', kind: 'exercise-heading' },
  { sourceId: '2.2.5', kind: 'exercise-heading' },
];
