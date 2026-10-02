import json
import logging

from django.http import JsonResponse, StreamingHttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .search import hybrid_search_rrf
from .gemini_client import ocr_book_cover, rag_query_stream, get_text_embedding
from .tasks import vectorize_book
from .models import BookChunk

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class HybridSearchView(View):
    """POST /aurabook/search/hybrid — Hybrid Search RRF k=60."""

    def post(self, request):
        try:
            body = json.loads(request.body)
            query = body.get("query", "").strip()
            limit = int(body.get("limit", 20))
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({"error": "Invalid request"}, status=400)

        if not query:
            return JsonResponse({"error": "query is required"}, status=400)

        results = hybrid_search_rrf(query, limit=limit)
        return JsonResponse({
            "query": query,
            "total": len(results),
            "results": results,
        })


@method_decorator(csrf_exempt, name="dispatch")
class RAGQueryView(View):
    """POST /aurabook/search/rag — RAG Q&A với SSE streaming."""

    def post(self, request):
        try:
            body = json.loads(request.body)
            query = body.get("query", "").strip()
            product_id = body.get("product_id")
        except (json.JSONDecodeError, KeyError):
            return JsonResponse({"error": "Invalid request"}, status=400)

        if not query:
            return JsonResponse({"error": "query is required"}, status=400)

        # Lấy relevant chunks
        if product_id:
            # Search trong chunks của sách cụ thể
            chunks_qs = (
                BookChunk.objects
                .filter(product_id=product_id, chunk_text__icontains=query)
                .values_list("chunk_text", flat=True)[:5]
            )
        else:
            # Global search
            results = hybrid_search_rrf(query, limit=5)
            chunks_qs = [r["chunk_text"] for r in results]

        chunks = list(chunks_qs)

        # SSE streaming response
        response = StreamingHttpResponse(
            rag_query_stream(query, product_id or "", chunks),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


@method_decorator(csrf_exempt, name="dispatch")
class OCRCoverView(View):
    """POST /aurabook/search/ocr-cover — Gemini Vision OCR bìa sách."""

    def post(self, request):
        if "cover" not in request.FILES:
            return JsonResponse({"error": "cover file is required"}, status=400)

        image_file = request.FILES["cover"]
        if image_file.size > 10 * 1024 * 1024:  # 10MB limit
            return JsonResponse({"error": "File too large (max 10MB)"}, status=400)

        image_bytes = image_file.read()
        metadata = ocr_book_cover(image_bytes)
        return JsonResponse(metadata)


@method_decorator(csrf_exempt, name="dispatch")
class VectorizeBookView(View):
    """POST /aurabook/search/vectorize/{product_id} — Kích hoạt vectorization."""

    def post(self, request, product_id: str):
        try:
            body = json.loads(request.body)
            product_slug = body.get("product_slug", product_id)
            full_text = body.get("full_text", "")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request body"}, status=400)

        if not full_text:
            return JsonResponse({"error": "full_text is required"}, status=400)

        # Dispatch Celery task
        task = vectorize_book.delay(product_id, product_slug, full_text)

        return JsonResponse({
            "status": "queued",
            "task_id": task.id,
            "product_id": product_id,
            "message": "Vectorization task đã được đưa vào hàng đợi Celery",
        })
