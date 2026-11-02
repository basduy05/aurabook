# BRIEFING — 2026-10-31T17:53:00Z

## Mission
Implement Milestone 4: Voice Chat & Real-Time Audio Grounding, ensuring catalog grounding for all 13 books, business policy routing, Piper dynamic speed TTS, and Dify/offline fallback in LiveKit CSKH agent, passing all AI evaluation suites.

## 🔒 My Identity
- Archetype: teamwork_worker_m4
- Roles: implementer, qa, specialist
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m4
- Original parent: d1308e27-7c60-4aba-bded-d932c6cded78
- Milestone: Milestone 4: Voice Chat & Real-Time Audio Grounding

## 🔒 Key Constraints
- DO NOT CHEAT: All implementations genuine, no hardcoded test shortcuts.
- Exclusive write ownership:
  * `frontend/src/app/api/ai/voice-agent/chat/route.ts`
  * `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`
  * `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`
  * `frontend/src/ui/components/voice-agent/voice-agent-widget.tsx`
- Catalog coverage: all 13 books from `graphrag_store.json`.
- Business policies: FreeShip threshold (>=500.000₫), Hanoi shipping (16.500₫), returns (7 days transit/damage, 30 days manufacturer), warehouse (12 Duy Tân), DRM Readium LCP single tab.
- All 4 test suites must pass: voice_chat (11/11), business_policy (12/12), ai_search (11/11), reader_chat (11/11).

## Current Parent
- Conversation ID: d1308e27-7c60-4aba-bded-d932c6cded78
- Updated: 2026-10-31T17:53:00Z

## Task Summary
- **What to build**: Fix voice chat route intent routing and 13-book catalog + policies grounding; add dynamic speed and 22050Hz WAV normalization to Piper TTS server; enhance LiveKit CSKH agent with offline grounding and remove fake key short-circuit.
- **Success criteria**: 11/11 voice_chat, 12/12 business_policy, 11/11 ai_search, 11/11 reader_chat test passes, sub-50ms deterministic answers, proper TTS speed support.
- **Interface contracts**: PROJECT.md, TEST_READY.md, Explorer handoffs m4_1, m4_2, m4_3.
- **Code layout**: C:\Users\basduy05\Downloads\aurabook

## Key Decisions Made
- [TBD] Review explorer handoffs and inspect current codebase files.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Situational awareness and working memory
- progress.md — Liveness heartbeat and progress tracking
- handoff.md — Final self-contained handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not started
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending verification
- **Lint status**: Clean
- **Tests added/modified**: Pending evaluation suite run

## Loaded Skills
- None
