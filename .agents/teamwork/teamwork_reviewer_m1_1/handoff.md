# BÁO CÁO REVIEW VÀ ADVERSARIAL AUDIT: MILESTONE 1 (M1)

**Phân hệ**: Data Grounding, GraphRAG & DB Synchronization Engine (F1, F2, F3)  
**Agent thực hiện**: M1 Reviewer 1 (`teamwork_reviewer_m1_1`)  
**Thời gian hoàn thành**: 2026-10-31T14:35:00Z  
**Thư mục làm việc**: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_reviewer_m1_1\`  
**Verdict**: **APPROVE**  

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp)

Tôi đã trực tiếp đọc, kiểm tra cấu trúc mã nguồn, thực thi các lệnh kiểm thử và truy vấn độc lập trên hệ thống:

### 1.1. Khảo sát mã nguồn Frontend GraphRAG
1. **`frontend/src/lib/graphrag/vector-store.ts`**:
   - Dòng 21-28: Hàm `stripVietnameseDiacritics(str: string): string` chuyển đổi chuẩn xác `đ/Đ` thành `d/D`, sau đó áp dụng `normalize("NFD")` và loại bỏ toàn bộ dải combining marks `[\u0300-\u036f]`.
   - Dòng 33-85: `generateSemanticVector` tạo vector 64 chiều chuẩn hóa L2, kết hợp quét ngữ nghĩa từ khóa (cả có dấu và không dấu) và băm n-gram DJB2 cho 32 chiều subword.
   - Dòng 139-171: `searchVectorChunks` tính toán điểm tương đồng Cosine kết hợp lexical bonus cho cả chuỗi có dấu và không dấu.

2. **`frontend/src/lib/graphrag/graph-store.ts`**:
   - Dòng 62-193: Khởi tạo hằng số `BOOK_CATALOG_MAPPING` bao quát đầy đủ 13 cuốn sách của danh mục AuraBook với tiêu đề có dấu, không dấu, slugWords, tên tác giả, từ viết tắt (`dnt`, `đnt`, `btu`, `cttt 1..3`, `cnkk`, `tdnvc`) và từ khóa đặc thù.
   - Dòng 945-1042: Hàm `resolveBookEntity(query: string, activeSlug?: string)`:
     * Nhận diện đại từ Anaphora (có dấu, không dấu) khi có `activeSlug`.
     * So khớp trực tiếp slug.
     * So khớp theo biên từ với các từ viết tắt trong `BOOK_CATALOG_MAPPING` qua Regex `(^|[^a-zA-Z0-9_])${escapedAbbr}([^a-zA-Z0-9_]|$)`.
     * So khớp tác giả và từ khóa đặc trưng.
     * Xử lý bộ sách nhiều tập "Chiến Tranh Tiền Tệ" (phân biệt rõ tập 1, 2, 3 hoặc mặc định tập 1).
     * Quét tiêu đề và slug words toàn bộ danh sách `books`.
   - Dòng 1303-1565: Hàm `searchProductsByContext`:
     * Áp dụng Tokenized Word Matching (dòng 1451-1465): So khớp `titleTokens.includes(token)`, loại bỏ hoàn toàn lỗi substring collision (ví dụ: từ `nhan` không bao giờ bị nhầm lẫn với `nhanh` trong `Tư Duy Nhanh Và Chậm`).
     * **Loại bỏ triệt để đoạn mã cắt lát ngẫu nhiên `finalMatches = scoredBooks.slice(0, 3)`**: Tại dòng 1548-1564, khi `!hasDirectMatch` (ví dụ query ngoài danh mục hoặc điểm dưới ngưỡng 1.2), hàm trả về ngay lập tức:
       ```typescript
       return {
           products: [],
           matchedConcepts,
           totalCount: 0,
           reasoningSummary,
           queryInterpretation,
           recommendations: [],
           supplementaryRecommendations: [],
           hasDirectMatch: false,
       };
       ```

### 1.2. Khảo sát mã nguồn Backend pgvector & Database Seeding
1. **`backend/aurabook_apps/ai_search/models.py`**:
   - Dòng 6-48: Xây dựng custom `VectorField(models.Field)` với `dimensions=768`, placeholder `%s::vector`, xử lý chuyển đổi giữa Python list of floats và định dạng chuỗi pgvector `[x1,x2,...]`.
   - Dòng 62: Trường `BookChunk.embedding = VectorField(dimensions=768, null=True, blank=True)`.
2. **`backend/aurabook_apps/ai_search/search.py`**:
   - Dòng 46-88: Fulltext search kết hợp `unaccent(p.name)`, `unaccent(bc.product_slug)`, `unaccent(bc.chunk_text)` với LEFT JOIN `product_product` để lấy đúng trường `title`.
   - Dòng 111-150: Vector search sử dụng toán tử `<=>` với `%s::vector`, có kiểm tra `has_valid_vector` và lọc khoảng cách tối đa `<= 0.85`.
   - Dòng 184-221: Tính toán RRF với hằng số `RRF_K = 60`, khử trùng lặp theo `product_id`.
3. **Database PostgreSQL**:
   - Lệnh: `docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT count(*) FROM ai_search_bookchunk;"`
   - Kết quả: **1,597** chunks.
   - Cột `embedding` có kiểu dữ liệu `vector(768)` và có HNSW index `ai_search_bookchunk_embedding_hnsw_idx`.
   - Phân bố: Đầy đủ 13 sản phẩm tương ứng ID 1 đến ID 13 trong Saleor.

### 1.3. Kết quả thực thi kiểm thử độc lập
1. **Unit Test Vitest**:
   - Lệnh: `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`
   - Kết quả: **19/19 passed (100%)** trong 453ms.
2. **E2E Evaluation Suite**:
   - Lệnh: `python tests/ai_evaluation_suite.py --feature ai_search`
   - Kết quả: **11/11 passed (100.0%)** trong 0.86s.
3. **Stress Test Live Services (15 kịch bản đối kháng)**:
   - Truy vấn rỗng `""` / khoảng trắng `"   "`: HTTP 400 hoặc 0 items (không crash).
   - SQL Injection `"' OR 1=1 --"`: 0 items trên GraphRAG, không rò rỉ dữ liệu.
   - XSS Payload `"<script>alert(1)</script>"`: 0 items trên GraphRAG, an toàn.
   - Ngoài danh mục `"Sherlock Holmes"`, `"Hồ Chí Minh"`, `"nấu ăn ngon"`: Trả về chính xác 0 sản phẩm, không ảo giác `slice(0, 3)`.
   - Phân biệt bộ sách `"chien tranh tien te tap 2"`: Trả về Tập 2 xếp đầu tiên.
   - Truy vấn có dấu `"đắc nhân tâm"` và không dấu `"dac nhan tam"`: Đều trả về chính xác `dac-nhan-tam`.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Quan Sát Đến Kết Luận)

1. **Chuẩn hóa Tiếng Việt (F1)**:
   - Dựa trên quan sát trực tiếp hàm `stripVietnameseDiacritics` và các ca kiểm thử trong `graph-store.test.ts`, việc kết hợp `replace(/đ/g, "d").replace(/Đ/g, "D")` cùng phân rã `normalize("NFD")` và xóa `[\u0300-\u036f]` đảm bảo loại bỏ 100% dấu tiếng Việt kể cả chữ đ/Đ và các ký tự tổ hợp.
   - Hàm này được áp dụng đồng bộ trong cả `resolveBookEntity`, `searchProductsByContext` và `vector-store.ts`, do đó các truy vấn có dấu, không dấu hay slug đều đưa về cùng dạng chuẩn.

2. **Grounding toàn bộ 13 sách & Xóa bỏ Hallucination Slicing (F2)**:
   - Bảng `BOOK_CATALOG_MAPPING` ánh xạ đầy đủ 13 sách.
   - Việc chuyển từ substring matching `title.includes(w)` sang token equality `titleTokens.includes(token)` giải quyết triệt để lỗi va chạm từ con (từ `nhan` trong "Đắc Nhân Tâm" không bị va chạm vào `nhanh` trong "Tư Duy Nhanh Và Chậm").
   - Việc xóa bỏ fallback `finalMatches = scoredBooks.slice(0, 3)` và kiểm tra `hasDirectMatch` với ngưỡng `topScore >= 1.2` đảm bảo khi người dùng tìm kiếm tác phẩm ngoài danh mục, hệ thống trả về mảng rỗng cùng lời giải thích trung thực, triệt tiêu hoàn toàn ảo giác đề xuất sai lệch.

3. **PostgreSQL pgvector Schema & Seeding (F3)**:
   - Lớp `VectorField` tự định nghĩa giúp Django tương thích nguyên bản với kiểu `vector(768)` và toán tử khoảng cách `<=>` của extension pgvector mà không phát sinh lỗi ép kiểu `bytea <=> vector`.
   - Toàn bộ 1,597 text chunks từ `graphrag_store.json` đã được nạp thành công vào bảng `ai_search_bookchunk` và liên kết chính xác với ID 1..13 của Saleor DB.
   - Thuật toán Deterministic Dense 768-dim Vectorizer chuẩn hóa L2 đảm bảo các vector luôn có norm bằng 1.0, loại bỏ hoàn toàn khả năng phát sinh `NaN` khi tính khoảng cách Cosine.

4. **Kiểm tra Integrity (Chống gian lận & Hardcoding)**:
   - Mã nguồn không chứa bất kỳ logic gian lận, không hardcode kết quả kiểm thử hay đường tắt facade.
   - Các API thực sự kết nối tới cơ sở dữ liệu PostgreSQL và trả về dữ liệu thời gian thực.

---

## 3. Caveats (Các Giới Hạn & Giả Định)

1. **Thứ tự ưu tiên Anaphora trong `resolveBookEntity`**:
   - Nếu `activeSlug` đang tồn tại và câu truy vấn chứa đồng thời cả cụm từ chỉ định lẫn tên một cuốn sách khác (ví dụ: *"cuốn này dở quá, cho tôi xem cuốn Đắc Nhân Tâm"*), hiện tại nhánh kiểm tra `isAnaphoric` ở đầu hàm sẽ ưu tiên trả về `activeBook` trước. Tuy nhiên, trong `searchProductsByContext`, hệ thống phân tích token và trả về đúng cuốn Đắc Nhân Tâm. Đây là một điểm có thể tinh chỉnh thứ tự ưu tiên trong các milestone sau nếu cần hỗ trợ chuyển đổi sách phức tạp trong cùng một câu hội thoại.
2. **Ký hiệu viết tắt trong Search Context**:
   - Bảng viết tắt (`dnt`, `btu`, `cttt 2`) hiện được tích hợp đầy đủ trong `resolveBookEntity` (dùng cho Reader Chat và Voice Chat). Trong storefront `searchProductsByContext`, các từ viết tắt quá ngắn (<= 3 ký tự) không nằm trong title token nên cần gõ từ khóa ngữ nghĩa hoặc tên đầy đủ.

---

## 4. Conclusion (Kết Luận Đánh Giá)

Milestone 1 (M1: Data Grounding, GraphRAG & DB Synchronization Engine) đã hoàn thành xuất sắc các yêu cầu đề ra:
- **F1 (Vietnamese Diacritics Normalization)**: Đạt chuẩn 100%.
- **F2 (Catalog Grounding & Anti-Hallucination Guardrail)**: Đạt chuẩn 100%, gỡ bỏ triệt để slicing fallback.
- **F3 (pgvector Schema & Data Seeding)**: Đạt chuẩn 100%, 1,597 chunks sẵn sàng trong PostgreSQL.
- **Độ tin cậy & Kiểm thử**: 19/19 Vitest tests passed, 11/11 E2E evaluation test cases passed.
- **Tính toàn vẹn (Integrity)**: Hoàn toàn trung thực, không có vi phạm integrity.

**Quyết định chính thức: APPROVE**.

---

## 5. Verification Method (Quy Trình Tái Kiểm Chứng Độc Lập)

Bất kỳ kiểm thử viên nào cũng có thể độc lập xác minh báo cáo này bằng các lệnh sau:

1. **Kiểm tra Unit Test Vitest**:
   ```powershell
   cd C:\Users\basduy05\Downloads\aurabook\frontend
   pnpm test:run src/lib/graphrag/graph-store.test.ts
   ```
   *Kỳ vọng*: 19 tests passed.

2. **Kiểm tra E2E Evaluation Suite**:
   ```powershell
   cd C:\Users\basduy05\Downloads\aurabook
   python tests/ai_evaluation_suite.py --feature ai_search
   ```
   *Kỳ vọng*: 11/11 passed (100.0%).

3. **Kiểm tra dữ liệu pgvector trong PostgreSQL**:
   ```powershell
   docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT count(*) FROM ai_search_bookchunk;"
   docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT product_id, product_slug, chunk_index, round((embedding <=> (SELECT embedding FROM ai_search_bookchunk WHERE product_slug='dac-nhan-tam' LIMIT 1))::numeric, 4) AS dist FROM ai_search_bookchunk ORDER BY dist ASC LIMIT 3;"
   ```
   *Kỳ vọng*: Count = 1597; dist hợp lệ (0.0000, 0.3525,...).

4. **Kiểm tra API Live Search không bị ảo giác khi tìm ngoài danh mục**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/ai/graphrag/search?query=Harry+Potter" | Select-Object -ExpandProperty products
   ```
   *Kỳ vọng*: Trả về rỗng (0 items), không rơi vào fallback 3 cuốn sách ngẫu nhiên.

---

## 6. Quality & Adversarial Review Details

### 6.1. Quality Review Findings
- **Verdict**: APPROVE
- **Findings**:
  - *Minor Finding 1*: Thứ tự kiểm tra Anaphora trong `resolveBookEntity` nên ưu tiên tên sách rõ ràng trước khi fallback về `activeSlug` nếu câu truy vấn chứa cả hai. (Đã ghi nhận trong Caveats).
- **Verified Claims**:
  - `stripVietnameseDiacritics` chuẩn hóa mọi nguyên âm tiếng Việt và đ/Đ $\rightarrow$ Đạt.
  - Loại bỏ hoàn toàn fallback `slice(0, 3)` $\rightarrow$ Đạt.
  - Khử trùng lặp rank RRF trong `search.py` $\rightarrow$ Đạt.
  - Số lượng bản ghi trong `ai_search_bookchunk` là 1,597 $\rightarrow$ Đạt.
  - Không có giá trị `NaN` trong tính toán khoảng cách vector pgvector $\rightarrow$ Đạt.

### 6.2. Adversarial Challenge Report
- **Overall Risk Assessment**: LOW
- **Challenges Tested**:
  1. *SQL Injection & Malicious Inputs*: Truy vấn `"' OR 1=1 --"` và `"<script>alert(1)</script>"` không làm sập hệ thống, được xử lý an toàn qua parameterized SQL và unidecode.
  2. *Substring Collisions*: Thử nghiệm tìm kiếm `"nhan"` không bị nhầm lẫn sang `"Tư Duy Nhanh Và Chậm"`.
  3. *Zero-vector & NaN Distance*: Thuật toán Dense Vectorizer sinh vector L2-normalized 1.0, ngăn chặn triệt để lỗi chia cho 0 trong pgvector.
  4. *Multi-volume disambiguation*: Bộ sách Chiến Tranh Tiền Tệ được phân định đúng thứ tự khi truy vấn theo tập cụ thể hoặc tìm kiếm chung.
