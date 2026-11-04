import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../app/context';
import { getAvailableLearningEntries, getChapterLearningSummary } from '../content/catalog';
import { milestones } from '../content/course-map';
import { curriculumInventory } from '../content/inventory';
import { questions } from '../content/questions';

const entries = getAvailableLearningEntries();
const byId = new Map(entries.map((entry) => [entry.id, entry]));
const summaries = new Map(curriculumInventory.chapters.map((chapter) => [chapter.id, getChapterLearningSummary(chapter.id)]));
const questionCounts = new Map<string, number>();
for (const question of questions) if (question.lessonId && byId.has(question.lessonId)) questionCounts.set(question.lessonId, (questionCounts.get(question.lessonId) ?? 0) + 1);
const prefix = (id: string) => id.startsWith('chapter-') ? `${Number(id.slice(8))}.` : `${id.at(-1)?.toUpperCase()}.`;
const sectionStatus = (id: string) => entries.some((entry) => entry.sourceRefs.some((ref) => ref.sectionId === id));

export function ChapterAtlas() {
  const { chapterId } = useParams();
  const { snapshot } = useAppData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const dueConcepts = useMemo(() => new Set(snapshot?.reviews.filter((review) => review.dueAt <= new Date().toISOString()).map((review) => review.conceptId) ?? []), [snapshot?.reviews]);
  const selected = chapterId ? summaries.get(chapterId) : undefined;
  const selectedEntries = selected?.availableEntryIds.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []) ?? [];
  const sections = selected ? curriculumInventory.sections.filter((section) => section.id.startsWith(prefix(selected.chapterId))) : [];
  const exercises = selected ? curriculumInventory.exercises.filter((exercise) => exercise.sectionId.startsWith(prefix(selected.chapterId))) : [];
  const filtered = milestones.map((milestone) => ({ milestone, chapters: milestone.chapterIds.map((id) => summaries.get(id)!).filter((chapter) => {
    const chapterEntries = chapter.availableEntryIds.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []);
    const hasDue = chapterEntries.some((entry) => entry.conceptIds.some((id) => dueConcepts.has(id)));
    const hasIndexed = curriculumInventory.sections.some((section) => section.id.startsWith(prefix(chapter.chapterId)) && !sectionStatus(section.id));
    return `${chapter.title} ${chapter.purpose ?? ''} ${chapter.capability ?? ''}`.toLowerCase().includes(search.toLowerCase().trim()) && (filter === 'all' || (filter === 'available' && chapterEntries.length > 0) || (filter === 'review' && hasDue) || (filter === 'indexed' && hasIndexed));
  }) }));
  return <section aria-label="Book atlas" className="book-atlas">
    <div className="atlas-controls"><label>Search chapters<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or topic" /></label><label>Filter chapters<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All chapters</option><option value="available">Available now</option><option value="review">Needs review</option><option value="indexed">Indexed only</option></select></label></div>
    <p>Indexed only — source mapped, learning activity not authored yet. A chapter activity does not convert every source section or exercise.</p>
    {selected && <section className="chapter-detail" aria-labelledby="chapter-detail-heading"><p className="kicker">Chapter details</p><h2 id="chapter-detail-heading">{selected.title}</h2><p>{selected.purpose ?? selectedEntries[0]?.question}</p><h3>Learning path</h3>{selectedEntries.length ? <ul>{selectedEntries.map((entry) => <li key={entry.id}><Link to={`/lesson/${entry.id}`}>{entry.title}</Link> <span className="status status--reviewed">{entry.kind === 'chapter-studio' ? 'Core studio available' : 'Deep lesson available'}</span></li>)}</ul> : <p>Indexed only; no reviewed activity is available yet.</p>}
      <h3>Source sections</h3><div className="curriculum-chapter"><ol>{sections.map((section) => <li key={section.id} className={section.level > 1 ? 'subsection' : ''}><span><strong>§{section.id}</strong> {section.title}</span><span className={sectionStatus(section.id) ? 'status status--reviewed' : 'status'}>{sectionStatus(section.id) ? 'Referenced in activity' : 'Indexed only'}</span></li>)}</ol></div>
      <details className="exercise-index"><summary>Individual exercise references ({exercises.length})</summary><ol>{exercises.map((exercise) => <li key={exercise.id}><span>{exercise.id}</span><span className="status">Indexed only</span></li>)}</ol></details><Link to="/curriculum">Close chapter details</Link></section>}
    {chapterId && !selected && <p>Chapter not found. <Link to="/curriculum">Explore the book atlas</Link>.</p>}
    {filtered.every((group) => group.chapters.length === 0) && <p>No chapters match these filters.</p>}
    {filtered.map(({ milestone, chapters }) => chapters.length > 0 && <section key={milestone.id} className="atlas-milestone"><p className="kicker">Milestone {milestone.order}</p><h2>{milestone.title}</h2><p>{milestone.purpose}</p><div>{chapters.map((chapter) => { const chapterEntries = chapter.availableEntryIds.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []); const first = chapterEntries[0]; const count = chapterEntries.reduce((total, entry) => total + (questionCounts.get(entry.id) ?? 0), 0); return <article className="atlas-row" data-testid="chapter-row" key={chapter.chapterId}><div><h3>{chapter.chapterId.startsWith('chapter-') ? `Chapter ${chapter.chapterId.slice(8)}` : `Appendix ${chapter.chapterId.slice(-1).toUpperCase()}`}: {chapter.title}</h3><p>{chapter.purpose ?? first?.question ?? 'Explore the source map for this chapter.'}</p><p><strong>Capability:</strong> {chapter.capability ?? first?.objectives[0] ?? 'Inspect the indexed source sections.'}</p><p className="atlas-counts">{chapter.studioCount} studios · {chapter.deepLessonCount} deep lessons · {count} questions · {chapter.sourceSectionCount} source sections · {chapter.exerciseCount} exercises</p><p className="status status--reviewed">{chapter.studioCount ? 'Core studio available' : chapter.deepLessonCount ? 'Deep lesson available' : 'Indexed only'}</p></div><div className="atlas-actions">{first && <Link to={`/lesson/${first.id}`} aria-label={`${first.kind === 'chapter-studio' ? 'Start studio' : 'Start lesson'}: ${chapter.title}`}>{first.kind === 'chapter-studio' ? 'Start studio' : 'Start lesson'}</Link>}<Link to={`/curriculum/${chapter.chapterId}`}>Inspect sections<span className="sr-only"> for {chapter.title}</span></Link></div></article>; })}</div></section>)}
    <details className="orientation-index"><summary>Orientation and reference records</summary><ul>{curriculumInventory.orientation.map((item) => <li key={item.id}><strong>{item.title}</strong><span className="status">Indexed only</span></li>)}</ul></details>
  </section>;
}
