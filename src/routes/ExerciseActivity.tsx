import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../app/context';
import { ExerciseStateControl } from '../components/ExerciseStateControl';
import { coverageCatalog } from '../content/coverage';
import type { CoverageCatalog } from '../content/coverage/registry';
import { curriculumInventory } from '../content/inventory';

function chapterId(sectionId: string): string {
  const root = sectionId.split('.')[0];
  return /^\d+$/.test(root) ? `chapter-${root}` : `appendix-${root.toLowerCase()}`;
}

export default function ExerciseActivity({ catalog = coverageCatalog }: { catalog?: CoverageCatalog }) {
  const { repository, snapshot, refresh } = useAppData();
  const { exerciseId = '' } = useParams();
  const [response, setResponse] = useState('');
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [rubricResult, setRubricResult] = useState<'revise' | 'meets'>('revise');
  const [saveMessage, setSaveMessage] = useState('');
  const source = curriculumInventory.exercises.find((item) => item.id === exerciseId);
  const activity = catalog.getExerciseActivity(exerciseId);
  const progress = snapshot?.exerciseProgress.find((item) => item.exerciseId === exerciseId);
  async function saveAttempt() {
    if (!activity || !response.trim()) return;
    const timestamp = new Date().toISOString();
    const attemptId = crypto.randomUUID();
    const completed = rubricResult === 'meets';
    await repository.db.transaction('rw', repository.db.attempts, repository.db.exerciseProgress, async () => {
      await repository.appendAttempt({ id: attemptId, questionId: exerciseId, questionVersion: 1,
        conceptIds: [], response: response.trim(), timestamp, score: completed ? 1 : 0,
        gradingMethod: 'rubric', confidence, hintsUsed: 0, solutionRevealed: false,
        tutorSupportLevel: 'none', applicationEvidence: false });
      await repository.saveExerciseProgress({ id: exerciseId, exerciseId,
        state: completed ? 'completed' : 'attempted',
        linkedAttemptIds: [...(progress?.linkedAttemptIds ?? []), attemptId],
        attemptedAt: progress?.attemptedAt ?? timestamp,
        completedAt: completed ? timestamp : progress?.completedAt,
        note: progress?.note, updatedAt: timestamp });
    });
    setResponse('');
    setSaveMessage(completed ? 'Attempt saved as completed against the rubric. This does not grant concept mastery.'
      : 'Attempt saved for revision. This is evidence of work, not mastery.');
    refresh();
  }
  if (!source) return <div className="page"><header className="page-heading"><h1>Exercise not found</h1></header><Link to="/curriculum">Return to curriculum</Link></div>;
  return <div className="page narrow-page"><header className="page-heading"><p className="eyebrow">Individual source exercise · §{source.sectionId}</p><h1>{source.title}</h1><p>Printed page {source.source.printedStart} · PDF page {source.source.pdfPageStart}</p></header>
    {!activity ? <section className="paper-card"><p className="status">Unconverted</p><h2>Exercise activity is not authored yet</h2><p>The source exercise is indexed individually. A reviewed companion prompt, hints and check are still required.</p></section>
      : <><section className="paper-card"><p className="status status--reviewed">{activity.contentStatus}</p><h2>Companion activity</h2><p>{activity.prompt}</p><details><summary>Progressive hints</summary><ol>{activity.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>{activity.evaluation.kind === 'rubric' ? <><h2>Evaluation rubric</h2><ul>{activity.evaluation.criteria.map((item) => <li key={item}>{item}</li>)}</ul></> : <p>Submit an attempt before revealing the reviewed check.</p>}</section>
      <section className="paper-card"><h2>Record an attempt</h2><p>Your response stays in this browser. A self-check records workflow evidence but cannot grant concept mastery.</p>
        <label>Your response<textarea rows={8} value={response} onChange={(event) => setResponse(event.target.value)} /></label>
        <label>Confidence<select value={confidence} onChange={(event) => setConfidence(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)}><option value="1">1 · guessing</option><option value="2">2 · uncertain</option><option value="3">3 · fairly sure</option><option value="4">4 · confident</option><option value="5">5 · could teach it</option></select></label>
        <label>Rubric self-check<select value={rubricResult} onChange={(event) => setRubricResult(event.target.value as 'revise' | 'meets')}><option value="revise">Needs revision</option><option value="meets">Meets every criterion</option></select></label>
        <button type="button" className="button button--primary" disabled={!response.trim()} onClick={saveAttempt}>Save exercise attempt</button>
        {saveMessage && <p role="status">{saveMessage}</p>}
      </section></>}
    <ExerciseStateControl exerciseId={exerciseId} />
    <Link to={`/curriculum/${chapterId(source.sectionId)}`}>Back to chapter source map</Link>
  </div>;
}
