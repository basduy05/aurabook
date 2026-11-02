# Dispatch for Successor Orchestrator (orchestrator_r3)

## Task Assignment: Milestone 4 & Milestone 5 Execution
Resume work at `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\orchestrator_r3\`.
Read predecessor handoff at: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\orchestrator_r2\handoff.md`.
Read global requirements: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`.
Read global project plan: `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`.
Read test harness: `C:\Users\basduy05\Downloads\aurabook\TEST_READY.md`.

Your Parent Conversation ID: `129c216e-c32f-429e-baa8-145fbb7830e6` (Top-level Parent Sentinel).
Immediately proceed to execute:
1. **Milestone 4: Voice Chat & Real-time Audio Grounding**:
   - Feature F9: Full Catalog Grounding (13 books in dynamic catalog, pricing for Bốn Thỏa Ước 49k/98k).
   - Feature F10: Voice Chat Latency & Fallback Hardening (reduce Ollama timeout from 15s to 2s with quick fallback).
   - Feature F11: LiveKit Agent Dify RAG Unblocking (remove `app-aurabook-rag-dev-key` short-circuit in `vietnamese_cskh_agent.py`, fix `sttBaseUrl`).
   - Feature F12: Audio Stream Consistency & Dynamic Speed (standardize to WAV PCM 22050Hz, dynamic speed parameter in Piper TTS).
   - Business Policies Grounding: 500k FreeShip, 7-day transit damage replacement, Hanoi warehouse origin (12 Duy Tân), Readium LCP single-tab lock.
2. **Milestone 5: Final Milestone (100% E2E Pass & Adversarial Coverage Hardening)**:
   - Pass all 55 test cases in `tests/ai_evaluation_suite.py`.
   - Tier 5 adversarial stress testing and coverage audit.
   - Comprehensive final verification.
