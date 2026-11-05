import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('source section and exercise routes', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;
  beforeEach(() => { db = createLearningDatabase(`source-route-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
  afterEach(async () => { db.close(); await db.delete(); });
  const open = (path: string) => render(<MemoryRouter initialEntries={[path]}><AppShell repository={repository} /></MemoryRouter>);

  it('shows an honest unavailable state for an unconverted section', async () => {
    open('/section/4.1');
    expect(await screen.findByRole('heading', { name: /softmax regression/i })).toBeInTheDocument();
    expect(screen.getByText(/section activity is not authored yet/i)).toBeInTheDocument();
    expect(screen.getByText(/unconverted/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to chapter 4/i })).toHaveAttribute('href', '/curriculum/chapter-4');
  });

  it('tracks deferred and discussed exercise workflow without granting mastery', async () => {
    open('/exercise/4.1.5.exercise.1');
    expect(await screen.findByRole('heading', { name: /exercise 1/i })).toBeInTheDocument();
    expect(screen.getByText(/activity is not authored yet/i)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/exercise workflow state/i), 'discussed');
    await userEvent.type(screen.getByLabelText(/exercise note/i), 'Compared approaches without claiming completion.');
    await userEvent.click(screen.getByRole('button', { name: /save exercise state/i }));
    expect(await screen.findByText(/saved as discussed/i)).toBeInTheDocument();
    expect(await repository.getExerciseProgress()).toEqual([expect.objectContaining({
      id: '4.1.5.exercise.1', state: 'discussed', linkedAttemptIds: [],
    })]);
    expect(await repository.getAttempts()).toEqual([]);
  });

  it('preserves an evidence-backed completion when its note is edited', async () => {
    await repository.appendAttempt({ id: 'exercise-attempt', questionId: '1.9.exercise.1', questionVersion: 1,
      conceptIds: ['chapter-1'], response: 'Reasoned response', timestamp: '2026-11-05T09:00:00.000Z', score: 1,
      gradingMethod: 'rubric', confidence: 4, hintsUsed: 0, solutionRevealed: false,
      tutorSupportLevel: 'none', applicationEvidence: true });
    await repository.saveExerciseProgress({ id: '1.9.exercise.1', exerciseId: '1.9.exercise.1', state: 'completed',
      linkedAttemptIds: ['exercise-attempt'], attemptedAt: '2026-11-05T09:00:00.000Z',
      completedAt: '2026-11-05T09:05:00.000Z', updatedAt: '2026-11-05T09:05:00.000Z' });
    open('/exercise/1.9.exercise.1');
    expect(await screen.findByText(/evidence-backed state:/i)).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Evidence-backed state: completed')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/exercise note/i), 'Keep this completion.');
    await userEvent.click(screen.getByRole('button', { name: /save exercise state/i }));
    expect((await repository.getExerciseProgress())[0]).toMatchObject({ state: 'completed',
      linkedAttemptIds: ['exercise-attempt'], note: 'Keep this completion.' });
  });

  it('links every source record from the chapter atlas with accurate remaining counts', async () => {
    open('/curriculum/chapter-1');
    expect(await screen.findByText(/15 of 17 detailed sections authored/i)).toBeInTheDocument();
    expect(screen.getByText(/4 of 4 exercise activities authored/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /section 1\.1 a motivating example/i })).toHaveAttribute('href', '/section/1.1');
    expect(screen.getByRole('link', { name: /exercise 1\.9\.exercise\.1/i })).toHaveAttribute('href', '/exercise/1.9.exercise.1');
    expect(screen.queryByText(/referenced in activity/i)).not.toBeInTheDocument();
  });

  it('summarizes individual exercise states separately from concept evidence', async () => {
    await repository.saveExerciseProgress({ id: '1.9.exercise.1', exerciseId: '1.9.exercise.1', state: 'deferred',
      linkedAttemptIds: [], updatedAt: '2026-11-05T10:00:00.000Z' });
    open('/progress');
    expect(await screen.findByText(/609 indexed exercises/i)).toBeInTheDocument();
    expect(screen.getByText(/1 deferred/i)).toBeInTheDocument();
    expect(screen.getByText(/0 completed/i)).toBeInTheDocument();
  });
});
