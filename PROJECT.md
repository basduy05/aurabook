# Project: Aurabook AI Subsystems Grounding & Optimization

## Architecture
The Aurabook AI Platform consists of three primary user-facing AI subsystems grounded on unified internal system data:
1. **AI Đọc Sách (Web Reader AI Companion)**: Next.js API (`/api/ai/reader-chat`) + Web Reader UI (`drm-web-reader.tsx`) connecting to Dify RAG Knowledge Base (`http://localhost:8080/v1`) with fallback to local GraphRAG (`graphRAGStore`).
2. **AI Tìm Kiếm (Semantic & Hybrid AI Search)**: Storefront search (`search/page.tsx`, `search-bar.tsx`) connected to Backend AI Search (`/aurabook/search/hybrid`, RRF with pgvector) and GraphRAG knowledge graph.
3. **Voice Chat (Voice Assistant)**: Storefront Voice Widget (`voice-agent-widget.tsx` + `/api/ai/voice-agent/chat` + Piper TTS `localhost:5050`) and LiveKit WebRTC Worker (`vietnamese_cskh_agent.py`) grounded on all 13 catalog books, business policies, and Dify RAG.
4. **Data Grounding Core**: PostgreSQL (`aurabook_db`, 149 tables, 13 products, 26 variants, GHN orders, CMS policies), `graphrag_store.json` (381 nodes, 373 edges, 1597 chunks from 13 EPUBs), and Dify RAG datasets.
5. **Automated Evaluation Harness**: Multi-tier automated evaluation runner (`tests/ai_evaluation_suite.py`) testing Grounding, Accuracy, and Reliability across all 3 AI subsystems.

```
                           +-----------------------------------------------+
                           |             User Interfaces (Web/Voice)       |
                           +-------+-------------------+---------------+---+
                                   |                   |               |
                         [Web Reader UI]       [Storefront Search] [Voice Widget]
                                   |                   |               |
                                   v                   v               v
                           +---------------+   +---------------+ +---------------+
                           |  reader-chat  |   | /api/search/ai| | voice-agent   |
                           |   (Next.js)   |   |   (Next.js)   | |  chat route   |
                           +-------+-------+   +-------+-------+ +-------+-------+
                                   |                   |                 |
                   +---------------+-------------------+-----------------+---------------+
                   |                                                                     |
                   v                                                                     v
       +-----------------------+                                             +-----------------------+
       |   Dify RAG Service    |                                             | Local GraphRAG & DB   |
       |  (http://localhost:   |                                             | (graph-store.ts,      |
       |     8080/v1)          |                                             |  PostgreSQL pgvector, |
       +-----------------------+                                             |  13 books catalog)    |
                                                                             +-----------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Vietnamese Diacritics Normalization in GraphRAG | Strip accents and normalize unaccented queries ("dac nhan tam" -> "đắc nhân tâm") in `resolveBookEntity` and `searchProductsByContext`. | M1 | Survey 2 & 3 |
| F2 | Full Catalog & Policy Knowledge Grounding | Expand entity graph and stores to cover all 13 books, GHN shipping rules (Hanoi warehouse, 500k freeship), return policies (7/30 days), and DRM LCP. | M1 | Survey 1, 2 & 3 |
| F3 | PostgreSQL pgvector Schema & Data Seeding | Fix `BookChunk.embedding` type mismatch (`bytea` -> `vector(768)`), fix SQL `<=>` query, seed 1,597 chunks for all 13 books into `ai_search_bookchunk`. | M1 | Survey 2 & 3 |
| F4 | Multi-Tier Dify RAG Integration for Reader AI | Connect `/api/ai/reader-chat` to Dify RAG (`/v1/chat-messages`, `/v1/datasets/{id}/retrieve`) with GraphRAG fallback. | M2 | Survey 1 |
| F5 | Intent-Adaptive Prompting for Reader AI | Categorize queries: Chit-chat/Greeting -> polite natural response; Factual/Pricing/Metadata -> direct grounded answer; Quote Analysis -> deep 3-section essay. | M2 | Survey 1 |
| F6 | Reader AI Context Expansion & Timeout Hardening | Eliminate 300-char truncation (support 1500-2000 chars), lower Ollama timeout (6-8s), fix Gemini API key check, eliminate exception swallowing in UI. | M2 | Survey 1 |
| F7 | Unified Frontend-to-Backend AI Search | Wire Storefront `search/page.tsx` and `search-bar.tsx` to `/api/search/ai` (`/aurabook/search/hybrid`), supporting semantic and natural language queries. | M3 | Survey 2 |
| F8 | Anti-Hallucination Search Guardrail | Remove arbitrary 3-book slicing fallback (`finalMatches = scoredBooks.slice(0, 3)`), return accurate results or honest suggestion with zero hallucination. | M3 | Survey 2 & 3 |
| F9 | Full Catalog Grounding for Voice Assistant | Replace hardcoded 4-book `CATALOG` in `/api/ai/voice-agent/chat/route.ts` with dynamic catalog covering all 13 books, resolving false negative rejections. | M4 | Survey 2 |
| F10 | Voice Chat Latency & Fallback Hardening | Reduce Ollama timeout from 15s to 2s with quick healthcheck fallback, eliminating speech pauses and stalls. | M4 | Survey 2 |
| F11 | LiveKit Agent Dify RAG Unblocking | Remove `app-aurabook-rag-dev-key` short-circuit in `vietnamese_cskh_agent.py`, fix `sttBaseUrl` endpoint. | M4 | Survey 1 & 2 |
| F12 | Audio Stream Consistency & Dynamic Speed | Standardize TTS output to WAV PCM 22050Hz, eliminate MP3 format mismatch pop/click glitch, support dynamic `speed` parameter in Piper TTS. | M4 | Survey 2 |
| F13 | Automated Evaluation Test Suite (Tiers 1-4) | Independent test suite executing Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), Tier 4 (Real-World Scenarios). | E2E Track | Survey 3 |
| F14 | 100% E2E Test Suite Pass & Adversarial Hardening | Execute full test suite against all 3 AI subsystems, verify 100% pass criteria, run adversarial stress testing (Tier 5). | M5 | System Spec |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Data Grounding, GraphRAG & DB Synchronization Engine | F1, F2, F3 (`graph-store.ts`, `vector-store.ts`, `models.py`, `search.py`, `tasks.py`, DB migrations & seeds) | none | DONE |
| M2 | AI Đọc Sách & Multi-Tier Dify RAG Pipeline | F4, F5, F6 (`reader-chat/route.ts`, `drm-web-reader.tsx`, prompt engineering, Dify client) | M1 | IN_PROGRESS |
| M3 | AI Tìm Kiếm & Unified Catalog Semantic Retrieval | F7, F8 (`search/page.tsx`, `search-bar.tsx`, `/api/search/ai`, hybrid search RRF) | M1 | PLANNED |
| M4 | Voice Chat & Real-Time Audio Grounding | F9, F10, F11, F12 (`voice-agent/chat/route.ts`, `vietnamese_cskh_agent.py`, `aurabook_piper_tts_server.py`) | M1 | PLANNED |
| M5 | Final Milestone: 100% E2E Pass & Coverage Hardening | F14 (Pass all Tier 1-4 tests, Adversarial Tier 5 coverage audit) | M1, M2, M3, M4, E2E Track | PLANNED |

## Interface Contracts
### GraphRAG Store ↔ AI Consumers (Reader Chat, Search, Voice Chat)
- Functions:
  - `resolveBookEntity(query: string): GraphNode | null`
    * Supports accented, unaccented, and slug variations for all 13 books.
  - `searchProductsByContext(query: string, limit?: number): ScoredProduct[]`
    * Returns matched books with normalized relevance scores; returns empty array when no books match (no forced random slicing).
  - `queryGraphRAG(query: string, bookSlug?: string): GraphQueryResult`
    * Returns related nodes, edges, and full text chunks (untruncated) for grounded generation.

### Backend AI Search (`/aurabook/search/hybrid`) ↔ Frontend Search (`/api/search/ai`)
- Request: `POST /aurabook/search/hybrid`, Body: `{"query": string, "limit": number, "alpha": number}`
- Response: `{"total": number, "results": [{"product_id": string, "product_slug": string, "title": string, "score": number, "chunk_text": string}]}`
- Error Handling: Fallback to fulltext PostgreSQL search; never crash with type errors (`<=>` on vector type only).

### Dify RAG API ↔ AI Subsystems
- Request: `POST ${DIFY_API_URL}/chat-messages` or `/datasets/${datasetId}/retrieve`
- Headers: `{"Authorization": "Bearer " + DIFY_API_KEY, "Content-Type": "application/json"}`
- Fallback: If Dify returns error or times out (>4s), fallback to local GraphRAG store without hallucination or mock citation.

### Voice Chat Route ↔ Piper TTS Server
- Request: `POST http://localhost:5050/api/tts`, Body: `{"text": string, "speed": number}`
- Response: `{"audioBase64": string, "format": "wav", "sampleRate": 22050}`

## Code Layout
- `frontend/src/lib/graphrag/`:
  - `graph-store.ts` (Knowledge graph store, entity resolution, product context search)
  - `vector-store.ts` (Vector chunk store, semantic similarity calculation)
- `frontend/src/app/api/ai/`:
  - `reader-chat/route.ts` (AI Đọc Sách API route)
  - `voice-agent/chat/route.ts` (Storefront Voice Agent API route)
  - `search/ai/route.ts` (Search AI proxy route)
- `frontend/src/ui/components/`:
  - `reader/drm-web-reader.tsx` (Reader UI)
  - `voice-agent/voice-agent-widget.tsx` (Voice widget UI)
  - `nav/components/search-bar.tsx` (Search bar component)
- `frontend/src/app/(storefront)/[locale]/[channel]/(main)/search/page.tsx`: Storefront Search Page
- `backend/aurabook_apps/ai_search/`:
  - `models.py` (BookChunk model definition)
  - `search.py` (Hybrid search RRF implementation)
  - `tasks.py` (Embedding vectorization tasks)
  - `views.py` (HybridSearchView, RAGQueryView)
- `ecommerce-ai-platform/`:
  - `voice-agent/backend/vietnamese_cskh_agent.py` (LiveKit CSKH voice agent)
  - `voice-agent/backend/aurabook_piper_tts_server.py` (Piper TTS server)
  - `ai_platform_config.json` (Platform AI configuration)
- `tests/`:
  - `ai_evaluation_suite.py` (Automated evaluation test runner, Tiers 1-4)
