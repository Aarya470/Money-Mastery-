'use client';
import { payoff, minimumPayoff } from '../../lib/budget';
import { fmt, Field, MoneyInput, NumInput, LineChart, Icon } from '../ui';

const span = (m) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return [y ? `${y} yr` : '', r ? `${r} mo` : ''].filter(Boolean).join(' ') || '0 mo';
};

export default function Debt({ state, update, go }) {
  const d = state.debt;
  const set = (patch) => update((s) => ({ debt: { ...s.debt, ...patch } }));
  const mine = payoff(d.balance, d.apr, d.payment);
  const min = minimumPayoff(d.balance, d.apr);
  const firstMin = Math.max(25, d.balance * (d.apr / 100 / 12) + 0.01 * d.balance);
  const interestFloor = d.balance * (d.apr / 100 / 12);
  const n = Math.max(mine ? mine.series.length : 0, min.series.length);
  const pad = (arr) => [...arr, ...Array(Math.max(0, n - arr.length)).fill(0)];
  const step = n > 120 ? 24 : n > 48 ? 12 : 6;
  const labels = Array.from({ length: n }, (_, i) => (i % step === 0 ? (i === 0 ? 'Now' : span(i)) : null));
  const util = d.limit ? d.balance / d.limit : null;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Credit and debt</h1>
          <p className="finding">
            {mine ? (
              <>Paying <strong>{fmt(d.payment)}</strong> a month clears {fmt(d.balance)} in <strong>{span(mine.months)}</strong> with {fmt(mine.interest)} interest. Minimum payments take {span(min.months)} and cost <strong style={{ color: 'var(--negative)' }}>{fmt(min.interest)}</strong>.</>
            ) : (
              <><strong style={{ color: 'var(--negative)' }}>{fmt(d.payment)} a month never pays this off</strong>: interest alone is {fmt(interestFloor, true)} a month.</>
            )}
          </p>
        </div>
        <button className="btn primary" onClick={() => { update({ coachPrompt: 'How do credit scores work, and how can I build credit safely as a teen or student?' }); go('coach'); }}>
          <Icon name="coach" /> How credit scores work
        </button>
      </div>

      <div className="grid">
        <section className="card span-8" aria-labelledby="h-pay">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 id="h-pay">Balance over time</h2>
            <div className="chart-legend">
              <span><i style={{ background: 'var(--chart-1)' }} />Your payment</span>
              <span><i style={{ background: 'var(--chart-2)' }} />Minimum only</span>
            </div>
          </div>
          <LineChart
            ariaLabel="Card balance over time with your payment and with minimum payments"
            series={[
              { values: pad(min.series), color: 'var(--chart-2)', width: 2 },
              ...(mine ? [{ values: pad(mine.series), color: 'var(--chart-1)', width: 2.5 }] : []),
            ]}
            xLabels={labels}
          />
        </section>

        <section className="card span-4" aria-labelledby="h-card">
          <div className="card-head"><h2 id="h-card">Your card or loan</h2></div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <Field label="Balance"><MoneyInput value={d.balance} step={50} onChange={(v) => set({ balance: v })} /></Field>
            <Field label="APR" hint="on your statement"><NumInput value={d.apr} step={0.01} max={40} suffix="%" onChange={(v) => set({ apr: Math.min(40, v) })} /></Field>
            <Field label="You pay each month"><MoneyInput value={d.payment} step={5} onChange={(v) => set({ payment: v })} /></Field>
            <Field label="Credit limit" hint="optional"><MoneyInput value={d.limit || 0} step={100} onChange={(v) => set({ limit: v })} /></Field>
          </div>
        </section>

        <section className="card span-12" aria-labelledby="h-cmp">
          <div className="card-head"><h2 id="h-cmp">Side by side</h2></div>
          <div className="tiles four">
            <div className="tile tint-blue">
              <div className="k">Your plan</div>
              <div className="v num">{mine ? span(mine.months) : 'Never'}</div>
              <div className="s num">{mine ? `${fmt(mine.interest)} interest · ${fmt(d.balance + mine.interest)} total` : `Pay over ${fmt(interestFloor, true)} a month`}</div>
            </div>
            <div className="tile tint-amber">
              <div className="k">Minimum payments</div>
              <div className="v num">{span(min.months)}</div>
              <div className="s num">{fmt(min.interest)} interest · first payment {fmt(firstMin, true)}</div>
            </div>
            <div className="tile tint-teal">
              <div className="k">You save</div>
              <div className="v num">{mine ? fmt(Math.max(0, min.interest - mine.interest)) : '—'}</div>
              <div className="s">in interest by paying more</div>
            </div>
            <div className={`tile ${util == null ? 'tint-grey' : util > 0.3 ? 'tint-rose' : 'tint-teal'}`}>
              <div className="k">Credit used</div>
              <div className="v num">{util == null ? '—' : `${Math.round(util * 100)}%`}</div>
              <div className="s">{util == null ? 'Add your limit to see it' : util > 0.3 ? 'Above 30% can lower your score' : 'Under 30% helps your score'}</div>
            </div>
          </div>
          <p className="fine" style={{ marginTop: 14 }}>Minimum payment modeled as interest plus 1% of the balance, at least $25, a formula many card issuers use. Check your statement for yours.</p>
        </section>
      </div>
    </>
  );
}
