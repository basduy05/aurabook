# Task Assignment: Survey Explorer 2

## Mission
Investigate the AI Tìm Kiếm (AI Search) and Voice Chat subsystems in Aurabook codebase.

## Input Files
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\

## Scope & Investigation Questions
1. Locate all source code, routes, controllers, and services for AI Search (semantic book search, natural language queries, recommendation).
2. Trace the AI Search flow: how queries are parsed, how book catalog/vector database/Dify is queried, how ranking/results are generated. Why might it fail, return irrelevant results, or hallucinate?
3. Locate Voice Chat architecture: WebSocket endpoints, audio streaming, STT (Speech-to-Text), LLM/RAG integration, TTS (Text-to-Speech) (e.g. `vi_VN-hoaimy-aurabook.onnx`, `test_local.wav`, piper/onnx models).
4. Trace Voice Chat end-to-end pipeline: audio input -> transcript -> query routing -> knowledge grounding -> text generation -> audio synthesis -> audio output stream.
5. Identify why Voice Chat fails, lags, answers off-topic, crashes, or produces audio glitches.
6. Provide a detailed inventory of files involved, functions, data flow, failure modes, and concrete recommendations for fixes.

## Working Directory & Output
- Your working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\
- Write your complete findings to `handoff.md` in your working directory.
- Send a message to orchestrator with a summary and reference to your handoff.md.


## 2026-10-31T13:39:12Z
[Message] sender=c06d103f-9d18-48c5-939d-514a32a0f9e1
You are Survey Explorer 2.
Your working directory is: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_2\
Task: Investigate the AI Tìm Kiếm (AI Search) and Voice Chat subsystems in Aurabook (C:\Users\basduy05\Downloads\aurabook).


## 2026-10-31T13:49:42Z
[Message] sender=c06d103f-9d18-48c5-939d-514a32a0f9e1
**Context**: Survey Phase - AI Tìm Kiếm & Voice Chat Investigation
**Content**: Vui lòng cập nhật tiến độ điều tra hiện tại của bạn. Bạn đã xác định được những thành phần và nguyên nhân gốc rễ nào của AI Tìm Kiếm và Voice Chat? Khi nào bạn có thể hoàn thành handoff.md?
**Action**: Cập nhật progress.md và phản hồi tóm tắt tiến độ/kết quả sơ bộ.
