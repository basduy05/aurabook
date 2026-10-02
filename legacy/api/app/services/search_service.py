import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Book
from app.models.ebook import BookChunk
from app.schemas.catalog import HybridSearchResponse, HybridSearchResultItem
from app.services.ai_service import AiService


class SearchService:
    @staticmethod
    async def search_hybrid(
        db: AsyncSession,
        q: str,
        limit: int = 10,
        min_similarity: float = 0.40,
        k: int = 60,
    ) -> HybridSearchResponse:
        q_clean = q.strip()
        if not q_clean:
            return HybridSearchResponse(query=q, total_results=0, items=[])

        # 1. Lexical Matching Branch (BM25 / Keyword substring)
        lexical_pattern = f"%{q_clean}%"
        lex_stmt = (
            select(Book)
            .options(selectinload(Book.category))
            .where(
                Book.is_available.is_(True),
                (Book.title.ilike(lexical_pattern))
                | (Book.author.ilike(lexical_pattern))
                | (Book.description.ilike(lexical_pattern)),
            )
            .limit(limit * 2)
        )
        lex_res = await db.execute(lex_stmt)
        lex_books = lex_res.scalars().all()

        lexical_ranks: dict[uuid.UUID, int] = {}
        books_map: dict[uuid.UUID, Book] = {}

        for rank, b in enumerate(lex_books, start=1):
            lexical_ranks[b.id] = rank
            books_map[b.id] = b

        # 2. Semantic Vector Branch (768d Cosine)
        semantic_ranks: dict[uuid.UUID, int] = {}
        try:
            q_emb = await AiService.generate_embedding(q_clean)
            chunk_stmt = (
                select(BookChunk).where(BookChunk.embedding.isnot(None)).limit(200)
            )
            chunk_res = await db.execute(chunk_stmt)
            all_chunks = chunk_res.scalars().all()

            book_similarities: dict[uuid.UUID, float] = {}
            for ch in all_chunks:
                if ch.embedding is not None and len(ch.embedding) == 768:
                    sim = AiService.cosine_similarity(q_emb, ch.embedding)
                    if sim >= min_similarity:
                        cur_max = book_similarities.get(ch.book_id, 0.0)
                        if sim > cur_max:
                            book_similarities[ch.book_id] = sim

            # Sort by similarity descending
            sorted_sem = sorted(
                book_similarities.items(), key=lambda x: x[1], reverse=True
            )
            for rank, (b_id, _) in enumerate(sorted_sem, start=1):
                semantic_ranks[b_id] = rank
                if b_id not in books_map:
                    b_fetch = await db.execute(
                        select(Book)
                        .options(selectinload(Book.category))
                        .where(Book.id == b_id, Book.is_available.is_(True))
                    )
                    b_obj = b_fetch.scalar_one_or_none()
                    if b_obj:
                        books_map[b_id] = b_obj
        except Exception:
            # Fallback gracefully if vector retrieval fails
            pass

        # 3. Reciprocal Rank Fusion (RRF k=60)
        # RRF(d) = sum(1 / (k + rank_m(d)))
        all_book_ids = set(lexical_ranks.keys()).union(set(semantic_ranks.keys()))
        scored_items: list[dict[str, Any]] = []

        for b_id in all_book_ids:
            book_obj = books_map.get(b_id)
            if not book_obj:
                continue

            lex_rank = lexical_ranks.get(b_id)
            sem_rank = semantic_ranks.get(b_id)

            rrf_score = 0.0
            if lex_rank is not None:
                rrf_score += 1.0 / (k + lex_rank)
            if sem_rank is not None:
                rrf_score += 1.0 / (k + sem_rank)

            if lex_rank is not None and sem_rank is not None:
                match_type = "HYBRID"
            elif lex_rank is not None:
                match_type = "LEXICAL"
            else:
                match_type = "SEMANTIC"

            scored_items.append(
                {
                    "book": book_obj,
                    "rrf_score": round(rrf_score, 6),
                    "lexical_rank": lex_rank,
                    "semantic_rank": sem_rank,
                    "match_type": match_type,
                }
            )

        # Sort by rrf_score descending
        scored_items.sort(key=lambda x: x["rrf_score"], reverse=True)
        final_items = scored_items[:limit]

        results = [
            HybridSearchResultItem(
                id=item["book"].id,
                title=item["book"].title,
                slug=item["book"].slug,
                author=item["book"].author,
                cover_url=item["book"].cover_url,
                sale_price=item["book"].sale_price,
                format=item["book"].format,
                rrf_score=item["rrf_score"],
                lexical_rank=item["lexical_rank"],
                semantic_rank=item["semantic_rank"],
                match_type=item["match_type"],
            )
            for item in final_items
        ]

        return HybridSearchResponse(
            query=q_clean,
            total_results=len(results),
            items=results,
        )
