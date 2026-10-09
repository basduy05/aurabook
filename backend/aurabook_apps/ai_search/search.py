import logging
from typing import Any

from django.db import connection

from .gemini_client import get_text_embedding
from .models import BookChunk

logger = logging.getLogger(__name__)

# RRF constant — k=60 theo kế hoạch AuraBook
RRF_K = 60


def _cosine_similarity_sql(embedding: list[float]) -> str:
    """Tạo SQL expression cho cosine similarity dùng pgvector."""
    vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
    return f"(embedding <=> '{vec_str}'::vector)"


def hybrid_search_rrf(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """Hybrid Search với Reciprocal Rank Fusion (RRF k=60).

    Bước 1: Fulltext search (SQL LIKE / tsvector)
    Bước 2: Vector semantic search (pgvector cosine similarity)
    Bước 3: RRF fusion: score = 1/(k + rank_ft) + 1/(k + rank_vec)
    Bước 4: Sort desc, return top `limit`
    """
    query_embedding = get_text_embedding(query)

    # Fulltext search results
    fulltext_results = list(
        BookChunk.objects.filter(chunk_text__icontains=query)
        .values("product_id", "product_slug", "chunk_text", "chunk_index")
        .distinct("product_id")[:50]
    )

    # Vector search via raw SQL (pgvector)
    vector_results = []
    try:
        vec_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT product_id, product_slug, chunk_text, chunk_index,
                       (embedding <=> %s::vector) AS distance
                FROM ai_search_bookchunk
                WHERE embedding IS NOT NULL
                ORDER BY distance ASC
                LIMIT 50
                """,
                [vec_str],
            )
            rows = cursor.fetchall()
            vector_results = [
                {
                    "product_id": r[0],
                    "product_slug": r[1],
                    "chunk_text": r[2],
                    "chunk_index": r[3],
                    "distance": r[4],
                }
                for r in rows
            ]
    except Exception as exc:
        logger.warning("pgvector search failed, using fulltext only: %s", exc)

    # Build rank maps
    ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
    vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

    # RRF fusion
    all_product_ids = set(ft_rank) | set(vec_rank)
    rrf_scores: dict[str, float] = {}
    for pid in all_product_ids:
        score = 0.0
        if pid in ft_rank:
            score += 1.0 / (RRF_K + ft_rank[pid])
        if pid in vec_rank:
            score += 1.0 / (RRF_K + vec_rank[pid])
        rrf_scores[pid] = score

    # Merge results, sort by RRF score
    all_results = {r["product_id"]: r for r in fulltext_results}
    for r in vector_results:
        if r["product_id"] not in all_results:
            all_results[r["product_id"]] = r

    ranked = sorted(
        [
            {**all_results[pid], "rrf_score": score}
            for pid, score in rrf_scores.items()
            if pid in all_results
        ],
        key=lambda x: x["rrf_score"],
        reverse=True,
    )
    return ranked[:limit]
