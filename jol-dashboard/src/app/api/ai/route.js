// AI backend for the Insights module, powered by Google Gemini.
//
// The client (AIInsights.jsx) speaks an Anthropic-style contract:
//   - narrative: POST { type:"narrative", system, messages, maxTokens } -> { text }
//   - chat:      POST { type:"chat", ... } -> SSE of { type:"content_block_delta",
//                delta:{ type:"text_delta", text } } events, terminated by [DONE]
// So we call Gemini here and translate its response/stream into that shape —
// the frontend stays untouched.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
// Swappable without a code change. gemini-2.5-flash has a generous free-tier
// quota; gemini-3.5-flash is newer but capped at ~20 requests/day on free tier.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gemini returns 503 UNAVAILABLE ("high demand") on shared capacity and 429
// RESOURCE_EXHAUSTED when a rate/quota limit is hit. 503 is always transient →
// exponential backoff. 429 is retried only when the server's `retryDelay` hint
// is short (a per-minute burst); a long hint means the daily quota is gone, so
// we fail fast and let the caller surface it / fall back to rule-based output.
async function fetchGeminiWithRetry(endpoint, payload, retries = 4) {
  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || attempt >= retries) return res;

    if (res.status === 503) {
      await sleep(Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250);
      continue;
    }

    if (res.status === 429 && attempt < 2) {
      const body = await res.clone().text().catch(() => "");
      const match = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) : 3000;
      if (waitMs <= 8000) {
        await sleep(waitMs + 300);
        continue;
      }
    }

    return res;
  }
}

// Anthropic-style roles ("user"/"assistant") + string content -> Gemini's
// "user"/"model" roles with parts arrays.
function toGeminiContents(messages = []) {
  return messages
    .filter((m) => m && m.content)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content) }],
    }));
}

const textFromCandidate = (data) =>
  data?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";

export async function POST(request) {
  if (!GEMINI_KEY || GEMINI_KEY === "your_key_here") {
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
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: maxTokens,
      // gemini-flash-latest is a thinking model; its hidden reasoning would eat
      // the token budget and truncate these short, data-grounded answers. We
      // want direct responses, so disable thinking.
      thinkingConfig: { thinkingBudget: 0 },
    },
    ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
  };

  const endpoint = isChat
    ? `${BASE}/${MODEL}:streamGenerateContent?alt=sse`
    : `${BASE}/${MODEL}:generateContent`;

  let geminiRes;
  try {
    geminiRes = await fetchGeminiWithRetry(endpoint, payload);
  } catch {
    return Response.json({ error: "FETCH_FAILED" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => "");
    return Response.json(
      { error: "GEMINI_ERROR", detail },
      { status: geminiRes.status },
    );
  }

  // ── Non-streaming narrative / city recommendation ──
  if (!isChat) {
    const data = await geminiRes.json();
    return Response.json({ text: textFromCandidate(data) });
  }

  // ── Streaming chat: Gemini SSE -> Anthropic-style SSE ──
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = geminiRes.body.getReader();
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
              const text = textFromCandidate(JSON.parse(raw));
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
