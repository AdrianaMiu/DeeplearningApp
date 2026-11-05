import { Link, useParams } from 'react-router-dom';
import { coverageCatalog } from '../content/coverage';
import type { CoverageCatalog } from '../content/coverage/registry';
import { curriculumInventory } from '../content/inventory';

function chapterId(sectionId: string): string {
  const root = sectionId.split('.')[0];
  return /^\d+$/.test(root) ? `chapter-${root}` : `appendix-${root.toLowerCase()}`;
}

export default function SectionActivity({ catalog = coverageCatalog }: { catalog?: CoverageCatalog }) {
  const { sectionId = '' } = useParams();
  const source = curriculumInventory.sections.find((item) => item.id === sectionId);
  const activity = catalog.getSectionActivity(sectionId);
  const chapter = chapterId(sectionId);
  if (!source) return <div className="page"><header className="page-heading"><h1>Section not found</h1></header><Link to="/curriculum">Return to curriculum</Link></div>;
  return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Source section · §{source.id}</p><h1>{source.title}</h1><p>Printed page {source.source.printedStart} · PDF page {source.source.pdfPageStart}</p></header>
    {!activity ? <section className="paper-card"><p className="status">Unconverted</p><h2>Section activity is not authored yet</h2><p>This source record is indexed, but it does not yet have a reviewed explanation and independent activity.</p></section>
      : <><section className="paper-card"><p className="status status--reviewed">{activity.contentStatus}</p><h2>Objectives</h2><ul>{activity.objectives.map((item) => <li key={item}>{item}</li>)}</ul><h2>Explanation</h2><p>{activity.explanation}</p></section><section className="paper-card"><h2>Worked example</h2><p>{activity.workedExample}</p><h2>Independent task</h2><p>{activity.independentTask}</p></section></>}
    <Link to={`/curriculum/${chapter}`}>Back to {chapter.startsWith('chapter-') ? `Chapter ${chapter.slice(8)}` : `Appendix ${chapter.slice(-1).toUpperCase()}`}</Link>
  </div>;
}
