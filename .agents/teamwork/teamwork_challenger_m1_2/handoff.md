# BÁO CÁO THẨM ĐỊNH & THỬ THÁCH ĐỐI KHÁNG (CHALLENGER REPORT)
**Phân hệ**: Backend pgvector & Hybrid Search Engine (`/aurabook/search/hybrid`)  
**Agent thực hiện**: M1 Challenger 2 (`teamwork_challenger_m1_2`)  
**Thời gian hoàn thành**: 2026-10-31T14:31:00Z  
**Thư mục làm việc**: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_2\`  
**Đánh giá tổng quát (Verdict)**: **REQUEST_CHANGES**  

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp)

Tôi đã thiết lập bộ kiểm thử đối kháng tự động độc lập gồm 46 ca kiểm thử tại `tests/challenge_m1_adversarial.py` để trực tiếp tấn công và stress-test hệ thống pgvector và endpoint `/aurabook/search/hybrid`. Dưới đây là các quan sát thực nghiệm đo lường trực tiếp:

### 1.1. Lỗ Hổng Crash HTTP 500 khi Query là Non-String / Null (CRITICAL)
- **Vị trí mã nguồn**: `backend/aurabook_apps/ai_search/views.py`, dòng 24 (tại `HybridSearchView.post`) và dòng 47 (tại `RAGQueryView.post`).
  ```python
  23: body = json.loads(request.body)
  24: query = body.get("query", "").strip()
  ```
- **Hành vi thực tế**:
  Khi người dùng hoặc client gửi JSON với trường `"query"` mang giá trị `null` hoặc kiểu dữ liệu khác chuỗi (`int`, `float`, `bool`, `list`, `dict`), phương thức `body.get("query", "")` trả về chính giá trị trong dict thay vì default `""`. Phép gọi `.strip()` trên giá trị này kích hoạt ngoại lệ `AttributeError`.
- **Traceback thực tế thu được từ server**:
  ```
  Invoke-WebRequest : AttributeError at /aurabook/search/hybrid
  'NoneType' object has no attribute 'strip'
  Request Method: POST
  Request URL: http://localhost:8000/aurabook/search/hybrid
  Exception Type: AttributeError
  Exception Value: 'NoneType' object has no attribute 'strip'
  Exception Location: /app/aurabook_apps/ai_search/views.py, line 24, in post
  ```
- **Thực nghiệm quét toàn bộ các kiểu dữ liệu**:
  Lệnh thực thi:
  ```powershell
  python -c "import urllib.request, json; payloads = [None, 123, 45.67, True, ['test'], {'a': 1}];
  for p in payloads:
      try:
          req = urllib.request.Request('http://localhost:8000/aurabook/search/hybrid', data=json.dumps({'query': p}).encode(), headers={'Content-Type': 'application/json'}); urllib.request.urlopen(req)
      except urllib.error.HTTPError as e:
          print(f'Payload {p}: HTTP {e.code}')"
  ```
  Kết quả:
  - `Payload None`: **HTTP 500 Internal Server Error**
  - `Payload 123`: **HTTP 500 Internal Server Error**
  - `Payload 45.67`: **HTTP 500 Internal Server Error**
  - `Payload True`: **HTTP 500 Internal Server Error**
  - `Payload ['test']`: **HTTP 500 Internal Server Error**
  - `Payload {'a': 1}`: **HTTP 500 Internal Server Error**

### 1.2. Độ trễ cao khi truy vấn cực dài không giới hạn độ dài (MEDIUM)
- **Vị trí mã nguồn**: `backend/aurabook_apps/ai_search/views.py` và `search.py`.
- **Hành vi thực tế**:
  Endpoint không giới hạn độ dài tối đa của `query`. Khi gửi payload 100,000 ký tự:
  - Thời gian phản hồi tăng lên **5.404s** (vượt ngưỡng tiêu chuẩn 5.0s).
  - Nguyên nhân: `re.findall(r"\w+", norm_query)` và `unaccent` ILIKE trên chuỗi 100,000 ký tự làm tiêu hao CPU, có nguy cơ gây Denial of Service (DoS) nếu nhiều yêu cầu đồng thời được gửi.

### 1.3. Khả Năng Chống SQL Injection (ROBUST)
- Đã thực thi 11 payload tấn công SQL Injection:
  `' OR 1=1 --`, `' OR '1'='1`, `" OR ""="`, `'; DROP TABLE ai_search_bookchunk; --`, `' UNION SELECT null, ...`, `admin' --`, `1' ORDER BY 1--+`, `'; SELECT pg_sleep(3); --`, `\x00`, `1; EXEC xp_cmdshell('dir'); --`.
- **Kết quả**: 100% payload bị vô hiệu hóa an toàn nhờ cơ chế parameterized cursor `%s` của Django/psycopg3. Bảng dữ liệu được bảo toàn tuyệt đối, không có độ trễ sleep (tất cả phản hồi dưới 0.12s), không phát sinh lỗi cú pháp SQL.

### 1.4. Cơ Chế Chống Zero-Vector & NaN trong pgvector (ROBUST)
- **Thực nghiệm trên PostgreSQL**:
  Lệnh:
  ```sql
  SELECT (embedding <=> '[0.0, ..., 0.0]'::vector) FROM ai_search_bookchunk LIMIT 1;
  ```
  Kết quả trả về: `NaN`. Xác nhận rằng khoảng cách cosine pgvector đối với zero-vector thực sự sinh ra `NaN`.
- **Thực nghiệm trên Backend**:
  Hàm `search.py` có cơ chế bảo vệ:
  ```python
  has_valid_vector = any(x != 0.0 for x in query_embedding)
  if has_valid_vector:
      # Thực thi pgvector
  ```
  Hàm `generate_dense_768_embedding` trong `gemini_client.py` luôn đặt `vec[641] = 1.0` nên vector sinh ra luôn có độ dài chuẩn L2 = 1.0 (đo lường: `L2 Norm = 1.000000`, số chiều khác không tối thiểu = 1).
  Không có bất kỳ truy vấn đối kháng nào sinh ra giá trị `NaN` trong kết quả trả về.

### 1.5. Xác Thực HNSW Index Trong PostgreSQL (VERIFIED)
- Kiểm tra danh mục index:
  `ai_search_bookchunk_embedding_hnsw_idx` tồn tại trên bảng `ai_search_bookchunk`, sử dụng phương pháp `hnsw (embedding vector_cosine_ops)`.
  Trạng thái: `indisvalid = true`, `indisready = true`.
- Thực hiện `EXPLAIN (ANALYZE, BUFFERS)`:
  ```sql
  SET enable_seqscan = off;
  EXPLAIN (ANALYZE, BUFFERS) 
  SELECT bc.product_id, (bc.embedding <=> %s::vector) AS distance 
  FROM ai_search_bookchunk bc 
  WHERE bc.embedding IS NOT NULL 
  ORDER BY distance ASC LIMIT 50;
  ```
  Kế hoạch thực thi xác nhận:
  `Index Scan using ai_search_bookchunk_embedding_hnsw_idx on ai_search_bookchunk bc (cost=190.24..3979.94 rows=1597 width=10)`
  Chỉ số HNSW hoạt động trơn tru và chính xác.
- Số lượng bản ghi `ai_search_bookchunk`: chính xác **1,597** chunks, phân bố đủ 13 cuốn sách, **0** bản ghi có embedding NULL.

### 1.6. Truy Vấn Đa Nghĩa & Bộ Sách (VERIFIED)
- Truy vấn bộ sách `"chien tranh tien te"`: Trả về đầy đủ cả 3 tập (`chien-tranh-tien-te-tap-1`, `tap-2`, `tap-3`) trong top kết quả.
- Truy vấn tập cụ thể `"chien tranh tien te tap 1"`: Xếp hạng chính xác Tập 1 ở vị trí #1.
- Truy vấn khái niệm `"tu duy cham he thong 1"`: Xếp hạng chính xác `"tu-duy-nhanh-va-cham"` ở vị trí #1.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Quan Sát Đến Kết Luận)

```
[Quan sát 1.1: Payload {"query": null} hoặc {"query": 123}]
                     │
                     ▼
[views.py dòng 24: query = body.get("query", "").strip()]
                     │
                     ▼
[AttributeError: 'NoneType'/'int' object has no attribute 'strip']
                     │
                     ▼
[try...except chỉ bắt (json.JSONDecodeError, ValueError) mà không bắt AttributeError]
                     │
                     ▼
[Unhandled Exception bung ra ngoài Django Middleware -> Trả về HTTP 500 Crash]
                     │
                     ▼
[Vi phạm Acceptance Criteria R1 & Production Reliability trong ORIGINAL_REQUEST.md: 
 "Cả 3 phân hệ hoàn thành chu trình mà không phát sinh unhandled exception hoặc crash"]
                     │
                     ▼
[KẾT LUẬN: BẮT BUỘC YÊU CẦU WORKER SỬA MÃ NGUỒN (REQUEST_CHANGES)]
```

---

## 3. Caveats (Các Giới Hạn & Giả Định)

1. **Phạm vi kiểm thử**: Tôi tập trung toàn diện vào backend pgvector, search API (`/aurabook/search/hybrid`), schema DB, HNSW index và các vector tấn công đối kháng. Phân hệ Voice Chat và Web Reader AI thuộc phạm vi các Milestone tiếp theo (M2, M4) nên không nằm trong báo cáo này.
2. **Quy định vai trò**: Tuân thủ nguyên tắc Review-only của Challenger, tôi không tự ý sửa đổi mã nguồn backend mà ghi nhận chính xác lỗi và đề xuất bản vá cụ thể cho Worker.

---

## 4. Conclusion (Kết Luận & Yêu Cầu Thay Đổi)

### Verdict: **REQUEST_CHANGES**

Hệ thống pgvector, HNSW index, cơ sở dữ liệu và thuật toán Hybrid Search RRF hoạt động rất ấn tượng về mặt tính toán toán học, khử nhiễu SQLi và chống sinh NaN. Tuy nhiên, API tồn tại lỗi crash nghiêm trọng vi phạm tiêu chuẩn vận hành thực tế (Production Reliability):

### Các thay đổi yêu cầu Worker M1 khắc phục ngay:
1. **Sửa lỗi xác thực kiểu dữ liệu trong `backend/aurabook_apps/ai_search/views.py`**:
   Tại cả hai class `HybridSearchView` (dòng 24) và `RAGQueryView` (dòng 47), kiểm tra tường minh kiểu dữ liệu `str` và giới hạn độ dài truy vấn tối đa (ví dụ 1,000 hoặc 2,000 ký tự) để chống DoS:
   ```python
   raw_query = body.get("query")
   if not isinstance(raw_query, str):
       return JsonResponse({"error": "query must be a string"}, status=400)
   query = raw_query.strip()
   if not query:
       return JsonResponse({"error": "query is required"}, status=400)
   if len(query) > 1000:
       query = query[:1000]
   ```
2. Sau khi Worker cập nhật, chạy lại bộ kiểm thử `python tests/challenge_m1_adversarial.py` để đạt tỷ lệ vượt qua **46/46 (100%)**.

---

## 5. Verification Method (Quy Trình Kiểm Chứng Độc Lập)

Bất kỳ kiểm thử viên hoặc Orchestrator nào có thể tái hiện độc lập lỗi và kiểm chứng hệ thống qua các lệnh sau:

### 5.1. Tái hiện lỗi HTTP 500 Crash:
```powershell
# Bằng PowerShell Invoke-WebRequest:
Invoke-WebRequest -Uri "http://localhost:8000/aurabook/search/hybrid" -Method POST -ContentType "application/json" -Body '{"query": null}'
# Kỳ vọng hiện tại: Lỗi 500 AttributeError 'NoneType' object has no attribute 'strip'.
# Kỳ vọng sau khi fix: Trả về HTTP 400 Bad Request.
```

### 5.2. Chạy toàn bộ 46 ca kiểm thử đối kháng:
```powershell
python C:\Users\basduy05\Downloads\aurabook\tests\challenge_m1_adversarial.py
```
*Kỳ vọng sau khi Worker sửa*: 46 PASSED, 0 FAILED (100%).

### 5.3. Kiểm chứng HNSW Index Scan trong PostgreSQL:
```powershell
docker exec aurabook-postgres psql -U saleor -d aurabook_db -c "SET enable_seqscan = off; EXPLAIN ANALYZE SELECT bc.product_id, (bc.embedding <=> (SELECT embedding FROM ai_search_bookchunk LIMIT 1)) AS distance FROM ai_search_bookchunk bc WHERE bc.embedding IS NOT NULL ORDER BY distance ASC LIMIT 50;"
```
*Kỳ vọng*: Hiển thị `Index Scan using ai_search_bookchunk_embedding_hnsw_idx`.
