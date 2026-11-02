## 2026-10-31T16:49:34Z
You are teamwork_worker_m3_it2.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m3_it2\

You are the Remediation Worker for Milestone 3 (AI Tìm Kiếm & Unified Catalog Semantic Retrieval).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: You MUST read ORIGINAL_REQUEST.md:
C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
Also read:
C:\Users\basduy05\Downloads\aurabook\PROJECT.md
C:\Users\basduy05\Downloads\aurabook\TEST_READY.md

Read the 3 Remediation Explorer reports and previous Gate findings:
1. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_it2_1\handoff.md (Algorithmic Zero-Hallucination & vector distance <= 0.50 blueprint)
2. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_it2_2\handoff.md (Generalized Series Sorting & Score Leakage blueprint)
3. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_it2_3\handoff.md (GraphRAG Concepts & UI blueprint)
4. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_reviewer_m3_2\handoff.md
5. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m3_1\handoff.md

Exclusive Write Ownership:
- `backend/aurabook_apps/ai_search/search.py`
- `backend/aurabook_apps/ai_search/views.py`
- `frontend/src/app/api/search/ai/route.ts`
- `frontend/src/lib/graphrag/graph-store.ts`
- `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`
- `frontend/src/ui/components/nav/components/search-bar.tsx`
- Associated test files if needed (`tests/test_challenger_m3_empirical.py`, etc.)

Tasks:
1. In `backend/aurabook_apps/ai_search/search.py`:
   - Completely remove `OUT_OF_CATALOG_PATTERN`. Do not hardcode blacklists.
   - Implement the algorithmic zero-hallucination solution: input sanitization, strict full-word metadata matching on `product_product` (not arbitrary partial substrings in chunks), vector distance threshold `<= 0.50`.
   - Implement generalized multi-volume series sorting: extract series slug/title and volume number, group generic queries ascending (Tập 1 > Tập 2 > Tập 3), prioritize explicit volume queries ("tập 2", "vol 3").
   - Eliminate 0.0 score leakage: when `alpha = 0.0`, restrict candidate set to `ft_rank`; when `alpha = 1.0`, restrict candidate set to `vec_rank`; filter out any item with `score <= 0.0`.
2. In `frontend/src/lib/graphrag/graph-store.ts`:
   - Add concept clusters for "tâm lý học" / "tam ly hoc" and "kinh tế học" / "kinh te hoc".
   - Fix canonical slug for Chủ Nghĩa Khắc Kỷ to `chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than` with backwards-compatible alias.
   - Guard against Star Wars false positive ("chiến tranh giữa các vì sao").
3. In `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx` & `search-bar.tsx`:
   - Ensure clean wiring and intelligent AI explanation banner when out-of-catalog items are searched.
4. Comprehensive Verification:
   - `python tests/ai_evaluation_suite.py --feature ai_search` (Must pass 11/11).
   - `python tests/ai_evaluation_suite.py --id TC-T3-01` and `--id TC-T3-02` (Must pass).
   - `python tests/test_challenger_m3_empirical.py` (Must pass).
   - `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`
   - `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts`
   - Verify specific bug fixes:
     * "dữ liệu trong lịch sử loài người" -> returns Sapiens.
     * "Harry Potter", "Chúa tể những chiếc nhẫn", "Bố già", "Naruto", emojis -> return `total: 0, results: []`.
     * "alpha=0.0" -> no items with score 0.0.
     * "Chiến tranh tiền tệ" -> Tập 1 ranked first.
