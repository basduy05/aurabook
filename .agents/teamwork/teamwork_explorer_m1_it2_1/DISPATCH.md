# Task Assignment: M1 Iteration 2 Explorer 1

## Mission
Analyze fix strategy for Challenger 1's findings on `frontend/src/lib/graphrag/graph-store.ts`.

## References
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\orchestrator\GATE_STATUS.md`
- Challenger 1 handoff: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\handoff.md`
- Challenger 1 repro: `C:\Users\basduy05\Downloads\aurabook\tests\test_challenger_m1_repro.py`

## Remediation Scope
1. Fix `VIETNAMESE_STOP_WORDS` to include both unaccented and accented words ("cuon", "sach", "nhung", "cac", "de", "cach", "hay", etc.).
2. Replace the fragile 11-word regex with an algorithmic, generalized anti-hallucination check:
   - For `hasDirectMatch` to be true, require either an exact title/slug match, a valid abbreviation match, or that the query's meaningful tokens have a strong overlap with the book's title/author tokens (e.g. at least 50% of query tokens match the title/author).
   - If a query has zero title/author token overlap and only matched generic content/subwords ("cách nấu phở bò", "chúa tể những chiếc nhẫn"), it MUST return `hasDirectMatch: false`, `products: []`.
3. Support abbreviations (`dnt`, `đnt`, `btu`, `cttt 1..3`) in `searchProductsByContext`.
4. Detail the exact code replacement for Worker.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_it2_1\`
- Write findings to `handoff.md` and message orchestrator.

## 2026-10-31T14:33:14Z
You are M1 Iteration 2 Explorer 1.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_it2_1\

First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\orchestrator\GATE_STATUS.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_it2_1\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_challenger_m1_1\handoff.md
- C:\Users\basduy05\Downloads\aurabook\tests\test_challenger_m1_repro.py

Analyze remediation for frontend/src/lib/graphrag/graph-store.ts:
1. Fix VIETNAMESE_STOP_WORDS with both unaccented and accented forms.
2. Formulate algorithmic anti-hallucination logic (requiring significant title/author token overlap, not just generic subwords or single words) so queries like "cách nấu phở bò" or "chúa tể những chiếc nhẫn" return hasDirectMatch: false, products: [].
3. Support abbreviations in searchProductsByContext.
4. Write exact code changes to handoff.md in your working directory and notify me via send_message.
