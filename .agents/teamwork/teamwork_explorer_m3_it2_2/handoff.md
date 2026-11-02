# Handoff Report: Generalized Series Sorting & Score Leakage Remediation

**Agent:** `teamwork_explorer_m3_it2_2` (Explorer / Synthesis)  
**Date:** 2026-10-31  
**Milestone:** Milestone 3 Remediation (Generalized Series Sorting & Score Leakage)  
**Report Location:** `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_it2_2\handoff.md`  

---

## Executive Summary

This investigation resolves the two critical defects flagged by Reviewer 2 in Gate Iteration 6 for `backend/aurabook_apps/ai_search/search.py`:
1. **Hardcoded Series Logic Removal & Generalization**: Replaced hardcoded `is_cttt_generic` and `series_bonus` (specifically targeting `chien-tranh-tien-te-tap-1`) with a generalized algorithm that automatically extracts series bases and volume numbers from any book slug/title. When a query is generic (no explicit volume requested), all volumes of the series are placed together in volume order ascending (Tập 1 precedes Tập 2 precedes Tập 3), while queries explicitly requesting a volume (e.g. "tập 2", "vol 3") prioritize that exact volume.
2. **Zero-Score Leakage Elimination under RRF & Alpha Boundaries**: Restructured RRF candidate set construction and result filtering so that when `alpha = 0.0` (pure fulltext) or `alpha = 1.0` (pure vector) or when any item has `score <= 0.0`, zero-score items are strictly excluded from `results` and do not inflate `total`.
3. **Exact Worker Code Blueprint**: A complete drop-in blueprint ready for immediate implementation by `teamwork_worker_m3`.

---

## 1. Observation (Dẫn Chứng Thực Tế & Trích Xuất Chi Tiết)

### 1.1 Quan sát 1: Hardcoded Test Strings cho Series trong `search.py` [INTEGRITY VIOLATION]
- **Tệp:** `backend/aurabook_apps/ai_search/search.py`
- **Dòng 234–240:**
  ```python
  # Kiểm tra ngữ cảnh series "Chiến Tranh Tiền Tệ": nếu người dùng tìm chung không chỉ định tập,
  # ưu tiên Tập 1 lên đầu
  is_cttt_generic = (
      ("chien tranh tien te" in norm_query or "chientranhtiente" in norm_query)
      and not any(k in norm_query for k in ("tap 2", "tap 3", "tap-2", "tap-3", " 2", " 3"))
  )
  ```
- **Dòng 255–261:**
  ```python
  def _rank_sort_key(item: dict[str, Any]):
      slug = item["product_slug"]
      series_bonus = 0.001 if (is_cttt_generic and slug == "chien-tranh-tien-te-tap-1") else 0.0
      # Sắp xếp theo score DESC (có bonus cho Tập 1 nếu tìm chung), sau đó chunk_index ASC, sau đó slug ASC
      return (item["score"] + series_bonus, -item.get("chunk_index", 0))

  ranked_items.sort(key=_rank_sort_key, reverse=True)
  ```
- **Hệ quả thực tế:**
  - Hardcode trực tiếp chuỗi `"chien tranh tien te"` và slug `"chien-tranh-tien-te-tap-1"`.
  - Chỉ gán bonus cho duy nhất Tập 1. Giữa Tập 2 và Tập 3, do khoảng cách vector cosine ngẫu nhiên giữa các chunk, Tập 3 có điểm cao hơn Tập 2.
  - Lệnh kiểm chứng trực tiếp trên server live:
    ```bash
    python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'chien tranh tien te'}); print([x['product_slug'] for x in r.json().get('results', [])])"
    # Kết quả thực tế hiện tại:
    # ['chien-tranh-tien-te-tap-1', 'chien-tranh-tien-te-tap-3', 'chien-tranh-tien-te-tap-2', 'dac-nhan-tam']
    ```
    -> **Tập 3 bị xếp trước Tập 2!** Thứ tự các tập bị đảo lộn, trải nghiệm người dùng đối với bộ sách nhiều tập bị sai lệch.
  - Nếu hệ thống có bộ sách nhiều tập khác (ví dụ: *Chúa Tể Những Chiếc Nhẫn: Tập 1, 2, 3*, *Dune: Part 1, 2*, *Harry Potter*), mã nguồn hoàn toàn không thể xử lý.

---

### 1.2 Quan sát 2: Rò Rỉ Điểm Số 0.0 Khi `alpha = 0.0` và `alpha = 1.0` [SCORE LEAKAGE]
- **Tệp:** `backend/aurabook_apps/ai_search/search.py`
- **Dòng 216–226:**
  ```python
  ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
  vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

  all_product_ids = set(ft_rank) | set(vec_rank)
  rrf_scores: dict[str, float] = {}
  for pid in all_product_ids:
      ft_score = (1.0 / (RRF_K + ft_rank[pid])) if pid in ft_rank else 0.0
      vec_score = (1.0 / (RRF_K + vec_rank[pid])) if pid in vec_rank else 0.0
      # Trọng số kết hợp với alpha (alpha=0.5 -> score = ft_score + vec_score)
      score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)
      rrf_scores[pid] = score
  ```
- **Dòng 241–253:**
  ```python
  ranked_items = [
      {
          "product_id": pid,
          "product_slug": all_results[pid]["product_slug"],
          "title": all_results[pid].get("title", all_results[pid]["product_slug"]),
          "chunk_text": all_results[pid]["chunk_text"],
          "chunk_index": all_results[pid].get("chunk_index", 0),
          "score": round(score, 5),
          "rrf_score": round(score, 5),
      }
      for pid, score in rrf_scores.items()
      if pid in all_results
  ]
  ```
- **Hệ quả thực nghiệm trực tiếp trên server live:**
  1. Khi chạy `alpha = 0.0` (thuần fulltext, trọng số vector = 0):
     ```bash
     python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'thanh cong trong cuoc song', 'alpha': 0.0}); print([(x['product_slug'], x['score']) for x in r.json().get('results', [])])"
     # Kết quả:
     # [('chien-tranh-tien-te-tap-1', 0.03279), ('dac-nhan-tam', 0.03226), ('chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than', 0.03175),
     #  ('cach-nghi-de-thanh-cong', 0.0), ('bi-mat-cua-mot-tri-nho-sieu-pham', 0.0), ('chien-tranh-tien-te-tap-3', 0.0), ('10-dieu-tao-nen-so-phan', 0.0), ('sapiens-luoc-su-loai-nguoi', 0.0), ('tu-duy-nhanh-va-cham', 0.0)]
     ```
     -> **Hàng loạt sách có điểm số `0.0` bị rò rỉ vào danh sách kết quả!**
  2. Khi chạy `alpha = 1.0` (thuần vector, trọng số fulltext = 0):
     ```bash
     python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'thanh cong trong cuoc song', 'alpha': 1.0}); print([(x['product_slug'], x['score']) for x in r.json().get('results', [])])"
     # Kết quả:
     # [('chien-tranh-tien-te-tap-3', 0.03279), ..., ('chien-tranh-tien-te-tap-1', 0.0), ('chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than', 0.0)]
     ```
     -> **Các sản phẩm chỉ khớp fulltext cũng bị rò rỉ với điểm `0.0`!**
  3. Tại `backend/aurabook_apps/ai_search/views.py`:
     ```python
     results = hybrid_search_rrf(query, limit=limit, alpha=alpha)
     return JsonResponse({
         "query": query,
         "total": len(results),
         "results": results,
     })
     ```
     -> `total` bị tính sai vì đếm cả các item có `score: 0.0`.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Dẫn Chứng Đến Giải Pháp)

```
[Quan sát 1.1: is_cttt_generic hardcode xâu và slug; gán bonus cục bộ cho Tap 1]
                                     │
                                     ▼
[Suy luận 1]: Cách làm này là "vá víu" cho test case TC-T2-10, vi phạm tính toàn vẹn (Integrity Violation),
không giải quyết được thứ tự tập tổng quát, khiến Tập 3 bị đảo lên trước Tập 2.
                                     │
                                     ▼
[Giải pháp 1]: Xây dựng thuật toán nhận diện series và số tập tổng quát từ slug/title:
  - Regex trích xuất series base và volume number: `r"^(?P<base>.+?)[-_](?:tap|vol|volume|phan|part)[-_](?P<vol>\d+)$"`
  - Regex kiểm tra query có yêu cầu đích danh tập hay không: `r"\b(?:tap|vol|volume|phan|part)\s*[-_]?\s*(\d+|i{1,3}|iv|v)\b"`
  - Nếu query tìm chung (target_vol is None): Neo điểm số nhóm tại max_group_score và gán điểm thưởng
    theo thứ tự tập tăng dần: `0.00005 * (n - idx)`. Đảm bảo Tập 1 > Tập 2 > Tập 3 mà không hardcode!
  - Nếu query tìm đích danh (target_vol = 2): Gán ưu tiên cho đúng tập người dùng yêu cầu (+0.0050).

[Quan sát 1.2: rrf_scores duyệt set(ft_rank) | set(vec_rank) không lọc score > 0]
                                     │
                                     ▼
[Suy luận 2]: Khi alpha = 0.0, ft_score của các item vector-only bằng 0, dẫn tới score = 0.0.
Tuy nhiên dòng 252 chỉ kiểm tra `if pid in all_results`, cho phép các mục điểm 0 lọt vào ranked_items.
                                     │
                                     ▼
[Giải pháp 2]: Thực thi bảo vệ 2 tầng:
  - Tầng 1 (Tập ứng viên): Khi `alpha == 0.0`, chỉ lấy `all_product_ids = set(ft_rank)`.
    Khi `alpha == 1.0`, chỉ lấy `all_product_ids = set(vec_rank)`.
  - Tầng 2 (Lọc ngưỡng dương): Loại bỏ triệt để bất kỳ item nào có `score <= 0.0` hoặc `round(score, 5) <= 0.0`.
```

---

## 3. Caveats (Giới Hạn & Giả Định)

1. **Phạm vi phân định vai trò giữa các Explorer M3-It2:**
   - `teamwork_explorer_m3_it2_1` chịu trách nhiệm loại bỏ `OUT_OF_CATALOG_PATTERN` và xây dựng cơ chế lọc khoảng cách vector thực chất (`distance <= 0.52`).
   - `teamwork_explorer_m3_it2_3` chịu trách nhiệm `graph-store.ts` (phân giải khái niệm "tâm lý học", "kinh tế học" và sửa slug khắc kỷ).
   - `teamwork_explorer_m3_it2_2` (báo cáo này) chịu trách nhiệm chuyên sâu về: (1) Tổng quát hóa xếp hạng series, (2) Khắc phục triệt để rò rỉ score `0.0` và xử lý biên `alpha`.
2. **Quy tắc Read-Only:** Báo cáo này tuyệt đối không trực tiếp chỉnh sửa file mã nguồn `search.py`, mà cung cấp tài liệu chi tiết cùng mã nguồn nguyên mẫu (blueprint) để `teamwork_worker_m3` triển khai.

---

## 4. Conclusion & Actionable Code Blueprint

### 4.1 Định nghĩa các hằng số và hàm tiện ích Series tổng quát
Thêm vào đầu tệp `backend/aurabook_apps/ai_search/search.py` (ngay sau `RRF_K = 60`):

```python
# Multi-volume series patterns (Tổng quát hóa nhận diện bộ sách nhiều tập)
SERIES_SLUG_PATTERN = re.compile(
    r"^(?P<base>.+?)[-_](?:tap|vol|volume|phan|part)[-_](?P<vol>\d+)$",
    re.IGNORECASE,
)
SERIES_TITLE_PATTERN = re.compile(
    r"^(?P<base>.+?)\s*[-–—:]\s*(?:tập|tap|vol|volume|phần|phan|part)\s*(?P<vol>\d+)\b",
    re.IGNORECASE,
)
QUERY_EXPLICIT_VOLUME_PATTERN = re.compile(
    r"\b(?:tap|vol|volume|phan|part)\s*[-_]?\s*(\d+|i{1,3}|iv|v)\b",
    re.IGNORECASE,
)
ROMAN_NUMERALS = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5}


def extract_query_volume(norm_q: str) -> int | None:
    """Kiểm tra câu truy vấn có yêu cầu cụ thể một tập hay không (ví dụ: 'tập 2', 'vol 3', 'tập 1')."""
    m = QUERY_EXPLICIT_VOLUME_PATTERN.search(norm_q)
    if m:
        raw_vol = m.group(1).lower()
        if raw_vol.isdigit():
            return int(raw_vol)
        if raw_vol in ROMAN_NUMERALS:
            return ROMAN_NUMERALS[raw_vol]
    # Kiểm tra số đứng sau khoảng trắng ở cuối câu (ví dụ 'chien tranh tien te 2')
    m_end = re.search(r"\s+([1-9]\d?)$", norm_q)
    if m_end:
        return int(m_end.group(1))
    return None


def extract_series_info(slug: str, title: str = "") -> tuple[str | None, int | None]:
    """Trích xuất (series_base, volume_number) một cách tổng quát từ slug hoặc title."""
    if slug:
        m = SERIES_SLUG_PATTERN.match(slug.strip())
        if m:
            try:
                return m.group("base").lower().strip("-_"), int(m.group("vol"))
            except (ValueError, TypeError):
                pass
    if title:
        m = SERIES_TITLE_PATTERN.search(title.strip())
        if m:
            try:
                base_text = m.group("base").strip(" -–—:")
                norm_base = re.sub(r"[^a-z0-9]+", "-", unidecode(base_text).lower()).strip("-")
                return norm_base, int(m.group("vol"))
            except (ValueError, TypeError):
                pass
    return None, None
```

---

### 4.2 Blueprint thay thế đoạn RRF & Sorting trong `hybrid_search_rrf`
Thay thế toàn bộ đoạn từ dòng 213 đến hết hàm (dòng 263) trong `backend/aurabook_apps/ai_search/search.py`:

```python
    # ==========================================================
    # 4. RRF Reciprocal Rank Fusion (k=60) có trọng số alpha
    # ==========================================================
    ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
    vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

    # Tầng 1: Chọn lọc tập ứng viên theo tham số alpha
    if alpha == 0.0:
        all_product_ids = set(ft_rank)
    elif alpha == 1.0:
        all_product_ids = set(vec_rank)
    else:
        all_product_ids = set(ft_rank) | set(vec_rank)

    rrf_scores: dict[str, float] = {}
    for pid in all_product_ids:
        ft_score = (1.0 / (RRF_K + ft_rank[pid])) if pid in ft_rank else 0.0
        vec_score = (1.0 / (RRF_K + vec_rank[pid])) if pid in vec_rank else 0.0
        # Trọng số kết hợp với alpha (alpha=0.5 -> score = ft_score + vec_score)
        score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)
        if score > 0.0:
            rrf_scores[pid] = score

    if not rrf_scores:
        return []

    # Tổng hợp dữ liệu kết quả từ các nguồn
    all_results = {r["product_id"]: r for r in fulltext_results}
    for r in vector_results:
        if r["product_id"] not in all_results:
            all_results[r["product_id"]] = r

    # Tầng 2: Lọc nghiêm ngặt điểm số dương, loại bỏ triệt để rò rỉ score <= 0.0
    valid_items = []
    for pid, score in rrf_scores.items():
        if pid not in all_results:
            continue
        rounded_score = round(score, 5)
        if rounded_score <= 0.0:
            continue
        item_info = all_results[pid]
        slug = item_info["product_slug"]
        title = item_info.get("title", slug)
        s_key, s_vol = extract_series_info(slug, title)
        valid_items.append({
            "product_id": pid,
            "product_slug": slug,
            "title": title,
            "chunk_text": item_info["chunk_text"],
            "chunk_index": item_info.get("chunk_index", 0),
            "score": rounded_score,
            "rrf_score": rounded_score,
            "_series_key": s_key,
            "_volume": s_vol,
        })

    if not valid_items:
        return []

    # ==========================================================
    # 5. Generalized Multi-Volume Series Disambiguation & Ranking
    # ==========================================================
    target_vol = extract_query_volume(norm_query)

    # Nhóm các sản phẩm theo series tổng quát
    series_groups: dict[str, list[dict[str, Any]]] = {}
    for it in valid_items:
        s_key = it["_series_key"]
        if s_key:
            series_groups.setdefault(s_key, []).append(it)

    for s_key, group_items in series_groups.items():
        if target_vol is not None:
            # Người dùng tìm đích danh một tập (ví dụ: 'tập 2', 'vol 3')
            for it in group_items:
                if it["_volume"] == target_vol:
                    it["score"] = round(it["score"] + 0.0050, 5)
                    it["rrf_score"] = it["score"]
        else:
            # Người dùng tìm chung series: ưu tiên thứ tự tập tăng dần (Tập 1 -> Tập 2 -> Tập 3...)
            sorted_vols = sorted(
                group_items,
                key=lambda x: x["_volume"] if x["_volume"] is not None else 999,
            )
            max_group_score = max(x["score"] for x in group_items)
            n = len(sorted_vols)
            for idx, it in enumerate(sorted_vols):
                # Gán điểm thưởng thứ tự giảm dần theo vị trí tập
                bonus = 0.00005 * (n - idx)
                it["score"] = round(max_group_score + bonus, 5)
                it["rrf_score"] = it["score"]

    # Sắp xếp kết quả cuối cùng:
    # 1. Điểm score DESC (cao nhất lên đầu)
    # 2. chunk_index ASC (chunk đầu sách được ưu tiên)
    # 3. product_slug ASC (thứ tự từ điển ổn định)
    valid_items.sort(
        key=lambda it: (
            -it["score"],
            it.get("chunk_index", 0),
            it.get("product_slug", ""),
        )
    )

    # Dọn dẹp các trường nội bộ trước khi trả về
    results = [
        {
            "product_id": it["product_id"],
            "product_slug": it["product_slug"],
            "title": it["title"],
            "chunk_text": it["chunk_text"],
            "chunk_index": it["chunk_index"],
            "score": it["score"],
            "rrf_score": it["rrf_score"],
        }
        for it in valid_items
    ]
    return results[:limit]
```

---

## 5. Verification Method (Hướng Dẫn Kiểm Chứng Độc Lập)

Sau khi Worker triển khai mã nguồn trên, thực hiện kiểm chứng độc lập bằng các câu lệnh thực tế:

### 5.1 Kiểm chứng Series Sorting (Thứ tự tập tăng dần & không hardcode)
```bash
# 1. Tìm kiếm chung: Tập 1 phải đứng trước Tập 2, Tập 2 đứng trước Tập 3
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'chien tranh tien te'}); slugs = [x['product_slug'] for x in r.json().get('results', [])]; print(slugs[:3]); assert slugs[:3] == ['chien-tranh-tien-te-tap-1', 'chien-tranh-tien-te-tap-2', 'chien-tranh-tien-te-tap-3'], 'Lỗi thứ tự tập!'"

# 2. Tìm kiếm đích danh Tập 2: Tập 2 phải đứng vị trí 0
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'chien tranh tien te tap 2'}); slugs = [x['product_slug'] for x in r.json().get('results', [])]; assert slugs[0] == 'chien-tranh-tien-te-tap-2', 'Lỗi: Không ưu tiên Tập 2!'"

# 3. Tìm kiếm đích danh Tập 3: Tập 3 phải đứng vị trí 0
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'chien tranh tien te tap 3'}); slugs = [x['product_slug'] for x in r.json().get('results', [])]; assert slugs[0] == 'chien-tranh-tien-te-tap-3', 'Lỗi: Không ưu tiên Tập 3!'"
```

### 5.2 Kiểm chứng Zero-Score Leakage (alpha = 0.0 & alpha = 1.0)
```bash
# 1. Kiểm tra alpha = 0.0: Tuyệt đối không có mục nào mang điểm score <= 0.0
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'thanh cong trong cuoc song', 'alpha': 0.0}); items = r.json().get('results', []); assert all(x['score'] > 0.0 for x in items), 'Rò rỉ điểm 0.0!'; print('alpha=0.0 sạch 100%')"

# 2. Kiểm tra alpha = 1.0: Tuyệt đối không có mục nào mang điểm score <= 0.0
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'thanh cong trong cuoc song', 'alpha': 1.0}); items = r.json().get('results', []); assert all(x['score'] > 0.0 for x in items), 'Rò rỉ điểm 0.0!'; print('alpha=1.0 sạch 100%')"

# 3. Kiểm tra câu truy vấn không khớp: Phải trả về rỗng [] và total = 0
python -c "import requests; r = requests.post('http://localhost:8000/aurabook/search/hybrid', json={'query': 'Machine Learning', 'alpha': 0.0}); data = r.json(); assert data.get('total') == 0 and len(data.get('results', [])) == 0, 'Lỗi rò rỉ kết quả!'; print('Clean empty result OK')"
```

### 5.3 Chạy bộ kiểm thử Adversarial Test Suite
```bash
python tests/test_challenger_m3_2_adversarial.py
```
*Điều kiện nghiệm thu:* Toàn bộ các test cases mục `5. SERIES DISAMBIGUATION & RANKING CONSISTENCY` và `1. ALPHA PARAMETER BOUNDARY VERIFICATION` đạt 100% PASS.
