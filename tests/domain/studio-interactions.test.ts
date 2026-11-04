import { describe, expect, it } from 'vitest';
import { calculateParameter, calculateShape, calculateSequence, calculateMatrix, calculateDecision, calculateDistribution } from '../../src/domain/studio-interactions';

describe('studio interactions', () => {
  it('calculates every studio interaction deterministically', () => {
    expect(calculateParameter('optimizer', { 'learning-rate': 0.5 }).rows).toContainEqual(['Next weight', 1]);
    expect(calculateParameter('rbf-kernel', { 'length-scale': 1 }).rows[0][1]).toBeCloseTo(Math.exp(-0.5));
    expect(calculateParameter('search-budget', { budget: 10 }).rows).toContainEqual(['Additional epochs', 4]);
    expect(calculateParameter('gan-balance', { 'fake-probability': 0.2 }).rows[0][1]).toBeCloseTo(-2 * Math.log(0.8));
    expect(calculateParameter('softmax', { logit: 0 }).rows[0][1]).toBe(0.5);
    expect(calculateParameter('dropout', { rate: 0.2 }).rows[0][1]).toBe(0.8);
    expect(calculateShape([{ label: 'Dense', inputShape: [1, 4], outputShape: [1, 3], explanation: 'Map features' }], 0).rows[0]).toEqual(['Input shape', '1 × 4']);
    expect(calculateSequence([{ label: 'Step', input: '1', state: '1', output: '1', explanation: 'Update' }], 0).rows[1]).toEqual(['State', '1']);
    expect(calculateMatrix([[0, 0], [0, 1]], 'attention').rows[0][1]).toBe('0.5, 0.5');
    expect(calculateMatrix([[1, 2], [3, 4]], 'matmul').rows[0][1]).toBe('7, 10');
    expect(calculateMatrix([[3, 0], [0, 1]], 'eigen').rows[0][1]).toBe(3);
    expect(calculateDecision([{ id: 'a', label: 'A', feedback: 'Good' }], 'a').message).toBe('Good');
    expect(calculateDistribution('bernoulli', { probability: 0.5 }, [1, 0]).rows[0][1]).toBe(0.25);
    expect(calculateDistribution('normal', { mean: 0, 'standard-deviation': 1 }, [0]).rows[0][1]).toBeCloseTo(1 / Math.sqrt(2 * Math.PI));
    expect(calculateDistribution('gaussian-process', { 'length-scale': 1 }, [0, 1]).rows[0][1]).toBeCloseTo(Math.exp(-0.5));
    expect(calculateMatrix([[1, 2], [3]], 'attention').error).toBeTruthy();
    expect(calculateSequence([], 0).error).toBeTruthy();
    expect(calculateMatrix([[1e308]], 'matmul').error).toBeTruthy();
    expect(calculateParameter('optimizer', { 'learning-rate': NaN }).error).toBeTruthy();
  });
});
