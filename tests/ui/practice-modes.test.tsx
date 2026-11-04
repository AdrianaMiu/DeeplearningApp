import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuestionResponse } from '../../src/components/QuestionResponse';
import { questions } from '../../src/content/questions';
import { AppShell } from '../../src/App';
import { createLearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

afterEach(cleanup);

describe('practice modes', () => {
  it('renders a response control for each question type', () => {
    const base = questions[0];
    const renderType = (type: typeof base.type) => render(<QuestionResponse question={{ ...base, type, options: ['Yes', 'No'], rubric: ['Explain your reasoning'] }} value="" onChange={() => {}} />);
    for (const type of ['multiple_choice', 'numeric', 'shape', 'code_trace', 'debugging', 'explanation', 'transfer'] as const) {
      const view = renderType(type);
      if (type === 'multiple_choice') expect(screen.getAllByRole('radio')).toHaveLength(2);
      else if (type === 'numeric') expect(screen.getByRole('spinbutton', { name: /your answer/i })).toBeInTheDocument();
      else expect(screen.getByRole('textbox', { name: /your answer/i })).toBeInTheDocument();
      if (type === 'explanation' || type === 'transfer') expect(screen.getByText('Explain your reasoning')).toBeInTheDocument();
      view.unmount();
    }
  });

  it('uses quick and diagnostic modes and safely falls back for an invalid entry', async () => {
    const db = createLearningDatabase(`modes-${crypto.randomUUID()}`);
    const repository = new LearningRepository(db);
    const show = (path: string) => render(<MemoryRouter initialEntries={[path]}><AppShell repository={repository} /></MemoryRouter>);
    let view = show('/practice?mode=quick&entry=broadcasting');
    expect(await screen.findByRole('heading', { name: /quick practice/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /adding \(4,1,6\)/i })).toBeInTheDocument();
    view.unmount();
    view = show('/practice?mode=diagnostic');
    expect(await screen.findByRole('heading', { name: /best starting point/i })).toBeInTheDocument();
    view.unmount();
    view = show('/practice?mode=chapter&entry=missing');
    expect(await screen.findByRole('heading', { name: /best starting point/i })).toBeInTheDocument();
    view.unmount(); db.close(); await db.delete();
  });

  it('completes a four-item chapter check', async () => {
    const db = createLearningDatabase(`practice-${crypto.randomUUID()}`);
    const repository = new LearningRepository(db);
    const user = userEvent.setup();
    const view = render(<MemoryRouter initialEntries={['/practice?mode=chapter&entry=optimization-studio']}><AppShell repository={repository} /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /chapter check/i })).toBeInTheDocument();
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(new RegExp(`Question ${i}/4`))).toBeInTheDocument();
      const radio = screen.queryAllByRole('radio')[0];
      if (radio) await user.click(radio);
      else await user.type(screen.getByLabelText(/your answer/i), '1');
      await user.click(screen.getByRole('button', { name: /check answer/i }));
      await screen.findByRole('status');
      if (i < 4) await user.click(screen.getByRole('button', { name: /next question/i }));
    }
    await waitFor(async () => expect(await repository.getAttempts()).toHaveLength(4));
    view.unmount(); db.close(); await db.delete();
  });
});
