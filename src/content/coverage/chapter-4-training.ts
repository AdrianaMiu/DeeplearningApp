import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-4';

export const classificationTrainingSections = [
  defineSectionActivity(chapterId, '4.4', {
    objectives: ['Build a multiclass classifier from logits.'],
    explanation: 'A softmax classifier first computes one raw score per class, then normalizes those scores to a probability distribution for each example. Separating scores, probabilities and decisions helps locate errors in a scratch implementation.',
    workedExample: 'A batch of four examples and six classes needs a 4 × 6 score matrix before any normalization or label selection.',
    independentTask: 'Describe the expected shapes for features, class scores, probabilities and predicted labels in a batch of seven four-class observations.',
  }),
  defineSectionActivity(chapterId, '4.4.1', {
    objectives: ['Normalize class scores without exponential overflow.'],
    explanation: 'Subtract the largest score in each example before exponentiating. The shift cancels in the softmax ratio, makes the largest exponential equal to one and prevents exponential overflow for finite inputs.',
    workedExample: 'Scores [1001, 1000] become [0, −1] before exponentiation and yield probabilities about [0.731, 0.269].',
    independentTask: 'Predict how adding the same constant to all three logits affects their class probabilities, then justify your prediction algebraically.',
  }),
  defineSectionActivity(chapterId, '4.4.2', {
    objectives: ['Map a batch to one score per class.'],
    explanation: 'A linear multiclass model uses one weight column and one bias value per class. Flatten examples consistently before the matrix product and leave the batch dimension untouched.',
    workedExample: 'Twelve samples with sixteen features use a 16 × 5 weight matrix for five classes, producing a 12 × 5 score matrix.',
    independentTask: 'For ten grayscale 8 × 8 images and six classes, give the flattened feature, weight, bias and score shapes.',
  }),
  defineSectionActivity(chapterId, '4.4.3', {
    objectives: ['Read cross-entropy as negative log true-class probability.'],
    explanation: 'With hard class targets, cross-entropy is the negative log of each example’s probability for its true class. Average across examples only after selecting the correct probability separately in every row.',
    workedExample: 'If two examples assign their true classes probabilities 0.8 and 0.25, the batch loss is approximately (0.223 + 1.386) / 2 = 0.805.',
    independentTask: 'Compare two predictions assigning their true class probabilities 0.7 and 0.1. Explain how exchanging those probabilities changes each contribution to loss.',
  }),
  defineSectionActivity(chapterId, '4.4.4', {
    objectives: ['Track optimization and evaluation on separate data.'],
    explanation: 'Training iterates over minibatches, computes the scalar objective and updates parameters from its gradient. Evaluation uses fixed parameters and a held-out loader so accuracy estimates behavior on unseen samples.',
    workedExample: 'After three training batches, a trainer can count correct predictions on the validation split without executing another update.',
    independentTask: 'Write an epoch outline and identify which operations require gradients, and which data may be used to choose a checkpoint.',
  }),
  defineSectionActivity(chapterId, '4.4.5', {
    objectives: ['Convert class scores into inspectable predictions.'],
    explanation: 'The largest logit yields the same class as the largest softmax probability because exponentiation preserves ordering and all classes share a positive denominator. Looking at mismatches with target labels reveals typical confusions.',
    workedExample: 'For scores [−0.3, 1.6, 0.2], the argmax predicts class index 1 without evaluating any exponential.',
    independentTask: 'Choose three score vectors and target classes, calculate their predictions, and give one targeted check for the resulting mistakes.',
  }),
  defineSectionActivity(chapterId, '4.5', {
    objectives: ['Build the concise version around raw logits.'],
    explanation: 'A framework loss can operate on raw scores while internally combining log-softmax and negative log-likelihood. Keeping logits in the model output avoids applying normalization twice during training.',
    workedExample: 'An image classifier can flatten inputs, apply a linear layer and pass its output directly to a fused cross-entropy loss.',
    independentTask: 'Compare the responsibilities of the model and loss in a scratch implementation and a fused implementation.',
  }),
  defineSectionActivity(chapterId, '4.5.1', {
    objectives: ['Specify the concise model input and output interface.'],
    explanation: 'A classifier built from framework layers can flatten each example and send its features through an affine mapping. The layer retains the batch size and exposes exactly one output per class.',
    workedExample: 'A batch of 32 grayscale 28 × 28 inputs passes through flattening and a 784-to-10 affine layer, yielding 32 × 10 logits.',
    independentTask: 'Write down the required layer dimensions for three-channel 16 × 16 images and nine labels, and explain where the batch dimension goes.',
  }),
  defineSectionActivity(chapterId, '4.5.2', {
    objectives: ['Compute the objective using a stable log-sum-exp.'],
    explanation: 'For logits z and target t, cross-entropy equals logsumexp(z) minus z[t]. Compute logsumexp by subtracting the row maximum before exponentiating and adding it back outside the logarithm.',
    workedExample: 'With scores [1000, 1000] and target 0, the loss is log(2) even though exp(1000) would overflow.',
    independentTask: 'For scores [500, 499] and target 1, express the loss using only exponentials with nonpositive inputs.',
  }),
  defineSectionActivity(chapterId, '4.5.3', {
    objectives: ['Validate a concise classifier with controlled experiments.'],
    explanation: 'Changing a framework implementation should preserve the prediction and objective contracts. Compare scratch and concise models at identical parameters and inputs before attributing training differences to the optimizer.',
    workedExample: 'Two equivalent implementations give matching losses on a tiny batch when they use the same logits, targets and reduction.',
    independentTask: 'Plan a one-batch equivalence test, then specify which metrics you would record when training for multiple epochs.',
  }),
];

export const classificationTrainingClassifications: CoverageClassification[] = [
  { sourceId: '4.4.6', kind: 'summary' },
  { sourceId: '4.4.7', kind: 'exercise-heading' },
  { sourceId: '4.5.4', kind: 'summary' },
  { sourceId: '4.5.5', kind: 'exercise-heading' },
];

export const classificationTrainingExercises = [
  defineExerciseActivity(chapterId, '4.4.7.exercise.1', {
    prompt: 'Compare direct and max-shifted softmax on [1000, 999] and [−1000, −1001]. Explain why the two rows should produce the same normalized probabilities.',
    hints: ['The logits differ by the same common shift.', 'Check whether direct exponentials overflow or vanish.'],
    evaluation: { kind: 'rubric', criteria: ['Demonstrates shift invariance and tests that stable outputs are finite and sum to one.'] },
  }),
  defineExerciseActivity(chapterId, '4.4.7.exercise.2', {
    prompt: 'Implement two cross-entropy calculations for hard labels, one indexing the true class and one multiplying a one-hot target by log probabilities. Explain what changes for soft labels.',
    hints: ['Hard labels select only one log probability.', 'Be careful when multiplying zero by the log of zero.'],
    evaluation: { kind: 'rubric', criteria: ['Compares computation and memory costs, handles logarithm edge cases and explains why dense targets can matter.'] },
  }),
  defineExerciseActivity(chapterId, '4.4.7.exercise.3', {
    prompt: 'A quality-control classifier labels a product defective or acceptable. Missing a defect is much costlier than a false alarm. Propose a decision policy for uncertain predictions.',
    hints: ['The most probable class is not always the lowest-cost choice.', 'Consider reviewing predictions near a decision threshold.'],
    evaluation: { kind: 'rubric', criteria: ['Defines a cost-sensitive threshold or abstention option and evaluates both error types on held-out data.'] },
  }),
  defineExerciseActivity(chapterId, '4.4.7.exercise.4', {
    prompt: 'A toy next-token classifier grows from 2,000 to 200,000 possible tokens while its hidden feature size stays fixed. Explain what grows and propose an approximation.',
    hints: ['There is one output weight vector per token.', 'Full softmax sums scores across the vocabulary.'],
    evaluation: { kind: 'rubric', criteria: ['Identifies parameter, memory and compute growth and gives a plausible alternative such as sampled softmax.'] },
  }),
  defineExerciseActivity(chapterId, '4.4.7.exercise.5', {
    prompt: 'Plan a controlled experiment that tests separate changes to learning rate and batch size. Specify how to compare loss trajectories when batch size changes the number of updates.',
    hints: ['Change one hyperparameter at a time.', 'Report epochs and optimizer steps, or compare matched budgets.'],
    evaluation: { kind: 'rubric', criteria: ['Uses fixed splits and seeds, records training and validation loss, and accounts for update count.'] },
  }),
  defineExerciseActivity(chapterId, '4.5.5.exercise.1', {
    prompt: 'For a floating-point format, estimate the exponential input limits from its largest finite and smallest positive representable values. Explain how including subnormals changes the estimate.',
    hints: ['Apply logarithms to the output limits.', 'Specify whether the lower limit uses normal or subnormal values.'],
    evaluation: { kind: 'rubric', criteria: ['Uses format-specific bounds and distinguishes an approximate representable range from exact rounding thresholds.'] },
  }),
  defineExerciseActivity(chapterId, '4.5.5.exercise.2', {
    prompt: 'You need to encode positive values spanning several orders of magnitude in eight bits. Describe a logarithmic encoding and explain which arithmetic operations require decoding.',
    hints: ['Spend more codes on relative precision rather than uniform spacing.', 'Multiplication becomes addition in exact log coordinates.'],
    evaluation: { kind: 'rubric', criteria: ['Describes the encoding and explains why raw integer addition or multiplication is not ordinary arithmetic on decoded values.'] },
  }),
  defineExerciseActivity(chapterId, '4.5.5.exercise.3', {
    prompt: 'A run improves training accuracy for 25 epochs, but validation accuracy reaches its peak at epoch 12. Explain what may be happening and design a checkpoint policy.',
    hints: ['Compare train and validation trends.', 'Select a checkpoint without looking at the final test set.'],
    evaluation: { kind: 'rubric', criteria: ['Identifies possible overfitting and uses validation-based checkpoint selection or early stopping.'] },
  }),
  defineExerciseActivity(chapterId, '4.5.5.exercise.4', {
    prompt: 'Compare three learning rates on the same classifier, including a rate that changes loss very slowly and one that causes instability. Describe how you would choose among them.',
    hints: ['Hold the initialization and data schedule fixed.', 'Inspect validation metrics and the shape of training loss.'],
    evaluation: { kind: 'rubric', criteria: ['Distinguishes slow convergence, stable learning and instability using controlled runs.'] },
  }),
];
