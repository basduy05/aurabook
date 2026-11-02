# BRIEFING — 2026-10-31T14:41:00Z

## Mission
Analyze remediation for frontend/src/lib/graphrag/graph-store.ts regarding stop words, anti-hallucination token overlap, and abbreviations.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_it2_1
- Original parent: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Milestone: M1 Iteration 2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in source code
- Formulate exact algorithmic anti-hallucination logic
- Support abbreviations in searchProductsByContext
- Document exact code changes and verification in handoff.md

## Current Parent
- Conversation ID: c06d103f-9d18-48c5-939d-514a32a0f9e1
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `frontend/src/lib/graphrag/graph-store.ts` (lines 1300-1600)
  - `frontend/src/lib/graphrag/graph-store.adversarial.test.ts` (118 tests, 2 failing: "cách nấu phở bò" and "chúa tể những chiếc nhẫn")
  - `frontend/src/lib/graphrag/graph-store.test.ts` (19 tests, all passing)
  - `tests/test_challenger_m1_repro.py` (3 bug categories: out-of-catalog hallucination, missed abbreviations, unaccented stop words)
  - `frontend/src/app/api/ai/graphrag/search/route.ts`
- **Key findings**:
  1. VIETNAMESE_STOP_WORDS contained only accented forms while `tokenize()` stripped diacritics, causing unaccented stop words ("cuon", "sach", "nhung", "de", "cach") to pass through into meaningfulTokens.
  2. Single isolated 1-syllable token hits ("cach", "te", "nhan") triggered `score += 1.0` without requiring any minimum overlap ratio (e.g. 1/4 = 25% overlap in "cách nấu phở bò"). Coupled with baseline vector chunk similarity (>0.28 adding ~0.26), score reached 1.25 >= 1.2 threshold, triggering `hasDirectMatch = true` and pulling random books with 97% similarity.
  3. `searchProductsByContext` did not call `resolveBookEntity` or inspect `BOOK_CATALOG_MAPPING.abbreviations`, returning 0 results for queries like "dnt", "đnt", "btu", "cttt 2".
- **Unexplored areas**: None. Root causes and algorithmic fix fully mapped out.

## Key Decisions Made
- Designed a 4-part algorithmic remediation:
  1. `VIETNAMESE_STOP_WORDS` storing both accented and unaccented forms, with expanded coverage including "cach", "huong", "dan", "chiec".
  2. Integration of `resolveBookEntity(cleanQuery)` and `mapping.abbreviations` at the start of `searchProductsByContext`, granting priority score (+6.0).
  3. Title token overlap guardrail: single tokens in multi-token queries (>1 token) do NOT score unless >= 2 tokens match OR overlap ratio >= 50%.
  4. Vector chunks restricted: similarity only added if strong grounding signal exists or similarity is genuinely high (>0.45).
  5. Direct match threshold raised from 1.2 to 2.0 with requirement of `hasStrongGroundingSignal`.

## Artifact Index
- DISPATCH.md — Task assignment and instructions
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat
- handoff.md — Complete 5-component handoff report with exact replacement code
