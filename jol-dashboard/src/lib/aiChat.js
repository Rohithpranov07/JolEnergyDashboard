// Shared streaming chat helper. POSTs to /api/ai and invokes onDelta with each
// text chunk as it streams in. Grounds every question in the live dashboard
// data (PIPELINE_CONTEXT). Used by the AI Insights chat and the floating widget.

import { PIPELINE_CONTEXT } from "./pipelineContext";

export const CHAT_SYSTEM =
  "You are a data assistant for Jol Energy, a Li-ion battery recycling startup. " +
  "Answer ONLY based on the pipeline data provided. Be concise (max 3 sentences). " +
  "Include specific numbers from the data. If you cannot answer from the data, say so briefly.";

/**
 * @param {{role: "user"|"assistant", content: string}[]} history  prior turns
 * @param {string} question  the new user question
 * @param {(delta: string) => void} onDelta  called with each streamed chunk
 */
export async function streamChat(history, question, onDelta) {
  // Keep the last few turns for context; Gemini requires the conversation to
  // begin with a user turn, so drop any leading assistant/greeting messages.
  const recent = history.slice(-6);
  while (recent.length && recent[0].role !== "user") recent.shift();

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "chat",
      system: CHAT_SYSTEM,
      messages: [
        ...recent,
        {
          role: "user",
          content: "Data: " + PIPELINE_CONTEXT + "\n\nQuestion: " + question,
        },
      ],
      maxTokens: 400,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const evt = JSON.parse(raw);
        if (
          evt.type === "content_block_delta" &&
          evt.delta?.type === "text_delta"
        ) {
          onDelta(evt.delta.text);
        }
      } catch {
        // ignore malformed / keep-alive lines
      }
    }
  }
}
