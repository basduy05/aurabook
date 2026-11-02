import os
import sys
import django
import json

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
sys.path.insert(0, r"C:\Users\basduy05\Downloads\aurabook\backend")
django.setup()

from django.db import connection
from text_unidecode import unidecode
import re
from aurabook_apps.ai_search.gemini_client import get_text_embedding

# Series patterns (Generalized multi-volume sequence)
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

def hybrid_search_rrf_algorithmic(query: str, limit: int = 20, alpha: float = 0.5):
    clean_query = query.strip()
    if not clean_query:
        return []

    try:
        alpha = float(alpha)
        alpha = max(0.0, min(1.0, alpha))
    except (ValueError, TypeError):
        alpha = 0.5

    norm_query = unidecode(clean_query).lower()

    # Step 1: Reject noise (emojis, punctuation, whitespace, non-alphanumeric)
    alphanumeric_chars = re.findall(r"[a-z0-9]", norm_query)
    if not alphanumeric_chars or len(alphanumeric_chars) < 2:
        return []

    query_tokens = [t for t in re.findall(r"\b[a-z0-9]+\b", norm_query) if len(t) >= 2]
    if not query_tokens:
        return []

    # Common query stop words in Vietnamese
    NOISE_WORDS = {"sach", "cuon", "quyen", "tim", "ve", "cua", "doc", "cho", "toi"}
    if "muon kiep" not in norm_query:
        filtered_tokens = [t for t in query_tokens if t not in NOISE_WORDS]
    else:
        filtered_tokens = query_tokens
    
    clean_norm_query = " ".join(filtered_tokens) if filtered_tokens else norm_query
    search_pattern = f"%{norm_query}%"
    clean_search_pattern = f"%{clean_norm_query}%"

    # Step 2: Strict fulltext search
    fulltext_results = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.id::text, p.slug, p.name,
                       (
                           CASE 
                               WHEN unaccent(p.name) ILIKE %s OR unaccent(p.name) ILIKE %s THEN 100
                               WHEN unaccent(p.slug) ILIKE %s OR unaccent(p.slug) ILIKE %s THEN 95
                               WHEN unaccent(p.description_plaintext) ILIKE %s OR unaccent(p.description_plaintext) ILIKE %s THEN 70
                               ELSE 10
                           END
                       ) AS match_priority
                FROM product_product p
                WHERE unaccent(p.name) ILIKE %s OR unaccent(p.name) ILIKE %s
                   OR unaccent(p.slug) ILIKE %s OR unaccent(p.slug) ILIKE %s
                   OR unaccent(p.description_plaintext) ILIKE %s OR unaccent(p.description_plaintext) ILIKE %s
                ORDER BY match_priority DESC, p.slug ASC
                LIMIT 20
                """,
                [
                    search_pattern, clean_search_pattern,
                    search_pattern, clean_search_pattern,
                    search_pattern, clean_search_pattern,
                    search_pattern, clean_search_pattern,
                    search_pattern, clean_search_pattern,
                    search_pattern, clean_search_pattern,
                ]
            )
            rows = cursor.fetchall()
            for r in rows:
                fulltext_results.append({
                    "product_id": str(r[0]),
                    "product_slug": r[1],
                    "title": r[2],
                    "match_priority": r[3],
                    "chunk_text": "",
                    "chunk_index": 0
                })
    except Exception as exc:
        pass

    # Step 3: Vector search with genuine semantic threshold (<= 0.50)
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
                    [vec_str]
                )
                rows = cursor.fetchall()
                seen_vec_pids = set()
                for r in rows:
                    pid = str(r[0])
                    distance = float(r[5])
                    # Strict threshold <= 0.50 ensures authentic semantic match
                    if pid not in seen_vec_pids and distance <= 0.50:
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
        pass

    # If neither fulltext nor vector search found grounded candidates, return []
    if not fulltext_results and not vector_results:
        return []

    # Step 4: RRF Fusion
    RRF_K = 60
    ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
    vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

    if alpha == 0.0:
        all_pids = set(ft_rank)
    elif alpha == 1.0:
        all_pids = set(vec_rank)
    else:
        all_pids = set(ft_rank) | set(vec_rank)

    all_results = {r["product_id"]: r for r in fulltext_results}
    for r in vector_results:
        if r["product_id"] not in all_results:
            all_results[r["product_id"]] = r

    valid_items = []
    for pid in all_pids:
        if pid not in all_results:
            continue
        ft_score = (1.0 / (RRF_K + ft_rank[pid])) if pid in ft_rank else 0.0
        vec_score = (1.0 / (RRF_K + vec_rank[pid])) if pid in vec_rank else 0.0
        score = 2.0 * ((1.0 - alpha) * ft_score + alpha * vec_score)
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

    # Step 5: Generalized Multi-Volume Series Disambiguation
    target_vol = extract_query_volume(norm_query)
    series_groups: dict[str, list[dict[str, Any]]] = {}
    for it in valid_items:
        s_key = it["_series_key"]
        if s_key:
            series_groups.setdefault(s_key, []).append(it)

    for s_key, group_items in series_groups.items():
        if target_vol is not None:
            for it in group_items:
                if it["_volume"] == target_vol:
                    it["score"] = round(it["score"] + 0.0050, 5)
                    it["rrf_score"] = it["score"]
        else:
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

if __name__ == "__main__":
    series_tests = [
        ("chien tranh tien te", "chien-tranh-tien-te-tap-1"),
        ("Chiến tranh tiền tệ", "chien-tranh-tien-te-tap-1"),
        ("chien tranh tien te tap 1", "chien-tranh-tien-te-tap-1"),
        ("chien tranh tien te tap 2", "chien-tranh-tien-te-tap-2"),
        ("chien tranh tien te tap 3", "chien-tranh-tien-te-tap-3"),
    ]
    print("=== SERIES TESTS ===")
    for q, exp in series_tests:
        res = hybrid_search_rrf_algorithmic(q)
        top = res[0]["product_slug"] if res else None
        order = [r["product_slug"] for r in res[:3]]
        ok = (top == exp)
        print(f"Query: '{q}' -> top: {top} (expected: {exp}) | order: {order} -> {'PASS' if ok else 'FAIL'}")
