import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppProvider, useAppData } from '../../src/app/context';
import { Layout } from '../../src/components/Layout';
import { sectionGuideByRoute } from '../../src/content/section-guides';
import { createLearningDatabase, type LearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

const destinations = [
  ['/', 'Today', /choose.*next/i],
  ['/curriculum', 'Curriculum', /explore the book/i],
  ['/practice', 'Practice', /answer.*questions/i],
  ['/review', 'Review', /revisit.*learned/i],
  ['/lab', 'Lab', /experiment.*math/i],
  ['/progress', 'Progress', /inspect.*evidence/i],
  ['/notes', 'Notes', /save.*explanations/i],
  ['/settings', 'Settings', /preferences.*backups/i],
] as const;

const navigationNames = {
  Today: 'Today Choose your next step',
  Curriculum: 'Curriculum Explore the book',
  Practice: 'Practice Answer questions',
  Review: 'Review Revisit what you learned',
  Lab: 'Lab Experiment with math',
  Progress: 'Progress Inspect your evidence',
  Notes: 'Notes Save your explanations',
  Settings: 'Settings Preferences and backups',
} as const;

function PageContent() {
  const { loading } = useAppData();
  return <><p>{loading ? 'Loading learner settings' : 'Learner settings ready'}</p><button>Page action</button></>;
}

describe('navigation guidance', () => {
  let db: LearningDatabase;
  let repository: LearningRepository;

  beforeEach(() => {
    db = createLearningDatabase(`navigation-${crypto.randomUUID()}`);
    repository = new LearningRepository(db);
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {},
    }));
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    db.close();
    await db.delete();
  });

  async function renderAt(path: string) {
    const view = render(<MemoryRouter initialEntries={[path]}><AppProvider repository={repository}>
      <Layout><Routes><Route path="*" element={<PageContent />} /></Routes></Layout>
    </AppProvider></MemoryRouter>);
    await screen.findByText('Learner settings ready');
    return view;
  }

  it('explains every primary destination', async () => {
    const user = userEvent.setup();
    await repository.saveSettings({ ...(await repository.getSettings()), language: 'ro-help' });
    await renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(Object.keys(sectionGuideByRoute))
      .toEqual(['/', '/curriculum', '/practice', '/review', '/lab', '/progress', '/notes', '/settings']);
    // All eight guide routes must reach the navigation consumer.
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href')))
      .toEqual(['/', '/curriculum', '/practice', '/review', '/lab', '/progress', '/notes', '/settings']);

    for (const [, label, description] of destinations) {
      const link = within(nav).getByRole('link', { name: navigationNames[label] });
      expect(within(link).getByText(description)).toBeInTheDocument();
      await user.click(link);
      expect(link).toHaveAttribute('aria-current', 'page');
      const guide = screen.getByRole('region', { name: `${label} guide` });
      expect(within(guide).getByText('Next action')).toBeInTheDocument();
      expect(within(guide).getByText('Saved evidence')).toBeInTheDocument();
      await waitFor(() => expect(guide.querySelector('[lang="ro"]')).toBeInTheDocument());
    }
  });

  it('includes both visible navigation lines in every accessible link name', async () => {
    await renderAt('/');
    const links = within(screen.getByRole('navigation', { name: 'Primary' })).getAllByRole('link');
    for (const [path, label] of destinations) {
      const link = links.find((candidate) => candidate.getAttribute('href') === path);
      expect(link).toHaveAccessibleName(navigationNames[label]);
    }
  });

  it('keeps Romanian help optional and maps lesson guidance to the book', async () => {
    await renderAt('/lesson/tensor-shapes');
    const guide = screen.getByRole('region', { name: 'Curriculum guide' });
    expect(guide.querySelector('[lang="ro"]')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: navigationNames.Curriculum })).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['/practice/', 'Practice'],
    ['/Practice', 'Practice'],
    ['/Lesson/tensor-shapes', 'Curriculum'],
    ['/Curriculum/', 'Curriculum'],
  ] as const)('matches route guidance and current navigation for %s', async (path, section) => {
    await renderAt(path);
    expect(screen.getByRole('region', { name: `${section} guide` })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: navigationNames[section] })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: navigationNames.Today })).not.toHaveAttribute('aria-current');
  });

  it('operates the mobile drawer accessibly', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {},
    }));
    const user = userEvent.setup();
    const view = await renderAt('/');
    const menu = screen.getByRole('button', { name: 'Menu' });
    const main = screen.getByRole('main');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: navigationNames.Today })).not.toBeInTheDocument();

    document.body.style.overflow = 'auto';
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    const drawer = screen.getByRole('dialog', { name: 'Sections' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(main).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');
    const close = within(drawer).getByRole('button', { name: 'Close navigation' });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(drawer).getByRole('link', { name: navigationNames.Settings })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
    expect(main).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('auto');

    await user.click(menu);
    await user.click(screen.getByRole('link', { name: navigationNames.Practice }));
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Practice guide' })).toBeInTheDocument();

    await user.click(menu);
    await user.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(menu).toHaveFocus();
    expect(menu).toHaveAttribute('aria-expanded', 'false');

    await user.click(menu);
    view.unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('keeps the desktop sidebar and background available', async () => {
    const user = userEvent.setup();
    await renderAt('/');
    await user.click(screen.getByRole('link', { name: navigationNames.Lab }));
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
