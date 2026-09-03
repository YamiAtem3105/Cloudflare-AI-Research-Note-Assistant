
// Categories.
const CATEGORIES = [
  "research",
  "project",
  "meeting",
  "learning",
  "other",
] as const;

// Form kết quả sau khi AI phân tích thành công.
export type AIResult = {
  summary: string;
  category: typeof CATEGORIES[number];
  tags: string[];
};

export async function analyzeNote(
  ai: Ai,
  content: string,
): Promise<AIResult> {

  // Prompt AI.
  const prompt = `
Analyze the following note and return ONLY valid JSON.

Required format:
{
  "summary": "A summary of no more than 120 words.",
  "category": "research | project | meeting | learning | other",
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- summary must be no more than 120 words.
- category must be one of: research, project, meeting, learning, other.
- tags must contain 3 to 5 relevant tags.
- Do not include markdown or any text outside the JSON.

Note:
${content}
`;

  // Gửi nội dung note cho model Workers AI.
  const response = await ai.run(
    "@cf/zai-org/glm-4.7-flash",
    {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
  );

  // Lấy phần text mà AI trả về.
  const text = response.choices[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("Invalid AI response.");
  }

  // Chuyển JSON string mà AI trả về thành object.
  let result: unknown;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }

  // Kiểm tra AI có trả đủ 3 trường cần thiết hay không.
  if (
    typeof result !== "object" ||
    result === null ||
    typeof (result as { summary?: unknown }).summary !== "string" ||
    typeof (result as { category?: unknown }).category !== "string" ||
    !Array.isArray((result as { tags?: unknown }).tags)
  ) {
    throw new Error("AI returned an invalid result.");
  }

  const parsed = result as {
    summary: string;
    category: string;
    tags: unknown[];
  };

  // Category phải thuộc danh sách được quy định.
  if (
    !CATEGORIES.includes(
      parsed.category as typeof CATEGORIES[number],
    )
  ) {
    throw new Error("AI returned an invalid category.");
  }

  // Tags phải có từ 3 đến 5 tag và mỗi tag phải là string không rỗng.
  if (
    parsed.tags.length < 3 ||
    parsed.tags.length > 5 ||
    !parsed.tags.every(
      (tag) =>
        typeof tag === "string" &&
        tag.trim() !== "",
    )
  ) {
    throw new Error("AI returned invalid tags.");
  }

  // Summary không được rỗng.
  if (parsed.summary.trim() === "") {
    throw new Error("AI returned an empty summary.");
  }

  // Summary không được vượt quá 120 từ.
  const wordCount = parsed.summary
    .trim()
    .split(/\s+/)
    .length;

  if (wordCount > 120) {
    throw new Error("AI summary exceeds 120 words.");
  }

  // Trả kết quả đã được validate.
  const tags = parsed.tags.map((tag) => {
  if (typeof tag !== "string") {
    throw new Error("AI returned invalid tags.");
  }

  return tag.trim();
});

return {
  summary: parsed.summary.trim(),
  category: parsed.category as typeof CATEGORIES[number],
  tags,
};
}