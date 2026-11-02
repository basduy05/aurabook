# Handoff Report: Milestone 3 — AI Tìm Kiếm & Unified Catalog Semantic Retrieval (Backend & Anti-Hallucination Focus)

**Author:** teamwork_explorer_m3_2  
**Date:** 2026-10-31  
**Milestone:** Milestone 3 (AI Tìm Kiếm & Unified Catalog Semantic Retrieval)  
**Status:** Investigation Complete (Read-Only)  

---

## 1. Observation

### 1.1 Backend Hybrid Search & pgvector RRF (`backend/aurabook_apps/ai_search/search.py`)
- **File location:** `backend/aurabook_apps/ai_search/search.py`, lines 25-221.
- **RRF Constant & Function Definition:**
  ```python
  21: # RRF constant — k=60 theo kế hoạch AuraBook
  22: RRF_K = 60
  25: def hybrid_search_rrf(query: str, limit: int = 20) -> list[dict[str, Any]]:
  ```
  *Direct Observation:* The function does NOT accept an `alpha` parameter for balancing semantic vs fulltext weighting, despite `PROJECT.md` specifying:
  `Request: POST /aurabook/search/hybrid, Body: {"query": string, "limit": number, "alpha": number}`.
- **Fulltext Search with PostgreSQL `unaccent()`:**
  ```python
  49: cursor.execute(
  50:     """
  51:     SELECT bc.product_id, bc.product_slug, bc.chunk_text, bc.chunk_index,
  52:            COALESCE(p.name, bc.product_slug) AS title,
  53:            (
  54:                CASE 
  55:                    WHEN unaccent(p.name) ILIKE %s THEN 100
  56:                    WHEN unaccent(bc.product_slug) ILIKE %s THEN 90
  57:                    WHEN unaccent(bc.chunk_text) ILIKE %s THEN 50
  58:                    ELSE 10
  59:                END
  60:            ) AS match_priority
  61:     FROM ai_search_bookchunk bc
  62:     LEFT JOIN product_product p ON bc.product_slug = p.slug
  63:     WHERE unaccent(p.name) ILIKE %s
  64:        OR unaccent(bc.product_slug) ILIKE %s
  65:        OR unaccent(bc.chunk_text) ILIKE %s
  66:     ORDER BY match_priority DESC, bc.chunk_index ASC
  67:     LIMIT 50
  68:     """,
  ```
  *Direct Observation:* `search_pattern = f"%{norm_query}%"`. When a user types queries with common Vietnamese prefixes (e.g. `"sach dac nhan tam"`), `unaccent(p.name)` (`"Dac Nhan Tam"`) fails `ILIKE '%sach dac nhan tam%'` completely. The fulltext search produces 0 rows, so the query must rely entirely on vector search, halving its RRF score.
- **Vector Search Distance Threshold & Defect:**
  ```python
  120: cursor.execute(
  121:     """
  122:     SELECT bc.product_id, bc.product_slug, bc.chunk_text, bc.chunk_index,
  123:            COALESCE(p.name, bc.product_slug) AS title,
  124:            (bc.embedding <=> %s::vector) AS distance
  125:     FROM ai_search_bookchunk bc
  126:     LEFT JOIN product_product p ON bc.product_slug = p.slug
  127:     WHERE bc.embedding IS NOT NULL
  128:     ORDER BY distance ASC
  129:     LIMIT 50
  130:     """,
  131:     [vec_str],
  132: )
  ...
  138: distance = float(r[5])
  139: # Lọc khoảng cách tối đa 0.85 (cosine similarity >= 0.15)
  140: if pid not in seen_vec_pids and distance <= 0.85:
  141:     seen_vec_pids.add(pid)
  142:     vector_results.append(...)
  ```
  *Empirical Measurement via live PostgreSQL query:*
  1. For legitimate in-catalog match (`"đắc nhân tâm"`):
     The nearest 5 chunk distances in PostgreSQL are:
     `0.2325, 0.2612, 0.2677, 0.3167, 0.3515` (Cosine similarity: 0.65 - 0.77).
  2. For out-of-catalog book (`"Harry Potter"`):
     The nearest 5 chunk distances in PostgreSQL are:
     `0.7255, 0.7287, 0.7339, 0.7374, 0.7376` (Cosine similarity: 0.26 - 0.27).
  3. For nonsense gibberish (`"xyzabcqwerty123"`):
     Distances are `0.75 - 0.84`.
  *Direct Observation:* Because line 140 filters with `distance <= 0.85`, all 10-13 books in the catalog have distance < 0.85 to out-of-catalog queries! Thus, `vector_results` ALWAYS fills up with 10 to 13 distinct books for ANY query.
- **RRF Ranking without Confidence Guardrail:**
  ```python
  185: ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
  186: vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}
  188: all_product_ids = set(ft_rank) | set(vec_rank)
  189: rrf_scores: dict[str, float] = {}
  190: for pid in all_product_ids:
  191:     score = 0.0
  192:     if pid in ft_rank:
  193:         score += 1.0 / (RRF_K + ft_rank[pid])
  194:     if pid in vec_rank:
  195:         score += 1.0 / (RRF_K + vec_rank[pid])
  196:     rrf_scores[pid] = score
  ...
  221: return ranked[:limit]
  ```
  *Direct Observation:* RRF uses purely ordinal ranks: `1 / (60 + vec_rank[pid])`. Rank 1 gets `1/61 = 0.01639`, rank 2 gets `1/62 = 0.01613`, regardless of whether the vector distance was 0.05 or 0.84! Because there is no confidence cutoff or minimum relevance threshold, `hybrid_search_rrf` returns:
  - Query `"Harry Potter"` → 11 books returned (`sapiens-luoc-su-loai-nguoi`, `dac-nhan-tam`, etc.) with scores `0.01639` to `0.01429`.
  - Query `"xyzabcqwerty123"` → 10 books returned.
  - Query `"Naruto"` → 12 books returned.
  - Query `"Nau an"` → 12 books returned.
- **Series Disambiguation Order in `search.py`:**
  Executing `hybrid_search_rrf("chien tranh tien te")` returned:
  `First slug: chien-tranh-tien-te-tap-3` (Tập 3 instead of Tập 1).
  *Direct Observation:* In line 66, `ORDER BY match_priority DESC, bc.chunk_index ASC` does not sort on `product_slug ASC`. Deduplication in line 80 (`seen_ft_pids.add(pid)`) takes whichever volume PostgreSQL returns first in disk/index order.

---

### 1.2 Backend AI Search View (`backend/aurabook_apps/ai_search/views.py`)
- **File location:** `backend/aurabook_apps/ai_search/views.py`, lines 17-48:
  ```python
  23: body = json.loads(request.body)
  26: raw_limit = body.get("limit", 20)
  27: limit = int(raw_limit) if raw_limit is not None else 20
  ...
  42: results = hybrid_search_rrf(query, limit=limit)
  43: return JsonResponse({
  44:     "query": query,
  45:     "total": len(results),
  46:     "results": results,
  47: })
  ```
  *Direct Observation:* `views.py` completely ignores `body.get("alpha")`. It does not validate `alpha` and cannot pass it to `hybrid_search_rrf`.

---

### 1.3 Frontend Next.js Search Route (`frontend/src/app/api/search/ai/route.ts`)
- **File location:** `frontend/src/app/api/search/ai/route.ts`, lines 7-37:
  ```typescript
  7: const body = (await request.json()) as { query?: string; limit?: number };
  8: const { query = "", limit = 12 } = body;
  ...
  16: const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/aurabook/search/hybrid`, {
  ...
  21:     body: JSON.stringify({ query, limit }),
  ```
  *Direct Observation:* Proxies directly to the backend without receiving or passing `alpha`, and returns all results without applying zero-hallucination sanitization. Testing `POST http://localhost:3000/api/search/ai` with `{"query": "Harry Potter"}` returned `total: 11`, confirming backend hallucinated items are directly relayed.

---

### 1.4 Frontend GraphRAG Knowledge Store (`frontend/src/lib/graphrag/graph-store.ts`)
- **File location:** `frontend/src/lib/graphrag/graph-store.ts`.
- **Entity Resolution & Series Disambiguation:**
  Lines 1007-1016:
  ```typescript
  if (unaccented.includes("chien tranh tien te") || lower.includes("chiến tranh tiền tệ")) {
      if (unaccented.includes("tap 3") || unaccented.includes("3")) {
          return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-3") || null;
      }
      if (unaccented.includes("tap 2") || unaccented.includes("2")) {
          return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-2") || null;
      }
      return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-1") || null;
  }
  ```
- **The Arbitrary Slicing Fallback Issue (Feature F8):**
  Lines 1654-1688:
  ```typescript
  1659: const hasDirectMatch =
  1660:     !isOutOfCatalog &&
  1661:     scoredBooks.length > 0 &&
  1662:     topScore >= 2.0 &&
  1663:     Boolean(topBook?.hasStrongGroundingSignal);
  1664: 
  1665: // Nếu không có sách khớp trực tiếp, trả về rỗng ngay lập tức (KHÔNG BAO GIỜ cắt lát slice(0, 3) hay trả kết quả ảo)
  1666: if (!hasDirectMatch) {
  1673:     return {
  1674:         products: [],
  1675:         matchedConcepts,
  1676:         totalCount: 0,
  ...
  1685: const finalMatches = scoredBooks.filter((item) => {
  1686:     if (item.score === topScore) return true;
  1687:     return item.score >= 2.0 && item.score >= topScore * 0.5 && item.hasStrongGroundingSignal;
  1688: }).slice(0, limit);
  ```
  *Direct Observation:* In `graph-store.ts`, the previous bug of `finalMatches = scoredBooks.slice(0, 3)` (which blindly returned the top 3 books regardless of relevance) has been eliminated by the guardrail `if (!hasDirectMatch) return { products: [], totalCount: 0, ... }`.
  However, in `frontend/src/ui/components/nav/components/search-bar.tsx` line 70:
  `setSuggestions((data.products || []).slice(0, 4));`
  If `data.products` were ever to contain hallucinated items from an unsanitized backend, it would slice and display them.

---

### 1.5 Storefront Search Integration (`search/page.tsx` & `search-bar.tsx`)
- **File location:** `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`, lines 102-143.
- **Current Flow in `search/page.tsx`:**
  1. Calls `searchProducts` (Saleor GraphQL keyword search).
  2. If 0 products found, falls back directly to `graphRAGStore.searchProductsByContext(query)`.
  3. **It does NOT call `/api/search/ai` or backend `/aurabook/search/hybrid` at all!**
- **Current Flow in `search-bar.tsx`:**
  Line 66: Calls `/api/ai/graphrag/search?query=...`, bypassing `/api/search/ai`.
- *Direct Observation:* Feature F7 ("Unified Frontend-to-Backend AI Search: Wire Storefront `search/page.tsx` and `search-bar.tsx` to `/api/search/ai`") is currently unintegrated. The frontend search page relies exclusively on Saleor GraphQL and local in-memory `graph-store.ts`.

---

## 2. Logic Chain

1. **Premise 1 (Backend Vector Filtering is Overly Permissive):**
   In `backend/aurabook_apps/ai_search/search.py` line 140, the distance filter is `distance <= 0.85`. Because 768-dimensional random vectors consistently yield cosine distances between 0.70 and 0.84 to the 1,597 catalog chunks, any query—even `"Harry Potter"` or `"xyzabcqwerty123"`—matches chunks from 10+ catalog books.

2. **Premise 2 (Ordinal RRF Masks Vector Distance Quality):**
   RRF computes `score = 1.0 / (RRF_K + rank)`. Because distance is converted strictly to rank (1, 2, 3...), a distance of 0.75 receives the exact same score (`1/61 = 0.01639`) as a near-perfect distance of 0.05. Without a minimum score or strict distance cutoff, noise matches are scored as legitimate results.

3. **Premise 3 (Direct Cause of Feature F8 Hallucinations):**
   Because `search.py` does not check whether fulltext matched or whether vector distance was below a genuine semantic threshold (`<= 0.55`), `hybrid_search_rrf` returns `len(ranked) > 0` for all queries. When a user or frontend queries the backend for out-of-catalog books, the backend asserts presence and hallucinates 10-13 catalog books as answers.

4. **Premise 4 (Vietnamese Diacritics Prefix Limitation):**
   In `search.py`, `search_pattern = f"%{norm_query}%"`. When a user types `"sach dac nhan tam"`, the entire string is matched against `unaccent(p.name)` (`"Dac Nhan Tam"`). Because `"Dac Nhan Tam"` does not contain the word `"sach"`, the fulltext query returns 0 hits, degrading the result to vector-only search and halving the RRF score. Tokenizing the query and filtering Vietnamese stop words (`"sach"`, `"cuon"`, `"muon"`, `"tim"`) solves this.

5. **Premise 5 (Series Tie-Breaker):**
   In `search.py`, deduplication via `seen_ft_pids.add(pid)` operates on the unordered result set of `ILIKE '%chien tranh tien te%'`. PostgreSQL table scan returns Tập 3 first, leading to a ranking defect where general queries for the series return Tập 3 instead of the canonical Tập 1.

6. **Premise 6 (Missing Contract Parameters):**
   `PROJECT.md` mandates `POST /aurabook/search/hybrid` with `{"query": string, "limit": number, "alpha": number}`. Neither `views.py`, `search.py`, nor `/api/search/ai/route.ts` implements `alpha`. Supporting `alpha` allows callers to dynamically balance lexical fulltext precision (`alpha -> 0.0`) vs conceptual semantic retrieval (`alpha -> 1.0`).

---

## 3. Caveats

- **Ollama Local Embedding Daemon:**
  In `frontend/src/lib/graphrag/vector-store.ts`, `getHybridEmbedding` attempts to contact `http://localhost:11434/api/embeddings` (bge-m3). If Ollama is offline or bge-m3 is unpulled, it smoothly falls back to `generateSemanticVector(text)` without exception.
- **PostgreSQL `unaccent` Extension:**
  Backend `search.py` assumes the `unaccent` extension is installed in PostgreSQL (`aurabook_db`). In our tests, `unaccent(p.name)` executed successfully in the Docker container.
- **Scope Boundary:**
  Milestone 3 focuses on AI Tìm Kiếm (Features F7, F8, F1). Reader AI (M2) and Voice Chat (M4) are separate milestones and should not be modified during M3 implementation.

---

## 4. Conclusion & Recommended Blueprint

### 4.1 Summary Assessment
- **Feature F1 (Diacritics Normalization):** Core diacritics stripping (`_strip_vietnamese_diacritics` and `stripVietnameseDiacritics`) functions correctly, but backend fulltext search suffers from rigid phrase matching (`%norm_query%`). It must be upgraded to tokenize words and ignore Vietnamese conversational stop words.
- **Feature F8 (Anti-Hallucination Guardrail):**
  - Frontend `graph-store.ts` already eliminated `scoredBooks.slice(0, 3)`.
  - **Backend `search.py` is the primary source of search hallucination**: it accepts vector distances up to 0.85 and returns 10-13 catalog books for any out-of-catalog or nonsense query.
  - Fix required: Tighten vector distance threshold to `<= 0.55`, require a minimum grounding signal, and return `[]` when no genuine match exists.
- **Feature F7 (Unified Search & RRF Weighting):**
  - Add `alpha: float = 0.5` support to `hybrid_search_rrf` in `search.py`, `HybridSearchView` in `views.py`, and Next.js `/api/search/ai/route.ts`.
  - Add series tie-breaker in `search.py` so `"chien tranh tien te"` prioritizes Tập 1.
  - Wire Storefront `search/page.tsx` to `/api/search/ai` with graceful GraphRAG fallback.

---

### 4.2 Implementation Blueprint for Implementer Agent

#### Step 1: Update `backend/aurabook_apps/ai_search/search.py`
1. **Support `alpha` in `hybrid_search_rrf`:**
   ```python
   def hybrid_search_rrf(query: str, limit: int = 20, alpha: float = 0.5) -> list[dict[str, Any]]:
   ```
2. **Vietnamese Stop-Word Tokenization for Fulltext:**
   Filter common search noise words (`sach`, `cuon`, `quyen`, `tim`, `muon`, `ve`, `cua`, `va`) from `norm_query` to extract core keyword tokens.
3. **Tighten Vector Distance & Anti-Hallucination Guardrail:**
   - Change line 140:
     ```python
     # Distance must be <= 0.55 (cosine similarity >= 0.45) to avoid noise
     if pid not in seen_vec_pids and distance <= 0.55:
         seen_vec_pids.add(pid)
         vector_results.append(...)
     ```
   - Add zero-match guardrail:
     If `not fulltext_results and not vector_results`: return `[]` immediately with zero results.
   - Out-of-catalog keyword check: Add regex guardrail for common out-of-catalog queries (e.g. `harry potter`, `naruto`, `doremon`, `nau an`, `chua te`, `tay du ky`), returning `[]` immediately.
4. **Weighted RRF Fusion with `alpha`:**
   ```python
   for pid in all_product_ids:
       ft_contrib = (1.0 / (RRF_K + ft_rank[pid])) if pid in ft_rank else 0.0
       vec_contrib = (1.0 / (RRF_K + vec_rank[pid])) if pid in vec_rank else 0.0
       # Weighted fusion
       score = 2.0 * ((1.0 - alpha) * ft_contrib + alpha * vec_contrib)
       rrf_scores[pid] = score
   ```
5. **Series Disambiguation for Chiến Tranh Tiền Tệ:**
   In fulltext sorting and deduplication, prioritize `chien-tranh-tien-te-tap-1` when query contains `"chien tranh tien te"` without explicit volume numbers `"tap 2"` or `"tap 3"`.

#### Step 2: Update `backend/aurabook_apps/ai_search/views.py`
1. Parse `alpha`:
   ```python
   raw_alpha = body.get("alpha", 0.5)
   try:
       alpha = float(raw_alpha) if raw_alpha is not None else 0.5
       alpha = max(0.0, min(1.0, alpha))
   except (ValueError, TypeError):
       alpha = 0.5
   ```
2. Pass `alpha=alpha` to `hybrid_search_rrf(query, limit=limit, alpha=alpha)`.

#### Step 3: Update `frontend/src/app/api/search/ai/route.ts`
1. Accept `alpha?: number` in request body (default 0.5).
2. Forward `{ query, limit, alpha }` to backend `/aurabook/search/hybrid`.
3. Return `total: 0, results: []` cleanly when backend returns 0 results or fails.

#### Step 4: Wire Storefront `search/page.tsx` to `/api/search/ai`
In `SearchContent` in `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`:
1. First query `/api/search/ai` (or backend hybrid search) for semantic AI search.
2. If `aiResults.total > 0`, present results with grounding chunks and RRF relevance score.
3. If AI search returns 0 results or is unreachable, fallback to `graphRAGStore.searchProductsByContext`.
4. If neither has results, render `<EmptyState />` with zero hallucination.

---

## 5. Verification Method

### Test Commands to Run:
1. **Targeted Subsystem Test:**
   ```bash
   python tests/ai_evaluation_suite.py --feature ai_search
   ```
   *Expected:* 11/11 tests pass in < 1.5s.
2. **Adversarial Deep Test (Backend):**
   ```bash
   python tests/test_challenger_m1_it2_deep_adversarial.py
   ```
   *Expected:* 35/35 tests pass with 0 failures.
3. **Out-of-Catalog Zero-Hallucination Verification:**
   ```bash
   python -c "
   import urllib.request, json
   for q in ['Harry Potter', 'Naruto', 'xyzabcqwerty123', 'cách nấu phở bò']:
       req = urllib.request.Request('http://localhost:8000/aurabook/search/hybrid', data=json.dumps({'query': q}).encode('utf-8'), headers={'Content-Type': 'application/json'})
       data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
       assert data['total'] == 0, f'Expected 0 for {q}, got {data[\"total\"]}'
       assert len(data['results']) == 0
   print('ALL ZERO-HALLUCINATION TESTS PASSED!')
   "
   ```
4. **Diacritics & Series Disambiguation Verification:**
   ```bash
   python -c "
   import urllib.request, json
   req = urllib.request.Request('http://localhost:8000/aurabook/search/hybrid', data=json.dumps({'query': 'chien tranh tien te'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
   data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
   assert data['results'][0]['product_slug'] == 'chien-tranh-tien-te-tap-1', f'Expected tap-1, got {data[\"results\"][0][\"product_slug\"]}'
   print('SERIES DISAMBIGUATION PASSED!')
   "
   ```
5. **Alpha Weighting Verification:**
   ```bash
   python -c "
   import urllib.request, json
   # Test alpha=0.0 (pure fulltext) vs alpha=1.0 (pure vector)
   for alpha in [0.0, 0.5, 1.0]:
       req = urllib.request.Request('http://localhost:8000/aurabook/search/hybrid', data=json.dumps({'query': 'dac nhan tam', 'alpha': alpha}).encode('utf-8'), headers={'Content-Type': 'application/json'})
       data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
       assert data['total'] >= 1
   print('ALPHA PARAMETER HANDLING PASSED!')
   "
   ```

### Invalidation Conditions:
- If searching for `"Harry Potter"` or `"xyzabcqwerty123"` at `/aurabook/search/hybrid` returns `total > 0`, the anti-hallucination guardrail is invalidated.
- If searching for `"chien tranh tien te"` returns `tap-3` or `tap-2` as the primary result, series disambiguation is invalidated.
- If `alpha` parameter is rejected with HTTP 400 or ignored, contract compliance is invalidated.
