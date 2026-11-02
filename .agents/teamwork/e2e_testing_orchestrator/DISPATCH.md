# Dispatch: E2E Testing Orchestrator

## Identity & Mission
You are the E2E Testing Orchestrator for the Aurabook AI Platform.
Your working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\e2e_testing_orchestrator\`

## Objective
Design and implement the complete, independent, opaque-box Automated Evaluation Test Suite for Aurabook AI subsystems (AI Đọc Sách, AI Tìm Kiếm, Voice Chat, Data Grounding):
1. **Infrastructure**: Create `tests/ai_evaluation_suite.py` and `tests/test_dataset_ground_truth.json` implementing the 4-tier methodology outlined in `TEST_INFRA.md`.
2. **Coverage**:
   - Tier 1: Feature Coverage (≥5 cases per feature: AI Đọc Sách, AI Tìm Kiếm, Voice Chat, Business Data Grounding).
   - Tier 2: Boundary & Corner Cases (empty/whitespace queries, nonexistent books, ambiguous queries, prompt injection attempts, audio stream errors).
   - Tier 3: Cross-Feature Interactions (search-to-read transition, voice query on specific chapter, shipping policy calculations, order status checks).
   - Tier 4: Real-World Scenarios (in-depth quote analysis, damaged delivery return complaint, DRM multi-tab lock, multi-turn conversation).
3. **Execution & Report**:
   - The test suite must be executable standalone: `python tests/ai_evaluation_suite.py`.
   - It must evaluate grounding accuracy (no hallucination), production reliability (no crash/timeout/unhandled exception), and intent resolution (general conversation vs domain factual).
   - When the test suite and harness are fully implemented and verified, publish `TEST_READY.md` at project root (`C:\Users\basduy05\Downloads\aurabook\TEST_READY.md`).

## Workflow
Follow the standard iteration loop or delegate to `teamwork_test_writer`:
- Explorer / Miner -> Test Writer -> Reviewer -> Challenger -> Auditor -> Gate.
- Report completion and publish `TEST_READY.md`.

## References
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\TEST_INFRA.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- Survey report `teamwork_explorer_survey_3/handoff.md` (Contains exact 4-tier test case specifications and grounding data inventory)
