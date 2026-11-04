import type { InteractionSpec } from './types';

type Spec<K extends InteractionSpec['kind']> = Extract<InteractionSpec, { kind: K }>;
export type Result = { rows: [string, string | number][]; message: string; error?: string };
const invalid = (message: string): Result => ({ rows: [], message, error: message });
const result = (rows: Result['rows'], message: string): Result => rows.some(([, v]) => typeof v === 'number' && !Number.isFinite(v)) ? invalid('The calculation exceeds the supported numeric range.') : { rows, message };

export function calculateParameter(model: Spec<'parameter-lab'>['model'], values: Record<string, number>): Result {
  const id = { softmax: 'logit', dropout: 'rate', optimizer: 'learning-rate', 'rbf-kernel': 'length-scale', 'search-budget': 'budget', 'gan-balance': 'fake-probability' }[model];
  const x = values[id];
  if (!Number.isFinite(x)) return invalid('Enter a finite value for the control.');
  switch (model) {
    case 'softmax': { const p = x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)); return result([['Adjusted score probability', p], ['Zero score probability', 1 - p]], 'Softmax compares the adjusted logit with a second logit of zero.'); }
    case 'dropout': return x < 0 || x >= 1 ? invalid('Dropout rate must be at least 0 and less than 1.') : result([['Keep probability', 1 - x], ['Training scale for kept values', 1 / (1 - x)]], 'Inverted dropout rescales kept values during training.');
    case 'optimizer': { const w = 2 * (1 - x); return x < 0 ? invalid('Learning rate must be nonnegative.') : result([['Next weight', w], ['Next loss', w * w / 2]], 'One gradient descent step from w=2 on L(w)=w²/2.'); }
    case 'rbf-kernel': return x <= 0 ? invalid('Length scale must be positive.') : result([['Covariance', Math.exp(-0.5 / x / x)]], 'Unit-amplitude RBF covariance at distance 1.');
    case 'search-budget': return x < 6 || !Number.isInteger(x) ? invalid('Budget must be a whole number of at least 6 epochs.') : result([['Additional epochs', x - 6], ['Initial trial epochs', 6]], 'Three initial trials reserve six epochs.');
    case 'gan-balance': return x <= 0 || x >= 1 ? invalid('D(fake) must be strictly between 0 and 1.') : result([['Discriminator loss', -Math.log(0.8) - Math.log(1 - x)], ['D(fake)', x]], 'Binary cross-entropy discriminator loss with D(real)=0.8; the generator aims to increase D(fake).');
    default: return invalid('Unknown parameter model.');
  }
}
export function calculateShape(steps: Spec<'shape-path'>['steps'], index: number): Result {
  const s = steps?.[index];
  if (!s || !Number.isInteger(index) || !s.inputShape?.length || !s.outputShape?.length || [...s.inputShape, ...s.outputShape].some(n => !Number.isInteger(n) || n <= 0)) return invalid('Choose a step with positive input and output dimensions.');
  return result([['Input shape', s.inputShape.join(' × ')], ['Output shape', s.outputShape.join(' × ')]], `${s.label}: ${s.explanation}`);
}
export function calculateSequence(steps: Spec<'sequence-stepper'>['steps'], index: number): Result {
  const s = steps?.[index];
  if (!s || !Number.isInteger(index)) return invalid('Choose a step from a nonempty sequence.');
  return result([['Input', s.input], ['State', s.state], ['Output', s.output]], `${s.label}: ${s.explanation}`);
}
export function calculateMatrix(matrix: number[][], operation: Spec<'matrix-explorer'>['operation']): Result {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0]) || !matrix[0].length || matrix.some(row => !Array.isArray(row) || row.length !== matrix[0].length || row.some(n => !Number.isFinite(n)))) return invalid('Provide a nonempty rectangular matrix of finite numbers.');
  if (operation === 'attention') return result(matrix.map((row, i) => { const max = Math.max(...row); const exps = row.map(n => Math.exp(n - max)); const sum = exps.reduce((a, b) => a + b, 0); return [`Query ${i + 1}`, exps.map(n => Number((n / sum).toPrecision(6))).join(', ')]; }), 'Row-wise softmax gives attention weights across keys.');
  if (matrix.length !== matrix[0].length) return invalid('This operation requires a square matrix.');
  if (operation === 'matmul') {
    const product = matrix.map(row => row.map((_, j) => row.reduce((sum, n, k) => sum + n * matrix[k][j], 0)));
    if (product.some(row => row.some(n => !Number.isFinite(n)))) return invalid('The matrix product exceeds the supported numeric range.');
    return result(product.map((row, i) => [`Row ${i + 1}`, row.join(', ')]), 'Matrix multiplied by itself (A × A).');
  }
  if (operation === 'eigen') {
    if (matrix.some((row, i) => row.some((n, j) => i !== j && n !== 0))) return invalid('Eigenvalues are shown only for diagonal matrices.');
    return result(matrix.map((row, i) => [`Eigenvalue for axis ${i + 1}`, row[i]]), 'For a diagonal matrix, each coordinate axis is an eigenvector and its diagonal entry is the eigenvalue.');
  }
  return invalid('Unknown matrix operation.');
}
export function calculateDecision(options: Spec<'decision-canvas'>['options'], selected: string): Result {
  const option = options?.find(o => o.id === selected);
  return option ? result([['Choice', option.label]], option.feedback) : invalid('Choose an available option.');
}
export function calculateDistribution(model: Spec<'distribution-explorer'>['model'], values: Record<string, number>, observations: number[]): Result {
  if (!Array.isArray(observations) || !observations.length || observations.some(n => !Number.isFinite(n))) return invalid('Provide at least one finite observation.');
  if (model === 'bernoulli') { const p = values.probability; if (!Number.isFinite(p) || p < 0 || p > 1 || observations.some(n => n !== 0 && n !== 1)) return invalid('Use a probability from 0 to 1 and binary observations.'); return result([['Observation likelihood', observations.reduce((a, n) => a * (n ? p : 1 - p), 1)]], 'Likelihood of the observed ordered independent Bernoulli outcomes.'); }
  if (model === 'normal') { const mean = values.mean; const sd = values['standard-deviation']; if (!Number.isFinite(mean) || !Number.isFinite(sd) || sd <= 0) return invalid('Enter a finite mean and positive standard deviation.'); return result(observations.map((x, i) => [`Density at observation ${i + 1}`, Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))]), 'Normal probability density at each observation.'); }
  if (model === 'gaussian-process') { const scale = values['length-scale']; if (!Number.isFinite(scale) || scale <= 0 || observations.length < 2) return invalid('Enter a positive length scale and at least two input locations.'); return result([['Covariance', Math.exp(-0.5 * ((observations[0] - observations[1]) / scale) ** 2)]], 'Unit-amplitude RBF prior covariance between the first two input locations.'); }
  return invalid('Unknown distribution model.');
}
