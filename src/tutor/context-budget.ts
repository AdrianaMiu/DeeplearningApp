export type TutorConversationTurn = { role: 'user' | 'assistant'; content: string };

export const TUTOR_INPUT_LIMITS = {
  learnerAttempt: 1_200,
  question: 1_000,
  message: 400,
  messages: 5,
  total: 3_200,
} as const;

function normalized(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function keepLatest(value: string, maximum: number): string {
  const clean = normalized(value);
  return clean.length <= maximum ? clean : `…${clean.slice(-(maximum - 1))}`;
}

function keepEarliest(value: string, maximum: number): string {
  const clean = normalized(value);
  return clean.length <= maximum ? clean : `${clean.slice(0, maximum - 1)}…`;
}

function earlierSummary(turns: TutorConversationTurn[]): TutorConversationTurn {
  const excerpts = turns.map((turn) => `${turn.role}: ${normalized(turn.content).slice(0, 64)}`);
  return { role: 'assistant', content: `Earlier exchange: ${excerpts.join(' | ')}` };
}

export function compactTutorInput(input: {
  learnerAttempt: string;
  question: string;
  recentConversation: TutorConversationTurn[];
}) {
  const learnerAttempt = keepLatest(input.learnerAttempt, TUTOR_INPUT_LIMITS.learnerAttempt);
  const question = keepLatest(input.question, TUTOR_INPUT_LIMITS.question);
  const cleanTurns = input.recentConversation.map((turn) => ({ ...turn, content: normalized(turn.content) }))
    .filter((turn) => turn.content.length > 0);
  const selected = cleanTurns.length > TUTOR_INPUT_LIMITS.messages
    ? [earlierSummary(cleanTurns.slice(0, -(TUTOR_INPUT_LIMITS.messages - 1))), ...cleanTurns.slice(-(TUTOR_INPUT_LIMITS.messages - 1))]
    : cleanTurns.slice(-TUTOR_INPUT_LIMITS.messages);
  const available = Math.max(0, TUTOR_INPUT_LIMITS.total - learnerAttempt.length - question.length);
  const perMessage = selected.length ? Math.min(TUTOR_INPUT_LIMITS.message, Math.floor(available / selected.length)) : 0;
  const recentConversation = perMessage > 0
    ? selected.map((turn) => ({ ...turn, content: keepEarliest(turn.content, perMessage) })) : [];
  const estimatedCharacters = learnerAttempt.length + question.length
    + recentConversation.reduce((sum, turn) => sum + turn.content.length, 0);
  return { learnerAttempt, question, recentConversation, estimatedCharacters };
}
