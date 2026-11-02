## 2026-10-31T16:01:10Z
You are teamwork_worker_m3.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m3\

You are the Implementation Worker for Milestone 3: AI Tìm Kiếm & Unified Catalog Semantic Retrieval.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: You MUST read ORIGINAL_REQUEST.md before doing anything:
C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
Also read:
C:\Users\basduy05\Downloads\aurabook\PROJECT.md
C:\Users\basduy05\Downloads\aurabook\TEST_READY.md

Read the 3 Explorer handoff reports for full blueprints, root causes, and code lines:
1. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_1\handoff.md (Frontend UI & API analysis)
2. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_2\handoff.md (Backend RRF & Anti-hallucination analysis)
3. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_3\handoff.md (Test analysis & quality gates)

Exclusive Write Ownership:
- `backend/aurabook_apps/ai_search/search.py`
- `backend/aurabook_apps/ai_search/views.py`
- `frontend/src/app/api/search/ai/route.ts`
- `frontend/src/lib/graphrag/graph-store.ts`
- `frontend/src/ui/components/nav/components/search-bar.tsx`
- `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`
- Associated tests if needed (`frontend/src/lib/graphrag/graph-store.test.ts`, etc.)

Tasks:
1. Backend Anti-Hallucination & RRF Hardening (`backend/aurabook_apps/ai_search/search.py` and `views.py`):
   - Support `alpha` parameter (float, 0.0 to 1.0, default 0.5) per PROJECT.md interface contract.
   - Enforce tighter vector distance threshold (`distance <= 0.65` or cosine similarity >= 0.35) to eliminate hallucinated catalog matches for out-of-catalog queries ("Harry Potter", "Naruto", gibberish).
   - If neither full-text search nor vector search produces genuine matches above the threshold, return `total: 0, results: []`.
   - Multi-volume series disambiguation: Order by `match_priority DESC, bc.chunk_index ASC, product_slug ASC` so Tập 1 takes priority for generic queries like "Chiến tranh tiền tệ".
2. Frontend `/api/search/ai/route.ts`:
   - Receive `{ query, limit, alpha }`, validate input, forward to backend `/aurabook/search/hybrid`, return normalized response.
3. GraphRAG Store Enhancements (`frontend/src/lib/graphrag/graph-store.ts`):
   - Fix stop words collision: do not strip "bản" when inside "bản thân".
   - Add cluster support for "phát triển bản thân" (mapping to personal development books: Cách Nghĩ Để Thành Công, Đắc Nhân Tâm, 10 Điều Tạo Nên Số Phận).
   - Preserve anti-hallucination guardrail (`if (!hasDirectMatch) return { products: [], ... }`).
4. Storefront Search UI Integration (`search/page.tsx` & `search-bar.tsx`):
   - In `search/page.tsx`: When `hasDirectMatch === false`, do NOT swallow the AI reasoning summary into a bare empty state; display the AI reasoning explanation banner explaining that the book is outside the catalog and provide intelligent recommendations.
5. Verification (Run and document commands and output in handoff.md):
   - `python tests/ai_evaluation_suite.py --feature ai_search` (Must pass 11/11).
   - `python tests/ai_evaluation_suite.py --id TC-T3-01` and `--id TC-T3-02` (Must pass).
   - `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`
   - `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts`
   - Empirical test: `curl` or Python script testing `POST http://localhost:8000/aurabook/search/hybrid` with `{"query": "Harry Potter"}` -> MUST return 0 results.

Write your complete report to:
`C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m3\handoff.md`
Follow the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
When finished, notify me using send_message.
