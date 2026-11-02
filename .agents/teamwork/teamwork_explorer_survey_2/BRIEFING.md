# BRIEFING — 2026-10-31T13:52:00Z

## Mission
Investigate the AI Tìm Kiếm (AI Search) and Voice Chat subsystems in Aurabook (read-only investigation).

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, investigator, synthesizer
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify any source code, tests, or config.
- Write only metadata/progress files in my own working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\
- Produce structured analysis report in handoff.md following 5-component format.

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: 2026-10-31T13:50:39Z

## Investigation State
- **Explored paths**:
  - Backend AI Search: `backend/aurabook_apps/ai_search/` (`views.py`, `search.py`, `models.py`, `tasks.py`, `gemini_client.py`, `urls.py`)
  - Frontend Search: `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`, `frontend/src/ui/components/nav/components/search-bar.tsx`, `frontend/src/lib/search/saleor-provider.ts`, `frontend/src/lib/graphrag/graph-store.ts`, `frontend/src/app/api/search/ai/route.ts`
  - Voice Chat Storefront: `frontend/src/ui/components/voice-agent/voice-agent-widget.tsx`, `frontend/src/app/api/ai/voice-agent/chat/route.ts`
  - Voice Agent Backend Worker: `ecommerce-ai-platform/voice-agent/backend/` (`vietnamese_cskh_agent.py`, `aurabook_piper_tts_server.py`, `viet_english_normalizer.py`)
  - AI Platform & Dify RAG: `ecommerce-ai-platform/ai_platform_config.json`, `ecommerce-ai-platform/data/graphrag_store.json`, `infra/docker-compose.yml`, `START_ALL.ps1`, `START_AURABOOK.ps1`
  - PostgreSQL database `aurabook_db`: checked `ai_search_bookchunk` (0 rows, bytea column), checked `product_product` (13 books in Saleor catalog).
- **Key findings**:
  1. AI Search Backend Failure: `ai_search_bookchunk` has 0 rows. Embedding column is defined as Django `BinaryField` (`bytea` in PostgreSQL) instead of `pgvector`, so `embedding <=> %s::vector` throws `operator does not exist: bytea <=> vector`, falling back to `chunk_text__icontains=query` which returns 0 results for natural queries.
  2. Frontend Search Disconnect: Frontend search page does not call `/aurabook/search/hybrid` or Dify. Instead it runs Saleor keyword search, and if empty, falls back to `graphRAGStore.searchProductsByContext`. If no direct match in graph store, it slices 3 arbitrary books from the catalog as "Ấn phẩm tham khảo", causing irrelevant recommendations and hallucinated associations.
  3. Catalog Discrepancy (Catalog Grounding Violation): Saleor DB has 13 real books. `graphrag_store.json` has 13 books. But `voice-agent/chat/route.ts` hardcodes only 4 books in `CATALOG`. When a user asks about any of the other 9 books, Voice Agent falsely claims Aurabook does not have the book.
  4. LiveKit Voice Agent Disconnect & RAG Blocking: `vietnamese_cskh_agent.py` sets `sttBaseUrl` to `http://localhost:8000/v1` (Saleor, no STT). In `DifyRAGService.query_dify`, it checks `api_key in ["app-your-dify-api-key", "app-aurabook-rag-dev-key"]`, which matches `ai_platform_config.json`, completely blocking calls to Dify RAG on port 8080 and always returning a hardcoded DRM LCP policy sentence.
  5. Storefront Voice Chat Delays & Glitches: Uses browser Web Speech API (Chrome-only, breaks offline); calls Ollama `gemma2:2b` which times out after 15s if Ollama is not active; Piper TTS at port 5050 and Edge-TTS produce mismatched WAV vs MP3 formats; non-streaming HTTP pipeline causes 5-10 second roundtrip latency.
- **Unexplored areas**: None. Both AI Search and Voice Chat architectures fully traced and verified.

## Key Decisions Made
- Proceeding to write comprehensive `handoff.md` detailing the exact file inventory, architectural diagrams, call flows, failure modes, root causes, and actionable implementation recommendations.

## Artifact Index
- DISPATCH.md — Task assignments & messages
- BRIEFING.md — Persistent memory & state
- progress.md — Liveness & status tracking
- handoff.md — Comprehensive 5-component report
