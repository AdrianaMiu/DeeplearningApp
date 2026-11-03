import { describe, expect, it } from 'vitest';
import { finiteDifference, tangentLine } from '../../src/domain/gradients';
import { gradientStep, meanSquaredError, predictLine } from '../../src/domain/regression';

describe('gradient helpers', () => {
  it('approximates the derivative of x squared independently', () => {
    expect(finiteDifference((x) => x * x, 3)).toBeCloseTo(6, 5);
  });

  it('constructs a tangent line from a supplied derivative', () => {
    const tangent = tangentLine((x) => x * x, (x) => 2 * x, 2);
    expect(tangent.slope).toBe(4);
    expect(tangent.valueAt(3)).toBe(8);
  });
});

describe('regression helpers', () => {
  const points = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }];

  it('predicts a line and computes mean squared error', () => {
    expect(predictLine(points, 2, 1)).toEqual([1, 3, 5]);
    expect(meanSquaredError(points, 2, 1)).toBe(0);
    expect(meanSquaredError(points, 0, 0)).toBeCloseTo(35 / 3);
  });

  it('takes a gradient step that lowers loss', () => {
    const before = meanSquaredError(points, 0, 0);
    const next = gradientStep(points, { weight: 0, bias: 0 }, 0.1);
    expect(meanSquaredError(points, next.weight, next.bias)).toBeLessThan(before);
  });
});
