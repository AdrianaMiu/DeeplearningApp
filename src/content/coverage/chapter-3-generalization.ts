import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-3';
const section = (id: string, objective: string, explanation: string, workedExample: string, independentTask: string) =>
  defineSectionActivity(chapterId, id, { objectives: [objective], explanation, workedExample, independentTask });

export const generalizationSections = [
  section('3.6', 'Define the target population for evaluating a regression model.',
    'Generalization concerns new examples from the population where the model will be used. Evaluation on a random held-out sample can estimate this performance if the sample represents that population and did not influence the model.',
    'For a bike-demand forecast, holding out recent weeks better represents future deployment than distributing adjacent hours randomly across splits.',
    'Design a split for predicting delivery time on routes added next quarter. State what the split can and cannot estimate.'),
  section('3.6.1', 'Differentiate observed training loss from expected prediction loss.',
    'Training error averages the loss over the observations used for fitting. Generalization error averages over the target data distribution. Because fitting adapts to the training observations, their loss can underestimate loss on independent observations.',
    'A quadratic regressor has training MSE 2.1 and independent validation MSE 3.4, an observed gap of 1.3 in squared target units.',
    'For two regressors with train and validation MSE pairs (1, 6) and (2, 4), calculate the gaps and choose a candidate for further validation.'),
  section('3.6.2', 'Diagnose underfitting and overfitting using train and validation curves.',
    'A model that cannot represent the signal can give high loss on both training and validation data. A flexible model can fit training-specific fluctuations and produce a large gap. Compare curves against suitable baselines before interpreting either pattern.',
    'On quadratic data with noise, a line can miss curvature in both splits. A high-degree polynomial can hit almost every training point and swing between observations.',
    'Design a polynomial degree sweep with a fixed split. Predict the train and validation curves, and explain one result that would challenge your prediction.'),
  section('3.6.3', 'Separate model selection from final performance measurement.',
    'Validation data guides choices such as polynomial degree and regularization. Repeated selection can adapt the procedure to that validation set. Keep the test set untouched until selection is finished. When data is scarce, cross-validation rotates the validation fold.',
    'With five folds, fit five models for a candidate degree. Each validation fold is evaluated with a model trained on the other four.',
    'Compare three candidate degrees on small data using five folds. Specify where preprocessing is fitted and when the final holdout is scored.'),
];

export const generalizationClassifications: CoverageClassification[] = [
  { sourceId: '3.6.4', kind: 'summary' },
  { sourceId: '3.6.5', kind: 'exercise-heading' },
];

const exercise = (id: number, prompt: string, hints: [string, string], criteria: string[]) =>
  defineExerciseActivity(chapterId, `3.6.5.exercise.${id}`, { prompt, hints, evaluation: { kind: 'rubric', criteria } });

export const generalizationExercises = [
  exercise(1, 'You have exact measurements of a noiseless quadratic at three distinct temperatures. Explain why fitting a quadratic recovers the original curve, then describe what changes if the three temperatures coincide.',
    ['Write the linear system in the three polynomial coefficients.', 'Compare the number of distinct input values with the number of coefficients.'],
    ['Explains that distinct inputs give a full-rank quadratic design.', 'Explains that repeated temperatures alone cannot uniquely determine all three coefficients.']),
  exercise(2, 'List five concrete data collections where treating observations as independently and identically distributed would undermine validation. For each collection identify the dependence and specify a split that respects it.',
    ['Look for shared people, organizations, locations, or time windows.', 'Also consider repeated or transformed copies of the same measurement.'],
    ['Gives five distinct examples with a mechanism for dependence.', 'Proposes an appropriate group, spatial, or chronological split for each example.']),
  exercise(3, 'A forecasting model interpolates every target in its fitting table. Explain how its training MSE can be zero while deployment MSE stays positive, and give a setting where deployment MSE can also be zero.',
    ['Interpolation constrains the predictions at observed inputs.', 'A squared loss is zero only when its residual is zero.'],
    ['Explains that interpolation alone makes no guarantee for unseen inputs.', 'Identifies a deterministic target exactly represented by the learned predictor across the deployment distribution.']),
  exercise(4, 'A team evaluates eight parameter settings with six folds per setting. Count the training runs for comparing the settings, then include a final fit of the chosen setting on all development data.',
    ['Every setting trains afresh when the validation fold changes.', 'Add the final fit after the comparison.'],
    ['Computes 48 fits for comparison and 49 including the final fit.', 'Explains why the fold runs usually cannot reuse a single trained model.']),
  exercise(5, 'A six-fold estimate is used to predict the test error of a model retrained on all 600 development records. Explain why the score estimates a different training regime, and describe what can happen if it is also used to select and report the best candidate.',
    ['Count the records available to each fold model.', 'Consider which candidate benefits from favorable random variation.'],
    ['Explains each fold model trains on 500 records and the final model trains on 600.', 'Separates training-size bias from potentially optimistic selection bias when reusing the scores.']),
  exercise(6, 'Two families of binary scoring functions have the same possible signs on every input because the second family multiplies each score by 100. Explain why VC dimension cannot distinguish these families and why a margin-sensitive analysis might.',
    ['Positive scaling preserves the sign of every score.', 'Compare sign patterns with the sizes of score values.'],
    ['Explains that shattering depends on realizable label patterns, which scaling preserves.', 'Identifies that raw score magnitudes or margins can differ and that norm constraints matter for interpreting them.']),
  exercise(7, 'Your team cannot collect new measurements this month. Design a learning-curve experiment with the existing dataset to support or weaken a request for more examples.',
    ['Hold the validation data and metric fixed across sample sizes.', 'Repeat training on several subsets of each size.'],
    ['Uses repeated increasing subsets without including validation records.', 'Reports train and validation errors with variation across runs.', 'Explains why continued validation improvement supports a request without guaranteeing future gains.']),
];
