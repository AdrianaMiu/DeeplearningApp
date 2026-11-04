import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

function Navigation() { const navigate = useNavigate(); return <><button onClick={() => navigate('/')}>Leave lesson</button><button onClick={() => navigate('/lesson/tensor-shapes')}>Return to lesson</button></>; }

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
  it('loads the saved session on a route roundtrip even while snapshot refresh is delayed', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/lesson/tensor-shapes']}><Navigation /><AppShell repository={repository} /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    await user.type(screen.getByLabelText(/your prediction/i), 'New reasoning');
    const originalSnapshot = repository.snapshot.bind(repository);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const refreshSnapshot = vi.spyOn(repository, 'snapshot').mockImplementation(async () => { await pending; return originalSnapshot(); });
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    await screen.findByText(/saved locally/i);
    await waitFor(() => expect(refreshSnapshot).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Leave lesson' }));
    await user.click(screen.getByRole('button', { name: 'Return to lesson' }));
    expect(await screen.findByDisplayValue('New reasoning')).toBeInTheDocument();
    release();
  });

  it('waits for session hydration before allowing edits', async () => {
    const originalGetSessions = repository.getSessions.bind(repository);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    let calls = 0;
    vi.spyOn(repository, 'getSessions').mockImplementation(async () => { if (++calls > 1) await pending; return originalGetSessions(); });
    const user = userEvent.setup(); open('/lesson/tensor-shapes');
    await waitFor(() => expect(calls).toBeGreaterThan(1));
    expect(screen.getByText(/loading your saved place/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/your prediction/i)).not.toBeInTheDocument();
    release();
    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    await user.type(screen.getByLabelText(/your prediction/i), 'Edited after loading');
    expect(screen.getByDisplayValue('Edited after loading')).toBeInTheDocument();
  });

  it('saves one session at a time and clears stale status after edits or errors', async () => {
    const user = userEvent.setup(); open('/lesson/tensor-shapes');
    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    await user.type(screen.getByLabelText(/your prediction/i), 'First');
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    await screen.findByText(/saved locally/i);
    await user.type(screen.getByLabelText(/your prediction/i), ' edit');
    expect(screen.queryByText(/saved locally/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    await screen.findByText(/saved locally/i);
    expect(await repository.getSessions()).toHaveLength(1);
    vi.spyOn(repository, 'saveSession').mockRejectedValueOnce(new Error('disk error'));
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
    expect(screen.queryByText(/saved locally/i)).not.toBeInTheDocument();
  });

  it('keeps edits made during an in-flight save dirty and prevents overlapping saves', async () => {
    const user = userEvent.setup(); open('/lesson/tensor-shapes');
    await user.click(await screen.findByRole('button', { name: /^predict$/i }));
    await user.type(screen.getByLabelText(/your prediction/i), 'First');
    const originalSave = repository.saveSession.bind(repository);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const save = vi.spyOn(repository, 'saveSession').mockImplementation(async (value) => { await pending; return originalSave(value); });
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/your prediction/i), ' updated');
    release();
    await waitFor(() => expect(screen.getByRole('button', { name: /pause and save place/i })).toBeEnabled());
    expect(screen.queryByText(/saved locally/i)).not.toBeInTheDocument();
    expect(save).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /pause and save place/i }));
    await screen.findByText(/saved locally/i);
    expect(await repository.getSessions()).toHaveLength(1);
    expect((await repository.getSessions())[0].prediction).toBe('First updated');
  });

});
