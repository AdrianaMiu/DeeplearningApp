import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QuestionResponse } from '../../src/components/QuestionResponse';
import { questions } from '../../src/content/questions';
import { AppShell } from '../../src/App';
import { createLearningDatabase } from '../../src/data/db';
import { LearningRepository } from '../../src/data/repository';

afterEach(cleanup);

function NavigationControls() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/practice?mode=quick&entry=broadcasting')}>Open broadcasting</button><button onClick={() => navigate('/practice?mode=diagnostic')}>Open diagnostic</button><button onClick={() => navigate(-1)}>Go back</button><button onClick={() => navigate(1)}>Go forward</button></>;
}

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

  it('starts a fresh session when navigating between query entries and re-entering the diagnostic', async () => {
    const db = createLearningDatabase(`query-navigation-${crypto.randomUUID()}`);
    const repository = new LearningRepository(db);
    const user = userEvent.setup();
    const view = render(<MemoryRouter initialEntries={['/practice?mode=quick&entry=tensor-shapes']}><NavigationControls /><AppShell repository={repository} /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /show hint 1/i }));
    await user.type(screen.getByLabelText(/your answer/i), '3');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    await screen.findByRole('button', { name: /next question/i });
    await user.click(screen.getByRole('button', { name: /next question/i }));
    expect(screen.getByText(/Question 2\/3/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/your answer/i), 'old answer');
    await user.click(screen.getByRole('button', { name: /open broadcasting/i }));
    expect(screen.getByText(/Question 1\/3/)).toBeInTheDocument();
    expect(screen.getByLabelText(/your answer/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /show hint 1/i })).toBeEnabled();
    await user.type(screen.getByLabelText(/your answer/i), '4,3,6');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    await screen.findByRole('button', { name: /next question/i });
    await user.click(screen.getByRole('button', { name: /go back/i }));
    expect(screen.getByText(/Question 1\/3/)).toBeInTheDocument();
    expect(screen.getByLabelText(/your answer/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /check answer/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /open diagnostic/i }));
    await user.click(screen.getByRole('button', { name: /skip diagnostic/i }));
    await user.click(screen.getByRole('button', { name: /go back/i }));
    await user.click(screen.getByRole('button', { name: /go forward/i }));
    expect(screen.getByText(/optional diagnostic · 1\/8/i)).toBeInTheDocument();
    expect((await repository.getSettings()).diagnosticSkipped).toBe(true);
    expect(await repository.getAttempts()).toHaveLength(2);
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
