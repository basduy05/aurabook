# Task Assignment: Milestone 2 Explorer 2

- **Role**: teamwork_explorer
- **Working Directory**: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_2\
- **Scope**: Intent-Adaptive Prompting, Prompt Engineering, Input Validation in `frontend/src/app/api/ai/reader-chat/route.ts`.
- **References**:
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
  - `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
  - `C:\Users\basduy05\Downloads\aurabook\TEST_READY.md`
  - `C:\Users\basduy05\Downloads\aurabook\tests\ai_evaluation_suite.py`

## Instructions:
1. Investigate the system prompts in `frontend/src/app/api/ai/reader-chat/route.ts`:
   - Inspect why saying "chào bạn" returns a 3-section academic essay (`### 📖 Bối cảnh & Ý nghĩa`, etc.).
   - Design an intent classification and prompt routing system:
     * **Group 1 (Chit-chat / Greeting / General)**: Polite, natural 1-2 sentence reading companion response.
     * **Group 2 (Factual / Metadata / Pricing / Policy)**: Direct, concise, grounded answer with citations.
     * **Group 3 (Deep Quote Analysis / Literary Analysis)**: Deep 3-section structured response (`### 📖 Bối cảnh & Ý nghĩa`, `### 💡 Góc nhìn Triết lý & Tâm lý học`, `### 🌿 Bài học Thực tiễn`).
   - Check input validation: ensure empty or whitespace-only messages return HTTP 400 (`TC-T2-02`).
2. Formulate a precise, code-level remediation blueprint for the Worker.
3. Write your report to `handoff.md` in your working directory.
4. Notify orchestrator via message when complete.

## 2026-10-31T15:09:50Z
Sender: c06d103f-9d18-48c5-939d-514a32a0f9e1
Content: You are Explorer 2 for Milestone 2 (AI Đọc Sách & Multi-Tier Dify RAG Pipeline).
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_2\
Read DISPATCH.md in your working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_2\DISPATCH.md
Read ORIGINAL_REQUEST.md: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md: C:\Users\basduy05\Downloads\aurabook\PROJECT.md

Investigate system prompts and intent routing in `frontend/src/app/api/ai/reader-chat/route.ts`:
- Replace rigid 3-section academic essay format on chit-chat with Intent-Adaptive Prompting:
  * Group 1 (Greeting/Chit-chat): 1-2 polite, natural sentences as AuraBook AI reading companion.
  * Group 2 (Factual/Metadata/Pricing/Policy): Direct, concise grounded answer.
  * Group 3 (Deep Quote / Philosophical Analysis): Structured 3-section essay (`### 📖 Bối cảnh & Ý nghĩa`, `### 💡 Góc nhìn Triết lý & Tâm lý học`, `### 🌿 Bài học Thực tiễn`).
- Input validation: reject empty or whitespace-only messages with HTTP 400 (`TC-T2-02`).

Produce a detailed code blueprint in `handoff.md` in your working directory.
Send a message to orchestrator when finished.
