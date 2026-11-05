import { useEffect, useState } from 'react';
import { useAppData } from '../app/context';
import type { ExerciseWorkflowState } from '../domain/types';

type EditableState = Extract<ExerciseWorkflowState, 'not_started' | 'deferred' | 'discussed'>;

export function ExerciseStateControl({ exerciseId }: { exerciseId: string }) {
  const { repository, snapshot, refresh } = useAppData();
  const stored = snapshot?.exerciseProgress.find((item) => item.exerciseId === exerciseId);
  const evidenceState = stored?.state === 'attempted' || stored?.state === 'completed' ? stored.state : undefined;
  const editable = stored?.state === 'deferred' || stored?.state === 'discussed' ? stored.state : 'not_started';
  const [state, setState] = useState<EditableState>(editable);
  const [note, setNote] = useState(stored?.note ?? '');
  const [message, setMessage] = useState('');
  useEffect(() => { setState(editable); setNote(stored?.note ?? ''); }, [editable, stored?.note]);
  async function save() {
    const now = new Date().toISOString();
    await repository.saveExerciseProgress({
      id: exerciseId, exerciseId, state: evidenceState ?? state, note: note.trim() || undefined,
      linkedAttemptIds: stored?.linkedAttemptIds ?? [], updatedAt: now,
      attemptedAt: stored?.attemptedAt, completedAt: stored?.completedAt,
    });
    setMessage(`Saved as ${(evidenceState ?? state).replace('_', ' ')}.`);
    refresh();
  }
  return <section className="paper-card exercise-state"><h2>Your exercise state</h2><p>Attempted and completed require saved answer evidence; these planning states do not change concept mastery.</p>
    {evidenceState
      ? <p><strong>Evidence-backed state:</strong> {evidenceState}</p>
      : <label>Exercise workflow state<select value={state} onChange={(event) => setState(event.target.value as EditableState)}><option value="not_started">Not started</option><option value="deferred">Deferred</option><option value="discussed">Discussed</option></select></label>}
    <label>Exercise note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
    <button type="button" className="button button--primary" onClick={save}>Save exercise state</button>{message && <p role="status">{message}</p>}
  </section>;
}
