# BRIEFING — 2026-10-31T17:49:00Z

## Mission
Investigate Piper TTS Server audio consistency & speed parameter, LiveKit Agent Dify RAG unblocking & STT config, and formulate code blueprint for Worker M4.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m4_2
- Original parent: d1308e27-7c60-4aba-bded-d932c6cded78
- Milestone: Milestone 4: Voice Chat & Real-Time Audio Grounding

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do not modify source files
- Files for content delivery, send_message for coordination

## Current Parent
- Conversation ID: d1308e27-7c60-4aba-bded-d932c6cded78
- Updated: 2026-10-31T17:49:00Z

## Investigation State
- **Explored paths**:
  - `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`
  - `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`
  - `ecommerce-ai-platform/ai_platform_config.json`
  - `ecommerce-ai-platform/data/graphrag_store.json`
  - `frontend/src/app/api/ai/voice-agent/chat/route.ts`
  - `frontend/src/app/api/ai/tts/route.ts`
  - `tests/ai_evaluation_suite.py` & `tests/test_dataset_ground_truth.json`
- **Key findings**:
  1. Piper TTS Server:
     - `handle_tts_api` hardcodes `speed = 1.0` and ignores request parameter.
     - `AUDIO_CACHE` hardcodes `_1.00_` in cache keys, leading to cache contamination across different playback speeds.
     - Fallback Edge-TTS generates MP3 with sample rate 24000Hz while Piper generates 22050Hz WAV; `/v1/audio/speech` declares `content_type="audio/wav"` even for MP3 body.
     - Verified that Piper's `SynthesisConfig(length_scale=1.0/speed)` works natively and changes audio duration (0.8x -> 1.02s, 1.0x -> 1.00s, 1.5x -> 0.78s).
     - Verified PyAV (`av` 18.1.0) can transcode MP3 fallback to WAV PCM 22050Hz mono.
  2. LiveKit CSKH Agent:
     - Located `app-aurabook-rag-dev-key` short-circuit (lines 89-95) returning hardcoded DRM Readium LCP text for 100% of queries.
     - Located `sttBaseUrl: "http://localhost:8000/v1"` collision with Saleor Django backend.
     - Designed `LocalKnowledgeBase` fallback for Dify RAG queries covering all 13 catalog books and business policies (500k FreeShip, 12 Duy Tân Hanoi warehouse, 7-day/30-day return, single-tab DRM lock).
- **Unexplored areas**: None within M4-2 scope.

## Key Decisions Made
- Produced exact step-by-step code blueprint for Worker M4 with exact line numbers and code drop-in replacements.
- Documented in `handoff.md`.

## Artifact Index
- DISPATCH.md — Dispatch instructions
- BRIEFING.md — Situational awareness and working memory
- progress.md — Liveness heartbeat and activity tracking
- handoff.md — Comprehensive investigation report and code blueprint
