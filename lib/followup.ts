import { callClaude, extractJSON } from "./claude";

export type FollowupDecision = {
  needsFollowup: boolean;
  followupQuestion: string | null;
};

export async function decideFollowup(
  dailyQuestion: string,
  originalAnswer: string
): Promise<FollowupDecision> {
  const systemPrompt = `You are an introspective interviewer. Given a daily reflective question and a person's text-message reply, decide whether the reply is surface-level/vague enough to warrant ONE gentle follow-up question that digs into the deeper "why", or whether it's already thoughtful/detailed enough to leave alone.

Rules:
- At most one follow-up. Never suggest a follow-up to a follow-up.
- If the reply already explains reasoning, motivation, or specifics, no follow-up is needed.
- If the reply is a short word/phrase or avoids the "why", a follow-up is warranted.
- The follow-up must be under 20 words, warm, specific to their exact wording, SMS-appropriate.
- Respond ONLY with JSON: {"needsFollowup": boolean, "followupQuestion": string | null}`;

  const raw = await callClaude(
    systemPrompt,
    `Daily question: "${dailyQuestion}"\nTheir reply: "${originalAnswer}"`
  );
  console.log("[FOLLOWUP DEBUG] Raw Claude response:", raw);
  const result = extractJSON<FollowupDecision>(raw);
  console.log("[FOLLOWUP DEBUG] Parsed result:", result);
  return result;
}
