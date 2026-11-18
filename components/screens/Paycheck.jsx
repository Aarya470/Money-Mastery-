'use client';
import { STATES, PERIODS, STANDARD_DEDUCTION, SS_WAGE_BASE, TAX_YEAR } from '../../lib/tax';
import { fmt, pct, Field, MoneyInput, NumInput, Seg, Switch, Icon } from '../ui';

const PAY_FREQ = [
  { value: 52, label: 'Weekly' },
  { value: 26, label: 'Every 2 weeks' },
  { value: 24, label: 'Twice a month' },
  { value: 12, label: 'Monthly' },
];

export default function Paycheck({ state, update, tax, go }) {
  const p = state.profile;
  const inc = p.income;
  const setP = (patch) => update((s) => ({ profile: { ...s.profile, ...patch }, planEdited: false }));
  const setInc = (patch) => setP({ income: { ...inc, ...patch } });
  const freq = state.payFreq || 26;
  const view = state.stubView || 'check';
  const div = view === 'check' ? freq : view === 'month' ? 12 : 1;
  const stateName = STATES.find((s) => s.id === p.state)?.name.split(' (')[0];

  const lines = [
    { k: 'Federal income tax', v: tax.federal, m: `${Math.round(tax.federalMarginal * 100)}% top bracket` },
    { k: 'Social Security', v: tax.ss, m: '6.2%' },
    { k: 'Medicare', v: tax.medicare, m: '1.45%' },
    { k: p.state === 'NONE' ? 'State income tax' : `${stateName} income tax`, v: tax.state, m: p.state === 'NONE' ? 'none' : pct(tax.gross ? tax.state / tax.gross : 0) },
  ];
  if (tax.pretax > 0) lines.unshift({ k: 'Retirement (pre-tax)', v: tax.pretax, m: `${p.pretaxPct}% of pay` });

  const ask = (q) => {
    update({ coachPrompt: q });
    go('coach');
  };

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Paycheck and taxes</h1>
          <p className="finding">
            You keep <strong>{fmt(tax.net / div, true)}</strong> of every <strong>{fmt(tax.gross / div, true)}</strong>{' '}
            {view === 'check' ? 'paycheck' : view === 'month' ? 'month' : 'year'}: an effective tax rate of <strong>{pct(tax.effective)}</strong>.
          </p>
        </div>
        <button className="btn primary" onClick={() => ask('Explain my paycheck: where does each deduction go, and why is my take-home different from my pay?')}>
          <Icon name="coach" /> Explain my paycheck
        </button>
      </div>

      <div className="grid">
        <section className="card span-5" aria-labelledby="h-in">
          <div className="card-head"><h2 id="h-in">Your income</h2></div>
          <div className="form-grid">
            <div className="field full">
              <span>How are you paid?</span>
              <Seg
                full
                label="Pay period"
                value={inc.period}
                onChange={(v) => setInc({ period: v })}
                options={[
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'biweekly', label: 'Per check' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'annual', label: 'Salary' },
                ]}
              />
            </div>
            <Field label={inc.period === 'hourly' ? 'Hourly wage' : inc.period === 'annual' ? 'Yearly salary' : inc.period === 'monthly' ? 'Monthly pay' : 'Pay every 2 weeks'}>
              <MoneyInput value={inc.amount} onChange={(v) => setInc({ amount: v })} step={inc.period === 'hourly' ? 0.25 : 100} />
            </Field>
            {inc.period === 'hourly' ? (
              <Field label="Hours a week">
                <NumInput value={inc.hoursPerWeek} onChange={(v) => setInc({ hoursPerWeek: v })} max={80} suffix="h" />
              </Field>
            ) : <div />}
            {inc.period === 'hourly' && (
              <Field label="Weeks worked a year">
                <NumInput value={inc.weeksPerYear} onChange={(v) => setInc({ weeksPerYear: Math.min(52, v) })} max={52} suffix="wk" />
              </Field>
            )}
            <Field label="401(k) savings" hint="pre-tax">
              <NumInput value={p.pretaxPct} onChange={(v) => setP({ pretaxPct: Math.min(50, v) })} max={50} step={1} suffix="%" />
            </Field>
            <Field label="Filing status">
              <select className="input" value={p.filing} onChange={(e) => setP({ filing: e.target.value })}>
                <option value="single">Single</option>
                <option value="married">Married filing jointly</option>
                <option value="head">Head of household</option>
              </select>
            </Field>
            <Field label="State">
              <select className="input" value={p.state} onChange={(e) => setP({ state: e.target.value })}>
                {STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            {p.state === 'CUSTOM' && (
              <Field label="Estimated state rate">
                <NumInput value={p.customStateRate} onChange={(v) => setP({ customStateRate: Math.min(15, v) })} step={0.1} max={15} suffix="%" />
              </Field>
            )}
            <div className="full" style={{ paddingTop: 6 }}>
              <Switch
                title="A parent can claim me as a dependent"
                desc="Most students under 19, or under 24 in school. It lowers your standard deduction."
                checked={p.dependent}
                onChange={(v) => setP({ dependent: v })}
              />
            </div>
          </div>
        </section>

        <section className="card span-7" aria-labelledby="h-stub">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 id="h-stub">Your pay stub</h2>
            <Seg label="Stub period" value={view} onChange={(v) => update({ stubView: v })}
              options={[{ value: 'check', label: 'Paycheck' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]} />
          </div>
          <div className="stub">
            <div className="stub-head">
              <span>Earnings statement · {TAX_YEAR}</span>
              {view === 'check' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="sr">Pay frequency</span>
                  <select className="input" style={{ height: 30, width: 'auto', fontSize: 13, background: 'transparent', borderColor: '#bcd4ee' }}
                    value={freq} onChange={(e) => update({ payFreq: Number(e.target.value) })}>
                    {PAY_FREQ.map((f) => <option key={f.value} value={f.value}>Paid {f.label.toLowerCase()}</option>)}
                  </select>
                </label>
              ) : <span>{view === 'month' ? 'Per month' : 'Per year'}</span>}
            </div>
            <div className="stub-line" style={{ fontWeight: 600 }}>
              <span>Gross pay</span><span className="num">{fmt(tax.gross / div, true)}</span>
            </div>
            {lines.map((l) => (
              <div className="stub-line minus" key={l.k}>
                <span>{l.k} <span className="m">· {l.m}</span></span>
                <span className="num v">−{fmt(l.v / div, true).replace('$', '$')}</span>
              </div>
            ))}
            <div className="stub-line total">
              <span>Take-home pay</span><span className="num">{fmt(tax.net / div, true)}</span>
            </div>
            <svg className="stub-edge" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 8 L0 0 L2.5 8 L5 0 L7.5 8 L10 0 L12.5 8 L15 0 L17.5 8 L20 0 L22.5 8 L25 0 L27.5 8 L30 0 L32.5 8 L35 0 L37.5 8 L40 0 L42.5 8 L45 0 L47.5 8 L50 0 L52.5 8 L55 0 L57.5 8 L60 0 L62.5 8 L65 0 L67.5 8 L70 0 L72.5 8 L75 0 L77.5 8 L80 0 L82.5 8 L85 0 L87.5 8 L90 0 L92.5 8 L95 0 L97.5 8 L100 0 L100 8 Z" fill="var(--surface)" />
            </svg>
          </div>
          <div className="tiles" style={{ marginTop: 18 }}>
            <div className="tile tint-grey"><div className="k">Effective rate</div><div className="v num">{pct(tax.effective)}</div><div className="s">all taxes ÷ gross pay</div></div>
            <div className="tile tint-blue"><div className="k">Federal bracket</div><div className="v num">{Math.round(tax.federalMarginal * 100)}%</div><div className="s">on your last dollar only</div></div>
            <div className="tile tint-teal"><div className="k">Taxable income</div><div className="v num">{fmt(tax.taxable)}</div><div className="s">after {fmt(tax.stdDeduction)} deduction</div></div>
          </div>
        </section>

        <section className="card span-12" aria-labelledby="h-why">
          <div className="card-head"><h2 id="h-why">Why these numbers</h2><span className="meta">Estimates for learning, not tax advice</span></div>
          <div className="grid" style={{ gap: 24 }}>
            <div className="span-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>The standard deduction</h3>
              <p className="card-note">
                The first {fmt(STANDARD_DEDUCTION[p.filing])} of a {p.filing === 'single' ? 'single' : p.filing === 'married' ? 'married couple’s' : 'head of household’s'} income is not taxed federally in {TAX_YEAR}.
                {p.dependent && ` As a dependent, yours is ${fmt(tax.stdDeduction)}: your earnings plus $450, up to the full amount.`}
                {tax.federal === 0 && tax.gross > 0 && ' You owe no federal income tax, so file a return to get back anything your employer withheld.'}
              </p>
            </div>
            <div className="span-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Brackets are not one rate</h3>
              <p className="card-note">
                Your {Math.round(tax.federalMarginal * 100)}% bracket applies only to the dollars inside it. A raise never lowers take-home pay; only the new dollars are taxed at the higher rate.
                That is why your effective rate, {pct(tax.effective)}, is lower than your bracket.
              </p>
            </div>
            <div className="span-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>FICA comes out of every check</h3>
              <p className="card-note">
                Social Security (6.2% up to {fmt(SS_WAGE_BASE)} of wages) and Medicare (1.45%) fund benefits you collect later. Your employer pays the same amount again on top of your wage.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
