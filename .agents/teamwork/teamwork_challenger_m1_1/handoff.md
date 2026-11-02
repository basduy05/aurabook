# BÁO CÁO THẨM ĐỊNH ADVERSARIAL CHALLENGE (M1 CHALLENGER 1)
**Phân hệ**: GraphRAG Vietnamese Diacritics Normalization & Entity Resolution  
**Agent thực hiện**: M1 Challenger 1 (`teamwork_challenger_m1_1`)  
**Ngày thực hiện**: 2026-10-31T14:31:00Z  
**Thư mục làm việc**: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\`  
**Phán quyết (Verdict)**: **`REQUEST_CHANGES`** (Yêu cầu Worker khắc phục triệt để trước khi nghiệm thu M1)

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp)

### 1.1. Quan sát thực tế mã nguồn
1. **Regex lọc out-of-catalog quá mong manh (Hardcoded fragile whitelist)**:
   - Tại `frontend/src/lib/graphrag/graph-store.ts` (dòng 1535-1543):
     ```typescript
     const isOutOfCatalog =
         /(\b(ho chi minh|bac ho|nguyen ai quoc|vo nguyen giap|nau an|truyen tranh|harry potter|doremon|conan|mon an|am thuc)\b)/i.test(unaccentedQuery) ||
         cleanQuery.includes("hồ chí minh") ||
         cleanQuery.includes("bác hồ") ||
         cleanQuery.includes("nguyễn ái quốc") ||
         cleanQuery.includes("võ nguyên giáp") ||
         cleanQuery.includes("nấu ăn") ||
         cleanQuery.includes("truyện tranh");
     ```
   - Cơ chế anti-hallucination phụ thuộc hoàn toàn vào một danh sách regex cứng 11 cụm từ. Bất kỳ thực thể ngoài danh mục nào không nằm trong 11 cụm từ này đều lọt qua bộ lọc `isOutOfCatalog`.

2. **Lỗi lệch dấu trong danh sách Stop Words (`VIETNAMESE_STOP_WORDS`)**:
   - Tại dòng 1382-1386:
     ```typescript
     const VIETNAMESE_STOP_WORDS = new Set([
         "về", "của", "và", "các", "những", "trong", "cho", "với", "là", "có", "để", "được", "tôi", "bạn",
         "ở", "ra", "lại", "lên", "xuống", "một", "này", "đó", "thì", "mà", "sao", "gì", "ai", "đâu", "nào",
         "cuốn", "sách", "những", "các", "muốn", "tìm", "đọc", "như", "thế", "hỏi", "giúp", "với", "an", "ăn"
     ]);
     ```
   - Tại dòng 1388-1392:
     ```typescript
     const tokenize = (text: string) =>
         stripVietnameseDiacritics(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
     const queryTokens = tokenize(cleanQuery);
     const meaningfulTokens = queryTokens.filter((w) => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
     ```
   - `tokenize` loại bỏ toàn bộ dấu tiếng Việt (`stripVietnameseDiacritics`), nên `queryTokens` chỉ chứa chuỗi ASCII không dấu (ví dụ: `["cuon", "sach", "nhung", "de"]`). Nhưng `VIETNAMESE_STOP_WORDS` lại lưu từ có dấu (`"cuốn"`, `"sách"`, `"những"`, `"để"`). Do `Set.has()` so sánh chính xác chuỗi, các stop words không dấu KHÔNG BAO GIỜ bị lọc bỏ!

3. **Ngưỡng điểm (Threshold) quá thấp và tích lũy điểm ảo**:
   - Tại dòng 1451-1465, so khớp token:
     `if (titleTokens.includes(token)) { score += 1.0; ... }`
   - Tại dòng 1509-1520, vector chunks:
     `if (topChunks[0].score > 0.28) { score += sim * 0.9; ... }`
   - Tại dòng 1522:
     `if (score >= 1.2 || ...)`
   - Chỉ cần 1 từ chung ngẫu nhiên khớp với tiêu đề (như `"te"` trong "chúa tể" khớp với `"te"` trong "tiền tệ", hoặc `"cach"` trong "cách nấu phở bò" khớp với `"cach"` trong "cách nghĩ để thành công") là sách đã nhận `1.0` điểm. Cộng với điểm vector chunk ngẫu nhiên `0.30 * 0.9 = 0.27` $\rightarrow 1.27 \ge 1.2$, sách lập tức được coi là khớp (`hasDirectMatch = true`).
   - Sau đó tại dòng 1567:
     `finalMatches = scoredBooks.filter(item => item.score >= 1.2 && item.score >= topScore * 0.4)`
     Hệ thống kéo theo hàng loạt cuốn sách khác vào kết quả với độ tương đồng hiển thị lên tới **97%**!

4. **Từ viết tắt (Abbreviations) không đồng bộ giữa `resolveBookEntity` và `searchProductsByContext`**:
   - `resolveBookEntity` có hỗ trợ `BOOK_CATALOG_MAPPING.abbreviations` (`dnt`, `đnt`, `btu`, `cttt 2`).
   - Nhưng `searchProductsByContext` và API endpoint `http://localhost:3000/api/ai/graphrag/search` KHÔNG HỀ kiểm tra `resolveBookEntity` hay `mapping.abbreviations`. Kết quả là tìm kiếm từ viết tắt trên thanh tìm kiếm trả về 0 kết quả!

### 1.2. Kết quả kiểm thử thực nghiệm (Empirical Test Execution)

1. **Bộ kiểm thử Vitest `src/lib/graphrag/graph-store.adversarial.test.ts` (118 tests)**:
   - Lệnh: `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts`
   - Kết quả: **2 tests FAILED | 116 passed**:
     * `FAIL: Out-of-Catalog Queries MUST NEVER Return Random Sliced Books > returns 0 products for: "cách nấu phở bò"`:
       `AssertionError: expected [ { ... }, { ... }, { ... }, { ... } ] to have a length of +0 but got 4`
     * `FAIL: Out-of-Catalog Queries MUST NEVER Return Random Sliced Books > returns 0 products for: "chúa tể những chiếc nhẫn"`:
       `AssertionError: expected [ { ... }, ... ] to have a length of +0 but got 6`

2. **Kiểm thử trực tiếp trên Endpoint đang chạy `http://localhost:3000/api/ai/graphrag/search`**:
   - Script thực thi: `python tests/test_challenger_m1_repro.py`
   - Bằng chứng thực nghiệm:
     * `Query: 'cách nấu phở bò'` $\rightarrow$ Trả về **4 cuốn sách**, điểm tương đồng **97%**:
       `['Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản', 'Cách Nghĩ Để Thành Công', 'Tư Duy Nhanh Và Chậm', 'Bốn Thỏa Ước']`
     * `Query: 'chúa tể những chiếc nhẫn'` $\rightarrow$ Trả về **6 cuốn sách**, điểm tương đồng **97%**:
       `['Chiến Tranh Tiền Tệ - Tập 2', 'Chiến Tranh Tiền Tệ - Tập 3', 'Đắc Nhân Tâm', 'Chiến Tranh Tiền Tệ - Tập 1', 'Cây Cam Ngọt Của Tôi', 'Bốn Thỏa Ước']`
     * `Query: 'tây du ký tôn ngộ không'` $\rightarrow$ Trả về **5 cuốn sách**, điểm tương đồng **97%**:
       `['Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản', 'Cách Nghĩ Để Thành Công', 'Cây Cam Ngọt Của Tôi', 'Bí Mật Của Một Trí Nhớ Siêu Phàm', 'Tư Duy Nhanh Và Chậm']`
     * `Query: 'cấu trúc dữ liệu và giải thuật'` $\rightarrow$ Trả về **5 cuốn sách**, điểm tương đồng **97%**:
       `['Tư Duy Nhanh Và Chậm', 'Chủ Nghĩa Khắc Kỷ', 'Cây Cam Ngọt Của Tôi', 'Bí Mật Của Một Trí Nhớ Siêu Phàm', 'Bốn Thỏa Ước']`
     * `Query: 'naruto đại chiến'` $\rightarrow$ Trả về **3 cuốn sách**, điểm tương đồng **97%**:
       `['Chiến Tranh Tiền Tệ - Tập 1', 'Chiến Tranh Tiền Tệ - Tập 2', 'Chiến Tranh Tiền Tệ - Tập 3']`
     * `Query: 'dnt'`, `'đnt'`, `'btu'`, `'cttt 2'` $\rightarrow$ Trả về **0 kết quả** (`totalCount: 0, products: []`).
     * `Query: 'cuốn sách hay'` $\rightarrow$ Trả về **6 cuốn sách** do lỗi stop words không dấu.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Quan Sát Đến Kết Luận)

```
[Truy vấn ngoài danh mục: "cách nấu phở bò", "chúa tể những chiếc nhẫn", "tây du ký"]
     │
     ▼ (Bước 1: Thoát khỏi bộ lọc Regex mong manh)
[Truy vấn không chứa đúng 11 từ khóa cứng -> isOutOfCatalog = false]
     │
     ▼ (Bước 2: Lỗi Stop Words & So khớp 1 Token chung)
["te", "cach", "nhung" không bị lọc bỏ -> Khớp 1 token trong tiêu đề: score += 1.0]
     │
     ▼ (Bước 3: Tích lũy điểm Vector Chunk & Ngưỡng 1.2 quá thấp)
[Chunk similarity > 0.28 cộng thêm 0.3-0.6 điểm -> Tổng score > 1.2 -> hasDirectMatch = true]
     │
     ▼ (Bước 4: Kéo theo các sách đạt topScore * 0.4)
[Hệ thống trả về 4-6 cuốn sách ngẫu nhiên với nhãn giả mạo: "Độ tương đồng cao 97%"]
     │
     ▼ (Hậu quả nghiệm thu)
[VI PHẠM YÊU CẦU DỰ ÁN: Acceptance Criteria R1 & R2 nghiêm cấm Hallucination;
 Worker chỉ loại bỏ slice(0, 3) nhưng để hở lỗ hổng thuật toán cho phép ảo giác tái diễn]
```

1. **Từ Quan sát 1.1 đến Bước 1**: Regex trong `isOutOfCatalog` chỉ là giải pháp tạm thời đối phó với một vài từ khóa cụ thể ("Harry Potter", "nấu ăn", "Hồ Chí Minh"). Trong thực tế, kho tri thức sách có hàng triệu chủ đề mà thư viện AuraBook không có (văn học cổ điển khác, truyện tranh khác, công nghệ phần mềm, công thức nấu món cụ thể, v.v.). Một hệ thống GraphRAG chuẩn tắc không thể dựa vào whitelist regex để chống ảo giác.
2. **Từ Quan sát 1.1 & 1.2 đến Bước 2 & 3**: Thuật toán tính điểm của `searchProductsByContext` quá dễ dãi. Chỉ cần 1 từ đơn lẻ trong truy vấn khớp với 1 từ trong tiêu đề sách (ví dụ: `"cách"` trong "Cách Nghĩ Để Thành Công", `"tệ"` trong "Chiến Tranh Tiền Tệ") là cuốn sách đó đã nhận đủ điểm để vượt qua ngưỡng `1.2`. Càng nghiêm trọng hơn khi stop words không dấu như `"nhung"`, `"cuon"`, `"sach"` không được lọc bỏ, khiến các từ này trở thành "bẫy token" kích hoạt điểm số giả tạo.
3. **Từ Quan sát 1.2 đến Bước 4**: Khi một cuốn sách vô tình vượt ngưỡng `1.2`, hệ thống coi như có kết quả khớp trực tiếp (`hasDirectMatch = true`) và tự động hạ tiêu chí để lấy thêm các sách có điểm $\ge 40\%$ điểm cao nhất. Điều này dẫn đến việc tìm kiếm "chúa tể những chiếc nhẫn" lại trả về 6 cuốn sách kinh tế/tâm lý với nhãn "Độ tương đồng cao (97%) - Khớp trọng tâm"!
4. **Kết luận logic**: Worker đã hoàn thành xuất sắc F3 (pgvector schema & seeding) và phần chuẩn hóa diacritics cơ bản của F1. Tuy nhiên, tính năng chống ảo giác (Anti-Hallucination) và khả năng tìm kiếm từ viết tắt trong F1 và F2 chưa đạt chuẩn production.

---

## 3. Caveats (Các Giới Hạn & Giả Định)

1. **Phạm vi kiểm tra**: M1 Challenger chỉ tập trung kiểm thử độc lập phân hệ GraphRAG (frontend) và tính tương thích của API tìm kiếm ngữ cảnh. Phần backend pgvector (F3) đã được kiểm chứng hoạt động tốt (1,597 chunks, không NaN).
2. **Nguyên tắc Review-only**: Challenger phát hiện và chứng minh lỗi bằng mã kiểm thử thực nghiệm nhưng **TUYỆT ĐỐI KHÔNG TỰ Ý SỬA MÃ NGUỒN CHÍNH** (`graph-store.ts`), bảo toàn tính liêm chính và trách nhiệm của Worker.

---

## 4. Conclusion & Actionable Mitigations (Kết Luận & Yêu Cầu Sửa Đổi)

### Phán quyết: **`REQUEST_CHANGES`**

Để hoàn tất nghiệm thu Milestone 1 và sẵn sàng cho M2, Worker cần thực hiện các sửa đổi cụ thể sau trên `frontend/src/lib/graphrag/graph-store.ts`:

1. **Sửa dứt điểm lỗi Stop Words (`VIETNAMESE_STOP_WORDS`)**:
   - Thêm cả dạng không dấu vào Set hoặc chuẩn hóa:
     `const VIETNAMESE_STOP_WORDS = new Set([...].map(w => stripVietnameseDiacritics(w).toLowerCase()))`.
   - Bổ sung các từ: `"cuon"`, `"sach"`, `"nhung"`, `"cac"`, `"de"`, `"duoc"`, `"hay"`, `"nen"`, `"doc"`, `"tim"`, `"huong"`, `"dan"`, `"cach"`.
   - Lưu ý từ `"cach"` trong tiếng Việt là hư từ chỉ phương thức ("cách làm", "cách nấu"), không nên để 1 mình từ `"cach"` kích hoạt điểm tiêu đề cho "Cách Nghĩ Để Thành Công" trừ khi có thêm từ `"nghi"` hoặc `"thanh cong"`.

2. **Nâng cao tiêu chuẩn khớp tiêu đề (Stricter Token Matching Guardrail)**:
   - Một token đơn lẻ không được phép tự ý tăng `+1.0` điểm trừ khi:
     * Tiêu đề sách chỉ có 1-2 từ, HOẶC
     * Tỷ lệ khớp từ trong tiêu đề phải đạt $\ge 50\%$ số từ của tiêu đề (ví dụ "Cách Nghĩ Để Thành Công" có 5 từ, phải khớp ít nhất 2-3 từ mới được coi là khớp tiêu đề).
   - Nâng ngưỡng `topScore` tối thiểu để coi là `hasDirectMatch` từ `1.2` lên `2.2` (hoặc yêu cầu phải có ít nhất 1 bigram/cluster hit hoặc token hit $\ge 2$).

3. **Tích hợp `resolveBookEntity` và `abbreviations` vào `searchProductsByContext`**:
   - Ở đầu hàm `searchProductsByContext`, gọi `const directEntity = this.resolveBookEntity(cleanQuery);`.
   - Nếu `directEntity` tìm thấy sách (qua từ viết tắt `dnt`, `đnt`, `btu`, `cttt 2`, hoặc tên tác giả, tên đầy đủ), gán điểm ưu tiên tuyệt đối (`score += 5.0`) cho cuốn sách đó.
   - Điều này vừa giải quyết triệt để lỗi tìm kiếm từ viết tắt trên thanh search bar, vừa bảo đảm tính nhất quán 100% giữa Entity Resolution và Semantic Search.

4. **Kiểm tra tỷ lệ từ không khớp (Out-of-vocabulary / Semantic Drift Guardrail)**:
   - Nếu trong câu truy vấn có các từ mang nghĩa hoàn toàn xa lạ với 13 cuốn sách (như "phở", "bánh mì", "nhẫn", "chúa tể", "lập trình", "xe máy", "vé máy bay", "naruto", "conan") mà không có bất kỳ cụm từ khóa chuyên đề nào khớp, hệ thống phải tự động đánh giá `hasDirectMatch = false` và trả về kết quả rỗng.

---

## 5. Verification Method (Quy Trình Kiểm Chứng Lại Sau Khi Worker Sửa)

Worker sau khi sửa mã nguồn chỉ cần chạy 2 lệnh sau để chứng minh đã khắc phục triệt để:

### 5.1. Chạy bộ kiểm thử Vitest Adversarial:
```powershell
cd C:\Users\basduy05\Downloads\aurabook\frontend
pnpm test:run src/lib/graphrag/graph-store.adversarial.test.ts
```
*Tiêu chí đạt*: **118/118 tests passed (100%)**, bao gồm cả 2 ca kiểm thử `"cách nấu phở bò"` và `"chúa tể những chiếc nhẫn"`.

### 5.2. Chạy Script tái hiện lỗi của Challenger:
```powershell
cd C:\Users\basduy05\Downloads\aurabook
python tests/test_challenger_m1_repro.py
```
*Tiêu chí đạt*:
- Mọi truy vấn ngoài danh mục (`cách nấu phở bò`, `chúa tể những chiếc nhẫn`, `tây du ký`, v.v.) phải trả về `0 books`.
- Mọi từ viết tắt (`dnt`, `đnt`, `btu`, `cttt 2`) phải trả về đúng `1 book`.
- Không xuất hiện bất kỳ dòng `[FAIL]` nào trong output.

---
*Báo cáo kết thúc. Chuyển giao thông tin đến Orchestrator để điều phối Worker hoàn thiện.*
