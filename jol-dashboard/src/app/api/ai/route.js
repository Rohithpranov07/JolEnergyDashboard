const ANTHROPIC_KEY =
  process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_KEY;

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const HEADERS = {
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01",
};

export async function POST(request) {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === "your_key_here") {
    return Response.json({ error: "NO_KEY" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const { type, messages, system, maxTokens = 350 } = body;

  const requestBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    stream: type === "chat",
    ...(system ? { system } : {}),
    messages: messages || [],
  };

  let anthropicResponse;
  try {
    anthropicResponse = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: { ...HEADERS, "x-api-key": ANTHROPIC_KEY },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return Response.json({ error: "FETCH_FAILED" }, { status: 502 });
  }

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text().catch(() => "");
    return Response.json(
      { error: "ANTHROPIC_ERROR", detail: err },
      { status: anthropicResponse.status },
    );
  }

  if (type === "chat") {
    // Pass the SSE stream straight through to the client.
    return new Response(anthropicResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Non-streaming: parse and return the text.
  const data = await anthropicResponse.json();
  const text = data.content?.[0]?.text ?? "";
  return Response.json({ text });
}
