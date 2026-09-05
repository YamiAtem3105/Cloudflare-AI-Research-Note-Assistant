export function renderUI(): string {
  return `<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>AI Research Notes</title>


  <style>

    /* ==================== GLOBAL ==================== */

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f7fb;
      color: #1f2937;
    }


    /* ==================== HEADER ==================== */

    header {
      background: #111827;
      color: white;
      padding: 18px 32px;

      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    header h1 {
      margin: 0;
      font-size: 22px;
    }


    /* ==================== MAIN ==================== */

    main {
      max-width: 1100px;
      margin: 30px auto;
      padding: 0 20px;
    }


    /* ==================== BUTTONS ==================== */

    button {
      border: 0;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
    }

    .primary {
      background: #2563eb;
      color: white;
    }

    /* Nút bị khóa khi đang xử lý */
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }


    /* ==================== PANEL ==================== */

    .panel {
      background: white;
      border-radius: 12px;
      padding: 24px;

      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }


    /* ==================== NOTES LIST ==================== */

    /* Khung chứa danh sách các note */
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Một note trong danh sách */
    .note-item {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      background: white;
      cursor: pointer;
    }

    /* Hiệu ứng khi đưa chuột vào note */
    .note-item:hover {
      background: #f9fafb;
    }

    /* Tiêu đề note */
    .note-title {
      margin: 0 0 8px 0;
      font-size: 17px;
    }

    /* Thông tin phụ của note */
    .note-info {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 13px;
      color: #6b7280;
    }

    /* Badge trạng thái */
    .status {
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Trạng thái pending */
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    /* Trạng thái processing */
    .status-processing {
      background: #dbeafe;
      color: #1e40af;
    }

    /* Trạng thái done */
    .status-done {
      background: #dcfce7;
      color: #166534;
    }

    /* Trạng thái failed */
    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }


    /* ==================== RETRY BUTTON ==================== */

    /* Khung chứa nút Retry */
    .retry-container {
      margin-top: 12px;
    }


    /* ==================== NOTE DETAIL ==================== */

    /* Khung hiển thị chi tiết note */
    .note-detail {
      margin-top: 20px;
    }

    /* Một dòng thông tin */
    .detail-row {
      margin-bottom: 12px;
    }

    /* Tên field */
    .detail-label {
      font-weight: 600;
    }

    /* Nội dung detail */
    .detail-content {
      margin-top: 20px;
      line-height: 1.6;
    }


    /* ==================== FORM ==================== */

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }

    input,
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
    }

    textarea {
      min-height: 180px;
      resize: vertical;
    }


    /* ==================== SOURCE OPTIONS ==================== */

    .source-options {
      display: flex;
      gap: 20px;
    }

    .source-option {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: normal;
    }

    .source-option input {
      width: auto;
    }


    /* ==================== FORM ACTIONS ==================== */

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }


    /* ==================== UTILITY ==================== */

    .hidden {
      display: none;
    }

  </style>

</head>


<body>


  <!-- ==================== HEADER ==================== -->

  <header>

    <h1>AI Research Notes</h1>

    <!-- Nút mở danh sách các note -->
    <button
      class="primary"
      id="notes-button"
    >
      View NoteList
    </button>

  </header>


  <main>


    <!-- ==================== NOTES LIST PANEL ==================== -->

    <!--
      Panel danh sách note.
      Mặc định bị ẩn.
      JavaScript sẽ hiện panel này khi bấm View NoteList.
    -->

    <section
      class="panel hidden"
      id="notes-panel"
    >

      <h2>Notes</h2>

      <!--
        Danh sách note sẽ được JavaScript
        lấy từ GET /notes và render vào đây.
      -->

      <div
        class="notes-list"
        id="notes-list"
      >
        <p>No notes yet.</p>
      </div>

    </section>


    <!-- ==================== NOTE DETAIL PANEL ==================== -->

    <!--
      Panel hiển thị chi tiết của một note.
      Mặc định bị ẩn.
      Khi click vào một note,
      JavaScript sẽ gọi GET /notes/:id
      rồi hiện panel này.
    -->

    <section
      class="panel hidden"
      id="detail-panel"
    >

      <h2>Note Detail</h2>

      <!-- Nội dung detail sẽ được JavaScript render vào đây -->

      <div
        class="note-detail"
        id="note-detail"
      >
      </div>

    </section>


    <!-- ==================== CREATE NOTE PANEL ==================== -->

    <!--
      Panel tạo / upload note.
      Mặc định được hiển thị.
    -->

    <section
      class="panel"
      id="create-panel"
    >

      <h2>Create / Upload Note</h2>


      <!-- ==================== TITLE ==================== -->

      <!-- Nhập tiêu đề note -->

      <div class="form-group">

        <label for="title">
          Title
        </label>

        <input
          id="title"
          type="text"
          placeholder="Enter note title"
        />

      </div>


      <!-- ==================== SOURCE ==================== -->

      <!-- Chọn nguồn dữ liệu: Text hoặc File -->

      <div class="form-group">

        <label>
          Source
        </label>

        <div class="source-options">


          <!-- Chọn Text -->

          <label class="source-option">

            <input
              type="radio"
              name="source"
              value="text"
              id="source-text"
              checked
            />

            Text

          </label>


          <!-- Chọn File -->

          <label class="source-option">

            <input
              type="radio"
              name="source"
              value="file"
              id="source-file"
            />

            File

          </label>


        </div>

      </div>


      <!-- ==================== TEXT INPUT ==================== -->

      <!-- Hiện khi user chọn Text -->

      <div
        class="form-group"
        id="text-input-group"
      >

        <label for="content">
          Content
        </label>

        <textarea
          id="content"
          placeholder="Write your research note here..."
        ></textarea>

      </div>


      <!-- ==================== FILE INPUT ==================== -->

      <!-- Hiện khi user chọn File -->

      <div
        class="form-group hidden"
        id="file-input-group"
      >

        <label for="file">
          Upload file
        </label>

        <input
          id="file"
          type="file"
          accept=".txt,.md"
        />

      </div>


      <!-- ==================== FORM ACTIONS ==================== -->

      <div class="form-actions">

        <button
          class="primary"
          id="create-note-button"
        >
          Create Note
        </button>

      </div>


    </section>


  </main>


  <!-- ==================== JAVASCRIPT ==================== -->

  <script>


    // ==================== ELEMENTS ====================

    // Nút mở danh sách note
    const notesButton =
      document.getElementById("notes-button");

    // Khung danh sách note
    const notesPanel =
      document.getElementById("notes-panel");

    // Khung detail
    const detailPanel =
      document.getElementById("detail-panel");

    // Khung tạo note
    const createPanel =
      document.getElementById("create-panel");

    // Khu vực chứa danh sách note
    const notesList =
      document.getElementById("notes-list");

    // Khu vực hiển thị detail
    const noteDetail =
      document.getElementById("note-detail");


    // ==================== NOTES LIST ====================

    // Khi bấm View NoteList
    notesButton.addEventListener("click", async () => {

      // Hiện Notes List
      notesPanel.classList.remove("hidden");

      // Ẩn Note Detail
      detailPanel.classList.add("hidden");

      // Ẩn Create / Upload
      createPanel.classList.add("hidden");

      // Gọi API GET /notes
      await loadNotes();

    });


    // ==================== LOAD NOTES ====================

    // Lấy danh sách note từ backend
    async function loadNotes() {

      try {

        // Gửi request tới GET /notes
        const response =
          await fetch("/notes");


        // Đọc JSON từ backend
        const result =
          await response.json();


        // Backend trả lỗi
        if (!response.ok) {

          notesList.innerHTML =
            "<p>Failed to load notes.</p>";

          return;
        }


        // Không có note
        if (!result || result.length === 0) {

          notesList.innerHTML =
            "<p>No notes yet.</p>";

          return;
        }


        // Xóa nội dung cũ
        notesList.innerHTML = "";


        // ==================== RENDER NOTES ====================

        // Render từng note
        result.forEach((note) => {

          // Tạo element cho một note
          const noteElement =
            document.createElement("div");

          noteElement.className =
            "note-item";


          // ==================== NOTE CLICK ====================

          // Cho phép click vào note
          noteElement.addEventListener("click", () => {

            // Lấy detail của note này
            loadNoteDetail(note.id);

          });


          // ==================== RETRY BUTTON ====================

          // Biến chứa HTML của nút Retry
          let retryButton = "";


          // Chỉ tạo Retry nếu note có trạng thái failed
          if (note.status === "failed") {

            retryButton = \`
              <div class="retry-container">

                <button
                  class="primary retry-button"
                  data-id="\${note.id}"
                >
                  Retry
                </button>

              </div>
            \`;

          }


          // ==================== NOTE CONTENT ====================

          // Hiển thị thông tin note
          noteElement.innerHTML = \`
            <h3 class="note-title">
              \${note.title}
            </h3>

            <div class="note-info">

              <span>
                \${note.source_type}
              </span>

              <span
                class="status status-\${note.status}"
              >
                \${note.status}
              </span>

            </div>

            \${retryButton}
          \`;


          // ==================== RETRY EVENT ====================

          // Nếu note failed thì gắn sự kiện cho Retry
          if (note.status === "failed") {

            const retryElement =
              noteElement.querySelector(".retry-button");


            retryElement.addEventListener(
              "click",
              async (event) => {

                // Ngăn click Retry mở Note Detail
                event.stopPropagation();


                // Khóa nút trong lúc retry
                retryElement.disabled = true;
                retryElement.textContent = "Retrying...";


                try {

                  // Gọi API POST /notes/:id/retry
                  const response =
                    await fetch(
                      "/notes/" + note.id + "/retry",
                      {
                        method: "POST",
                      }
                    );


                  // Đọc response
                  const result =
                    await response.json();


                  // Retry thất bại
                  if (!response.ok) {

                    alert(
                      result.error ||
                      "Failed to retry note."
                    );

                    retryElement.disabled = false;
                    retryElement.textContent = "Retry";

                    return;
                  }


                  // Retry thành công
                  alert(
                    "Retry started successfully."
                  );


                  // Load lại danh sách
                  // để cập nhật status
                  await loadNotes();


                } catch (error) {

                  console.error(error);

                  alert(
                    "Failed to connect to server."
                  );

                  retryElement.disabled = false;
                  retryElement.textContent = "Retry";

                }

              }
            );

          }


          // Thêm note vào danh sách
          notesList.appendChild(noteElement);

        });


      } catch (error) {

        // Lỗi kết nối / lỗi bất ngờ
        console.error(error);

        notesList.innerHTML =
          "<p>Failed to connect to server.</p>";

      }

    }


    // ==================== LOAD NOTE DETAIL ====================

    // Lấy detail của một note
    async function loadNoteDetail(id) {

      try {

        // Gọi API GET /notes/:id
        const response =
          await fetch("/notes/" + id);


        // Đọc JSON từ backend
        const result =
          await response.json();


        // Backend trả lỗi
        if (!response.ok) {

          alert(
            result.error ||
            "Failed to load note detail."
          );

          return;
        }


        // Ẩn danh sách note
        notesPanel.classList.add("hidden");


        // Ẩn Create / Upload
        createPanel.classList.add("hidden");


        // Hiện detail
        detailPanel.classList.remove("hidden");


        // Hiển thị detail
        noteDetail.innerHTML = \`

          <div class="detail-row">

            <span class="detail-label">
              Title:
            </span>

            \${result.title}

          </div>


          <div class="detail-row">

            <span class="detail-label">
              Source:
            </span>

            \${result.source_type}

          </div>


          <div class="detail-row">

            <span class="detail-label">
              Status:
            </span>

            <span
              class="status status-\${result.status}"
            >
              \${result.status}
            </span>

          </div>


          <div class="detail-row">

            <span class="detail-label">
              Category:
            </span>

            \${result.category || "N/A"}

          </div>


          <div class="detail-row">

            <span class="detail-label">
              Tags:
            </span>

            \${result.tags_json || "N/A"}

          </div>


          <div class="detail-content">

            <div class="detail-label">
              Summary:
            </div>

            <p>
              \${result.summary || "No summary available."}
            </p>

          </div>

        \`;

      } catch (error) {

        // Lỗi kết nối / lỗi bất ngờ
        console.error(error);

        alert(
          "Failed to connect to server."
        );

      }

    }


    // ==================== SOURCE TOGGLE ====================

    // Lấy các phần tử Text / File
    const sourceText =
      document.getElementById("source-text");

    const sourceFile =
      document.getElementById("source-file");

    const textInputGroup =
      document.getElementById("text-input-group");

    const fileInputGroup =
      document.getElementById("file-input-group");


    // Khi chọn Text
    sourceText.addEventListener("change", () => {

      // Hiện ô nhập text
      textInputGroup.classList.remove("hidden");

      // Ẩn ô upload file
      fileInputGroup.classList.add("hidden");

    });


    // Khi chọn File
    sourceFile.addEventListener("change", () => {

      // Ẩn ô nhập text
      textInputGroup.classList.add("hidden");

      // Hiện ô upload file
      fileInputGroup.classList.remove("hidden");

    });


    // ==================== CREATE NOTE ====================

    // Lấy các phần tử của form
    const titleInput =
      document.getElementById("title");

    const contentInput =
      document.getElementById("content");

    const fileInput =
      document.getElementById("file");

    const createButton =
      document.getElementById("create-note-button");


    // Xử lý khi user bấm Create Note
    createButton.addEventListener("click", async () => {

      // Lấy title
      const title =
        titleInput.value.trim();


      // Kiểm tra title trước khi khóa nút
      if (!title) {

        alert("Please enter a title.");

        return;
      }


      // Khóa nút để tránh user bấm nhiều lần
      createButton.disabled = true;
      createButton.textContent = "Creating...";


      // ==================== TEXT NOTE ====================

      if (sourceText.checked) {

        const content =
          contentInput.value.trim();


        // Kiểm tra content
        if (!content) {

          alert("Please enter note content.");

          createButton.disabled = false;
          createButton.textContent = "Create Note";

          return;
        }


        try {

          // Gửi JSON tới POST /notes
          const response =
            await fetch("/notes", {

              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                title,
                content,
              }),

            });


          // Đọc response từ backend
          const result =
            await response.json();


          // Backend trả lỗi
          if (!response.ok) {

            alert(
              result.error ||
              "Failed to create note."
            );

            createButton.disabled = false;
            createButton.textContent = "Create Note";

            return;
          }


          // Tạo note thành công
          alert("Note created successfully!");


          // Xóa form
          titleInput.value = "";
          contentInput.value = "";


          // Mở khóa button
          createButton.disabled = false;
          createButton.textContent = "Create Note";


        } catch (error) {

          console.error(error);

          alert("Failed to connect to server.");

          createButton.disabled = false;
          createButton.textContent = "Create Note";

        }


        return;

      }


      // ==================== FILE NOTE ====================

      if (sourceFile.checked) {

        const file =
          fileInput.files?.[0];


        // Kiểm tra file
        if (!file) {

          alert("Please select a file.");

          createButton.disabled = false;
          createButton.textContent = "Create Note";

          return;
        }


        try {

          // FormData dùng để gửi file
          const formData =
            new FormData();


          formData.append("title", title);
          formData.append("file", file);


          // Gửi tới POST /notes
          const response =
            await fetch("/notes", {

              method: "POST",

              body: formData,

            });


          // Đọc response
          const result =
            await response.json();


          // Backend trả lỗi
          if (!response.ok) {

            alert(
              result.error ||
              "Failed to create note."
            );

            createButton.disabled = false;
            createButton.textContent = "Create Note";

            return;
          }


          // Tạo note thành công
          alert("Note created successfully!");


          // Xóa form
          titleInput.value = "";
          fileInput.value = "";


          // Mở khóa button
          createButton.disabled = false;
          createButton.textContent = "Create Note";


        } catch (error) {

          console.error(error);

          alert("Failed to connect to server.");

          createButton.disabled = false;
          createButton.textContent = "Create Note";

        }

      }

    });


  </script>


</body>

</html>`;
}

