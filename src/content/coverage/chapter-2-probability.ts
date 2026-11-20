import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification } from './types';

const chapterId = 'chapter-2';
const section = (id: string, objective: string, explanation: string, workedExample: string, independentTask: string) =>
  defineSectionActivity(chapterId, id, { objectives: [objective], explanation, workedExample, independentTask });

export const probabilitySections = [
  section('2.6', 'Separate estimation uncertainty from variability in outcomes.',
    'Probability models describe uncertain outcomes. Data can help estimate a model parameter, but even a perfectly estimated parameter may assign several outcomes positive probability on the next trial.',
    'After many rolls we may estimate that a die is fair very precisely, while the next roll still has six plausible outcomes.',
    'For a spam classifier, name one uncertainty more training data might reduce and one that could persist with the same features.'),
  section('2.6.1', 'Use simulation to distinguish variation from convergence.',
    'A Bernoulli trial has two outcomes and one success probability. The sample proportion can move in either direction after an additional observation, even though its typical error decreases as the sample grows.',
    'Two heads in four trials give 0.5. A fifth head raises the proportion to 0.6, so additional observations do not guarantee a smaller error in each run.',
    'Simulate independent runs of lengths 20 and 2,000 at p = 0.4. Compare the spread of the sample proportions across runs.'),
  section('2.6.2', 'Represent events as subsets of a sample space.',
    'An event is a collection of outcomes. The full sample space has probability one, and probabilities add for disjoint events. Overlapping events need a correction because the overlap would otherwise be counted twice.',
    'For a die, even or greater than four includes outcomes 2, 4, 5 and 6, with 6 satisfying both conditions.',
    'Write the events for an odd roll and a roll at most four, then compute the probability of their union.'),
  section('2.6.3', 'Build a probability mass function from an outcome table.',
    'A random variable assigns a value to each outcome, and several outcomes can share that value. Its mass at a value is the total probability of all outcomes that map there. For a continuous variable, probabilities correspond to areas under a density.',
    'Counting heads in two fair independent tosses assigns both HT and TH to the value one, whose probability is therefore one half.',
    'Write the mass function of the maximum of two independent rolls of a fair three-sided die and verify that the masses sum to one.'),
  section('2.6.4', 'Distinguish joint, marginal and conditional probabilities.',
    'A joint distribution describes combinations. Summing over one variable gives a marginal distribution. Conditioning on an event of positive probability restricts attention to its outcomes and renormalizes their probabilities.',
    'If 12 of 40 records are cloudy mornings and 9 of those produce rain, the observed rain fraction conditional on a cloudy morning is 9/12.',
    'Create a two-by-two table for rain and clouds. Derive both marginal probabilities, then compare the two possible directions of conditioning.'),
  section('2.6.5', 'Update a prior using evidence and a false-positive rate.',
    'Bayes’ rule weights each hypothesis by its prior probability and its likelihood of producing the observation. The denominator sums these weighted likelihoods across hypotheses, so common negatives can dominate positive alerts even when sensitivity is high.',
    'If faults occur in 1% of runs, alerts occur in 90% of faulty runs and 9% of normal runs, and an alert is observed, the probability of a fault is about 9.17%.',
    'Keep the two alert rates fixed and increase the prior fault rate to 10%. Calculate the new posterior and explain the change.'),
  section('2.6.6', 'Calculate means and reason about dependence in variance.',
    'Expectation averages values weighted by probability and remains linear for dependent variables. Variance measures the expected squared deviation from the mean. The variance of a sum includes a covariance term, which only disappears when covariance is zero.',
    'For a fair 0–1 variable B, E[B] = 0.5 and Var(B) = 0.25. The repeated-variable sum B + B has variance 1, unlike a sum of two independent copies.',
    'Compare the variance of the sum of two independent die rolls with twice a single die roll. Explain the role of covariance.'),
  section('2.6.7', 'Connect probability models with estimates from observed data.',
    'A probability model states assumptions about possible observations. A statistic summarizes observations already collected. Repeated estimates can vary, and a large dataset can still yield a biased estimate if the observations systematically exclude part of the population.',
    'Estimating commute time from a thousand records collected only on Sundays may give a precise summary of Sundays and a poor estimate for weekdays.',
    'Choose a metric for model quality, state what population it should describe, and propose a sampling plan that covers relevant cases.'),
];

export const probabilityClassifications: CoverageClassification[] = [
  { sourceId: '2.6.8', kind: 'exercise-heading' },
];

const exercise = (id: number, prompt: string, hints: [string, string], criteria: string[]) =>
  defineExerciseActivity(chapterId, `2.6.8.exercise.${id}`, { prompt, hints, evaluation: { kind: 'rubric', criteria } });

export const probabilityExercises = [
  exercise(1, 'A scale has a fixed offset and each reading of a reference mass adds independent, zero-mean noise of finite variance. Explain why repeated readings can pin down the offset.',
    ['Subtract the known reference mass.', 'Consider how the variance of an average changes.'],
    ['Estimates the offset by averaging the residuals.', 'Explains convergence under the stated assumptions.']),
  exercise(2, 'A sealed generator produces independent bits with an unknown constant chance of one. Explain what observing a long bit stream tells you and what uncertainty remains about the next bit.',
    ['Distinguish learning p from predicting the next draw.', 'Consider the case where the true p lies strictly between zero and one.'],
    ['Explains that the sample proportion estimates p.', 'Identifies residual variability of the next draw even with known p.']),
  exercise(3, 'A production line emits independent reject flags with probability p. For n flags, derive the variance of the observed reject fraction and bound the probability of an absolute estimation error of at least ε. Describe its approximate large-n distribution for 0 < p < 1.',
    ['An indicator satisfies X² = X.', 'Apply Chebyshev and the central limit theorem to the sample mean.'],
    ['Derives variance p(1−p)/n and bound p(1−p)/(nε²).', 'Identifies a normal approximation with mean p and variance p(1−p)/n.']),
  exercise(4, 'Running means M₅ and M₁₀ are computed from the first five and ten members of the same independent unit-variance stream. Explain which Chebyshev bounds hold and whether the two deviation events are automatically independent.',
    ['The smaller sample is entirely contained in the larger sample.', 'A marginal probability bound does not require independence between statistics.'],
    ['Applies the marginal bound 1/(mε²) to each mean.', 'Explains that shared observations make the running means dependent and prevent multiplying bounds on that basis.']),
  exercise(5, 'In an audit, 70% of records pass check A and 60% pass check B. Find the possible ranges for the fractions passing both checks and passing at least one check.',
    ['At most the smaller group can pass both.', 'The union cannot exceed the whole audit population.'],
    ['Bounds the intersection between 30% and 60%.', 'Uses inclusion–exclusion to bound the union between 70% and 100%.']),
  exercise(6, 'A simulation draws a starting state S, then chooses T using only S, then chooses U using only T. Write the probability of seeing a particular triple and identify the conditional independence used.',
    ['Start with the ordinary probability chain rule.', 'Once T is known, ask whether S changes the distribution of U.'],
    ['Factors the joint probability as P(S)P(T given S)P(U given T).', 'States that U is conditionally independent of S given T.']),
  exercise(7, 'A machine fault has prior probability 0.02. Each of two sensors triggers with probability 0.9 given a fault and 0.1 otherwise. Fault-case alerts are independent, but both sensors trigger together on 0.04 of normal runs. Build the normal-run joint table and calculate fault probability after one alert and after two.',
    ['Use the marginal rates to fill the one-alert cells.', 'Multiply alert likelihoods by the priors before normalizing.'],
    ['Gets normal-run probabilities 0.04, 0.06, 0.06 and 0.84 for both, either alone, and neither.', 'Gets 0.018/0.116 for one specified positive alert and 0.0162/0.0554 for both.']),
  exercise(8, 'Allocate a unit budget across long-only strategies with mean payoff vector μ and covariance matrix Σ. Express expected payoff and variance, find an allocation maximizing the mean alone, and write the problem when variance is capped at v.',
    ['The payoff is a weighted sum of random variables.', 'A weighted average cannot exceed its largest component.'],
    ['Derives αᵀμ and αᵀΣα from the payoff.', 'Allocates everything to a highest-mean strategy without the risk constraint.', 'Maximizes αᵀμ subject to αᵀΣα ≤ v, nonnegative weights, and unit total weight.']),
];
