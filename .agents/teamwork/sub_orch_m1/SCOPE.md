# Scope: Milestone 1 (M1) - Data Grounding, GraphRAG & DB Synchronization Engine

## Objective
Implement comprehensive data grounding, Vietnamese diacritics normalization, and PostgreSQL vector synchronization across Aurabook:
1. Normalize Vietnamese diacritics in `graph-store.ts` (`resolveBookEntity` and `searchProductsByContext`) so both accented and unaccented queries ("dac nhan tam", "đắc nhân tâm") accurately resolve to the correct book entity.
2. Ground all 13 books from Saleor DB / GraphRAG, eliminate random slicing fallback, provide rich chapter and policy metadata (GHN shipping, return policy, DRM Readium LCP).
3. Fix PostgreSQL `ai_search_bookchunk` embedding column type mismatch (`bytea` -> `vector(768)`), fix SQL `<=>` operator query in `search.py`, seed 1,597 chunks from `graphrag_store.json` into PostgreSQL `ai_search_bookchunk`.

## Assigned Features
- F1: Vietnamese Diacritics Normalization in GraphRAG
- F2: Full Catalog & Policy Knowledge Grounding
- F3: PostgreSQL pgvector Schema & Data Seeding

## Files Owned
- `frontend/src/lib/graphrag/graph-store.ts`
- `frontend/src/lib/graphrag/vector-store.ts`
- `backend/aurabook_apps/ai_search/models.py`
- `backend/aurabook_apps/ai_search/search.py`
- `backend/aurabook_apps/ai_search/tasks.py`
- Helper/migration/seed scripts for pgvector and book chunks

## Reference Documents
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_1\handoff.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\handoff.md`
