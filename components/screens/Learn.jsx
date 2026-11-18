'use client';
import { useState } from 'react';
import { LESSONS, QUIZ } from '../../lib/lessons';
import { Seg, Icon } from '../ui';

const MODES = [
  { value: 'practice', label: 'Practice' },
  { value: 'pre', label: 'Workshop pre-test' },
  { value: 'post', label: 'Workshop post-test' },
];

const avg = (a) => (a.length ? a.reduce((s, x) => s + x.score, 0) / a.length : null);

export default function Learn({ state, update, go }) {
  const [topic, setTopic] = useState(LESSONS[0].id);
  const lesson = LESSONS.find((l) => l.id === topic);
  const [mode, setMode] = useState('practice');
  const [quiz, setQuiz] = useState(null); // { i, picks: [] }
  const attempts = state.quiz.attempts;
  const pre = attempts.filter((a) => a.mode === 'pre');
  const post = attempts.filter((a) => a.mode === 'post');
  const preAvg = avg(pre);
  const postAvg = avg(post);

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
    update((s) => ({ quiz: { ...s.quiz, attempts: [...s.quiz.attempts, { mode, score, at: new Date().toISOString() }] } }));
    setQuiz({ ...quiz, done: true, score });
  };

  const exportCsv = () => {
    const rows = [['attempt', 'mode', 'score_out_of_10', 'date'], ...attempts.map((a, i) => [i + 1, a.mode, a.score, a.at])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = 'payday-workshop-scores.csv';
    el.click();
    URL.revokeObjectURL(url);
  };
  const clearWorkshop = () => update((s) => ({ quiz: { ...s.quiz, attempts: s.quiz.attempts.filter((a) => a.mode === 'practice') } }));

  const q = quiz && !quiz.done ? QUIZ[quiz.i] : null;
  const answered = q && quiz.picks[quiz.i] != null;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Learn and quiz</h1>
          <p className="finding">
            {preAvg != null && postAvg != null ? (
              <>Workshop scores went from <strong>{preAvg.toFixed(1)}</strong> to <strong>{postAvg.toFixed(1)}</strong> out of 10 ({pre.length} pre-tests, {post.length} post-tests).</>
            ) : (
              <>Six topics, ten questions. Run the pre-test before a workshop and the post-test after it to measure what people learned.</>
            )}
          </p>
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

        <section className="card span-8" aria-labelledby="h-quiz">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 id="h-quiz">Quiz</h2>
            {!quiz || quiz.done ? <Seg label="Quiz mode" value={mode} onChange={setMode} options={MODES} /> : <span className="meta num">Question {quiz.i + 1} of {QUIZ.length}</span>}
          </div>

          {!quiz && (
            <div>
              <p className="card-note" style={{ marginBottom: 16 }}>
                {mode === 'practice' ? 'Ten questions across all six topics, with an explanation after each answer.' : mode === 'pre' ? 'Hand the device to each participant before the workshop starts. Scores are saved on this device only, with no names.' : 'Same ten questions after the workshop, so the change in score shows what was learned.'}
              </p>
              <button className="btn primary" onClick={start}>Start {MODES.find((m) => m.value === mode).label.toLowerCase()}</button>
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
                {mode !== 'practice' && ' Saved to the workshop results.'}
              </p>
              <button className="btn primary" onClick={() => setQuiz(null)}>{mode === 'practice' ? 'Done' : 'Next participant'}</button>
            </div>
          )}
        </section>

        <section className="card span-4" aria-labelledby="h-results">
          <div className="card-head"><h2 id="h-results">Workshop results</h2></div>
          <div className="tiles two">
            <div className="tile tint-grey"><div className="k">Pre-test</div><div className="v num">{preAvg == null ? '—' : preAvg.toFixed(1)}</div><div className="s num">{pre.length} taken</div></div>
            <div className="tile tint-teal"><div className="k">Post-test</div><div className="v num">{postAvg == null ? '—' : postAvg.toFixed(1)}</div><div className="s num">{post.length} taken</div></div>
          </div>
          <p className="card-note" style={{ marginTop: 14 }}>
            {preAvg != null && postAvg != null
              ? `Average change: ${postAvg - preAvg >= 0 ? '+' : '−'}${Math.abs(postAvg - preAvg).toFixed(1)} points (${preAvg > 0 ? `${postAvg >= preAvg ? '+' : '−'}${Math.abs(((postAvg - preAvg) / preAvg) * 100).toFixed(0)}%` : 'from zero'}). Use it as a key metric in your written project.`
              : 'Average scores appear here once both tests have results.'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn small" onClick={exportCsv} disabled={!attempts.length}>Download CSV</button>
            <button className="btn small ghost" onClick={clearWorkshop} disabled={!pre.length && !post.length}>Clear workshop scores</button>
          </div>
        </section>
      </div>
    </>
  );
}
