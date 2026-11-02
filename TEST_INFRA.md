# E2E Test Infra: Aurabook AI Platform

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on internal implementation design.
- Derived directly from `ORIGINAL_REQUEST.md` (Grounding & Accuracy, Production Reliability, Automated Verification across AI Đọc Sách, AI Tìm Kiếm, Voice Chat).
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | AI Đọc Sách (Reader AI Companion) | ORIGINAL_REQUEST §R1, R2, R3 | 5 | 5 | ✓ | ✓ |
| 2 | AI Tìm Kiếm (Semantic Book Search) | ORIGINAL_REQUEST §R1, R2, R3 | 5 | 5 | ✓ | ✓ |
| 3 | Voice Chat (Voice Assistant) | ORIGINAL_REQUEST §R1, R2, R3 | 5 | 5 | ✓ | ✓ |
| 4 | Data Grounding & Business Policies | ORIGINAL_REQUEST §R2, R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Python-based test runner at `tests/ai_evaluation_suite.py` executable via `python tests/ai_evaluation_suite.py` or `pytest tests/ai_evaluation_suite.py`.
- **Pass/Fail Semantics**: Exit code 0 on 100% pass; non-zero on any failure. Generates JSON & Markdown reports (`tests/ai_evaluation_report.json` and `tests/ai_evaluation_report.md`).
- **Test Scope**:
  - Direct HTTP calls to running endpoints:
    * `/api/ai/reader-chat` (AI Đọc Sách)
    * `/api/ai/graphrag/search` & `/aurabook/search/hybrid` (AI Tìm Kiếm)
    * `/api/ai/voice-agent/chat` & `/api/tts` (Voice Chat)
    * Dify RAG (`localhost:8080/v1`) & PostgreSQL connection
- **Directory Layout**:
  - `tests/`
    - `ai_evaluation_suite.py` (Main test suite runner)
    - `test_dataset_ground_truth.json` (Ground truth questions and expected answers)
    - `ai_evaluation_report.md` (Generated audit and evaluation report)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | In-depth Quote Context Analysis in Reader | Reader AI, GraphRAG, Intent-Adaptive Prompting | High |
| 2 | Customer Inquiry on Damaged Delivery & Return Policy | Voice/Chat, Policy Grounding, Order DB | Medium |
| 3 | DRM Multi-Tab Conflict Troubleshooting | Reader UI, DRM Session, Customer Support | Medium |
| 4 | Multi-Turn Conversational Book Consultation & Purchase | Search, Catalog, Pronoun Resolution, Farewell | High |
| 5 | Shipping Fee Calculation with 500k FreeShip Rule | Shipping Policies, Hanoi Warehouse, Cart Math | Medium |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (Minimum 20 test cases)
- Tier 2: ≥5 boundary & corner cases per feature (Minimum 20 test cases)
- Tier 3: Cross-feature combinations covering major feature pairs (Minimum 10 test cases)
- Tier 4: Realistic end-to-end application scenarios (Minimum 5 test cases)
- Total: ≥55 comprehensive test cases
