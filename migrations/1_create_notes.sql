CREATE TABLE notes (
    id TEXT PRIMARY KEY,                         -- ID duy nhất của note

    title TEXT NOT NULL,                         -- Tiêu đề note

    source_type TEXT NOT NULL                    -- Nguồn nội dung: text hoặc file 
        CHECK (source_type IN ('text', 'file')),

    content TEXT,                                -- Nội dung text đã được chuẩn hóa lấy từ 2 loại source_type

    object_key TEXT,                             -- Key/đường dẫn của file được lưu trong R2

    original_name TEXT,                          -- Tên file gốc user upload, ví dụ: notes.md

    content_type TEXT,                           -- MIME type của file, ví dụ: text/plain, text/markdown

    size INTEGER,                                -- Kích thước file tính bằng byte

    status TEXT NOT NULL DEFAULT 'pending'       -- Trạng thái xử lý AI
        CHECK (status IN ('pending', 'processing', 'done', 'failed')),

    summary TEXT,                                -- Tóm tắt do Workers AI tạo

    category TEXT,                               -- Phân loại do AI tạo: research, project, ...

    tags_json TEXT,                              -- Danh sách tags do AI tạo, lưu dưới dạng JSON

    error_message TEXT,                          -- Nội dung lỗi nếu quá trình xử lý thất bại

    created_at TEXT NOT NULL,                    -- Thời điểm tạo note

    updated_at TEXT NOT NULL                     -- Thời điểm cập nhật note gần nhất
);