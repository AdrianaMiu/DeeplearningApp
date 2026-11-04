import { useState, useId } from 'react';
import type { InteractionSpec } from '../../domain/types';
import { calculateMatrix } from '../../domain/studio-interactions';
import { Output } from './shared';
type Spec = Extract<InteractionSpec, { kind: 'matrix-explorer' }>;
export default function MatrixExplorer({ spec }: { spec: Spec }) {
  const [matrix, setMatrix] = useState(() => spec.matrix.map(row => [...row]));
  const prefix = useId();
  return <><div>{matrix.map((row, i) => <div key={i}>{row.map((value, j) => <label key={j} htmlFor={`${prefix}-${i}-${j}`}>Row {i + 1}, column {j + 1} <input id={`${prefix}-${i}-${j}`} type="number" step="any" value={Number.isFinite(value) ? value : ''} onChange={e => { const n = e.target.value === '' ? NaN : Number(e.target.value); setMatrix(m => m.map((r, ri) => r.map((v, ci) => ri === i && ci === j ? n : v))); }} /></label>)}</div>)}</div><Output title={spec.title} result={calculateMatrix(matrix, spec.operation)} /></>;
}
