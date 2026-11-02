# Task Assignment: Milestone 2 Explorer 1

- **Role**: teamwork_explorer
- **Working Directory**: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_1\
- **Scope**: Reader AI Backend Route (`frontend/src/app/api/ai/reader-chat/route.ts`), Dify RAG API integration, GraphRAG fallback, Context expansion, Timeout hardening.
- **References**:
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
  - `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
  - `C:\Users\basduy05\Downloads\aurabook\TEST_READY.md`
  - `C:\Users\basduy05\Downloads\aurabook\tests\test_dataset_ground_truth.json` (Tests TC-T1-01 to TC-T1-06, TC-T2-01 to TC-T2-03, TC-T3-01 to TC-T3-03, TC-T4-01 to TC-T4-02)

## Instructions:
1. Investigate `frontend/src/app/api/ai/reader-chat/route.ts`:
   - Inspect the current Dify API call logic (`${difyApiUrl}/chat-messages` vs `/datasets/{id}/retrieve`).
   - Identify why Dify is disconnected or returning fallbacks.
   - Inspect context truncation: where is `content.slice(0, 300)` located? How should it be expanded to 1500-2000 chars?
   - Inspect timeouts: where is the 28s timeout? How should it be reduced to 6-8s?
   - Inspect Gemini API fallback and API key verification.
2. Formulate a precise, code-level remediation blueprint for the Worker.
3. Write your report to `handoff.md` in your working directory.
4. Notify orchestrator via message when complete.
