# Task Assignment: Milestone 2 Worker

- **Role**: teamwork_worker
- **Working Directory**: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m2\
- **Scope**: Features F4, F5, F6: AI Đọc Sách & Multi-Tier Dify RAG Pipeline.
- **Files Owned (Exclusive Write Ownership)**:
  1. `frontend/src/app/api/ai/reader-chat/route.ts`
  2. `frontend/src/lib/graphrag/vector-store.ts`
  3. `frontend/src/ui/components/reader/drm-web-reader.tsx`
- **References**:
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
  - `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
  - `C:\Users\basduy05\Downloads\aurabook\TEST_READY.md`
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_1\handoff.md`
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_2\handoff.md`
  - `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m2_3\handoff.md`

## MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Implementation Tasks:
1. In `frontend/src/app/api/ai/reader-chat/route.ts`:
   - Load Dify config from `ai_platform_config.json` / env vars (`apiUrl`, `apiKey`, `datasetId`, `topK`).
   - Implement Dify API caller (`/chat-messages`) with 4-second timeout (`AbortSignal.timeout(4000)`).
   - Fix input validation (`TC-T2-02`): `.trim()` first, then check `if (!cleanQuery && !cleanQuote) return NextResponse.json({ error: "Query hoặc quoteContext là bắt buộc" }, { status: 400 });`.
   - Context expansion: expand `ragChunksText` to top 3 chunks with up to 1800 characters each (eliminate 300-char truncation).
   - Timeout reduction: reduce Ollama timeout from 28s to 6.5s; reduce Gemini timeout to 6s; add Gemini fallback in non-streaming mode.
   - Implement Intent-Adaptive Prompting and Fallback:
     * Group 1 (Greeting/Chit-chat): Polite 1-2 sentence response without 3-section essay.
     * Group 2 (Factual/Metadata/Themes): Grounded concise response; for *Bốn Thỏa Ước*, ground First Agreement on "lời nói" (`TC-T1-03`).
     * Group 3 (Deep Quote Analysis): Structured 3-section essay with exact headers:
       `### 📖 Bối cảnh & Ý nghĩa`
       `### 💡 Góc nhìn Triết lý & Tâm lý học`
       `### 🌿 Bài học Thực tiễn` (`TC-T4-01`).
2. In `frontend/src/lib/graphrag/vector-store.ts`:
   - In `searchVectorChunks`, include `c.chapterTitle` in lexical matching: `(c.content + " " + (c.chapterTitle || "")).toLowerCase()`.
   - Add lexical bonus when query keywords match `c.chapterTitle`.
3. In `frontend/src/ui/components/reader/drm-web-reader.tsx`:
   - Extend `AIMessage` with `isError?: boolean`, `errorType?: string`, `errorMessage?: string`, `retryPrompt?: { query: string; quoteContext?: string }`.
   - Parse `res.json()` on error responses (`!res.ok`) to surface server error messages.
   - Eliminate deceptive deflection message in `catch (e)`; render transparent error state with "Thử lại" (Retry) action.
   - Handle mid-stream network drops cleanly.

## Verification Requirements:
Run:
```powershell
python tests/ai_evaluation_suite.py --feature reader_chat
```
Target: **11/11 passed (100.0%)**, zero unhandled exceptions, zero timeouts.
Run:
```powershell
pnpm --prefix frontend test:run src/lib/graphrag/graph-store.adversarial.test.ts
pnpm --prefix frontend test:run src/lib/graphrag/graph-store.test.ts
```
Target: 100% pass, zero regressions.

Write your complete implementation report to `handoff.md` in your working directory and notify the orchestrator.
