'use client';
import { useId } from 'react';

export const fmt = (n, cents = false) =>
  (n < 0 ? '−' : '') +
  '$' +
  Math.abs(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
export const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`;

export function Money({ value, big }) {
  const v = Math.abs(value || 0);
  const whole = Math.floor(v + 1e-9);
  const c = Math.round((v - whole) * 100);
  const w = c === 100 ? whole + 1 : whole;
  return (
    <span className={big ? 'figure num' : 'num'}>
      {value < 0 ? '−' : ''}${w.toLocaleString('en-US')}
      <span className="cents">.{String(c === 100 ? 0 : c).padStart(2, '0')}</span>
    </span>
  );
}

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  paycheck: <><path d="M5 3h14v18l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5L5 21z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  budget: <><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6.4 6.4" /></>,
  spending: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M7 15h4" /></>,
  goals: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  debt: <><path d="M4 19 10 13l4 4 6-8" /><path d="M15 9h5v5" /></>,
  coach: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8.5 9.5h7M8.5 12.5h4" /></>,
  learn: <><path d="M3 7l9-4 9 4-9 4z" /><path d="M7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9" /><path d="M21 7v6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  send: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function Mark({ size = 34 }) {
  // A pay stub with a torn edge, in the accent.
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-label="Payday" role="img" className="mark">
      <rect width="34" height="34" rx="10" fill="var(--accent)" />
      <path d="M10 8h14v17l-2.33-1.5L19.33 25 17 23.5 14.67 25l-2.34-1.5L10 25z" fill="#fff" />
      <path d="M13.5 12.5h7M13.5 16h7M13.5 19.5h4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>
        {label} {hint && <span className="hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function MoneyInput({ value, onChange, step = 1, ...rest }) {
  return (
    <div className="money-input">
      <input
        className="input num"
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value === 0 ? 0 : value || ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        {...rest}
      />
    </div>
  );
}

export function NumInput({ value, onChange, suffix, step = 1, min = 0, max, ...rest }) {
  return (
    <div className="suffix-input">
      <input
        className="input num"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value === 0 ? 0 : value || ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        {...rest}
      />
      {suffix && <i>{suffix}</i>}
    </div>
  );
}

export function Seg({ value, options, onChange, label, full }) {
  return (
    <div className={`seg ${full ? 'full' : ''}`} role="group" aria-label={label} style={full ? { gridTemplateColumns: `repeat(${options.length}, 1fr)` } : undefined}>
      {options.map((o) => (
        <button type="button" key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ title, desc, checked, onChange }) {
  const id = useId();
  return (
    <label className="switch" htmlFor={id}>
      <span>
        <span className="t">{title}</span>
        {desc && <span className="d" style={{ display: 'block' }}>{desc}</span>}
      </span>
      <input id={id} className="toggle" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Bar({ value, max, tone }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`bar ${tone || ''}`} role="presentation">
      <i style={{ width: `${w}%` }} />
    </div>
  );
}

const niceStep = (v) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
};

const short = (n) => {
  if (n >= 1e6) return `$${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `$${+(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`;
  return `$${Math.round(n)}`;
};

// Lines: [{ values, color, width, dash }]. xLabel(i) gives a tick label.
export function LineChart({ series, xLabels, height = 240, ariaLabel, annotate }) {
  const W = 720;
  const H = height;
  const L = 52, R = 16, T = 12, B = 28;
  const n = Math.max(...series.map((s) => s.values.length));
  const top = Math.max(1, ...series.flatMap((s) => s.values));
  const stepY = niceStep(top / 4);
  const max = stepY * Math.ceil(top / stepY);
  const x = (i) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: Math.round(max / stepY) + 1 }, (_, i) => i * stepY);
  const xt = xLabels ? xLabels.map((l, i) => [i, l]).filter(([, l]) => l != null) : [];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel} style={{ height: 'auto', display: 'block' }}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid-line" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end">{short(t)}</text>
        </g>
      ))}
      {xt.map(([i, l]) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{l}</text>
      ))}
      {series.map((s, si) => (
        <polyline key={si} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round"
          points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      ))}
      {annotate?.map((a, i) => (
        <g key={i}>
          <circle cx={x(a.i)} cy={y(a.v)} r="4" fill={a.color} />
          <text x={x(a.i) - 8} y={y(a.v) - 10} textAnchor="end" style={{ fill: 'var(--text)', fontWeight: 600 }}>{a.label}</text>
        </g>
      ))}
    </svg>
  );
}
