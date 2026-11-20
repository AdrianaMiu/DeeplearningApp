import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-3';

export const trainingSections = [
  defineSectionActivity(chapterId, "3.2", {
    objectives: ["Separate training responsibilities"],
    explanation: "A reusable training pipeline separates what the model computes, where batches come from, and how optimization steps are executed. This keeps experimental changes local and makes each piece testable.",
    workedExample: "Switching from synthetic to logged measurements should change the data component while preserving the forward calculation.",
    independentTask: "List the three components for a house-price baseline and assign one responsibility to each.",
  }),
  defineSectionActivity(chapterId, "3.2.1", {
    objectives: ["Capture reproducible configuration"],
    explanation: "Store durable experiment choices such as learning rate and batch size separately from transient state such as gradients. Explicit configuration makes two runs comparable and helps reproduce a curve.",
    workedExample: "Two runs tagged with their seed and learning rate can be compared without inferring settings from their loss plots.",
    independentTask: "Design metadata for a regression run, and explain which values belong in a checkpoint instead of its configuration.",
  }),
  defineSectionActivity(chapterId, "3.2.2", {
    objectives: ["Define the model contract"],
    explanation: "A model can expose a prediction method, a loss function and a way to configure optimization. Training and validation share the prediction path, but validation measures error without updating parameters.",
    workedExample: "A linear model predicts one value per row, then a common loss measures the mean squared residual on either split.",
    independentTask: "Describe a model contract that supports both minibatch training and single-example prediction.",
  }),
  defineSectionActivity(chapterId, "3.2.3", {
    objectives: ["Design separate data loaders"],
    explanation: "A data component can expose separate loaders for training and validation. Keep targets paired with features, draw training batches in shuffled order when appropriate, and leave validation data out of optimization.",
    workedExample: "A dataset of 120 rows can expose 100 shuffled training rows and 20 held-out rows in fixed evaluation order.",
    independentTask: "Specify a train and validation loader for 53 samples, including split sizes and how you handle a partial batch.",
  }),
  defineSectionActivity(chapterId, "3.2.4", {
    objectives: ["Trace one trainer update"],
    explanation: "The trainer coordinates data iteration, forward computation, loss, backpropagation and parameter updates. It also owns when validation happens so evaluation cannot accidentally update the model.",
    workedExample: "A trainer might evaluate once after each epoch while still computing one gradient step per training batch.",
    independentTask: "Write pseudocode for an epoch with two training minibatches and one validation round. Mark the parameter updates.",
  }),
  defineSectionActivity(chapterId, "3.3", {
    objectives: ["Use synthetic data as a test fixture"],
    explanation: "Synthetic data lets you control the relationship between features and labels. Because the generating parameters are known, you can distinguish a broken pipeline from a difficult dataset.",
    workedExample: "When targets follow a known affine rule without noise, a trained linear baseline should approach that rule.",
    independentTask: "Propose a synthetic dataset that can reveal a swapped feature column or a missing intercept.",
  }),
  defineSectionActivity(chapterId, "3.3.1", {
    objectives: ["Generate labels from a known rule"],
    explanation: "Draw a feature matrix with one sample per row and compute targets with an affine map. Independent zero-mean noise models measurement variation without systematically shifting the target mean.",
    workedExample: "For weights [2, -1], bias 3 and example [4, 5], the noiseless target is 8 - 5 + 3 = 6.",
    independentTask: "Choose two different input rows, compute their clean targets, and explain what changes when noise is added.",
  }),
  defineSectionActivity(chapterId, "3.3.2", {
    objectives: ["Batch using shared sample indices"],
    explanation: "A minibatch iterator selects indices and applies the same selection to inputs and labels. Shuffling the indices preserves pairing while changing which samples contribute to each update.",
    workedExample: "Using index order [4, 1, 0] means both the feature matrix and target vector must use that exact ordering.",
    independentTask: "For seven rows and batch size three, sketch a full shuffled epoch and label the final batch size.",
  }),
  defineSectionActivity(chapterId, "3.3.3", {
    objectives: ["Configure a framework data loader"],
    explanation: "A loader combines sample storage with iteration policy. The dataset maps indices to examples, while the loader controls batch size, ordering and whether to include a final incomplete batch.",
    workedExample: "Ten samples at batch size four yield batches of four, four and two when incomplete batches are included.",
    independentTask: "Construct the expected batch sizes for eleven samples with batch size four, with and without dropping the tail.",
  }),
  defineSectionActivity(chapterId, "3.4", {
    objectives: ["Assemble a minimal regression pipeline"],
    explanation: "Scratch implementation exposes prediction, objective and the update rule directly. Testing each in isolation makes mistakes in residual shape or gradient scaling easier to diagnose.",
    workedExample: "Before training, check one known prediction and verify that making the prediction closer to the target reduces its squared error.",
    independentTask: "Invent a two-example dataset and list three numerical assertions for the model, loss and first update.",
  }),
  defineSectionActivity(chapterId, "3.4.1", {
    objectives: ["Compute linear predictions in batches"],
    explanation: "Store one weight per input feature and a scalar intercept. Multiplying each sample by the weight column yields one score, and broadcasting adds the same intercept to every score.",
    workedExample: "A (6, 4) input multiplied by a (4, 1) weight column yields a (6, 1) prediction before bias addition.",
    independentTask: "Give the parameter and output shapes for a batch of five observations with seven predictors.",
  }),
  defineSectionActivity(chapterId, "3.4.2", {
    objectives: ["Align predictions and targets before loss"],
    explanation: "Squared loss pairs each prediction with its own label. Matching shapes prevents broadcasting across examples. A mean reduction keeps the objective scale comparable across batch sizes.",
    workedExample: "Subtracting targets shaped (3,) from predictions shaped (3, 1) creates nine residuals, even though only three comparisons are intended.",
    independentTask: "For a batch of four, show one correct pair of shapes and explain how to verify that each residual uses its matching target.",
  }),
  defineSectionActivity(chapterId, "3.4.3", {
    objectives: ["Apply a gradient step at the right scale"],
    explanation: "Gradient descent subtracts the learning rate times the gradient from each parameter. If the loss already averages over the minibatch, dividing by batch size again shrinks the intended update.",
    workedExample: "With parameter 2, gradient 3 and learning rate 0.1, the next parameter is 1.7 before any momentum or regularization.",
    independentTask: "Compute the next parameter vector from [2, -1], gradient [3, -2] and learning rate 0.1.",
  }),
  defineSectionActivity(chapterId, "3.4.4", {
    objectives: ["Sanity-check training against known weights"],
    explanation: "Track error across epochs and compare the fitted coefficients with the data-generating parameters. Leave room for estimation error under noise, and use validation to check performance on unseen samples.",
    workedExample: "If synthetic data has true weight 2 and no noise, a well-fitted estimate of 1.99 is more plausible than 0.1 even if both runs finish.",
    independentTask: "Explain how to diagnose whether a flat training curve comes from a zero learning rate or an inactive gradient path.",
  }),
];

export const trainingClassifications: CoverageClassification[] = [
  { sourceId: "3.2.5", kind: 'summary' },
  { sourceId: "3.2.6", kind: 'exercise-heading' },
  { sourceId: "3.3.4", kind: 'summary' },
  { sourceId: "3.3.5", kind: 'exercise-heading' },
  { sourceId: "3.4.5", kind: 'summary' },
  { sourceId: "3.4.6", kind: 'exercise-heading' },
];

export const trainingExercises = [
  defineExerciseActivity(chapterId, "3.2.6.exercise.1", {
    prompt: "Trace how one batch travels through a trainer, model and data module, then identify where to implement a new loss function.",
    hints: ["Identify the method that supplies batches.", "Follow the prediction into the objective."],
    evaluation: { kind: 'rubric', criteria: ["Assigns data iteration, prediction and loss to the proper responsibilities."] },
  }),
  defineExerciseActivity(chapterId, "3.2.6.exercise.2", {
    prompt: "A constructor receives width but never assigns self.width. Compare reading self.width after removing a helper that copied constructor arguments into attributes.",
    hints: ["Local arguments expire after the call.", "Look for an explicit instance assignment."],
    evaluation: { kind: 'rubric', criteria: ["Explains the missing attribute and shows how to assign it explicitly."] },
  }),
  defineExerciseActivity(chapterId, "3.3.5.exercise.1", {
    prompt: "A loader groups 26 samples into batches of eight. State what is emitted when incomplete batches are allowed and when the final partial batch is dropped.",
    hints: ["Divide 26 by the batch size and keep the remainder.", "Think about what the drop-last option changes."],
    evaluation: { kind: 'rubric', criteria: ["Reports 8, 8, 8, 2 versus 8, 8, 8."] },
  }),
  defineExerciseActivity(chapterId, "3.3.5.exercise.2", {
    prompt: "Design an epoch iterator for an on-disk synthetic dataset too large for RAM. Explain how to vary sample order without relying on one disk seek per example.",
    hints: ["Store records in contiguous chunks.", "Shuffle chunk order and optionally shuffle records after loading a chunk."],
    evaluation: { kind: 'rubric', criteria: ["Bounds memory use and describes the randomness and disk-access tradeoff."] },
  }),
  defineExerciseActivity(chapterId, "3.3.5.exercise.3", {
    prompt: "Sketch an iterator that samples a new feature batch and corresponding noisy targets whenever a learner requests the next batch.",
    hints: ["Sample features before computing targets.", "Decide how the iterator signals the end of an epoch."],
    evaluation: { kind: 'rubric', criteria: ["Computes paired targets from each fresh batch and defines an epoch length."] },
  }),
  defineExerciseActivity(chapterId, "3.3.5.exercise.4", {
    prompt: "Design a generator that reproduces a sequence of synthetic batches after being restarted, and describe how to test reproducibility.",
    hints: ["Use a local pseudorandom generator.", "Reset the generator when starting a new reproducibility check."],
    evaluation: { kind: 'rubric', criteria: ["Uses the same seed and draw order, and compares both features and targets."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.1", {
    prompt: "Compare zero weights with large random weights when fitting a single affine predictor. Describe what you expect to see in initial residuals and why zero can still permit learning.",
    hints: ["Compute the first prediction for a zero bias.", "Inspect the gradient for a nonzero feature-target correlation."],
    evaluation: { kind: 'rubric', criteria: ["Explains that zero initialization can still give nonzero gradients and large weights can raise initial loss."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.2", {
    prompt: "A circuit gives current and voltage observations. Set up a differentiable fit with resistance as the unknown slope, then state how to detect a unit mismatch.",
    hints: ["Predict voltage as resistance multiplied by current.", "The slope should have units of volts per ampere."],
    evaluation: { kind: 'rubric', criteria: ["Defines a squared residual objective and an automatic differentiation update for resistance."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.3", {
    prompt: "You have spectral readings at six wavelengths and a differentiable blackbody prediction function. Design a fit for an unknown positive temperature and describe how to check numerical stability.",
    hints: ["Use a positive parameterization such as softplus.", "Compare residuals at several wavelengths and check for overflows."],
    evaluation: { kind: 'rubric', criteria: ["Specifies an objective over wavelengths, a positive parameter and a finite-value check."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.4", {
    prompt: "Find the second derivative of a one-parameter squared loss using automatic differentiation. Explain why detaching the first gradient would defeat the calculation.",
    hints: ["The first derivative must retain its computation graph.", "Use a single example with a known analytic derivative."],
    evaluation: { kind: 'rubric', criteria: ["Keeps the first derivative differentiable and verifies curvature against an analytic result."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.5", {
    prompt: "A model outputs three predictions as a column, but the targets are a flat list. Explain why a mean of the resulting broadcast squared errors can be misleading.",
    hints: ["Align shapes before subtraction.", "Count how many pairwise residuals broadcasting creates."],
    evaluation: { kind: 'rubric', criteria: ["Explains that the broadcast produces nine residuals and restores three paired residuals."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.6", {
    prompt: "Design a small experiment to compare three learning rates on identical synthetic data. Measure both convergence speed and stability over a fixed number of updates.",
    hints: ["Keep the starting weights and batch order fixed.", "Look for oscillation as well as slow improvement."],
    evaluation: { kind: 'rubric', criteria: ["Specifies a controlled comparison and a metric for convergence and divergence."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.7", {
    prompt: "A custom training loop reads 19 rows with batch size six. Trace the last optimizer step when the iterator includes the partial batch and describe how to average its loss.",
    hints: ["Take the remainder after forming full batches.", "Divide a summed loss by the actual batch size."],
    evaluation: { kind: 'rubric', criteria: ["Identifies a one-row final step and avoids dividing its summed loss by six."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.8", {
    prompt: "One label in a small calibration dataset is extreme. Compare squared, absolute and Huber loss by explaining how each responds as the residual grows.",
    hints: ["Compare gradients for large residual magnitudes.", "Huber loss uses different regimes around a chosen threshold."],
    evaluation: { kind: 'rubric', criteria: ["Distinguishes growing squared-loss gradients, bounded absolute gradients and Huber’s quadratic-to-linear transition."] },
  }),
  defineExerciseActivity(chapterId, "3.4.6.exercise.9", {
    prompt: "Imagine training data sorted so the first batches contain one measurement regime and the last batches another. Explain the effect of this order on SGD and how to test shuffled batching.",
    hints: ["Think about which regime each batch represents.", "Compare otherwise identical runs with distinct batch order policies."],
    evaluation: { kind: 'rubric', criteria: ["Connects grouped batches to biased consecutive updates and defines a controlled shuffling comparison."] },
  }),
];
