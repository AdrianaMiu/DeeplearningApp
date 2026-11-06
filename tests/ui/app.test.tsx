import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('Deep Learning Companion interface', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;

  beforeEach(() => {
    db = createLearningDatabase(`ui-test-${crypto.randomUUID()}`);
    repository = new LearningRepository(db);
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <AppShell repository={repository} />
      </MemoryRouter>,
    );
  }

  it('navigates the complete application landmark structure', async () => {
    const user = userEvent.setup();
    renderAt('/');

    expect(await screen.findByRole('heading', { name: /your next clear step/i }, { timeout: 3_000 })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /curriculum/i }));
    expect(await screen.findByRole('heading', { name: /the complete map/i })).toBeInTheDocument();
    expect(screen.getByText(/20 chapters/i)).toBeInTheDocument();
  });

  it('allows a diagnostic skip and an inspectable recommendation override', async () => {
    const user = userEvent.setup();
    renderAt('/practice');

    await user.click(await screen.findByRole('button', { name: /skip diagnostic/i }));
    expect(await screen.findByText(/recommendation: read tensors by shape/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/choose a different starting lesson/i), 'broadcasting');
    expect(screen.getByText(/recommendation: broadcast without guessing/i)).toBeInTheDocument();
    await waitFor(async () => expect((await repository.getSettings()).diagnosticSkipped).toBe(true));
  });

  it('records diagnostic evidence before advancing', async () => {
    const user = userEvent.setup();
    renderAt('/practice');
    await user.type(await screen.findByLabelText(/your answer/i), '5, 3');
    await user.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(await screen.findByText(/optional diagnostic · 2\/8/i)).toBeInTheDocument();
    await waitFor(async () => expect(await repository.getAttempts()).toHaveLength(1));
    expect((await repository.getAttempts())[0]).toMatchObject({ questionId: 'd01', score: 1 });
  });

  it('requires a prediction before revealing a worked example', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/tensor-shapes');

    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    const reveal = screen.getByRole('button', { name: /reveal worked example/i });
    expect(reveal).toBeDisabled();
    await user.type(screen.getByLabelText(/your prediction/i), 'The remaining shape is (3).');
    await user.click(reveal);
    expect(screen.getByText(/selecting row 0 returns/i)).toBeInTheDocument();
  });

  it('records hints as assistance and preserves a paused session for resume', async () => {
    const user = userEvent.setup();
    await repository.saveSettings({
      ...(await repository.getSettings()),
      diagnosticSkipped: true,
      updatedAt: new Date().toISOString(),
    });
    renderAt('/practice');

    await user.click(await screen.findByRole('button', { name: /show hint 1/i }));
    await user.type(screen.getByLabelText(/your answer/i), '3');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    await waitFor(async () => expect(await repository.getAttempts()).toHaveLength(1));
    expect((await repository.getAttempts())[0]).toMatchObject({ hintsUsed: 1, tutorSupportLevel: 'hint' });

    renderAt('/lesson/tensor-shapes');
    await user.click(await screen.findByRole('button', { name: /pause and save place/i }));
    await waitFor(async () => expect(await repository.getSessions()).toHaveLength(1));
    expect((await repository.getSessions())[0].resumeStep).toBe('orient');
  });

  it('schedules review evidence and advances through lesson questions', async () => {
    const user = userEvent.setup();
    await repository.saveSettings({
      ...(await repository.getSettings()), diagnosticSkipped: true, updatedAt: new Date().toISOString(),
    });
    renderAt('/practice');
    await screen.findByRole('button', { name: /show hint 1/i });
    await user.type(screen.getByLabelText(/your answer/i), '3');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    await waitFor(async () => expect(await repository.getReviews()).toHaveLength(2));
    await user.click(screen.getByRole('button', { name: /next question/i }));
    expect(screen.getByRole('heading', { name: /arange\(6\)/i })).toBeInTheDocument();
  });

  it('creates a local note and previews a valid progress import before applying it', async () => {
    const user = userEvent.setup();
    const notesView = renderAt('/notes');
    await user.type(await screen.findByLabelText(/note title/i), 'Axis reminder');
    await user.type(screen.getByLabelText(/note body/i), 'Broadcasting aligns from the right.');
    await user.click(screen.getByRole('button', { name: /save note/i }));
    expect(await screen.findByText('Axis reminder')).toBeInTheDocument();
    notesView.unmount();

    renderAt('/settings');
    const file = new File([JSON.stringify({
      schemaVersion: 1,
      contentVersion: 'd2l-2026.11-v1',
      exportedAt: '2026-11-03T12:00:00.000Z',
      attempts: [], reviews: [], sessions: [], notes: [],
      settings: {
        ...(await repository.getSettings()),
        updatedAt: '2026-11-03T12:00:00.000Z',
      },
    })], 'progress.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText(/choose progress file/i), file);
    expect(await screen.findByText(/valid backup.*0 attempts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /merge backup/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /replace local data/i })).toBeEnabled();
  });

  it('provides keyboard controls and text tables for every visual lab', async () => {
    renderAt('/lab');

    expect(await screen.findByRole('heading', { name: /mathematical workbench/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /broadcasting axis compatibility/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /gradient numeric comparison/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /regression residuals/i })).toBeInTheDocument();
    expect(screen.getAllByRole('slider').length).toBeGreaterThanOrEqual(3);
    expect(document.querySelectorAll('math').length).toBeGreaterThanOrEqual(2);
  });

  it('requires confirmation before destructive local reset', async () => {
    const user = userEvent.setup();
    await repository.appendAttempt({
      id: 'protected-attempt', questionId: 'q01', questionVersion: 1,
      conceptIds: ['tensor-shape'], response: '3', timestamp: new Date().toISOString(),
      score: 1, gradingMethod: 'deterministic', confidence: 4, hintsUsed: 0,
      solutionRevealed: false, tutorSupportLevel: 'none', applicationEvidence: false,
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt('/settings');
    await user.click(await screen.findByRole('button', { name: /reset local progress/i }));
    expect(confirm).toHaveBeenCalledOnce();
    await expect(repository.getAttempts()).resolves.toHaveLength(1);
    confirm.mockRestore();
  });
});
