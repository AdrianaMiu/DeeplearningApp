import { Link, useParams } from 'react-router-dom';
import { ExerciseStateControl } from '../components/ExerciseStateControl';
import { coverageCatalog } from '../content/coverage';
import type { CoverageCatalog } from '../content/coverage/registry';
import { curriculumInventory } from '../content/inventory';

function chapterId(sectionId: string): string {
  const root = sectionId.split('.')[0];
  return /^\d+$/.test(root) ? `chapter-${root}` : `appendix-${root.toLowerCase()}`;
}

export default function ExerciseActivity({ catalog = coverageCatalog }: { catalog?: CoverageCatalog }) {
  const { exerciseId = '' } = useParams();
  const source = curriculumInventory.exercises.find((item) => item.id === exerciseId);
  const activity = catalog.getExerciseActivity(exerciseId);
  if (!source) return <div className="page"><header className="page-heading"><h1>Exercise not found</h1></header><Link to="/curriculum">Return to curriculum</Link></div>;
  return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Individual source exercise · §{source.sectionId}</p><h1>{source.title}</h1><p>Printed page {source.source.printedStart} · PDF page {source.source.pdfPageStart}</p></header>
    {!activity ? <section className="paper-card"><p className="status">Unconverted</p><h2>Exercise activity is not authored yet</h2><p>The source exercise is indexed individually. A reviewed companion prompt, hints and check are still required.</p></section>
      : <section className="paper-card"><p className="status status--reviewed">{activity.contentStatus}</p><h2>Companion activity</h2><p>{activity.prompt}</p><details><summary>Progressive hints</summary><ol>{activity.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>{activity.evaluation.kind === 'rubric' ? <><h2>Evaluation rubric</h2><ul>{activity.evaluation.criteria.map((item) => <li key={item}>{item}</li>)}</ul></> : <p>Submit an attempt before revealing the reviewed check.</p>}</section>}
    <ExerciseStateControl exerciseId={exerciseId} />
    <Link to={`/curriculum/${chapterId(source.sectionId)}`}>Back to chapter source map</Link>
  </div>;
}
