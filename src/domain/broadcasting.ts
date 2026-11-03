export interface BroadcastAxis {
  left: number;
  right: number;
  result: number;
  compatible: boolean;
}

export interface BroadcastResult {
  compatible: boolean;
  resultShape: number[];
  axes: BroadcastAxis[];
  reason?: string;
}

const validShape = (shape: number[]) =>
  shape.length > 0 && shape.every((dimension) => Number.isInteger(dimension) && dimension > 0);

export function broadcastShapes(leftShape: number[], rightShape: number[]): BroadcastResult {
  if (!validShape(leftShape) || !validShape(rightShape)) {
    return { compatible: false, resultShape: [], axes: [], reason: 'Shapes require positive integer dimensions.' };
  }
  const width = Math.max(leftShape.length, rightShape.length);
  const left = Array(width - leftShape.length).fill(1).concat(leftShape);
  const right = Array(width - rightShape.length).fill(1).concat(rightShape);
  const axes = left.map((leftDimension, index) => {
    const rightDimension = right[index];
    const compatible = leftDimension === rightDimension || leftDimension === 1 || rightDimension === 1;
    return {
      left: leftDimension,
      right: rightDimension,
      result: compatible ? Math.max(leftDimension, rightDimension) : 0,
      compatible,
    };
  });
  const incompatible = axes.find((axis) => !axis.compatible);
  if (incompatible) {
    return {
      compatible: false,
      resultShape: [],
      axes,
      reason: `Aligned dimensions ${incompatible.left} and ${incompatible.right} are neither equal nor 1.`,
    };
  }
  return { compatible: true, resultShape: axes.map((axis) => axis.result), axes };
}
