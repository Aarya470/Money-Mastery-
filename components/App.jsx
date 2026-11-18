'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../lib/store';
import { calcTaxes, STATES, PERIODS } from '../lib/tax';
import { suggestBudget, CATEGORIES, groupTotals } from '../lib/budget';
import { Icon, Mark, fmt } from './ui';
import Home from './screens/Home';
import Paycheck from './screens/Paycheck';
import Budget from './screens/Budget';
import Spending from './screens/Spending';
import Goals from './screens/Goals';
import Debt from './screens/Debt';
import Coach from './screens/Coach';
import Learn from './screens/Learn';
import Settings from './screens/Settings';

export const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'paycheck', label: 'Paycheck', icon: 'paycheck' },
  { id: 'budget', label: 'Budget', icon: 'budget' },
  { id: 'spending', label: 'Spending', icon: 'spending' },
  { id: 'goals', label: 'Goals & investing', icon: 'goals' },
  { id: 'debt', label: 'Credit & debt', icon: 'debt' },
  { id: 'coach', label: 'AI coach', icon: 'coach' },
  { id: 'learn', label: 'Learn & quiz', icon: 'learn' },
];
const PHONE_NAV = ['home', 'paycheck', 'budget', 'coach'];

function useHashRoute() {
  const [route, setRoute] = useState('home');
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace('#', '');
      setRoute(NAV.some((n) => n.id === h) || h === 'settings' ? h : 'home');
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const go = (id) => {
    if (window.location.hash !== `#${id}`) window.location.hash = id;
    window.scrollTo({ top: 0 });
  };
  return [route, go];
}

export function buildContext(state, tax, plan) {
  const p = state.profile;
  const inc = p.income;
  const incomeText = inc.period === 'hourly'
    ? `$${inc.amount}/hour × ${inc.hoursPerWeek} hours/week × ${inc.weeksPerYear} weeks`
    : `$${inc.amount} ${PERIODS[inc.period].label.toLowerCase()}`;
  const g = groupTotals(plan);
  const now = new Date();
  const month = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 7);
  const spent = {};
  for (const t of state.transactions) if (t.date.startsWith(month)) spent[t.cat] = (spent[t.cat] || 0) + t.amount;
  const lines = [
    state.name ? `Name: ${state.name}` : null,
    `Income: ${incomeText} = ${fmt(tax.gross)} gross per year`,
    `Filing: ${p.filing}${p.dependent ? ', can be claimed as a dependent' : ''}; state: ${STATES.find((s) => s.id === p.state)?.name}`,
    `2026 estimated taxes per year: federal income ${fmt(tax.federal)}, Social Security ${fmt(tax.ss)}, Medicare ${fmt(tax.medicare)}, state ${fmt(tax.state)}; pre-tax retirement ${fmt(tax.pretax)}`,
    `Take-home: ${fmt(tax.net)}/year, ${fmt(tax.monthlyNet)}/month; effective tax rate ${(tax.effective * 100).toFixed(1)}%, federal bracket ${Math.round(tax.federalMarginal * 100)}%`,
    `Living: ${state.situation.living === 'family' ? 'with family' : state.situation.living === 'roommates' ? 'with roommates' : 'on their own'}; car: ${state.situation.car ? 'yes' : 'no'}`,
    `Monthly plan: needs ${fmt(g.needs)}, wants ${fmt(g.wants)}, savings ${fmt(g.save)}`,
    `Plan by category: ${CATEGORIES.map((c) => `${c.name} ${fmt(plan[c.id] || 0)}`).join('; ')}`,
    Object.keys(spent).length ? `Spent this month: ${Object.entries(spent).map(([k, v]) => `${CATEGORIES.find((c) => c.id === k)?.name} ${fmt(v, true)}`).join('; ')}` : 'No spending logged this month yet.',
    state.goals.length ? `Goals: ${state.goals.map((x) => `${x.name} ${fmt(x.saved)} of ${fmt(x.target)} by ${x.date}`).join('; ')}` : null,
    `Card example: ${fmt(state.debt.balance)} at ${state.debt.apr}% APR, paying ${fmt(state.debt.payment)}/month`,
  ];
  return lines.filter(Boolean).join('\n');
}

export default function App() {
  const [state, update, reset] = useAppState();
  const [route, go] = useHashRoute();
  const [sheet, setSheet] = useState(false);

  const tax = useMemo(() => (state ? calcTaxes(state.profile) : null), [state?.profile]);
  const suggestion = useMemo(
    () => (state && tax ? suggestBudget(tax.monthlyNet, tax.monthlyGross, state.situation) : null),
    [tax, state?.situation]
  );
  const plan = state && (state.planEdited && state.plan ? state.plan : suggestion?.plan);

  if (!state || !tax) return <div className="shell" aria-busy="true" />;

  const ctx = { state, update, reset, tax, plan, suggestion, go };
  const Screen = { home: Home, paycheck: Paycheck, budget: Budget, spending: Spending, goals: Goals, debt: Debt, coach: Coach, learn: Learn, settings: Settings }[route] || Home;

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <a href="#home" aria-label="Payday home"><Mark /></a>
        {NAV.map((n, i) => (
          <div key={n.id} style={{ display: 'contents' }}>
            {(i === 3 || i === 6) && <div className="rail-sep" />}
            <button className="rail-btn" aria-label={n.label} aria-current={route === n.id ? 'page' : undefined} onClick={() => go(n.id)}>
              <Icon name={n.icon} />
              <span className="tip">{n.label}</span>
            </button>
          </div>
        ))}
        <div className="rail-spacer" />
        <button className="rail-btn" aria-label="Settings" aria-current={route === 'settings' ? 'page' : undefined} onClick={() => go('settings')}>
          <Icon name="settings" />
          <span className="tip">Settings</span>
        </button>
      </nav>

      <main className="canvas">
        <div className="page">
          <div className="product">
            <Mark size={22} /> <b>Payday</b>
            <span>· {state.chapter ? `${state.chapter} DECA` : 'DECA Financial Literacy'}</span>
          </div>
          <div className="screen" key={route}>
            <Screen {...ctx} />
          </div>
        </div>
      </main>

      <nav className="bottom-bar" aria-label="Main">
        {PHONE_NAV.map((id) => {
          const n = NAV.find((x) => x.id === id);
          return (
            <button key={id} aria-current={route === id ? 'page' : undefined} onClick={() => go(id)}>
              <Icon name={n.icon} size={20} />
              {n.label === 'AI coach' ? 'Coach' : n.label}
            </button>
          );
        })}
        <button aria-current={!PHONE_NAV.includes(route) ? 'page' : undefined} onClick={() => setSheet(true)} aria-haspopup="dialog">
          <Icon name="more" size={20} />
          More
        </button>
      </nav>
      {sheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-label="More screens">
            {[...NAV.filter((n) => !PHONE_NAV.includes(n.id)), { id: 'settings', label: 'Settings', icon: 'settings' }].map((n) => (
              <button key={n.id} onClick={() => { setSheet(false); go(n.id); }}>
                <Icon name={n.icon} /> {n.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
