import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;
const MAX_ROUNDS = 3;

/** Retry a Claude call on 429 rate-limit errors with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Anthropic.APIError && err.status === 429;
      if (!isRateLimit || attempt === retries - 1) throw err;
      // Back off: 8s, 16s, 32s
      await new Promise((r) => setTimeout(r, 8000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Unreachable");
}

/** Fast call — no web search. Use for synthesis steps that already have all context. */
export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await withRetry(() =>
    anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })
  );
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("\n\n");
}

export async function callClaudeWithSearch(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await withRetry(() => anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        } as unknown as Anthropic.Tool,
      ],
      messages,
    }));

    // Collect all text blocks from this response
    const textContent = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n\n");

    if (response.stop_reason === "end_turn") {
      return textContent;
    }

    if (response.stop_reason === "tool_use") {
      // Add the assistant's message (with tool_use blocks) to history
      messages.push({ role: "assistant", content: response.content });

      // Add tool_result placeholders for each tool_use block.
      // For web_search_20250305, Anthropic executes the search server-side —
      // sending back the conversation is enough for Claude to continue.
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b) => b.type === "tool_use")
        .map((b) => {
          const toolUse = b as Anthropic.ToolUseBlock;
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: "",
          };
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages.push({ role: "user", content: toolResults } as any);
      continue;
    }

    // max_tokens or other stop reasons — return whatever text we have
    if (textContent) return textContent;

    // If we have no text but the loop stopped for another reason, extract
    // any text from the accumulated assistant messages
    const allText = messages
      .filter((m) => m.role === "assistant")
      .flatMap((m): Anthropic.ContentBlock[] =>
        Array.isArray(m.content) ? (m.content as Anthropic.ContentBlock[]) : []
      )
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n\n");

    return allText;
  }

  throw new Error("Claude web search: max rounds exceeded without end_turn");
}

/**
 * Extract a JSON object from a Claude response that may have prose
 * surrounding a ```json ... ``` code block, or be pure JSON.
 */
export function extractJSON<T>(raw: string): T {
  // Try stripping markdown code fences first
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  // Find the outermost { } or [ ] boundary
  const start = jsonStr.search(/[{\[]/);
  const lastBrace = jsonStr.lastIndexOf("}");
  const lastBracket = jsonStr.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);

  if (start === -1 || end === -1) {
    throw new Error(`No JSON found in response: ${raw.slice(0, 200)}`);
  }

  const clean = jsonStr.slice(start, end + 1);
  return JSON.parse(clean) as T;
}
