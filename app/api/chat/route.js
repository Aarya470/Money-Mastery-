// AI coach: proxies to Groq or OpenRouter (Qwen by default) and streams plain text back.
// In Vercel (Project → Settings → Environment Variables) set ONE of:
//   GROQ_API_KEY        → uses Groq, model qwen/qwen3-32b (override with GROQ_MODEL)
//   OPENROUTER_API_KEY  → uses OpenRouter (override model with OPENROUTER_MODEL)

export const maxDuration = 60;

function provider() {
  if (process.env.GROQ_API_KEY) {
    return {
      key: process.env.GROQ_API_KEY,
      url: `${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`,
      model: process.env.GROQ_MODEL || 'qwen/qwen3-32b',
      // Qwen3 on Groq: turn off thinking so answers start right away.
      extra: { reasoning_effort: 'none', max_completion_tokens: 900 },
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
- Format with short paragraphs or "- " bullets. No tables, no headings, no emoji.`;

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
  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = [
    { role: 'system', content: SYSTEM },
    ...(body.context ? [{ role: 'system', content: `APP CONTEXT (the user's current numbers):\n${String(body.context).slice(0, 4000)}` }] : []),
    ...history
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
  ];

  const upstream = await fetch(ai.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ai.key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://payday.vercel.app',
      'X-Title': 'Payday (DECA Financial Literacy)',
    },
    body: JSON.stringify({
      model: ai.model,
      messages,
      stream: true,
      temperature: 0.5,
      ...ai.extra,
    }),
  });

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
  let inThink = false;

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
              let delta = JSON.parse(data).choices?.[0]?.delta?.content || '';
              // Some Qwen variants inline their reasoning in <think> tags; drop it.
              if (delta.includes('<think>')) { inThink = true; delta = delta.split('<think>')[0]; }
              if (inThink) {
                const end = delta.indexOf('</think>');
                if (end === -1) continue;
                inThink = false;
                delta = delta.slice(end + 8);
              }
              if (delta) controller.enqueue(encoder.encode(delta));
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
