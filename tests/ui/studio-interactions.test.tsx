import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { InteractionRenderer } from '../../src/components/interactions/InteractionRenderer';
import type { InteractionSpec } from '../../src/domain/types';

afterEach(cleanup);
it('exposes keyboard and table paths for every interaction', async () => {
  const base = { title: 'Studio', instruction: 'Explore' };
  const specs: InteractionSpec[] = [
    { ...base, kind: 'parameter-lab', model: 'optimizer', controls: [{ id: 'learning-rate', label: 'Learning rate', min: 0, max: 2, step: 0.5, initial: 0.5 }] },
    { ...base, kind: 'shape-path', steps: [{ label: 'One', inputShape: [1], outputShape: [2], explanation: 'First' }, { label: 'Two', inputShape: [2], outputShape: [3], explanation: 'Second' }] },
    { ...base, kind: 'sequence-stepper', steps: [{ label: 'One', input: '1', state: '1', output: '1', explanation: 'First' }, { label: 'Two', input: '2', state: '2', output: '2', explanation: 'Second' }] },
    { ...base, kind: 'matrix-explorer', matrix: [[0, 1], [1, 0]], operation: 'attention' },
    { ...base, kind: 'decision-canvas', prompt: 'Choose', options: [{ id: 'a', label: 'A', feedback: 'Selected A' }] },
    { ...base, kind: 'distribution-explorer', model: 'bernoulli', observations: [1, 0], controls: [{ id: 'probability', label: 'Probability', min: 0, max: 1, step: 0.1, initial: 0.5 }] },
  ];
  const user = userEvent.setup();
  for (const spec of specs) {
    render(<InteractionRenderer spec={spec} />);
    await screen.findByRole('table', { name: /studio/i });
    const status = screen.getByRole('status');
    const before = status.textContent;
    if (spec.kind === 'shape-path' || spec.kind === 'sequence-stepper') { screen.getByRole('button', { name: /next/i }).focus(); await user.keyboard('{Enter}'); }
    else if (spec.kind === 'decision-canvas') { screen.getByRole('button', { name: 'A' }).focus(); await user.keyboard('{Enter}'); }
    else fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: spec.kind === 'matrix-explorer' ? '2' : '0.8' } });
    expect(status.textContent).not.toBe(before);
    cleanup();
  }
});
