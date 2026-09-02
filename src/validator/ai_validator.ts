import type { AIResult } from "../types/ai.types";

const categories = [
  "research",
  "project",
  "meeting",
  "learning",
  "other",
];

export function validateAIResult(
  value: unknown,
): value is AIResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  if (
    typeof result.summary !== "string" ||
    !result.summary.trim()
  ) {
    return false;
  }

  if (
    typeof result.category !== "string" ||
    !categories.includes(result.category)
  ) {
    return false;
  }

  if (
    !Array.isArray(result.tags) ||
    result.tags.length < 3 ||
    result.tags.length > 5
  ) {
    return false;
  }

  return result.tags.every(
    (tag) =>
      typeof tag === "string" &&
      tag.trim() !== "",
  );
}