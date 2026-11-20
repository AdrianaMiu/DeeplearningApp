import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

export const linearAlgebraSections = [
  defineSectionActivity('chapter-2', '2.3.1', {
    objectives: ['Distinguish a scalar from a one-element vector.'],
    explanation: 'A scalar represents one quantity and has no axes. A one-element vector stores one quantity along an axis, which affects indexing, batching, and the shape expected by downstream operations.',
    workedExample: 'A single loss has shape (), while recording that loss for a batch of one example can have shape (1,).',
    independentTask: 'Distinguish a scalar threshold, one prediction stored in a batch, and the mean of three predictions by writing their shapes.',
  }),
  defineSectionActivity('chapter-2', '2.3.2', {
    objectives: ['Interpret vector coordinates using an explicit order.'],
    explanation: 'A vector is an ordered sequence of coordinates. Shape records how many coordinates exist, while the feature definition tells you what each coordinate means and which reorderings change the input.',
    workedExample: 'For feature order [age, tenure], the vector [31, 5] denotes a different record from [5, 31].',
    independentTask: 'Choose three features for a weather record and give two vectors with the same shape but different coordinate interpretations.',
  }),
  defineSectionActivity('chapter-2', '2.3.3', {
    objectives: ['Predict how matrix indexing changes shape.'],
    explanation: 'A matrix has a row axis and a column axis. Selecting a row with an integer indexes away the row axis, while slicing a range of one row preserves that axis at size one.',
    workedExample: 'For a matrix X of shape (6, 4), X[2] has shape (4,) while X[2:3] has shape (1, 4).',
    independentTask: 'For X shaped (5, 7), compare X[:, 3] with X[:, 3:4] and name the axis retained by each expression.',
  }),
  defineSectionActivity('chapter-2', '2.3.4', {
    objectives: ['Track axis meanings across a tensor permutation.'],
    explanation: 'A tensor can store several kinds of indices at once, such as example, time and feature. A permutation changes where each index appears and leaves the number of stored elements unchanged.',
    workedExample: 'A batch with shape (8, 12, 3) in example-time-feature order becomes (12, 8, 3) in time-example-feature order.',
    independentTask: 'Convert an image batch from (B, H, W, C) to (B, C, H, W). List the original axis numbers in their new order.',
  }),
  defineSectionActivity('chapter-2', '2.3.5', {
    objectives: ['Differentiate elementwise and matrix multiplication.'],
    explanation: 'Elementwise multiplication combines entries at matching indices, possibly after broadcasting. Matrix multiplication combines a row of the left operand and a column of the right operand by summing products.',
    workedExample: 'Multiplying a (2, 3) matrix elementwise by itself gives (2, 3). Multiplying it by its transpose as matrices gives (2, 2).',
    independentTask: 'Give an example where two square matrices support both kinds of multiplication but the numerical results differ.',
  }),
  defineSectionActivity('chapter-2', '2.3.6', {
    objectives: ['Identify the axes removed by a reduction.'],
    explanation: 'Reducing along an axis summarizes all positions on that axis for every combination of the other indices. A total sum reduces every axis and produces one scalar.',
    workedExample: 'For readings shaped (8 devices, 24 hours, 3 sensors), summing over hours produces eight sets of three totals.',
    independentTask: 'For an image batch shaped (N, C, H, W), choose the reduction axes and output shape for one mean per example and channel.',
  }),
  defineSectionActivity('chapter-2', '2.3.7', {
    objectives: ['Preserve reduced axes for broadcast-compatible arithmetic.'],
    explanation: 'Keeping dimensions during a reduction leaves each reduced axis in place with size one. The result can then broadcast back across those same positions when you center or normalize the input.',
    workedExample: 'For X shaped (5, 3), the row means have shape (5, 1) with keepdim=True. Subtracting them centers each row.',
    independentTask: 'Explain why subtracting row means of shape (5,) from (5, 3) fails and give a shape that fixes the alignment.',
  }),
  defineSectionActivity('chapter-2', '2.3.8', {
    objectives: ['Compute a dot product as a weighted sum.'],
    explanation: 'A dot product pairs coordinates, multiplies each pair and sums the contributions. Interpreting one vector as weights makes the result the scalar score assigned to the other vector.',
    workedExample: 'Weights [2, -1, 0.5] applied to features [3, 4, 2] give 6 - 4 + 1 = 3.',
    independentTask: 'Compute the score for weights [1, -2, 3] and features [2, 1, 0]. Identify the coordinate with zero contribution.',
  }),
  defineSectionActivity('chapter-2', '2.3.9', {
    objectives: ['Interpret a matrix-vector product one row at a time.'],
    explanation: 'Each row of a matrix can represent a separate linear measurement of the same input vector. The output has one coordinate per row, and every row needs as many entries as the input vector.',
    workedExample: 'Rows [1, 2] and [-1, 1] applied to input [3, 2] produce the vector [7, -1].',
    independentTask: 'Design a two-row matrix whose outputs are the sum and the first-minus-second difference of two input coordinates.',
  }),
  defineSectionActivity('chapter-2', '2.3.10', {
    objectives: ['Validate dimensions before composing two linear maps.'],
    explanation: 'The shared inner dimension indexes the contributions summed in a matrix product. If A has shape (m, k) and B has shape (k, n), entry (i, j) is the dot product of row i of A with column j of B.',
    workedExample: 'Four examples with six features form a (4, 6) batch. Multiplying by weights shaped (6, 2) yields two outputs per example.',
    independentTask: 'Follow a (7, 5) batch through weights shaped (5, 3) and (3, 2). Give both intermediate output shapes.',
  }),
  defineSectionActivity('chapter-2', '2.3.11', {
    objectives: ['Compute and compare L1 and L2 vector norms.'],
    explanation: 'The L1 norm adds coordinate magnitudes. The L2 norm is the square root of the sum of squared coordinates. Both are nonnegative and vanish only at the zero vector, but they measure length differently.',
    workedExample: 'Vector [-3, 4] has L1 norm 7 and L2 norm 5, using absolute values for L1 and squares for L2.',
    independentTask: 'Compare [4, 0] and [2, 2] under L1 and L2. Explain how they tie under one norm while differing under the other.',
  }),
];

export const linearAlgebraClassifications: CoverageClassification[] = [
  { sourceId: '2.3', kind: 'container' },
  { sourceId: '2.3.12', kind: 'summary' },
  { sourceId: '2.3.13', kind: 'exercise-heading' },
];

export const linearAlgebraExercises = [
  defineExerciseActivity('chapter-2', '2.3.13.exercise.1', {
    prompt: 'A table with four samples and seven features stores 19 at zero-based position (1, 5). Trace that entry through two transposes and explain where all other entries end up.',
    hints: ['Swap the row and column indices once per transpose.', 'Track both the entry position and the overall shape.'],
    evaluation: { kind: 'rubric', criteria: ['Tracks (1, 5) to (5, 1) and back to (1, 5).', 'Explains that any position follows the same index swap twice.'] },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.2', {
    prompt: 'Two sensors produce equally shaped time-by-channel tables. Show, using a particular output coordinate, why swapping the axes after adding gives the same result as adding the swapped tables.',
    hints: ['Write one entry in the channel-by-time result.', 'Identify its matching coordinate in each original table.'],
    evaluation: { kind: 'rubric', criteria: ['Expresses both computations at output position (c, t) as A[t, c] + B[t, c].', 'Notes that the equality applies to every position.'] },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.3', {
    prompt: 'A square matrix W describes directed link weights among stations. Construct a symmetric matrix by summing the weights in both directions, and explain what happens to a self-link.',
    hints: ['A reverse link swaps its two station indices.', 'Apply the same sum to a diagonal entry.'],
    evaluation: { kind: 'rubric', criteria: ['Constructs W + W transpose and shows swapped entries have equal sums.', 'Explains that each diagonal entry is doubled.'] },
  }),
];
