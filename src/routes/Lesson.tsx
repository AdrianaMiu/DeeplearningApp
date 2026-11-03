import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAppData } from '../app/context';
import { lessons } from '../content/lessons';
import { TutorPanel } from '../tutor/TutorPanel';

export default function Lesson() {
  const { lessonId } = useParams();
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const { repository, refresh } = useAppData();
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [paused, setPaused] = useState(false);

  async function pause() {
    await repository.saveSession({
      id: crypto.randomUUID(), lessonId: lesson.id, goal: lesson.title,
      startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      resumeStep: revealed ? 'worked-example' : 'prediction',
    });
    setPaused(true);
    refresh();
  }

  return (
    <article className="page lesson-page">
      <header className="lesson-header">
        <div><p className="eyebrow">Lesson · {lesson.durationMinutes} min · reviewed</p><h1>{lesson.title}</h1><p className="lede">{lesson.question}</p></div>
        <button className="button button--quiet" onClick={pause}>Pause and save place</button>
      </header>
      {paused && <p className="notice" role="status">Saved locally. Today will show your resume point.</p>}
      <aside className="source-margin" aria-label="Source references">
        {lesson.sourceRefs.map((ref) => <span key={ref.sectionId}>§{ref.sectionId} · print p. {ref.printedStart}{ref.printedEnd !== ref.printedStart ? `–${ref.printedEnd}` : ''}</span>)}
      </aside>
      <section className="objectives"><h2>By the end</h2><ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className="prediction-panel">
        <p className="kicker">01 · Predict before reveal</p><h2>A small commitment</h2><p>{lesson.predictionPrompt}</p>
        <label>Your prediction<textarea value={prediction} onChange={(event) => setPrediction(event.target.value)} rows={3} /></label>
        <button className="button button--primary" disabled={!prediction.trim()} onClick={() => setRevealed(true)}>Reveal worked example</button>
        {revealed && <div className="reveal" role="region" aria-label="Worked example"><p className="kicker">Compare, then correct</p><p>{lesson.workedExample}</p></div>}
      </section>
      <div className="view-grid">
        {Object.entries(lesson.views).map(([key, value], index) => <section className="paper-card" key={key}><p className="kicker">{String(index + 2).padStart(2, '0')} · {key.replace('workConnection', 'work connection')}</p><p>{value}</p></section>)}
      </div>
      <section className="independent-panel"><p className="kicker">Independent attempt</p><h2>Now make it yours</h2><p>{lesson.independentTask}</p><Link className="button button--primary" to="/practice">Open practice</Link></section>
      <TutorPanel lessonId={lesson.id} conceptIds={lesson.conceptIds} learnerAttempt={prediction} />
      <section><h2>Misconception check</h2><ul className="correction-list">{lesson.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Teach it back:</strong> {lesson.teachBackPrompt}</p></section>
    </article>
  );
}
