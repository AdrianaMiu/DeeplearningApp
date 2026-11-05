import { Link } from 'react-router-dom';
import { useAppData } from '../app/context';
import { getDueReviews } from '../domain/review';
import { getAvailableLearningEntries } from '../content/catalog';
import { questions } from '../content/questions';

const availableIds = new Set(getAvailableLearningEntries().map((entry) => entry.id));

export default function Review() {
  const { snapshot } = useAppData();
  const due = getDueReviews(snapshot?.reviews ?? [], new Date().toISOString())
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.id.localeCompare(b.id))
    .map((review) => {
      const question = questions.find((item) => item.lessonId && availableIds.has(item.lessonId) && item.conceptIds.includes(review.conceptId));
      return { ...review, path: question ? `/practice?${new URLSearchParams({ mode: 'quick', entry: question.lessonId!, question: question.id })}` : undefined };
    });
  const first = due.find((review) => review.path);
  return <div className="page">
    <header className="page-heading"><p className="eyebrow">Spaced review · 1 / 3 / 7 / 14 / 30 days</p><h1>Revisit at the edge of forgetting</h1><p>Errors and low confidence move a variant earlier; earlier evidence is never erased.</p></header>
    <section className="paper-card">
      <h2>{due.length ? `${due.length} review${due.length === 1 ? '' : 's'} due` : 'Nothing due right now'}</h2>
      <p>{due.length ? 'Start with the earliest due concept with an available practice question.' : 'Practice a fresh application problem or continue the guided path.'}</p>
      <p>Practice answers create a review schedule; later attempts update when a concept is due.</p>
      {due.length > 0 && <ul className="review-due-list">{due.map((review) => <li key={review.id}>
        <span aria-hidden="true">◷</span> {review.conceptId.replaceAll('-', ' ')} <small>Due {new Date(review.dueAt).toLocaleDateString()}</small>{' '}
        {review.path ? <Link to={review.path}>Practice {review.conceptId.replaceAll('-', ' ')}</Link> : <span>No reviewed question is available for this concept yet.</span>}
      </li>)}</ul>}
      <Link className="button button--primary" to={first?.path ?? '/practice'}>{first ? 'Start earliest review' : 'Open practice'}</Link>
    </section>
  </div>;
}
