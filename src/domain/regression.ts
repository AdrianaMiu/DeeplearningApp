export interface Point { x: number; y: number }
export interface LineParameters { weight: number; bias: number }

export function predictLine(points: Point[], weight: number, bias: number): number[] {
  return points.map(({ x }) => weight * x + bias);
}

export function meanSquaredError(points: Point[], weight: number, bias: number): number {
  if (points.length === 0) return 0;
  return points.reduce((total, point) => {
    const error = weight * point.x + bias - point.y;
    return total + error * error;
  }, 0) / points.length;
}

export function gradientStep(points: Point[], parameters: LineParameters, learningRate: number): LineParameters {
  if (points.length === 0) return parameters;
  let weightGradient = 0;
  let biasGradient = 0;
  for (const point of points) {
    const error = parameters.weight * point.x + parameters.bias - point.y;
    weightGradient += 2 * error * point.x;
    biasGradient += 2 * error;
  }
  return {
    weight: parameters.weight - learningRate * weightGradient / points.length,
    bias: parameters.bias - learningRate * biasGradient / points.length,
  };
}
