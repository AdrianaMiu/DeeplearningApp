import { useCallback, useRef, useState } from 'react';

import { anonymousClientId, requestTutor as defaultRequestTutor, type TutorMode, type TutorRequest, type TutorResponse } from './client';
import { compactTutorInput, type TutorConversationTurn } from './context-budget';
import { TurnstileWidget } from './TurnstileWidget';

export function TutorPanel({ lessonId, conceptIds, learnerAttempt, locale = 'en', requestTutor = defaultRequestTutor }: {
  lessonId: string;
  conceptIds: string[];
  learnerAttempt: string;
  locale?: 'en' | 'ro-help';
  requestTutor?: (request: TutorRequest) => Promise<TutorResponse>;
}) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [consented, setConsented] = useState(false);
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<TutorMode>('hint');
  const [token, setToken] = useState('');
  const [reply, setReply] = useState<TutorResponse>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<TutorConversationTurn[]>([]);
  const [verificationGeneration, setVerificationGeneration] = useState(0);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
  const injected = requestTutor !== defaultRequestTutor;
  const tokenRef = useRef('');
  const requestInFlight = useRef(false);
  const onToken = useCallback((value: string) => {
    if (requestInFlight.current) return;
    tokenRef.current = value;
    setToken(value);
  }, []);

  async function ask() {
    if (requestInFlight.current || (!injected && !tokenRef.current)) return;
    const requestToken = tokenRef.current || (injected ? 'test-token' : '');
    requestInFlight.current = true;
    tokenRef.current = '';
    setToken('');
    setLoading(true); setError('');
    try {
      const compact = compactTutorInput({ learnerAttempt, question, recentConversation: conversation });
      const result = await requestTutor({
        lessonId, conceptIds, mode, learnerAttempt: compact.learnerAttempt, question: compact.question,
        locale, recentConversation: compact.recentConversation,
        turnstileToken: requestToken, anonymousClientId: anonymousClientId(),
      });
      setReply(result);
      setConversation((current) => [...current,
        { role: 'user', content: question }, { role: 'assistant', content: result.reply }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tutor is temporarily unavailable.');
    } finally {
      requestInFlight.current = false;
      // Synchronous preparation failures can batch away the loading render.
      setVerificationGeneration((generation) => generation + 1);
      setLoading(false);
    }
  }

  return <section className="tutor-panel" aria-labelledby="tutor-heading"><p className="kicker">Optional online support</p><h2 id="tutor-heading">Grounded tutor</h2>{!consented ? <div className="privacy-disclosure"><p>When book retrieval is enabled, the indexed book and submitted conversation fragments are processed by Gemini. Gemini free-tier prompts may be used by Google to improve its products. Do not submit personal or sensitive data. Progress and notes otherwise stay in this browser.</p><label className="checkbox-label"><input name="tutor-privacy-consent" type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />I understand this privacy notice</label><button className="button button--quiet" disabled={!consentChecked} onClick={() => setConsented(true)}>Continue to tutor</button></div> : <><p>The tutor uses the reviewed lesson and, when enabled, retrieved book passages, together with your attempt, question, and recent conversation.</p><label>Support mode<select name="tutor-mode" autoComplete="off" value={mode} onChange={(event) => setMode(event.target.value as TutorMode)}><option value="hint">Hint</option><option value="explain">Explain</option><option value="feedback">Feedback</option><option value="reveal">Reveal solution explicitly</option></select></label><label>Question for the tutor<textarea name="tutor-question" autoComplete="off" rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>{siteKey && !injected && !loading && <TurnstileWidget key={verificationGeneration} siteKey={siteKey} onToken={onToken} />}{!siteKey && !injected && <p className="notice">Tutor is not configured. Continue the lesson without AI.</p>}<button className="button button--primary" disabled={!question.trim() || loading || (!token && !injected)} onClick={ask}>{loading ? 'Asking…' : mode === 'hint' ? 'Ask for a hint' : 'Ask tutor'}</button>{reply && <div className="tutor-reply" role="status"><p>{reply.reply}</p><p><strong>Next attempt:</strong> {reply.suggestedNextAttempt}</p>{reply.sourceRefs.map((ref) => <small key={ref.sectionId}>{reply.grounding === 'book' ? 'Book source' : 'Companion explanation'} · §{ref.sectionId} · print p. {ref.printedStart} · PDF p. {ref.pdfPageStart}</small>)}</div>}{error && <div className="result-bad" role="status"><p>{error}</p><p>Continue the lesson without AI; every core activity remains available.</p></div>}</>}</section>;
}
