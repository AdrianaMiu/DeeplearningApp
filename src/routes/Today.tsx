import { Link } from 'react-router-dom';

import { useAppData } from '../app/context';

export default function Today() {
  const { snapshot, loading } = useAppData();
  const resume = snapshot?.sessions.filter((item) => !item.completedAt).at(-1);
  const evidence = snapshot?.attempts.length ?? 0;
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date());
  const lowEnergy = snapshot?.settings.lowEnergyMode ?? false;
  return (
    <div className="page today-page">
      <header className="page-heading">
        <p className="eyebrow">{weekday} · learning desk</p>
        <h1>Your next clear step</h1>
        <p>Build reliable intuition in one focused loop: predict, test, explain, revisit.</p>
      </header>
      <section className="focus-card" aria-labelledby="today-focus">
        <div className="focus-number" aria-hidden="true">01</div>
        <div>
          <p className="kicker">Recommended · {lowEnergy ? `${snapshot?.settings.minimumSessionMinutes ?? 8} min minimum session` : '35 min'}</p>
          <h2 id="today-focus">Read tensors by shape</h2>
          <p>{lowEnergy ? 'Make one prediction and save your place. A small session still creates useful evidence.' : 'Learn to see every axis before running code. Start with a prediction, then validate it.'}</p>
          <div className="button-row">
            <Link className="button button--primary" to="/lesson/tensor-shapes">Begin lesson <span aria-hidden="true">→</span></Link>
            {!snapshot?.settings.diagnosticCompleted && !snapshot?.settings.diagnosticSkipped && (
              <Link className="button button--quiet" to="/practice">Take the 8-item diagnostic</Link>
            )}
          </div>
        </div>
        <div className="shape-sketch" aria-label="A tensor shape sketch showing three by four cells">
          {Array.from({ length: 12 }, (_, index) => <span key={index}>{index}</span>)}
        </div>
      </section>
      <div className="two-column">
        <section className="paper-card">
          <p className="kicker">Continue</p>
          <h2>{resume ? 'Your saved place' : 'A calm starting point'}</h2>
          {loading ? <p>Reading local progress…</p> : resume ? (
            <><p>{resume.goal}</p><Link to={`/lesson/${resume.lessonId ?? 'tensor-shapes'}`}>Resume at {resume.resumeStep}</Link></>
          ) : <p>Pause any lesson and this space will preserve the exact step locally.</p>}
        </section>
        <section className="paper-card evidence-card">
          <p className="kicker">Evidence, not streaks</p>
          <strong>{evidence}</strong>
          <p>recorded attempt{evidence === 1 ? '' : 's'}. Assisted work remains visible but never grants mastery by itself.</p>
          <Link to="/progress">Inspect evidence</Link>
        </section>
      </div>
      <aside className="principle-strip"><strong>Notebook principle</strong><span>“Prediction before reveal makes the correction memorable.”</span></aside>
    </div>
  );
}
