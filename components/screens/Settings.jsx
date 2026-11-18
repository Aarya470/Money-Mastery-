'use client';
import { useState } from 'react';
import { Field } from '../ui';

export default function Settings({ state, update, reset }) {
  const [confirm, setConfirm] = useState(false);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payday-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Settings</h1>
          <p className="finding">Everything you enter stays in this browser. Nothing is sent anywhere except the questions you ask the coach.</p>
        </div>
      </div>
      <div className="grid">
        <section className="card span-6" aria-labelledby="h-you">
          <div className="card-head"><h2 id="h-you">You and your chapter</h2></div>
          <div className="form-grid">
            <Field label="First name" hint="optional"><input className="input" value={state.name} onChange={(e) => update({ name: e.target.value })} maxLength={40} /></Field>
            <Field label="DECA chapter" hint="shown in the header"><input className="input" value={state.chapter} onChange={(e) => update({ chapter: e.target.value })} maxLength={60} placeholder="Your high school" /></Field>
          </div>
        </section>
        <section className="card span-6" aria-labelledby="h-data">
          <div className="card-head"><h2 id="h-data">Your data</h2></div>
          <p className="card-note" style={{ marginBottom: 16 }}>Download a copy, or clear everything to hand this device to the next person.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={exportJson}>Download my data</button>
            {!confirm ? (
              <button className="btn" onClick={() => setConfirm(true)}>Clear all data</button>
            ) : (
              <button className="btn" style={{ borderColor: 'var(--negative)', color: 'var(--negative)' }} onClick={() => { reset(); setConfirm(false); }}>Yes, clear everything</button>
            )}
          </div>
        </section>
        <section className="card span-12" aria-labelledby="h-about">
          <div className="card-head"><h2 id="h-about">About the numbers</h2></div>
          <p className="card-note">
            Taxes use 2026 federal rules: standard deduction $16,100 single, $32,200 married and $24,150 head of household, the seven 2026 brackets, Social Security at 6.2% up to $184,500 and Medicare at 1.45%.
            New Jersey and Pennsylvania use their state rates; other states use the rate you enter. Results are estimates for learning and planning, not tax, legal or investment advice.
            Budget suggestions start from the 50/30/20 guideline and keep rent at or under 30% of gross pay.
          </p>
        </section>
      </div>
    </>
  );
}
