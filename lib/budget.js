// Budget suggestions built from take-home pay and the person's situation.
// Guidelines used: 50/30/20 (needs / wants / savings) as a starting split;
// housing at or under 30% of gross pay; food cooked mostly at home.

export const GROUPS = {
  needs: { label: 'Needs', tint: 'blue' },
  wants: { label: 'Wants', tint: 'amber' },
  save: { label: 'Savings', tint: 'teal' },
};

export const CATEGORIES = [
  { id: 'housing', name: 'Rent & housing', group: 'needs' },
  { id: 'utilities', name: 'Utilities & internet', group: 'needs' },
  { id: 'phone', name: 'Phone', group: 'needs' },
  { id: 'groceries', name: 'Groceries', group: 'needs' },
  { id: 'transport', name: 'Gas, car & transit', group: 'needs' },
  { id: 'insurance', name: 'Insurance & health', group: 'needs' },
  { id: 'emergency', name: 'Emergency fund', group: 'save' },
  { id: 'goals', name: 'Goals & investing', group: 'save' },
  { id: 'dining', name: 'Eating out & fun', group: 'wants' },
  { id: 'shopping', name: 'Clothes & shopping', group: 'wants' },
  { id: 'subs', name: 'Subscriptions', group: 'wants' },
  { id: 'giving', name: 'Gifts & giving', group: 'wants' },
];

export const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const r5 = (n) => Math.max(0, Math.round(n / 5) * 5);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function suggestBudget(net, gross, situation) {
  const living = situation.living || 'family';
  const car = !!situation.car;
  const own = living !== 'family';
  const a = {};

  if (own) {
    const share = living === 'roommates' ? 0.55 : 1;
    a.housing = Math.min(0.3 * gross, 0.38 * net);
    a.utilities = clamp(0.05 * net * share + 40, 60, 260);
    a.groceries = clamp(0.12 * net, 300, 550);
    a.insurance = clamp(0.05 * net, 40, 400);
  } else {
    a.housing = 0;
    a.utilities = 0;
    a.groceries = clamp(0.06 * net, 0, 150);
    a.insurance = 0;
  }
  a.phone = net > 0 ? clamp(0.04 * net, 15, 50) : 0;
  a.transport = car ? clamp(0.12 * net, 80, 550) : clamp(0.03 * net, 0, 90);

  const saveRate = own ? 0.2 : 0.35;
  let save = saveRate * net;
  const needs = a.housing + a.utilities + a.groceries + a.insurance + a.phone + a.transport;
  let left = net - needs - save;
  let tight = false;
  if (left < 0.1 * net) {
    // Needs are crowding out everything: keep at least 5% saving and say so.
    save = Math.max(0.05 * net, net - needs - 0.1 * net);
    left = net - needs - save;
    tight = true;
  }
  a.emergency = save * 0.5;
  a.goals = save * 0.5;
  // Wants get what is left, up to 30% of take-home; anything beyond that is saved.
  const wantsPool = Math.min(left, 0.3 * net);
  a.subs = clamp(wantsPool * 0.12, 0, 30);
  a.giving = wantsPool * 0.08;
  a.shopping = wantsPool * 0.3;
  const diningCap = r5(wantsPool - a.subs - a.giving - a.shopping);

  const plan = {};
  for (const c of CATEGORIES) plan[c.id] = r5(a[c.id] || 0);
  plan.dining = 0;
  // The rest goes to eating out & fun up to its share, then to goals,
  // so the plan always adds up to take-home pay exactly.
  const assigned = Object.values(plan).reduce((s, v) => s + v, 0);
  const rest = Math.round(net) - assigned;
  plan.dining = Math.max(0, Math.min(rest, diningCap));
  plan.goals += Math.max(0, rest - plan.dining);
  if (rest < 0) tight = true;
  return { plan, tight };
}

export function sumPlan(plan) {
  return Object.values(plan).reduce((s, v) => s + (Number(v) || 0), 0);
}

export function groupTotals(plan) {
  const t = { needs: 0, wants: 0, save: 0 };
  for (const c of CATEGORIES) t[c.group] += Number(plan[c.id]) || 0;
  return t;
}

// Loan / credit card payoff. Returns months and total interest, or null if it never pays off.
export function payoff(balance, apr, payment) {
  const r = apr / 100 / 12;
  let b = balance;
  let months = 0;
  let interest = 0;
  const series = [b];
  while (b > 0.005 && months < 600) {
    const i = b * r;
    if (payment <= i) return null;
    interest += i;
    b = b + i - payment;
    months++;
    series.push(Math.max(0, b));
  }
  return { months, interest, series };
}

// Minimum payment model used by many cards: interest + 1% of balance, at least $25.
export function minimumPayoff(balance, apr) {
  const r = apr / 100 / 12;
  let b = balance;
  let months = 0;
  let interest = 0;
  const series = [b];
  while (b > 0.005 && months < 600) {
    const i = b * r;
    const pay = Math.min(b + i, Math.max(25, i + 0.01 * b));
    interest += i;
    b = b + i - pay;
    months++;
    series.push(Math.max(0, b));
  }
  return { months, interest, series };
}

// Future value of monthly contributions, compounded monthly. Returns year-end balances.
export function growth(monthly, ratePct, years, startDelayYears = 0, initial = 0) {
  const r = ratePct / 100 / 12;
  const out = [];
  let b = initial;
  let contributed = initial;
  for (let y = 0; y <= years; y++) {
    out.push({ year: y, balance: b, contributed });
    if (y === years) break;
    for (let m = 0; m < 12; m++) {
      b *= 1 + r;
      if (y >= startDelayYears) {
        b += monthly;
        contributed += monthly;
      }
    }
  }
  return out;
}

export function monthsBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}
