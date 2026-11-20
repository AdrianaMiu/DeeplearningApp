import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapter = 'chapter-4';

export const classificationFoundationSections = [
  defineSectionActivity(chapter, '4.1', {
    objectives: ["Interpret logits and probabilities in a classifier."],
    explanation: "Softmax regression assigns one affine score to each candidate class. Softmax turns scores into positive probabilities whose sum is one. The predicted class can be found directly from the largest score.",
    workedExample: "Scores [0, ln 2, 0] give probabilities [1/4, 1/2, 1/4], so the middle class wins.",
    independentTask: "Construct scores for three categories such that the last two categories tie and both are preferred over the first.",
  }),
  defineSectionActivity(chapter, '4.1.1', {
    objectives: ["Trace class scores for a whole batch."],
    explanation: "For input shaped (N, D), a classifier with C categories produces logits shaped (N, C). Applying softmax along the class dimension normalizes the predictions for each example independently.",
    workedExample: "A batch of 6 documents represented with 20 features has 6 rows of logits when classified into 4 categories.",
    independentTask: "Specify the shape of a prediction batch for 10 inputs and 7 categories. Indicate which values should sum to one after softmax.",
  }),
  defineSectionActivity(chapter, '4.1.2', {
    objectives: ["Calculate cross-entropy from a correct-class probability."],
    explanation: "For a hard target, cross-entropy is the negative logarithm of the probability assigned to its class. It penalizes confident wrong predictions more strongly than uncertain wrong predictions, even when their predicted classes agree.",
    workedExample: "For the same target, predictions of probability 0.5 and 0.25 have losses ln 2 and ln 4.",
    independentTask: "Compute the mean loss for three examples whose target probabilities are 1/2, 1/4, and 1/8.",
  }),
  defineSectionActivity(chapter, '4.1.3', {
    objectives: ["Relate entropy, cross-entropy, and coding cost."],
    explanation: "Entropy is the expected information of observations under their true distribution. Cross-entropy measures the expected information when we score these observations with a proposed distribution. It exceeds entropy by the KL divergence.",
    workedExample: "For a fair coin, an ideal code costs one bit per outcome on average. Assigning probabilities 1/4 and 3/4 raises that ideal expected cost.",
    independentTask: "Choose two different distributions for a binary source and explain which one assigns a larger information cost to a rarely observed event.",
  }),
  defineSectionActivity(chapter, '4.2', {
    objectives: ["Describe what a labeled image dataset provides."],
    explanation: "An image classification example pairs pixel values with a label from a finite vocabulary. The training split is for fitting model choices, whereas a reserved test split provides a final estimate of prediction quality.",
    workedExample: "One grayscale garment image can occupy a tensor of shape (1, 28, 28), with a single integer category index as its label.",
    independentTask: "Describe the input and label shapes for 20 grayscale examples and explain why test examples should be reserved.",
  }),
  defineSectionActivity(chapter, '4.2.1', {
    objectives: ["Load matching train and test splits with consistent transforms."],
    explanation: "A dataset object maps an index to an example and its target. Image transforms should produce a numeric representation with the expected shape and intensity range for each split. Random augmentation is generally reserved for training.",
    workedExample: "Converting an 8-bit grayscale image to a floating tensor can divide each pixel by 255 and create an explicit channel axis.",
    independentTask: "Define a quick inspection of one training example and one test example that would catch an inconsistent image conversion.",
  }),
  defineSectionActivity(chapter, '4.2.2', {
    objectives: ["Recognize the effects of batch size and shuffling."],
    explanation: "A data loader collects examples into batches. Shuffling changes training order without changing labels. If the dataset size is not divisible by the batch size, the final batch may have fewer examples unless configured otherwise.",
    workedExample: "A loader that retains all 22 examples with a batch size of 8 returns batches of sizes 8, 8, and 6.",
    independentTask: "Predict the batch sizes for 37 examples and batch size 12, then state whether shuffling would change those sizes.",
  }),
  defineSectionActivity(chapter, '4.2.3', {
    objectives: ["Use a labeled image grid to catch pipeline mistakes."],
    explanation: "A visual check can reveal unexpected shapes, orientation changes, extreme scaling, or labels that no longer match their images. Verify the exact tensor and label pairing that the classifier will receive.",
    workedExample: "Displaying four samples with their category names can reveal that all images were inadvertently turned sideways during preprocessing.",
    independentTask: "Design an image-grid spot check that could uncover a swapped height and width dimension or a shifted label sequence.",
  }),
  defineSectionActivity(chapter, '4.3', {
    objectives: ["Separate reusable classifier logic from model architecture."],
    explanation: "A base classification model can standardize how validation batches are scored while allowing different architectures to compute logits. The same metric reducer can work with any architecture that emits one score per class.",
    workedExample: "A linear layer and a convolutional model can share validation code if both return a batch-by-class logit matrix.",
    independentTask: "List the output interface and two validation quantities you would require when plugging a new image model into a trainer.",
  }),
  defineSectionActivity(chapter, '4.3.1', {
    objectives: ["Explain why validation scoring uses the same prediction interface."],
    explanation: "A validation step applies the model to input, compares logits with labels through a loss, and accumulates accuracy statistics. It should not update the weights. Computing metrics from counts and sums preserves correct weighting across uneven batches.",
    workedExample: "If a batch has 12 correct labels out of 16, save the numerator 12 and denominator 16 to combine with later batches.",
    independentTask: "Write pseudocode for a validation step that returns correct predictions, total examples, and the sum of per-example losses.",
  }),
  defineSectionActivity(chapter, '4.3.2', {
    objectives: ["Compute accuracy from predicted class indices."],
    explanation: "Classification accuracy counts equal predicted and target indices and divides by the number of examples. Argmax uses the class axis, and it gives the same prediction on logits as on softmax probabilities when tie handling is the same.",
    workedExample: "Predictions [2, 0, 1, 1] and labels [2, 1, 1, 0] yield two correct predictions and accuracy 0.5.",
    independentTask: "Given three rows of class scores, pick your own target indices and demonstrate a correct and an incorrect prediction while computing accuracy.",
  }),
];

export const classificationFoundationExercises = [
  defineExerciseActivity(chapter, '4.1.5.exercise.1', {
    prompt: "For a two-class softmax with logits [t, 0], use class one as the target. Differentiate the negative log probability twice with respect to t and connect the result to a Bernoulli variable.",
    hints: ["Write the probability of class one as the sigmoid of t.", "The variance of a zero-one variable with mean p is p times one minus p."],
    evaluation: { kind: 'rubric', criteria: ["Obtains second derivative p(1 − p).", "Identifies it as the variance of a class-one indicator."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.2', {
    prompt: "A random generator returns one of five symbols with equal probability. Compare fixed-length binary codes for single symbols with codes for groups of two independent symbols.",
    hints: ["Count how many codewords are needed in each case.", "Take the smallest integer number of bits that supplies enough codewords."],
    evaluation: { kind: 'rubric', criteria: ["Finds three bits per symbol for separate coding.", "Finds five bits per pair, or 2.5 bits per symbol, and discusses block coding."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.3', {
    prompt: "An interface signals three distinct levels on each use. Compute how many uses are needed to communicate one of 19 equally likely messages and state an engineering tradeoff.",
    hints: ["With k signals the number of words is three to the kth power.", "Compare code length with how easily the receiver distinguishes the levels."],
    evaluation: { kind: 'rubric', criteria: ["Finds that three signals suffice because nine words are too few and 27 are enough.", "Notes a tradeoff such as additional sensitivity to noise from finer signal levels."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.4', {
    prompt: "An app predicts a user's choice among a red theme, a blue theme, and keeping the default. Show that the option with score 4 outranks the one with score 1 under softmax regardless of the third score.",
    hints: ["The denominator is shared among all categories.", "Compare the ratio of the two probabilities."],
    evaluation: { kind: 'rubric', criteria: ["Obtains a probability ratio of exp(3).", "Explains that adding a default changes absolute probabilities while preserving the ratio."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.5', {
    prompt: "For scores [3, 1, 0], bound the difference between the maximum and log-sum-exp divided by a positive inverse temperature beta, with the scores multiplied by beta before exponentiation.",
    hints: ["Factor exp(3 beta) out of the sum.", "The remaining sum lies between one and three."],
    evaluation: { kind: 'rubric', criteria: ["Bounds the positive gap above by ln(3)/beta.", "Uses the bound to show convergence to the maximum as beta grows."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.6', {
    prompt: "To evaluate log-sum-exp on logits [1001, 1000, 999], devise a stable expression. Explain its behavior under uniform shifts and show that its curvature is nonnegative in any direction.",
    hints: ["Subtract the largest logit before exponentiating, then add it back.", "The second directional derivative is the variance of the direction's coordinates under the softmax probabilities."],
    evaluation: { kind: 'rubric', criteria: ["Writes 1001 + log(1 + exp(−1) + exp(−2)).", "Explains that a uniform shift adds the same constant to log-sum-exp.", "Uses nonnegative variance to establish convexity."] },
  }),
  defineExerciseActivity(chapter, '4.1.5.exercise.7', {
    prompt: "A classifier has positive probabilities [0.6, 0.3, 0.1]. Raise them to the power 1/T and renormalize. Explain what happens at T=2 and in the limits as T approaches zero and infinity.",
    hints: ["Raising probabilities to an exponent below one flattens their ratios.", "Compare all probabilities with the unique largest one as T becomes small."],
    evaluation: { kind: 'rubric', criteria: ["Explains that T=2 flattens the distribution.", "Identifies concentration on class one as T goes to zero and uniform probabilities as T grows."] },
  }),
  defineExerciseActivity(chapter, '4.2.5.exercise.1', {
    prompt: "Compare data-loader throughput at batch sizes 1 and 32. Design a fair measurement and identify an overhead a larger batch could amortize.",
    hints: ["Time the same number of examples rather than the same number of batches.", "Keep the data transformation and number of workers fixed."],
    evaluation: { kind: 'rubric', criteria: ["Controls sample count and reports examples per second.", "Names a per-batch overhead and avoids assuming the result before measurement."] },
  }),
  defineExerciseActivity(chapter, '4.2.5.exercise.2', {
    prompt: "A training loop repeatedly waits for image batches. Plan a profiler experiment to tell whether image decoding or host-to-device transfer is the bottleneck.",
    hints: ["Record time before and after the relevant pipeline stages.", "Compare one change at a time after the initial warm-up."],
    evaluation: { kind: 'rubric', criteria: ["Separates decoding and transfer in the measurement.", "Uses measured throughput to justify a change such as more loader workers or pinned memory."] },
  }),
  defineExerciseActivity(chapter, '4.2.5.exercise.3', {
    prompt: "Select a candidate labeled image dataset for replacing the garment benchmark in the same classification app, and describe what metadata you need to check before substituting it.",
    hints: ["The input may differ in channel count and spatial resolution.", "Find the split policy and the category vocabulary."],
    evaluation: { kind: 'rubric', criteria: ["Names a plausible dataset and verifies its label vocabulary and split policy.", "Describes necessary input-shape or preprocessing changes."] },
  }),
  defineExerciseActivity(chapter, '4.3.4.exercise.1', {
    prompt: "A validation loader returns batches with sizes 8, 8, and 4 and mean losses 1.0, 2.0, and 3.0. Compute both the mean of batch means and the exact per-example mean.",
    hints: ["Multiply each batch mean by its batch size.", "Divide the total of the reconstructed losses by the total number of examples."],
    evaluation: { kind: 'rubric', criteria: ["Obtains an unweighted batch mean of 2.0.", "Obtains an exact per-example mean of 1.8."] },
  }),
  defineExerciseActivity(chapter, '4.3.4.exercise.2', {
    prompt: "Suppose validation examples are assigned to batches by a fresh uniform random permutation. Explain why the unweighted mean of batch means is unbiased for the dataset mean even with a short final batch, and why weighted aggregation is still useful.",
    hints: ["Consider any fixed position in the random permutation.", "Ask whether the two estimators agree on every realized ordering."],
    evaluation: { kind: 'rubric', criteria: ["Explains that each batch mean has expectation equal to the dataset mean.", "Explains that weighting gives the exact dataset mean for every ordering."] },
  }),
  defineExerciseActivity(chapter, '4.3.4.exercise.3', {
    prompt: "An alert system estimates a 0.2 chance of a fault. Missing a fault costs 10 units and a false alert costs 1, with zero cost for correct decisions. Choose the action that minimizes expected loss.",
    hints: ["For each action, multiply each possible loss by its outcome probability.", "Compare the expected losses of alerting and staying silent."],
    evaluation: { kind: 'rubric', criteria: ["Computes 0.8 expected cost for alerting and 2 for staying silent.", "Selects alerting and connects the choice to minimum expected loss."] },
  }),
];

export const classificationFoundationClassifications: CoverageClassification[] = [
  { sourceId: '4.1.4', kind: 'summary' },
  { sourceId: '4.1.5', kind: 'exercise-heading' },
  { sourceId: '4.2.4', kind: 'summary' },
  { sourceId: '4.2.5', kind: 'exercise-heading' },
  { sourceId: '4.3.3', kind: 'summary' },
  { sourceId: '4.3.4', kind: 'exercise-heading' },
];
