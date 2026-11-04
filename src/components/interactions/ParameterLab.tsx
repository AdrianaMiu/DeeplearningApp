import { useState } from 'react';
import type { InteractionSpec } from '../../domain/types';
import { calculateParameter } from '../../domain/studio-interactions';
import { NumericInputs, Output } from './shared';
type Spec = Extract<InteractionSpec, { kind: 'parameter-lab' }>;
export default function ParameterLab({ spec }: { spec: Spec }) {
  const [values, setValues] = useState(() => Object.fromEntries(spec.controls.map(c => [c.id, c.initial])));
  return <><NumericInputs controls={spec.controls} values={values} change={(id, value) => setValues(v => ({ ...v, [id]: value }))} /><Output title={spec.title} result={calculateParameter(spec.model, values)} /></>;
}
