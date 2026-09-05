# Cloudflare AI Research Note Assistant

Ứng dụng quản lý và phân tích ghi chú nghiên cứu bằng AI: Web UI cho phép tạo note hoặc upload `.txt` / `.md`, lưu trữ trên Cloudflare R2 + D1 và sử dụng Workers AI để tự động tạo **summary, category và tags**.

## Kiến trúc

```text
Web UI
   ↓
Cloudflare Worker
   ├── D1 ──→ Metadata / Status / AI Results
   ├── R2 ──→ Original Files
   └── Workers AI ──→ Summary / Category / Tags
```

Worker chịu trách nhiệm xử lý request, điều phối việc lưu trữ và gọi AI. D1 và R2 được sử dụng cho hai loại dữ liệu khác nhau.

## Công nghệ

| Thành phần   | Công nghệ               |
| ------------ | ----------------------- |
| Backend      | Cloudflare Workers      |
| Language     | TypeScript              |
| Database     | Cloudflare D1           |
| File Storage | Cloudflare R2           |
| AI           | Cloudflare Workers AI   |
| Frontend     | HTML / CSS / TypeScript |
| Testing      | Vitest                  |

## Setup

### 1. Clone & install

```bash
git clone <repository-url>
cd ai-research-note-assistant
npm install
```

### 2. Setup D1

Database:

```text
ai-research-notes-db
```

Apply migration local:

```bash
npx wrangler d1 migrations apply ai-research-notes-db --local
```

Apply migration production:

```bash
npx wrangler d1 migrations apply ai-research-notes-db --remote
```

### 3. Setup R2

Tạo R2 bucket:

```bash
npx wrangler r2 bucket create ai-research-notes
```

Worker sử dụng binding:

```text
ai_research_notes
```

### 4. Setup Workers AI

Workers AI được khai báo thông qua binding:

```text
AI
```

Không cần API key riêng cho Workers AI khi Worker đã được cấu hình binding tương ứng.

## Chạy local

```bash
npm run dev
```

Ứng dụng local:

```text
http://127.0.0.1:8787
```

## Schema

D1 sử dụng bảng `notes` để lưu thông tin của note.

| Column          | Mô tả                                      |
| --------------- | ------------------------------------------ |
| `id`            | ID của note                                |
| `title`         | Tiêu đề                                    |
| `source_type`   | `text` hoặc `file`                         |
| `content`       | Nội dung text, nếu note được tạo trực tiếp |
| `object_key`    | R2 object key, nếu note là file            |
| `original_name` | Tên file gốc                               |
| `content_type`  | MIME type                                  |
| `size`          | Kích thước file                            |
| `status`        | `pending`, `processing`, `done`, `failed`  |
| `summary`       | Kết quả summary từ AI                      |
| `category`      | Category từ AI                             |
| `tags_json`     | Tags từ AI                                 |
| `error_message` | Lỗi gần nhất                               |
| `created_at`    | Thời gian tạo                              |
| `updated_at`    | Thời gian cập nhật                         |

File `.txt` / `.md` gốc được lưu trong R2, còn thông tin mô tả và trạng thái xử lý được lưu trong D1.

## Technical Decisions

### 1. Tại sao file lưu trong R2 còn metadata / status / AI results lưu trong D1?

R2 phù hợp với việc lưu **object/file**, trong khi D1 phù hợp với dữ liệu có cấu trúc và cần query.

Do đó:

```text
R2 → Original file
D1 → Metadata + Status + AI Results
```

Cách tách này giúp D1 không phải lưu trực tiếp file, đồng thời có thể query danh sách notes, status hoặc kết quả AI mà không cần đọc toàn bộ file từ storage.

Với text note, nội dung ngắn có thể được lưu trực tiếp trong D1 vì không cần R2.

### 2. Concurrency khi hai request cùng analyze một note

Concurrency problem xảy ra khi **hai request cùng trỏ tới một note có cùng ****`note_id`**** trong D1**, ví dụ:

```
Request A → POST /notes/abc123/retry
Request B → POST /notes/abc123/retry
```

Nếu không có cơ chế kiểm soát, cả hai request có thể cùng đọc note ở trạng thái `pending` và cùng gọi Workers AI:

```
Request A → note abc123 → AI
Request B → note abc123 → AI
```

→ Cùng một note bị xử lý AI hai lần.

Implementation hiện tại sử dụng **atomic status transition**:

```
pending / failed → processing
```

Database chỉ update thành công nếu status hiện tại vẫn là `pending` hoặc `failed`.

Request đầu tiên claim được note sẽ chuyển sang `processing` và tiếp tục gọi AI. Request thứ hai không thể claim cùng note và nhận `409 Conflict`.

```
Request A → 200 → AI processing
Request B → 409 → Already processing
```

Điều này chỉ ngăn **nhiều request xử lý cùng một note (****`note_id`****) đồng thời**. Các note khác nhau vẫn có thể được xử lý song song, kể cả khi chúng có cùng nội dung.

Nhờ đó cùng một note không bị gọi AI đồng thời nhiều lần.

### 3. Workers AI fail sau khi note đã được lưu thì sao?

Việc lưu note và việc AI phân tích được xử lý thành hai bước.

Nếu note đã được lưu nhưng Workers AI thất bại:

```text
pending
   ↓
processing
   ↓
AI failed
   ↓
failed
```

Error được lưu vào `error_message` để có thể kiểm tra nguyên nhân.

Người dùng có thể bấm **Retry**:

```text
failed
   ↓
processing
   ↓
AI success
   ↓
done
```

Retry sử dụng cùng cơ chế atomic transition nên cũng không tạo ra nhiều AI processing đồng thời cho cùng một note.

### 4. Tại sao không dùng FastAPI / PostgreSQL / VectorDB?

Bài toán này không yêu cầu một backend framework hoặc database phức tạp. Cloudflare Workers đã cung cấp runtime cho API, trong khi D1, R2 và Workers AI đáp ứng trực tiếp các nhu cầu chính của ứng dụng.

So với stack quen thuộc:

```text
FastAPI      → Cloudflare Workers
PostgreSQL   → D1
File storage → R2
AI service   → Workers AI
```

Ưu điểm của Cloudflare stack:

- Ít infrastructure phải quản lý.
- Database, object storage và AI tích hợp trực tiếp với Worker.
- Dễ deploy thành một application nhỏ.
- Phù hợp với workload của assignment.

Trade-off:

- D1 có khả năng query và transaction hạn chế hơn PostgreSQL.
- Workers có execution/runtime constraints khác backend server truyền thống.
- R2 cần xử lý riêng object storage thay vì lưu file trực tiếp trong database.
- Không có semantic search/vector retrieval tích hợp như một VectorDB chuyên dụng.
- Khi hệ thống lớn và yêu cầu database/query phức tạp hơn, PostgreSQL + backend framework có thể phù hợp hơn.

### 5. Nếu có thêm hai ngày phát triển

Ba ưu tiên quan trọng nhất:

**1. Background processing bằng Queue**

Tách AI processing khỏi request lifecycle:

```text
Create Note → D1 → Queue → Worker → Workers AI
```

Điều này giúp API phản hồi nhanh hơn và retry AI đáng tin cậy hơn.

**2. Authentication & authorization**

Thêm user identity và permission để notes không phải dữ liệu dùng chung cho tất cả người dùng.

**3. Search / semantic search**

Thêm khả năng tìm kiếm notes theo nội dung hoặc semantic similarity. Điều này giúp ứng dụng trở thành một research note assistant thực tế hơn thay vì chỉ là CRUD + AI analysis.

## Testing

Chạy test:

```bash
npm test
```

Các trường hợp chính:

- Tạo text note.
- Upload `.txt` / `.md`.
- File không hợp lệ.
- File rỗng.
- File vượt quá giới hạn.
- AI trả về malformed response.
- Workers AI failure.
- Retry sau khi AI failure.
- Concurrent analyze request.

## Deployment

Deploy Worker:

```bash
npx wrangler deploy
```

Apply D1 migration cho production:

```bash
npx wrangler d1 migrations apply ai-research-notes-db --remote
```

Production:

```text
https://ai-research-note-assistant-yamiatem.workers.dev
```

## Limitations

- UI hiện tại đơn giản và tập trung vào chức năng chính.
- Chưa có authentication / authorization.
- Chưa có background queue cho AI processing.
- Chưa có search / vector-based semantic search.
- Phụ thuộc vào availability và giới hạn của Workers AI / Cloudflare Workers.
