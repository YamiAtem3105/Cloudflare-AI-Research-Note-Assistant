export function validateTitle(title: unknown): string | null {
  if (typeof title !== "string" || !title.trim()) {
    return "Title is required.";
  }

  if (title.trim().length > 200) {
    return "Title must not exceed 200 characters.";
  }

  return null;
}

export function validateContent(content: unknown): string | null {
  if (typeof content !== "string" || !content.trim()) {
    return "Content is required.";
  }

  if (content.length > 20_000) {
    return "Content must not exceed 20,000 characters.";
  }

  return null;
}

export function validateFile(file: File | null): string | null {
  if (!file) return "File is required.";

  if (file.size === 0) {
    return "File must not be empty.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "File size must not exceed 2 MB.";
  }

  const name = file.name.toLowerCase();

  if (!name.endsWith(".txt") && !name.endsWith(".md")) {
    return "Only .txt and .md files are supported.";
  }

  return null;
}