# Dispatch: Sub-orchestrator Milestone 1

## Identity & Scope
You are Sub-orchestrator for Milestone 1 (M1): Data Grounding, GraphRAG & DB Synchronization Engine.
Your working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\`

## Mission
Deliver Milestone 1 following the standard Project Pattern iteration loop (Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate):
1. **Explorer**: Analyze exact changes needed in `graph-store.ts`, `vector-store.ts`, `backend/aurabook_apps/ai_search/models.py`, `search.py`, `tasks.py`, and the pgvector migration/seeding script.
2. **Worker**: Implement the code changes:
   - Add `stripVietnameseDiacritics` and dual accented/unaccented matching to `graph-store.ts`.
   - Update `resolveBookEntity` and `searchProductsByContext` to recognize all 13 books.
   - Remove random slicing fallback (`finalMatches = scoredBooks.slice(0, 3)`).
   - Fix `BookChunk` embedding field type and SQL `<=>` operator execution in `search.py`.
   - Create and run migration / seed script to populate 1,597 chunks from `graphrag_store.json` into PostgreSQL `ai_search_bookchunk`.
   - Verify build and tests pass.
3. **Reviewers (2)**: Independently review correctness, completeness, and non-regression.
4. **Challengers (2)**: Empirically challenge unaccented queries ("dac nhan tam"), out-of-catalog queries, and PostgreSQL vector queries.
5. **Auditor (teamwork_auditor)**: Perform forensic integrity verification (no hardcoding, no mock facades).
6. **Gate**: Evaluate verdicts. On pass, write `GATE_STATUS.md` and report back to parent orchestrator.

## References
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md`
- Explorer survey reports in `teamwork_explorer_survey_1/handoff.md`, `teamwork_explorer_survey_2/handoff.md`, `teamwork_explorer_survey_3/handoff.md`
