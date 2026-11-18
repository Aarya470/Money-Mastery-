// AI coach: proxies to Groq or OpenRouter (Qwen by default) and streams plain text back.
// In Vercel (Project → Settings → Environment Variables) set ONE of:
//   GROQ_API_KEY        → uses Groq, model openai/gpt-oss-120b (override with GROQ_MODEL)
//   OPENROUTER_API_KEY  → uses OpenRouter (override model with OPENROUTER_MODEL)

export const maxDuration = 60;

function provider() {
  if (process.env.GROQ_API_KEY) {
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    // gpt-oss reasons in a separate field: keep it short. Qwen3: turn thinking off.
    const extra = model.startsWith('openai/gpt-oss')
      ? { reasoning_effort: 'low', max_completion_tokens: 1500 }
      : model.startsWith('qwen/')
        ? { reasoning_effort: 'none', max_completion_tokens: 900 }
        : { max_completion_tokens: 900 };
    return {
      key: process.env.GROQ_API_KEY,
      url: `${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`,
      model,
      extra,
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      key: process.env.OPENROUTER_API_KEY,
      url: `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
      model: process.env.OPENROUTER_MODEL || 'qwen/qwen3.6-35b-a3b',
      extra: { max_tokens: 900, reasoning: { exclude: true } },
    };
  }
  return null;
}

const SYSTEM = `You are Payday Coach, a friendly financial literacy coach inside a budgeting app built by high school DECA students.
Your users are mostly teens and young adults with a first job, a part-time job, or a first full-time salary.

How to answer:
- Be warm, clear and short: usually 3 to 7 sentences or a short list. Plain words; explain any term you use.
- Use the user's numbers from the APP CONTEXT when they are given. The app has already calculated taxes and the budget with 2026 federal rules; trust those figures rather than recalculating them, and quote them in dollars.
- When the user gives a new income, say what the app's Paycheck screen will show and suggest they enter it there.
- Give general education, not personalized legal, tax or investment advice. Never recommend a specific stock, crypto coin, or product. For complex tax situations, suggest a parent, school counselor, or a free VITA tax site.
- Cover the six areas when relevant: spending and saving, credit and debt, employment and income, investing, risk and insurance, and financial decision making.
- If something looks like a scam or a risky choice (payday loans, gift-card payments, "get rich quick"), say so plainly.
- Format with short paragraphs or "- " bullets. No tables, no headings, no emoji.

Facts for 2026 (use these, not older years' numbers):
- Standard deduction: $16,100 single, $32,200 married filing jointly, $24,150 head of household. A dependent's is the greater of $1,350 or earned income + $450, up to the normal amount.
- Federal brackets (single): 10% to $12,400, 12% to $50,400, 22% to $105,700, 24% to $201,775, 32% to $256,225, 35% to $640,600, 37% above.
- FICA: Social Security 6.2% on wages up to $184,500; Medicare 1.45%.
- IRA limit: $7,500 a year (traditional and Roth combined), and never more than your earned income (gross pay, not take-home). Roth contributions are after-tax money you deposit yourself into an account you open; they are not a paycheck deduction.
- 401(k) employee limit: $24,500.

What the app does (only describe features that exist; never invent buttons or screens):
- Paycheck: income, filing status, dependent switch, state (NJ, PA, no-tax, or a custom rate), and a pre-tax 401(k) percentage. It has no Roth IRA input.
- Budget: monthly plan by category (rent, utilities, phone, groceries, transport, insurance, emergency fund, goals & investing, eating out & fun, shopping, subscriptions, giving); each amount is editable.
- Spending: log purchases against the plan. Goals & investing: savings goals and a start-now-vs-later growth chart. Credit & debt: payoff calculator. Learn & quiz: lessons and a quiz.
- When suggesting a dollar amount for a category, start from the user's own plan amount in APP CONTEXT and explain whether to raise or lower it.`;

// Text safe to show so far: removes <think>…</think> reasoning that some Qwen models
// inline, hides an unfinished reasoning block, and holds back a tag that is still arriving.
function visible(text) {
  let t = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  const open = t.indexOf('<think>');
  if (open !== -1) t = t.slice(0, open);
  const lt = t.lastIndexOf('<');
  if (lt !== -1 && '<think>'.startsWith(t.slice(lt))) t = t.slice(0, lt);
  return t.replace(/^\s+/, '');
}

export async function POST(req) {
  const ai = provider();
  if (!ai) {
    return new Response('The AI coach is not connected yet. Add GROQ_API_KEY (or OPENROUTER_API_KEY) to the app’s environment variables in Vercel, then redeploy.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const history = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const messages = [
    { role: 'system', content: SYSTEM },
    ...(body.context ? [{ role: 'system', content: `APP CONTEXT (the user's current numbers):\n${String(body.context).slice(0, 4000)}` }] : []),
    ...history
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  ];

  const call = (extra) =>
    fetch(ai.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ai.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://payday.vercel.app',
        'X-Title': 'Payday (DECA Financial Literacy)',
      },
      body: JSON.stringify({ model: ai.model, messages, stream: true, temperature: 0.5, ...extra }),
    });

  let upstream = await call(ai.extra);
  // Some models reject the reasoning options; retry once with only a token limit.
  if (upstream.status === 400) {
    upstream = await call({ max_tokens: 900 });
  }

  if (upstream.status === 429) {
    const wait = Number(upstream.headers.get('retry-after')) || 20;
    return new Response(`Lots of questions at once, and the free AI plan has a per-minute limit. Try again in about ${Math.min(60, Math.ceil(wait))} seconds.`, {
      status: 429,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new Response(`The coach could not answer right now (${upstream.status}). ${text.slice(0, 200)}`, {
      status: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let raw = '';
  let sent = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const data = t.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              raw += JSON.parse(data).choices?.[0]?.delta?.content || '';
              const shown = visible(raw);
              if (shown.length > sent) {
                controller.enqueue(encoder.encode(shown.slice(sent)));
                sent = shown.length;
              }
            } catch {
              /* keep-alive comments and partial lines */
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
