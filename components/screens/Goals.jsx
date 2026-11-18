'use client';
import { useState } from 'react';
import { growth, monthsBetween, groupTotals } from '../../lib/budget';
import { fmt, Field, MoneyInput, NumInput, Bar, LineChart, Icon } from '../ui';

const inAYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function Goals({ state, update, plan, tax }) {
  const [form, setForm] = useState({ name: '', target: 0, saved: 0, date: inAYear() });
  const inv = state.invest;
  const setInv = (patch) => update((s) => ({ invest: { ...s.invest, ...patch } }));
  const goalBudget = (plan.goals || 0) + (plan.emergency || 0);

  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.target) return;
    update((s) => ({ goals: [...s.goals, { ...form, name: form.name.trim(), id: Date.now() }] }));
    setForm({ name: '', target: 0, saved: 0, date: inAYear() });
  };
  const patchGoal = (id, patch) => update((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const remove = (id) => update((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  const needed = state.goals.reduce((s, g) => {
    const m = Math.max(1, monthsBetween(new Date(), g.date));
    return s + Math.max(0, g.target - g.saved) / m;
  }, 0);

  const now = growth(inv.monthly, inv.rate, inv.years, 0);
  const later = growth(inv.monthly, inv.rate, inv.years, inv.delay);
  const endNow = now.at(-1);
  const endLater = later.at(-1);
  const age = 16;
  const labels = now.map((p) => (p.year === inv.years || (p.year % 10 === 0 && inv.years - p.year >= 6) ? `Age ${age + p.year}` : null));

  const emergency = groupTotals(plan).needs * 3;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Goals and investing</h1>
          <p className="finding">
            Starting now instead of in {inv.delay} years leaves you <strong>{fmt(endNow.balance - endLater.balance)}</strong> more at age {age + inv.years}, from{' '}
            <strong>{fmt(endNow.contributed - endLater.contributed)}</strong> more put in.
          </p>
        </div>
      </div>

      <div className="grid">
        <section className="card span-7" aria-labelledby="h-grow">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 id="h-grow">Start now or start later</h2>
            <div className="chart-legend">
              <span><i style={{ background: 'var(--chart-1)' }} />Start at {age}</span>
              <span><i style={{ background: 'var(--chart-grey)' }} />Start at {age + inv.delay}</span>
            </div>
          </div>
          <LineChart
            ariaLabel={`Growth of ${fmt(inv.monthly)} a month at ${inv.rate}% a year, starting now versus in ${inv.delay} years`}
            series={[
              { values: later.map((p) => p.balance), color: 'var(--chart-grey)', width: 2 },
              { values: now.map((p) => p.balance), color: 'var(--chart-1)', width: 2.5 },
            ]}
            xLabels={labels}
            annotate={[{ i: inv.years, v: endNow.balance, color: 'var(--chart-1)', label: fmt(endNow.balance) }]}
          />
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 16 }}>
            <Field label="Each month"><MoneyInput value={inv.monthly} step={10} onChange={(v) => setInv({ monthly: v })} /></Field>
            <Field label="Yearly return"><NumInput value={inv.rate} step={0.5} max={15} suffix="%" onChange={(v) => setInv({ rate: Math.min(15, v) })} /></Field>
            <Field label="Years"><NumInput value={inv.years} max={60} suffix="yr" onChange={(v) => setInv({ years: Math.max(1, Math.min(60, Math.round(v))) })} /></Field>
            <Field label="Delay"><NumInput value={inv.delay} max={inv.years - 1} suffix="yr" onChange={(v) => setInv({ delay: Math.max(0, Math.min(inv.years - 1, Math.round(v))) })} /></Field>
          </div>
          <p className="fine" style={{ marginTop: 12 }}>
            Assumes the same return every year, compounded monthly. Real markets rise and fall; 7% is a common long-run planning figure for a broad stock index fund, not a promise.
          </p>
        </section>

        <section className="card span-5" aria-labelledby="h-goals">
          <div className="card-head">
            <h2 id="h-goals">Savings goals</h2>
            <span className="meta num">{fmt(needed)}/mo needed · {fmt(goalBudget)} budgeted</span>
          </div>
          <div className="rows">
            {state.goals.length === 0 && (
              <p className="empty">
                No goals yet. A good first one: an emergency fund of three months of needs, about <span className="num">{fmt(emergency)}</span>.
              </p>
            )}
            {state.goals.map((g) => {
              const m = Math.max(1, monthsBetween(new Date(), g.date));
              const per = Math.max(0, g.target - g.saved) / m;
              const done = g.saved >= g.target;
              return (
                <div className="row" key={g.id} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 8 }}>
                    <span>
                      <span className="title" style={{ display: 'block' }}>{g.name}</span>
                      <span className="sub">{done ? 'Reached' : `${fmt(per)} a month for ${m} month${m === 1 ? '' : 's'}`}</span>
                    </span>
                    <button className="btn ghost small" onClick={() => remove(g.id)} aria-label={`Delete ${g.name}`}><Icon name="trash" size={16} /></button>
                  </div>
                  <div style={{ width: '100%' }}><Bar value={g.saved} max={g.target} tone={done ? 'good' : 'accent'} /></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <span className="label">Saved</span>
                    <div style={{ width: 120 }}><MoneyInput value={g.saved} step={10} onChange={(v) => patchGoal(g.id, { saved: v })} aria-label={`Saved toward ${g.name}`} /></div>
                    <span className="num label">of {fmt(g.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="divider" />
          <form onSubmit={add} className="form-grid">
            <Field label="New goal"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Emergency fund" /></Field>
            <Field label="Target"><MoneyInput value={form.target} step={50} onChange={(v) => setForm({ ...form, target: v })} /></Field>
            <Field label="Saved so far"><MoneyInput value={form.saved} step={10} onChange={(v) => setForm({ ...form, saved: v })} /></Field>
            <Field label="By"><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <div className="full"><button className="btn primary" type="submit" disabled={!form.name.trim() || !form.target}><Icon name="plus" /> Add goal</button></div>
          </form>
        </section>
      </div>
    </>
  );
}
