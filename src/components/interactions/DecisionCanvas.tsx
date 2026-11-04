import { useState } from 'react';
import type { InteractionSpec } from '../../domain/types';
import { calculateDecision } from '../../domain/studio-interactions';
import { Output } from './shared';
type Spec = Extract<InteractionSpec, { kind: 'decision-canvas' }>;
export default function DecisionCanvas({ spec }: { spec: Spec }) {
  const [selected, setSelected] = useState('');
  return <><p>{spec.prompt}</p><div>{spec.options.map(option => <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => setSelected(option.id)}>{option.label}</button>)}</div><Output title={spec.title} result={calculateDecision(spec.options, selected)} /></>;
}
