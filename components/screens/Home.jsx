'use client';
import { useState } from 'react';
import { parseIncome, PERIODS } from '../../lib/tax';
import { CATEGORIES, GROUPS, groupTotals } from '../../lib/budget';
import { fmt, pct, Money, Bar, Icon } from '../ui';

export function localISO(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function monthKey(d = new Date()) {
  return localISO(d).slice(0, 7);
}
export function spentByCat(transactions, month = monthKey()) {
  const out = {};
  for (const t of transactions) if (t.date.startsWith(month)) out[t.cat] = (out[t.cat] || 0) + t.amount;
  return out;
}

export default function Home({ state, update, tax, plan, go }) {
  const g = groupTotals(plan);
  const taxesMo = tax.totalTax / 12;
  const pretaxMo = tax.pretax / 12;
  const grossMo = tax.monthlyGross;
  const parts = [
    { k: 'Taxes', v: taxesMo + pretaxMo, tint: 'grey', note: pretaxMo > 0 ? `incl. ${fmt(pretaxMo)} to retirement` : `${pct(tax.effective)} of pay` },
    { k: 'Needs', v: g.needs, tint: 'blue', note: `${pct(grossMo ? g.needs / tax.monthlyNet : 0, 0)} of take-home` },
    { k: 'Wants', v: g.wants, tint: 'amber', note: `${pct(grossMo ? g.wants / tax.monthlyNet : 0, 0)} of take-home` },
    { k: 'Savings', v: g.save, tint: 'teal', note: `${pct(grossMo ? g.save / tax.monthlyNet : 0, 0)} of take-home` },
  ];

  const spent = spentByCat(state.transactions);
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });
  const spendCats = CATEGORIES.filter((c) => c.group !== 'save' && (plan[c.id] > 0 || spent[c.id] > 0))
    .sort((a, b) => (plan[b.id] || 0) - (plan[a.id] || 0))
    .slice(0, 5);
  const planSpend = CATEGORIES.filter((c) => c.group !== 'save').reduce((s, c) => s + (plan[c.id] || 0), 0);
  const spentTotal = CATEGORIES.filter((c) => c.group !== 'save').reduce((s, c) => s + (spent[c.id] || 0), 0);
  const over = CATEGORIES.filter((c) => (spent[c.id] || 0) > (plan[c.id] || 0) && c.group !== 'save');

  const best = state.quiz.attempts.reduce((m, a) => Math.max(m, a.score), -1);
  const needsMo = g.needs || tax.monthlyNet * 0.5;
  const steps = [
    {
      done: state.profile.income.amount > 0 && state.planEdited,
      title: 'Make the budget yours',
      sub: 'Adjust the suggested plan to what you really pay.',
      to: 'budget',
    },
    {
      done: state.transactions.length >= 3,
      title: 'Log three purchases',
      sub: 'See how real spending compares with the plan.',
      to: 'spending',
    },
    {
      done: state.goals.length > 0,
      title: 'Set a savings goal',
      sub: `An emergency fund of 3 months of needs is about ${fmt(needsMo * 3)}.`,
      to: 'goals',
    },
    {
      done: best >= 8,
      title: best >= 0 ? `Quiz best: ${best} of 10` : 'Take the 10-question quiz',
      sub: 'Score 8 or more to finish this step.',
      to: 'learn',
    },
  ];

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{state.name ? `${state.name}’s month` : 'Your month'}</h1>
          <p className="finding">
            Of <strong>{fmt(grossMo)}</strong> earned a month, <strong>{fmt(tax.monthlyNet, true)}</strong> reaches your account.
            {g.save > 0 && <> Your plan saves <strong>{fmt(g.save)}</strong> of it.</>}
            {over.length > 0 && <> {over.length === 1 ? `${over[0].name} is` : `${over.length} categories are`} over plan this month.</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => go('paycheck')}>Change income</button>
          <button className="btn primary" onClick={() => go('coach')}><Icon name="coach" /> Ask the coach</button>
        </div>
      </div>

      <div className="grid">
        <section className="card span-8" aria-labelledby="h-split">
          <div className="card-head">
            <h2 id="h-split">Where a month of pay goes</h2>
            <span className="meta">2026 tax rules · estimate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <Money value={tax.monthlyNet} big />
            <span className="label">take-home a month, from {fmt(grossMo)} gross</span>
          </div>
          <div className="strip" style={{ marginTop: 18 }} role="img" aria-label="Monthly pay split into taxes, needs, wants and savings">
            {parts.map((p) => (
              <div key={p.k} className={`tint-${p.tint}`} style={{ flexGrow: Math.max(p.v, 0.0001), flexBasis: 0 }}>
                {grossMo && p.v / grossMo > 0.12 ? p.k : ''}
              </div>
            ))}
          </div>
          <div className="legend">
            {parts.map((p) => (
              <div key={p.k}>
                <div className="k"><span className={`dot tint-${p.tint}`} style={{ background: `var(--${p.tint}-mark)` }} />{p.k}</div>
                <div className="v num">{fmt(p.v)}</div>
                <div className="p">{p.note}</div>
              </div>
            ))}
          </div>
        </section>

        <QuickIncome state={state} update={update} />

        <section className="card span-6" aria-labelledby="h-left">
          <div className="card-head">
            <h2 id="h-left">Left to spend in {monthName}</h2>
            <button className="btn ghost small" onClick={() => go('spending')}>Log spending</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="mid num" style={{ color: planSpend - spentTotal < 0 ? 'var(--negative)' : undefined }}>{fmt(planSpend - spentTotal)}</span>
            <span className="label">of {fmt(planSpend)} for needs and wants</span>
          </div>
          <div className="rows" style={{ marginTop: 12 }}>
            {spendCats.map((c) => {
              const s = spent[c.id] || 0;
              const p = plan[c.id] || 0;
              return (
                <div className="row" key={c.id} style={{ minHeight: 52 }}>
                  <div className="grow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <span className="title">{c.name}</span>
                      <span className="num" style={{ fontSize: 14, color: s > p ? 'var(--negative)' : 'var(--muted)' }}>
                        {fmt(s)} of {fmt(p)}
                      </span>
                    </div>
                    <Bar value={s} max={p || 1} tone={s > p ? 'over' : ''} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card span-6" aria-labelledby="h-steps">
          <div className="card-head">
            <h2 id="h-steps">Next steps</h2>
            <span className="meta">{steps.filter((s) => s.done).length} of {steps.length} done</span>
          </div>
          <div className="rows">
            {steps.map((s) => (
              <button key={s.title} className="row" onClick={() => go(s.to)} style={{ border: 0, borderTop: '1px solid var(--rule)', background: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                <span className={`step-mark ${s.done ? 'done' : ''}`} aria-hidden="true">{s.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
                <span className="grow">
                  <span className="title" style={{ display: 'block', textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--muted)' : undefined }}>{s.title}</span>
                  <span className="sub">{s.sub}</span>
                </span>
                <span className="sr">{s.done ? 'Done' : 'Not done'}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function QuickIncome({ state, update }) {
  const [text, setText] = useState('');
  const parsed = parseIncome(text);
  const apply = () => {
    if (!parsed) return;
    update((s) => ({
      profile: {
        ...s.profile,
        income: {
          ...s.profile.income,
          amount: parsed.amount,
          period: parsed.period,
          hoursPerWeek: parsed.hoursPerWeek ?? s.profile.income.hoursPerWeek,
        },
      },
      planEdited: false,
    }));
    setText('');
  };
  const inc = state.profile.income;
  return (
    <section className="card span-4" aria-labelledby="h-quick" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-head"><h2 id="h-quick">What do you earn?</h2></div>
      <p className="card-note" style={{ marginBottom: 14 }}>
        Now: <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(inc.amount, inc.period === 'hourly')}</span>{' '}
        {PERIODS[inc.period].label.toLowerCase()}
        {inc.period === 'hourly' ? `, ${inc.hoursPerWeek} hours a week` : ''}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); apply(); }} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <label className="field">
          <span>Say it your way</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="$17 an hour, 20 hours a week" />
        </label>
        <p className="fine" aria-live="polite" style={{ minHeight: 20 }}>
          {text && (parsed
            ? <>Reads as {fmt(parsed.amount, parsed.period === 'hourly')} {PERIODS[parsed.period].label.toLowerCase()}{parsed.hoursPerWeek ? `, ${parsed.hoursPerWeek} h/week` : ''}.</>
            : 'Include an amount, like 45k a year or $2,000 a month.')}
        </p>
        <button className="btn primary" type="submit" disabled={!parsed}>Recalculate my plan</button>
      </form>
    </section>
  );
}
