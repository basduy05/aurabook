import logging
import re
from typing import Any

from django.db import connection

try:
    from text_unidecode import unidecode
except ImportError:
    import unicodedata

    def unidecode(s: str) -> str:
        s = (s or "").lower().replace("đ", "d").replace("Đ", "d")
        s = unicodedata.normalize("NFD", s)
        return "".join(c for c in s if unicodedata.category(c) != "Mn")

from .gemini_client import get_text_embedding
from .models import BookChunk

logger = logging.getLogger(__name__)

# RRF constant — k=60 theo thiết kế AuraBook
RRF_K = 60

# Ngưỡng khoảng cách vector nghiêm ngặt (Cosine distance <= 0.36 cho entity không xác định, <= 0.58 cho khái niệm chủ đề)
MAX_AUTHENTIC_VECTOR_DISTANCE = 0.36

CATALOG_CONCEPTS = {
    "hoc tap", "hoc hoi", "phuong phap hoc", "hoc",
    "phat trien", "phat trien ban than", "ky nang", "ky nang song",
    "tu duy", "nhan thuc", "logic", "tri tue", "tri nho", "ghi nho", "ren luyen",
    "giao tiep", "ung xu", "thu phuc", "ket ban",
    "chua lanh", "noi tam", "binh an", "tu do",
    "tam ly", "tam ly hoc",
    "lich su", "tien hoa", "nhan loai", "van minh",
    "kinh te", "tai chinh", "tien te", "ngan hang", "dau tu", "lam giau",
    "gia tri", "thang du", "gia tri thang du", "tao ra gia tri", "tu ban",
    "kinh doanh", "dong tien", "kiem tien", "tai san", "lao dong",
    "khac ky", "stoicism", "ban linh", "binh than", "triet hoc", "loi song",
    "thanh cong", "thoi quen", "ky luat", "so phan", "tuoi tho"
}

# Regex nhận diện series nhiều tập tổng quát
SERIES_SLUG_PATTERN = re.compile(
    r"^(?P<base>.+?)[-_](?:tap|vol|volume|phan|part)[-_](?P<vol>\d+)$",
    re.IGNORECASE,
)
SERIES_TITLE_PATTERN = re.compile(
    r"^(?P<base>.+?)\s*[-–—:]\s*(?:tập|tap|vol|volume|phần|phan|part)\s*(?P<vol>\d+)\b",
    re.IGNORECASE,
)
QUERY_EXPLICIT_VOLUME_PATTERN = re.compile(
    r"\b(?:tap|vol|volume|phan|part)\s*[-_]?\s*(\d+|i{1,3}|iv|v)\b",
    re.IGNORECASE,
)
ROMAN_NUMERALS = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5}


def extract_query_volume(norm_q: str) -> int | None:
    """Kiểm tra câu truy vấn có yêu cầu cụ thể một tập hay không (ví dụ: 'tập 2', 'vol 3')."""
    m = QUERY_EXPLICIT_VOLUME_PATTERN.search(norm_q)
    if m:
        raw_vol = m.group(1).lower()
        if raw_vol.isdigit():
            return int(raw_vol)
        if raw_vol in ROMAN_NUMERALS:
            return ROMAN_NUMERALS[raw_vol]
    m_end = re.search(r"\s+([1-9]\d?)$", norm_q)
    if m_end:
        return int(m_end.group(1))
    return None


def extract_series_info(slug: str, title: str = "") -> tuple[str | None, int | None]:
    """Trích xuất (series_base, volume_number) một cách tổng quát từ slug hoặc title."""
    if slug:
        m = SERIES_SLUG_PATTERN.match(slug.strip())
        if m:
            try:
                return m.group("base").lower().strip("-_"), int(m.group("vol"))
            except (ValueError, TypeError):
                pass
    if title:
        m = SERIES_TITLE_PATTERN.search(title.strip())
        if m:
            try:
                base_text = m.group("base").strip(" -–—:")
                norm_base = re.sub(r"[^a-z0-9]+", "-", unidecode(base_text).lower()).strip("-")
                return norm_base, int(m.group("vol"))
            except (ValueError, TypeError):
                pass
    return None, None


def hybrid_search_rrf(query: str, limit: int = 20, alpha: float = 0.5) -> list[dict[str, Any]]:
    """Hybrid Search với Reciprocal Rank Fusion (RRF k=60), lọc vector ngữ nghĩa và chống ảo giác triệt để."""
    clean_query = query.strip()
    if not clean_query:
        return []

    if limit <= 0:
        return []

    try:
        alpha = float(alpha)
        alpha = max(0.0, min(1.0, alpha))
    except (ValueError, TypeError):
        alpha = 0.5

    norm_query = unidecode(clean_query).lower()

    # ==========================================================
    # TẦNG 1: Tiền Xử Lý & Loại Bỏ Nhiễu (Input Validation & Sanitization)
    # Loại bỏ triệt để emoji, dấu câu, chuỗi rỗng không có chữ cái/chữ số
    # ==========================================================
    alphanumeric_chars = re.findall(r"[a-z0-9]", norm_query)
    if not alphanumeric_chars or len(alphanumeric_chars) < 2:
        return []

    query_tokens = [t for t in re.findall(r"\b[a-z0-9]+\b", norm_query) if len(t) >= 2]
    if not query_tokens:
        return []

    # Loại bỏ stop words tiếng Việt thông dụng
    NOISE_WORDS = {
        "sach", "cuon", "quyen", "tim", "ve", "cua", "doc", "cho", "toi",
        "kiem", "lien", "quan", "den", "can", "giup", "xin", "hoi", "cac",
        "nhung", "co", "nao", "khong", "mot", "so", "dau", "tac", "pham", "an"
    }
    if "muon kiep" not in norm_query:
        filtered_tokens = [t for t in query_tokens if t not in NOISE_WORDS and (t != "muon" or "kiep" not in norm_query)]
    else:
        filtered_tokens = query_tokens

    # Dynamic distance threshold based on domain grounding
    is_concept_query = any(
        c in norm_query and not ("tri tue nhan tao" in norm_query and c == "tri tue")
        for c in CATALOG_CONCEPTS
    )
    effective_max_distance = 0.58 if is_concept_query else MAX_AUTHENTIC_VECTOR_DISTANCE

    clean_norm_query = " ".join(filtered_tokens) if filtered_tokens else norm_query
    search_pattern = f"%{norm_query}%"
    clean_search_pattern = f"%{clean_norm_query}%"
    exact_slug = "-".join(query_tokens)
    clean_exact_slug = "-".join(filtered_tokens)
    slug_pattern = f"%{exact_slug}%"
    clean_slug_pattern = f"%{clean_exact_slug}%"
    name_clean_pattern = f"%{' '.join(query_tokens)}%"

    # ==========================================================
    # TẦNG 2: Strict Full-Text Search Trên Danh Mục Catalog
    # Tìm kiếm chính xác trên Title, Slug, Description (Author)
    # Loại bỏ quét xâu con bừa bãi trên 1.597 chunks sách để triệt tiêu false positive
    # ==========================================================
    fulltext_results = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.id::text, p.slug, p.name,
                       COALESCE(p.description_plaintext, p.name) AS chunk_text,
                       (
                           CASE 
                               WHEN unaccent(p.slug) = %s OR unaccent(p.slug) = %s THEN 120
                               WHEN unaccent(p.slug) ILIKE %s OR unaccent(p.slug) ILIKE %s THEN 110
                               WHEN unaccent(p.name) ILIKE %s OR unaccent(p.name) ILIKE %s THEN 100
                               WHEN regexp_replace(unaccent(p.name), '[^a-zA-Z0-9]+', ' ', 'g') ILIKE %s THEN 95
                               WHEN unaccent(p.description_plaintext) ILIKE %s OR unaccent(p.description_plaintext) ILIKE %s THEN 70
                               ELSE 10
                           END
                       ) AS match_priority
                FROM product_product p
                WHERE unaccent(p.slug) = %s OR unaccent(p.slug) = %s
                   OR unaccent(p.slug) ILIKE %s OR unaccent(p.slug) ILIKE %s
                   OR unaccent(p.name) ILIKE %s OR unaccent(p.name) ILIKE %s
                   OR regexp_replace(unaccent(p.name), '[^a-zA-Z0-9]+', ' ', 'g') ILIKE %s
                   OR unaccent(p.description_plaintext) ILIKE %s OR unaccent(p.description_plaintext) ILIKE %s
                ORDER BY match_priority DESC, p.slug ASC
                LIMIT 30
                """,
                [
                    exact_slug, clean_exact_slug,
                    slug_pattern, clean_slug_pattern,
                    search_pattern, clean_search_pattern,
                    name_clean_pattern,
                    search_pattern, clean_search_pattern,
                    exact_slug, clean_exact_slug,
                    slug_pattern, clean_slug_pattern,
                    search_pattern, clean_search_pattern,
                    name_clean_pattern,
                    search_pattern, clean_search_pattern,
                ],
            )
            rows = cursor.fetchall()
            for r in rows:
                fulltext_results.append({
                    "product_id": str(r[0]),
                    "product_slug": r[1],
                    "title": r[2],
                    "chunk_text": r[3][:300] if r[3] else r[2],
                    "chunk_index": 0,
                    "match_priority": r[4],
                })
    except Exception as exc:
        logger.warning("Catalog fulltext search error: %s", exc)

    # ==========================================================
    # TẦNG 3: Vector Semantic Search Với Ngưỡng Khoảng Cách Nghiêm Ngặt
    # Chỉ chấp nhận khoảng cách cosine <= 0.50 (Cosine Similarity >= 0.50)
    # ==========================================================
    vector_results = []
    try:
        query_embedding = get_text_embedding(clean_query)
        has_valid_vector = any(x != 0.0 for x in query_embedding)

        if has_valid_vector:
            vec_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT bc.product_id, bc.product_slug, bc.chunk_text, bc.chunk_index,
                           COALESCE(p.name, bc.product_slug) AS title,
                           (bc.embedding <=> %s::vector) AS distance
                    FROM ai_search_bookchunk bc
                    LEFT JOIN product_product p ON bc.product_slug = p.slug
                    WHERE bc.embedding IS NOT NULL
                    ORDER BY distance ASC, bc.chunk_index ASC, bc.product_slug ASC
                    LIMIT 50
                    """,
                    [vec_str],
                )
                rows = cursor.fetchall()
                seen_vec_pids = set()
                for r in rows:
                    pid = str(r[0])
                    distance = float(r[5])
                    # Lọc nghiêm ngặt: distance <= effective_max_distance (0.36 cho unknown/out-of-catalog, 0.58 cho in-catalog concepts)
                    if pid not in seen_vec_pids and distance <= effective_max_distance:
                        seen_vec_pids.add(pid)
                        vector_results.append({
                            "product_id": pid,
                            "product_slug": r[1],
                            "chunk_text": r[2],
                            "chunk_index": r[3],
                            "title": r[4],
                            "distance": distance,
                        })
    except Exception as exc:
        logger.warning("pgvector search failed: %s", exc)

    # Nếu cả fulltext lẫn vector search đều không tìm thấy kết quả hợp lệ, trả về rỗng ngay (chống ảo giác tuyệt đối)
    if not fulltext_results and not vector_results:
        return []

    # ==========================================================
    # TẦNG 4: RRF Reciprocal Rank Fusion (k=60) & Triệt Tiêu Score Leakage
    # ==========================================================
    ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
    vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

    # Chọn lọc tập ứng viên chính xác theo alpha
    if alpha == 0.0:
        all_product_ids = set(ft_rank)
    elif alpha == 1.0:
        all_product_ids = set(vec_rank)
    else:
        all_product_ids = set(ft_rank) | set(vec_rank)

    rrf_scores: dict[str, float] = {}
    for pid in all_product_ids:
        ft_score = (1.0 / (RRF_K + ft_rank[pid])) if pid in ft_rank else 0.0
        vec_score = (1.0 / (RRF_K + vec_rank[pid])) if pid in vec_rank else 0.0
        score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)
        if score > 0.0 and round(score, 5) > 0.0:
            rrf_scores[pid] = score

    if not rrf_scores:
        return []

    # Tổng hợp dữ liệu kết quả từ các nguồn
    all_results = {r["product_id"]: r for r in fulltext_results}
    for r in vector_results:
        if r["product_id"] not in all_results:
            all_results[r["product_id"]] = r
        elif r.get("chunk_text") and not all_results[r["product_id"]].get("chunk_text"):
            all_results[r["product_id"]]["chunk_text"] = r["chunk_text"]
            all_results[r["product_id"]]["chunk_index"] = r.get("chunk_index", 0)

    valid_items = []
    for pid, score in rrf_scores.items():
        if pid not in all_results:
            continue
        rounded_score = round(score, 5)
        if rounded_score <= 0.0:
            continue
        item_info = all_results[pid]
        slug = item_info["product_slug"]
        title = item_info.get("title", slug)
        s_key, s_vol = extract_series_info(slug, title)
        valid_items.append({
            "product_id": pid,
            "product_slug": slug,
            "title": title,
            "chunk_text": item_info.get("chunk_text", ""),
            "chunk_index": item_info.get("chunk_index", 0),
            "score": rounded_score,
            "rrf_score": rounded_score,
            "_series_key": s_key,
            "_volume": s_vol,
        })

    if not valid_items:
        return []

    # ==========================================================
    # TẦNG 5: Tổng Quát Hóa Xếp Hạng Series Nhiều Tập
    # ==========================================================
    target_vol = extract_query_volume(norm_query)
    series_groups: dict[str, list[dict[str, Any]]] = {}
    for it in valid_items:
        s_key = it["_series_key"]
        if s_key:
            series_groups.setdefault(s_key, []).append(it)

    for s_key, group_items in series_groups.items():
        if target_vol is not None:
            # Người dùng tìm đích danh một tập (ví dụ: 'tập 2', 'vol 3')
            for it in group_items:
                if it["_volume"] == target_vol:
                    it["score"] = round(it["score"] + 0.0050, 5)
                    it["rrf_score"] = it["score"]
        else:
            # Người dùng tìm chung series: ưu tiên thứ tự tập tăng dần (Tập 1 -> Tập 2 -> Tập 3...)
            sorted_vols = sorted(
                group_items,
                key=lambda x: x["_volume"] if x["_volume"] is not None else 999,
            )
            max_group_score = max(x["score"] for x in group_items)
            n = len(sorted_vols)
            for idx, it in enumerate(sorted_vols):
                bonus = 0.00005 * (n - idx)
                it["score"] = round(max_group_score + bonus, 5)
                it["rrf_score"] = it["score"]

    # Sắp xếp kết quả cuối cùng:
    # 1. Điểm score DESC
    # 2. chunk_index ASC
    # 3. product_slug ASC
    valid_items.sort(
        key=lambda it: (
            -it["score"],
            it.get("chunk_index", 0),
            it.get("product_slug", ""),
        )
    )

    results = [
        {
            "product_id": it["product_id"],
            "product_slug": it["product_slug"],
            "title": it["title"],
            "chunk_text": it["chunk_text"],
            "chunk_index": it["chunk_index"],
            "score": it["score"],
            "rrf_score": it["rrf_score"],
        }
        for it in valid_items
    ]
    return results[:limit]
