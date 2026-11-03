import { describe, expect, it } from 'vitest';
import { broadcastShapes } from '../../src/domain/broadcasting';

describe('broadcastShapes', () => {
  it('aligns dimensions from the right and expands dimensions of one', () => {
    expect(broadcastShapes([4, 1, 6], [3, 6])).toMatchObject({
      compatible: true,
      resultShape: [4, 3, 6],
      axes: [
        { left: 4, right: 1, result: 4, compatible: true },
        { left: 1, right: 3, result: 3, compatible: true },
        { left: 6, right: 6, result: 6, compatible: true },
      ],
    });
  });

  it('explains the first incompatible aligned axis', () => {
    const result = broadcastShapes([4, 2], [4]);
    expect(result.compatible).toBe(false);
    expect(result.resultShape).toEqual([]);
    expect(result.reason).toContain('2 and 4');
  });

  it('rejects empty, zero, and non-integer dimensions', () => {
    expect(broadcastShapes([], [2]).compatible).toBe(false);
    expect(broadcastShapes([0, 2], [2]).compatible).toBe(false);
    expect(broadcastShapes([1.5], [1]).compatible).toBe(false);
  });
});
