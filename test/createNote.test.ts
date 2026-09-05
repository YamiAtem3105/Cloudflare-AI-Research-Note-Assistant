import { describe, it, expect, vi } from "vitest";
import { env, exports } from "cloudflare:workers";

describe("POST /notes - create text note", () => {
  it("creates a text note and completes AI analysis", async () => {
    // ============================================================
    // CHUẨN BỊ - Mock kết quả trả về từ Workers AI
    // ============================================================

    vi.spyOn(env.AI, "run").mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "This is a test summary.",
              category: "research",
              tags: ["AI", "Cloudflare", "Testing"],
            }),
          },
        },
      ],
    } as any);

    // ============================================================
    // THỰC HIỆN - Gửi request tạo text note
    // ============================================================

    const response = await exports.default.fetch(
      new Request("https://example.com/notes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Note",
          content: "This is test note content.",
        }),
      }),
    );

    // ============================================================
    // KIỂM TRA - Kiểm tra HTTP response
    // ============================================================

    expect(response.status).toBe(201);

    const body = await response.json() as {
      id: string;
      title: string;
      source_type: string;
      status: string;
      summary: string;
      category: string;
      tags: string[];
    };

    expect(body.title).toBe("Test Note");
    expect(body.source_type).toBe("text");
    expect(body.status).toBe("done");
    expect(body.summary).toBe("This is a test summary.");
    expect(body.category).toBe("research");
    expect(body.tags).toEqual([
      "AI",
      "Cloudflare",
      "Testing",
    ]);

    // ============================================================
    // KIỂM TRA - Kiểm tra dữ liệu thực sự được lưu vào D1
    // ============================================================

    const note = await env.ai_research_notes_db
      .prepare(`
        SELECT
          title,
          source_type,
          content,
          status,
          summary,
          category,
          tags_json
        FROM notes
        WHERE id = ?
      `)
      .bind(body.id)
      .first<{
        title: string;
        source_type: string;
        content: string;
        status: string;
        summary: string;
        category: string;
        tags_json: string;
      }>();

    expect(note).not.toBeNull();

    expect(note?.title).toBe("Test Note");
    expect(note?.source_type).toBe("text");
    expect(note?.content).toBe(
      "This is test note content.",
    );
    expect(note?.status).toBe("done");
    expect(note?.summary).toBe(
      "This is a test summary.",
    );
    expect(note?.category).toBe("research");

    expect(JSON.parse(note!.tags_json)).toEqual([
      "AI",
      "Cloudflare",
      "Testing",
    ]);
  });
});


it("uploads a valid txt file and saves metadata correctly", async () => {
  // ============================================================
  // CHUẨN BỊ - Mock kết quả từ Workers AI
  // ============================================================

  vi.spyOn(env.AI, "run").mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: "This is a test summary.",
            category: "research",
            tags: ["AI", "Cloudflare", "Testing"],
          }),
        },
      },
    ],
  } as any);

  // ============================================================
  // CHUẨN BỊ - Tạo file TXT và FormData
  // ============================================================

  const content = "This is uploaded text content.";

  const file = new File(
    [content],
    "test.txt",
    { type: "text/plain" },
  );

  const formData = new FormData();

  formData.append("title", "Uploaded Test Note");
  formData.append("file", file);

  // ============================================================
  // THỰC HIỆN - Gửi request upload file
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Kiểm tra HTTP response
  // ============================================================

  expect(response.status).toBe(201);

  const body = await response.json() as {
    id: string;
    title: string;
    source_type: string;
    status: string;
    summary: string;
    category: string;
    tags: string[];
  };

  expect(body.title).toBe("Uploaded Test Note");
  expect(body.source_type).toBe("file");
  expect(body.status).toBe("done");
  expect(body.summary).toBe("This is a test summary.");
  expect(body.category).toBe("research");
  expect(body.tags).toEqual([
    "AI",
    "Cloudflare",
    "Testing",
  ]);

  // ============================================================
  // KIỂM TRA - Kiểm tra metadata và kết quả AI trong D1
  // ============================================================

  const note = await env.ai_research_notes_db
    .prepare(`
      SELECT
        title,
        source_type,
        content,
        object_key,
        original_name,
        content_type,
        size,
        status,
        summary,
        category,
        tags_json
      FROM notes
      WHERE id = ?
    `)
    .bind(body.id)
    .first<{
      title: string;
      source_type: string;
      content: string;
      object_key: string;
      original_name: string;
      content_type: string;
      size: number;
      status: string;
      summary: string;
      category: string;
      tags_json: string;
    }>();

  expect(note).not.toBeNull();

  expect(note?.title).toBe("Uploaded Test Note");
  expect(note?.source_type).toBe("file");
  expect(note?.content).toBe(content);
  expect(note?.object_key).toBe(
    `notes/${body.id}/test.txt`,
  );
  expect(note?.original_name).toBe("test.txt");
  expect(note?.content_type).toBe("text/plain");
  expect(note?.size).toBe(
    new TextEncoder().encode(content).length,
  );
  expect(note?.status).toBe("done");
  expect(note?.summary).toBe("This is a test summary.");
  expect(note?.category).toBe("research");

  expect(JSON.parse(note!.tags_json)).toEqual([
    "AI",
    "Cloudflare",
    "Testing",
  ]);

  // ============================================================
  // KIỂM TRA - Kiểm tra file gốc thực sự được lưu trong R2
  // ============================================================

  const object = await env.ai_research_notes.get(
    note!.object_key,
  );

  expect(object).not.toBeNull();

  const storedContent = await object!.text();

  expect(storedContent).toBe(content);
});


it("uploads a valid md file and saves metadata correctly", async () => {
  // ============================================================
  // CHUẨN BỊ - Mock kết quả từ Workers AI
  // ============================================================

  vi.spyOn(env.AI, "run").mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: "Markdown test summary.",
            category: "research",
            tags: ["AI", "Markdown", "Testing"],
          }),
        },
      },
    ],
  } as any);

  // ============================================================
  // CHUẨN BỊ - Tạo file Markdown và FormData
  // ============================================================

  const content = "# Test Note\n\nThis is markdown content.";

  const file = new File(
    [content],
    "test.md",
    { type: "text/markdown" },
  );

  const formData = new FormData();

  formData.append("title", "Markdown Test Note");
  formData.append("file", file);

  // ============================================================
  // THỰC HIỆN - Gửi request upload file
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Kiểm tra HTTP response
  // ============================================================

  expect(response.status).toBe(201);

  const body = await response.json() as {
    id: string;
    title: string;
    source_type: string;
    status: string;
    summary: string;
    category: string;
    tags: string[];
  };

  expect(body.title).toBe("Markdown Test Note");
  expect(body.source_type).toBe("file");
  expect(body.status).toBe("done");
  expect(body.summary).toBe("Markdown test summary.");
  expect(body.category).toBe("research");
  expect(body.tags).toEqual([
    "AI",
    "Markdown",
    "Testing",
  ]);

  // ============================================================
  // KIỂM TRA - Kiểm tra metadata và kết quả AI trong D1
  // ============================================================

  const note = await env.ai_research_notes_db
    .prepare(`
      SELECT
        title,
        source_type,
        content,
        object_key,
        original_name,
        content_type,
        size,
        status,
        summary,
        category,
        tags_json
      FROM notes
      WHERE id = ?
    `)
    .bind(body.id)
    .first<{
      title: string;
      source_type: string;
      content: string;
      object_key: string;
      original_name: string;
      content_type: string;
      size: number;
      status: string;
      summary: string;
      category: string;
      tags_json: string;
    }>();

  expect(note).not.toBeNull();

  expect(note?.title).toBe("Markdown Test Note");
  expect(note?.source_type).toBe("file");
  expect(note?.content).toBe(content);
  expect(note?.object_key).toBe(
    `notes/${body.id}/test.md`,
  );
  expect(note?.original_name).toBe("test.md");
  expect(note?.content_type).toBe("text/markdown");
  expect(note?.size).toBe(
    new TextEncoder().encode(content).length,
  );
  expect(note?.status).toBe("done");
  expect(note?.summary).toBe("Markdown test summary.");
  expect(note?.category).toBe("research");

  expect(JSON.parse(note!.tags_json)).toEqual([
    "AI",
    "Markdown",
    "Testing",
  ]);

  // ============================================================
  // KIỂM TRA - Kiểm tra file gốc thực sự được lưu trong R2
  // ============================================================

  const object = await env.ai_research_notes.get(
    note!.object_key,
  );

  expect(object).not.toBeNull();

  const storedContent = await object!.text();

  expect(storedContent).toBe(content);
});


it("rejects unsupported file type", async () => {
  // ============================================================
  // CHUẨN BỊ - Tạo file PDF không được hỗ trợ
  // ============================================================

  const file = new File(
    ["fake pdf content"],
    "test.pdf",
    { type: "application/pdf" },
  );

  const formData = new FormData();
  formData.append("title", "Invalid File");
  formData.append("file", file);

  // ============================================================
  // THỰC HIỆN - Gửi request upload file không hợp lệ
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Đảm bảo API từ chối file không được hỗ trợ
  // ============================================================

  expect(response.status).toBe(400);

  const body = await response.json() as {
    error: string;
  };

  expect(body.error).toBe(
    "Only .txt and .md files are supported.",
  );
});

it("rejects empty file", async () => {
  // ============================================================
  // CHUẨN BỊ - Tạo file TXT rỗng
  // ============================================================

  const file = new File(
    [],
    "empty.txt",
    { type: "text/plain" },
  );

  const formData = new FormData();
  formData.append("title", "Empty File");
  formData.append("file", file);

  // ============================================================
  // THỰC HIỆN - Gửi request upload file rỗng
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Đảm bảo API từ chối file rỗng
  // ============================================================

  expect(response.status).toBe(400);

  const body = await response.json() as {
    error: string;
  };

  expect(body.error).toBe("File must not be empty.");
});


it("rejects file larger than 2 MB", async () => {
  // ============================================================
  // CHUẨN BỊ - Tạo file TXT có kích thước lớn hơn 2 MB
  // ============================================================

  const content = "a".repeat(2 * 1024 * 1024 + 1);

  const file = new File(
    [content],
    "large.txt",
    { type: "text/plain" },
  );

  const formData = new FormData();
  formData.append("title", "Large File");
  formData.append("file", file);

  // ============================================================
  // THỰC HIỆN - Gửi request upload file vượt quá giới hạn
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Đảm bảo API từ chối file vượt quá 2 MB
  // ============================================================

  expect(response.status).toBe(400);

  const body = await response.json() as {
    error: string;
  };

  expect(body.error).toBe(
    "File must not exceed 2 MB.",
  );
});


it("rejects request without file", async () => {
  // ============================================================
  // CHUẨN BỊ - Tạo request không có file
  // ============================================================

  const formData = new FormData();

  formData.append("title", "Missing File");

  // ============================================================
  // THỰC HIỆN - Gửi request không có file
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      body: formData,
    }),
  );

  // ============================================================
  // KIỂM TRA - Đảm bảo API yêu cầu phải có file
  // ============================================================

  expect(response.status).toBe(400);

  const body = await response.json() as {
    error: string;
  };

  expect(body.error).toBe("File is required.");
});


it("marks note as failed when AI output is malformed", async () => {
  // ============================================================
  // CHUẨN BỊ - Mock Workers AI trả về dữ liệu JSON không hợp lệ
  // ============================================================

  vi.spyOn(env.AI, "run").mockResolvedValue({
    choices: [
      {
        message: {
          content: "this is not valid JSON",
        },
      },
    ],
  } as any);

  // ============================================================
  // THỰC HIỆN - Gửi request tạo note để kích hoạt AI analysis
  // ============================================================

  const response = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Malformed AI Test",
        content: "This note should fail AI analysis.",
      }),
    }),
  );

  // ============================================================
  // KIỂM TRA - Kiểm tra API trả về lỗi khi AI output không hợp lệ
  // ============================================================

  expect(response.status).toBe(500);

  const body = await response.json() as {
    error: string;
  };

  expect(body.error).toBeTruthy();

  // ============================================================
  // KIỂM TRA - Kiểm tra note chuyển sang failed và lưu lỗi vào D1
  // ============================================================

  const note = await env.ai_research_notes_db
    .prepare(`
      SELECT status, error_message
      FROM notes
      WHERE title = ?
    `)
    .bind("Malformed AI Test")
    .first<{
      status: string;
      error_message: string;
    }>();

  expect(note).not.toBeNull();
  expect(note?.status).toBe("failed");
  expect(note?.error_message).toBeTruthy();
});


it("marks note as failed when AI call fails and succeeds after retry", async () => {
  // ============================================================
  // CHUẨN BỊ - Mock AI lần đầu thất bại, lần thứ hai thành công
  // ============================================================

  vi.clearAllMocks();

  const aiRun = vi
    .spyOn(env.AI, "run")
    .mockRejectedValueOnce(new Error("AI service unavailable"))
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Retry succeeded.",
              category: "research",
              tags: ["Retry", "AI", "Cloudflare"],
            }),
          },
        },
      ],
    } as any);

  // ============================================================
  // THỰC HIỆN - Tạo note và để AI xử lý lần đầu
  // ============================================================

  const createResponse = await exports.default.fetch(
    new Request("https://example.com/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Retry Test",
        content: "This note will fail first and succeed on retry.",
      }),
    }),
  );

  // ============================================================
  // KIỂM TRA - Note phải chuyển sang failed khi AI thất bại
  // ============================================================

  expect(createResponse.status).toBe(500);

  const created = await env.ai_research_notes_db
    .prepare(`
      SELECT id, status, error_message
      FROM notes
      WHERE title = ?
    `)
    .bind("Retry Test")
    .first<{
      id: string;
      status: string;
      error_message: string;
    }>();

  expect(created).not.toBeNull();
  expect(created?.status).toBe("failed");
  expect(created?.error_message).toBeTruthy();

  // ============================================================
  // THỰC HIỆN - Retry xử lý note đã failed
  // ============================================================

  const retryResponse = await exports.default.fetch(
    new Request(
      `https://example.com/notes/${created!.id}/retry`,
      {
        method: "POST",
      },
    ),
  );

  const retryBody = await retryResponse.json();

  // ============================================================
  // KIỂM TRA - Retry phải thành công và trả về kết quả AI
  // ============================================================

  expect(retryResponse.status).toBe(200);

  // ============================================================
  // KIỂM TRA - Kiểm tra kết quả cuối cùng được lưu vào D1
  // ============================================================

  const finalNote = await env.ai_research_notes_db
    .prepare(`
      SELECT status, summary, category, tags_json
      FROM notes
      WHERE id = ?
    `)
    .bind(created!.id)
    .first<{
      status: string;
      summary: string;
      category: string;
      tags_json: string;
    }>();

  expect(finalNote?.status).toBe("done");
  expect(finalNote?.summary).toBe("Retry succeeded.");
  expect(finalNote?.category).toBe("research");

  expect(JSON.parse(finalNote!.tags_json)).toEqual([
    "Retry",
    "AI",
    "Cloudflare",
  ]);

  // ============================================================
  // KIỂM TRA - Đảm bảo AI chỉ được gọi một lần cho mỗi lần xử lý
  // ============================================================

  expect(aiRun).toHaveBeenCalledTimes(2);
});

