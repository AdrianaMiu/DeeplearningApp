export function finiteDifference(fn: (x: number) => number, x: number, step = 1e-5): number {
  if (!(step > 0) || !Number.isFinite(step)) throw new RangeError('step must be a positive finite number');
  return (fn(x + step) - fn(x - step)) / (2 * step);
}

export function tangentLine(
  fn: (x: number) => number,
  derivative: (x: number) => number,
  at: number,
): { slope: number; intercept: number; valueAt: (x: number) => number } {
  const slope = derivative(at);
  const intercept = fn(at) - slope * at;
  return { slope, intercept, valueAt: (x) => slope * x + intercept };
}
