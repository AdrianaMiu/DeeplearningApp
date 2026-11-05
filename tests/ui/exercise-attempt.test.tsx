import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('reviewed source exercise attempts', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;
  beforeEach(() => { db = createLearningDatabase(`exercise-attempt-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
  afterEach(async () => { db.close(); await db.delete(); });

  it('stores a response and evidence-backed workflow result without concept mastery evidence', async () => {
    render(<MemoryRouter initialEntries={['/exercise/1.9.exercise.1']}><AppShell repository={repository} /></MemoryRouter>);
    await userEvent.type(await screen.findByLabelText(/your response/i), 'I separated the fixed rule from the parameters learned from examples.');
    await userEvent.selectOptions(screen.getByLabelText(/rubric self-check/i), 'meets');
    await userEvent.click(screen.getByRole('button', { name: /save exercise attempt/i }));
    expect(await screen.findByText(/does not grant concept mastery/i)).toBeInTheDocument();
    expect(await repository.getAttempts()).toEqual([expect.objectContaining({
      questionId: '1.9.exercise.1', gradingMethod: 'rubric', conceptIds: [], applicationEvidence: false,
    })]);
    const [progress] = await repository.getExerciseProgress();
    expect(progress).toMatchObject({ exerciseId: '1.9.exercise.1', state: 'completed' });
    expect(progress.linkedAttemptIds).toHaveLength(1);
  });
});
