import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapter = 'chapter-3';

export const conciseSections = [
  defineSectionActivity(chapter, '3.5', {
    objectives: ["Relate framework abstractions to the regression algorithm."],
    explanation: "A concise regression implementation delegates parameter storage, derivative computation and updates to the framework. Its mathematical objective and update order match an equivalent implementation written by hand.",
    workedExample: "A built-in affine layer computes the same predictions as X @ w + b when its weights and bias hold the same values.",
    independentTask: "Draw the data path from a feature batch to a parameter update and name the framework component responsible at each step.",
  }),
  defineSectionActivity(chapter, '3.5.1', {
    objectives: ["Inspect a dense regression layer and its parameter shapes."],
    explanation: "A single-output affine layer learns one coefficient per input feature and one shared bias. PyTorch stores the coefficient matrix in output-by-input order and treats each row of the input batch as an example.",
    workedExample: "For nn.Linear(4, 1), the weights have shape (1, 4), and a batch with shape (9, 4) produces predictions of shape (9, 1).",
    independentTask: "Describe how many parameters nn.Linear(6, 2) holds and predict the dimensions of its output for 15 observations.",
  }),
  defineSectionActivity(chapter, '3.5.2', {
    objectives: ["Check squared-error reduction and target alignment."],
    explanation: "Mean squared error combines one squared residual per predicted value. Predictions and targets should have identical shapes, because a trailing singleton paired with a flat vector can cause broadcasting across examples.",
    workedExample: "Prediction shape (4, 1) paired with target shape (4,) can create a (4, 4) residual grid instead of four residuals.",
    independentTask: "Give a shape assertion and a reshape operation for a scalar target batch before passing it to the loss.",
  }),
  defineSectionActivity(chapter, '3.5.3', {
    objectives: ["Identify what minibatch SGD needs to update parameters."],
    explanation: "The optimizer owns references to trainable parameters and uses their accumulated gradients. The learning rate scales the update, so even a correct gradient can produce an unstable step when the rate is too large.",
    workedExample: "With gradient −3 and learning rate 0.1, plain SGD moves a parameter from 2 to 2.3.",
    independentTask: "Write the new parameter for value −1, gradient 2.5, and learning rate 0.2. State when a batch gradient should be cleared.",
  }),
  defineSectionActivity(chapter, '3.5.4', {
    objectives: ["Compare fitted coefficients with known synthetic coefficients."],
    explanation: "Synthetic regression data provide known coefficients to check the training loop. Fit on training data and evaluate on separate validation data. Exact coefficient recovery is generally unlikely with finite noisy samples.",
    workedExample: "If a synthetic model uses bias 3 and the fitted model estimates 2.96, the estimated-minus-true bias error is −0.04.",
    independentTask: "Plan how to check whether a large coefficient error comes from too few training updates or from an input-feature ordering mismatch.",
  }),
];

export const conciseExercises = [
  defineExerciseActivity(chapter, '3.5.6.exercise.1', {
    prompt: "A batch of 16 examples uses a summed MSE objective and SGD with learning rate 0.01. Find an equivalent learning rate for a mean reduction on the same batch.",
    hints: ["Compare summed and averaged gradient magnitudes.", "Set the magnitude of the resulting parameter updates equal."],
    evaluation: { kind: 'rubric', criteria: ["Explains that the averaged gradient is one sixteenth of the summed gradient.", "Multiplies the original learning rate by 16, giving 0.16."] },
  }),
  defineExerciseActivity(chapter, '3.5.6.exercise.2', {
    prompt: "A few sensor targets have very large errors. Replace MSE with Huber loss at threshold one, then compare the magnitude of the loss gradient for residuals 0.5 and 8.",
    hints: ["Use the quadratic branch below the threshold.", "Check whether the outer branch derivative depends on the residual magnitude."],
    evaluation: { kind: 'rubric', criteria: ["Selects HuberLoss with delta equal to one.", "Reports gradient magnitudes 0.5 and 1 and explains the capped influence."] },
  }),
  defineExerciseActivity(chapter, '3.5.6.exercise.3', {
    prompt: "Instrument a one-output PyTorch affine layer to report the weight gradient for only the current batch. Say where to put the inspection relative to backpropagation.",
    hints: ["Run the backward pass before reading the gradient.", "Clear previously accumulated gradients before processing the batch."],
    evaluation: { kind: 'rubric', criteria: ["Reads layer.weight.grad after backward and before any gradient clearing.", "Explains that clearing first prevents preceding batches contributing to the reading."] },
  }),
  defineExerciseActivity(chapter, '3.5.6.exercise.4', {
    prompt: "Compare low, moderate, and high learning rates for a concise regression model. Specify how you would use training and validation curves to choose an epoch budget.",
    hints: ["Keep data split and initialization fixed across runs.", "Consider slow improvement, oscillation, and a validation plateau."],
    evaluation: { kind: 'rubric', criteria: ["Varies the learning rate while controlling other conditions.", "Uses validation and training trends to justify a stopping point rather than assuming more epochs always help."] },
  }),
  defineExerciseActivity(chapter, '3.5.6.exercise.5', {
    prompt: "Plan a synthetic experiment to see how coefficient estimation changes with sample sizes from 20 to 20,000. Specify sizes, a coefficient-error statistic, and a way to address random variation.",
    hints: ["Choose sample sizes that multiply rather than increase by a fixed count.", "Repeat each size using independent data seeds."],
    evaluation: { kind: 'rubric', criteria: ["Uses approximately geometrically spaced sample sizes to cover multiple orders of magnitude.", "Measures coefficient error against the known parameters and summarizes repetition variability."] },
  }),
];

export const conciseClassifications: CoverageClassification[] = [
  { sourceId: '3.5.5', kind: 'summary' },
  { sourceId: '3.5.6', kind: 'exercise-heading' },
];
