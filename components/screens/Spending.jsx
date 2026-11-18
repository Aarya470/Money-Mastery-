'use client';
import { useState } from 'react';
import { CATEGORIES, GROUPS, catById } from '../../lib/budget';
import { fmt, Field, MoneyInput, Bar, Icon } from '../ui';
import { monthKey, spentByCat, localISO } from './Home';

const today = () => localISO();

export default function Spending({ state, update, plan }) {
  const [form, setForm] = useState({ desc: '', amount: 0, cat: 'dining', date: today() });
  const [month, setMonth] = useState(monthKey());
  const spent = spentByCat(state.transactions, month);
  const list = state.transactions.filter((t) => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = list.reduce((s, t) => s + t.amount, 0);
  const cats = CATEGORIES.filter((c) => (plan[c.id] || 0) > 0 || spent[c.id] > 0);
  const over = cats.filter((c) => (spent[c.id] || 0) > (plan[c.id] || 0));
  const months = [...new Set([monthKey(), ...state.transactions.map((t) => t.date.slice(0, 7))])].sort().reverse();
  const monthLabel = (m) => new Date(`${m}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const add = (e) => {
    e.preventDefault();
    if (!form.amount || !form.desc.trim()) return;
    update((s) => ({ transactions: [...s.transactions, { ...form, desc: form.desc.trim(), id: Date.now() }] }));
    setForm({ ...form, desc: '', amount: 0 });
  };
  const remove = (id) => update((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Spending</h1>
          <p className="finding">
            {list.length === 0 ? 'Nothing logged for this month yet. Add what you buy and see it against the plan.' : (
              <>You logged <strong>{fmt(total, true)}</strong> in {monthLabel(month).split(' ')[0]}
                {over.length ? <>; <strong style={{ color: 'var(--negative)' }}>{over.map((c) => c.name).join(', ')}</strong> {over.length === 1 ? 'is' : 'are'} over plan.</> : ', all within plan.'}</>
            )}
          </p>
        </div>
        {months.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        )}
      </div>

      <div className="grid">
        <section className="card span-5" aria-labelledby="h-add">
          <div className="card-head"><h2 id="h-add">Add a purchase</h2></div>
          <form onSubmit={add} className="form-grid">
            <Field label="What was it?">
              <input className="input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Lunch with friends" required />
            </Field>
            <Field label="Amount"><MoneyInput value={form.amount} step={0.01} onChange={(v) => setForm({ ...form, amount: v })} required /></Field>
            <Field label="Category">
              <select className="input" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                {['needs', 'wants', 'save'].map((g) => (
                  <optgroup key={g} label={GROUPS[g].label}>
                    {CATEGORIES.filter((c) => c.group === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Date"><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <div className="full"><button className="btn primary" type="submit" disabled={!form.amount || !form.desc.trim()}><Icon name="plus" /> Add purchase</button></div>
          </form>

          <div className="divider" />
          <div className="card-head" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 16, fontWeight: 600 }}>Purchases</h2><span className="meta">{list.length}</span></div>
          <div className="rows">
            {list.length === 0 && <p className="empty">Your purchases for {monthLabel(month)} will list here.</p>}
            {list.slice(0, 30).map((t) => {
              const c = catById[t.cat];
              return (
                <div className="row" key={t.id}>
                  <span className={`chip-ico tint-${GROUPS[c.group].tint}`} aria-hidden="true">{t.desc[0]?.toUpperCase()}</span>
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>{t.desc}</span>
                    <span className="sub">{c.name} · {new Date(`${t.date}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </span>
                  <span className="amt num">{c.group === 'save' ? '+' : ''}{fmt(t.amount, true)}</span>
                  <button className="btn ghost small" onClick={() => remove(t.id)} aria-label={`Delete ${t.desc}`}><Icon name="trash" size={16} /></button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card span-7" aria-labelledby="h-vs">
          <div className="card-head"><h2 id="h-vs">Spent against plan</h2><span className="meta">{monthLabel(month)}</span></div>
          <div className="rows">
            {cats.map((c) => {
              const s = spent[c.id] || 0;
              const p = plan[c.id] || 0;
              const left = p - s;
              const isSave = c.group === 'save';
              return (
                <div className="row" key={c.id} style={{ minHeight: 62 }}>
                  <span className="dot" style={{ background: `var(--${GROUPS[c.group].tint}-mark)` }} aria-hidden="true" />
                  <div className="grow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <span className="title">{c.name}</span>
                      <span className="num" style={{ fontSize: 14 }}>
                        {fmt(s, true)} <span style={{ color: 'var(--muted)' }}>of {fmt(p)}</span>
                      </span>
                    </div>
                    <Bar value={s} max={p || 1} tone={isSave ? (s >= p ? 'good' : 'accent') : s > p ? 'over' : ''} />
                  </div>
                  <span className="num" style={{ width: 96, textAlign: 'right', fontSize: 14, color: !isSave && left < 0 ? 'var(--negative)' : 'var(--muted)' }}>
                    {isSave ? (s >= p ? 'Done' : `${fmt(left)} to go`) : left < 0 ? `${fmt(-left)} over` : `${fmt(left)} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
