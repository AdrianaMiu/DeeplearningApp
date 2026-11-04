import { Link } from 'react-router-dom';
import { useAppData } from '../app/context';
import { getDueReviews } from '../domain/review';

export default function Review() {
  const { snapshot } = useAppData();
  const due = getDueReviews(snapshot?.reviews ?? [], new Date().toISOString());
  return <div className="page"><header className="page-heading"><p className="eyebrow">Spaced review · 1 / 3 / 7 / 14 / 30 days</p><h1>Revisit at the edge of forgetting</h1><p>Errors and low confidence move a variant earlier; earlier evidence is never erased.</p></header><section className="paper-card"><h2>{due.length ? `${due.length} review${due.length === 1 ? '' : 's'} due` : 'Nothing due right now'}</h2><p>{due.length ? 'Start with the earliest due concept.' : 'Practice a fresh application problem or continue the guided path.'}</p><p>Practice answers create a review schedule; later attempts update when a concept is due.</p>{due.length > 0 && <ul className="review-due-list">{due.slice().sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map((review) => <li key={review.id}><span aria-hidden="true">◷</span> {review.conceptId.replaceAll('-', ' ')} <small>Due {new Date(review.dueAt).toLocaleDateString()}</small></li>)}</ul>}<Link className="button button--primary" to="/practice">Open practice</Link></section></div>;
}
