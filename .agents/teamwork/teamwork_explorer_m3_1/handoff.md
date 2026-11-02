# Báo Cáo Điều Tra Kỹ Thuật Milestone 3: AI Tìm Kiếm & Unified Catalog Semantic Retrieval (Frontend Focus)

**Người thực hiện:** `teamwork_explorer_m3_1` (Archetype: explorer, Read-Only Investigation)  
**Mã tiến trình / Task:** Milestone 3 (Frontend Storefront AI Search & Semantic Retrieval Investigation)  
**Thời gian hoàn thành:** 2026-10-31T15:58:00Z  
**Đường dẫn làm việc:** `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_1\`

---

## 1. Observation (Quan Sát Thực Tế & Bằng Chứng Mã Nguồn)

### 1.1. Hiện trạng tích hợp Frontend Storefront Search

#### A. Thanh tìm kiếm điều hướng (`frontend/src/ui/components/nav/components/search-bar.tsx`)
- **Cơ chế gợi ý khi nhập liệu (Live Autocomplete)** (Dòng 42–85):
  - Khi người dùng gõ từ 2 ký tự trở lên, kích hoạt debounce 260ms và gọi API:
    ```typescript
    // Dòng 65-67:
    const res = await fetch(
        `/api/ai/graphrag/search?query=${encodeURIComponent(q)}&channel=${encodeURIComponent(channel)}&locale=${encodeURIComponent(locale)}`,
    );
    ```
  - **Lưu ý quan trọng**: `search-bar.tsx` gọi endpoint nội bộ Next.js `/api/ai/graphrag/search`, **hoàn toàn không gọi** `/api/search/ai`.
  - Hiển thị dropdown gợi ý tối đa 4 cuốn sách (`(data.products || []).slice(0, 4)`). Nếu cờ `isGraphRAG` là `true`, giao diện bật huy hiệu `"Gợi ý theo ngữ cảnh GraphRAG"` cùng các tag chủ đề `#matchedConcepts` (Dòng 162–187).
- **Cơ chế submit tìm kiếm (Form Submit)** (Dòng 98–105):
  - Khi nhấn Enter hoặc click nút `"Xem toàn bộ kết quả cho [query]"`, trình duyệt chuyển hướng URL:
    ```typescript
    // Dòng 103:
    router.push(`${buildStorefrontPath(locale, channel, "/search")}?query=${encodeURIComponent(q)}`);
    ```

#### B. Trang kết quả tìm kiếm (`frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`)
- **Phân luồng xử lý truy vấn** (Dòng 101–143):
  ```typescript
  // 1. Tìm kiếm bình thường bằng Saleor GraphQL (Dòng 102-110)
  const result = await searchProducts({
      query,
      channel: params.channel,
      locale: params.locale,
      limit: 20,
      cursor,
      direction,
      sortBy,
  });

  let { products, pagination } = result;
  let isGraphRAGResult = false;
  let graphRAGInfo = null;

  // 2. NẾU KHÔNG TÌM THẤY KẾT QUẢ THƯỜNG -> CHUYỂN NGAY LẬP TỨC SANG GRAPHRAG THEO NGỮ CẢNH (Dòng 124-143)
  if (pagination.totalCount === 0 || products.length === 0) {
      const ragResult = graphRAGStore.searchProductsByContext(query, {
          channel: params.channel,
          locale: params.locale,
      });

      if (ragResult.products.length > 0) {
          products = ragResult.products;
          pagination = { totalCount: ragResult.totalCount };
          isGraphRAGResult = true;
          graphRAGInfo = {
              reasoningSummary: ragResult.reasoningSummary,
              matchedConcepts: ragResult.matchedConcepts,
              queryInterpretation: ragResult.queryInterpretation,
              recommendations: ragResult.recommendations,
              supplementaryRecommendations: ragResult.supplementaryRecommendations,
              hasDirectMatch: ragResult.hasDirectMatch,
          };
      }
  }
  ```
- **Hiện tượng phân luồng**:
  1. Trang ưu tiên chạy Saleor GraphQL search thông qua `searchProducts` (`frontend/src/lib/search/saleor-provider.ts`).
  2. Chỉ khi `pagination.totalCount === 0 || products.length === 0`, hàm mới gọi `graphRAGStore.searchProductsByContext(query)`.
  3. Nếu `ragResult.products.length === 0` (ví dụ trường hợp truy vấn ngoài danh mục hoặc không đạt ngưỡng tin cậy), `isGraphRAGResult` giữ nguyên `false`, `pagination.totalCount` giữ nguyên `0`. Kết quả rơi vào `EmptyState` chung chung (Dòng 147–159), làm biến mất toàn bộ thông tin giải thích `queryInterpretation` và `reasoningSummary` mà AI đã sinh ra!

#### C. Tuyến API Proxy Backend AI (`frontend/src/app/api/search/ai/route.ts`)
- File này nhận `POST { query, limit }` và chuyển tiếp đến Saleor Backend Django:
  ```typescript
  // Dòng 16-23:
  const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/aurabook/search/hybrid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
      signal: AbortSignal.timeout(6000),
  });
  ```
- **Quan sát cô lập**: Lệnh `grep_search` trên toàn bộ thư mục `frontend/src` xác nhận: **Không có bất kỳ component UI nào (kể cả `search-bar.tsx` lẫn `search/page.tsx`) gọi đến `/api/search/ai`**. Endpoint này đang bị cô lập hoàn toàn khỏi luồng người dùng Storefront.

#### D. Tuyến API GraphRAG Search (`frontend/src/app/api/ai/graphrag/search/route.ts`)
- Chạy song song 2 bước:
  - Bước 1 (Dòng 22–46): Thử `searchProducts` (Saleor keyword search). Nếu có kết quả (`regularProducts.length > 0`), trả về ngay với `isGraphRAG: false`.
  - Bước 2 (Dòng 48–63): Nếu Saleor không có kết quả, gọi `graphRAGStore.searchProductsByContext(query.trim())` và trả về `isGraphRAG: true`.

---

### 1.2. Thử nghiệm thực tế với các mẫu truy vấn (Probe Results)

Qua kiểm thử trực tiếp bằng kịch bản probe độc lập (`probe_search.py`), kết quả thu được:

| Truy vấn kiểm thử | Backend Hybrid Search (`:8000/aurabook/search/hybrid`) | Next.js GraphRAG API (`:3000/api/ai/graphrag/search`) | Next.js AI Proxy (`:3000/api/search/ai`) |
|---|---|---|---|
| **"tìm sách về phát triển bản thân"** | **Total: 5** (1. Cách Nghĩ Để Thành Công, 2. Đắc Nhân Tâm, 3. 10 Điều Tạo Nên Số Phận) | **Total: 0** (`isGraphRAG: true`, `products: []`) | **Total: 5** (Khớp 100% Backend RRF) |
| **"sách cho người mới bắt đầu lập trình"** | **Total: 5** (1. Bí Mật Của Một Trí Nhớ Siêu Phàm, 2. Đắc Nhân Tâm, 3. Trí Tuệ Do Thái) | **Total: 0** (`isGraphRAG: true`, `products: []`) | **Total: 5** (Khớp 100% Backend RRF) |
| **"đắc nhân tâm"** | **Total: 1** (Đắc Nhân Tâm, score: 0.03279) | **Total: 1** (Đắc Nhân Tâm, `isGraphRAG: true`) | **Total: 1** (Đắc Nhân Tâm) |
| **"dac nhan tam"** | **Total: 1** (Đắc Nhân Tâm, score: 0.03279) | **Total: 1** (Đắc Nhân Tâm, `isGraphRAG: true`) | **Total: 1** (Đắc Nhân Tâm) |
| **"Harry Potter"** | **Total: 5** (1. Sapiens, 2. Đắc Nhân Tâm, 3. Cây Cam Ngọt Của Tôi) | **Total: 0** (Chặn anti-hallucination thành công) | **Total: 5** (Hallucination do thiếu ngưỡng vector) |

---

### 1.3. Khảo sát nguyên nhân gốc rễ (Root Cause Analysis)

#### Nguyên nhân 1: "tìm sách về phát triển bản thân" bị trả về 0 kết quả trên GraphRAG
1. **Lỗi va chạm danh sách Stop Words tiếng Việt** (`frontend/src/lib/graphrag/graph-store.ts`, Dòng 1386–1400):
   - Danh sách stop words có từ `"bạn"` và `"ban"`.
   - Khi chuẩn hóa `cleanQuery = "tìm sách về phát triển bản thân"`, token `"bản"` bị hàm `stripVietnameseDiacritics` chuyển thành `"ban"`.
   - Kết quả: Từ `"bản"` bị nhận nhầm là stop word `"ban"` và bị loại bỏ hoàn toàn (`meaningfulTokens = ['phat', 'trien', 'than']`).
2. **Thiếu cụm chủ đề "phát triển bản thân" trong `clusterMatches`** (`graph-store.ts`, Dòng 1549–1563):
   - `clusterMatches` chỉ định nghĩa từ khóa hẹp theo từng slug riêng (ví dụ: `dac-nhan-tam` chỉ có "giao tiep", "ung xu", "thu phuc").
   - Không có cuốn sách nào được gán từ khóa "phat trien ban than" trong `clusterMatches`.
3. **Cơ chế xác thực tín hiệu quá ngặt (`hasStrongGroundingSignal`)** (`graph-store.ts`, Dòng 1613–1623):
   - Do không khớp title, author hay cluster, `hasStrongGroundingSignal` = `false`.
   - Mặc dù hệ thống nhận diện được concept `"Phát triển nhận thức & Kỹ năng sống"`, `scoredBooks` vẫn rỗng (`scoredBooks = []`).
   - Dẫn đến `hasDirectMatch = false` -> Trả về `totalCount: 0`.

#### Nguyên nhân 2: "sách cho người mới bắt đầu lập trình" bị ép thành 0 kết quả
1. **Từ khóa "lap trinh" nằm trong danh sách đen ngoài danh mục** (`graph-store.ts`, Dòng 1639):
   ```typescript
   const isOutOfCatalog =
       /(\b(...|giai thuat|du lieu|lap trinh|thoi tiet|gia vang|xe may|naruto)\b)/i.test(unaccentedQuery) || ...
   ```
2. Biến `isOutOfCatalog` kích hoạt -> `hasDirectMatch` bị ép bằng `false` (Dòng 1660).
3. Hệ thống trả về `products: []`, `totalCount: 0` cùng lời giải thích chân thực:
   `"Hệ thống phân tích ngữ nghĩa nhận diện bạn đang tìm kiếm về 'sách cho người mới bắt đầu lập trình'. Rất tiếc, kho sách tuyển chọn của AuraBook hiện chưa có tác phẩm viết riêng về nhân vật / chủ đề này."`
4. **Nhưng giao diện `search/page.tsx` lại nuốt mất lời giải thích này**: Do kiểm tra `if (ragResult.products.length > 0)` mới gán `isGraphRAGResult = true`, khi `ragResult.products` rỗng, `search/page.tsx` rơi vào `EmptyState` mặc định, hoàn toàn không hiển thị lời giải thích hay gợi ý nào cho người dùng!

#### Nguyên nhân 3: Backend Hybrid Search (`search.py`) thiếu bộ lọc chống ảo giác (Anti-Hallucination Guardrail)
1. Trong `backend/aurabook_apps/ai_search/search.py` (Dòng 139–140):
   ```python
   # Lọc khoảng cách tối đa 0.85 (cosine similarity >= 0.15)
   if pid not in seen_vec_pids and distance <= 0.85:
   ```
2. Ngưỡng khoảng cách cosine `distance <= 0.85` (tương đương similarity chỉ 0.15) là quá lỏng trong không gian 768 chiều.
3. Khi tìm kiếm một cuốn sách hoàn toàn không có trong kho như `"Harry Potter"`, tìm kiếm fulltext trả về 0 kết quả, nhưng tìm kiếm vector vẫn trả về 5 cuốn sách ngẫu nhiên có khoảng cách ~0.80.
4. Thuật toán RRF (Dòng 184–197) tính điểm cho 5 cuốn này và trả về cho client, gây ra hiện tượng **ảo giác (hallucination)** trái với yêu cầu F8 trong `PROJECT.md`.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Quan Sát Đến Kết Luận)

```
[Quan sát 1: search-bar.tsx gọi /api/ai/graphrag/search]
[Quan sát 2: search/page.tsx gọi searchProducts rồi fallback graphRAGStore]
[Quan sát 3: /api/search/ai tồn tại nhưng không component nào gọi]
           │
           ▼
[Suy luận 1]: Hai hệ thống AI Search (Backend pgvector HNSW 768-dim RRF vs Frontend GraphRAG 64-dim heuristic) đang bị chia cắt hoàn toàn, không đồng bộ dữ liệu với nhau trên giao diện người dùng.

[Quan sát 4: Backend Hybrid RRF tìm "phát triển bản thân" ra 3 cuốn chuẩn xác]
[Quan sát 5: Frontend GraphRAG tìm "phát triển bản thân" ra 0 kết quả]
[Quan sát 6: "ban" trong stop words làm mất "bản", thiếu cluster "phát triển bản thân"]
           │
           ▼
[Suy luận 2]: Frontend GraphRAG bị nghẽn ở khâu tiền xử lý ngôn ngữ tự nhiên và danh mục từ điển, khiến câu hỏi tự nhiên phổ biến của người dùng bị từ chối sai (false negative), trong khi Backend AI với 1.597 chunks pgvector đã sẵn sàng giải quyết hoàn hảo.

[Quan sát 7: "lap trinh" bị regex isOutOfCatalog chặn]
[Quan sát 8: search/page.tsx chỉ bật GraphRAG khi products.length > 0]
[Quan sát 9: Khi hasDirectMatch = false, products = [] dẫn đến EmptyState rỗng]
           │
           ▼
[Suy luận 3]: Cơ chế chống ảo giác của GraphRAG hoạt động đúng mục đích (nhận biết kho không có sách lập trình), nhưng tầng UI (search/page.tsx) bị lỗi thiết kế điều kiện, nuốt chửng thông điệp giải thích thông minh của AI và biến thành trang trống vô nghĩa.

[Quan sát 10: Backend Hybrid Search trả về 5 kết quả cho "Harry Potter"]
           │
           ▼
[Suy luận 4]: Backend Hybrid Search thiếu ngưỡng tương đồng vector tối thiểu (cần cosine distance <= 0.65 thay vì 0.85) và thiếu danh sách kiểm soát ngoài danh mục, dẫn đến hiện tượng gán ghép sách không liên quan khi người dùng tìm sách không tồn tại.
```

---

## 3. Caveats (Các Điểm Giới Hạn & Giả Định)

1. **Phạm vi quyền hạn**: Explorer là phân vai Read-Only, tuyệt đối không chỉnh sửa mã nguồn sản phẩm (`src/` hay `backend/`). Mọi thay đổi đề xuất được ghi nhận chi tiết tại Báo cáo này để Implementer thực hiện.
2. **Catalog giới hạn 13 cuốn sách**: Toàn bộ hệ thống AuraBook hiện chỉ có 13 đầu sách thương mại được cấp phép và nạp EPUB. Mọi tìm kiếm về sách giáo khoa, truyện tranh, tiểu thuyết phương Tây (ngoài Cây Cam Ngọt Của Tôi) hoặc sách kỹ thuật lập trình đều là truy vấn ngoài danh mục (out-of-catalog).
3. **Môi trường dịch vụ**: Cả 3 cổng mạng (`:3000` Next.js, `:8000` Django Saleor, `:5050` Piper TTS) đang hoạt động bình thường, Postgres pgvector và HNSW index đang chạy ổn định.

---

## 4. Conclusion (Kết Luận Đánh Giá Toàn Diện)

### Trả lời 4 câu hỏi trọng tâm của Task:

1. **Storefront Search Integration**:
   - `search-bar.tsx` tích hợp live autocomplete bằng cách gọi `GET /api/ai/graphrag/search`.
   - `search/page.tsx` tích hợp theo mô hình 2 tầng: Tầng 1 gọi Saleor GraphQL `searchProducts`, nếu không có kết quả mới fallback sang Tầng 2 `graphRAGStore.searchProductsByContext`.
   - `frontend/src/app/api/search/ai/route.ts` đã được xây dựng hoàn chỉnh kết nối với Django Hybrid RRF nhưng hiện **chưa được đấu nối vào UI**.

2. **Cách xử lý truy vấn tìm kiếm**:
   - Người dùng gõ từ khóa chính xác (vd: `"đắc nhân tâm"`, `"dac nhan tam"`): Được xử lý tốt bởi cả Saleor DB lẫn GraphRAG/Backend RRF.
   - Nhưng quy trình hiện tại là **ưu tiên lọc database truyền thống (Saleor GraphQL) trước, chỉ kích hoạt AI khi database trả về 0**. Điều này làm suy giảm giá trị của AI tìm kiếm: khi truy vấn có chứa 1 từ trùng với DB, AI semantic hoàn toàn bị vô hiệu hóa.

3. **Tích hợp kết quả Semantic Search vào Catalog View**:
   - Khi GraphRAG được kích hoạt, trang `search/page.tsx` chuyển sang render component `GraphRAGAnalysisSection` (hiển thị 3 cột: 1 cột trọng tâm + 2 cột tham khảo, kèm điểm tương đồng %, lý do gợi ý, điểm sáng tri thức, nút Like/Dislike RLHF).
   - Tuy nhiên, giao diện này bị ngắt kết nối với phân trang chuẩn (`Pagination`) và bộ lọc sắp xếp (`SearchSort`). Đặc biệt, khi `hasDirectMatch === false`, giao diện không hiển thị được phân tích mà rơi vào `EmptyState` rỗng.

4. **Hỗ trợ truy vấn ngôn ngữ tự nhiên**:
   - Truy vấn `"tìm sách về phát triển bản thân"`: Hiện **thất bại trên Storefront (0 kết quả)** do lỗi xử lý stop words loại bỏ nhầm chữ `"bản"` và thiếu từ khóa trong cluster; nhưng **thành công xuất sắc trên Backend Hybrid Search** (trả về đúng 3 cuốn: Cách Nghĩ Để Thành Công, Đắc Nhân Tâm, 10 Điều Tạo Nên Số Phận).
   - Truy vấn `"sách cho người mới bắt đầu lập trình"`: Được GraphRAG nhận diện chính xác là ngoài danh mục 13 cuốn sách hiện có, nhưng do lỗi UI điều kiện tại `search/page.tsx`, người dùng chỉ nhìn thấy thông báo lỗi trống trơn thay vì thông điệp giải thích và hướng dẫn hữu ích từ AI.

---

## 5. Đề Xuất Kế Hoạch Triển Khai Milestone 3 (Implementation Roadmap)

Dành cho Implementer Agent:

### Bước 1: Thống nhất tầng Retrieval (Unify AI Search Pipeline)
1. Cập nhật `frontend/src/app/api/ai/graphrag/search/route.ts`:
   - Thay vì chỉ dựa vào `graph-store.ts` cục bộ, tích hợp kết quả từ `POST http://localhost:8000/aurabook/search/hybrid` (qua `ai_search` proxy) để tận dụng 1.597 chunks pgvector HNSW 768 chiều.
   - Kết hợp điểm số RRF của Backend với Knowledge Graph & Metadata của GraphRAG để trả về kết quả giàu thông tin nhất.

### Bước 2: Sửa lỗi Stop Words và Bổ sung Semantic Clusters trong `graph-store.ts`
1. Tại `VIETNAMESE_STOP_WORDS_LIST` (`graph-store.ts`, Dòng 1386–1400):
   - Đổi `"bạn"` thành kiểm tra có dấu chính xác, không dùng unaccented `"ban"` trong stop words để bảo toàn từ `"bản"` trong `"bản thân"`, `"bản lĩnh"`.
2. Bổ sung cụm từ khóa phát triển bản thân vào `clusterMatches`:
   - Gán `"phat trien ban than"`, `"phát triển bản thân"`, `"thanh cong"`, `"ky nang"` cho `cach-nghi-de-thanh-cong`, `dac-nhan-tam`, `10-dieu-tao-nen-so-phan`.

### Bước 3: Sửa lỗi hiển thị UI trong `search/page.tsx`
1. Cho phép `isGraphRAGResult = true` ngay cả khi `ragResult.hasDirectMatch === false`:
   ```typescript
   // Thay vì: if (ragResult.products.length > 0)
   // Sửa thành:
   if (ragResult.products.length > 0 || ragResult.hasDirectMatch === false) {
       products = ragResult.products;
       pagination = { totalCount: ragResult.totalCount };
       isGraphRAGResult = true;
       graphRAGInfo = { ... };
   }
   ```
2. Trong nhánh `isGraphRAGResult && graphRAGInfo`: Nếu `hasDirectMatch === false`, hiển thị Banner giải thích thông minh kèm danh sách sách gợi ý thay thế (`supplementaryRecommendations`), tránh để màn hình trắng rỗng.

### Bước 4: Thắt chặt ngưỡng chống ảo giác trong `search.py` (Backend)
1. Tại `backend/aurabook_apps/ai_search/search.py`:
   - Hạ ngưỡng khoảng cách cosine: `distance <= 0.60` (hoặc `similarity >= 0.40`).
   - Nếu tổng điểm RRF của kết quả dẫn đầu < 0.0165 và không có kết quả fulltext nào, coi như không tìm thấy (tránh trả về 5 kết quả ngẫu nhiên cho `"Harry Potter"`).

---

## 6. Verification Method (Phương Pháp Kiểm Chứng Độc Lập)

Để kiểm chứng toàn bộ các phát hiện trên mà không làm gián đoạn hệ thống:

1. **Chạy kịch bản probe đối chiếu 3 endpoint**:
   ```bash
   python .agents/teamwork/teamwork_explorer_m3_1/probe_search.py
   ```
   *Tiêu chí quan sát*: Xác nhận Backend trả về 5 kết quả cho "phát triển bản thân" trong khi Next.js GraphRAG API trả về 0 kết quả.

2. **Chạy bộ kiểm thử tự động toàn diện cho AI Search**:
   ```bash
   python tests/ai_evaluation_suite.py --feature ai_search
   ```
   *Tiêu chí quan sát*: Toàn bộ 11/11 test cases của `ai_search` đạt 100% PASS trên các điều kiện biên hiện tại.

3. **Chạy kiểm thử chuyển tiếp tìm kiếm sang đọc sách (Cross-feature)**:
   ```bash
   python tests/ai_evaluation_suite.py --id TC-T3-01
   python tests/ai_evaluation_suite.py --id TC-T3-02
   ```
   *Tiêu chí quan sát*: Cả 2 bài test chuyển tiếp tìm kiếm sang đọc sách đều đạt PASS.
