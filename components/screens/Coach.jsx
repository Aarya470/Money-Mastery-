'use client';
import { useEffect, useRef, useState } from 'react';
import { parseIncome, PERIODS } from '../../lib/tax';
import { buildContext } from '../App';
import { fmt, Icon } from '../ui';

const STARTERS = [
  'How much should I spend on food each month?',
  'Is it worth opening a Roth IRA with my part-time job?',
  'How do I start building credit?',
  'What should I do with my first paycheck?',
  'I make $45,000 a year. What rent can I afford?',
  'How do I spot a money scam?',
];

function Rich({ text }) {
  // Minimal formatting: **bold** and line breaks.
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part.replace(/^#+\s*/gm, '')}</span>
  );
}

export default function Coach({ state, update, tax, plan, go }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState('');
  const logRef = useRef(null);
  const sentPrompt = useRef(false);
  const chat = state.chat || [];

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.length, stream]);

  const send = async (text) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...chat, { role: 'user', content: q }];
    update({ chat: history });
    setInput('');
    setBusy(true);
    setStream('');
    let answer = '';
    let failed = false;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })), context: buildContext(state, tax, plan) }),
      });
      if (!res.ok || !res.body) {
        failed = true;
        answer = (await res.text()) || 'The coach is unavailable right now.';
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += dec.decode(value, { stream: true });
          setStream(answer);
        }
        if (!answer.trim()) { failed = true; answer = 'The coach returned an empty answer. Try asking again.'; }
      }
    } catch {
      failed = true;
      answer = 'Could not reach the coach. Check your connection and try again.';
    }
    update((s) => ({ chat: [...(s.chat || []), { role: 'assistant', content: answer.trim(), error: failed }] }));
    setStream('');
    setBusy(false);
  };

  useEffect(() => {
    if (state.coachPrompt && !sentPrompt.current) {
      sentPrompt.current = true;
      const q = state.coachPrompt;
      update({ coachPrompt: null });
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastUser = [...chat].reverse().find((m) => m.role === 'user');
  const detected = lastUser ? parseIncome(lastUser.content) : null;
  const sameAsNow = detected && detected.amount === state.profile.income.amount && detected.period === state.profile.income.period;
  const applyIncome = () => {
    update((s) => ({
      profile: { ...s.profile, income: { ...s.profile.income, amount: detected.amount, period: detected.period, hoursPerWeek: detected.hoursPerWeek ?? s.profile.income.hoursPerWeek } },
      planEdited: false,
    }));
    go('paycheck');
  };

  return (
    <>
      <div className="title-row">
        <div>
          <h1>AI coach</h1>
          <p className="finding">
            Ask anything about money. The coach sees your take-home of <strong>{fmt(tax.monthlyNet)}</strong> a month and your plan, so answers use your numbers.
          </p>
        </div>
        {chat.length > 0 && <button className="btn" onClick={() => update({ chat: [] })}>New conversation</button>}
      </div>

      <section className="card" aria-label="Conversation">
        <div className="chat">
          <div className="chat-log" ref={logRef} aria-live="polite">
            {chat.length === 0 && !busy && (
              <div style={{ margin: 'auto 0', paddingBottom: 12 }}>
                <p className="label" style={{ marginBottom: 12 }}>Try one of these</p>
                <div className="chips">
                  {STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
                </div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'} ${m.error ? 'err' : ''} ${i >= chat.length - 2 ? 'msg-enter' : ''}`}>
                {m.role === 'user' ? m.content : <Rich text={m.content} />}
              </div>
            ))}
            {busy && (
              <div className="msg bot msg-enter">
                {stream ? <Rich text={stream} /> : <span className="typing" aria-label="Coach is writing"><i /><i /><i /></span>}
              </div>
            )}
            {!busy && detected && !sameAsNow && (
              <div className="notice tint-blue" style={{ alignSelf: 'flex-start', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>You mentioned {fmt(detected.amount, detected.period === 'hourly')} {PERIODS[detected.period].label.toLowerCase()}.</span>
                <button className="btn small" onClick={applyIncome}>Use it for my taxes and budget</button>
              </div>
            )}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <label className="sr" htmlFor="ask">Message the coach</label>
            <textarea
              id="ask"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about budgeting, taxes, credit, investing…"
              maxLength={1500}
            />
            <button className="btn primary" type="submit" disabled={busy || !input.trim()} aria-label="Send" style={{ height: 48 }}>
              <Icon name="send" />
            </button>
          </form>
        </div>
      </section>
      <p className="fine" style={{ marginTop: 12 }}>The coach gives general education, not professional financial, tax or legal advice. It can make mistakes; check important numbers on the Paycheck and Budget screens.</p>
    </>
  );
}
