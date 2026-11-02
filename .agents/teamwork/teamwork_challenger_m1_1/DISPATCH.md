# Task Assignment: M1 Challenger 1

## Mission
Adversarially challenge the GraphRAG diacritics and entity resolution implementation.

## References
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\handoff.md`

## Adversarial Focus
1. Test stressful, complex unaccented variations and tricky Vietnamese inputs against `resolveBookEntity` and `searchProductsByContext`:
   - Out-of-catalog entities: "Harry Potter", "day nau an ngon", "Hồ Chí Minh", "truyen tranh doremon" -> MUST NOT return random books or hallucinate.
   - Tricky substrings: "dac nhan", "tu duy", "song hongbing", "kahneman", "zeze".
   - Special characters, numbers, mixed casing, extra whitespaces.
2. Run stress tests against the live endpoint `http://localhost:3000/api/ai/graphrag/search`.
3. Deliver verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\`
- Write challenge report to `handoff.md` and message orchestrator with verdict.

## 2026-10-31T14:23:32Z
From: c06d103f-9d18-48c5-939d-514a32a0f9e1
Content:
You are M1 Challenger 1.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\

First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\handoff.md

Challenge tasks:
1. Adversarially challenge GraphRAG diacritics and entity resolution against frontend/src/lib/graphrag/graph-store.ts and live endpoint http://localhost:3000/api/ai/graphrag/search.
2. Test out-of-catalog entities ("Harry Potter", "day nau an", "Hồ Chí Minh") — MUST NOT return random books.
3. Test tricky unaccented titles, abbreviations, and author queries.
4. Record verdict: APPROVE or REQUEST_CHANGES in handoff.md and notify me via send_message.
