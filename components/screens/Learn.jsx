'use client';
import { useState } from 'react';
import { LESSONS, QUIZ } from '../../lib/lessons';
import { Icon } from '../ui';

export default function Learn({ state, update, go }) {
  const [topic, setTopic] = useState(LESSONS[0].id);
  const lesson = LESSONS.find((l) => l.id === topic);
  const [quiz, setQuiz] = useState(null); // { i, picks: [] }

  const start = () => setQuiz({ i: 0, picks: [] });
  const pick = (k) => {
    if (quiz.picks[quiz.i] != null) return;
    const picks = [...quiz.picks];
    picks[quiz.i] = k;
    setQuiz({ ...quiz, picks });
  };
  const next = () => {
    if (quiz.i < QUIZ.length - 1) return setQuiz({ ...quiz, i: quiz.i + 1 });
    const score = quiz.picks.reduce((s, p, i) => s + (p === QUIZ[i].a ? 1 : 0), 0);
    update((s) => ({ quiz: { ...s.quiz, attempts: [...s.quiz.attempts, { mode: 'practice', score, at: new Date().toISOString() }] } }));
    setQuiz({ ...quiz, done: true, score });
  };


  const q = quiz && !quiz.done ? QUIZ[quiz.i] : null;
  const answered = q && quiz.picks[quiz.i] != null;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Learn and quiz</h1>
          <p className="finding">Six topics, ten questions, with an explanation after each answer.</p>
        </div>
      </div>

      <div className="grid">
        <section className="card span-4" aria-labelledby="h-topics">
          <div className="card-head"><h2 id="h-topics">Topics</h2></div>
          <div className="topic-list">
            {LESSONS.map((l) => (
              <button key={l.id} className="topic" aria-pressed={topic === l.id} onClick={() => setTopic(l.id)}>
                <span>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{l.title}</span>
                  <span style={{ fontSize: 13, opacity: 0.8 }}>{l.summary}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="card span-8" aria-labelledby="h-lesson">
          <div className="card-head"><h2 id="h-lesson">{lesson.title}</h2></div>
          <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>{lesson.summary}</p>
          <ul className="points">
            {lesson.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            {lesson.tool && lesson.tool !== 'coach' && (
              <button className="btn" onClick={() => go(lesson.tool)}>Try it with your numbers</button>
            )}
            <button className="btn" onClick={() => { update({ coachPrompt: `Teach me about ${lesson.title.toLowerCase()} with an example that uses my own numbers.` }); go('coach'); }}>
              <Icon name="coach" /> Ask the coach for an example
            </button>
          </div>
        </section>

        <section className="card span-12" aria-labelledby="h-quiz">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 id="h-quiz">Quiz</h2>
            {quiz && !quiz.done && <span className="meta num">Question {quiz.i + 1} of {QUIZ.length}</span>}
          </div>

          {!quiz && (
            <div>
              <p className="card-note" style={{ marginBottom: 16 }}>
                Ten questions across all six topics, with an explanation after each answer.
              </p>
              <button className="btn primary" onClick={start}>Start the quiz</button>
            </div>
          )}

          {q && (
            <div>
              <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>{q.q}</p>
              <div className="stack" style={{ gap: 8 }}>
                {q.options.map((o, k) => {
                  const cls = answered ? (k === q.a ? 'right' : k === quiz.picks[quiz.i] ? 'wrong' : '') : '';
                  return (
                    <button key={o} className={`option ${cls}`} onClick={() => pick(k)} disabled={answered} aria-pressed={quiz.picks[quiz.i] === k}>
                      <span className="letter">{'ABCD'[k]}</span>{o}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div style={{ marginTop: 16 }}>
                  <p className="card-note" style={{ marginBottom: 14 }}>
                    <strong style={{ color: quiz.picks[quiz.i] === q.a ? 'var(--positive)' : 'var(--negative)' }}>{quiz.picks[quiz.i] === q.a ? 'Correct.' : 'Not quite.'}</strong> {q.why}
                  </p>
                  <button className="btn primary" onClick={next}>{quiz.i < QUIZ.length - 1 ? 'Next question' : 'See my score'}</button>
                </div>
              )}
            </div>
          )}

          {quiz?.done && (
            <div>
              <p className="figure num" style={{ marginBottom: 6 }}>{quiz.score} <span className="cents">of 10</span></p>
              <p className="card-note" style={{ marginBottom: 16 }}>
                {quiz.score >= 8 ? 'Strong. You know the basics well.' : quiz.score >= 5 ? 'A solid start. Review the topics you missed above.' : 'Worth another look: open each topic, then try again.'}
              </p>
              <button className="btn primary" onClick={() => setQuiz(null)}>Done</button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
