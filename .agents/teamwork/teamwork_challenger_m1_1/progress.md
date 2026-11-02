# Progress - M1 Challenger 1

Last visited: 2026-10-31T14:31:00Z

## Status
- [x] Initialized BRIEFING.md and DISPATCH.md
- [x] Inspected implementation in `frontend/src/lib/graphrag/graph-store.ts`, `vector-store.ts`, and endpoint `http://localhost:3000/api/ai/graphrag/search`
- [x] Created adversarial test suite covering:
  - Out-of-catalog queries ("Harry Potter", "day nau an", "Hồ Chí Minh", "doraemon", "truyen kiem hiep", "cách nấu phở bò", "chúa tể những chiếc nhẫn", etc.)
  - Tricky unaccented queries, casing, special symbols, extra spaces
  - Abbreviations, acronyms, subtitles, authors
  - Live HTTP endpoint calls
- [x] Executed empirical tests (Vitest and Python reproduction harness):
  - **FINDING 1 (CRITICAL)**: Out-of-catalog entity hallucination when queries escape the hardcoded 11-word regex list. For example, "cách nấu phở bò" returns 4 books (Chủ Nghĩa Khắc Kỷ 97% similarity), "chúa tể những chiếc nhẫn" returns 6 books (Chiến Tranh Tiền Tệ 97% similarity).
  - **FINDING 2 (MEDIUM)**: Accented stop words set (`VIETNAMESE_STOP_WORDS`) fails to filter unaccented query tokens ("cuon", "sach", "nhung", "de"), causing generic search queries ("cuốn sách hay") to match 6-7 books falsely.
  - **FINDING 3 (MEDIUM)**: Abbreviations ("dnt", "đnt", "btu", "cttt 2") supported in `resolveBookEntity` are completely ignored by `searchProductsByContext` and the live endpoint, returning 0 results.
- [x] Recorded verdict: **REQUEST_CHANGES**
- [ ] Write handoff.md and send message to orchestrator
