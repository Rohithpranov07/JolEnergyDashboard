// AI backend for the Insights module, powered by Sarvam AI.
//
// The client (AIInsights.jsx) speaks an Anthropic-style contract:
//   - narrative: POST { type:"narrative", system, messages, maxTokens } -> { text }
//   - chat:      POST { type:"chat", ... } -> SSE of { type:"content_block_delta",
//                delta:{ type:"text_delta", text } } events, terminated by [DONE]
// Sarvam exposes an OpenAI-compatible /chat/completions endpoint, so we translate
// to/from that shape here — the frontend stays untouched.

const SARVAM_KEY = process.env.SARVAM_API_KEY;
// Swappable without a code change. sarvam-30b is the faster MoE model; sarvam-105b
// is the larger one. Both are reasoning models — we send reasoning_effort:null to
// disable thinking so these short, data-grounded answers aren't eaten by hidden
// chain-of-thought tokens (Sarvam's documented off-switch).
const MODEL = process.env.SARVAM_MODEL || "sarvam-30b";
const ENDPOINT = "https://api.sarvam.ai/v1/chat/completions";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 503 (capacity) is always transient → exponential backoff. 429 (rate limit) is
// retried a couple of times with backoff; if it persists the caller surfaces it
// and falls back to rule-based output.
async function fetchSarvamWithRetry(payload, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SARVAM_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || attempt >= retries) return res;

    if (res.status === 503 || res.status === 429) {
      await sleep(Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250);
      continue;
    }

    return res;
  }
}

// Anthropic-style messages (role "user"/"assistant", string content) + an optional
// system prompt -> OpenAI/Sarvam chat messages with a leading system message.
function toSarvamMessages(messages = [], system) {
  const out = messages
    .filter((m) => m && m.content)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: String(m.content),
    }));
  if (system) out.unshift({ role: "system", content: String(system) });
  return out;
}

const textFromChoice = (data) => data?.choices?.[0]?.message?.content ?? "";

export async function POST(request) {
  if (!SARVAM_KEY || SARVAM_KEY === "your_key_here") {
    return Response.json({ error: "NO_KEY" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const { type, messages, system, maxTokens = 350 } = body;
  const isChat = type === "chat";

  const payload = {
    model: MODEL,
    messages: toSarvamMessages(messages, system),
    max_tokens: maxTokens,
    // Direct answers, no hidden reasoning eating the token budget.
    reasoning_effort: null,
    stream: isChat,
  };

  let sarvamRes;
  try {
    sarvamRes = await fetchSarvamWithRetry(payload);
  } catch {
    return Response.json({ error: "FETCH_FAILED" }, { status: 502 });
  }

  if (!sarvamRes.ok) {
    const detail = await sarvamRes.text().catch(() => "");
    return Response.json(
      { error: "SARVAM_ERROR", detail },
      { status: sarvamRes.status },
    );
  }

  // ── Non-streaming narrative / city recommendation ──
  if (!isChat) {
    const data = await sarvamRes.json();
    return Response.json({ text: textFromChoice(data) });
  }

  // ── Streaming chat: Sarvam (OpenAI) SSE -> Anthropic-style SSE ──
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = sarvamRes.body.getReader();
      const send = (obj) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const raw = trimmed.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const text = JSON.parse(raw)?.choices?.[0]?.delta?.content ?? "";
              if (text) {
                send({
                  type: "content_block_delta",
                  delta: { type: "text_delta", text },
                });
              }
            } catch {
              // ignore keep-alive / partial lines
            }
          }
        }
      } catch {
        // stream interrupted — fall through and close cleanly
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
