import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapter = 'chapter-5';

export const housePriceSections = [
  defineSectionActivity(chapter, '5.7', {
    objectives: ['Trace a tabular regression experiment from data to submission.'],
    explanation: 'A competition dataset lets you practice an end-to-end workflow: inspect the inputs, build a simple baseline, validate changes and export predictions. A reproducible local evaluation makes leaderboard feedback easier to interpret.',
    workedExample: 'Train a median-price baseline before using features, then compare its fold scores with a linear model under the same splits.',
    independentTask: 'Sketch a house-price experiment with a baseline, a validation split, a metric and one predeclared criterion for improving the model.',
  }),
  defineSectionActivity(chapter, '5.7.1', {
    objectives: ['Keep fetched training data identifiable and reproducible.'],
    explanation: 'Separate downloading from training so repeated experiments use identical inputs. Record the source and version, keep a cached copy where appropriate, and verify the checksum when the publisher supplies one.',
    workedExample: 'A download cache retains the train and test CSVs so rerunning a notebook without networking still uses the intended files.',
    independentTask: 'Write a checklist for distinguishing a missing file, a truncated download and a valid cached dataset before the training job starts.',
  }),
  defineSectionActivity(chapter, '5.7.2', {
    objectives: ['Distinguish a competition leaderboard from local validation.'],
    explanation: 'A competition defines a prediction task, file format and metric. A public leaderboard can expose performance on only part of the hidden set. Frequent choices based on that score can overfit to its particular examples.',
    workedExample: 'Two runs differ by a tiny public score but exchange rankings across local folds. Treat that score difference as weak evidence.',
    independentTask: 'Describe how you would limit leaderboard-driven tuning and choose between two models with similar public scores.',
  }),
  defineSectionActivity(chapter, '5.7.3', {
    objectives: ['Separate features, labels and row identifiers from CSV files.'],
    explanation: 'The training file contains the target while the prediction file supplies rows whose targets are hidden. Retain the prediction IDs separately and verify that feature names, types and row counts match your expectations.',
    workedExample: 'Select SalePrice from training as the target and keep test Id values in their original order for the submission file.',
    independentTask: 'List three assertions that catch accidental inclusion of a target in features or a loss of alignment between prediction rows and IDs.',
  }),
  defineSectionActivity(chapter, '5.7.4', {
    objectives: ['Fit tabular preprocessing separately inside each validation fold.'],
    explanation: 'Fit numeric scaling, imputation and categorical encoding using the training rows of the current fold. Apply the resulting rules unchanged to validation rows and define a policy for unseen categories and constant columns.',
    workedExample: 'If training area has mean 120 and standard deviation 20, a validation area of 150 is transformed to 1.5.',
    independentTask: 'Design a fold-local transformation for numeric floor area and categorical neighborhood, including missing values and previously unseen neighborhoods.',
  }),
  defineSectionActivity(chapter, '5.7.5', {
    objectives: ['Interpret the effect of log-scale error on relative prediction errors.'],
    explanation: 'Root mean squared error between log prices measures deviations in log ratios. Multiplying every true price and prediction by the same positive constant leaves it unchanged. Predictions must be positive before taking logs.',
    workedExample: 'Predicting 200 for a true value of 100 gives the same absolute log deviation as predicting 800 for a true value of 400.',
    independentTask: 'Compare doubling a price with halving it under squared log error. Explain why a prediction of zero needs special handling.',
  }),
  defineSectionActivity(chapter, '5.7.6', {
    objectives: ['Use each cross-validation fold once for validation.'],
    explanation: 'In K-fold validation, split labeled rows into K disjoint groups and hold out a different group for each run. Recreate model state and fit transformations independently, then summarize validation scores across folds.',
    workedExample: 'With 100 rows and five equal folds, each run trains on 80 and evaluates 20, and every row is evaluated once.',
    independentTask: 'Describe the train and validation indices for each of four folds on twelve rows and identify which transformations must be refitted.',
  }),
  defineSectionActivity(chapter, '5.7.7', {
    objectives: ['Compare model choices using consistent validation evidence.'],
    explanation: 'Compare candidate architectures or hyperparameters on the same folds with a common evaluation metric. Track variation as well as the mean, then retrain the selected configuration on all labeled data for final predictions.',
    workedExample: 'If a larger model improves only one fold and degrades the others, inspect the fold distribution before selecting it.',
    independentTask: 'Define a decision rule for choosing between a linear baseline and an MLP when average validation scores differ only slightly.',
  }),
  defineSectionActivity(chapter, '5.7.8', {
    objectives: ['Validate a prediction submission before sending it.'],
    explanation: 'Export one prediction for each required identifier using the provided column names. Compare the output against the competition template and check for duplicated IDs, non-finite values and unexpected ordering.',
    workedExample: 'Join predictions to preserved test IDs and verify that the resulting CSV has exactly one SalePrice value for every template Id.',
    independentTask: 'Write validation rules that would catch a missing prediction and a duplicated ID even if the total row count still matches.',
  }),
];

export const housePriceClassifications: CoverageClassification[] = [
  { sourceId: '5.7.9', kind: 'summary' },
  { sourceId: '5.7.10', kind: 'exercise-heading' },
];

export const housePriceExercises = [
  defineExerciseActivity(chapter, '5.7.10.exercise.1', {
    prompt: 'Prepare a competition-style CSV from a synthetic batch of three house predictions, then describe how you would compare its score to your local baseline.',
    hints: ['Keep the IDs in the prediction row order.', 'Use the same metric for the local baseline and submitted predictions.'],
    evaluation: { kind: 'rubric', criteria: ['Exports the required identifier and prediction columns with three matched rows.', 'Interprets any public score alongside local validation rather than treating it as definitive.'] },
  }),
  defineExerciseActivity(chapter, '5.7.10.exercise.2', {
    prompt: 'A garage-area field is blank mainly for houses without garages. Compare mean imputation with an explicit no-garage representation and suggest a validation check.',
    hints: ['Ask what caused the field to be missing.', 'Distinguish absent garages from measurements that were never entered.'],
    evaluation: { kind: 'rubric', criteria: ['Explains how a mean can invent garage space for a house without one.', 'Proposes a sensible encoding and compares validation error on affected examples.'] },
  }),
  defineExerciseActivity(chapter, '5.7.10.exercise.3', {
    prompt: 'Plan a fixed four-fold comparison of three learning rates and two regularization strengths. State how many training runs it takes and when you select a configuration.',
    hints: ['Each pair of hyperparameter values is one configuration.', 'Fit every configuration on each held-out fold in turn.'],
    evaluation: { kind: 'rubric', criteria: ['Counts 3 × 2 × 4 = 24 runs.', 'Selects using aggregated fold scores after evaluating all candidates.'] },
  }),
  defineExerciseActivity(chapter, '5.7.10.exercise.4', {
    prompt: 'Design an ablation comparing a linear price baseline, a one-hidden-layer MLP, and the same MLP with dropout. Specify the controls and the evidence needed to claim an improvement.',
    hints: ['Keep fold assignments and preprocessing consistent.', 'Use validation results and report variability across folds.'],
    evaluation: { kind: 'rubric', criteria: ['Separates the architecture comparison from the dropout comparison.', 'Compares validation performance under a fixed protocol and reports fold variation.'] },
  }),
  defineExerciseActivity(chapter, '5.7.10.exercise.5', {
    prompt: 'Compare two otherwise identical price regressors with and without standardizing floor area and bedroom count. Predict one training effect and specify what measurements would support it.',
    hints: ['Consider the different numerical scales of the two inputs.', 'Log optimization behavior as well as final validation metrics.'],
    evaluation: { kind: 'rubric', criteria: ['Predicts an effect on gradient scaling or optimization stability.', 'Proposes a controlled comparison with training curves and validation scores.'] },
  }),
];
