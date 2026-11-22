# Payday — budget, taxes and an AI money coach

Turn a paycheck into a plan: estimate 2026 taxes, build a budget, track spending, plan goals and debt, and learn the basics with an AI coach. Built with Next.js; all user data stays in the browser (localStorage).

## What it does

| Screen | What it's for |
| --- | --- |
| **Home** | Where a month of pay goes (taxes / needs / wants / savings), what's left to spend this month, next steps. Type income in plain words ("$17 an hour, 20 hours a week", "52k a year") and the whole plan recalculates. |
| **Paycheck** | 2026 federal tax (brackets + standard deduction, dependent rule for teens), Social Security, Medicare, New Jersey or Pennsylvania state tax (or any custom rate), pre-tax 401(k). Shown as a pay stub per paycheck, month or year, with plain-language explanations. |
| **Budget** | Suggested plan from take-home pay and situation (living with family / roommates / alone, car or not) using 50/30/20 and the 30%-of-gross rent rule. Every category is editable; checks flag rent, savings and food problems. |
| **Spending** | Log purchases and see them against the plan, by month. |
| **Goals & investing** | Savings goals with the monthly amount needed; "start at 16 vs start at 26" compound-growth chart. |
| **Credit & debt** | Card/loan payoff with your payment vs minimum payments, interest saved, credit utilization. |
| **AI coach** | Chat with a Qwen model via OpenRouter. It receives the user's calculated numbers so answers use them; it detects an income in a message and offers to apply it. |
| **Learn & quiz** | Lessons on six areas (spending & saving, credit & debt, employment & income, investing, risk & insurance, decision making) and a 10-question quiz with an explanation after each answer. |

## Run locally

```bash
npm install
cp .env.example .env.local   # add your OpenRouter key
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

1. Push this folder to a GitHub repo (or run `npx vercel` inside it).
2. In Vercel, **Add New → Project**, import the repo. Framework: Next.js (auto-detected). No build settings to change.
3. **Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY` = your key from https://openrouter.ai/keys
   - `OPENROUTER_MODEL` (optional) = any OpenRouter model id, default `qwen/qwen3.6-35b-a3b`
4. Redeploy. Without the key, everything works except the coach, which says it isn't connected.

The key lives only on the server (`app/api/chat/route.js`); it is never sent to the browser.

## Notes

- Tax figures: IRS 2026 inflation adjustments (standard deduction $16,100 single / $32,200 joint / $24,150 head of household; brackets 10–37%), SSA 2026 wage base $184,500. Estimates for learning, not tax advice.
- Data never leaves the device except the questions sent to the coach. Settings → "Clear all data" resets the device.
