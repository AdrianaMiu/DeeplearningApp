import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-3';

export const weightDecaySections = [
  defineSectionActivity(chapterId, '3.7', {
    objectives: ['Explain why shrinking weights can help generalization.'],
    explanation: 'Weight decay discourages a model from relying on large coefficients when many predictors can fit the observed samples. The penalty biases the fit toward smaller coefficients, which can improve held-out predictions at the cost of some training accuracy.',
    workedExample: 'With a tiny dataset and weak predictors, shrinking a noisy estimated slope from 9 toward zero can improve its predictions on new samples.',
    independentTask: 'Explain how an excessively large penalty could harm a regression problem where the true slope is far from zero.',
  }),
  defineSectionActivity(chapterId, '3.7.1', {
    objectives: ['Derive the weight decay step for plain SGD.'],
    explanation: 'Adding λ times half the squared L2 norm to the average data loss adds λw to its gradient. A plain SGD update therefore multiplies the old weights by 1 − ηλ before subtracting the scaled gradient of the data loss.',
    workedExample: 'For w = 2, η = 0.1, λ = 0.5 and a zero data gradient, the update reduces the weight to 1.9.',
    independentTask: 'Compute one update for w = −2, η = 0.1, λ = 0.5 and data gradient 3. Explain which term comes from the penalty.',
  }),
  defineSectionActivity(chapterId, '3.7.2', {
    objectives: ['Set up an overfitting experiment in high dimensions.'],
    explanation: 'When the number of features exceeds the number of training samples, many coefficient vectors can fit the same labels. A held-out set generated from the same process reveals whether fitting the observed labels has improved prediction.',
    workedExample: 'A linear model with 100 predictors can achieve tiny error on 20 noisy training samples while predicting poorly on 200 held-out samples.',
    independentTask: 'Design a synthetic comparison of two penalty strengths. Specify the generating coefficients, training size and held-out metric.',
  }),
  defineSectionActivity(chapterId, '3.7.3', {
    objectives: ['Separate the training objective from the evaluation metric.'],
    explanation: 'Implement weight decay by adding a differentiable penalty on the weight vector to the minibatch mean loss. Compare runs using an identical unpenalized prediction metric, since the penalized objective itself changes with λ.',
    workedExample: 'With average squared loss 1, squared weight norm 9 and λ = 0.2, the penalized loss is 1.9 under the half-norm convention.',
    independentTask: 'Write pseudocode to train with a weight penalty while reporting the same unpenalized validation error as the baseline.',
  }),
  defineSectionActivity(chapterId, '3.7.4', {
    objectives: ['Configure weight decay for selected parameter groups.'],
    explanation: 'An optimizer can apply decay using parameter groups. To match an explicit penalty on weights alone with plain SGD, give the weight group the selected decay and leave the bias group at zero.',
    workedExample: 'Put the coefficient tensor under weight decay 0.1 and the intercept under decay 0 to avoid penalizing the mean shift.',
    independentTask: 'Specify two parameter groups for a regression model and show how you would compare a single optimizer step with the explicit-penalty implementation.',
  }),
];

export const weightDecayClassifications: CoverageClassification[] = [
  { sourceId: '3.7.5', kind: 'summary' },
  { sourceId: '3.7.6', kind: 'exercise-heading' },
];

export const weightDecayExercises = [
  defineExerciseActivity(chapterId, '3.7.6.exercise.1', {
    prompt: 'Compare several penalty strengths, including zero, on the same high-dimensional regression dataset. Plot training and held-out prediction error against the penalty.',
    hints: ['Keep the split and initialization fixed.', 'Measure prediction errors without the penalty term.'],
    evaluation: { kind: 'rubric', criteria: ['Reports both curves and explains the observed tradeoff between fit and generalization.'] },
  }),
  defineExerciseActivity(chapterId, '3.7.6.exercise.2', {
    prompt: 'Two penalty strengths have nearly identical validation scores, but the lower score changes when the split is rebuilt. Explain how to choose a value and estimate its performance.',
    hints: ['Validation error is a noisy estimate.', 'Set aside a test split until after selection.'],
    evaluation: { kind: 'rubric', criteria: ['Describes a defensible selection strategy and avoids using test data to tune λ.'] },
  }),
  defineExerciseActivity(chapterId, '3.7.6.exercise.3', {
    prompt: 'Derive the added gradient term when the penalty is λ times the sum of coefficient magnitudes. Give a valid choice at a zero coefficient.',
    hints: ['For a nonzero value the slope is its sign.', 'The subgradient at zero can range from −1 to 1.'],
    evaluation: { kind: 'rubric', criteria: ['Derives λ times the sign away from zero and identifies zero as one valid subgradient at zero.'] },
  }),
  defineExerciseActivity(chapterId, '3.7.6.exercise.4', {
    prompt: 'For a rectangular matrix A, express the sum of its squared entries using a product and a trace. Test your expression on rows [1, 2] and [3, 4].',
    hints: ['A column’s squared length appears on a diagonal.', 'Add the diagonal entries of A transpose times A.'],
    evaluation: { kind: 'rubric', criteria: ['Identifies trace(A transpose times A) and evaluates it to 30.'] },
  }),
  defineExerciseActivity(chapterId, '3.7.6.exercise.5', {
    prompt: 'Suppose a model’s training error improves while held-out error rises. Propose two interventions besides a weight penalty and explain how each would be evaluated.',
    hints: ['Think about collecting more representative data.', 'An earlier checkpoint can be selected on validation error.'],
    evaluation: { kind: 'rubric', criteria: ['Proposes two plausible interventions and keeps the final test split outside the selection process.'] },
  }),
  defineExerciseActivity(chapterId, '3.7.6.exercise.6', {
    prompt: 'For Gaussian observation noise and a zero-mean Gaussian weight prior, explain why maximizing the posterior can be written as a squared-error objective plus a weight penalty.',
    hints: ['Take the negative log of the posterior.', 'Separate the two quadratic terms and ignore constants.'],
    evaluation: { kind: 'rubric', criteria: ['Maps the likelihood to squared residuals and the prior to a squared L2 penalty whose strength increases as prior variance decreases.'] },
  }),
];
