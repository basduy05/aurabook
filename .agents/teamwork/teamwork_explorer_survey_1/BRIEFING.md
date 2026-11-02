# BRIEFING — 2026-10-31T13:47:00Z

## Mission
Investigate the AI Đọc Sách (Book Reading AI) and Dify RAG integration in Aurabook codebase. Identify root causes of failures, unhandled exceptions, hallucinations/lack of grounding, and off-topic responses.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_1\
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: Survey & Root Cause Analysis of AI Đọc Sách and Dify RAG

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Write only inside working directory
- Provide exact evidence chain: file paths, line numbers, function names, error causes
- Formulate concrete recommendations and verification method

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: not yet

## Investigation State
- **Explored paths**:
  * `frontend/src/ui/components/reader/drm-web-reader.tsx` (handleAskAIAboutQuote, handleAskAIAboutSelection, handleSendAIMessage)
  * `frontend/src/app/api/ai/reader-chat/route.ts` (POST streaming / non-streaming endpoint)
  * `frontend/src/app/api/ai/admin/dify/route.ts` (Dify test & config route)
  * `frontend/src/lib/graphrag/graph-store.ts` & `vector-store.ts` (in-memory/JSON store & pseudo-vector search)
  * `ecommerce-ai-platform/ai_platform_config.json` (central JSON config)
  * `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py` (DifyRAGService)
  * `ecommerce-ai-platform/ai-eval/evaluate_dify_rag.py` & `frontend/src/app/api/ai/admin/eval/route.ts`
  * `backend/aurabook_apps/ai_search/` (Saleor hybrid & rag views with gemini_client.py)
  * `.env`, `.env.example`, docker-compose files
- **Key findings**:
  1. AI Reading does NOT call Dify RAG at all; it queries local `graphRAGStore` and falls back to Ollama/Gemini/canned dynamic fallback.
  2. Dify config in `ai_platform_config.json` has dummy keys (`app-aurabook-rag-dev-key`), which are blocked or non-functional.
  3. Prompts strictly force a 3-part philosophical essay for ALL questions, leading to off-topic answers for simple/conversational/factual questions.
  4. Context chunking is truncated to 300 chars x 2 chunks (~600 chars), causing severe lack of grounding.
  5. Fallback mechanisms swallow errors and output canned templates rather than answering the user.
- **Unexplored areas**: None for AI Reading scope. Full pipeline mapped.

## Key Decisions Made
- Structured root-cause findings into 5 clear categories: Architecture Disconnect, Configuration & Keys, Prompt Engineering, Grounding & Context, and Error/Fallback Handling.

## Artifact Index
- DISPATCH.md — Task assignment from orchestrator
- BRIEFING.md — Situational awareness and state
- progress.md — Liveness and progress heartbeat
- handoff.md — Final investigation report
