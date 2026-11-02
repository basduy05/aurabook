## 2026-10-31T17:51:54Z
You are teamwork_worker_m4.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m4\

You are the Implementation Worker for Milestone 4: Voice Chat & Real-Time Audio Grounding.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: You MUST read ORIGINAL_REQUEST.md:
C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
Also read:
C:\Users\basduy05\Downloads\aurabook\PROJECT.md
C:\Users\basduy05\Downloads\aurabook\TEST_READY.md

Read the 3 Explorer handoff reports for complete blueprints, root causes, and exact code implementations:
1. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m4_1\handoff.md (Voice Route & Catalog Grounding blueprint)
2. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m4_2\handoff.md (Piper TTS Server & LiveKit Agent blueprint)
3. C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m4_3\handoff.md (Business Policy Grounding & Test Suite blueprint)

Exclusive Write Ownership:
- `frontend/src/app/api/ai/voice-agent/chat/route.ts`
- `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`
- `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`
- `frontend/src/ui/components/voice-agent/voice-agent-widget.tsx`

Tasks:
1. In `frontend/src/app/api/ai/voice-agent/chat/route.ts`:
   - Expand `CATALOG` from 4 books to all 13 books using data from `graphrag_store.json` (including *Tư Duy Nhanh Và Chậm*, *Bốn Thỏa Ước*, *Sapiens*, *Trí Tuệ Do Thái*, *Cây Cam Ngọt Của Tôi*, *Bí Mật Của Một Trí Nhớ Siêu Phàm*, *10 Điều Tạo Nên Số Phận*, *Cách Nghĩ Để Thành Công*, *Chủ Nghĩa Khắc Kỷ*, *Chiến Tranh Tiền Tệ Tập 1, 2, 3*...).
   - Fix intent routing: Add explicit `isPriceInquiry` branch quoting both Ebook DRM (49.000₫) and Physical (98.000₫) prices directly before generic content matching (preventing "thỏa ước" from intercepting price queries for *Bốn Thỏa Ước*).
   - Fix `isOrderInquiry` regex so general questions about shipping and returns are not hijacked as order ID lookups.
   - Add explicit handlers for Business Policies:
     * FreeShip threshold: orders >= 500.000₫ qualify for FreeShip; Hanoi shipping is 16.500₫.
     * Return policy: 7 days for transit damage / defect replacement; 30 days for manufacturer defects.
     * Warehouse origin: Hanoi warehouse (12 Duy Tân, Cầu Giấy, Hà Nội).
     * DRM Readium LCP: single-tab lock, multi-tab access denied.
     * Customer complaint handling: acknowledge damaged book, advise return window within 7 days, offer replacement.
   - Reduce LLM timeout from 15s to 2.5s for conversational queries; return deterministic data for factual inquiries immediately (<50ms).
2. In `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`:
   - Parse dynamic `speed` parameter (0.8x to 1.5x, default 1.0) in `handle_tts_api`.
   - Update cache key to incorporate dynamic `speed`.
   - Pass `SynthesisConfig(length_scale=1.0/speed)` to Piper engine.
   - Standardize output audio to WAV PCM 22050Hz (using PyAV resampler for Edge-TTS fallback).
3. In `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`:
   - Remove `app-aurabook-rag-dev-key` short-circuit at lines 89-95.
   - Add fallback grounding for all 13 books and policies when Dify is offline.
   - Fix `sttBaseUrl` collision with Django backend port 8000.
4. Comprehensive Verification:
   - `python tests/ai_evaluation_suite.py --feature voice_chat` (Must pass 11/11).
   - `python tests/ai_evaluation_suite.py --feature business_policy` (Must pass 12/12).
   - `python tests/ai_evaluation_suite.py --feature ai_search` (Must pass 11/11).
   - `python tests/ai_evaluation_suite.py --feature reader_chat` (Must pass 11/11).
   - Direct verification:
     * `curl -X POST http://localhost:5050/api/tts -H "Content-Type: application/json" -d "{\"text\": \"Xin chào AuraBook\", \"speed\": 1.2}"`
     * Verify `POST http://localhost:3000/api/ai/voice-agent/chat` quotes 49.000₫ / 98.000₫ for *Bốn Thỏa Ước*.
     * Verify policy inquiries return 500.000₫, 7 ngày, 12 Duy Tân, Readium LCP single tab.
