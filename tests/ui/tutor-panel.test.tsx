import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TutorPanel } from '../../src/tutor/TutorPanel';

describe('TutorPanel', () => {
  it('discloses Gemini privacy terms before first use and keeps failure non-blocking', async () => {
    const user = userEvent.setup();
    const requestTutor = vi.fn().mockRejectedValue(new Error('Tutor is temporarily unavailable.'));
    render(<TutorPanel lessonId="tensor-shapes" conceptIds={['tensor-shape']} learnerAttempt="My shape is 3" requestTutor={requestTutor} />);

    expect(screen.getByText(/free-tier prompts may be used/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ask for a hint/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /i understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to tutor/i }));
    await user.type(screen.getByLabelText(/question for the tutor/i), 'What axis remains?');
    await user.click(screen.getByRole('button', { name: /ask for a hint/i }));
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/continue the lesson without ai/i)).toBeInTheDocument();
  });
});
