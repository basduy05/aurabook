# Handoff Report: Milestone 3 — AI Tìm Kiếm & Unified Catalog Semantic Retrieval
**Agent:** `teamwork_challenger_m3_1` (Empirical Challenger)  
**Date:** 2026-10-31  
**Milestone:** Milestone 3 (AI Tìm Kiếm & Unified Catalog Semantic Retrieval)  
**Explicit Verdict:** `REQUEST_CHANGES`  
**Report Location:** `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m3_1\handoff.md`

---

## 1. Observation (Quan Sát & Dẫn Chứng Trực Nghiệm)

Tôi đã thiết lập bộ kiểm thử độc lập gồm 195 ca kiểm thử thực nghiệm (`tests/test_challenger_m3_empirical.py`) và thực thi toàn bộ kịch bản kiểm thử quy định trong dispatch đối với cả 3 endpoint:
1. Backend Django: `POST http://localhost:8000/aurabook/search/hybrid`
2. Frontend Next.js AI Route: `POST http://localhost:3000/api/search/ai`
3. Frontend GraphRAG Route: `GET http://localhost:3000/api/ai/graphrag/search`

Dưới đây là các quan sát thực nghiệm cụ thể và chi tiết:

### 1.1 Kiểm Thử Automated Evaluation Suite (Yêu cầu bắt buộc)
- Chạy lệnh: `python tests/ai_evaluation_suite.py --feature ai_search`
  * Kết quả: `11/11 tests passed (100.0%)` trong `0.87s`.
- Chạy lệnh: `python tests/ai_evaluation_suite.py --id TC-T3-01`
  * Kết quả: `PASS (127ms)` (Bốn Thỏa Ước search-to-read transition).
- Chạy lệnh: `python tests/ai_evaluation_suite.py --id TC-T3-02`
  * Kết quả: `PASS (102ms)` (Đắc Nhân Tâm unaccented search-to-read transition).
- Chạy frontend vitest: `pnpm test:run src/lib/graphrag/graph-store.test.ts src/lib/graphrag/graph-store.adversarial.test.ts`
  * Kết quả: `138/138 passed (100%)`.

### 1.2 Phát Hiện Lỗi 1: Ảo Giác Kết Quả Sách Ngoài Danh Mục (Anti-Hallucination Failure)
Mặc dù worker M3 tuyên bố "Triệt tiêu hoàn toàn ảo giác (Zero Hallucination)", nhưng khi gửi các thực thể ngoài danh mục được nêu rõ trong chỉ đạo (dispatch):

1. **Truy vấn `"Chúa tể những chiếc nhẫn"` (The Lord of the Rings)**:
   * **Lệnh kiểm tra:**
     ```bash
     python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'Chúa tể những chiếc nhẫn'}); print(r.json())"
     ```
   * **Kết quả thực tế từ Backend (`POST /aurabook/search/hybrid`):**
     ```json
     {
       "query": "Chúa tể những chiếc nhẫn",
       "total": 6,
       "results": [
         { "product_slug": "bon-thoa-uoc", "score": 0.03279 },
         { "product_slug": "tu-duy-nhanh-va-cham", "score": 0.03226 },
         { "product_slug": "dac-nhan-tam", "score": 0.03175 },
         { "product_slug": "cach-nghi-de-thanh-cong", "score": 0.03125 },
         { "product_slug": "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than", "score": 0.03077 },
         { "product_slug": "sapiens-luoc-su-loai-nguoi", "score": 0.0303 }
       ]
     }
     ```
   * **Kết quả thực tế từ Frontend AI Search (`POST /api/search/ai`):**
     Trả về 6 cuốn sách ảo tương tự (`total: 6`).
   * **Nguyên nhân tại mã nguồn (`backend/aurabook_apps/ai_search/search.py`):**
     - Dòng 24-27: Regex `OUT_OF_CATALOG_PATTERN` chỉ định nghĩa `chua\s+te\s+chiec\s+nhan` (thiếu từ `"những"`). Do câu truy vấn là `"Chúa tể những chiếc nhẫn"`, regex hoàn toàn không khớp.
     - Dòng 166: Bộ lọc vector đặt ngưỡng `distance <= 0.62`. Trong cơ sở dữ liệu `ai_search_bookchunk`, khoảng cách cosine pgvector giữa vector Gemini của `"Chúa tể những chiếc nhẫn"` và các chunk sách ngẫu nhiên đạt `0.5793` (`0.5793 <= 0.62`), dẫn đến việc hệ thống trả về 6 cuốn sách không hề liên quan.

2. **Truy vấn `"Chiến tranh giữa các vì sao"` (Star Wars)**:
   * **Backend:** Trả về 6 cuốn sách (`chien-tranh-tien-te-tap-3`, `bon-thoa-uoc`, `chien-tranh-tien-te-tap-1`, `sapiens-...`, `cach-nghi-...`, `10-dieu-...`).
   * **GraphRAG (`GET /api/ai/graphrag/search`):** Trả về 3 cuốn sách (`chien-tranh-tien-te-tap-1`, `chien-tranh-tien-te-tap-2`, `chien-tranh-tien-te-tap-3`) do điều kiện tại dòng 1600 trong `graph-store.ts` kiểm tra chuỗi con `"chiến tranh"` hoặc `"chien tranh"` rồi cộng thẳng 2.0 điểm cho Chiến Tranh Tiền Tệ.

3. **Truy vấn `"Tam Quốc Diễn Nghĩa"`**:
   * **Backend:** Trả về 2 cuốn sách (`chien-tranh-tien-te-tap-1`, `chien-tranh-tien-te-tap-3`).

4. **Truy vấn `"Bí kíp võ công kiếm hiệp Kim Dung"`**:
   * **Backend:** Trả về 1 cuốn sách (`cach-nghi-de-thanh-cong`).

5. **Truy vấn `"muon kiep nhan sinh"` (Tác phẩm không thuộc 13 cuốn trong kho tuyển chọn)**:
   * **Backend:** Trả về 1 cuốn sách (`dac-nhan-tam`).

### 1.3 Phát Hiện Lỗi 2: Ảo Giác Đối Với Chuỗi Emojis & Mã Script Tiêm Nhiễm (Noise & Injection)
1. **Truy vấn Emojis thuần túy (`"🔥🎉🚀🦄📖📚"`):**
   * **Backend `POST /aurabook/search/hybrid`:** Trả về `total: 10` cuốn sách trong kho (`bon-thoa-uoc`, `tu-duy-nhanh-va-cham`, `dac-nhan-tam`...).
   * **Frontend `POST /api/search/ai`:** Trả về `total: 10` cuốn sách.
   * **Nguyên nhân:** Emojis không bị chặn bởi fulltext, nhưng khi chuyển qua Gemini vectorizer sinh ra vector có độ tương đồng ngẫu nhiên rơi vào khoảng `distance <= 0.62`.

2. **Truy vấn XSS Script (`"<script>alert('xss')</script>"`):**
   * **Backend `POST /aurabook/search/hybrid`:** Trả về `total: 4` cuốn sách.

### 1.4 Phát Hiện Lỗi 3: Lỗi Truy Xuất Khái Niệm Tiếng Việt Trong GraphRAG (`tam ly hoc`, `kinh te hoc`)
Mục 2 trong nhiệm vụ dispatch yêu cầu kiểm tra:
"2. Vietnamese Diacritics & Concept Retrieval: Test 'phát triển bản thân', 'tam ly hoc', 'kinh te hoc'."

1. **Truy vấn `"tâm lý học"` và `"tam ly hoc"`:**
   * **Lệnh kiểm tra:**
     ```bash
     python -c "import requests; r = requests.get('http://localhost:3000/api/ai/graphrag/search?query=tam+ly+hoc'); print(r.json())"
     ```
   * **Kết quả thực tế:**
     `{'products': [], 'isGraphRAG': true, 'totalCount': 0, 'matchedConcepts': [], 'reasoningSummary': 'Kho sách AuraBook hiện chưa có tác phẩm về \"tam ly hoc\"...'}`
   * **Phân tích:** Người dùng tìm sách tâm lý học nhưng hệ thống GraphRAG báo AuraBook chưa có tác phẩm nào, trong khi AuraBook có sẵn các sách tâm lý học kinh điển: *Tư Duy Nhanh Và Chậm (Daniel Kahneman)*, *Bốn Thỏa Ước*, *Đắc Nhân Tâm*!
   * **Nguyên nhân tại mã nguồn (`frontend/src/lib/graphrag/graph-store.ts`):**
     Dòng 1564-1578: Danh sách `clusterMatches` hoàn toàn thiếu cụm từ khóa `"tam ly hoc"`, `"tâm lý học"`, `"tam ly"`, `"tâm lý"` trong `clusterMatches["tu-duy-nhanh-va-cham"]` và `clusterMatches["bon-thoa-uoc"]`. Do đó `hasClusterMatch = false` và `hasStrongGroundingSignal = false`, khiến kết quả bị đẩy về 0.

2. **Truy vấn `"kinh tế học"` và `"kinh te hoc"`:**
   * **Lệnh kiểm tra:**
     ```bash
     python -c "import requests; r = requests.get('http://localhost:3000/api/ai/graphrag/search?query=kinh+te+hoc'); print(r.json())"
     ```
   * **Kết quả thực tế:**
     `{'products': [], 'isGraphRAG': true, 'totalCount': 0, 'matchedConcepts': [], 'reasoningSummary': 'Kho sách AuraBook hiện chưa có tác phẩm về \"kinh te hoc\"...'}`
   * **Phân tích:** Báo không có sách kinh tế học, dù hệ thống có *Chiến Tranh Tiền Tệ (3 tập)*, *Tư Duy Nhanh Và Chậm (kinh tế học hành vi)*.
   * **Nguyên nhân tại mã nguồn (`frontend/src/lib/graphrag/graph-store.ts`):**
     `clusterMatches["chien-tranh-tien-te-tap-1"]` chỉ chứa từ khóa hẹp `"chien tranh tien te tap 1"`, `"rothschild"`, không có `"kinh te hoc"`, `"kinh tế học"`, `"tai chinh"`, `"tài chính"`.

### 1.5 Phát Hiện Lỗi 4: Lệch Slug Sản Phẩm Giữa GraphRAG & PostgreSQL Saleor
- Tại `frontend/src/lib/graphrag/graph-store.ts` dòng 174:
  `slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than"` (thiếu chữ `-va-`).
- Tại cơ sở dữ liệu PostgreSQL `product_product` và bảng `ai_search_bookchunk`:
  `slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than"` (có chữ `-va-`).
- **Hậu quả:** Khi GraphRAG phân giải thực thể hoặc tìm kiếm theo slug này, việc đối chiếu sản phẩm với bảng `product_product` của Saleor sẽ bị lệch slug, dẫn đến không nạp được thông tin giá, tồn kho hoặc metadata thực tế từ database.

### 1.6 Phát Hiện Lỗi 5: Lỗi Công Thức Khi `alpha = 0.0` (Pure Fulltext Search)
- Tại `backend/aurabook_apps/ai_search/search.py`:
  Dòng 219: `all_product_ids = set(ft_rank) | set(vec_rank)`.
  Dòng 225: `score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)`.
- Khi người dùng hoặc API truyền `alpha = 0.0` (yêu cầu thuần fulltext, tắt hoàn toàn vector), đối với các sản phẩm không khớp fulltext nhưng lọt vào `vec_rank`:
  `score = 2.0 * (1.0 * 0.0 + 0.0 * vec_score) = 0.0`.
  Tuy nhiên, dòng 252 lại đưa toàn bộ sản phẩm trong `rrf_scores` vào `ranked_items` (kể cả khi `score == 0.0`).
- **Hậu quả:** Khi tìm kiếm `"Tam Quốc Diễn Nghĩa"` với `alpha = 0.0`, API vẫn trả về 2 cuốn sách với `score: 0.0` thay vì trả về `[]` (rỗng)!

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Quan Sát Đến Kết Luận)

1. **Từ Quan sát 1.2 (Chúa tể những chiếc nhẫn, Chiến tranh giữa các vì sao, Tam Quốc Diễn Nghĩa, Kim Dung, Muôn Kiếp Nhân Sinh):**
   - worker M3 dựa vào `OUT_OF_CATALOG_PATTERN` dạng regex thủ công để chặn ảo giác.
   - Regex thủ công có bản chất hữu hạn, dễ bị vượt qua khi chỉ lệch 1 từ nối (ví dụ `"những"` trong `"Chúa tể những chiếc nhẫn"`).
   - Khi không khớp regex, luồng tìm kiếm rơi vào vector search với ngưỡng `distance <= 0.62`. Trong không gian 768 chiều của Gemini embedding, khoảng cách của các câu văn xuôi thông thường với 1.597 chunks trong kho luôn dao động trong khoảng 0.56 - 0.61.
   - Hậu quả: Không đạt tiêu chuẩn "Zero Hallucination" đề ra trong `PROJECT.md` F8 và `ORIGINAL_REQUEST.md` R2.

2. **Từ Quan sát 1.3 (Emojis và XSS script):**
   - Các chuỗi không chứa từ khóa chữ tiếng Việt/ASCII hợp lệ không bị fulltext bắt nhưng lại được Gemini chuyển thành vector hợp lệ và vượt qua ngưỡng `0.62`.
   - Cần bổ sung guardrail loại bỏ các truy vấn không có ít nhất 1 token từ ngữ hợp lệ trước khi gọi vector search.

3. **Từ Quan sát 1.4 (`tam ly hoc` và `kinh te hoc`):**
   - User dispatch yêu cầu kiểm thử cụ thể: `"phát triển bản thân", "tam ly hoc", "kinh te hoc"`.
   - Worker M3 đã khắc phục tốt cụm `"phat trien ban than"`, nhưng bỏ sót hoàn toàn `"tam ly hoc"` và `"kinh te hoc"` trong cấu trúc `clusterMatches` của `graph-store.ts`.
   - Vì GraphRAG là lớp phân giải ngữ cảnh tự do cho storefront, việc trả về 0 kết quả cho 2 chủ đề nòng cốt của danh mục sách là một thiếu sót lớn.

4. **Từ Quan sát 1.5 (Slug mismatch):**
   - `chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than` trong TypeScript code lệch so với `chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than` trong PostgreSQL DB.
   - Điều này vi phạm tính nhất quán dữ liệu (Data Grounding Integrity) theo `PROJECT.md`.

5. **Từ Quan sát 1.6 (Alpha = 0.0 RRF formula):**
   - Nếu `alpha == 0.0`, kết quả phải chỉ lấy từ `ft_rank` (loại bỏ các mục chỉ có trong `vec_rank`). Nếu `alpha == 1.0`, kết quả phải chỉ lấy từ `vec_rank`.

---

## 3. Caveats (Các Điểm Giới Hạn & Giả Định)

1. **Bộ kiểm thử tự động gốc (`ai_evaluation_suite.py`)**: Bộ 11 test cases của `ai_search` trong `ai_evaluation_suite.py` đều đạt 100% PASS vì bộ test gốc chỉ kiểm tra các từ khóa đã biết ("Harry Potter", "dac nhan tam", "tu duy nhanh", "stoicism"). Các lỗi trên chỉ lộ diện khi thực thi kiểm thử đối kháng sâu (Adversarial Stress Testing) với các ca kiểm thử biên và thực thể ngoài danh mục đa dạng.
2. **Quy tắc Challenger (Review-Only)**: Là một Empirical Challenger, tôi tuân thủ nghiêm ngặt quy định không trực tiếp sửa mã nguồn thực thi, mà chỉ xuất trình bằng chứng thực nghiệm độc lập và yêu cầu Worker thực hiện chỉnh sửa.

---

## 4. Conclusion (Kết Luận & Quyết Định Đánh Giá)

### Quyết định chính thức: **`REQUEST_CHANGES`** (Yêu Cầu Chỉnh Sửa)

Milestone 3 đã có những bước tiến đáng kể (chạy thành công 100% test suite cơ bản, giải quyết phân giải thứ tự series Chiến Tranh Tiền Tệ tập 1, chuẩn hóa unaccent cho Đắc Nhân Tâm, tiếp nhận tham số alpha). Tuy nhiên, hệ thống **CHƯA ĐẠT** tiêu chí nghiệm thu về tính triệt để loại bỏ ảo giác (Anti-Hallucination Guardrail) và năng lực truy xuất ngữ cảnh tiếng Việt theo đúng yêu cầu dispatch.

### Các Yêu Cầu Cần Khắc Phục (Actionable Mitigation Checklist cho Worker M3):

1. **Khắc phục Triệt Để Ảo Giác Backend (`backend/aurabook_apps/ai_search/search.py`)**:
   - Mở rộng `OUT_OF_CATALOG_PATTERN` để bao gồm `chua\s+te\s+(nhung\s+)?chiec\s+nhan`, `chien\s+tranh\s+giua\s+cac\s+vi\s+sao|star\s+wars`, `tam\s+quoc`, `kiem\s+hiep|kim\s+dung`, `muon\s+kiep\s+nhan\s+sinh`.
   - Siết chặt ngưỡng khoảng cách vector cho các truy vấn không có kết quả fulltext: Nếu `fulltext_results` rỗng, ngưỡng vector phải là `distance <= 0.52` (chỉ chấp nhận các vector thực sự gần gũi về mặt ngữ nghĩa), hoặc yêu cầu ít nhất 1 token trong query phải có mặt trong từ khóa danh mục; không cho phép `distance <= 0.62` đơn độc tạo ra kết quả.
   - Thêm bộ lọc validation: Nếu truy vấn chỉ chứa ký tự đặc biệt, emojis (`not re.search(r"[a-zA-Z0-9\u00C0-\u1EF9]", clean_query)`), trả về `[]` ngay lập tức.
   - Sửa công thức RRF: Nếu `score <= 0.0`, không đưa item vào `ranked_items`.

2. **Bổ sung Từ Khóa Khái Niệm Trong GraphRAG (`frontend/src/lib/graphrag/graph-store.ts`)**:
   - Bổ sung cụm `"tam ly hoc"`, `"tâm lý học"`, `"tam ly"`, `"tâm lý"`, `"tam ly hoc hanh vi"` vào `clusterMatches["tu-duy-nhanh-va-cham"]`, `clusterMatches["bon-thoa-uoc"]`, `clusterMatches["dac-nhan-tam"]`.
   - Bổ sung cụm `"kinh te hoc"`, `"kinh tế học"`, `"kinh te"`, `"kinh tế"`, `"tai chinh"`, `"tài chính"` vào `clusterMatches["chien-tranh-tien-te-tap-1"]`, `clusterMatches["tu-duy-nhanh-va-cham"]`, `clusterMatches["tri-tue-do-thai"]`.
   - Kiểm tra `isOutOfCatalog`: Loại bỏ việc `"chiến tranh giữa các vì sao"` bị match nhầm vào `"chien tranh tien te"` (chỉ gán điểm bộ sách Chiến Tranh Tiền Tệ khi có cả `"tiền tệ"` hoặc `"tien te"`).

3. **Đồng Bộ Hóa Slug Sản Phẩm Khắc Kỷ (`frontend/src/lib/graphrag/graph-store.ts`)**:
   - Sửa `slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than"` thành `"chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than"` trong `BOOK_CATALOG_MAPPING` và `INITIAL_GRAPH_DATA` để khớp chính xác 100% với PostgreSQL Saleor database.

---

## 5. Verification Method (Phương Pháp Tái Hiện & Kiểm Chứng)

Để tái hiện độc lập các phát hiện lỗi trên, chạy các lệnh sau từ thư mục gốc `C:\Users\basduy05\Downloads\aurabook`:

1. **Tái hiện ảo giác "Chúa tể những chiếc nhẫn":**
   ```bash
   python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'Chúa tể những chiếc nhẫn'}); print('Total:', r.json()['total'], 'Slugs:', [x['product_slug'] for x in r.json()['results']])"
   ```
   *Hiện tượng lỗi:* Trả về `Total: 6 Slugs: ['bon-thoa-uoc', 'tu-duy-nhanh-va-cham', 'dac-nhan-tam', ...]` (Ảo giác).  
   *Kỳ vọng:* `Total: 0, Slugs: []`.

2. **Tái hiện lỗi GraphRAG bỏ sót "tâm lý học" và "kinh tế học":**
   ```bash
   python -c "import requests; print('tam ly hoc:', requests.get('http://localhost:3000/api/ai/graphrag/search?query=tam+ly+hoc').json()['totalCount']); print('kinh te hoc:', requests.get('http://localhost:3000/api/ai/graphrag/search?query=kinh+te+hoc').json()['totalCount'])"
   ```
   *Hiện tượng lỗi:* Cả 2 đều trả về `0` sản phẩm.  
   *Kỳ vọng:* `tam ly hoc` trả về >= 1 sản phẩm (chứa `tu-duy-nhanh-va-cham`), `kinh te hoc` trả về >= 1 sản phẩm (chứa `chien-tranh-tien-te-tap-1`).

3. **Chạy toàn bộ 195 ca kiểm thử thực nghiệm:**
   ```bash
   python tests/test_challenger_m3_empirical.py
   ```
   *Hiện tại:* 170 Passed, 25 Failed.  
   *Tiêu chí hoàn thành:* 195/195 Passed (100%).
