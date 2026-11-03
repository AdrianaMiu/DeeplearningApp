import { Link } from 'react-router-dom';

import { curriculumInventory } from '../content/inventory';
import { lessons } from '../content/lessons';

export default function Curriculum() {
  const bookChapters = curriculumInventory.chapters.filter((item) => item.kind === 'chapter');
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
        <ol>
          {bookChapters.map((chapter) => {
            const reviewed = chapter.id === 'ch02' || chapter.id === 'ch03';
            return <li key={chapter.id}><span>{chapter.title}</span><span className={reviewed ? 'status status--reviewed' : 'status'}>{reviewed ? 'Partly reviewed' : 'Unconverted'}</span></li>;
          })}
        </ol>
        <p>Appendix A (§A.1–A.11), Appendix B (§B.1–B.8), installation, notation, and Chapter 1 orientation are indexed as references.</p>
      </section>
    </div>
  );
}
