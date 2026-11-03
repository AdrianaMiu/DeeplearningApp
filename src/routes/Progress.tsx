import { useAppData } from '../app/context';
import { lessons } from '../content/lessons';
import { deriveConceptProgress } from '../domain/progress';

export default function Progress() {
  const { snapshot } = useAppData();
  const attempts = snapshot?.attempts ?? [];
  const concepts = [...new Set(lessons.flatMap((lesson) => lesson.conceptIds))];
  return <div className="page"><header className="page-heading"><p className="eyebrow">Evidence ledger</p><h1>Progress you can inspect</h1><p>Mastery comes from distinct unassisted successes—not a checkbox or an assisted answer.</p></header><div className="progress-list">{concepts.map((concept) => { const progress = deriveConceptProgress(concept, attempts, new Date().toISOString()); return <article key={concept}><div><h2>{concept.replaceAll('-', ' ')}</h2><p>{progress.evidenceIds.length} independent evidence item{progress.evidenceIds.length === 1 ? '' : 's'}</p></div><span className={`status status--${progress.state}`}>{progress.state.replace('_', ' ')}</span></article>; })}</div></div>;
}
