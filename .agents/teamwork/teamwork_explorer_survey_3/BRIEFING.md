# BRIEFING — 2026-10-31T13:53:00Z

## Mission
Investigate Data Grounding Sources (Database, Dify RAG Knowledge Base, Business Documents) and Testing/Evaluation Infrastructure in Aurabook.

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, investigation, synthesis
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: Milestone 1: Exploration & Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- NEVER write, modify, or delete any source code, tests, or application configuration files directly
- Write ONLY metadata/progress files in your own working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: 2026-10-31T13:49:46Z

## Investigation State
- **Explored paths**:
  * PostgreSQL DB dump `backups/latest/aurabook_db.sql` (149 tables), `scripts/seed_storefront_models.py`, `backend/aurabook_apps/setup_real_books.py`.
  * Seed files & data stores: `frontend/data/ghn_shipments.json`, `reviews.json`, `community.json`, `ecommerce-ai-platform/data/graphrag_store.json` (381 nodes, 373 edges, 1,597 chunks, 13 books).
  * Business policies: Shipping rules (GHN 16.5k-35k, FreeShip >=500k), 30-day return window, 7-day defective exchange, Readium LCP single-tab lock DRM, Warehouse origin (12 Duy Tân, Cầu Giấy, HN).
  * Corpus: `corpus.txt` & `corpus_sentences.txt` (3001 curated sentences in 6 operational domains), `vi_VN-hoaimy-aurabook.onnx` TTS model.
  * Dify RAG setup: `ecommerce-ai-platform/core-rag/dify`, port 8080, dataset "dataset-aurabook-literature-01", admin config in `ai_platform_config.json`.
  * AI subsystems: `backend/aurabook_apps/ai_search` (hybrid search RRF), `frontend/src/app/api/ai/reader-chat`, `frontend/src/app/api/ai/voice-agent/chat`, `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`.
  * Test setups: Vitest, Playwright, pytest, Ragas `evaluate_dify_rag.py`, `admin/eval` benchmark.
- **Key findings**:
  * Complete inventory of all grounding sources established.
  * Unaccented Vietnamese queries ("dac nhan tam") completely miss book resolution in `graph-store.ts` (`resolveBookEntity` and `searchProductsByContext`), causing AI to answer off-topic or hallucinate unrelated books.
  * `ai_search_bookchunk` has 0 rows in DB dump, and uses struct pack binary bytes while `search.py` attempts `::vector` cast.
  * Automated evaluation suite designed across 4 Tiers.
  * Full report written to `handoff.md`.
- **Unexplored areas**: None. Exploration complete.

## Key Decisions Made
- Completed survey report adhering to the 5-component handoff protocol.

## Artifact Index
- DISPATCH.md — Task assignment from orchestrator
- BRIEFING.md — Situational awareness and state
- progress.md — Liveness heartbeat and progress tracking
- handoff.md — Final investigation report
