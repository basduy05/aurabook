# Progress — Survey Explorer 2

Last visited: 2026-10-31T13:56:00Z

- [x] Initialized DISPATCH.md, BRIEFING.md, and progress.md
- [x] Explored high-level repository structure of Aurabook (Next.js storefront, Django backend, Piper TTS, LiveKit agent, Dify RAG)
- [x] Investigated AI Search:
  * Backend: `backend/aurabook_apps/ai_search/` (`views.py`, `search.py`, `models.py`, `tasks.py`, `gemini_client.py`). Found `ai_search_bookchunk` has 0 rows, `embedding` column is `bytea` causing `operator does not exist: bytea <=> vector` in `hybrid_search_rrf` raw SQL, fallback to `icontains` returns 0 results.
  * Frontend: Disconnect between `/api/search/ai` (calls backend hybrid search) and actual search pages. `search-bar.tsx` and `search/page.tsx` use Saleor keyword search + in-memory fallback `graphRAGStore`. `graph-store.ts` contains hardcoded catalog and fallback that dumps 3 random books when no match is found. Dify RAG is not queried by search.
- [x] Investigated Voice Chat:
  * Architecture Duality: Discovered Storefront uses `voice-agent-widget.tsx` (HTTP + Web Speech API + Piper TTS API) while `ecommerce-ai-platform/voice-agent` has a separate LiveKit WebRTC agent (`vietnamese_cskh_agent.py`).
  * LiveKit Agent Root Cause: `vietnamese_cskh_agent.py` hardcodes `sttBaseUrl: http://localhost:8000/v1` (Saleor backend, no STT endpoint). In `query_dify`, it checks `api_key in ["app-your-dify-api-key", "app-aurabook-rag-dev-key"]` which matches `ai_platform_config.json`, causing it to NEVER query Dify and ALWAYS return a hardcoded static DRM message.
  * Storefront Voice Agent Root Cause: `frontend/src/app/api/ai/voice-agent/chat/route.ts` hardcodes a 4-book catalog (`CATALOG`) ignoring 9 of the 13 books in Saleor DB/GraphRAG. Queries to Ollama `gemma2:2b` timeout after 15s when Ollama is offline. Piper TTS server at port 5050 generates `audio/wav` while fallback Edge-TTS generates `audio/mpeg`, causing playback glitches/inconsistencies.
- [x] Finalized detailed inventory of files, functions, failure modes, and concrete fix recommendations.
- [x] Wrote comprehensive handoff.md following 5-component Handoff Protocol.
- [x] Reported complete findings to parent orchestrator.
