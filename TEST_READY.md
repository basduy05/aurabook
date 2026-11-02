# TEST_READY: Aurabook AI Platform Automated Evaluation Harness

**Status:** READY  
**Date:** 2026-10-31  
**Author:** teamwork_test_writer_e2e  
**Scope:** E2E Automated Evaluation Suite across AI Đọc Sách, AI Tìm Kiếm, Voice Chat, and Business Policies

---

## 1. Test Suite Overview

An independent, opaque-box Automated Evaluation Harness has been established directly from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.

### Core Artifacts:
1. **`tests/test_dataset_ground_truth.json`**: Ground-truth Q&A dataset containing 55 test cases spanning 4 Tiers, complete with input schemas, required/forbidden keywords, intent classifications, and grounding sources.
2. **`tests/ai_evaluation_suite.py`**: Evaluation test runner evaluating:
   - **Production Reliability**: HTTP status code, latency <= 10s, valid JSON structure, audio Base64 validity.
   - **Grounding & Accuracy**: Strict factual grounding against system PostgreSQL DB, GraphRAG knowledge graph, GHN shipments, and CMS policy documents with zero hallucination tolerance.
   - **Intent Resolution**: Intent classification verification (greeting vs metadata vs quote analysis vs business policies).
3. **`tests/ai_evaluation_report.json`**: Machine-readable JSON execution audit.
4. **`tests/ai_evaluation_report.md`**: Human-readable Markdown diagnostic report.

---

## 2. Test Coverage & Feature Inventory (55 Test Cases)

| Tier | Focus Area | Minimum Required | Actual Cases | Current Pass Rate | Target Milestone |
|---|---|:---:|:---:|:---:|:---:|
| **Tier 1** | **Feature Coverage** (AI Đọc Sách, AI Tìm Kiếm, Voice Chat, Policies) | 20 | 20 | 65.0% (13/20) | M1, M2, M3, M4 |
| **Tier 2** | **Boundary & Corner Cases** (Empty, injection, non-existent, long context) | 20 | 20 | 80.0% (16/20) | M1, M2, M3, M4 |
| **Tier 3** | **Cross-Feature Combinations** (Search-to-read, voice chapter, freeship math) | 10 | 10 | 60.0% (6/10) | M1, M3, M4 |
| **Tier 4** | **Real-World Scenarios** (In-depth quote, damaged complaint, DRM conflict) | 5 | 5 | 0.0% (0/5) | M2, M4, M5 |
| **Total** | **Full System Evaluation** | **55** | **55** | **63.6% (35/55)** | **M5 (100%)** |

### Breakdown by Subsystem:
- **AI Đọc Sách (`reader_chat`)**: 11 test cases (8 Pass, 3 Fail/Pending)
- **AI Tìm Kiếm (`ai_search`)**: 11 test cases (10 Pass, 1 Fail/Pending)
- **Voice Chat (`voice_chat`)**: 11 test cases (9 Pass, 2 Fail/Pending)
- **Business Policies (`business_policy`)**: 12 test cases (2 Pass, 10 Fail/Pending)
- **Cross-Feature (`cross_feature`)**: 10 test cases (6 Pass, 4 Fail/Pending)

---

## 3. How to Execute the Test Suite

### Full Suite Run:
```bash
python tests/ai_evaluation_suite.py
```
*(Returns exit code 0 when all tests pass; non-zero on failure)*

### Milestone Progression Run (allows pending milestone features without runner crash):
```bash
python tests/ai_evaluation_suite.py --allow-pending
```

### Targeted Filtered Runs:
```bash
# Run specific Tier (e.g., Tier 1):
python tests/ai_evaluation_suite.py --tier 1

# Run specific feature subsystem:
python tests/ai_evaluation_suite.py --feature ai_search
python tests/ai_evaluation_suite.py --feature voice_chat
python tests/ai_evaluation_suite.py --feature reader_chat

# Run single test case by ID:
python tests/ai_evaluation_suite.py --id TC-T1-07
```

### Pytest Integration:
```bash
pytest tests/ai_evaluation_suite.py
```

---

## 4. Key Implementation Bugs Discovered & Escalated

The test runner executed cleanly in 11.7 seconds, successfully isolating the exact defects for implementation agents:

1. **[M1/M3 Escalate] Vietnamese Diacritics Normalization in Search (`TC-T1-07`, `TC-T3-02`)**:
   - `GET /api/ai/graphrag/search?query=dac+nhan+tam` returns `Tư Duy Nhanh Và Chậm` instead of `Đắc Nhân Tâm`.
   - **Root Cause**: `graph-store.ts` does not strip diacritics before matching query strings.

2. **[M2 Escalate] Reader Chat Whitespace Bypasses Validation (`TC-T2-02`)**:
   - `POST /api/ai/reader-chat` with `{"query": "   "}` returns status 200 instead of status 400.
   - **Root Cause**: `reader-chat/route.ts` line 88 checks `if (!query)` without `.trim()`.

3. **[M4 Escalate] Voice Agent Catalog Grounding Gaps (`TC-T1-13`)**:
   - `POST /api/ai/voice-agent/chat` with body `{"query": "Cho tôi biết giá cuốn Bốn Thỏa Ước"}` fails to quote 49.000₫ / 98.000₫.
   - **Root Cause**: Hardcoded 4-book CATALOG array in `voice-agent/chat/route.ts` lacks dynamic catalog expansion.

4. **[M1/M4 Escalate] Business Policy Grounding Gaps (`TC-T1-16`, `TC-T1-17`, `TC-T1-18`, `TC-T1-19`)**:
   - Questions regarding the 500k FreeShip threshold, 7-day transit damage replacement, Hanoi warehouse origin (12 Duy Tân), and Readium LCP single-tab lock are missing required grounding facts.
   - **Root Cause**: Knowledge stores in Voice Agent do not yet incorporate CMS policy documents and GHN shipping zones.

5. **[M2 Escalate] Reader Chat 3-Section Literary Analysis Grounding (`TC-T4-01`)**:
   - Reader Chat fallback does not structure the full 3-part Markdown format (`### 📖 Bối cảnh & Ý nghĩa`, `### 💡 Góc nhìn Triết lý`, `### 🌿 Bài học Thực tiễn`) when LLM is in offline fallback mode.

---

## 5. Acceptance Verification

- [x] Test runner executes completely without unhandled exceptions or crashes.
- [x] Validated against live running endpoints on ports 3000, 8000, and 5050.
- [x] Generates both `tests/ai_evaluation_report.json` and `tests/ai_evaluation_report.md`.
- [x] Opaque-box, requirement-driven assertions derived directly from `ORIGINAL_REQUEST.md`.
