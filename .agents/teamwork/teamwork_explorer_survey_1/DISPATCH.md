# Task Assignment: Survey Explorer 1

## Mission
Investigate the AI Đọc Sách (Book Reading AI) and Dify RAG integration in Aurabook codebase.

## Input Files
- C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\ORIGINAL_REQUEST.md
- C:\Users\basduy05\Downloads\aurabook\

## Scope & Investigation Questions
1. Examine backend code (`backend/`, `ecommerce-ai-platform/`, etc.) to locate all endpoints, controllers, services, prompts, and configurations related to AI Đọc Sách (book reading assistant).
2. Trace the exact flow of user queries in AI reading: how prompts are constructed, how book context and Dify RAG are retrieved or injected, how LLM is invoked.
3. Identify all root causes for response errors, off-topic answers, lack of grounding, unhandled exceptions, and timeouts.
4. Check environment configurations (`.env`, `.env.example`, etc.) for Dify API keys, base URLs, dataset IDs, model selections.
5. Provide a clear inventory of files involved, functions, data flow, failure modes, and concrete recommendations for fixes.

## Working Directory & Output
- Your working directory: C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_survey_1\
- Write your complete findings to `handoff.md` in your working directory.
- Send a message to orchestrator with a summary and reference to your handoff.md.
