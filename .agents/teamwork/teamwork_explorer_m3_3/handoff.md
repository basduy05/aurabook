# Handoff Report: Milestone 3 — AI Tìm Kiếm & Unified Catalog Semantic Retrieval
**Agent**: `teamwork_explorer_m3_3` (Test Analysis & Quality Gates)  
**Date**: 2026-10-31  
**Scope**: Automated Evaluation Suite analysis, 11 `ai_search` test cases + cross-feature tests, runtime evaluation, anti-hallucination gap identification, and Worker acceptance criteria.

---

## 1. Observation

### 1.1 Automated Evaluation Suite Execution Status
Executing the automated evaluation runner for the `ai_search` subsystem:
```bash
python tests/ai_evaluation_suite.py --feature ai_search
```
**Direct Command Output**:
```
================================================================================
AURABOOK AI EVALUATION SUITE — RUNNING 11 TEST CASES
Timestamp: 2026-10-31 22:52:33
================================================================================
[01/11] TC-T1-06 - Accented Keyword Search for Đắc Nhân Tâm   ... PASS (130ms)
[02/11] TC-T1-07 - Unaccented Diacritics Normalization Search ... PASS (94ms)
[03/11] TC-T1-08 - Author Entity Search: Yuval Noah Harari    ... PASS (79ms)
[04/11] TC-T1-09 - Backend Hybrid Search RRF for Tư Duy Nhanh ... PASS (73ms)
[05/11] TC-T1-10 - Conceptual Semantic Search for Stoicism /  ... PASS (77ms)
[06/11] TC-T2-06 - Empty Search Query Boundary                ... PASS (30ms)
[07/11] TC-T2-07 - Whitespace-Only Search Query Boundary      ... PASS (42ms)
[08/11] TC-T2-08 - Anti-Hallucination: Out-of-Catalog Book Se ... PASS (105ms)
[09/11] TC-T2-09 - Adversarial SQL & XSS Injection in Search  ... PASS (89ms)
[10/11] TC-T2-10 - Multi-Volume Series Disambiguation: Chiến  ... PASS (74ms)
[11/11] TC-T2-20 - Backend Search Query Overload Resilience   ... PASS (97ms)

================================================================================
EVALUATION SUMMARY
================================================================================
Total Tests Run : 11
Passed          : 11 (100.0%)
Failed / Pending: 0
Total Duration  : 0.90s
--------------------------------------------------------------------------------
Tier Breakdown:
  * Tier 1: Feature Coverage           : 5/5 passed (100.0%)
  * Tier 2: Boundary & Corner Cases    : 6/6 passed (100.0%)
--------------------------------------------------------------------------------
Feature Subsystem Breakdown:
  * ai_search                : 11/11 passed (100.0%)
================================================================================
```

Executing cross-feature search tests:
```bash
python tests/ai_evaluation_suite.py --id TC-T3-01  # PASS (105ms)
python tests/ai_evaluation_suite.py --id TC-T3-02  # PASS (115ms)
```

### 1.2 Target Search Test Cases Specification & Trace Matrix
Inspecting `tests/test_dataset_ground_truth.json` reveals the following complete trace for each test case targeting search:

| ID | Tier | Name | Target Endpoint | Method | Query / Payload | Expected Status | Required Keywords | Forbidden Keywords / First Result | Schema Keys | Evaluation Check |
|---|---|---|---|---|---|---|---|---|---|---|
| **TC-T1-06** | Tier 1 | Accented Keyword Search for Đắc Nhân Tâm | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=đắc nhân tâm` | 200 | `["dac-nhan-tam"]` | Forbidden: `[]` | `["products", "isGraphRAG"]` | `min_results_count: 1` |
| **TC-T1-07** | Tier 1 | Unaccented Diacritics Normalization Search for Đắc Nhân Tâm | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=dac nhan tam` | 200 | `["dac-nhan-tam"]` | Forbidden 1st: `tu-duy-nhanh-va-cham` | `["products"]` | `min_results_count: 1` |
| **TC-T1-08** | Tier 1 | Author Entity Search: Yuval Noah Harari | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=Yuval Noah Harari` | 200 | `["sapiens-luoc-su-loai-nguoi"]` | Forbidden: `[]` | `["products"]` | `min_results_count: 1` |
| **TC-T1-09** | Tier 1 | Backend Hybrid Search RRF for Tư Duy Nhanh Và Chậm | `http://localhost:8000/aurabook/search/hybrid` | POST | `{"query": "Tu Duy Nhanh Va Cham", "limit": 10}` | 200 | `[]` | Forbidden: `["Internal Server Error"]` | `["query", "total", "results"]` | Valid JSON array |
| **TC-T1-10** | Tier 1 | Conceptual Semantic Search for Stoicism / Khắc Kỷ | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=phong cách sống khắc kỷ` | 200 | `["chu-nghia-khac-ky"]` | Forbidden: `[]` | `["products"]` | `min_results_count: 1` |
| **TC-T2-06** | Tier 2 | Empty Search Query Boundary | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=` | 200 | `[]` | Forbidden: `["error"]` | `["products", "totalCount"]` | `expected_count: 0` |
| **TC-T2-07** | Tier 2 | Whitespace-Only Search Query Boundary | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=     ` | 200 | `[]` | Forbidden: `[]` | `["products", "totalCount"]` | `expected_count: 0` |
| **TC-T2-08** | Tier 2 | Anti-Hallucination: Out-of-Catalog Book Search | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=Harry Potter và Hòn đá Phù thủy` | 200 | `[]` | Forbidden: None | `["products"]` | Out-of-catalog anti-hallucination |
| **TC-T2-09** | Tier 2 | Adversarial SQL & XSS Injection in Search | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=' OR '1'='1' -- <script>alert('xss')</script>` | 200 | `[]` | Forbidden: `["syntax error", "pg_catalog", "SQLSTATE"]` | `["products"]` | Injection defense |
| **TC-T2-10** | Tier 2 | Multi-Volume Series Disambiguation: Chiến Tranh Tiền Tệ | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=Chiến tranh tiền tệ` | 200 | `["chien-tranh-tien-te"]` | Forbidden: None | `["products"]` | `min_results_count: 1` |
| **TC-T2-20** | Tier 2 | Backend Search Query Overload Resilience | `http://localhost:8000/aurabook/search/hybrid` | POST | `{"query": "sach sach sach...", "limit": 50}` | 200 | `[]` | Forbidden: `["Traceback"]` | `["query", "results"]` | Overload resilience |
| **TC-T3-01** | Tier 3 | Search-to-Read Transition: Bốn Thỏa Ước | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=Bốn Thỏa Ước` | 200 | `["bon-thoa-uoc"]` | Forbidden: None | `["products"]` | Slug resolution |
| **TC-T3-02** | Tier 3 | Search-to-Read Transition: Đắc Nhân Tâm Unaccented | `http://localhost:3000/api/ai/graphrag/search` | GET | `query=dac nhan tam` | 200 | `["dac-nhan-tam"]` | Forbidden: None | `["products"]` | Diacritics slug resolution |

### 1.3 Discovered Critical Defect: Backend Hybrid Search Anti-Hallucination Failure
When sending an out-of-catalog query ("Harry Potter") directly to backend Hybrid Search:
```bash
POST http://localhost:8000/aurabook/search/hybrid
Body: {"query": "Harry Potter", "limit": 5}
```
**Actual Response**:
```json
{
  "query": "Harry Potter",
  "total": 11,
  "results": [
    { "product_id": "3", "product_slug": "sapiens-luoc-su-loai-nguoi", "title": "Sapiens: Lược Sử Loài Người", "score": 0.01639 },
    { "product_id": "1", "product_slug": "dac-nhan-tam", "title": "Đắc Nhân Tâm", "score": 0.01613 },
    { "product_id": "8", "product_slug": "cay-cam-ngot-cua-toi", "title": "Cây Cam Ngọt Của Tôi", "score": 0.01587 },
    { "product_id": "6", "product_slug": "bi-mat-cua-mot-tri-nho-sieu-pham", "title": "Bí Mật Của Một Trí Nhớ Siêu Phàm", "score": 0.01562 },
    { "product_id": "10", "product_slug": "chien-tranh-tien-te-tap-2", "title": "Chiến Tranh Tiền Tệ - Tập 2", "score": 0.01538 }
  ]
}
```
**Direct Code Observation**: In `backend/aurabook_apps/ai_search/search.py` lines 135-150:
```python
# Lọc khoảng cách tối đa 0.85 (cosine similarity >= 0.15)
if pid not in seen_vec_pids and distance <= 0.85:
    seen_vec_pids.add(pid)
    vector_results.append(...)
```
And lines 188-197:
```python
all_product_ids = set(ft_rank) | set(vec_rank)
for pid in all_product_ids:
    score = 0.0
    if pid in ft_rank:
        score += 1.0 / (RRF_K + ft_rank[pid])
    if pid in vec_rank:
        score += 1.0 / (RRF_K + vec_rank[pid])
    rrf_scores[pid] = score
```
Because `distance <= 0.85` is overly permissive in 768-dimensional embedding space, even unrelated queries match random book chunks with distance ~0.78-0.84. When `fulltext_results` has 0 hits, pure vector rank gives every book an artificial RRF score of `1/(60 + rank)` = `0.01639`, returning up to 11 books for completely unrelated or out-of-catalog search terms.

### 1.4 Discovered Runner Blind Spot in `ai_evaluation_suite.py`
In `tests/ai_evaluation_suite.py` lines 304-321:
```python
# 8. Grounding Check: Minimum Results Count
min_results = exp_spec.get("min_results_count")
if min_results is not None and isinstance(resp_data, dict):
    actual_count = len(products_list)
    if "totalCount" in resp_data:
        actual_count = max(actual_count, resp_data["totalCount"])
    count_ok = actual_count >= min_results
...
```
There is **no check** for `expected_count: 0` or `max_results_count: 0`. For `TC-T2-08` ("Harry Potter"), `min_results_count` is `None` and `forbidden_keywords` is `None`. Therefore, if `api/ai/graphrag/search` or `/api/search/ai` returned 11 hallucinated books, `TC-T2-08` would still silently pass.

---

## 2. Logic Chain

1. **Premise 1**: All 11 `ai_search` tests and 2 cross-feature tests in `ai_evaluation_suite.py` pass currently (100% pass rate) because `api/ai/graphrag/search` relies on in-memory `graphRAGStore.searchProductsByContext`, which contains hardcoded diacritics stripping (M1 fix) and an `isOutOfCatalog` regex guardrail.
2. **Premise 2**: Feature F7 (`PROJECT.md` line 44) specifies wiring Storefront `search/page.tsx` and `search-bar.tsx` to `/api/search/ai`, which forwards requests to backend `/aurabook/search/hybrid` (`hybrid_search_rrf`).
3. **Premise 3**: In `backend/aurabook_apps/ai_search/search.py`, vector distance threshold is set to `0.85` without requiring a minimum fulltext score or a minimum RRF score. When querying out-of-catalog items ("Harry Potter"), fulltext returns 0 rows, but vector search returns 50 chunks, causing RRF to rank and return 11 books.
4. **Premise 4**: If Worker M3 connects Storefront search to Backend Hybrid Search without patching `backend/aurabook_apps/ai_search/search.py`, out-of-catalog searches in Storefront will return 11 irrelevant books, violating Acceptance Criterion: *"loại bỏ hiện tượng trả lời thiếu căn cứ hoặc sinh thông tin giả mạo (hallucination)"* (`ORIGINAL_REQUEST.md` line 34).
5. **Deduction**: Milestone 3 Worker MUST implement a dual anti-hallucination guardrail:
   - On the Backend: Enforce strict cosine distance filtering (e.g. `distance < 0.65` or cosine similarity >= 0.35) and discard pure vector matches when `fulltext` is empty and vector similarity is weak (RRF score threshold < 0.022).
   - On the Frontend: When backend returns `total: 0`, render clean empty state or honest recommendation with `hasDirectMatch: false`, never hallucinating book presences.
   - On the Test Runner: Add `expected_count: 0` assertion in `tests/ai_evaluation_suite.py` to turn `TC-T2-08` into an active, regression-proof quality gate.

---

## 3. Caveats

1. **Live Running Services**: Tests were executed against live services: Next.js frontend on port 3000 and Django backend on port 8000. If port 8000 is stopped or Celery is unavailable, backend hybrid search gracefully falls back to direct database table search (`product_product`).
2. **Embedding Model Dependency**: Backend vector embedding relies on `get_text_embedding` in `backend/aurabook_apps/ai_search/gemini_client.py`. If Gemini API key is missing or offline, it falls back to zero-vectors or fulltext search only.
3. **Read-Only Constraint**: As an explorer, no modifications were made to `tests/ai_evaluation_suite.py` or `backend/aurabook_apps/ai_search/search.py`. Recommended patches are provided in the verification blueprint below.

---

## 4. Conclusion

The Automated Evaluation Suite for `ai_search` currently passes with 100% (11/11 tests pass). However, this pass rate masks two critical engineering risks:
1. **Silent Test Gap**: `TC-T2-08` does not verify `expected_count == 0`, allowing hallucinated search results to pass unnoticed.
2. **Backend Hallucination Defect**: `backend/aurabook_apps/ai_search/search.py` (`hybrid_search_rrf`) returns 11 books for out-of-catalog query "Harry Potter" due to loose vector distance capping (`<= 0.85`) and ungrounded RRF fusion.
3. **Integration Disconnect**: Storefront `search/page.tsx` and `search-bar.tsx` are not yet unified with `/api/search/ai` and Backend Hybrid Search (Feature F7).

---

## 5. Verification Method & Quality Gates for Milestone 3 Worker

The Worker assigned to Milestone 3 must satisfy the following 5 strict Quality Gates:

### Quality Gate 1: Zero Regression on Core Suite (11/11 Pass)
Execute:
```bash
python tests/ai_evaluation_suite.py --feature ai_search
```
- **Acceptance Criteria**:
  - `TC-T1-06`, `TC-T1-07`, `TC-T1-08`, `TC-T1-09`, `TC-T1-10`: 100% PASS
  - `TC-T2-06`, `TC-T2-07`, `TC-T2-08`, `TC-T2-09`, `TC-T2-10`, `TC-T2-20`: 100% PASS
  - All latencies <= 5000ms.

### Quality Gate 2: Cross-Feature Search-to-Read Verification
Execute:
```bash
python tests/ai_evaluation_suite.py --id TC-T3-01
python tests/ai_evaluation_suite.py --id TC-T3-02
```
- **Acceptance Criteria**:
  - `TC-T3-01` resolves query `"Bốn Thỏa Ước"` to `slug: "bon-thoa-uoc"`.
  - `TC-T3-02` resolves unaccented query `"dac nhan tam"` to `slug: "dac-nhan-tam"`.

### Quality Gate 3: Backend Anti-Hallucination Hardening (Feature F8)
Execute:
```bash
python -c "
import urllib.request, json
req = urllib.request.Request(
    'http://localhost:8000/aurabook/search/hybrid',
    data=json.dumps({'query': 'Harry Potter', 'limit': 5}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())
    print('Total results for Harry Potter:', data.get('total'))
    assert data.get('total') == 0, 'FAIL: Hallucinated books returned for Harry Potter!'
"
```
- **Acceptance Criteria**:
  - Querying `"Harry Potter"` returns `{"total": 0, "results": []}`.
  - Querying `"sách dạy nấu ăn"` returns `{"total": 0, "results": []}`.
  - Querying legitimate books (`"đắc nhân tâm"`, `"dac nhan tam"`, `"Tư Duy Nhanh Và Chậm"`) returns correct books with `score >= 0.025`.

### Quality Gate 4: Unified Storefront Search (`/api/search/ai` & `search/page.tsx`)
Execute:
```bash
python -c "
import urllib.request, json
for q in ['dac nhan tam', 'Harry Potter', 'phát triển bản thân']:
    req = urllib.request.Request(
        'http://localhost:3000/api/search/ai',
        data=json.dumps({'query': q, 'limit': 5}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
        print(f'{q} -> Total: {data.get(\"total\")}, Source: {data.get(\"source\")}')
"
```
- **Acceptance Criteria**:
  - `"dac nhan tam"`: returns `dac-nhan-tam` with `total >= 1`.
  - `"Harry Potter"`: returns `total: 0`, `results: []`.
  - `"phát triển bản thân"`: returns self-development books in catalog (`total >= 1`).

### Quality Gate 5: Evaluation Runner Hardening
In `tests/ai_evaluation_suite.py` line 304, add support for `expected_count`:
```python
# Check expected exact count if specified (e.g. expected_count: 0 for out-of-catalog/empty)
expected_count = exp_spec.get("expected_count")
if expected_count is not None and isinstance(resp_data, dict):
    actual_count = len(products_list)
    count_match = actual_count == expected_count
    checks.append({
        "dimension": "grounding",
        "name": f"Exact Expected Count ({expected_count})",
        "passed": count_match,
        "actual": actual_count,
        "expected": expected_count,
    })
    if not count_match:
        is_passed = False
        failure_reasons.append(f"Result count mismatch: expected {expected_count}, got {actual_count}")
```
And in `tests/test_dataset_ground_truth.json` for `TC-T2-08`:
Add `"expected_count": 0` and `"forbidden_keywords": ["sapiens", "dac-nhan-tam", "tri-tue-do-thai"]`.
Ensure `python tests/ai_evaluation_suite.py --id TC-T2-08` passes cleanly under this hardened assertion.
