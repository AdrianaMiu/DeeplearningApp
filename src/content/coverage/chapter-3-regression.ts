import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapter = 'chapter-3';

export const regressionSections = [
  defineSectionActivity(chapter, '3.1', {
    objectives: ["Connect a prediction rule to a training objective."],
    explanation: "Linear regression learns an affine map. The weights specify how the prediction changes per unit of each feature, holding other feature values fixed. Training selects those weights by minimizing a loss over observed examples.",
    workedExample: "A delivery-time model with intercept 8 and distance weight 3 predicts 20 minutes for a trip of 4 kilometers.",
    independentTask: "For the same model, explain what changes if distance is represented in meters and the predictions must stay the same.",
  }),
  defineSectionActivity(chapter, '3.1.1', {
    objectives: ["Separate residuals, average loss, and parameter updates."],
    explanation: "A residual measures the discrepancy on a single example. Mean squared error averages squared discrepancies across examples. Gradient descent updates each parameter in the opposite direction from its loss derivative.",
    workedExample: "Predictions [2, 6] and targets [3, 4] give prediction-minus-target residuals [-1, 2] and MSE 2.5.",
    independentTask: "Find the sign of the bias derivative for these two predictions and decide which way a small gradient step moves the bias.",
  }),
  defineSectionActivity(chapter, '3.1.2', {
    objectives: ["Write one vectorized prediction for a batch."],
    explanation: "A feature matrix stores one observation per row. A matrix-vector product scores every row using the same weights, and broadcasting adds one shared bias. Vectorized libraries can implement these operations using optimized kernels.",
    workedExample: "A feature matrix of shape (60, 5) multiplied by weights of shape (5, 1) gives 60 predictions with shape (60, 1).",
    independentTask: "Write the shapes needed to score 24 records with three features and subtract one target per record without accidental broadcasting.",
  }),
  defineSectionActivity(chapter, '3.1.3', {
    objectives: ["Derive the link between Gaussian noise and squared residuals."],
    explanation: "With independent Gaussian errors of fixed positive variance, the negative log-likelihood is a constant plus the sum of squared residuals divided by twice the variance. Both objectives therefore select the same mean parameters.",
    workedExample: "If two residual magnitudes are 1 and 3 and the variance is 2, their joint negative log-likelihood contains the parameter-dependent term 10/4.",
    independentTask: "Explain what happens to the scaled squared-error term when the fixed variance doubles, and whether the fitted mean parameters change.",
  }),
  defineSectionActivity(chapter, '3.1.4', {
    objectives: ["Represent linear regression using a dense layer."],
    explanation: "A dense layer with one output and no nonlinear activation computes a weighted sum plus bias for each example. The output can be any real number, and the regression objective determines how the layer is trained.",
    workedExample: "An input [3, 5] with weights [2, -1] and a bias of 4 gives a single output of 5.",
    independentTask: "Describe a dense layer for predicting two continuous outcomes from four inputs. Count the trainable weights and biases.",
  }),
];

export const regressionExercises = [
  defineExerciseActivity(chapter, '3.1.6.exercise.1', {
    prompt: "Fit one constant to sensor readings [1, 2, 9] using squared error and then absolute error. Connect squared error to a noise model.",
    hints: ["Differentiate the squared-error objective.", "Check how many points lie on each side of a candidate absolute-error minimizer."],
    evaluation: { kind: 'rubric', criteria: ["Finds the mean 4 for squared error and the median 2 for absolute error.", "Connects fixed-variance Gaussian errors to the squared objective."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.2', {
    prompt: "A model predicts 7 + 2x - 3z. Rewrite it using a dot product of two length-three vectors, and show how to recover the intercept from the weights.",
    hints: ["Append a feature equal to one.", "Give the constant feature its own weight."],
    evaluation: { kind: 'rubric', criteria: ["Produces equivalent ordered vectors such as [x, z, 1] and [2, -3, 7].", "Identifies the third weight as the original intercept."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.3', {
    prompt: "Predict machine vibration from speed s and load l using a degree-two polynomial. Design a feature transformation and a one-output layer that includes their interaction.",
    hints: ["List all monomials up to degree two.", "Use one layer coefficient per transformed feature."],
    evaluation: { kind: 'rubric', criteria: ["Includes s, l, s², sl, l², and an intercept.", "Explains how the final affine layer represents every requested term."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.4', {
    prompt: "Two columns of a training matrix are identical. Describe the ambiguity in least-squares weights, a regularized remedy, and the expected Gram matrix after adding independent centered noise of variance v to all n rows.",
    hints: ["Find a vector in the null space.", "Expand the noisy Gram matrix and take expectations."],
    evaluation: { kind: 'rubric', criteria: ["Explains that shifting opposite amounts between duplicate-feature coefficients keeps predictions fixed.", "Gives XᵀX + nvI and explains how ridge makes the coefficient solution unique."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.5', {
    prompt: "A delivery prediction model has independent Laplace errors of known scale b. Derive the loss up to constants and suggest how to reduce oscillation in minibatch updates near zero residual.",
    hints: ["Take the negative log of the Laplace density.", "Consider the subgradient at zero and the learning rate."],
    evaluation: { kind: 'rubric', criteria: ["Derives the sum of absolute residuals divided by b.", "Identifies the nonsmooth point and suggests a decreasing step size or a smooth approximation."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.6', {
    prompt: "A proposed network has an affine hidden layer and an affine output layer. Expand their composition and explain what change would let it express a genuinely nonlinear mapping.",
    hints: ["Substitute the hidden output into the second layer.", "Collect the coefficient of the input and the constant term."],
    evaluation: { kind: 'rubric', criteria: ["Derives the combined weight W₂W₁ and bias W₂b₁ + b₂.", "Explains why a nonlinear activation between the layers changes the model family."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.7', {
    prompt: "Design a regression baseline for positive item prices that vary widely in scale. Discuss how log targets affect the prediction and why tiny prices with fixed increments need care.",
    hints: ["Think in relative rather than absolute changes.", "Compare one price tick to the price itself."],
    evaluation: { kind: 'rubric', criteria: ["Explains positive inverse-transformed predictions and the relevance of relative errors.", "Explains why fixed ticks are proportionally large for low prices."] },
  }),
  defineExerciseActivity(chapter, '3.1.6.exercise.8', {
    prompt: "Model the number of requests arriving per minute with a Poisson distribution. For counts [1, 3, 8], derive the fitted constant rate and explain how a feature-based model can keep its rate positive.",
    hints: ["Write the negative log-likelihood terms that depend on the rate.", "Differentiate their sum and consider an exponential link."],
    evaluation: { kind: 'rubric', criteria: ["Derives a constant rate of 4 from the likelihood.", "Uses a positive link such as exponentiation and explains why a count model fits nonnegative integers."] },
  }),
];

export const regressionClassifications: CoverageClassification[] = [
  { sourceId: '3.1.5', kind: 'summary' },
  { sourceId: '3.1.6', kind: 'exercise-heading' },
];
