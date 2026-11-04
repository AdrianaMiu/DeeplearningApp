import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { QuestionResponse } from '../components/QuestionResponse';
import { gradeQuestion } from '../domain/grading';

import { useAppData } from '../app/context';
import { diagnosticQuestions } from '../content/diagnostic';
import { learningEntries, lessons } from '../content/lessons';
import { questions } from '../content/questions';
import { scheduleReview } from '../domain/review';
import type { Question } from '../domain/types';

export default function Practice() {
  const { repository, snapshot, refresh } = useAppData();
  const [params, setParams] = useSearchParams();
  const requestedMode = params.get('mode');
  const entryId = params.get('entry');
  const entry = learningEntries.find((item) => item.id === entryId);
  const mode = requestedMode === 'diagnostic' ? 'diagnostic'
    : requestedMode === 'chapter' && entry?.kind === 'chapter-studio' ? 'chapter'
    : requestedMode === 'quick' && entry && questions.some((item) => item.lessonId === entry.id) ? 'quick'
    : undefined;
  const [diagnosticDismissed, setDiagnosticDismissed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [recommendation, setRecommendation] = useState('tensor-shapes');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  useEffect(() => { if (snapshot?.settings.diagnosticSkipped || snapshot?.settings.diagnosticCompleted) setSkipped(true); }, [snapshot]);

  async function skipDiagnostic() {
    const current = await repository.getSettings();
    await repository.saveSettings({ ...current, diagnosticSkipped: true, updatedAt: new Date().toISOString() });
    setSkipped(true); setDiagnosticDismissed(true); refresh();
  }

  async function recordEvidence(question: Question, response: string, usedHints = 0, revealed = false) {
    const timestamp = new Date().toISOString();
    const result = gradeQuestion(question, response).score;
    const attemptId = crypto.randomUUID();
    await repository.appendAttempt({
      id: attemptId, questionId: question.id, questionVersion: question.version,
      conceptIds: question.conceptIds, response, timestamp, score: result,
      gradingMethod: question.rubric ? 'rubric' : 'deterministic', confidence,
      hintsUsed: usedHints, solutionRevealed: revealed,
      tutorSupportLevel: usedHints > 0 ? 'hint' : revealed ? 'revealed' : 'none',
      applicationEvidence: question.applicationEvidence,
    });
    const existingReviews = await repository.getReviews();
    for (const conceptId of question.conceptIds) {
      const currentInterval = existingReviews
        .filter((item) => item.conceptId === conceptId)
        .reduce((latest, item) => Math.max(latest, item.intervalIndex), -1);
      const scheduled = scheduleReview(timestamp, currentInterval, result === 1 && !revealed && usedHints === 0, confidence);
      await repository.appendReview({
        id: crypto.randomUUID(), conceptId, attemptId, timestamp,
        intervalIndex: scheduled.intervalIndex, dueAt: scheduled.dueAt,
      });
    }
    refresh();
    return result;
  }

  async function answerDiagnostic() {
    const question = diagnosticQuestions[diagnosticIndex];
    const result = await recordEvidence(question, answer);
    if (result === 0 && question.lessonId) setRecommendation(question.lessonId);
    if (diagnosticIndex < diagnosticQuestions.length - 1) { setDiagnosticIndex((value) => value + 1); setAnswer(''); return; }
    const current = await repository.getSettings();
    await repository.saveSettings({ ...current, diagnosticCompleted: true, updatedAt: new Date().toISOString() });
    setSkipped(true); setDiagnosticDismissed(true); refresh();
  }

  async function submitPractice(question: Question) {
    try {
      const result = await recordEvidence(question, answer, hints, solutionRevealed);
      setFeedback(result ? `Correct. ${question.explanation}` : `Not yet. ${question.explanation}`);
    } catch (reason) {
      setFeedback(reason instanceof Error ? `Could not save this attempt: ${reason.message}` : 'Could not save this attempt. Try again.');
    }
  }

  function resetQuestion(nextIndex: number) {
    setQuestionIndex(nextIndex); setAnswer(''); setHints(0); setFeedback(undefined); setSolutionRevealed(false); setConfidence(3);
  }

  if ((mode === 'diagnostic' && !diagnosticDismissed) || (!mode && !skipped)) {
    const question = diagnosticQuestions[diagnosticIndex];
    return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Optional diagnostic · {diagnosticIndex + 1}/8</p><h1>Find the best starting point</h1><p>Skip it at any time. Recommendations remain visible and overridable.</p></header>
      <section className="question-card"><h2>{question.prompt}</h2><QuestionResponse question={question} value={answer} onChange={setAnswer} /><div className="button-row"><button className="button button--primary" disabled={!answer.trim()} onClick={answerDiagnostic}>Save and continue</button><button className="button button--quiet" onClick={skipDiagnostic}>Skip diagnostic</button></div></section></div>;
  }

  const selected = (mode === 'chapter' || mode === 'quick' ? entry : lessons.find((lesson) => lesson.id === recommendation)) ?? lessons[0];
  const selectedQuestions = mode === 'chapter' && selected.kind === 'chapter-studio'
    ? selected.chapterCheckQuestionIds.flatMap((id) => questions.find((item) => item.id === id) ?? [])
    : questions.filter((item) => item.lessonId === selected.id);
  const question = selectedQuestions[questionIndex] ?? selectedQuestions[0];
  return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Practice desk</p><h1>{mode === 'chapter' ? 'Chapter check' : mode === 'quick' ? 'Quick practice' : 'One answer, with honest support'}</h1><p>Recommendation: {selected.title}. You remain in control.</p><label>Choose a different starting lesson<select name="starting-lesson" autoComplete="off" value={selected.id} onChange={(event) => { setRecommendation(event.target.value); if (mode) setParams({ mode: 'quick', entry: event.target.value }); resetQuestion(0); }}>{selected.kind === 'chapter-studio' && <option value={selected.id}>{selected.title}</option>}{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label></header>
    <section className="question-card"><p className="kicker">Question {questionIndex + 1}/{selectedQuestions.length} · reviewed</p><h2>{question.prompt}</h2>
      {hints > 0 && <p className="hint" role="status">Hint: {question.hints[0]}</p>}
      <button className="text-button" disabled={hints > 0} onClick={() => setHints(1)}>Show hint 1</button>
      {!solutionRevealed && <button className="text-button" onClick={() => setSolutionRevealed(true)}>Reveal solution</button>}
      {solutionRevealed && <p className="hint">Solution: {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}. {question.explanation}</p>}
      <QuestionResponse question={question} value={answer} onChange={setAnswer} />
      <label>Confidence<select name="answer-confidence" value={confidence} onChange={(event) => setConfidence(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)}><option value="1">1 · guessing</option><option value="2">2 · uncertain</option><option value="3">3 · fairly sure</option><option value="4">4 · confident</option><option value="5">5 · could teach it</option></select></label>
      <button className="button button--primary" disabled={!answer.trim() || Boolean(feedback)} onClick={() => submitPractice(question)}>Check answer</button>
      {feedback && <><p className="feedback" role="status">{feedback} {(hints > 0 || solutionRevealed) && 'Recorded as assisted evidence.'}</p>{mode === 'chapter' && questionIndex === selectedQuestions.length - 1 ? <p>Chapter check complete.</p> : <button className="button button--quiet" onClick={() => resetQuestion((questionIndex + 1) % selectedQuestions.length)}>Next question</button>}</>}
    </section></div>;
}
