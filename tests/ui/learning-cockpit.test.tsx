import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

let db: LearningDatabase;
let repository: LearningRepository;
beforeEach(() => { db = createLearningDatabase(`cockpit-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
afterEach(async () => { cleanup(); db.close(); await db.delete(); });
function renderAt(path: string) { return render(<MemoryRouter initialEntries={[path]}><AppShell repository={repository} /></MemoryRouter>); }

describe('learning cockpit', () => {
  it('answers the three cockpit questions and describes a legacy resume stage', async () => {
    await repository.saveSession({ id: 's', lessonId: 'tensor-shapes', goal: 'Understand axes', startedAt: '2026-01-01', updatedAt: '2026-01-01', resumeStep: 'prediction' });
    renderAt('/');
    expect(await screen.findByText(/what am i learning/i)).toBeInTheDocument();
    expect(screen.getByText(/what should i do now/i)).toBeInTheDocument();
    expect(screen.getByText(/what evidence do i have/i)).toBeInTheDocument();
    expect(screen.getByText(/because you paused/i)).toBeInTheDocument();
    expect(screen.getByText(/predict \(previously saved as prediction\)/i)).toBeInTheDocument();
  });
  it('browses all chapters by milestone', async () => {
    renderAt('/curriculum');
    const atlas = await screen.findByRole('region', { name: /book atlas/i });
    for (const name of ['Foundations', 'Train and evaluate models', 'Visual representations', 'Sequences and attention', 'Optimization, performance, and applications', 'Broader methods and consolidation']) expect(within(atlas).getByRole('heading', { name })).toBeInTheDocument();
    expect(within(atlas).getAllByTestId('chapter-row')).toHaveLength(22);
    expect(within(atlas).getByRole('link', { name: 'Start studio: Convolutional Neural Networks' })).toHaveAttribute('href', '/lesson/cnn-studio');
  });
  it('recommends due review and filters to the affected chapter', async () => {
    await repository.appendReview({ id: 'r', conceptId: 'tensor-shape', attemptId: 'a', timestamp: '2026-01-01', intervalIndex: 0, dueAt: '2026-01-02' });
    const user = userEvent.setup();
    const view = renderAt('/');
    expect(await screen.findByText(/because you have review due/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open review' })[0]).toHaveAttribute('href', '/review');
    view.unmount();
    renderAt('/curriculum');
    await screen.findByRole('region', { name: /book atlas/i });
    // Wait for the repository snapshot before filtering.
    await screen.findByText(/20 chapters/i);
    await user.selectOptions(screen.getByLabelText(/filter chapters/i), 'review');
    expect(await screen.findByRole('heading', { name: /chapter 2: preliminaries/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /chapter 7: convolutional/i })).not.toBeInTheDocument();
  });
  it('explains indexed-only content and filters the atlas', async () => {
    const user = userEvent.setup();
    renderAt('/curriculum/chapter-7');
    expect(await screen.findByText(/indexed only — source mapped, learning activity not authored yet/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /source sections/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/search chapters/i), 'convolutional');
    expect(screen.getAllByTestId('chapter-row').length).toBeGreaterThan(0);
    await user.selectOptions(screen.getByLabelText(/filter chapters/i), 'review');
    expect(screen.getByText(/no chapters match/i)).toBeInTheDocument();
  });
});
