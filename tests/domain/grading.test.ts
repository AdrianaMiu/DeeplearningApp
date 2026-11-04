import { describe, expect, it } from 'vitest';
import { gradeQuestion } from '../../src/domain/grading';
import { questions } from '../../src/content/questions';
import type { Question } from '../../src/domain/types';

const base = questions[0];
const question = (type: Question['type'], answer: Question['answer'], tolerance?: number): Question => ({ ...base, type, answer, tolerance });

describe('gradeQuestion', () => {
  it('grades typed responses without substring credit', () => {
    expect(gradeQuestion(question('numeric', 3.5, 0.001), '3.50005').correct).toBe(true);
    expect(gradeQuestion(question('numeric', -2), '-2').correct).toBe(true);
    expect(gradeQuestion(question('numeric', -2), '2').correct).toBe(false);
    expect(gradeQuestion(question('shape', ['4', '3', '6']), '(4,3,6)').correct).toBe(true);
    expect(gradeQuestion(question('shape', ['4', '3', '6']), '4 × 3 × 6').correct).toBe(true);
    expect(gradeQuestion(question('multiple_choice', 'No'), 'Not sure').correct).toBe(false);
    expect(gradeQuestion(question('code_trace', ['forward', 'loss', 'update']), 'loss, forward, update').correct).toBe(false);
    expect(gradeQuestion(question('code_trace', ['forward', 'loss', 'update']), 'forward, loss, update').correct).toBe(true);
    expect(gradeQuestion(question('numeric', 32), '3').correct).toBe(false);
  });
});
