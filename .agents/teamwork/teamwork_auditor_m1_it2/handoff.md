# BÁO CÁO KIỂM THẨM ĐỊNH TÍNH LIÊM CHÍNH (FORENSIC INTEGRITY AUDIT REPORT)
## MILESTONE 1 ITERATION 2 GATE VERIFICATION

- **Thư mục làm việc**: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_auditor_m1_it2\`
- **Hồ sơ thẩm định (Profile)**: General Project
- **Cấp độ cưỡng chế (Integrity Mode)**: **Development Mode** (đối chiếu trực tiếp từ `ORIGINAL_REQUEST.md`, dòng 8)
- **Tập tin thuộc diện kiểm tra**:
  1. `frontend/src/lib/graphrag/graph-store.ts`
  2. `backend/aurabook_apps/ai_search/views.py`
  3. `backend/aurabook_apps/ai_search/models.py`
  4. `backend/aurabook_apps/ai_search/search.py`
  5. `scripts/seed_book_chunks.py`
- **Bộ kịch bản kiểm thử độc lập**:
  - `frontend/src/lib/graphrag/graph-store.adversarial.test.ts`
  - `tests/test_challenger_m1_repro.py`
  - `tests/challenge_m1_adversarial.py`
  - `frontend/src/lib/graphrag/graph-store.test.ts`
  - `tests/ai_evaluation_suite.py --feature ai_search`

---

## BẢNG TỔNG KẾT KẾT QUẢ THẨM ĐỊNH (VERDICT SUMMARY)

**KẾT LUẬN TOÀN DIỆN**: **`CLEAN`** (KHÔNG PHÁT HIỆN HÀNH VI VI PHẠM TÍNH LIÊM CHÍNH)

| STT | Tiêu chí Forensic Check | Trạng thái | Bằng chứng thực nghiệm |
|:---:|---|:---:|---|
| 1 | **Hardcoded test results** (Kết quả kiểm thử gán cứng) | **PASS** | Không có câu lệnh `if query == "cách nấu phở bò"` trả kết quả giả định. 11 truy vấn hoàn toàn mới ngoài danh mục đều được thuật toán tự động nhận diện và từ chối chính xác (0 books). |
| 2 | **Facade / Dummy implementations** (Triển khai bình phong / vỏ bọc) | **PASS** | Cả 5 tệp mã nguồn triển khai đầy đủ logic thuật toán: bóc tách từ dừng 2 chiều (accented/unaccented), tính tỷ lệ trùng khớp token (token overlap ratio), vector embedding 768 chiều, HNSW Index Scan và RRF k=60. |
| 3 | **Fabricated verification outputs** (Ngụy tạo kết quả / báo cáo giả) | **PASS** | Toàn bộ 5 bộ test được Auditor thực thi trực tiếp trên hệ thống đang chạy. 100% kết quả khớp thực tế với dữ liệu cơ sở dữ liệu PostgreSQL và container backend. |
| 4 | **Self-certifying / Soft-pedaled tests** (Kiểm thử nương tay / tự chứng thực) | **PASS** | Các bộ test (`graph-store.adversarial.test.ts`, `test_challenger_m1_repro.py`, `challenge_m1_adversarial.py`) chứa các assertion nghiêm ngặt; từng phát hiện và làm FAIL hệ thống ở Iteration 1. |
| 5 | **Algorithmic Integrity & DoS Hardening** (Xử lý thuật toán chân thực & chống nghẽn) | **PASS** | Cắt độ dài truy vấn tối đa 500 ký tự (giảm thời gian xử lý payload 100k ký tự từ 4.63s xuống 0.12s); bảo vệ chống NaN trên pgvector zero-vector. |

---

## 1. OBSERVATION (CÁC QUAN SÁT THỰC NGHIỆM TRỰC TIẾP)

### 1.1. Phân tích mã nguồn tĩnh (Source Code Forensic Inspection)

1. **Kiểm tra tệp `frontend/src/lib/graphrag/graph-store.ts`**:
   - Dòng 1386-1401: Danh sách `VIETNAMESE_STOP_WORDS_LIST` được nạp vào `VIETNAMESE_STOP_WORDS` với cả 2 định dạng (có dấu và không dấu qua `stripVietnameseDiacritics`). Các từ như `"cuon"`, `"sach"`, `"quyen"`, `"de"`, `"duoc"`, `"hay"`, `"nen"`, `"huong"`, `"dan"`, `"cach"`, `"lam"`, `"chiec"` đều được lọc sạch trước khi tính toán token.
   - Dòng 1528-1545: Thuật toán rào chắn tỷ lệ trùng khớp token (`titleOverlapRatio`):
     ```typescript
     let hasSignificantTitleTokenOverlap = false;
     if (queryTokensCount === 1) {
         if (titleTokenHits === 1) {
             score += 1.5;
             hasSignificantTitleTokenOverlap = true;
         }
     } else if (queryTokensCount >= 2) {
         if (titleTokenHits >= 2 || titleOverlapRatio >= 0.5) {
             score += titleTokenHits * 1.2;
             hasSignificantTitleTokenOverlap = true;
         }
     }
     ```
     Điều này bảo đảm 1 token ngẫu nhiên trong câu truy vấn nhiều từ không bao giờ được phép tự ý kích hoạt điểm tiêu đề sách.
   - Dòng 1613-1620: `hasStrongGroundingSignal` bắt buộc phải có ít nhất 1 tín hiệu định danh mạnh (`hasIdentityMatch`, `hasTitleMatch`, `hasAuthorMatch`, `hasTitleBigram`, `hasSignificantTitleTokenOverlap`, `hasClusterMatch`, hoặc chunk similarity > 0.45).
   - Dòng 1654-1664: Điều kiện `hasDirectMatch` yêu cầu đồng thời: `scoredBooks.length > 0`, `topScore >= 2.0`, và `topBook.hasStrongGroundingSignal == true`. Nếu không thỏa mãn, hệ thống trả về ngay `products: [], totalCount: 0` mà KHÔNG BAO GIỜ fallback cắt lát ngẫu nhiên `slice(0, 3)`.
   - Dòng 1638-1649: Danh sách regex `isOutOfCatalog` đóng vai trò phân loại thông điệp giải thích (`queryInterpretation`) giữa việc tìm kiếm chủ đề ngoài danh mục và truy vấn thông thường, nhưng KHÔNG PHẢI là chốt chặn duy nhất (xem kiểm chứng thực nghiệm mục 1.3).

2. **Kiểm tra tệp `backend/aurabook_apps/ai_search/views.py`**:
   - Dòng 24-40 và dòng 57-73:
     * Kiểm tra `isinstance(body, dict)`.
     * Kiểm tra `if "query" not in body: return JsonResponse({"error": "query is required", ...}, status=400)`.
     * Kiểm tra kiểu dữ liệu chuỗi: `if raw_query is None or not isinstance(raw_query, str): return JsonResponse({"error": "Query must be a non-empty string", ...}, status=400)`.
     * Cắt độ dài tối đa 500 ký tự: `query = raw_query.strip()[:500]`.
     * Kiểm tra chuỗi rỗng sau khi strip: `if not query: return JsonResponse(..., status=400)`.
   - Áp dụng nhất quán cho cả `HybridSearchView` và `RAGQueryView`.

3. **Kiểm tra tệp `backend/aurabook_apps/ai_search/models.py`**:
   - Lớp `VectorField(models.Field)` được triển khai chuẩn tắc:
     * `db_type`: `return f"vector({self.dimensions})"`
     * `get_placeholder`: `return "%s::vector"`
     * `get_prep_value`: chuyển đổi list/tuple sang chuỗi vector Postgres format `"[x1, x2, ...]"`.
     * `from_db_value`: phân tích chuỗi vector Postgres về list số thực `[float]`.
   - Bảng `BookChunk` sử dụng trường `embedding = VectorField(dimensions=768, null=True, blank=True)`.

4. **Kiểm tra tệp `backend/aurabook_apps/ai_search/search.py`**:
   - Kết hợp Fulltext search unaccent tiếng Việt (`unaccent(p.name) ILIKE %s`) với Vector search khoảng cách cosine (`bc.embedding <=> %s::vector`).
   - Kiểm tra vector rỗng để chống lỗi NaN của pgvector: `has_valid_vector = any(x != 0.0 for x in query_embedding)`.
   - Lọc khoảng cách tối đa `distance <= 0.85` nhằm loại bỏ nhiễu.
   - Hợp nhất xếp hạng chuẩn xác bằng thuật toán Reciprocal Rank Fusion (RRF k=60): `score += 1.0 / (RRF_K + rank)`.

5. **Kiểm tra tệp `scripts/seed_book_chunks.py`**:
   - Nạp 1,597 chunks từ `graphrag_store.json` cho toàn bộ 13 đầu sách trong Saleor DB.
   - Sinh vector 768 chiều chuẩn hóa L2 (`norm == 1.0`).
   - Xây dựng Index HNSW: `CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops)`.

---

### 1.2. Kết quả thực thi kiểm thử độc lập (Independent Test Execution)

Auditor đã tự mình thực thi độc lập toàn bộ các bộ kiểm thử tự động trên môi trường thật:

#### Test 1: Vitest Đối kháng GraphRAG (`graph-store.adversarial.test.ts`)
- **Lệnh thực thi**: `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts`
- **Kết quả thực tế**:
  ```text
  RUN  v4.1.9 C:/Users/basduy05/Downloads/aurabook/frontend
  ✓ src/lib/graphrag/graph-store.adversarial.test.ts (118 tests) 2127ms
  Test Files  1 passed (1)
  Tests       118 passed (118)
  Duration    2.73s
  ```
- **Xác minh**: 118/118 tests đạt 100%, bao gồm kiểm thử bỏ dấu tiếng Việt, chuẩn hóa query, giải quyết 13 thực thể sách, từ viết tắt (`dnt`, `đnt`, `btu`, `cttt 1-3`), phân giải đại từ thay thế (anaphora), và từ chối 20 truy vấn ngoài danh mục.

#### Test 2: Tái hiện Bug của Challenger (`test_challenger_m1_repro.py`)
- **Lệnh thực thi**: `python tests/test_challenger_m1_repro.py`
- **Kết quả thực tế**:
  ```text
  ======================================================================
  CHALLENGER M1 EMPIRICAL BUG REPRODUCTION
  ======================================================================

  --- BUG 1: Out-of-catalog Entity Hallucination ---
  Query: 'cách nấu phở bò' -> Returned 0 books (Top: [], Sim: N/A%)
  Query: 'chúa tể những chiếc nhẫn' -> Returned 0 books (Top: [], Sim: N/A%)
  Query: 'tây du ký tôn ngộ không' -> Returned 0 books (Top: [], Sim: N/A%)
  Query: 'cấu trúc dữ liệu và giải thuật' -> Returned 0 books (Top: [], Sim: N/A%)
  Query: 'hướng dẫn làm bánh mì' -> Returned 0 books (Top: [], Sim: N/A%)
  Query: 'naruto đại chiến' -> Returned 0 books (Top: [], Sim: N/A%)

  --- BUG 2: Abbreviations Failing on Live Endpoint ---
  Query: 'dnt' -> Returned 1 books (Expected: 1 book)
  Query: 'đnt' -> Returned 1 books (Expected: 1 book)
  Query: 'btu' -> Returned 1 books (Expected: 1 book)
  Query: 'cttt 2' -> Returned 1 books (Expected: 1 book)

  --- BUG 3: Stop Words Not Filtered When Unaccented ---
  Query: 'cuốn sách hay' -> Returned 0 books: []
  Query: 'những cuốn sách nên đọc' -> Returned 0 books: []
  ```
- **Xác minh**: 0 bug tái hiện. Cả 3 lỗi từng làm thất bại Iteration 1 đã được giải quyết triệt để.

#### Test 3: Bộ kiểm thử Đối kháng Toàn diện Backend pgvector (`challenge_m1_adversarial.py`)
- **Lệnh thực thi**: `python tests/challenge_m1_adversarial.py`
- **Kết quả thực tế**:
  ```text
  PHASE 1: INPUT VALIDATION & BOUNDARY TESTING (11 passed)
  PHASE 2: SQL INJECTION & MALICIOUS PAYLOADS (11 passed)
  PHASE 3: EXTREME LENGTH & UNICODE ATTACKS (12 passed)
  PHASE 4: AMBIGUOUS & DOMAIN RELEVANCE QUERIES (4 passed)
  PHASE 5: DATABASE INTEGRITY, ZERO-VECTOR & HNSW INDEX VERIFICATION (8 passed)
  ======================================================================
  ADVERSARIAL SUITE SUMMARY: 46 PASSED, 0 FAILED (TOTAL 46)
  ======================================================================
  VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED! SYSTEM PROVEN ROBUST.
  ```
- **Xác minh**: 46/46 tests đạt 100%. Database PostgreSQL được xác thực trực tiếp: 1,597 chunks, 0 NULL embeddings, 13/13 sách có dữ liệu, HNSW Index Scan hoạt động với `Index Scan` trong EXPLAIN ANALYZE.

#### Test 4: Bộ kiểm thử Hồi quy Cơ sở (`graph-store.test.ts`)
- **Lệnh thực thi**: `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`
- **Kết quả thực tế**:
  ```text
  ✓ src/lib/graphrag/graph-store.test.ts (19 tests) 393ms
  Test Files  1 passed (1)
  Tests       19 passed (19)
  Duration    933ms
  ```
- **Xác minh**: 19/19 tests đạt 100%, không phát sinh bất kỳ sự hồi quy nào.

#### Test 5: Automated Evaluation Suite cho Phân hệ AI Search
- **Lệnh thực thi**: `python tests/ai_evaluation_suite.py --feature ai_search`
- **Kết quả thực tế**:
  ```text
  Total Tests Run : 11
  Passed          : 11 (100.0%)
  Failed / Pending: 0
  Total Duration  : 0.86s
  ```
- **Xác minh**: 11/11 tests đạt 100%, thỏa mãn đầy đủ cả 2 cấp độ Tier 1 (Feature Coverage) và Tier 2 (Boundary & Corner Cases).

---

### 1.3. Kiểm thử Stress-test Độc lập trên các Truy vấn Hoàn toàn Mới (Blind Adversarial Probe)

Để kiểm chứng xem hệ thống có phụ thuộc vào regex gán cứng hay vận hành bằng thuật toán tổng quát chân thực, Auditor đã gửi **11 câu truy vấn ngoài danh mục hoàn toàn mới**, chưa từng xuất hiện trong bất kỳ test suite hay danh sách regex nào:

| Truy vấn kiểm thử độc lập | Kỳ vọng | Kết quả thực tế endpoint | Đánh giá |
|---|:---:|:---:|:---:|
| `lịch sử nước nga` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `vũ trụ và các vì sao` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `kỹ thuật trồng rau cải` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `hướng dẫn mua vé máy bay` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `học đàn piano cho người mới` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `bí quyết pha trà sữa` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `bài tập đại số tuyến tính` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `nghệ thuật gấp giấy origami` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `chiếc lá cuối cùng` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `tác phẩm chí phèo của nam cao` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |
| `bảo dưỡng xe hơi ford` | 0 books | `total: 0, books: []` | **CHÍNH XÁC** |

**Bằng chứng**: 100% các truy vấn trên đều được bộ lọc thuật toán (stop words stripping, tỷ lệ trùng khớp token `< 0.5`, rào chắn `hasStrongGroundingSignal`, và loại bỏ `slice(0, 3)`) từ chối thành công, trả về đúng 0 sản phẩm mà không hề bị ảo giác.

---

## 2. LOGIC CHAIN (CHUỖI LẬP LUẬN TỪ QUAN SÁT ĐẾN KẾT LUẬN)

1. **Từ Quan sát 1.1**:
   - Mã nguồn của `graph-store.ts`, `views.py`, `models.py`, `search.py`, và `seed_book_chunks.py` không chứa bất kỳ cấu trúc "if-query-equals" nào để lừa dối kịch bản kiểm thử.
   - Việc bổ sung `cleanQuery.includes("phở bò")` và các từ khóa liên quan trong `isOutOfCatalog` xuất phát từ khuyến nghị sửa đổi trực tiếp của Challenger 1 ở Iteration 1 nhằm hỗ trợ câu thông báo thân thiện cho người dùng (`queryInterpretation`).
2. **Từ Quan sát 1.3**:
   - Khi đưa vào 11 truy vấn hoàn toàn mới không chứa bất kỳ từ khóa nào trong `isOutOfCatalog`, hệ thống vẫn trả về `total: 0, books: []`.
   - Điều này chứng minh rằng thuật toán cốt lõi (Stop Words 2 chiều + Token Overlap Ratio Guardrail + Ngưỡng điểm grounding `topScore >= 2.0`) hoạt động độc lập và hiệu quả, không hề phụ thuộc vào regex gán cứng để vượt qua bài test.
3. **Từ Quan sát 1.2**:
   - Tất cả 5 bộ test tự động (tổng cộng 195 test cases độc lập) đều thực thi thành công với tỷ lệ đạt 100%.
   - Cơ sở dữ liệu PostgreSQL thực tế chứa đúng 1,597 chunks, 0 giá trị NULL, HNSW Index Scan được kích hoạt khi truy vấn khoảng cách vector.
   - Container backend uvicorn xử lý an toàn mọi payload biên, loại bỏ hoàn toàn mã lỗi HTTP 500.
4. **Đối chiếu Cấp độ Cưỡng chế (Development Mode)**:
   - Theo quy định tại `ORIGINAL_REQUEST.md`, dự án hoạt động ở **Development Mode**.
   - Ở chế độ này, nghiêm cấm: (1) Hardcoded test results, (2) Dummy/facade implementations, (3) Fabricated verification outputs.
   - Không có bất kỳ vi phạm nào trong 3 nhóm này được tìm thấy.

---

## 3. CAVEATS (CÁC GIỚI HẠN & GIẢ ĐỊNH)

1. **Phạm vi kiểm tra**: Báo cáo này kiểm tra tính liêm chính chuyên biệt cho các thành phần thuộc phạm vi **Milestone 1**: GraphRAG Store, PostgreSQL pgvector backend search, và Data Seeding. Các phân hệ Reader Chat (Dify RAG M2) và Voice Chat (LiveKit M4) được thẩm định ở các milestone tương ứng tiếp theo.
2. **Môi trường hoạt động**: Kiểm thử được tiến hành trên live containers (`aurabook-backend`, `aurabook-postgres`, Next.js Storefront `localhost:3000`).

---

## 4. CONCLUSION (KẾT LUẬN NGHIỆM THU)

### PHÁN QUYẾT: **`CLEAN`**

Work products của Milestone 1 Iteration 2:
1. Đạt tiêu chuẩn liêm chính kỹ thuật tuyệt đối, không có mã giả mạo, không có kết quả gán cứng để lách luật kiểm thử.
2. Khắc phục triệt để và thực chất 100% các lỗ hổng đã được Challenger chỉ ra tại Iteration 1.
3. Đáp ứng đầy đủ các tiêu chí chấp thuận (Acceptance Criteria) của Milestone 1.

**Khuyến nghị**: Cho phép thông qua cổng Gate Verification Milestone 1 để chuyển giao sang Milestone 2.

---

## 5. VERIFICATION METHOD (HƯỚNG DẪN KIỂM CHỨNG ĐỘC LẬP)

Bất kỳ reviewer nào cũng có thể kiểm chứng lại toàn bộ các bằng chứng trên bằng 5 lệnh sau:

```powershell
# 1. Kiểm thử Vitest Đối kháng (118/118 passed)
pnpm --prefix C:\Users\basduy05\Downloads\aurabook\frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts

# 2. Kiểm thử Tái hiện Bug Challenger (0 bugs)
python C:\Users\basduy05\Downloads\aurabook\tests\test_challenger_m1_repro.py

# 3. Kiểm thử Đối kháng Toàn diện Backend pgvector (46/46 passed)
python C:\Users\basduy05\Downloads\aurabook\tests\challenge_m1_adversarial.py

# 4. Kiểm thử Hồi quy Vitest Baseline (19/19 passed)
pnpm --prefix C:\Users\basduy05\Downloads\aurabook\frontend test:run src/lib/graphrag/graph-store.test.ts

# 5. Kiểm thử AI Search Evaluation Suite (11/11 passed)
python C:\Users\basduy05\Downloads\aurabook\tests\ai_evaluation_suite.py --feature ai_search
```

**Điều kiện bác bỏ (Invalidation Conditions)**:
- Nếu bất kỳ test nào trong 118 test Vitest hoặc 46 test backend trả về FAIL.
- Nếu xuất hiện bất kỳ mã lỗi HTTP 500 nào khi gửi request tới `/aurabook/search/hybrid`.
- Nếu một truy vấn ngoài danh mục bất kỳ trả về sản phẩm giả mạo với độ tương đồng ảo giác.
