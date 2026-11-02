# Dispatch: Milestone 1 Worker

## Mission
Implement Milestone 1 (M1): Data Grounding, GraphRAG & DB Synchronization Engine.

## Mandatory Reading & References
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md`
- Explorer findings:
  * `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_1\handoff.md` (Exact TypeScript changes for `graph-store.ts` & `vector-store.ts`)
  * `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\handoff.md` (Exact Python & SQL changes for `models.py`, `search.py`, `tasks.py`, `gemini_client.py`, and migration)
  * `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_3\handoff.md` (Exact script `scripts/seed_book_chunks.py` to seed 1,597 chunks into PostgreSQL)

## Exclusive Write Ownership
You exclusively own and may edit/create:
- `frontend/src/lib/graphrag/graph-store.ts`
- `frontend/src/lib/graphrag/vector-store.ts`
- `frontend/src/lib/graphrag/graph-store.test.ts`
- `backend/aurabook_apps/ai_search/models.py`
- `backend/aurabook_apps/ai_search/search.py`
- `backend/aurabook_apps/ai_search/tasks.py`
- `backend/aurabook_apps/ai_search/gemini_client.py`
- `backend/aurabook_apps/ai_search/migrations/0002_alter_bookchunk_embedding_to_vector.py`
- `scripts/seed_book_chunks.py`

## Implementation Steps
1. **Frontend GraphRAG & Diacritics**:
   - Implement `stripVietnameseDiacritics` and `normalizeVietnameseQuery` in `graph-store.ts`.
   - Implement `BOOK_CATALOG_MAPPING` covering all 13 books.
   - Update `resolveBookEntity` to match accented, unaccented, slug, abbreviations, and anaphora.
   - Update `searchProductsByContext` with Tokenized Word Matching, semantic clusters for all 13 books, and **completely remove `finalMatches = scoredBooks.slice(0, 3)`**.
   - Update `vector-store.ts` so `generateSemanticVector` handles unaccented queries.
   - Create unit tests `frontend/src/lib/graphrag/graph-store.test.ts` and run `pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts`.
2. **Backend pgvector Schema & Hybrid Search**:
   - Update `models.py` with custom `VectorField(dimensions=768)`.
   - Create Django migration `0002_alter_bookchunk_embedding_to_vector.py` and apply it (or execute DDL on `aurabook-postgres` container).
   - Update `tasks.py` to remove `struct.pack`.
   - Update `gemini_client.py` to use dense semantic vectorizer as fallback instead of returning zero vectors.
   - Update `search.py` to fix `<=>` query, add unaccent fulltext fallback, and left join `product_product` for `title`.
3. **Database Seeding**:
   - Create and run `scripts/seed_book_chunks.py` to populate 1,597 chunks from `graphrag_store.json` into PostgreSQL `ai_search_bookchunk`.
   - Verify that `SELECT count(*) FROM ai_search_bookchunk` returns 1,597 and vector distance query returns valid numbers without error or NaN.
4. **Verification**:
   - Run Vitest unit tests on `frontend/src/lib/graphrag/graph-store.test.ts`.
   - Test endpoint `http://localhost:8000/aurabook/search/hybrid` with query `"dac nhan tam"`.
   - Run `python tests/ai_evaluation_suite.py --feature ai_search` to verify improvements.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\`
- Maintain `progress.md` with timestamps.
- When finished, write your report to `handoff.md` and send message to orchestrator.


## 2026-10-31T14:07:20Z
[Message] timestamp=2026-10-31T14:07:20Z sender=c06d103f-9d18-48c5-939d-514a32a0f9e1 priority=MESSAGE_PRIORITY_HIGH content=You are M1 Worker.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\

First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_1\handoff.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\handoff.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_3\handoff.md

Your exclusive write ownership covers:
- frontend/src/lib/graphrag/graph-store.ts
- frontend/src/lib/graphrag/vector-store.ts
- frontend/src/lib/graphrag/graph-store.test.ts
- backend/aurabook_apps/ai_search/models.py
- backend/aurabook_apps/ai_search/search.py
- backend/aurabook_apps/ai_search/tasks.py
- backend/aurabook_apps/ai_search/gemini_client.py
- backend/aurabook_apps/ai_search/migrations/0002_alter_bookchunk_embedding_to_vector.py
- scripts/seed_book_chunks.py

Tasks:
1. Implement Vietnamese diacritics normalization (stripVietnameseDiacritics), full 13-book BOOK_CATALOG_MAPPING, resolveBookEntity matching (accented, unaccented, slug, abbreviations, anaphora), and searchProductsByContext (token matching, semantic clusters, REMOVE slice(0, 3) fallback) in frontend/src/lib/graphrag/graph-store.ts and vector-store.ts.
2. Create unit tests frontend/src/lib/graphrag/graph-store.test.ts and run tests with pnpm.
3. Update backend/aurabook_apps/ai_search/ (models.py, migrations, search.py, tasks.py, gemini_client.py) with custom VectorField(768), fix raw SQL <=> query, and unaccent fulltext fallback.
4. Create and run scripts/seed_book_chunks.py to seed 1,597 chunks from graphrag_store.json into PostgreSQL ai_search_bookchunk.
5. Verify build and tests pass (run Vitest, check PostgreSQL count 1597, test hybrid search endpoint).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write your handoff.md in your working directory and notify me via send_message with test results and changed files.
