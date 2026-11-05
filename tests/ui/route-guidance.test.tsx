import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('secondary route guidance', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;
  beforeEach(() => { db = createLearningDatabase(`guidance-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
  afterEach(async () => { db.close(); await db.delete(); });
  function open(path: string) { return render(<MemoryRouter initialEntries={[path]}><AppShell repository={repository} /></MemoryRouter>); }

  it('guides empty review and notes toward a useful next action', async () => {
    const review = open('/review');
    expect(await screen.findByText('Nothing due right now')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open practice' })).toHaveAttribute('href', '/practice');
    expect(screen.getByText(/practice answers create a review schedule/i)).toBeInTheDocument();
    review.unmount();
    open('/notes');
    expect(await screen.findByText(/your first teach-back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();
    expect(screen.getByText(/add a title and note body/i)).toBeInTheDocument();
  });

  it('includes concepts from chapter studios and explains evidence next to each state', async () => {
    open('/progress');
    expect(await screen.findByText(/no concepts have attempts yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'reproducibility' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText(/show all concepts/i));
    const concept = await screen.findByRole('heading', { name: 'reproducibility' });
    const row = concept.closest('article')!;
    expect(within(row).getByText(/0 independent evidence items/i)).toBeInTheDocument();
    expect(within(row).getByText(/not started/i)).toBeInTheDocument();
    expect(within(row).getByText(/distinct unassisted correct answers/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try practice' })).toHaveAttribute('href', '/practice');
  });
  it('shows only currently due concepts from review history', async () => {
    await db.reviews.bulkPut([
      { id: 'old', conceptId: 'tensor-shape', attemptId: 'a', timestamp: '2020-01-01T00:00:00Z', intervalIndex: 0, dueAt: '2020-01-02T00:00:00Z' },
      { id: 'new', conceptId: 'tensor-shape', attemptId: 'b', timestamp: '2021-01-01T00:00:00Z', intervalIndex: 1, dueAt: '2099-01-01T00:00:00Z' },
      { id: 'due', conceptId: 'residual-network', attemptId: 'c', timestamp: '2020-01-01T00:00:00Z', intervalIndex: 0, dueAt: '2020-01-02T00:00:00Z' },
    ]);
    open('/review');
    expect(await screen.findByText('1 review due')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /practice residual network/i })).toHaveAttribute('href', '/practice?mode=quick&entry=modern-cnn-studio&question=studio-8-q1');
    expect(screen.queryByText(/tensor shape/i)).not.toBeInTheDocument();
  });

  it('shows attempted concepts by default, including assisted attempts', async () => {
    await db.attempts.put({ id: 'assisted', questionId: 'q', questionVersion: 1, conceptIds: ['residual-network'], response: 'answer', timestamp: '2024-01-01T00:00:00Z', score: 1, gradingMethod: 'deterministic', confidence: 3, hintsUsed: 1, solutionRevealed: false, tutorSupportLevel: 'hint', applicationEvidence: false });
    open('/progress');
    const heading = await screen.findByRole('heading', { name: 'residual network' });
    expect(within(heading.closest('article')!).getByText('0 independent evidence items')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'reproducibility' })).not.toBeInTheDocument();
  });

});
