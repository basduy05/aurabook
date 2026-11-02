# Task Assignment: Milestone 1 Explorer 2

## Mission
Analyze exact code and database schema modifications needed in `backend/aurabook_apps/ai_search/` (`models.py`, `search.py`, `tasks.py`).

## Reference Files
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\basduy05\Downloads\aurabook\PROJECT.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md`
- `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`

## Specific Analysis Questions
1. How to fix the `BookChunk` model in `models.py` to use pgvector `vector(768)` or pgvector-python `VectorField` instead of `BinaryField` (`bytea`).
2. How to write a Django migration or SQL DDL (`ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768)`) that runs cleanly inside the `aurabook-postgres` container.
3. How to fix `backend/aurabook_apps/ai_search/search.py` so the raw SQL query `(embedding <=> %s::vector)` executes with no type error and returns valid distances.
4. How to improve the fulltext fallback so that when vector distance is not available, it uses case-insensitive and diacritics-insensitive search.

## Working Directory & Output
- Working directory: `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\`
- Write findings and concrete implementation plan to `handoff.md`.
- Send message to orchestrator with summary.

## 2026-10-31T13:55:20Z
Sender: c06d103f-9d18-48c5-939d-514a32a0f9e1
Content:
You are M1 Explorer 2.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\
You are a read-only exploration agent. Do NOT write or edit source code files directly.
First, read:
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\PROJECT.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\sub_orch_m1\SCOPE.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_2\DISPATCH.md
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\handoff.md

Investigate backend/aurabook_apps/ai_search/ (models.py, search.py, tasks.py):
1. How to fix the BookChunk model to store embeddings properly compatible with PostgreSQL pgvector (vector(768)).
2. Detail the exact DDL or migration command needed in Django and PostgreSQL container to convert the column type from bytea to vector(768).
3. Detail how to fix the raw SQL query in search.py ((embedding <=> %s::vector)) so it executes without type mismatch.
4. Detail the fulltext fallback improvement.
5. Write your complete analysis and recommended implementation code to handoff.md in your working directory and notify me via send_message.

## 2026-10-31T14:04:34Z
Sender: c06d103f-9d18-48c5-939d-514a32a0f9e1
Content:
**Context**: Milestone 1 Explorer Investigation
**Content**: Vui lòng cập nhật tiến độ biên soạn handoff.md cho phần việc sửa đổi Django pgvector và raw SQL trong ai_search.
**Action**: Gửi handoff.md khi hoàn tất hoặc tóm tắt tiến độ.
