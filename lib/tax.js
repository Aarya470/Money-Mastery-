// 2026 tax year figures (returns filed in 2027).
// Sources: IRS inflation adjustments announced Oct 9, 2025 (standard deduction, brackets);
// SSA announcement Oct 24, 2025 (Social Security wage base $184,500).
// These are estimates for learning and planning, not tax advice.

export const TAX_YEAR = 2026;

export const STANDARD_DEDUCTION = { single: 16100, married: 32200, head: 24150 };

// Upper bound of each bracket (taxable income), rate.
export const FEDERAL_BRACKETS = {
  single: [
    [12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24],
    [256225, 0.32], [640600, 0.35], [Infinity, 0.37],
  ],
  married: [
    [24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24],
    [512450, 0.32], [768700, 0.35], [Infinity, 0.37],
  ],
  head: [
    [17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24],
    [256200, 0.32], [640600, 0.35], [Infinity, 0.37],
  ],
};

export const SS_RATE = 0.062;
export const SS_WAGE_BASE = 184500;
export const MEDICARE_RATE = 0.0145;
export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD = 200000; // employer withholding threshold

// Dependent filer (e.g. a teen a parent can claim): standard deduction is the greater of
// $1,350 or earned income + $450, capped at the normal standard deduction.
export const DEPENDENT_MIN = 1350;
export const DEPENDENT_ADD = 450;

// New Jersey gross income tax brackets (wages), with $1,000 personal exemption.
const NJ_BRACKETS = {
  single: [
    [20000, 0.014], [35000, 0.0175], [40000, 0.035], [75000, 0.05525],
    [500000, 0.0637], [1000000, 0.0897], [Infinity, 0.1075],
  ],
  married: [
    [20000, 0.014], [50000, 0.0175], [70000, 0.0245], [80000, 0.035],
    [150000, 0.05525], [500000, 0.0637], [1000000, 0.0897], [Infinity, 0.1075],
  ],
};
NJ_BRACKETS.head = NJ_BRACKETS.married;

export const STATES = [
  { id: 'NJ', name: 'New Jersey' },
  { id: 'PA', name: 'Pennsylvania (3.07% flat)' },
  { id: 'NONE', name: 'No state income tax (TX, FL, WA, NV, TN, SD, WY, AK, NH)' },
  { id: 'CUSTOM', name: 'Another state (enter an estimated rate)' },
];

export const PERIODS = {
  hourly: { label: 'Per hour', perYear: null },
  weekly: { label: 'Per week', perYear: 52 },
  biweekly: { label: 'Every two weeks', perYear: 26 },
  semimonthly: { label: 'Twice a month', perYear: 24 },
  monthly: { label: 'Per month', perYear: 12 },
  annual: { label: 'Per year', perYear: 1 },
};

export function progressive(amount, brackets) {
  let tax = 0;
  let lower = 0;
  let marginal = brackets[0][1];
  for (const [upper, rate] of brackets) {
    if (amount <= lower) break;
    const slice = Math.min(amount, upper) - lower;
    tax += slice * rate;
    marginal = rate;
    lower = upper;
  }
  return { tax, marginal: amount > 0 ? marginal : 0 };
}

export function annualFromIncome(income) {
  const amount = Number(income.amount) || 0;
  if (income.period === 'hourly') {
    const hours = Number(income.hoursPerWeek) || 0;
    const weeks = Number(income.weeksPerYear) || 52;
    return amount * hours * weeks;
  }
  return amount * (PERIODS[income.period]?.perYear ?? 1);
}

export function calcTaxes(profile) {
  const gross = Math.max(0, annualFromIncome(profile.income));
  const filing = profile.filing || 'single';
  const pretax = Math.min(gross, Math.max(0, Number(profile.pretaxPct) || 0) / 100 * gross);

  let stdDeduction = STANDARD_DEDUCTION[filing];
  if (profile.dependent) {
    stdDeduction = Math.min(stdDeduction, Math.max(DEPENDENT_MIN, gross + DEPENDENT_ADD));
  }
  const taxable = Math.max(0, gross - pretax - stdDeduction);
  const fed = progressive(taxable, FEDERAL_BRACKETS[filing]);

  const ss = Math.min(gross, SS_WAGE_BASE) * SS_RATE;
  const medicare = gross * MEDICARE_RATE + Math.max(0, gross - ADDL_MEDICARE_THRESHOLD) * ADDL_MEDICARE_RATE;

  let state = 0;
  let stateMarginal = 0;
  const stateWages = gross - pretax;
  if (profile.state === 'NJ') {
    const exemption = filing === 'married' ? 2000 : 1000;
    const r = progressive(Math.max(0, gross - exemption), NJ_BRACKETS[filing]); // NJ doesn't exclude 401(k)
    state = r.tax;
    stateMarginal = r.marginal;
  } else if (profile.state === 'PA') {
    state = gross * 0.0307; // PA taxes 401(k) contributions too
    stateMarginal = 0.0307;
  } else if (profile.state === 'CUSTOM') {
    stateMarginal = Math.max(0, Number(profile.customStateRate) || 0) / 100;
    state = stateWages * stateMarginal;
  }

  const totalTax = fed.tax + ss + medicare + state;
  const net = gross - pretax - totalTax;
  return {
    gross,
    pretax,
    stdDeduction,
    taxable,
    federal: fed.tax,
    federalMarginal: fed.marginal,
    ss,
    medicare,
    state,
    stateMarginal,
    totalTax,
    net,
    effective: gross > 0 ? totalTax / gross : 0,
    monthlyGross: gross / 12,
    monthlyNet: net / 12,
  };
}

// Reads amounts like "$18/hr for 20 hours a week", "52k a year", "$2,100 a month".
export function parseIncome(text) {
  if (!text) return null;
  const t = text.toLowerCase().replace(/,/g, '');
  const m = t.match(/\$?\s*(\d+(?:\.\d+)?)\s*(k\b|thousand)?\s*(?:dollars?)?\s*(?:an?|per|\/|each|every)?\s*(hour|hr|h\b|week|wk|two weeks|2 weeks|biweekly|month|mo\b|year|yr|annual|annually)?/);
  if (!m) return null;
  let amount = parseFloat(m[1]);
  if (m[2]) amount *= 1000;
  const unit = m[3] || '';
  let period = amount >= 15000 ? 'annual' : amount >= 400 ? 'monthly' : 'hourly';
  if (/hour|hr|^h$/.test(unit)) period = 'hourly';
  else if (/two weeks|2 weeks|biweekly/.test(unit)) period = 'biweekly';
  else if (/week|wk/.test(unit)) period = 'weekly';
  else if (/month|mo/.test(unit)) period = 'monthly';
  else if (/year|yr|annual/.test(unit)) period = 'annual';
  if (amount <= 0) return null;
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|h)\s*(?:a|per|\/|each)?\s*(?:week|wk)/);
  return { amount, period, hoursPerWeek: hours ? parseFloat(hours[1]) : undefined };
}
