# Task Assignment: E2E Test Writer

## Mission
Author the complete, independent Automated Evaluation Test Suite for Aurabook AI Platform.

## Reference Files
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\TEST_INFRA.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\handoff.md`

## Scope & Implementation Requirements
1. Create `tests/test_dataset_ground_truth.json` containing ground-truth Q&A, metadata, and validation rules across 4 Tiers:
   - Tier 1: Feature Coverage (≥20 test cases covering AI Đọc Sách, AI Tìm Kiếm, Voice Chat, Store policies).
   - Tier 2: Boundary & Corner Cases (≥20 test cases covering empty queries, out-of-catalog books, ambiguous titles, prompt injection, invalid audio payloads).
   - Tier 3: Cross-Feature Combinations (≥10 test cases covering search-to-read, voice query on chapter, shipping calculations with 500k freeship, order tracking).
   - Tier 4: Real-World Scenarios (≥5 test cases covering in-depth quote analysis, damaged delivery return complaint, DRM single-tab conflict, multi-turn dialogue).
2. Create `tests/ai_evaluation_suite.py` that executes this test suite:
   - Sends real HTTP queries to running services or calls mockable service harnesses:
     * Reader Chat: `http://localhost:3000/api/ai/reader-chat`
     * AI Search: `http://localhost:3000/api/ai/graphrag/search` and `http://localhost:8000/aurabook/search/hybrid`
     * Voice Chat: `http://localhost:3000/api/ai/voice-agent/chat` and `http://localhost:5050/api/tts`
   - Evaluates:
     * Grounding & Accuracy (checks factual correctness against ground truth, flags hallucination).
     * Production Reliability (status 200, latency < 10s, valid JSON structure, audio base64 validity).
     * Intent Resolution (differentiates polite chitchat from factual knowledge).
   - Outputs:
     * `tests/ai_evaluation_report.json`
     * `tests/ai_evaluation_report.md`
3. Verify that the test suite runs cleanly: `python tests/ai_evaluation_suite.py`.
4. When verified and ready, create `C:\Users\basduy05\Downloads\aurabook\TEST_READY.md` following the template in `PROJECT.md` / `TEST_INFRA.md`.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_test_writer_e2e\`
- Write `handoff.md` in your working directory and notify the orchestrator when `TEST_READY.md` is published.

## 2026-10-31T13:55:36Z
You are E2E Test Writer.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_test_writer_e2e\
You write tests and test suites only. Do NOT modify product implementation code.
First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\TEST_INFRA.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_test_writer_e2e\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\handoff.md

Your mission:
1. Create tests/test_dataset_ground_truth.json containing ground-truth Q&A, metadata, and validation rules across 4 Tiers:
   - Tier 1: Feature Coverage (≥20 test cases covering AI Đọc Sách, AI Tìm Kiếm, Voice Chat, Store policies).
   - Tier 2: Boundary & Corner Cases (≥20 test cases covering empty queries, out-of-catalog books, ambiguous titles, prompt injection, invalid audio payloads).
   - Tier 3: Cross-Feature Combinations (≥10 test cases covering search-to-read, voice query on chapter, shipping calculations with 500k freeship, order tracking).
   - Tier 4: Real-World Scenarios (≥5 test cases covering in-depth quote analysis, damaged delivery return complaint, DRM single-tab conflict, multi-turn dialogue).
2. Create tests/ai_evaluation_suite.py that executes this test suite:
   - Sends real HTTP queries to running services or calls mockable service harnesses:
     * Reader Chat: http://localhost:3000/api/ai/reader-chat
     * AI Search: http://localhost:3000/api/ai/graphrag/search and http://localhost:8000/aurabook/search/hybrid
     * Voice Chat: http://localhost:3000/api/ai/voice-agent/chat and http://localhost:5050/api/tts
   - Evaluates Grounding & Accuracy, Production Reliability, and Intent Resolution.
   - Outputs tests/ai_evaluation_report.json and tests/ai_evaluation_report.md.
3. Run the test suite once to verify it executes cleanly (tests may fail if implementations are still pending, but runner must not crash).
4. When verified and ready, create C:\Users\basduy05\Downloads\aurabook\TEST_READY.md following the template in PROJECT.md / TEST_INFRA.md.
5. Write handoff.md in your working directory and notify me via send_message.

