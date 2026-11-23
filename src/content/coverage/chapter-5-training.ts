import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-5';

export const mlpTrainingSections = [
  defineSectionActivity(chapterId, '5.3', {
    objectives: ['Separate computing a prediction from differentiating its loss.'],
    explanation: 'A forward pass evaluates operations from inputs to loss. A backward pass propagates derivatives from that scalar loss to the parameters. An optimizer then uses those derivatives to decide how to update the parameters.',
    workedExample: 'For a prediction wx with squared error (wx − y)², forward evaluation computes wx and the residual. Backward multiplies 2(wx − y) by x to obtain the derivative for w.',
    independentTask: 'For w = 1, x = 3 and y = 4, calculate the forward loss and its derivative with respect to w. Identify which computation would be needed at prediction time.',
  }),
  defineSectionActivity(chapterId, '5.3.1', {
    objectives: ['Trace a hidden representation from input to objective.'],
    explanation: 'Each layer consumes values produced by earlier nodes. In an MLP, the hidden layer applies an activation after its linear transformation, and the output enters the task loss. Any parameter penalty is a separate contribution to the total objective.',
    workedExample: 'With hidden preactivation −2 and ReLU, the hidden output is zero. An output bias can still make a nonzero prediction, and a weight penalty can still increase the objective.',
    independentTask: 'Draw a dependency list for a two-layer scalar network with ReLU and a weight penalty. Mark which quantities depend directly on the training target.',
  }),
  defineSectionActivity(chapterId, '5.3.2', {
    objectives: ['Read dependencies from a forward computational graph.'],
    explanation: 'A computational graph connects each operation to its inputs. One value may feed several later operations. Recording this branching makes it possible to determine which local derivatives must contribute to each backward result.',
    workedExample: 'A weight used in both a prediction and its squared norm has two outgoing paths to the objective. The target enters only through the prediction loss.',
    independentTask: 'Sketch the graph for L = (ab − 3)² + a². Label the nodes that depend on a and the two separate paths from a to L.',
  }),
  defineSectionActivity(chapterId, '5.3.3', {
    objectives: ['Apply the chain rule backward through branches.'],
    explanation: 'Reverse-mode differentiation multiplies each incoming loss sensitivity by the derivative of the current operation with respect to a given input. When the same input is used in different branches, its total sensitivity is the sum of the contributions.',
    workedExample: 'For z = u² and L = z + 3u, the path through z contributes 2u and the direct path contributes 3. The derivative is therefore 2u + 3.',
    independentTask: 'Differentiate L = (2u + 1)² + u² at u = 2 by tracing the two branches separately before adding them.',
  }),
  defineSectionActivity(chapterId, '5.3.4', {
    objectives: ['Explain why training stores more state than inference.'],
    explanation: 'During training, differentiation typically saves intermediate forward values for reuse in local derivatives. Prediction without gradient tracking can discard intermediates after their final use. A larger batch increases the size of many of the tensors that training must save.',
    workedExample: 'The derivative of a hidden weight matrix uses the input entering that layer and the upstream gradient. Training must retain that input or reconstruct it before the backward operation.',
    independentTask: 'Compare a training pass with a no-gradient evaluation pass for the same batch. List two categories of data stored only during training.',
  }),
  defineSectionActivity(chapterId, '5.4', {
    objectives: ['Identify when gradient scale makes optimization unreliable.'],
    explanation: 'The scale of activations and gradients can vary across depth, especially when repeatedly multiplying by transformations with very small or large gains. Initialization sets the early operating scales and affects how effectively the network can begin learning.',
    workedExample: 'A product of six scalar gains of 0.2 is 0.000064, even though every factor is nonzero. A similar chain of gains above one can amplify sensitivity.',
    independentTask: 'Compare two ten-layer scalar chains with gains 0.8 and 1.2. Predict which input sensitivity will shrink and which will grow, then compute both products.',
  }),
  defineSectionActivity(chapterId, '5.4.1', {
    objectives: ['Diagnose vanishing gradients, exploding gradients and hidden-unit symmetry.'],
    explanation: 'Backward derivatives multiply layer Jacobians. Consistent contraction makes sensitivities vanish, while repeated amplification can produce unstable gradients. Hidden units with identical weights, biases and downstream roles can also remain identical under deterministic training.',
    workedExample: 'A sigmoid near either saturation limit contributes a derivative near zero. If many saturated layers appear in sequence, little gradient reaches the earliest weights.',
    independentTask: 'Given layerwise gradient norms of [0.00001, 0.001, 0.1, 1] from input to output, propose one likely cause and one activation statistic you would inspect to test it.',
  }),
  defineSectionActivity(chapterId, '5.4.2', {
    objectives: ['Choose an initialization scale using layer widths.'],
    explanation: 'For a linear layer with independent, centered weights, its output variance scales with fan-in and the variance of those weights. Xavier initialization balances the forward fan-in and backward fan-out considerations by targeting weight variance 2 divided by their sum.',
    workedExample: 'A layer with fan-in 80 and fan-out 120 has a Xavier target variance of 0.01, corresponding to a standard deviation of 0.1.',
    independentTask: 'Compute the Xavier variance for a layer with fan-in 32 and fan-out 96. Explain why reusing a fixed variance for every width can make activations drift in scale.',
  }),
];

export const mlpTrainingClassifications: CoverageClassification[] = [
  { sourceId: '5.3.5', kind: 'summary' },
  { sourceId: '5.3.6', kind: 'exercise-heading' },
  { sourceId: '5.4.3', kind: 'summary' },
  { sourceId: '5.4.4', kind: 'exercise-heading' },
];

export const mlpTrainingExercises = [
  defineExerciseActivity(chapterId, '5.3.6.exercise.1', {
    prompt: 'An image patch is stored in a 4 × 6 matrix X, and a loss is the sum of its squared entries. Give the shape of the gradient with respect to X and its value at position (i, j).',
    hints: ['Each input entry has one partial derivative.', 'All other entries are held constant in that derivative.'],
    evaluation: { kind: 'rubric', criteria: ['States that the gradient is 4 × 6.', 'Computes the derivative at position (i, j) as 2X[i, j].'] },
  }),
  defineExerciseActivity(chapterId, '5.3.6.exercise.2', {
    prompt: 'For a single example, define hidden preactivation a = Wx + b, hidden state h = ReLU(a) and prediction vᵀh. Draw the graph through a scalar prediction loss and derive the gradients of the hidden weights and bias.',
    hints: ['Treat the derivative of the scalar loss with respect to the prediction as the backward seed.', 'The addition of b passes the hidden preactivation gradient directly to b.'],
    evaluation: { kind: 'rubric', criteria: ['Shows the added bias branch before ReLU and its connection to the loss.', 'Writes the hidden preactivation gradient as the prediction derivative times v, multiplied entrywise by the ReLU derivative.', 'Uses that gradient directly for b and takes its outer product with x for W.'] },
  }),
  defineExerciseActivity(chapterId, '5.3.6.exercise.3', {
    prompt: 'Estimate the storage for one saved float32 activation per hidden example in a batch of 256 examples with hidden width 128. Explain why this activation-storage estimate is only one part of the training footprint and how inference differs.',
    hints: ['A float32 value takes four bytes.', 'Separate activation storage from weights, gradients, and optimizer state.'],
    evaluation: { kind: 'rubric', criteria: ['Computes 131,072 bytes for the specified tensor.', 'Distinguishes saved activations from other costs.', 'Explains that no-gradient inference can discard inputs to operations after their last forward use.'] },
  }),
  defineExerciseActivity(chapterId, '5.3.6.exercise.4', {
    prompt: 'For the scalar objective L(w) = w⁴, compute the gradient and its derivative. Then explain what must change in an autodiff call to get a Hessian-vector product for a model with many parameters.',
    hints: ['Differentiate the gradient expression as another function.', 'The gradient computation must itself be recorded for further differentiation.'],
    evaluation: { kind: 'rubric', criteria: ['Computes 4w³ and 12w².', 'Records the first gradient computation and differentiates its dot product with a fixed vector.', 'Explains that a Hessian-vector product avoids materializing all parameter-pair entries while adding work beyond a first derivative.'] },
  }),
  defineExerciseActivity(chapterId, '5.3.6.exercise.5', {
    prompt: 'A model fits on one GPU but its saved activations exceed memory at the desired batch size. Compare shrinking the batch, accumulating gradients across microbatches, and placing consecutive stages on separate GPUs.',
    hints: ['Consider the effective batch and optimizer update frequency.', 'A stage boundary transports activations forward and gradients backward.'],
    evaluation: { kind: 'rubric', criteria: ['Explains how smaller microbatches lower activation memory.', 'Identifies how gradient accumulation can preserve effective batch size.', 'Discusses both memory benefits and communication costs of partitioning.'] },
  }),
  defineExerciseActivity(chapterId, '5.4.4.exercise.1', {
    prompt: 'A model averages two parallel nonlinear branches. Both branches use identical initial parameters and process identical inputs. Predict whether deterministic gradient descent will specialize the branches, and propose a symmetry-breaking change.',
    hints: ['Swapping the branch identities leaves the average unchanged.', 'Compare the two branch gradients at the equal-parameter point.'],
    evaluation: { kind: 'rubric', criteria: ['Explains why equal gradients and equal updates preserve branch equality.', 'Proposes distinct random initializations or another explicit source of asymmetric updates.'] },
  }),
  defineExerciseActivity(chapterId, '5.4.4.exercise.2', {
    prompt: 'Compare zero initialization for a single linear regressor and a single-layer softmax classifier. Give one reason that their weights can learn even if initialized equally, and identify a case where the first update could still leave some coordinates equal.',
    hints: ['For regression the gradient depends on feature-residual correlation.', 'For softmax the class-specific target indicator enters the logit derivative.'],
    evaluation: { kind: 'rubric', criteria: ['Distinguishes equal initial weights from identical hidden-unit roles.', 'Explains why feature-residual or class-target differences can produce different gradients.', 'Gives a valid degenerate case, such as identical feature columns producing identical updates.'] },
  }),
  defineExerciseActivity(chapterId, '5.4.4.exercise.3', {
    prompt: 'Let A and B both be the shear matrix with rows [1, 3] and [0, 1]. Compute AB, compare eigenvalues with the amplification of [0, 1], and name a matrix quantity that can bound amplification in any direction.',
    hints: ['For an upper triangular matrix, the eigenvalues are its diagonal entries.', 'Apply AB to the unit vector along the second coordinate.'],
    evaluation: { kind: 'rubric', criteria: ['Finds rows [1, 6] and [0, 1] with eigenvalues both equal to 1.', 'Shows norm amplification from 1 to the square root of 37.', 'Uses the largest singular value for a bound on amplification and distinguishes it from eigenvalues.'] },
  }),
  defineExerciseActivity(chapterId, '5.4.4.exercise.4', {
    prompt: 'Two layers have weight norm 10 each and gradient norms 2 and 200. Compare their relative update sizes under one common learning rate of 0.01. Explain how scaling each update by a layer-wise weight-to-gradient norm ratio would change the comparison.',
    hints: ['Divide the proposed update norm by the weight norm.', 'The layer-wise ratio cancels the gradient norm when both norms are nonzero.'],
    evaluation: { kind: 'rubric', criteria: ['Computes relative update magnitudes of 0.002 and 0.2.', 'Shows that norm-ratio scaling brings the relative magnitudes into alignment in this simplified calculation.', 'Separates controlling future finite updates from recovering after parameters have already become nonfinite.'] },
  }),
];
