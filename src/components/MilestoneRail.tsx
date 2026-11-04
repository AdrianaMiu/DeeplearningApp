import { Link } from 'react-router-dom';
import { milestones } from '../content/course-map';
import type { MilestoneId } from '../domain/types';

export function MilestoneRail({ current }: { current?: MilestoneId }) {
  return <nav className="milestone-rail" aria-label="Book milestones"><ol>{milestones.map((milestone) => <li key={milestone.id} className={current === milestone.id ? 'is-current' : ''}>
    <Link to={`/curriculum/${milestone.chapterIds[0]}`} aria-current={current === milestone.id ? 'location' : undefined}><span>{milestone.order}</span>{milestone.title}</Link>
  </li>)}</ol></nav>;
}
