# BÁO CÁO GIÁM ĐỊNH TÍNH TOÀN VẸN (FORENSIC AUDIT REPORT): MILESTONE 1 (M1)

**Dự án**: Aurabook AI Platform  
**Phân hệ**: Milestone 1 (M1) — Data Grounding, GraphRAG & DB Synchronization Engine (F1, F2, F3)  
**Agent thực hiện**: M1 Forensic Auditor (`teamwork_auditor_m1`)  
**Hồ sơ kiểm định**: General Project (Chế độ `development` từ `ORIGINAL_REQUEST.md`)  
**Kết luận giám định (Verdict)**: **CLEAN**

---

## Forensic Audit Report Summary

**Work Product**: Milestone 1 Implementation Files  
**Profile**: General Project (`development` mode)  
**Verdict**: **CLEAN**

### Phase Results
- **Hardcoded test results**: **PASS** — Không tìm thấy bất kỳ mã cứng nào so khớp chuỗi kiểm thử (ví dụ: `if query == ...`) hay phụ thuộc vào mã ca kiểm thử (`TC-T1-06`, etc.).
- **Facade implementations**: **PASS** — Toàn bộ logic (bỏ dấu tiếng Việt, băm vector ngữ nghĩa dense 768 chiều, so khớp thực thể, thuật toán RRF k=60, pgvector `<=>`) đều là mã tính toán và truy vấn cơ sở dữ liệu thực chất 100%.
- **Pre-populated artifacts**: **PASS** — Không có file log giả mạo; các báo cáo kiểm thử được tạo ra từ việc chạy kịch bản trực tiếp.
- **Database authenticity**: **PASS** — Kiểm tra trực tiếp PostgreSQL `aurabook_db`: bảng `ai_search_bookchunk` có đúng **1,597 bản ghi**, kiểu cột `vector(768)`, phân bổ chuẩn xác trên toàn bộ 13 sách (ID 1 đến 13), tính toán khoảng cách `<=>` ra số thực hợp lệ (không có NaN).
- **Test suite execution authentic**: **PASS** — Chạy trực tiếp 19/19 unit tests Vitest và 11/11 test cases của `ai_search` trong bộ kiểm thử `tests/ai_evaluation_suite.py` đều đạt kết quả 100% Pass.

---

## 1. Observation (Các Bằng Chứng Thực Nghiệm Trực Tiếp)

### 1.1. Kiểm tra mã nguồn 9 tập tin thay đổi
Kiểm tra chi tiết từng dòng trong 9 tập tin thuộc Milestone 1:
1. `frontend/src/lib/graphrag/graph-store.ts`:
   - Hàm `stripVietnameseDiacritics` (dòng 21-28 của `vector-store.ts`, xuất khẩu tại dòng 14): Sử dụng chuẩn hóa NFD, thay thế `đ/Đ` -> `d/D` và xóa dải ký tự kết hợp `[\u0300-\u036f]`.
   - `BOOK_CATALOG_MAPPING` (dòng 62-193): Khai báo ánh xạ 13 cuốn sách thực tế của AuraBook với tiêu đề có dấu/không dấu, từ viết tắt (`dnt`, `btu`, `cttt 1..3`, `ttdt`, `cnkk`, `tdnvc`), tác giả và từ khóa ngữ nghĩa.
   - `resolveBookEntity` (dòng 945-1042): Kiểm tra đại từ chỉ định anaphora (regex có dấu & không dấu), so khớp slug, duyệt catalog mapping theo biên từ, xử lý bộ sách nhiều tập Chiến Tranh Tiền Tệ, duyệt nodes trong store. Không có bất kỳ logic so sánh cứng `query == "dac nhan tam"`.
   - `searchProductsByContext` (dòng 1548-1565): Đoạn mã cắt lát ép buộc `finalMatches = scoredBooks.slice(0, Math.min(3, scoredBooks.length))` đã được gỡ bỏ hoàn toàn. Khi `!hasDirectMatch`, hàm trả về `products: []`, `totalCount: 0`, `recommendations: []`, `hasDirectMatch: false`.
2. `frontend/src/lib/graphrag/vector-store.ts`:
   - `generateSemanticVector`: Băm từ khóa ngữ nghĩa kết hợp DJB2 n-gram băm và chuẩn hóa L2-norm (64 chiều).
   - `searchVectorChunks`: Tính Cosine Similarity chuẩn xác kết hợp lexical bonus cho cả chuỗi có dấu và không dấu.
3. `frontend/src/lib/graphrag/graph-store.test.ts`:
   - 19 ca kiểm thử độc lập kiểm tra normalization, catalog mapping, anaphora, và context search.
4. `backend/aurabook_apps/ai_search/models.py`:
   - Xây dựng `VectorField(models.Field)` với `dimensions=768`, xử lý `db_type="vector(768)"`, `get_placeholder="%s::vector"`, chuyển đổi danh sách float chuẩn hóa sang định dạng vector của PostgreSQL.
5. `backend/aurabook_apps/ai_search/migrations/0002_alter_bookchunk_embedding_to_vector.py`:
   - Migration sử dụng `SeparateDatabaseAndState` chuyển cột `embedding` sang `vector(768)` và tạo index HNSW `ai_search_bookchunk_embedding_hnsw_idx`.
6. `backend/aurabook_apps/ai_search/gemini_client.py`:
   - Định nghĩa thuật toán Deterministic Dense 768-dim Embedding Generator (`generate_dense_768_embedding`) chia 3 dải (Band 1: Themes 0..255, Band 2: Lexical hash 256..639, Band 3: Length & bias 640..767) kèm L2 Normalization `norm = math.sqrt(sum(x * x for x in vec))`. Triệt tiêu triệt để hiện tượng vector rỗng sinh ra `NaN` trong pgvector.
7. `backend/aurabook_apps/ai_search/search.py`:
   - `hybrid_search_rrf`: Kết hợp truy vấn Fulltext PostgreSQL unaccent (`unaccent(p.name)`, `unaccent(bc.product_slug)`, `unaccent(bc.chunk_text)`) với vector cosine distance `(bc.embedding <=> %s::vector)`, xử lý RRF Reciprocal Rank Fusion `1.0 / (RRF_K + rank)`. Khử trùng lặp theo `product_id` giữ chunk gần nhất.
8. `backend/aurabook_apps/ai_search/tasks.py`:
   - Celery task `vectorize_book`: Gỡ bỏ `struct.pack`, truyền trực tiếp list float vào `BookChunk.objects.create`.
9. `scripts/seed_book_chunks.py`:
   - Đọc 1,597 chunks từ `ecommerce-ai-platform/data/graphrag_store.json`, ánh xạ với 13 ID sản phẩm trong bảng `product_product` của Saleor DB, tính vector 768 chiều và nạp bằng SQL batch vào PostgreSQL.

### 1.2. Kết quả kiểm tra thực nghiệm tại PostgreSQL (Container `aurabook-postgres`)
- Lệnh: `docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT count(*) FROM ai_search_bookchunk;"`
  Kết quả trực tiếp:
  ```
   count 
  -------
    1597
  (1 row)
  ```
- Lệnh: `docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "\d ai_search_bookchunk"`
  Kết quả trực tiếp:
  ```
  embedding | vector(768) | | |
  Indexes:
      "ai_search_bookchunk_pkey" PRIMARY KEY, btree (id)
      "ai_search_b_product_1b8244_idx" btree (product_id, chunk_index)
      "ai_search_b_product_81807e_idx" btree (product_slug)
      "ai_search_bookchunk_chunk_text_trgm_idx" gin (chunk_text gin_trgm_ops)
      "ai_search_bookchunk_embedding_hnsw_idx" hnsw (embedding vector_cosine_ops)
      "ai_search_bookchunk_product_id_chunk_index_7809fddc_uniq" UNIQUE CONSTRAINT, btree (product_id, chunk_index)
  ```
- Lệnh: `docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT product_id, product_slug, count(*) FROM ai_search_bookchunk GROUP BY product_id, product_slug ORDER BY CAST(product_id AS INT);"`
  Kết quả: Đầy đủ 13 cuốn sách với ID từ 1 đến 13 (206, 71, 157, 110, 72, 163, 103, 85, 79, 72, 78, 141, 260 chunks).
- Lệnh kiểm tra khoảng cách vector cosine (`<=>`):
  ```
   product_id | product_slug | chunk_index |  dist  
  ------------+--------------+-------------+--------
   1          | dac-nhan-tam |          18 | 0.0000
   1          | dac-nhan-tam |          17 | 0.3525
   1          | dac-nhan-tam |          15 | 0.4132
   1          | dac-nhan-tam |           1 | 0.4205
   1          | dac-nhan-tam |          57 | 0.4228
  ```
  Giá trị khoảng cách là các số thực dương hợp lệ, khoảng cách tới chính nó là `0.0000`, hoàn toàn không có `NaN`.

### 1.3. Kết quả chạy bộ kiểm thử trực tiếp
1. **Vitest Unit Test Suite**:
   - Lệnh: `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`
   - Kết quả: `19 passed (19)` trong `973ms`.
2. **Automated Evaluation Test Suite (`tests/ai_evaluation_suite.py`)**:
   - Lệnh: `python tests/ai_evaluation_suite.py --feature ai_search`
   - Kết quả:
     * `[01/11] TC-T1-06 - Accented Keyword Search for Đắc Nhân Tâm ... PASS (183ms)`
     * `[02/11] TC-T1-07 - Unaccented Diacritics Normalization Search ... PASS (105ms)`
     * `[03/11] TC-T1-08 - Author Entity Search: Yuval Noah Harari ... PASS (107ms)`
     * `[04/11] TC-T1-09 - Backend Hybrid Search RRF for Tư Duy Nhanh ... PASS (117ms)`
     * `[05/11] TC-T1-10 - Conceptual Semantic Search for Stoicism ... PASS (82ms)`
     * `[06/11] TC-T2-06 - Empty Search Query Boundary ... PASS (19ms)`
     * `[07/11] TC-T2-07 - Whitespace-Only Search Query Boundary ... PASS (17ms)`
     * `[08/11] TC-T2-08 - Anti-Hallucination: Out-of-Catalog Book Search ... PASS (137ms)`
     * `[09/11] TC-T2-09 - Adversarial SQL & XSS Injection in Search ... PASS (158ms)`
     * `[10/11] TC-T2-10 - Multi-Volume Series Disambiguation ... PASS (187ms)`
     * `[11/11] TC-T2-20 - Backend Search Query Overload Resilience ... PASS (124ms)`
     * **Tổng số ca kiểm thử**: 11/11 passed (100.0%), thời gian thực thi: 1.25s.

---

## 2. Logic Chain (Suy Luận Từ Bằng Chứng Đến Kết Luận)

1. **Về tính không gian dối (No Hardcoding)**:
   - *Quan sát*: Tìm kiếm chuỗi literal `'== "dac nhan tam"'` và mã `'TC-'` trong toàn bộ mã nguồn trả về 0 kết quả.
   - *Suy luận*: Không có mã nguồn nào được viết để đón đầu cụ thể từng ca kiểm thử. Mọi kết quả tìm kiếm đều được sinh ra qua chuỗi xử lý: `stripVietnameseDiacritics` -> `BOOK_CATALOG_MAPPING` word boundary matching -> PostgreSQL Fulltext `unaccent` -> pgvector `<=>` cosine distance -> RRF.
2. **Về tính thực chất của dữ liệu (Authentic Data Grounding)**:
   - *Quan sát*: PostgreSQL lưu trữ 1,597 bản ghi thực tế từ 13 cuốn sách EPUB với nội dung văn bản đầy đủ và vector 768 chiều.
   - *Suy luận*: Dữ liệu tìm kiếm không phải là dữ liệu giả lập (mock/facade), mà được trích xuất và đồng bộ hóa chuẩn xác từ `graphrag_store.json` vào cơ sở dữ liệu quan hệ và vector engine của hệ thống.
3. **Về tính chống ảo giác (Anti-Hallucination Guardrail)**:
   - *Quan sát*: Truy vấn với sách ngoài danh mục như `"Harry Potter"` trả về `totalCount: 0`, `products: []` và giải thích trung thực thay vì trả về 3 cuốn sách ngẫu nhiên như mã nguồn trước đây.
   - *Suy luận*: Worker đã loại bỏ triệt để hành vi ép cắt lát (`slice(0, 3)`), đáp ứng tuyệt đối tiêu chí R2 và Acceptance Criteria về zero-hallucination.
4. **Về tính ổn định vận hành (Production Reliability)**:
   - *Quan sát*: Kiểm tra các ca injection `' OR 1=1 --`, query rỗng `""`, và query dài hàng ngàn ký tự đều không làm crash backend hay sinh lỗi cơ sở dữ liệu 500. Vector distance không sinh giá trị `NaN`.
   - *Suy luận*: Kiến trúc pgvector và fallback vectorizer vận hành ổn định, sẵn sàng phục vụ cho các phân hệ tiếp theo (M2 Reader AI, M3 Storefront Search UI, M4 Voice Chat).

---

## 3. Caveats (Các Giới Hạn & Phạm Vi Kiểm Định)

- **Phạm vi kiểm định**: Báo cáo này kiểm tra toàn diện mã nguồn và cơ sở dữ liệu thuộc phạm vi Milestone 1 (F1, F2, F3).
- **Các phân hệ tiếp theo**: Phân hệ AI Đọc Sách (`reader-chat`), Giao diện Tìm kiếm Storefront (`search/page.tsx`), và Voice Chat (`voice-agent/chat`, LiveKit) thuộc phạm vi Milestone 2, 3, 4 và sẽ được kiểm định trong các milestone tương ứng.
- Ngoài các giới hạn trên, **No caveats**.

---

## 4. Conclusion (Kết Luận Chung)

- **Verdict**: **CLEAN**
- Sản phẩm công việc của Milestone 1 (M1) hoàn toàn đáp ứng các tiêu chuẩn chất lượng và tính toàn vẹn của dự án:
  1. Không có hardcoded test results.
  2. Không có dummy hay facade implementations.
  3. Dữ liệu PostgreSQL 1,597 bản ghi là dữ liệu thật và toàn vẹn.
  4. Bộ kiểm thử tự động độc lập 19/19 Vitest và 11/11 Evaluation Suite chạy thực tế đạt **100% Pass Rate**.
- Milestone 1 đủ điều kiện phê duyệt hoàn thành.

---

## 5. Verification Method (Phương Pháp Tái Hiện Kiểm Chứng Độc Lập)

Bất kỳ thành viên nào cũng có thể kiểm chứng lại kết quả độc lập bằng các câu lệnh sau trên môi trường:

```powershell
# 1. Kiểm tra số lượng bản ghi trong PostgreSQL (Kỳ vọng: 1597)
docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT count(*) FROM ai_search_bookchunk;"

# 2. Kiểm tra tính toán khoảng cách vector (Kỳ vọng: dist thực tế, không có NaN)
docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SELECT product_id, product_slug, chunk_index, round((embedding <=> (SELECT embedding FROM ai_search_bookchunk WHERE product_slug='dac-nhan-tam' LIMIT 1))::numeric, 4) AS dist FROM ai_search_bookchunk ORDER BY dist ASC LIMIT 5;"

# 3. Chạy kiểm thử tự động Vitest cho GraphStore (Kỳ vọng: 19/19 passed)
cd C:\Users\basduy05\Downloads\aurabook\frontend
pnpm test:run src/lib/graphrag/graph-store.test.ts

# 4. Chạy bộ kiểm thử tự động AI Search Evaluation Suite (Kỳ vọng: 11/11 passed, 100%)
cd C:\Users\basduy05\Downloads\aurabook
python tests/ai_evaluation_suite.py --feature ai_search
```
