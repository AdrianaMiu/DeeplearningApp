import { describe, expect, it } from 'vitest';
import { compactTutorInput, TUTOR_INPUT_LIMITS } from '../../src/tutor/context-budget';

describe('tutor context budget', () => {
  it('preserves the latest attempt and question within explicit field limits', () => {
    const result = compactTutorInput({ learnerAttempt: `start-${'a'.repeat(2_000)}-latest`,
      question: `question-${'q'.repeat(2_000)}-latest`, recentConversation: [] });
    expect(result.learnerAttempt.length).toBe(TUTOR_INPUT_LIMITS.learnerAttempt);
    expect(result.question.length).toBe(TUTOR_INPUT_LIMITS.question);
    expect(result.learnerAttempt).toContain('latest');
    expect(result.question).toContain('latest');
    expect(result.estimatedCharacters).toBeLessThanOrEqual(TUTOR_INPUT_LIMITS.total);
  });

  it('compresses older turns into one bounded summary and retains the newest exchange', () => {
    const recentConversation = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 ? 'assistant' as const : 'user' as const,
      content: `turn-${index}-${'x'.repeat(500)}`,
    }));
    const result = compactTutorInput({ learnerAttempt: 'current attempt', question: 'current question', recentConversation });
    expect(result.recentConversation).toHaveLength(TUTOR_INPUT_LIMITS.messages);
    expect(result.recentConversation[0].content).toMatch(/^Earlier exchange:/);
    expect(result.recentConversation.at(-1)?.content).toContain('turn-9');
    expect(result.recentConversation.every((turn) => turn.content.length <= TUTOR_INPUT_LIMITS.message)).toBe(true);
    expect(result.estimatedCharacters).toBeLessThanOrEqual(TUTOR_INPUT_LIMITS.total);
  });

  it('uses the total budget even when every input field is populated', () => {
    const result = compactTutorInput({ learnerAttempt: 'a'.repeat(5_000), question: 'q'.repeat(5_000),
      recentConversation: Array.from({ length: 20 }, (_, index) => ({ role: 'user' as const, content: `${index}-${'m'.repeat(1_000)}` })) });
    expect(result.estimatedCharacters).toBe(
      result.learnerAttempt.length + result.question.length
      + result.recentConversation.reduce((sum, turn) => sum + turn.content.length, 0),
    );
    expect(result.estimatedCharacters).toBeLessThanOrEqual(TUTOR_INPUT_LIMITS.total);
  });
});
