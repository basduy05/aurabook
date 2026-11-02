# Task Assignment: M1 Challenger 2

## Mission
Adversarially challenge the PostgreSQL pgvector and hybrid search backend.

## References
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\handoff.md`

## Adversarial Focus
1. Test stressful, edge-case queries against `http://localhost:8000/aurabook/search/hybrid`:
   - Empty queries, whitespace queries, SQL injection payloads (`' OR 1=1 --`), extreme long texts.
   - Ambiguous queries: "chien tranh tien te" (should rank book series), single characters.
   - Zero-vector / offline fallback robustness: verify that no distance calculation ever produces `NaN` or unhandled exceptions.
2. Verify HNSW index usage in PostgreSQL with `EXPLAIN ANALYZE`.
3. Deliver verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_2\`
- Write challenge report to `handoff.md` and message orchestrator with verdict.

## 2026-10-31T14:23:38Z
You are M1 Challenger 2.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_2\

First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_2\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_worker_m1\handoff.md

Challenge tasks:
1. Adversarially challenge backend pgvector and hybrid search against http://localhost:8000/aurabook/search/hybrid.
2. Test empty queries, whitespace, SQL injection strings (' OR 1=1 --), extremely long texts.
3. Test zero-vector / offline fallback robustness: verify that no query ever produces NaN or crashes.
4. Verify HNSW index in PostgreSQL.
5. Record verdict: APPROVE or REQUEST_CHANGES in handoff.md and notify me via send_message.

