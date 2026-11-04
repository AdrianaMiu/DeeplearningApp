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
  it('ignores superseded due reviews in both the cockpit and atlas', async () => {
    await repository.appendReview({ id: 'old', conceptId: 'tensor-shape', attemptId: 'a', timestamp: '2025-01-01', intervalIndex: 0, dueAt: '2025-01-02' });
    await repository.appendReview({ id: 'new', conceptId: 'tensor-shape', attemptId: 'b', timestamp: '2025-02-01', intervalIndex: 1, dueAt: '2999-01-01' });
    const user = userEvent.setup();
    const view = renderAt('/');
    expect(await screen.findByText('0 reviews due')).toBeInTheDocument();
    view.unmount();
    renderAt('/curriculum');
    await screen.findByRole('region', { name: /book atlas/i });
    await user.selectOptions(screen.getByLabelText(/filter chapters/i), 'review');
    expect(await screen.findByText(/no chapters match/i)).toBeInTheDocument();
  });
  it('shows the rescheduled review count on the Review page', async () => {
    await repository.appendReview({ id: 'old', conceptId: 'tensor-shape', attemptId: 'a', timestamp: '2025-01-01', intervalIndex: 0, dueAt: '2025-01-02' });
    await repository.appendReview({ id: 'new', conceptId: 'tensor-shape', attemptId: 'b', timestamp: '2025-02-01', intervalIndex: 1, dueAt: '2999-01-01' });
    renderAt('/review');
    expect(await screen.findByRole('heading', { name: 'Nothing due right now' })).toBeInTheDocument();
  });
  it('resumes the latest valid unfinished activity despite a newer stale session', async () => {
    await repository.saveSession({ id: 'valid', lessonId: 'broadcasting', goal: 'Broadcast shapes', startedAt: '2026-01-01', updatedAt: '2026-01-01', resumeStep: 'prediction' });
    await repository.saveSession({ id: 'stale', lessonId: 'missing', goal: 'Stale activity', startedAt: '2026-01-02', updatedAt: '2026-01-02', resumeStep: 'prediction' });
    renderAt('/');
    expect(await screen.findByText(/because you paused/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resume Broadcast without guessing' })).toHaveAttribute('href', '/lesson/broadcasting');
  });
  it('uses independent success and failed attempts to choose a next activity', async () => {
    const base = { questionVersion: 1, response: 'answer', timestamp: '2026-01-01', score: 1, gradingMethod: 'deterministic' as const, confidence: 4 as const, hintsUsed: 0, solutionRevealed: false, tutorSupportLevel: 'none' as const, applicationEvidence: false };
    await repository.appendAttempt({ ...base, id: 'success', questionId: 'q01', conceptIds: ['tensor-shape'] });
    const view = renderAt('/');
    expect(await screen.findByText(/next activity without a recent independent success/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Broadcast without guessing' })).toBeInTheDocument();
    view.unmount();
    await repository.appendAttempt({ ...base, id: 'failed', questionId: 'q04', conceptIds: ['broadcasting'], score: 0, timestamp: '2026-01-02' });
    renderAt('/');
    expect(await screen.findByText(/because your latest attempt.*needs another look/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Broadcast without guessing' })).toBeInTheDocument();
  });
  it('searches chapter fallback descriptions and activity titles', async () => {
    const user = userEvent.setup();
    renderAt('/curriculum');
    const input = await screen.findByLabelText(/search chapters/i);
    await user.type(input, 'tensor shape let you predict');
    expect(screen.getByRole('heading', { name: /chapter 2: preliminaries/i })).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'training loop');
    expect(screen.getByRole('heading', { name: /chapter 3: linear neural/i })).toBeInTheDocument();
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
