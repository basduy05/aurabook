# Task Assignment: Explorer 1 for Milestone 4 (Voice Agent Route & Catalog Grounding)

## 2026-10-31T17:37:21Z
Technical Investigation for Milestone 4: Voice Chat & Real-Time Audio Grounding (Voice Agent API Route Focus).
MANDATORY: You MUST read ORIGINAL_REQUEST.md:
C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
Also read:
C:\Users\basduy05\Downloads\aurabook\PROJECT.md
C:\Users\basduy05\Downloads\aurabook\TEST_READY.md

Your scope:
1. Examine `frontend/src/app/api/ai/voice-agent/chat/route.ts` and `frontend/src/ui/components/voice-agent/voice-agent-widget.tsx`.
2. Feature F9 (Full Catalog Grounding for Voice Assistant):
   - Locate hardcoded 4-book `CATALOG` in `route.ts`. Trace why queries like "Cho tôi biết giá cuốn Bốn Thỏa Ước" fail or return out-of-catalog rejections.
   - Design dynamic integration with the 13-book catalog and GraphRAG store.
3. Feature F10 (Voice Chat Latency & Fallback Hardening):
   - Locate Ollama 15s timeout. Trace speech pauses and stalls.
   - Design reduction of timeout to 2-3s with quick healthcheck fallback.
4. Trace prompt engineering in `route.ts` for conversational natural responses vs grounded factual inquiries.
5. Provide a step-by-step code blueprint for the Worker.

Write your report to:
`C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m4_1\handoff.md`
Remember: Read-only, do not modify source files. When done, notify me via send_message.
