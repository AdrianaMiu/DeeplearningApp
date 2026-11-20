import { defineExerciseActivity } from './authoring';

export const remainingAlgebraExercises = [
  defineExerciseActivity('chapter-2', '2.3.13.exercise.4', {
    prompt: 'A PyTorch tensor X stores 5 days of data from 3 rooms with 4 readings per room each day. Its shape is (5, 3, 4). Predict len(X), then verify your prediction with torch.zeros(5, 3, 4).',
    hints: ['Imagine iterating through X one outer slice at a time.', 'Each slice contains one day of readings.'],
    evaluation: {
      kind: 'answer',
      answer: '5',
      explanation: 'len(X) counts the five slices along axis 0. Each slice has shape (3, 4).',
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.5', {
    prompt: 'Predict len(X) for PyTorch tensors with shapes (8,), (0, 3), (2, 7, 9), and (). From these predictions, state when len(X) is defined and which axis it measures.',
    hints: ['Read each shape from left to right.', 'Consider whether a scalar has an axis to measure.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Gives lengths 8, 0, and 2 for the first three tensors.', 'States that len(X) returns the size of axis 0 for any tensor with at least one axis.', 'Explains that calling len(X) on a scalar tensor raises TypeError.'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.6', {
    prompt: 'A PyTorch matrix A has rows [2, 4] and [3, 9]. Compute A / A.sum(dim=1), identify which entries share denominators, and fix the expression so each row sums to 1. Would the original division broadcast for shape (2, 3)?',
    hints: ['The two row sums are 6 and 12. Broadcasting aligns the resulting vector with the last axis.', 'Keep the reduced axis as a singleton so that each denominator can stretch across a row.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Finds the result [[1/3, 1/3], [1/2, 3/4]] and identifies that each column shares a denominator.', 'Uses A.sum(dim=1, keepdim=True) with shape (2, 1) to divide each row by its own sum.', 'Explains that the original division fails for shape (2, 3) because trailing sizes 3 and 2 cannot broadcast.'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.7', {
    prompt: 'A street grid has unit-length blocks and permits travel only along the two coordinate axes. What is the shortest walking distance from intersection (2, 7) to (6, 4)? Give a route and explain how the answer relates to the L1 norm.',
    hints: ['Count the required moves in each coordinate separately.', 'A single move changes exactly one coordinate by one unit.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Gives a route with four moves in the positive first-coordinate direction and three in the negative second-coordinate direction.', 'Computes 7 blocks using the L1 norm of the displacement (4, -3).', 'Explains that every route must make at least the required moves in each coordinate and that diagonal moves are unavailable.'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.8', {
    prompt: 'A tensor has shape (4 orchards, 6 weeks, 3 fruit varieties). Find the shape and describe one output entry when you sum over axis 0, axis 1, and axis 2, separately, with keepdim=False.',
    hints: ['Cross out the dimension of the axis being summed.', 'The remaining indices identify the entries that stay distinct.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Gives (6, 3) for axis 0, with one total across orchards per week and variety.', 'Gives (4, 3) for axis 1, with one total across weeks per orchard and variety.', 'Gives (4, 6) for axis 2, with one total across varieties per orchard and week.'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.9', {
    prompt: 'Create a floating-point PyTorch tensor of shape (2, 2, 2) that is zero except for entries -3 and 4 in different slices. Predict torch.linalg.norm(X) with its default arguments, verify it in code, and describe how to compute the same value for a tensor of any shape.',
    hints: ['The two nonzero entries make all the contributions to the squared length.', 'Compare the result with the Euclidean length of the flattened tensor.'],
    evaluation: {
      kind: 'answer',
      answer: '5',
      explanation: 'With default ord and dim, torch.linalg.norm treats all entries as one vector. It returns the square root of the sum of the squared entries, which is sqrt(9 + 16) = 5 here.',
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.10', {
    prompt: 'Let A have shape (64, 128), B have shape (128, 8), and C have shape (8, 32). Compare (AB)C with A(BC) by counting scalar multiplications and the entries in each intermediate. Which order would you expect to use less temporary storage and arithmetic?',
    hints: ['For an (m, k) by (k, n) product, count one multiplication for each combination of row, inner index, and column.', 'Compute the shape and cost of the first product before counting the second product.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Finds the (64, 8) intermediate with 512 entries for (AB)C and the (128, 32) intermediate with 4,096 entries for A(BC).', 'Counts 81,920 scalar multiplications for (AB)C and 294,912 for A(BC).', 'Selects (AB)C for the smaller intermediate and arithmetic count and recognizes that both orders produce shape (64, 32).'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.11', {
    prompt: 'In PyTorch, A is a contiguous (128, 256) matrix, B is a contiguous (256, 32) matrix, and C is an independently allocated contiguous (32, 256) matrix. Compare A @ B and A @ C.T. Then set C = B.T without copying and revisit the comparison. Explain what the strides predict and how you would check runtime.',
    hints: ['Compare both the arithmetic counts and the strides of the right operands.', 'A transpose view swaps strides, so applying it twice recovers the original layout.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Identifies equal output shapes and multiplication counts, with right-operand strides (32, 1) for B and (1, 256) for the independently allocated C.T.', 'Explains that operand layout may change kernel behavior and that timing depends on the backend and hardware. Proposes repeated timings on the same device and dtype, with warm-up and synchronization for asynchronous devices.', 'Explains that C = B.T shares storage and C.T recovers the same values and strides as B without a copy.'],
    },
  }),
  defineExerciseActivity('chapter-2', '2.3.13.exercise.12', {
    prompt: 'Three PyTorch matrices A, B, and C each have shape (4, 6). Stack them so the third axis identifies the original matrix. Give the resulting shape, write an expression that recovers B, and check elementwise equality.',
    hints: ['Stacking inserts a new axis of size three.', 'Index the second matrix with zero-based index 1 and keep both original axes.'],
    evaluation: {
      kind: 'rubric',
      criteria: ['Uses X = torch.stack([A, B, C], dim=2) to create shape (4, 6, 3).', 'Recovers a (4, 6) matrix with X[:, :, 1] and verifies it using torch.equal(X[:, :, 1], B) or an equivalent equality check.'],
    },
  }),
];
