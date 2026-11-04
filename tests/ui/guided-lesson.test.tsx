import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('guided lesson', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;
  beforeEach(() => { db = createLearningDatabase(`journey-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
  afterEach(async () => { db.close(); await db.delete(); });
  function open(path = '/lesson/cnn-studio') { return render(<MemoryRouter initialEntries={[path]}><AppShell repository={repository} /></MemoryRouter>); }

  it('moves through the six guided stages', async () => {
    const user = userEvent.setup(); open();
    expect(await screen.findByRole('heading', { name: /trace convolution shapes/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(orient|predict|understand|try|check|reflect)$/i }).map((node) => node.textContent?.toLowerCase())).toEqual(['orient', 'predict', 'understand', 'try', 'check', 'reflect']);
    await user.click(screen.getByRole('button', { name: /^predict$/i }));
    await user.type(screen.getByLabelText(/your prediction/i), 'A prediction');
    await user.click(screen.getByRole('button', { name: /reveal worked example/i }));
    const tab = screen.getByRole('tab', { name: /intuition/i }); tab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /math/i })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: /^check$/i }));
    expect(screen.getByRole('link', { name: /chapter check/i })).toHaveAttribute('href', '/practice?mode=chapter&entry=cnn-studio');
  });
  it('keeps worked content behind a prediction', async () => {
    const user = userEvent.setup(); open('/lesson/tensor-shapes');
    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    expect(screen.getByRole('button', { name: /reveal worked example/i })).toBeDisabled();
    expect(screen.queryByText(/selecting row 0 returns/i)).not.toBeInTheDocument();
  });
  it('resumes legacy and current sessions', async () => {
    await repository.saveSession({ id: 'legacy', lessonId: 'tensor-shapes', goal: 'Legacy', startedAt: '2026-01-01', updatedAt: '2026-01-01', resumeStep: 'prediction' });
    const view = open('/lesson/tensor-shapes');
    expect(await screen.findByLabelText(/your prediction/i)).toBeInTheDocument();
    const user = userEvent.setup(); await user.type(screen.getByLabelText(/your prediction/i), 'Saved reasoning');
    await user.click(screen.getByRole('button', { name: /reveal worked example/i }));
    await user.click(screen.getByRole('button', { name: /^reflect$/i }));
    await user.type(screen.getByLabelText(/your reflection/i), 'Saved reflection');
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    await waitFor(async () => expect((await repository.getSessions()).at(-1)?.resumeStep).toBe('reflect'));
    view.unmount(); open('/lesson/tensor-shapes');
    expect(await screen.findByDisplayValue('Saved reflection')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^predict$/i }));
    expect(screen.getByDisplayValue('Saved reasoning')).toBeInTheDocument();
  });
});
