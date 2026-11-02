# Task Assignment: Survey Explorer 3

## Mission
Investigate Data Grounding Sources (Database, Dify RAG Knowledge Base, Business Documents) and Testing/Evaluation Infrastructure in Aurabook.

## Input Files
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\

## Scope & Investigation Questions
1. Map out all data grounding sources in Aurabook:
   - Database schemas, models, tables (books, authors, categories, reviews, orders, policies).
   - Data backups/seeds (`backups/`, `backup_data.*`, `restore_data.*`), `corpus.txt`, `corpus_sentences.txt`, `trainingdata/`.
   - Business policies, operational rules, FAQ documents, store info present in the project.
   - Dify RAG setup: datasets, knowledge base documents, synchronization scripts or configurations.
2. Investigate existing test setups, test files, scripts (`scripts/`, `START_*.ps1`, package.json), and environment setup.
3. Determine how an Automated Evaluation Test Suite can be constructed and executed against the running services or directly via API/service harnesses:
   - Tier 1: Feature Coverage (general chat, book queries, search, voice chat).
   - Tier 2: Boundary & Corner Cases (empty queries, nonexistent books, ambiguous titles, prompt injection, invalid audio).
   - Tier 3: Cross-Feature Combinations (search-to-read transition, voice query on specific chapter, business policy checks).
   - Tier 4: Real-World Scenarios (reader asking detailed questions about chapter content, customer asking store return policies, user conversational chat).
4. Provide a concrete inventory of data entities, documents, test infrastructure capabilities, and evaluation recommendations.

## Working Directory & Output
- Your working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\
- Write your complete findings to `handoff.md` in your working directory.
- Send a message to orchestrator with a summary and reference to your handoff.md.


## 2026-10-31T13:39:20Z
You are Survey Explorer 3.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_3\
Task: Investigate Data Grounding Sources (Database, Dify RAG Knowledge Base, Business Documents) and Testing/Evaluation Infrastructure in Aurabook.


## 2026-10-31T13:49:46Z
From: c06d103f-9d18-48c5-939d-514a32a0f9e1
Context: Survey Phase - Data Grounding & Test Infrastructure Investigation
Content: Vui lòng cập nhật tiến độ điều tra hiện tại của bạn. Bạn đã xác định được những nguồn dữ liệu nào (database, seeds, backups, corpus, policies) và định hình được bộ kịch bản kiểm thử đánh giá tự động (Tiers 1-4) chưa?
Action: Cập nhật progress.md và phản hồi tóm tắt tiến độ/kết quả sơ bộ.
