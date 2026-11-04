import { ChapterAtlas } from '../components/ChapterAtlas';
import { curriculumInventory } from '../content/inventory';

export default function Curriculum() {
  return <div className="page"><header className="page-heading split-heading"><div><p className="eyebrow">Source map · Dive into Deep Learning</p><h1>The complete map</h1><p>20 chapters, two appendices, and every indexed exercise are visible alongside their learning paths.</p></div><div className="index-seal"><strong>{curriculumInventory.exercises.length}</strong><span>exercise references</span></div></header><ChapterAtlas /></div>;
}
