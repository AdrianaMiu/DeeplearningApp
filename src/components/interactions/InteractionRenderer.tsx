import { lazy, Suspense } from 'react';
import type { InteractionSpec } from '../../domain/types';
const ParameterLab = lazy(() => import('./ParameterLab'));
const ShapePath = lazy(() => import('./ShapePath'));
const SequenceStepper = lazy(() => import('./SequenceStepper'));
const MatrixExplorer = lazy(() => import('./MatrixExplorer'));
const DecisionCanvas = lazy(() => import('./DecisionCanvas'));
const DistributionExplorer = lazy(() => import('./DistributionExplorer'));
export function InteractionRenderer({ spec }: { spec: InteractionSpec }) {
  return <section aria-label={spec.title}><h3>{spec.title}</h3><p>{spec.instruction}</p><Suspense fallback={<p role="status">Loading interaction…</p>}>{spec.kind === 'parameter-lab' ? <ParameterLab key={spec.title} spec={spec} /> : spec.kind === 'shape-path' ? <ShapePath key={spec.title} spec={spec} /> : spec.kind === 'sequence-stepper' ? <SequenceStepper key={spec.title} spec={spec} /> : spec.kind === 'matrix-explorer' ? <MatrixExplorer key={spec.title} spec={spec} /> : spec.kind === 'decision-canvas' ? <DecisionCanvas key={spec.title} spec={spec} /> : <DistributionExplorer key={spec.title} spec={spec} />}</Suspense></section>;
}
