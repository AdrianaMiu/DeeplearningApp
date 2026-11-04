import { useState } from 'react';
import type { InteractionSpec } from '../../domain/types';
import { calculateDistribution } from '../../domain/studio-interactions';
import { NumericInputs, Output } from './shared';
type Spec = Extract<InteractionSpec, { kind: 'distribution-explorer' }>;
export default function DistributionExplorer({ spec }: { spec: Spec }) {
  const [values, setValues] = useState(() => Object.fromEntries(spec.controls.map(c => [c.id, c.initial])));
  return <><NumericInputs controls={spec.controls} values={values} change={(id, value) => setValues(v => ({ ...v, [id]: value }))} /><Output title={spec.title} result={calculateDistribution(spec.model, values, spec.observations)} /></>;
}
