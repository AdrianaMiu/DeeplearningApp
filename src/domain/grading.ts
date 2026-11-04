import type { Question } from './types';

export interface GradeResult {
  score: number;
  correct: boolean;
  matchedRule: string;
  feedback: string;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const sequence = (value: string) => value.trim().toLowerCase().replace(/^[\s([{]+|[\s)\]}]+$/g, '').split(/\s*(?:,|×|\b[x]\b|→|->|;|\n)\s*/).map(normalize);

/** Compare complete responses using the rule for the question's type. */
export function gradeQuestion(question: Question, response: string): GradeResult {
  const expected = Array.isArray(question.answer) ? question.answer.join(', ') : String(question.answer);
  let correct = false;
  let matchedRule = 'exact';
  if (response.trim()) {
    if (question.type === 'numeric') {
      matchedRule = 'numeric';
      const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
      const actual = response.trim();
      const target = expected.trim();
      correct = numericPattern.test(actual) && numericPattern.test(target) && Number.isFinite(Number(actual)) && Math.abs(Number(actual) - Number(target)) <= (question.tolerance ?? 0);
    } else if (question.type === 'shape' || (question.type === 'code_trace' && Array.isArray(question.answer))) {
      matchedRule = question.type === 'shape' ? 'shape' : 'ordered_trace';
      const actual = sequence(response);
      const target = Array.isArray(question.answer) ? question.answer.map(normalize) : sequence(expected);
      correct = actual.length === target.length && actual.every((part, index) => part === target[index]);
    } else {
      correct = normalize(response) === normalize(expected);
    }
  }
  return { score: correct ? 1 : 0, correct, matchedRule, feedback: correct ? 'Correct.' : 'Not yet.' };
}
