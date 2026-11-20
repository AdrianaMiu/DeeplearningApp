import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

export const autodiffSections = [
  defineSectionActivity('chapter-2', '2.5', {
    objectives: ['Trace a scalar objective through a computation graph.', 'Use the chain rule to combine gradient contributions along multiple paths.'],
    explanation: 'A forward pass evaluates operations and records the dependencies of each intermediate tensor. Reverse-mode automatic differentiation starts from an objective and propagates its sensitivity backward through those operations. Along one path it composes local derivatives with the chain rule. When a value contributes through several paths, their sensitivities add. One reverse pass from a scalar loss can produce derivatives for all the parameters that influence it.',
    workedExample: 'Set u = 3x and L = u² + x. At x = 2, the square sends a sensitivity of 2u = 12 to u. Multiplication by 3 sends 36 back to x, and the direct addition sends another 1, giving dL/dx = 37.',
    independentTask: 'Draw the graph for L = (2x + y)² + y at x = 1 and y = 3. Label the local derivatives and compute both input gradients.',
  }),
  defineSectionActivity('chapter-2', '2.5.1', {
    objectives: ['Compute a scalar objective’s gradient with respect to a leaf tensor.', 'Predict when gradient contributions accumulate in .grad.'],
    explanation: 'In PyTorch, enable requires_grad on a floating-point input before computing the objective. Calling backward() on the scalar objective adds each contribution to the tracked leaf tensor’s .grad field, which initially is None. The gradient has the same shape as the input. Clear it before a new independent gradient calculation. To combine contributions from several objectives, keep the buffer between backward calls.',
    workedExample: 'For x = [1, −2], let L = 3(x * x).sum(). After L.backward(), x.grad is [6, −12]. Backpropagating a freshly computed x.sum() then produces [7, −11] in the same buffer. Clearing the buffer before that second calculation gives [1, 1].',
    independentTask: 'Use a fresh leaf tensor x = [2, 4] to compare the gradients of (x * x).sum() and (2 * x).sum(). Predict and verify the buffer after each call with and without clearing it between objectives.',
  }),
  defineSectionActivity('chapter-2', '2.5.2', {
    objectives: ['Identify what a Jacobian entry measures.', 'Compute a weighted combination of output gradients using an explicit backward seed.'],
    explanation: 'For vector output y and vector input x, the Jacobian J has entries Jᵢⱼ = ∂yᵢ/∂xⱼ. PyTorch backward() on a multi-element output requires an upstream gradient v with the output’s shape. It computes vᵀJ, the input gradient of the weighted sum of outputs with weights v held fixed. An all-ones seed gives the same result as summing the outputs and backpropagating the scalar sum.',
    workedExample: 'For y = [x₁², x₁ + x₂] at x = [3, 5], the Jacobian rows are [6, 0] and [1, 1]. The seed [2, −1] combines twice the first row and minus the second row to give [11, −1].',
    independentTask: 'For y = [x₁x₂, x₂²] at x = [2, 4], predict the input gradient for seeds [1, 0], [0, 1], and [1, 1]. Relate each result to the Jacobian.',
  }),
  defineSectionActivity('chapter-2', '2.5.3', {
    objectives: ['Explain how detach changes which paths carry gradients.', 'Compare identical forward values with different backward derivatives.'],
    explanation: 'Calling detach() returns a tensor with the current value of an intermediate, and operations consuming that tensor treat it as constant for differentiation. The original intermediate retains its history. If the input also reaches the output along another tracked path, that path still contributes to the gradient.',
    workedExample: 'For x = 2 and u = x², x * u and x * u.detach() both evaluate to 8. In x * u, differentiating x and u contributes 4 + 8 = 12. In x * u.detach(), only the explicit factor x contributes, so the derivative is 4.',
    independentTask: 'Compare the value and gradient of (x² + x) * x when both factors are tracked, then when the final x is detached. Evaluate at x = 3 and explain the missing gradient term.',
  }),
  defineSectionActivity('chapter-2', '2.5.4', {
    objectives: ['Trace differentiable operations through input-dependent Python control flow.', 'Explain why a backward pass describes the path taken for a particular input.'],
    explanation: 'PyTorch records tensor operations as a program runs. A different loop count or branch can therefore create a different graph. Backward propagation differentiates the executed operations. At a point where a decision changes, the reported derivative follows the selected branch, and the piecewise function may lack a derivative there.',
    workedExample: 'For a nonzero scalar a, start with b = a and double b until |b| ≥ 8, then return b for a positive input or 3b for a negative input. For a = 3, two doublings give 12 and derivative 4. For a = −5, one doubling and the final scaling give −30 and derivative 6.',
    independentTask: 'For the same program, use fresh scalar leaves initialized to 1.5 and −3. Predict the loop counts, outputs, and gradients, then verify them with backward().',
  }),
];

export const autodiffClassifications: CoverageClassification[] = [
  { sourceId: '2.5.5', kind: 'summary' },
  { sourceId: '2.5.6', kind: 'exercise-heading' },
];

function exercise(number: number, prompt: string, hints: string[], criteria: string[]) {
  return defineExerciseActivity('chapter-2', `2.5.6.exercise.${number}`, {
    prompt,
    hints,
    evaluation: { kind: 'rubric', criteria },
  });
}

export const autodiffExercises = [
  exercise(1,
    'For the scalar objective x⁴ at x = 2, use autograd to compute the first and second derivatives. Explain what extra graph construction, saved data, and traversal are needed for the second derivative.',
    ['Try torch.autograd.grad with create_graph=True for the first derivative.', 'Differentiate the resulting gradient tensor with respect to the original input.'],
    ['Obtains first and second derivatives of 32 and 48.', 'Explains why differentiable operations used to form the first derivative must themselves be recorded.', 'Identifies additional time or memory costs without assuming a fixed cost ratio.']),
  exercise(2,
    'Compute a scalar loss containing x * x from a tracked leaf. Call backward() twice on that same result and record what happens. Repeat using a fresh forward pass for the second calculation, and explain how this affects both graph reuse and the gradient buffer.',
    ['Pick an operation whose backward pass needs saved intermediate values.', 'For an additional comparison, use retain_graph=True on the first call of a fresh trial.'],
    ['Observes that reusing this graph ordinarily fails after saved intermediates are released.', 'Shows that recomputing the forward pass, or retaining the original graph, permits another backward call.', 'Separately tracks accumulation in .grad when the buffer is left intact.']),
  exercise(3,
    'Modify the control-flow example to use a vector and then a matrix. Use the norm of b for the loop condition and the sum of b for the final sign test. For each input, predict the realized scale and output shape, then examine the effect of passing an explicit backward seed.',
    ['Choose nonzero inputs whose norms and sums are away from decision boundaries.', 'On a fixed path, f(a) = c · a for some shared scalar c.'],
    ['Determines the scale from the loop count and chosen branch.', 'Explains why a multi-element output requires an upstream gradient or a scalar reduction.', 'Shows that an arbitrary seed gives c times that seed, and an all-ones seed gives the gradient of the output sum.']),
  exercise(4,
    'Use automatic differentiation to sample the derivative of sin(x) on a grid from −π to π. Plot the function and the computed derivative together, then identify where the function has a horizontal tangent and where it increases.',
    ['Enable gradients on the grid before evaluating sine.', 'The outputs depend on independent grid coordinates, so the derivative of their sum provides one slope per coordinate.'],
    ['Obtains the slopes from autograd and plots them alongside the original samples.', 'Explains why summing a vector of independent outputs returns the desired coordinatewise slopes.', 'Uses the plotted slopes to identify horizontal tangents near ±π/2 and the increasing interval between them.']),
  exercise(5,
    'Draw the dependency graph for f(x) = log(x²) · sin(x) + 1/x. Give each intermediate a name and specify which real inputs make the whole graph valid.',
    ['Use separate nodes for squaring, taking the natural logarithm, evaluating sine, and taking the reciprocal.', 'The addition combines the reciprocal and the product of the log and sine branches.'],
    ['Includes each operation in dependency order and shows where x is reused.', 'Connects the log to x² before the multiplication.', 'Identifies the domain as x ≠ 0.']),
  exercise(6,
    'Add local derivative labels to the edges in the graph for f(x) = log(x²) · sin(x) + 1/x. Apply the chain rule along every path from x to f, and combine the contributions into a formula for f′(x).',
    ['At the multiplication node, each incoming edge has the other operand as its local derivative.', 'The logarithm receives the square, so its local derivative is 1/x².'],
    ['Labels local derivatives for each operation, including −1/x² for the reciprocal.', 'Accounts for both product branches and the reciprocal branch.', 'Obtains f′(x) = 2 sin(x)/x + log(x²) cos(x) − 1/x² for x ≠ 0.']),
  exercise(7,
    'Use the graph for f(x) = log(x²) · sin(x) + 1/x to compute f′(1) twice. First propagate derivatives from x toward f. Then propagate sensitivities from f back to x. Record intermediate values in both passes.',
    ['Start the forward derivative at dx/dx = 1 and the backward sensitivity at ∂f/∂f = 1.', 'In the backward pass, add the contributions that meet at the shared input x.'],
    ['Propagates tangents through each operation in dependency order.', 'Propagates sensitivities in reverse dependency order and adds the contributions at x.', 'Obtains 2 sin(1) − 1 in both passes.']),
  exercise(8,
    'Compare forward and reverse differentiation for a map from two inputs to 200 outputs and for a map from 200 inputs to one output. Count directional sweeps for each entire Jacobian and discuss memory and parallelism.',
    ['A forward sweep uses an input seed to obtain a Jacobian column when the seed is a coordinate vector.', 'A reverse sweep uses an output seed to obtain a Jacobian row when the seed is a coordinate vector.'],
    ['Chooses forward mode for the first full Jacobian (2 sweeps rather than 200) and reverse mode for the second (1 sweep rather than 200).', 'Explains that reverse mode typically retains forward intermediates for later use or recomputes them.', 'Recognizes that independent seed directions can be batched or parallelized at additional resource cost.']),
];
