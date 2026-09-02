import type { AIResult } from "../types/ai.types";
import { validateAIResult } from "../validators/ai.validator";

export async function analyzeText(
  ai: Ai,
  content: string,
): Promise<AIResult> {
  const response = await ai.run(
    "@cf/meta/llama-3.1-8b-instruct",
    {
      messages: [
        {
          role: "user",
          content: `
Analyze this note and return ONLY JSON.

{
  "summary": "maximum 120 words",
  "category": "research|project|meeting|learning|other",
  "tags": ["3 to 5 tags"]
}

Note:
${content}
`,
        },
      ],
    },
  );

  const raw = (
    response as { response?: string }
  ).response;

  if (!raw) {
    throw new Error("Invalid AI response.");
  }

  let result: unknown;

  try {
    result = JSON.parse(
      raw
        .replace(/^```json/i, "")
        .replace(/```$/i, "")
        .trim(),
    );
  } catch {
    throw new Error("AI returned malformed JSON.");
  }

  if (!validateAIResult(result)) {
    throw new Error("AI returned invalid analysis.");
  }

  return result;
}