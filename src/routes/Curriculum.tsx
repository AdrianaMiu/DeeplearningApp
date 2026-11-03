import { Link } from 'react-router-dom';

import { curriculumInventory } from '../content/inventory';
import { lessons } from '../content/lessons';

export default function Curriculum() {
  const bookChapters = curriculumInventory.chapters;
  const reviewedSections = new Set(lessons.flatMap((lesson) => lesson.sourceRefs.map((ref) => ref.sectionId)));
  const chapterPrefix = (id: string) => id.startsWith('chapter-') ? `${Number(id.replace('chapter-', ''))}.` : `${id.at(-1)?.toUpperCase()}.`;
  return (
    <div className="page">
      <header className="page-heading split-heading">
        <div><p className="eyebrow">Source map · Dive into Deep Learning</p><h1>The complete map</h1><p>20 chapters, two appendices, and every indexed exercise remain visible—even while content is still planned.</p></div>
        <div className="index-seal"><strong>{curriculumInventory.exercises.length}</strong><span>exercise references</span></div>
      </header>
      <section aria-labelledby="reviewed-lessons">
        <div className="section-title"><h2 id="reviewed-lessons">Reviewed learning path</h2><span className="status status--reviewed">12 reviewed</span></div>
        <div className="lesson-grid">
          {lessons.map((lesson, index) => (
            <article className="lesson-card" key={lesson.id}>
              <span className="lesson-index">{String(index + 1).padStart(2, '0')}</span>
              <div><p className="source-ref">§ {lesson.sourceRefs.map((ref) => ref.sectionId).join(' · ')}</p><h3><Link to={`/lesson/${lesson.id}`}>{lesson.title}</Link></h3><p>{lesson.question}</p></div>
              <span className="status status--reviewed">Reviewed</span>
            </article>
          ))}
        </div>
      </section>
      <section className="curriculum-index" aria-labelledby="book-index">
        <div className="section-title"><h2 id="book-index">Book inventory</h2><span className="status">honest scope</span></div>
        <div className="chapter-map">
          {bookChapters.map((chapter) => {
            const prefix = chapterPrefix(chapter.id);
            const sections = curriculumInventory.sections.filter((section) => section.id.startsWith(prefix));
            const exercises = curriculumInventory.exercises.filter((exercise) => exercise.sectionId.startsWith(prefix));
            const reviewed = chapter.id === 'chapter-2' || chapter.id === 'chapter-3';
            return <details className="curriculum-chapter" key={chapter.id}><summary><span>{chapter.title}</span><span>{sections.length} sections · {exercises.length} exercises</span><span className={reviewed ? 'status status--reviewed' : 'status'}>{reviewed ? 'Partly reviewed' : 'Unconverted'}</span></summary><ol>{sections.map((section) => <li key={section.id} className={section.level > 1 ? 'subsection' : ''}><span><strong>§{section.id}</strong> {section.title}</span><span className={reviewedSections.has(section.id) ? 'status status--reviewed' : 'status'}>{reviewedSections.has(section.id) ? 'Reviewed' : section.contentStatus}</span></li>)}</ol>{exercises.length > 0 && <details className="exercise-index"><summary>Individual exercise references</summary><ol>{exercises.map((exercise) => <li key={exercise.id}><span>{exercise.id}</span><span className="status">{exercise.contentStatus}</span></li>)}</ol></details>}</details>;
          })}
        </div>
        <details className="orientation-index"><summary>Orientation and reference records</summary><ul>{curriculumInventory.orientation.map((item) => <li key={item.id}><strong>{item.title}</strong><span className="status">{item.contentStatus}</span></li>)}</ul></details>
      </section>
    </div>
  );
}
