import type { Question } from '../domain/types';
import { makeQuestion, type QuestionSeed } from './question-helpers';

const seeds: QuestionSeed[] = [
  { id: 'd01', lessonId: 'tensor-shapes', type: 'shape', prompt: 'Diagnostic: what shape is (5,1)+(1,3)?', answer: ['5', '3'], explanation: 'Both singleton axes expand.' },
  { id: 'd02', lessonId: 'broadcasting', type: 'multiple_choice', prompt: 'Diagnostic: which pair cannot broadcast?', options: ['(3,1) and (1,4)', '(4,2) and (4,)', '(2,3) and (3,)'], answer: '(4,2) and (4,)', explanation: 'The trailing dimensions conflict.' },
  { id: 'd03', lessonId: 'derivatives-gradients', type: 'numeric', prompt: 'Diagnostic: derivative of 3x² at x=2?', answer: 12, explanation: '6x evaluated at 2 is 12.' },
  { id: 'd04', lessonId: 'chain-rule', type: 'explanation', prompt: 'Diagnostic: explain why composed derivatives multiply.', answer: 'each local change scales the next', explanation: 'The chain rule propagates local sensitivity.' },
  { id: 'd05', lessonId: 'probability-expectation', type: 'numeric', prompt: 'Diagnostic: expectation of a fair 0/1 coin?', answer: 0.5, explanation: '0×0.5+1×0.5=0.5.' },
  { id: 'd06', lessonId: 'data-preprocessing', type: 'debugging', prompt: 'Diagnostic: identify leakage when scaling before the data split.', answer: 'validation statistics enter training preprocessing', explanation: 'Fit transforms on training data only.' },
  { id: 'd07', lessonId: 'linear-regression', type: 'multiple_choice', prompt: 'Diagnostic: which split guides model selection?', options: ['Training', 'Validation', 'Final test'], answer: 'Validation', explanation: 'The test set remains untouched until final evaluation.' },
  { id: 'd08', lessonId: 'regression-training', type: 'code_trace', prompt: 'Diagnostic: what must follow loss.backward before the next batch?', answer: ['update', 'zero-grad'], explanation: 'Apply gradients, then ensure stale gradients do not accumulate.' },
];

export const diagnosticQuestions: Question[] = seeds.map((seed, index) => makeQuestion(seed, index + 32));
