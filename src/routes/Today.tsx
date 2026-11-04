import { Link } from 'react-router-dom';
import { useAppData } from '../app/context';
import { MilestoneRail } from '../components/MilestoneRail';
import { getAvailableLearningEntries, getChapterLearningSummary } from '../content/catalog';
import { milestones } from '../content/course-map';
import { questions } from '../content/questions';
import { getDueReviews } from '../domain/review';

const entries = getAvailableLearningEntries();
const byId = new Map(entries.map((entry) => [entry.id, entry]));
const questionEntries = new Map(questions.flatMap((question) => question.lessonId && byId.has(question.lessonId) ? [[question.id, question.lessonId] as const] : []));
const stageLabel = (step: string) => step === 'prediction' ? 'Predict (previously saved as prediction)' : step === 'worked-example' ? 'Understand (previously saved as worked example)' : step;

export default function Today() {
  const { snapshot, loading } = useAppData();
  const resume = snapshot?.sessions.filter((item) => !item.completedAt && item.lessonId && byId.has(item.lessonId)).at(-1);
  const resumedEntry = resume?.lessonId ? byId.get(resume.lessonId) : undefined;
  const latestByQuestion = new Map<string, NonNullable<typeof snapshot>['attempts'][number]>();
  for (const attempt of snapshot?.attempts ?? []) {
    const previous = latestByQuestion.get(attempt.questionId);
    if (!previous || attempt.timestamp >= previous.timestamp) latestByQuestion.set(attempt.questionId, attempt);
  }
  const latestAttempts = [...latestByQuestion.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const failed = latestAttempts.find((attempt) => attempt.score < 0.7 && questionEntries.has(attempt.questionId));
  const independentlyAttempted = new Set(latestAttempts.filter((attempt) => attempt.score >= 1 && attempt.gradingMethod !== 'ai_provisional' && attempt.hintsUsed === 0 && !attempt.solutionRevealed && attempt.tutorSupportLevel === 'none').flatMap((attempt) => questionEntries.get(attempt.questionId) ?? []));
  const next = entries.find((candidate) => !independentlyAttempted.has(candidate.id));
  const failedEntry = failed && byId.get(questionEntries.get(failed.questionId)!);
  const entry = resumedEntry ?? failedEntry ?? next ?? byId.get('tensor-shapes') ?? entries[0];
  const chapter = entry && getChapterLearningSummary(entry.chapterId);
  const milestone = milestones.find((item) => item.id === entry?.milestoneId);
  const due = getDueReviews(snapshot?.reviews ?? [], new Date().toISOString());
  const reflection = snapshot?.sessions.filter((item) => item.reflection?.trim()).at(-1)?.reflection;
  const evidence = snapshot?.attempts.length ?? 0;
  const reason = due.length ? 'Because you have review due, revisit it before continuing.' : resumedEntry ? 'Because you paused here, continue from your saved place.' : failedEntry ? 'Because your latest attempt on this activity needs another look.' : independentlyAttempted.size && next ? 'This is the next activity without a recent independent success; an attempt alone does not establish mastery.' : independentlyAttempted.size ? 'You have an independent success in every activity; revisit this foundation and inspect your evidence.' : 'Because tensor shapes are a useful foundation for the guided path.';
  return <div className="page today-page">
    <header className="page-heading"><p className="eyebrow">Learning desk</p><h1>Your next clear step</h1><p>Build reliable intuition in one focused loop: predict, test, explain, revisit.</p></header>
    <section className="cockpit-location" aria-labelledby="learning-now"><p className="kicker">What am I learning?</p><h2 id="learning-now">{milestone?.title} / {chapter?.title}</h2><p>{chapter?.capability ?? entry?.objectives[0]}</p></section>
    <section className="focus-card cockpit-focus" aria-labelledby="today-focus"><div className="focus-number" aria-hidden="true">01</div><div><p className="kicker">What should I do now? · {due.length ? snapshot?.settings.reviewBudgetMinutes ?? 10 : snapshot?.settings.lowEnergyMode ? snapshot.settings.minimumSessionMinutes : entry?.durationMinutes} min</p><h2 id="today-focus">{due.length ? 'Revisit a due review' : entry?.title}</h2><p>{reason}</p>{due.length ? <Link className="button button--primary" to="/review">Open review</Link> : entry && <Link className="button button--primary" to={`/lesson/${entry.id}`}>{resumedEntry ? 'Continue lesson' : 'Begin lesson'}</Link>}</div><div className="shape-sketch" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index}>{index}</span>)}</div></section>
    <MilestoneRail current={entry?.milestoneId} />
    <section className="evidence-strip" aria-labelledby="evidence-heading"><p className="kicker">What evidence do I have?</p><h2 id="evidence-heading">Your learning evidence</h2>{loading ? <p>Reading local progress…</p> : <div className="evidence-columns"><div><strong>{evidence} attempts</strong><p>Recorded answers, including assisted work.</p><Link to="/progress">Inspect evidence</Link></div><div><strong>{due.length} reviews due</strong><p>Scheduled from prior attempts.</p><Link to="/review">Open review</Link></div><div><strong>Saved reflection</strong><p>{reflection ?? 'No reflection saved yet.'}</p></div></div>}</section>
    <section className="resume-line"><h2>{resume ? 'Your saved place' : 'A calm starting point'}</h2>{resume ? <><p>{resume.goal}</p><p>{stageLabel(resume.resumeStep)}</p>{resumedEntry ? <Link to={`/lesson/${resumedEntry.id}`}>Resume {resumedEntry.title}</Link> : <p>The saved activity is unavailable. Explore the book to choose another.</p>}</> : <p>Pause a lesson and your place will appear here.</p>}</section>
    <details className="orientation-index"><summary>How this app works</summary><p>Choose a learning activity, predict before revealing an explanation, practice, and return for review. Attempts and reflections create evidence; opening content alone does not establish mastery.</p></details>
  </div>;
}
