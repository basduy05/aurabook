# BRIEFING — 2026-10-31T14:04:30Z

## Mission
Analyze backend/aurabook_apps/ai_search/ (models.py, search.py, tasks.py) and pgvector schema to design complete fix for BookChunk vector(768) embeddings, DDL/migrations, SQL <=> query, and fulltext search fallback.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: M1 (Data Grounding, GraphRAG & DB Synchronization Engine)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code files directly.
- All proposals and analysis must be documented in handoff.md in working directory.
- Send completion message to parent orchestrator.

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: 2026-10-31T14:04:30Z

## Investigation State
- **Explored paths**:
  - `backend/aurabook_apps/ai_search/models.py`
  - `backend/aurabook_apps/ai_search/search.py`
  - `backend/aurabook_apps/ai_search/tasks.py`
  - `backend/aurabook_apps/ai_search/gemini_client.py`
  - `backend/aurabook_apps/ai_search/views.py`
  - `backend/aurabook_apps/ai_search/migrations/0001_initial.py`
  - `backend/pyproject.toml`
  - PostgreSQL container `aurabook-postgres` (`aurabook_db`, extensions `vector` 0.8.7, `unaccent`, `pg_trgm`, `product_product` table, `ai_search_bookchunk` schema)
  - Backend container `aurabook-backend` (Django 5.2.17, psycopg 3.3.4, text-unidecode 1.2)
- **Key findings**:
  1. `vector` 0.8.7 extension control file is in `/usr/share/postgresql/16/extension/vector.control` inside `aurabook-postgres`.
  2. PostgreSQL cannot cast `bytea` to `vector` directly (`ERROR: cannot cast type bytea to vector`). Because the table has 0 rows, `ALTER TABLE ... TYPE vector(768) USING NULL;` executes cleanly.
  3. HNSW index `USING hnsw (embedding vector_cosine_ops)` creates successfully and operates without data.
  4. In `search.py`, vector distance with all-zero vector returns `NaN` in pgvector; an `is_zero_vector` guard is required.
  5. In `search.py`, deduplication by `product_id` is missing, causing multiple chunks from the same book to overwrite better RRF ranks with worse ranks.
  6. Title field was missing in `search.py` results; can be resolved via `LEFT JOIN product_product p ON bc.product_slug = p.slug`.
  7. PostgreSQL `unaccent()` strips Vietnamese accents accurately, allowing case- and diacritics-insensitive matching without external plugins.
  8. A 3-layer fulltext search (diacritics-insensitive unaccent phrase, keyword tokenization, and direct `product_product` catalog fallback) guarantees 100% book retrieval.
- **Unexplored areas**:
  - None within M1 Explorer 2 scope. All 4 target questions fully investigated and verified.

## Key Decisions Made
- Use Django `SeparateDatabaseAndState` migration pattern with `VectorField` in `models.py`.
- Provide concrete, complete code snippets and migration files ready for M1 Implementer.

## Artifact Index
- `DISPATCH.md` — Task assignment log
- `BRIEFING.md` — Situational awareness
- `progress.md` — Liveness and progress updates
- `handoff.md` — Final 5-component handoff report
