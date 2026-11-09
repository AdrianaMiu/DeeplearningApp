import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../src/App';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

describe('curriculum essential paths', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;
  beforeEach(() => { db = createLearningDatabase(`essential-path-${crypto.randomUUID()}`); repository = new LearningRepository(db); });
  afterEach(async () => { cleanup(); db.close(); await db.delete(); });

  it.each([
    [18, 'Gaussian Processes', 19, 18],
    [19, 'Hyperparameter Optimization', 28, 7],
    [20, 'Generative Adversarial Networks', 14, 3],
  ])('separates chapter %s essential breadth from detailed depth on the card and in details', async (chapter, title, sections, exercises) => {
    render(<MemoryRouter initialEntries={[`/curriculum/chapter-${chapter}`]}><AppShell repository={repository} /></MemoryRouter>);
    const atlas = await screen.findByRole('region', { name: /book atlas/i });
    const card = within(atlas).getByRole('heading', { name: `Chapter ${chapter}: ${title}` }).closest('article')!;
    const detail = within(atlas).getByRole('region', { name: title });
    for (const view of [card, detail]) {
      expect(within(view).getByText('3 essential lessons available')).toBeInTheDocument();
      expect(within(view).getByText('Essential path complete')).toBeInTheDocument();
      expect(within(view).getByText(new RegExp(`0 of ${sections} detailed sections authored`))).toBeInTheDocument();
      expect(within(view).getByText(new RegExp(`0 of ${exercises} exercise activities authored`))).toBeInTheDocument();
      expect(within(view).getAllByText('Depth expansion planned').length).toBeGreaterThan(0);
    }
    expect(within(card).getByText(/1 studios · 2 deep lessons/)).toBeInTheDocument();
    expect(within(detail).getByText(/essential paths provide breadth/i)).toBeInTheDocument();
    const sourceLink = within(detail).getByRole('link', { name: new RegExp(`^Section ${chapter}\\.1 `) });
    expect(within(sourceLink.closest('li')!).getByText('Depth expansion planned')).toBeInTheDocument();
    expect(screen.getByText('609').parentElement).toHaveTextContent('609exercise references');
  });

  it('keeps chapters with a single studio planned while preserving authored depth', async () => {
    render(<MemoryRouter initialEntries={['/curriculum/chapter-1']}><AppShell repository={repository} /></MemoryRouter>);
    const atlas = await screen.findByRole('region', { name: /book atlas/i });
    const detail = within(atlas).getByRole('region', { name: 'Introduction' });
    expect(within(detail).getByText('1 essential lesson available')).toBeInTheDocument();
    expect(within(detail).getByText('Essential path planned')).toBeInTheDocument();
    expect(within(detail).getByText(/15 of 17 detailed sections authored · 4 of 4 exercise activities authored/)).toBeInTheDocument();
    const summaryLink = within(detail).getByRole('link', { name: 'Section 1.8 Summary' });
    expect(within(summaryLink.closest('li')!).queryByText('Depth expansion planned')).not.toBeInTheDocument();
  });
});
