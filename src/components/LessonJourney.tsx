export const lessonStages = ['orient', 'predict', 'understand', 'try', 'check', 'reflect'] as const;
export type LessonStage = typeof lessonStages[number];

export function normalizeLessonStage(value?: string): LessonStage {
  if (value === 'prediction') return 'predict';
  if (value === 'worked-example') return 'understand';
  return lessonStages.find((stage) => stage === value) ?? 'orient';
}

export function LessonJourney({ stage, revealed, onChange }: { stage: LessonStage; revealed: boolean; onChange: (stage: LessonStage) => void }) {
  return <nav className="lesson-journey" aria-label="Lesson stages"><ol>{lessonStages.map((item, index) => <li key={item}><button type="button" aria-current={stage === item ? 'step' : undefined} disabled={index > 1 && !revealed} onClick={() => onChange(item)}>{item}</button></li>)}</ol></nav>;
}
