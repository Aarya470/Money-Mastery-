'use client';
import { CATEGORIES, GROUPS, groupTotals, sumPlan } from '../../lib/budget';
import { fmt, pct, MoneyInput, Seg, Switch, Bar, Icon } from '../ui';

const TARGET = { needs: 0.5, wants: 0.3, save: 0.2 };

export default function Budget({ state, update, tax, plan, suggestion, go }) {
  const net = Math.round(tax.monthlyNet);
  const total = sumPlan(plan);
  const diff = net - total;
  const g = groupTotals(plan);

  const setAmount = (id, v) =>
    update((s) => ({ plan: { ...(s.planEdited && s.plan ? s.plan : plan), [id]: v }, planEdited: true }));
  const setSituation = (patch) => update((s) => ({ situation: { ...s.situation, ...patch }, planEdited: false }));
  const useSuggested = () => update({ plan: null, planEdited: false });

  const checks = [];
  if (plan.housing > 0.3 * tax.monthlyGross)
    checks.push({ tone: 'warn', text: `Rent is ${pct(plan.housing / tax.monthlyGross, 0)} of gross pay. The usual ceiling is 30%, about ${fmt(0.3 * tax.monthlyGross)}.` });
  if (g.save < 0.1 * net && net > 0)
    checks.push({ tone: 'warn', text: `Savings are ${pct(g.save / net, 0)} of take-home. Aim for at least 10%, then work toward 20%.` });
  if (state.situation.living !== 'family' && plan.groceries < 250)
    checks.push({ tone: 'warn', text: 'Groceries under $250 a month is hard for one adult cooking at home.' });
  if (suggestion?.tight && !state.planEdited)
    checks.push({ tone: 'warn', text: 'Needs take most of this income. Roommates, a cheaper commute, or more hours would give you room to save.' });
  if (!checks.length) checks.push({ tone: 'pos', text: 'Rent, savings and food are all within common guidelines.' });

  const groups = ['needs', 'wants', 'save'];

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Monthly budget</h1>
          <p className="finding">
            {diff === 0 && <>All <strong>{fmt(net)}</strong> of take-home has a job.</>}
            {diff > 0 && <><strong>{fmt(diff)}</strong> of your {fmt(net)} take-home is not assigned yet.</>}
            {diff < 0 && <>This plan spends <strong style={{ color: 'var(--negative)' }}>{fmt(-diff)} more</strong> than your {fmt(net)} take-home.</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {state.planEdited && <button className="btn" onClick={useSuggested}>Use suggested plan</button>}
          <button className="btn primary" onClick={() => { update({ coachPrompt: 'Look at my budget. What is one change that would help me most, and why?' }); go('coach'); }}>
            <Icon name="coach" /> Review my budget
          </button>
        </div>
      </div>

      <div className="grid">
        <section className="card span-8" aria-labelledby="h-plan">
          <div className="card-head">
            <h2 id="h-plan">Plan for each month</h2>
            <span className="meta num">{fmt(total)} of {fmt(net)}</span>
          </div>
          {groups.map((gid) => (
            <div key={gid} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 4px' }}>
                <span className={`pill tint-${GROUPS[gid].tint}`}>{GROUPS[gid].label}</span>
                <span className="num label">{fmt(g[gid])} · {net ? pct(g[gid] / net, 0) : '—'}</span>
              </div>
              <div className="rows">
                {CATEGORIES.filter((c) => c.group === gid).map((c) => (
                  <div className="row" key={c.id} style={{ minHeight: 56 }}>
                    <span className="grow">
                      <span className="title">{c.name}</span>
                      <span className="sub" style={{ display: 'block' }}>
                        {net ? pct((plan[c.id] || 0) / net, 0) : '—'} of take-home
                        {suggestion && state.planEdited && suggestion.plan[c.id] !== plan[c.id] ? ` · suggested ${fmt(suggestion.plan[c.id])}` : ''}
                      </span>
                    </span>
                    <div style={{ width: 130 }}>
                      <MoneyInput value={plan[c.id] || 0} step={5} onChange={(v) => setAmount(c.id, v)} aria-label={`${c.name} per month`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="span-4 stack">
          <section className="card" aria-labelledby="h-sit">
            <div className="card-head"><h2 id="h-sit">Your situation</h2></div>
            <div className="field" style={{ marginBottom: 16 }}>
              <span>Where you live</span>
              <Seg full label="Where you live" value={state.situation.living} onChange={(v) => setSituation({ living: v })}
                options={[{ value: 'family', label: 'With family' }, { value: 'roommates', label: 'Roommates' }, { value: 'own', label: 'On my own' }]} />
            </div>
            <Switch title="I have a car" desc="Gas, insurance and upkeep" checked={state.situation.car} onChange={(v) => setSituation({ car: v })} />
            <p className="fine" style={{ marginTop: 14 }}>Changing these rebuilds the suggested plan.</p>
          </section>

          <section className="card" aria-labelledby="h-503020">
            <div className="card-head"><h2 id="h-503020">Against 50 / 30 / 20</h2></div>
            {groups.map((gid) => {
              const share = net ? g[gid] / net : 0;
              return (
                <div key={gid} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{GROUPS[gid].label}</span>
                    <span className="num" style={{ color: 'var(--muted)' }}>{pct(share, 0)} <span>· aim {pct(TARGET[gid], 0)}</span></span>
                  </div>
                  <div className="bar"><i style={{ width: `${Math.min(100, share * 100)}%`, background: `var(--${GROUPS[gid].tint}-mark)` }} /></div>
                </div>
              );
            })}
          </section>

          <section className="card" aria-labelledby="h-checks">
            <div className="card-head"><h2 id="h-checks">Checks</h2></div>
            <div className="stack" style={{ gap: 10 }}>
              {checks.map((c, i) => (
                <div key={i} className="notice" style={{ background: c.tone === 'pos' ? 'var(--pill-positive-bg)' : 'var(--pill-warning-bg)', color: c.tone === 'pos' ? 'var(--pill-positive-ink)' : 'var(--pill-warning-ink)' }}>{c.text}</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
