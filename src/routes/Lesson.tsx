import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../app/context';
import { LessonJourney, lessonStages, normalizeLessonStage, type LessonStage } from '../components/LessonJourney';
import { LessonViewTabs } from '../components/LessonViewTabs';
import { InteractionRenderer } from '../components/interactions/InteractionRenderer';
import { getAvailableLearningEntries } from '../content/catalog';
import type { LearningEntry, SessionRecord } from '../domain/types';

const TutorPanel = lazy(() => import('../tutor/TutorPanel').then((module) => ({ default: module.TutorPanel })));
const entries = getAvailableLearningEntries();

export default function Lesson() {
  const { lessonId } = useParams();
  const entry = entries.find((item) => item.id === lessonId);
  if (!entry) return <article className="page"><h1>Lesson unavailable</h1><p>This lesson could not be found or is not available yet.</p><Link to="/curriculum">Explore the curriculum</Link></article>;
  return <LessonLoader key={entry.id} entry={entry} />;
}

function LessonLoader({ entry }: { entry: LearningEntry }) {
  const { repository } = useAppData();
  const [result, setResult] = useState<{ saved?: SessionRecord; error?: boolean }>();
  useEffect(() => {
    let active = true;
    repository.getSessions().then((sessions) => {
      if (active) setResult({ saved: sessions.filter((item) => item.lessonId === entry.id).at(-1) });
    }, () => { if (active) setResult({ error: true }); });
    return () => { active = false; };
  }, [repository, entry.id]);
  if (!result) return <p className="page" role="status">Loading your saved place…</p>;
  if (result.error) return <article className="page"><h1>Could not load your saved place</h1><p>Reload the page to try again.</p></article>;
  return <LessonNotebook entry={entry} saved={result.saved} />;
}

function LessonNotebook({ entry, saved }: { entry: LearningEntry; saved?: SessionRecord }) {
  const { repository, refresh, snapshot } = useAppData();
  const [stage, setStage] = useState<LessonStage>(() => normalizeLessonStage(saved?.resumeStep));
  const [prediction, setPrediction] = useState(saved?.prediction ?? '');
  const [reflection, setReflection] = useState(saved?.reflection ?? '');
  const [revealed, setRevealed] = useState(() => saved?.workedRevealed || saved?.resumeStep === 'worked-example' || Boolean(saved?.prediction?.trim() && lessonStages.indexOf(normalizeLessonStage(saved.resumeStep)) > 1));
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const revision = useRef(0);
  const session = useRef({ id: saved?.id ?? crypto.randomUUID(), startedAt: saved?.startedAt ?? new Date().toISOString() });
  const [saveError, setSaveError] = useState('');
  const [tutorOpen, setTutorOpen] = useState(false);
  function changed() {
    revision.current += 1;
    setPaused(false);
    setSaveError('');
  }
  function changeStage(next: LessonStage) { changed(); setStage(next); }
  async function pause() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setPaused(false); setSaveError('');
    const savedRevision = revision.current;
    try {
      await repository.saveSession({ ...session.current, lessonId: entry.id, goal: entry.title, updatedAt: new Date().toISOString(), resumeStep: stage, prediction, reflection, workedRevealed: revealed });
      if (revision.current === savedRevision) setPaused(true);
      refresh();
    } catch { setSaveError('Could not save your place. Please try again.'); }
    finally { savingRef.current = false; setSaving(false); }
  }
  const index = lessonStages.indexOf(stage);
  return <article className="page lesson-page">
    <header className="lesson-header"><div><p className="eyebrow">Lesson · {entry.durationMinutes} min · reviewed</p><h1>{entry.title}</h1><p className="lede">{entry.question}</p></div><button className="button button--quiet" disabled={saving} onClick={pause}>{saving ? 'Saving…' : 'Pause and save place'}</button></header>
    {paused && <p className="notice" role="status">Saved locally. Today will show your resume point.</p>}{saveError && <p role="alert">{saveError}</p>}
    <LessonJourney stage={stage} revealed={revealed} onChange={changeStage} />
    <section className="lesson-stage" aria-label={`${stage} stage`}>
      {stage === 'orient' && <><h2>Orient</h2><p>See what you will learn and connect it to what you already know.</p>{entry.kind === 'chapter-studio' && <><p>{entry.purpose}</p><p>{entry.capability}</p></>}<h3>By the end</h3><ul>{entry.objectives.map((item) => <li key={item}>{item}</li>)}</ul><h3>Before you begin</h3><ul>{entry.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul><aside className="source-margin" aria-label="Source references">{entry.sourceRefs.map((ref) => <span key={ref.sectionId}>§{ref.sectionId} · print p. {ref.printedStart}{ref.printedEnd !== ref.printedStart && ref.printedEnd ? `–${ref.printedEnd}` : ''}</span>)}</aside></>}
      {stage === 'predict' && <><h2>Predict</h2><p>Commit to an answer first so you can compare your reasoning with the example.</p><p>{entry.predictionPrompt}</p><label>Your prediction<textarea name="lesson-prediction" value={prediction} onChange={(event) => { changed(); setPrediction(event.target.value); }} rows={3} /></label><button className="button button--primary" disabled={!prediction.trim()} onClick={() => { setRevealed(true); changeStage('understand'); }}>Reveal worked example</button></>}
      {stage === 'understand' && <><h2>Understand</h2><p>Compare your prediction with the example, then explore the idea from different angles.</p><div className="reveal" role="region" aria-label="Worked example"><h3>Worked example</h3><p>{entry.workedExample}</p></div><LessonViewTabs views={entry.views} /><h3>Misconception check</h3><ul className="correction-list">{entry.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {stage === 'try' && <><h2>Try</h2><p>Use the idea yourself to make the reasoning stick.</p><p>{entry.independentTask}</p>{entry.kind === 'chapter-studio' && <InteractionRenderer spec={entry.interaction} />}</>}
      {stage === 'check' && <><h2>Check</h2><p>Test your understanding with questions selected for this lesson.</p><Link className="button button--primary" to={`/practice?mode=${entry.kind === 'chapter-studio' ? 'chapter' : 'quick'}&entry=${encodeURIComponent(entry.id)}`}>{entry.kind === 'chapter-studio' ? 'Open chapter check' : 'Open quick practice'}</Link></>}
      {stage === 'reflect' && <><h2>Reflect</h2><p>Explain the idea in your own words to make it easier to recall later.</p><p><strong>Teach it back:</strong> {entry.teachBackPrompt}</p><label>Your reflection<textarea value={reflection} onChange={(event) => { changed(); setReflection(event.target.value); }} rows={4} /></label></>}
      <div className="button-row lesson-stage-actions">{index > 0 && <button className="button button--quiet" onClick={() => changeStage(lessonStages[index - 1])}>Previous stage</button>}{index < lessonStages.length - 1 && stage !== 'predict' && <button className="button button--primary" onClick={() => changeStage(lessonStages[index + 1])}>Next stage</button>}</div>
    </section>
    {entry.kind === 'deep-lesson' ? <section><button className="button button--quiet" aria-expanded={tutorOpen} onClick={() => setTutorOpen(!tutorOpen)}>{tutorOpen ? 'Close tutor' : 'Open tutor'}</button>{tutorOpen && <Suspense fallback={<p role="status">Loading tutor…</p>}><TutorPanel lessonId={entry.id} conceptIds={entry.conceptIds} learnerAttempt={prediction} locale={snapshot?.settings.language} /></Suspense>}</section> : <p className="notice">Tutor support is not yet available for this studio. The lesson remains available.</p>}
  </article>;
}
