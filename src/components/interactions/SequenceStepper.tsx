import { useState } from 'react';
import type { InteractionSpec } from '../../domain/types';
import { calculateSequence } from '../../domain/studio-interactions';
import { Output } from './shared';
type Spec = Extract<InteractionSpec, { kind: 'sequence-stepper' }>;
export default function SequenceStepper({ spec }: { spec: Spec }) {
  const [index, setIndex] = useState(0);
  return <><p>Step {spec.steps.length ? index + 1 : 0} of {spec.steps.length}</p><button type="button" disabled={index <= 0} onClick={() => setIndex(i => i - 1)}>Previous step</button>{' '}<button type="button" disabled={index >= spec.steps.length - 1} onClick={() => setIndex(i => i + 1)}>Next step</button><Output title={spec.title} result={calculateSequence(spec.steps, index)} /></>;
}
