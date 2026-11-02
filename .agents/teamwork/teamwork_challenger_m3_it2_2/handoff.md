# Empirical Adversarial Challenge Handoff Report — Milestone 3 Remediation

**Agent**: `teamwork_challenger_m3_it2_2`  
**Role**: critic, specialist  
**Working Directory**: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m3_it2_2\`  
**Timestamp**: 2026-10-31T17:33:30Z  
**Target Milestone**: Milestone 3 Remediation (AI Tìm Kiếm & Unified Catalog Semantic Retrieval)  
**Explicit Verdict**: **`APPROVE`**  

---

## 1. Observation

All tests were executed directly against live services:
- Django Backend on `http://localhost:8000/aurabook/search/hybrid` (PostgreSQL `aurabook_db`, pgvector 768-d embeddings, 1,597 chunks)
- Next.js Frontend on `http://localhost:3000/api/search/ai` and `http://localhost:3000/api/ai/graphrag/search`

### Tool Commands & Verbatim Execution Results:

1. **79-Test Adversarial Test Suite (`test_challenger_m3_2_adversarial.py`)**:
   - Command: `python tests/test_challenger_m3_2_adversarial.py`
   - Output:
     ```
     ================================================================================
     FINAL EMPIRICAL RESULTS SUMMARY
     ================================================================================
     Total Tests Executed: 79
     Passed              : 79 (100.0%)
     Failed              : 0
     ================================================================================
     ```
   - Covers: Alpha parameter boundaries (0.0, 0.5, 1.0, -1.0, 2.0, 'invalid', None), Limit boundaries (0, 1, 100, -5, 'invalid'), SQLi / XSS injection sanitization, Long query stress (2,200 to 5,100 chars), Series disambiguation (Tập 1 priority), Concurrency (30 concurrent), and Anti-hallucination.

2. **Standard Evaluation Test Suite (`ai_evaluation_suite.py`)**:
   - Command: `python tests/ai_evaluation_suite.py --feature ai_search`
   - Output:
     ```
     Total Tests Run : 11
     Passed          : 11 (100.0%)
     Failed / Pending: 0
     Total Duration  : 0.92s
     * TC-T1-06 (Accented Keyword Search): PASS
     * TC-T1-07 (Unaccented Diacritics Normalization): PASS
     * TC-T1-08 (Author Entity Search): PASS
     * TC-T1-09 (Backend Hybrid Search RRF): PASS
     * TC-T1-10 (Conceptual Semantic Search): PASS
     * TC-T2-06 (Empty Search Query Boundary): PASS
     * TC-T2-07 (Whitespace-Only Search Query Boundary): PASS
     * TC-T2-08 (Anti-Hallucination: Out-of-Catalog Book Search): PASS
     * TC-T2-09 (Adversarial SQL & XSS Injection in Search): PASS
     * TC-T2-10 (Multi-Volume Series Disambiguation: Chiến Tranh Tiền Tệ): PASS
     * TC-T2-20 (Backend Search Query Overload Resilience): PASS
     ```
   - Command: `python tests/ai_evaluation_suite.py --id TC-T3-01` -> PASS (188ms)
   - Command: `python tests/ai_evaluation_suite.py --id TC-T3-02` -> PASS (211ms)

3. **Dedicated Deep Stress & Parameter Boundary Suite (`test_challenger_m3_it2_deep_stress.py`)**:
   - Command: `python tests/test_challenger_m3_it2_deep_stress.py`
   - Output:
     ```
     ================================================================================
     DEEP STRESS HARNESS SUMMARY
     ================================================================================
     Total Tests Executed: 65
     Passed              : 65 (100.0%)
     Failed              : 0
     ================================================================================
     ```
   - **Alpha Extremes & Zero Score Leakage Verification**:
     * `alpha = 0.0` (pure fulltext): Tested across 10 queries. All returned results have `score > 0.0`. Zero items with `score <= 0.0` returned (`zero_score_count = 0`). Out-of-catalog entities return 0 results.
     * `alpha = 1.0` (pure vector): Tested across 10 queries. All returned results have `score > 0.0`. Zero items with `score <= 0.0` returned (`zero_score_count = 0`).
     * `alpha = -5`, `alpha = -100.5`: Safely clamped to 0.0, status 200, valid results, zero 500 errors.
     * `alpha = 10`, `alpha = 999.99`: Safely clamped to 1.0, status 200, valid results, zero 500 errors.
     * `alpha = "invalid"`, `alpha = "not_a_number"`, `alpha = ""`, `alpha = None`: Safely falls back to default 0.5 without exception.
   - **Multi-Volume Series Disambiguation**:
     * Tested generic queries: `"Chiến tranh tiền tệ"`, `"chien tranh tien te"`, `"CHIẾN TRANH TIỀN TỆ"`, `"Sách Chiến Tranh Tiền Tệ"`, `"cuốn chiến tranh tiền tệ"`, `"Tìm sách chiến tranh tiền tệ"`.
     * Verbatim result: In 100% of cases, `slugs[0]` is `"chien-tranh-tien-te-tap-1"` (score `0.01654`), followed by `chien-tranh-tien-te-tap-2` (score `0.01649`), then `chien-tranh-tien-te-tap-3` (score `0.01644`). Volume 3 was NEVER ranked first.
     * Tested specific volume queries: `"Chiến tranh tiền tệ tập 1"`, `"Chiến tranh tiền tệ tập 2"`, `"Chiến tranh tiền tệ tập 3"` and their unaccented forms -> accurately returned the exact requested volume at rank 0.
   - **High Concurrency Stress (50 Concurrent Requests)**:
     * Backend (`/aurabook/search/hybrid`): 50 simultaneous requests across diverse queries and alpha settings -> `success = 50/50 (100%)`, `total_time = 651.6ms`, `avg_lat = 190.0ms`, `max_lat = 305.0ms`.
     * Frontend (`/api/search/ai`): 50 simultaneous requests -> `success = 50/50 (100%)`, `total_time = 1387.5ms`, `avg_lat = 414.1ms`, `max_lat = 592.1ms`.
     * Zero crashed connections, zero dropped requests, zero timeout errors.
   - **Catalog Retrievability**:
     * All 13 catalog books independently queried and verified to return the exact book at rank 0.

4. **Frontend Unit & Adversarial Tests**:
   - Command: `cd frontend; pnpm test:run src/lib/graphrag/graph-store.test.ts src/lib/graphrag/graph-store.adversarial.test.ts`
   - Output: `2 passed (2), 138 passed (138) in 3.36s`

---

## 2. Logic Chain

1. **Derivation of Mathematical Integrity for Alpha Boundaries & Score Leakage**:
   - In `backend/aurabook_apps/ai_search/search.py` lines 241-247:
     ```python
     if alpha == 0.0:
         all_product_ids = set(ft_rank)
     elif alpha == 1.0:
         all_product_ids = set(vec_rank)
     else:
         all_product_ids = set(ft_rank) | set(vec_rank)
     ```
     When `alpha = 0.0`, only candidate product IDs present in `ft_rank` are evaluated. Items not in fulltext cannot enter the candidate pool.
     Similarly, when `alpha = 1.0`, only product IDs in `vec_rank` are evaluated.
   - In `search.py` lines 252-254 & 272-274:
     ```python
     score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)
     if score > 0.0 and round(score, 5) > 0.0:
         rrf_scores[pid] = score
     ...
     if rounded_score <= 0.0:
         continue
     ```
     This two-phase filtering mathematically ensures that no item with `score <= 0.0` or `round(score, 5) <= 0.0` can ever be included in the results. Empirically verified across 10 query vectors for both `alpha=0.0` and `alpha=1.0`: `zero_score_count == 0` in 100% of tests.
   - Clamping logic in `search.py` line 95 (`alpha = max(0.0, min(1.0, alpha))`), `views.py` line 31, and `frontend/src/app/api/search/ai/route.ts` line 30 safely absorbs negative values (-5 -> 0.0), excessive values (10 -> 1.0), and invalid non-numeric inputs (fallback to 0.5) without crashing.

2. **Derivation of Multi-Volume Chronological Ranking**:
   - In `search.py` lines 313-323:
     When generic series queries are detected (`extract_query_volume` is None), items sharing the same series base are sorted by volume number ascending (`_volume`: 1 -> 2 -> 3).
     A monotonic bonus (`bonus = 0.00005 * (n - idx)`) is added to ensure Volume 1 (`n - idx = 3`) receives a strictly higher score than Volume 2 (`n - idx = 2`) and Volume 3 (`n - idx = 1`).
     Empirically verified: Queries `"Chiến tranh tiền tệ"`, `"chien tranh tien te"`, `"CHIẾN TRANH TIỀN TỆ"`, `"Sách Chiến Tranh Tiền Tệ"` all returned Volume 1 as the first result (`slugs[0] == 'chien-tranh-tien-te-tap-1'`).

3. **Derivation of Concurrency Robustness**:
   - Connection pool management in PostgreSQL and the async fetch architecture in Next.js handled 50 concurrent requests simultaneously on both backend and frontend.
   - The test recorded 0 errors, 0 deadlocks, and response latencies well below the 5,000ms threshold (BE avg 190ms, FE avg 414ms).

4. **Derivation of Zero-Hallucination & Catalog Conformance**:
   - In `search.py` line 30, `MAX_AUTHENTIC_VECTOR_DISTANCE = 0.36` strictly eliminates vector matches for cross-domain or non-catalog queries (e.g., `"Harry Potter"` has distance 0.579, `"Bố già"` has distance 0.622, `"Giá vàng"` has distance 0.545).
   - Fulltext search is restricted to catalog metadata (`product_product.name`, `slug`, `description_plaintext`), preventing substring collisions from internal chunk text.
   - 100% of out-of-catalog queries returned empty results (`total: 0, results: []`).

---

## 3. Caveats

- **Vietnamese Query Prefixes**: While standard conversational prefixes like `"sách"`, `"cuốn"`, `"quyển"`, `"tìm"`, `"về"` are stripped by `NOISE_WORDS`, the collective noun `"bộ"` (e.g., `"bộ sách chiến tranh tiền tệ"`) is not included in `NOISE_WORDS`. Thus, `"bộ sách ..."` does not match the product title directly. All standard queries without `"bộ"` (`"chiến tranh tiền tệ"`, `"sách chiến tranh tiền tệ"`, `"cuốn chiến tranh tiền tệ"`) match and rank Tập 1 first. This does not violate any project contract or acceptance criterion.
- **E2E Voice Integration**: LiveKit Voice Agent end-to-end integration is slated for Milestone 4 and Milestone 5. Search subsystem endpoints themselves are fully stable and responsive.

---

## 4. Conclusion

The search subsystem remediation implemented by `teamwork_worker_m3_it2` satisfies all specifications in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_READY.md`.

Empirical findings confirm:
1. **Zero Hallucination**: Out-of-catalog entities and malicious injection strings are completely filtered out (0 results).
2. **Zero Score Leakage**: Boundary alpha values (`alpha=0.0`, `alpha=1.0`) never return 0.0 or negative score items.
3. **Parameter Clamping**: Out-of-bounds (`alpha=-5`, `alpha=10`) and invalid non-numeric inputs are clamped and safely handled without 500 errors.
4. **Series Disambiguation**: Generic queries for *Chiến Tranh Tiền Tệ* consistently rank Tập 1 first.
5. **Concurrency Stability**: Passed 50 simultaneous concurrent requests with 100% success rate on both backend and frontend.

**Explicit Verdict**: **`APPROVE`**

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Run 79-Test Adversarial Suite**:
   ```powershell
   cd C:\Users\basduy05\Downloads\aurabook
   python tests/test_challenger_m3_2_adversarial.py
   ```
   *Expected*: Total: 79, Passed: 79 (100.0%), Failed: 0.

2. **Run Standard Evaluation AI Search Suite**:
   ```powershell
   python tests/ai_evaluation_suite.py --feature ai_search
   python tests/ai_evaluation_suite.py --id TC-T3-01
   python tests/ai_evaluation_suite.py --id TC-T3-02
   ```
   *Expected*: All 13 tests PASS.

3. **Run 65-Test Deep Stress & Boundary Suite**:
   ```powershell
   python tests/test_challenger_m3_it2_deep_stress.py
   ```
   *Expected*: Total: 65, Passed: 65 (100.0%), Failed: 0.

4. **Run Frontend Vitest Suite**:
   ```powershell
   cd frontend
   pnpm test:run src/lib/graphrag/graph-store.test.ts src/lib/graphrag/graph-store.adversarial.test.ts
   ```
   *Expected*: 2 test files passed, 138 tests passed (100.0%).
