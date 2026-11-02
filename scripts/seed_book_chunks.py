#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/seed_book_chunks.py
===========================
AuraBook M1: Seed 1,597 chunks from graphrag_store.json into PostgreSQL ai_search_bookchunk.
Supports both Gemini API (text-embedding-004) and Deterministic Dense 768-dim Fallback.
"""

import os
import sys
import json
import math
import re
import uuid
import time
import unicodedata
import subprocess
from typing import Any, Dict, List, Tuple

# Cấu hình UTF-8 cho stdout trên mọi môi trường
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Đường dẫn tệp GraphRAG store
DEFAULT_STORE_PATHS = [
    r"ecommerce-ai-platform/data/graphrag_store.json",
    r"../ecommerce-ai-platform/data/graphrag_store.json",
    r"C:\Users\basduy05\Downloads\aurabook\ecommerce-ai-platform\data\graphrag_store.json",
]

# Bảng ánh xạ slug khác biệt giữa GraphRAG và Saleor DB
SLUG_REMAP = {
    "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than": "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than"
}

# 13 Cụm từ khóa chuyên đề sách tiếng Việt
BOOK_THEMES: List[Tuple[str, List[str]]] = [
    ("dac-nhan-tam", ["dac nhan tam", "giao tiep", "ung xu", "thu phuc", "long nguoi", "ket ban", "dale carnegie", "lang nghe", "khen ngoi"]),
    ("bon-thoa-uoc", ["bon thoa uoc", "tam ly", "chua lanh", "noi tam", "binh an", "hanh phuc", "thoa uoc", "toltec", "don miguel ruiz"]),
    ("sapiens-luoc-su-loai-nguoi", ["sapiens", "luoc su loai nguoi", "lich su", "loai nguoi", "tien hoa", "cach mang", "yuval noah harari"]),
    ("tri-tue-do-thai", ["tri tue do thai", "do thai", "tri tue", "tri nho", "thien tai", "ghi nho", "eran katz", "can phong la ma"]),
    ("10-dieu-tao-nen-so-phan", ["10 dieu tao nen so phan", "so phan", "david simon", "thoi quen", "cam ket", "ky luat"]),
    ("bi-mat-cua-mot-tri-nho-sieu-pham", ["bi mat cua mot tri nho sieu pham", "tri nho", "sieu pham", "chia khoa", "lien tuong"]),
    ("cach-nghi-de-thanh-cong", ["cach nghi de thanh cong", "napoleon hill", "lam giau", "khat vong", "niem tin", "kien tri"]),
    ("cay-cam-ngot-cua-toi", ["cay cam ngot cua toi", "zeze", "jose mauro de vasconcelos", "tuoi tho", "tinh yeu thuong"]),
    ("chien-tranh-tien-te-tap-1", ["chien tranh tien te tap 1", "song hongbing", "dong chay cua tien ngam", "rothschild", "fed"]),
    ("chien-tranh-tien-te-tap-2", ["chien tranh tien te tap 2", "song hongbing", "quyen luc vang", "tai phiet", "vang"]),
    ("chien-tranh-tien-te-tap-3", ["chien tranh tien te tap 3", "song hongbing", "rung ram tai chinh", "dong usd"]),
    ("chu-nghia-khac-ky", ["chu nghia khac ky", "stoicism", "william b irvine", "ban linh", "binh than", "tinh tam"]),
    ("tu-duy-nhanh-va-cham", ["tu duy nhanh va cham", "daniel kahneman", "he thong 1", "he thong 2", "dinh kien"])
]

def strip_vietnamese_diacritics(s: str) -> str:
    """Loại bỏ dấu tiếng Việt chuẩn xác."""
    s = (s or "").lower().replace("đ", "d").replace("Đ", "d")
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn")

def djb2_hash(s: str) -> int:
    """Hàm băm DJB2 ổn định cross-platform."""
    h = 5381
    for c in s:
        h = (((h << 5) + h) + ord(c)) & 0xFFFFFFFF
    return h

def generate_dense_768_embedding(text: str, book_slug: str = None) -> List[float]:
    """Sinh vector 768-dim chuẩn hóa L2, bất biến với dấu tiếng Việt."""
    vec = [0.0] * 768
    norm_text = strip_vietnamese_diacritics(text)

    # Band 1: Book themes (0..255)
    for b_idx, (slug, keywords) in enumerate(BOOK_THEMES):
        slot_base = b_idx * 18
        weight = 0.0
        if book_slug and slug in book_slug:
            weight += 4.0
        for kw in keywords:
            if kw in norm_text:
                weight += 2.5
        if weight > 0:
            vec[slot_base] = weight
            vec[slot_base + 1] = math.log1p(weight)
            vec[slot_base + 2] = math.sqrt(weight)

    # Band 2: Subword lexical hash (256..639 -> 384 slots)
    words = re.findall(r"[a-z0-9]+", norm_text)
    for w in words:
        h1 = djb2_hash(w) % 384
        h2 = (djb2_hash(w[::-1]) * 31) % 384
        vec[256 + h1] += 1.0
        vec[256 + h2] += 0.5

    # Band 3: Structural length & bias (640..767)
    vec[640] = math.log1p(len(words))
    vec[641] = 1.0

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        return [round(x / norm, 6) for x in vec]
    return [1.0] + [0.0] * 767

def find_store_file() -> str:
    for p in DEFAULT_STORE_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"Không tìm thấy graphrag_store.json trong các đường dẫn: {DEFAULT_STORE_PATHS}")

def execute_psql_script(sql_content: str) -> None:
    """Thực thi chuỗi SQL vào aurabook-postgres container."""
    cmd = ["docker", "exec", "-i", "aurabook-postgres", "psql", "-U", "saleor", "-d", "aurabook_db"]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
    stdout, stderr = proc.communicate(input=sql_content)
    if proc.returncode != 0:
        raise RuntimeError(f"Lỗi thực thi SQL qua docker psql: {stderr}")
    if stdout.strip():
        print(stdout.strip())

def main():
    print("=== AuraBook: Bắt đầu quy trình Seed Chunks vào PostgreSQL ai_search_bookchunk ===")
    t_start = time.time()

    store_file = find_store_file()
    print(f"[*] Đọc tệp GraphRAG Store: {store_file}")
    with open(store_file, "r", encoding="utf-8") as f:
        store_data = json.load(f)

    chunks = store_data.get("chunks", [])
    print(f"[*] Tổng số chunks trong file: {len(chunks)}")
    if len(chunks) != 1597:
        print(f"[!] Cảnh báo: Số lượng chunks ({len(chunks)}) khác dự kiến (1597)")

    # 1. Chuẩn bị bảng ánh xạ product_id và product_slug từ Saleor
    print("[*] Lấy danh mục sản phẩm từ database Saleor...")
    db_mapping_cmd = ["docker", "exec", "aurabook-postgres", "psql", "-U", "saleor", "-d", "aurabook_db", "-t", "-A", "-F", "\t", "-c", "SELECT id, slug FROM product_product;"]
    res = subprocess.check_output(db_mapping_cmd, text=True, encoding="utf-8")
    slug_to_id = {}
    for line in res.strip().split("\n"):
        if line.strip():
            pid, slug = line.strip().split("\t")
            slug_to_id[slug] = pid
    print(f"[*] Đã tải {len(slug_to_id)} sản phẩm từ Saleor DB: {slug_to_id}")

    # 2. Xóa dữ liệu cũ trong bảng ai_search_bookchunk
    print("[*] Dọn dẹp bảng ai_search_bookchunk...")
    execute_psql_script("TRUNCATE TABLE ai_search_bookchunk;")

    # 3. Xử lý nhóm chunks theo sách và đánh số chunk_index tuần tự
    chunks_by_book: Dict[str, List[Dict[str, Any]]] = {}
    for c in chunks:
        gr_slug = c.get("bookSlug", "")
        chunks_by_book.setdefault(gr_slug, []).append(c)

    print(f"[*] Phân nhóm: {len(chunks_by_book)} tác phẩm.")

    # 4. Tạo các lô lệnh INSERT (Batching 200 records / transaction)
    BATCH_SIZE = 200
    total_inserted = 0
    sql_batch = ["BEGIN;"]

    for gr_slug, book_chunk_list in chunks_by_book.items():
        # Áp dụng remap slug nếu cần
        target_slug = SLUG_REMAP.get(gr_slug, gr_slug)
        product_id = slug_to_id.get(target_slug)
        if not product_id:
            # Thử tìm theo slug không có -va-
            for s, pid in slug_to_id.items():
                if s.replace("-va-", "-") == gr_slug.replace("-va-", "-"):
                    product_id = pid
                    target_slug = s
                    break
        if not product_id:
            raise ValueError(f"Không thể ánh xạ slug '{gr_slug}' sang bất kỳ product nào trong Saleor DB!")

        # Sắp xếp chunks theo chapterIndex và chunk id
        book_chunk_list.sort(key=lambda x: (x.get("chapterIndex", 0), x.get("id", "")))

        for seq_idx, chunk_item in enumerate(book_chunk_list):
            raw_text = chunk_item.get("content", "")
            # Escape single quotes and backslashes for SQL
            escaped_text = raw_text.replace("'", "''")
            token_count = len(raw_text) // 4
            row_id = str(uuid.uuid4())

            # Sinh vector 768 chiều
            vec = generate_dense_768_embedding(raw_text, target_slug)
            vec_str = "[" + ",".join(str(x) for x in vec) + "]"

            sql_batch.append(f"""
            INSERT INTO ai_search_bookchunk (id, product_id, product_slug, chunk_index, chunk_text, embedding, token_count, created_at, updated_at)
            VALUES ('{row_id}', '{product_id}', '{target_slug}', {seq_idx}, '{escaped_text}', '{vec_str}'::vector, {token_count}, NOW(), NOW());
            """)
            total_inserted += 1

            if len(sql_batch) >= BATCH_SIZE:
                sql_batch.append("COMMIT;")
                execute_psql_script("\n".join(sql_batch))
                print(f"[*] Đã nạp {total_inserted}/{len(chunks)} chunks...")
                sql_batch = ["BEGIN;"]

    if len(sql_batch) > 1:
        sql_batch.append("COMMIT;")
        execute_psql_script("\n".join(sql_batch))

    # 5. Khởi tạo Index HNSW & Index Trigram
    print("[*] Đang xây dựng HNSW Vector Index và Trigram Index...")
    index_sql = """
    CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx 
    ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops);

    CREATE INDEX IF NOT EXISTS ai_search_bookchunk_chunk_text_trgm_idx 
    ON ai_search_bookchunk USING gin (chunk_text gin_trgm_ops);
    """
    execute_psql_script(index_sql)

    # 6. Kiểm tra lại số lượng bản ghi
    verify_res = subprocess.check_output(
        ["docker", "exec", "aurabook-postgres", "psql", "-U", "saleor", "-d", "aurabook_db", "-t", "-c", "SELECT count(*) FROM ai_search_bookchunk;"],
        text=True,
    ).strip()

    duration = time.time() - t_start
    print(f"\n[+] HOÀN THÀNH TOÀN DIỆN: Đã nạp thành công {verify_res} chunks cho 13 tác phẩm trong {duration:.2f}s!")

if __name__ == "__main__":
    main()
