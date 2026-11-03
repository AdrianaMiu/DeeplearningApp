import { useEffect, useState } from 'react';

import { useAppData } from '../app/context';
import { diagnosticQuestions } from '../content/diagnostic';
import { lessons } from '../content/lessons';
import { questions } from '../content/questions';
import type { Question } from '../domain/types';

function normalized(value: string) { return value.toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim(); }
function score(question: Question, response: string) {
  const expected = Array.isArray(question.answer) ? question.answer.join(' ') : String(question.answer);
  return normalized(response).includes(normalized(expected)) || normalized(expected).includes(normalized(response)) ? 1 : 0;
}

export default function Practice() {
  const { repository, snapshot, refresh } = useAppData();
  const [skipped, setSkipped] = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [recommendation, setRecommendation] = useState('tensor-shapes');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState<string>();
  useEffect(() => { if (snapshot?.settings.diagnosticSkipped || snapshot?.settings.diagnosticCompleted) setSkipped(true); }, [snapshot]);

  async function skipDiagnostic() {
    const current = await repository.getSettings();
    await repository.saveSettings({ ...current, diagnosticSkipped: true, updatedAt: new Date().toISOString() });
    setSkipped(true); refresh();
  }

  async function answerDiagnostic() {
    if (diagnosticIndex < diagnosticQuestions.length - 1) { setDiagnosticIndex((value) => value + 1); setAnswer(''); return; }
    const current = await repository.getSettings();
    await repository.saveSettings({ ...current, diagnosticCompleted: true, updatedAt: new Date().toISOString() });
    setSkipped(true); refresh();
  }

  async function submitPractice() {
    const question = questions[0];
    const result = score(question, answer);
    await repository.appendAttempt({
      id: crypto.randomUUID(), questionId: question.id, questionVersion: question.version,
      conceptIds: question.conceptIds, response: answer, timestamp: new Date().toISOString(), score: result,
      gradingMethod: 'deterministic', confidence: 3, hintsUsed: hints, solutionRevealed: false,
      tutorSupportLevel: hints > 0 ? 'hint' : 'none', applicationEvidence: question.applicationEvidence,
    });
    setFeedback(result ? `Correct. ${question.explanation}` : `Not yet. ${question.explanation}`); refresh();
  }

  if (!skipped) {
    const question = diagnosticQuestions[diagnosticIndex];
    return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Optional diagnostic · {diagnosticIndex + 1}/8</p><h1>Find the best starting point</h1><p>Skip it at any time. Recommendations remain visible and overridable.</p></header>
      <section className="question-card"><h2>{question.prompt}</h2><label>Your answer<input value={answer} onChange={(event) => setAnswer(event.target.value)} /></label><div className="button-row"><button className="button button--primary" disabled={!answer.trim()} onClick={answerDiagnostic}>Save and continue</button><button className="button button--quiet" onClick={skipDiagnostic}>Skip diagnostic</button></div></section></div>;
  }

  const selected = lessons.find((lesson) => lesson.id === recommendation) ?? lessons[0];
  const question = questions[0];
  return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Practice desk</p><h1>One answer, with honest support</h1><p>Recommendation: {selected.title}. You remain in control.</p><label>Choose a different starting lesson<select value={recommendation} onChange={(event) => setRecommendation(event.target.value)}>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label></header>
    <section className="question-card"><p className="kicker">Shape reasoning · reviewed</p><h2>{question.prompt}</h2>
      {hints > 0 && <p className="hint" role="status">Hint: {question.hints[0]}</p>}
      <button className="text-button" disabled={hints > 0} onClick={() => setHints(1)}>Show hint 1</button>
      <label>Your answer<input value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>
      <button className="button button--primary" disabled={!answer.trim() || Boolean(feedback)} onClick={submitPractice}>Check answer</button>
      {feedback && <p className="feedback" role="status">{feedback} {hints > 0 && 'Recorded as assisted evidence.'}</p>}
    </section></div>;
}
