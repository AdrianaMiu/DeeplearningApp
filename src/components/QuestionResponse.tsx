import type { Question } from '../domain/types';

export function QuestionResponse({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  if (question.type === 'multiple_choice' && question.options?.length) {
    return <fieldset><legend>Your answer</legend>{question.options.map((option) => <label key={option}><input type="radio" name="question-answer" value={option} checked={value === option} onChange={() => onChange(option)} /> {option}</label>)}</fieldset>;
  }
  const longAnswer = question.type === 'explanation' || question.type === 'transfer' || question.type === 'debugging';
  return <><label>Your answer{longAnswer ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={question.type === 'numeric' ? 'number' : 'text'} step={question.type === 'numeric' ? 'any' : undefined} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />}</label>
    {(question.type === 'explanation' || question.type === 'transfer') && question.rubric && <div><p>Rubric for self-review</p><ul>{question.rubric.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul><p>Responses are checked against the reference answer; use the rubric to review your reasoning.</p></div>}</>;
}
