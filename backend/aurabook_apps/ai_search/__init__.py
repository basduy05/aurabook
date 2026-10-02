"""
AuraBook AI Search App
======================
Tính năng:
  - Gemini text-embedding-004 (768-dim) vector embeddings
  - pgvector lưu trữ và tìm kiếm vector
  - Hybrid Search RRF k=60 (fulltext SQL + semantic vector)
  - Gemini 2.0 Flash Vision OCR (quét bìa sách → metadata)
  - Gemini RAG Q&A với SSE streaming
  - Celery task: vectorize_book(product_id) chạy nền

Endpoints:
  POST /aurabook/search/hybrid          → Hybrid Search RRF k=60
  POST /aurabook/search/rag             → RAG Q&A (SSE stream)
  POST /aurabook/search/ocr-cover       → Gemini Vision OCR bìa sách
  POST /aurabook/search/vectorize/{id}  → Kích hoạt vectorization worker
"""
