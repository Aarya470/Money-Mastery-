'use client';
import { useEffect, useState, useCallback } from 'react';

const KEY = 'payday.v1';

export const DEFAULT_STATE = {
  name: '',
  chapter: '',
  profile: {
    income: { amount: 16, period: 'hourly', hoursPerWeek: 15, weeksPerYear: 50 },
    filing: 'single',
    dependent: true,
    state: 'NJ',
    customStateRate: 4,
    pretaxPct: 0,
  },
  situation: { living: 'family', car: false },
  plan: null, // filled from the suggestion on first load
  planEdited: false,
  transactions: [],
  goals: [],
  debt: { balance: 1200, apr: 24.99, payment: 75 },
  invest: { monthly: 50, rate: 7, years: 44, delay: 10 },
  quiz: { attempts: [] },
  chat: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...saved,
      profile: { ...DEFAULT_STATE.profile, ...saved.profile, income: { ...DEFAULT_STATE.profile.income, ...saved.profile?.income } },
      situation: { ...DEFAULT_STATE.situation, ...saved.situation },
      debt: { ...DEFAULT_STATE.debt, ...saved.debt },
      invest: { ...DEFAULT_STATE.invest, ...saved.invest },
      quiz: { ...DEFAULT_STATE.quiz, ...saved.quiz },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  const [state, setState] = useState(null);
  useEffect(() => setState(load()), []);
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [state]);
  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);
  const reset = useCallback(() => setState({ ...DEFAULT_STATE }), []);
  return [state, update, reset];
}
