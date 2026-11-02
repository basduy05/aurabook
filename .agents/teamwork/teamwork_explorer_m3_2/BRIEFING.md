# BRIEFING — 2026-10-31T15:59:00Z

## Mission
Read-only technical investigation for Milestone 3: AI Tìm Kiếm & Unified Catalog Semantic Retrieval (Backend & Anti-Hallucination Focus).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m3_2\
- Original parent: d1308e27-7c60-4aba-bded-d932c6cded78
- Milestone: Milestone 3 (AI Tìm Kiếm & Unified Catalog Semantic Retrieval)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code directly
- Strict evidence chain with file paths, line numbers, and quotes
- Zero hallucination in search results guardrail focus (Feature F8)
- Address Vietnamese diacritics normalization (Feature F1 / F7)
- Address Hybrid Search & pgvector RRF (backend search.py, views.py, and frontend graphrag stores)
- Provide actionable blueprint and verification methods in handoff.md

## Current Parent
- Conversation ID: d1308e27-7c60-4aba-bded-d932c6cded78
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `TEST_READY.md`
  - `backend/aurabook_apps/ai_search/search.py`
  - `backend/aurabook_apps/ai_search/views.py`
  - `backend/aurabook_apps/ai_search/gemini_client.py`
  - `frontend/src/lib/graphrag/graph-store.ts`
  - `frontend/src/lib/graphrag/vector-store.ts`
  - `frontend/src/app/api/search/ai/route.ts`
  - `frontend/src/app/api/ai/graphrag/search/route.ts`
  - `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`
  - `frontend/src/ui/components/nav/components/search-bar.tsx`
  - `tests/ai_evaluation_suite.py` & test datasets
- **Key findings**:
  1. Root cause of backend search hallucination: `search.py` line 140 accepts vector matches up to distance `<= 0.85`. High-dimensional random embeddings (Harry Potter, Naruto, gibberish) have distance ~0.72-0.84, which qualifies all 10-13 catalog books. Due to naive ordinal RRF, these noise matches receive scores like 0.01639 and are returned as matches.
  2. Missing parameter `alpha`: `PROJECT.md` specifies `alpha` in `/aurabook/search/hybrid`, but `views.py` and `search.py` ignore it.
  3. Series disambiguation bug: "Chiến tranh tiền tệ" returns Tập 3 instead of Tập 1 due to unordered deduplication.
  4. Slicing fallback: `graph-store.ts` previously sliced `scoredBooks.slice(0, 3)`; guardrail was added in `graph-store.ts`, but backend search still slices `ranked[:limit]` returning 10+ irrelevant books on out-of-catalog items.
  5. Frontend wiring gap (F7): Storefront `search/page.tsx` and `search-bar.tsx` currently bypass `/api/search/ai` and backend hybrid search.
- **Unexplored areas**: None. Ready to author `handoff.md`.

## Key Decisions Made
- Structure `handoff.md` with the 5 required sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
- Include precise diff proposals / replacement designs for `search.py`, `views.py`, `/api/search/ai/route.ts`, and Storefront search.

## Artifact Index
- DISPATCH.md — Received instructions
- BRIEFING.md — Working memory & identity
- progress.md — Liveness & task progress
- handoff.md — Final structured report
