import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-4';
const section = (id: string, objective: string, explanation: string, workedExample: string, independentTask: string) =>
  defineSectionActivity(chapterId, id, { objectives: [objective], explanation, workedExample, independentTask });
const exercise = (id: string, prompt: string, hints: [string, string], criteria: string[]) =>
  defineExerciseActivity(chapterId, id, { prompt, hints, evaluation: { kind: 'rubric', criteria } });

export const classificationGeneralizationSections = [
  section('4.6', 'Separate classification performance on a sample from population risk.',
    'The error rate on observed labels estimates the probability of an incorrect prediction on future examples. The interpretation depends on how the sample was gathered and whether its labels influenced the classifier.',
    'A classifier with 9 mistakes among 100 randomly sampled examples has empirical error 9%, but another sample can yield a different fraction.',
    'Explain what population is represented by a classifier evaluated only on images from one camera and one week.'),
  section('4.6.1', 'Estimate uncertainty for a fixed classifier on fresh IID data.',
    'Each classification mistake is a zero-one outcome. For a fixed classifier evaluated on independent examples from the deployment distribution, Hoeffding’s inequality bounds the chance that the sample error differs from its expectation by at least a stated tolerance.',
    'At n = 1,000 and tolerance 0.05, the bound 2 exp(−2n·0.05²) is about 0.0135.',
    'Compare the Hoeffding bound for 1,000 and 2,000 examples at the same tolerance and explain what assumptions the comparison needs.'),
  section('4.6.2', 'Recognize why adaptive reuse undermines a held-out score.',
    'When scores from a test set guide the next model, the eventual model depends indirectly on the test labels. Searching enough candidates can favor one with unusually good performance on that sample.',
    'Tuning a decision threshold after each returned test accuracy turns the test score into a selection signal. The final reported accuracy can be optimistic.',
    'Describe a protocol for trying 20 thresholds and reporting one score while preserving an independent final evaluation.'),
  section('4.6.3', 'Connect shattering to classifier-family complexity.',
    'A family shatters a set when it realizes every binary labeling on that set. VC dimension measures the largest set that can be shattered. It helps quantify the difficulty of making statements uniform over a family instead of evaluating just one fixed classifier.',
    'Thresholds of the form x > t shatter one point, while on two ordered points the lower point cannot be positive and the higher point negative.',
    'Determine whether contiguous intervals on the real line can shatter two and three distinct points. Explain which label patterns matter.'),
  section('4.7', 'Identify the deployment environment before choosing mitigation.',
    'Evaluating a model on historical records does not establish reliability in changed conditions. Compare how examples are selected, measured and labeled in training and deployment to identify which statistical relationships may have changed.',
    'A factory inspection model trained on well-lit images may face dim images on a new shift even if the definition of a defect stays stable.',
    'Describe one possible training-to-deployment change for a document classifier and identify what data would help distinguish its causes.'),
  section('4.7.1', 'Distinguish covariate, label and concept shift by their invariants.',
    'Covariate shift changes P(X) while preserving P(Y given X). Label shift changes P(Y) while preserving P(X given Y). Concept shift changes the predictive relationship P(Y given X), for example when a label policy changes.',
    'Changing the definition of a successful delivery from within an hour to within 30 minutes changes labels for otherwise identical historical inputs.',
    'Invent three versions of a ticket triage shift, one per shift type. For each state which distribution or conditional is assumed to remain stable.'),
  section('4.7.2', 'Distinguish plausible causes of a measured distribution difference.',
    'A measured gap between training and deployment can originate from sampling, measurement, or the actions a model induces. A classifier that detects a source difference can identify symptoms without explaining their cause.',
    'A product ranker shows the same items to everyone, then learns from clicks on those items. Future labels reflect the exposure decisions of the existing model.',
    'Trace how an automated routing rule might change which support tickets receive labels and what records would reveal the feedback loop.'),
  section('4.7.3', 'Use importance weighting under explicit covariate-shift assumptions.',
    'If P(Y given X) is unchanged, weighting training losses by target density divided by source density can estimate target risk where the source covers the target. Extreme weights can produce high variance; missing source support cannot be repaired this way.',
    'If night images account for 10% of source examples and 30% of target examples, their ratio is 3 when using a two-group model for the input density.',
    'Compute weights for day and night examples in that setting, then explain why a target-only camera type needs additional data or assumptions.'),
  section('4.7.4', 'Choose a learning setup that matches available feedback.',
    'The learning problem depends on what the environment reveals. Supervised learning uses paired inputs and labels, unsupervised learning seeks structure without labels, and interaction-based learning considers how actions alter outcomes or future observations.',
    'Grouping sensor readings without labels is unsupervised. Choosing which sensor to inspect and learning only from that inspection yields action-dependent feedback.',
    'Classify a labeling workflow where a model chooses which examples humans inspect. Identify the observations hidden by that choice.'),
  section('4.7.5', 'Define an audit that exposes group-specific errors and their consequences.',
    'An aggregate score can hide different error rates or consequences across groups. Document what is measured, how labels and groups are defined, and whose outcomes are affected. An audit also needs an accountable owner and a way to correct mistakes.',
    'Two groups can have the same overall accuracy while one has a higher false-negative rate, depending on positive prevalence and false-positive rates.',
    'For a hypothetical aid eligibility classifier, propose an audit metric, an appeal path, and a privacy-preserving way to report group counts.'),
];

export const classificationGeneralizationClassifications: CoverageClassification[] = [
  { sourceId: '4.6.4', kind: 'summary' },
  { sourceId: '4.6.5', kind: 'exercise-heading' },
  { sourceId: '4.7.6', kind: 'summary' },
  { sourceId: '4.7.7', kind: 'exercise-heading' },
];

export const classificationGeneralizationExercises = [
  exercise('4.6.5.exercise.1', 'Determine how many fresh independent examples suffice to estimate a fixed detector’s error to within 0.02 with confidence at least 95%, using a two-sided Hoeffding bound.',
    ['The probability of a deviation is at most 2 exp(−2nε²).', 'Solve for n before rounding up.'],
    ['Uses fixed-model, IID assumptions and solves n ≥ log(40)/(2·0.02²).', 'Rounds the sufficient sample size up to 4,612.']),
  exercise('4.6.5.exercise.2', 'In a toy binary evaluation with four distinct rows and exact error counts, compare an all-zero prediction with each prediction obtained by flipping a single row. Explain how these scores disclose the labels.',
    ['A one-row flip changes the error count by exactly one.', 'The sign of that change depends on the original true label.'],
    ['Uses one reference prediction and four single-flip comparisons.', 'Explains that an increase reveals label zero and a decrease reveals label one for the flipped row.']),
  exercise('4.6.5.exercise.3', 'Find the VC dimension for the signs of real univariate polynomials of degree at most five when evaluated on distinct real points; take score zero to be positive.',
    ['Use interpolation to realize labels in one direction.', 'An alternating label pattern forces changes of sign in the other direction.'],
    ['Uses interpolation at six points to realize arbitrary scores of −1 or +1.', 'Rules out shattering seven points by starting and ending an alternating sequence with negative labels. Its six required roots counted with multiplicity exceed degree five.']),
  exercise('4.6.5.exercise.4', 'Find the VC dimension of indicators of axis-aligned rectangles in the plane. Give a shatterable configuration and explain why every configuration of five points rules out some labeling.',
    ['For a lower bound, place one point at each extreme of a diamond.', 'Among five points, choose at most four witnesses for the extreme coordinates.'],
    ['Shows that the bounding rectangle of any nonempty subset of the diamond points excludes unselected points; the empty subset uses a disjoint rectangle.', 'Labels extreme witnesses positive and another point negative, which is impossible inside a rectangle containing every witness.']),
  exercise('4.7.7.exercise.1', 'A marketplace promotes faster sellers in search results. Describe how both buyers and sellers could respond, and identify two measurements that might be misleading after this policy change.',
    ['Consider exposure before interpreting click or purchase counts.', 'Sellers can change behavior in response to the ranking incentive.'],
    ['Identifies one plausible adaptation for each side of the market.', 'Links changed exposure or selection to two measurements and proposes a comparison baseline.']),
  exercise('4.7.7.exercise.2', 'Design a detector for whether old and recent photos differ in their input distributions, using only the photos and their collection periods. Specify training data, test data, a metric and a way to check whether the signal is reproducible.',
    ['Use period as the classification target rather than image class.', 'Balance or account for source prevalence and keep related images together.'],
    ['Trains a source discriminator and evaluates on an independent split.', 'Uses a suitable baseline such as balanced accuracy 0.5 or a permutation test.', 'Explains that successful separation does not establish unchanged label conditionals.']),
  exercise('4.7.7.exercise.3', 'Assume a source discriminator gives calibrated target-domain probability q(x), trained with equal source and target class priors. Construct a weighted training loss for the task classifier and describe a safeguard for extreme ratios.',
    ['Use Bayes’ odds to relate domain probabilities to densities.', 'Near-one target probability suggests weak overlap.'],
    ['Derives weight q(x)/(1−q(x)) for source task examples.', 'Explains how clipping trades variance for bias and names a check on independent target labels.', 'States conditional stability and support requirements.']),
  exercise('4.7.7.exercise.4', 'An evaluation sample comes from the deployment distribution, yet its empirical error is a poor estimate of risk. Give three explanations other than distribution shift and describe how each could be investigated.',
    ['Consider small samples and dependencies between records.', 'Audit how labels and scores were generated and reused.'],
    ['Gives three distinct explanations such as sampling variation, dependence, labeling mistakes, or adaptive reuse.', 'Matches each explanation with a reasonable diagnostic.']),
];
