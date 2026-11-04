import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../app/context';
import { getAvailableLearningEntries } from '../content/catalog';
import { deriveConceptProgress } from '../domain/progress';

const concepts = [...new Set(getAvailableLearningEntries().flatMap((entry) => entry.conceptIds))];

export default function Progress() {
  const { snapshot } = useAppData();
  const [showAll, setShowAll] = useState(false);
  const attempts = snapshot?.attempts ?? [];
  const attempted = new Set(attempts.flatMap((attempt) => attempt.conceptIds));
  const recorded = concepts.filter((concept) => attempted.has(concept));
  const visible = showAll ? concepts : recorded;
  const now = new Date().toISOString();
  return <div className="page"><header className="page-heading"><p className="eyebrow">Evidence ledger</p><h1>Progress you can inspect</h1><p>Mastery comes from distinct unassisted successes—not a checkbox or an assisted answer.</p></header>
    <div className="ledger-intro"><p>{recorded.length} of {concepts.length} concepts have recorded attempts. Attempts include assisted work; the evidence count below includes distinct unassisted correct answers.</p><Link to="/practice">Try practice</Link></div>
    {!recorded.length && !showAll && <p className="empty-state">No concepts have attempts yet. Try a practice question to begin building evidence.</p>}
    <button type="button" className="button button--quiet ledger-toggle" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'Show concepts with attempts' : 'Show all concepts'}</button>
    <div className="progress-list">{visible.map((concept) => { const progress = deriveConceptProgress(concept, attempts, now); return <article key={concept}><div><h2>{concept.replaceAll('-', ' ')}</h2><p>{progress.evidenceIds.length} independent evidence item{progress.evidenceIds.length === 1 ? '' : 's'}</p><p>Distinct unassisted correct answers contribute to this count.</p></div><span className={`status status--${progress.state}`}><span aria-hidden="true">{progress.state === 'not_started' ? '○' : progress.state === 'retained' ? '✓' : '●'}</span> {progress.state.replace('_', ' ')}</span></article>; })}</div>
  </div>;
}
