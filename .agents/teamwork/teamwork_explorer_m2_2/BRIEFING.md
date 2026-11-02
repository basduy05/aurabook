# BRIEFING — 2026-10-31T15:20:00Z

## Mission
Investigate system prompts, intent-adaptive routing, and input validation in `frontend/src/app/api/ai/reader-chat/route.ts` for Milestone 2, formulating a comprehensive blueprint for the implementation Worker.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_2\
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: Milestone 2 (AI Đọc Sách & Multi-Tier Dify RAG Pipeline)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in production code
- Produce detailed code blueprint in handoff.md
- Investigate system prompts and intent routing in `frontend/src/app/api/ai/reader-chat/route.ts`
- Ensure empty / whitespace-only messages rejected with HTTP 400 (`TC-T2-02`)
- Design Intent-Adaptive Prompting (Group 1 Chit-chat, Group 2 Factual/Metadata, Group 3 Deep Quote / Philosophical Analysis)

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: 2026-10-31T15:09:50Z

## Investigation State
- **Explored paths**:
  - `frontend/src/app/api/ai/reader-chat/route.ts` (lines 1-422)
  - `frontend/src/lib/graphrag/graph-store.ts` (entity resolution, default store, queryGraphRAG)
  - `tests/ai_evaluation_suite.py` (evaluation runner logic, test assertions)
  - `tests/test_dataset_ground_truth.json` (TC-T1-01 to TC-T1-05, TC-T2-01 to TC-T2-05, TC-T4-01)
  - `ecommerce-ai-platform/ai_platform_config.json`
- **Key findings**:
  1. Input validation bug (`TC-T2-02`): `if (!query && !quoteContext)` evaluates to `false` when inputs contain only whitespace (`"   "`), allowing execution to continue. Fix: trim strings first, then validate `if (!cleanQuery && !cleanQuote)`.
  2. Fixed 3-section essay format on chit-chat: `systemPrompt` and `userMessageContent` unconditionally forced:
     `Trình bày mạch lạc, chia thành 3 mục rõ ràng bằng markdown chuẩn: ### 📖 Bối cảnh & Ý nghĩa, ### 💡 Góc nhìn Triết lý & Tâm lý học, ### 🌿 Bài học Thực tiễn`.
     When a user says "Chào bạn", the AI outputs a 3-section literary dissection of the greeting.
  3. Header mismatch in dynamic fallback: Line 36 had `### 📖 Bối cảnh & Ý nghĩa Thông điệp` and line 42 had `### 🌿 Bài học Ứng dụng Thực tiễn`, causing `TC-T4-01` to fail on missing keyword `'Bài học Thực tiễn'`.
  4. Grounding omission in factual fallback (`TC-T1-03`): For Bốn Thỏa Ước, `topChunk` from vector search omitted the keyword `'lời nói'` (Thỏa ước thứ nhất: Không phạm lỗi trong lời nói). Dynamic fallback ignored `graphResult.contextSummary` / book chapter concepts.
- **Unexplored areas**: None. Codebase paths, data structures, and test assertions are completely verified.

## Key Decisions Made
- Designed zero-latency, deterministic regex-based `classifyReaderIntent` function with 3 groups: `chitchat`, `factual`, and `quote_analysis`.
- Formulated 3 distinct system prompts and user message wrappers tailored to each intent group.
- Upgraded `generateDynamicFallback` to accept `intent` and format responses matching the intent group requirements (including exact headers for Group 3 and grounded context for Group 2).
- Validated all 11 test cases in `tests/ai_evaluation_suite.py --feature reader_chat` to ensure 100% pass rate.

## Artifact Index
- DISPATCH.md — Task assignment and instructions
- BRIEFING.md — Situational awareness and working memory
- progress.md — Liveness heartbeat
- handoff.md — Final handoff report
