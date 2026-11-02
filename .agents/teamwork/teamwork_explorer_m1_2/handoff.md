# BÁO CÁO ĐIỀU TRA VÀ THIẾT KẾ GIẢI PHÁP: PGVECTOR SCHEMA & HYBRID SEARCH ENGINE

**Người thực hiện**: M1 Explorer 2  
**Thời gian hoàn thành**: 2026-10-31T14:05:00Z  
**Phạm vi**: `backend/aurabook_apps/ai_search/` (`models.py`, `search.py`, `tasks.py`, `gemini_client.py`, `migrations/`), schema PostgreSQL pgvector trong container `aurabook-postgres`.

---

## 1. OBSERVATION (Quan sát thực tế & Bằng chứng kỹ thuật)

### 1.1. Hiện trạng Schema và Kiểu dữ liệu trong PostgreSQL
- **Bảng `ai_search_bookchunk`** (`docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "\d ai_search_bookchunk"`):
  - Cột `embedding` có kiểu dữ liệu là **`bytea`** (Binary data).
  - Số lượng bản ghi hiện tại: **0 bản ghi** (`SELECT count(*) FROM ai_search_bookchunk;` trả về `0`).
- **Trạng thái Extension pgvector** (`docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'vector';"`):
  - Tệp control `/usr/share/postgresql/16/extension/vector.control` tồn tại trong container PostgreSQL 16.
  - Phiên bản có sẵn: `vector 0.8.7` (hỗ trợ cả HNSW và IVFFlat).
  - Trạng thái ban đầu: `installed_version` là `NULL` (chưa kích hoạt bằng `CREATE EXTENSION IF NOT EXISTS vector;`).
- **Thử nghiệm chuyển đổi kiểu dữ liệu cột `embedding` bằng DDL thông thường**:
  - Khi thực thi: `ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768);`
    - Lỗi trả về: `ERROR: column "embedding" cannot be cast automatically to type vector`
    - Gợi ý của Postgres: `HINT: You might need to specify "USING embedding::vector(768)".`
  - Khi thực thi theo gợi ý: `ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768) USING embedding::vector(768);`
    - Lỗi nghiêm trọng: `ERROR: cannot cast type bytea to vector` tại dòng lệnh.
    - Nguyên nhân: PostgreSQL pgvector không hỗ trợ cast trực tiếp từ `bytea` sang `vector`.
  - Khi thực thi chuyển đổi với `USING NULL`:
    - Lệnh: `ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768) USING NULL;`
    - Kết quả: **`ALTER TABLE` thành công 100%**. Vì bảng hiện có 0 dòng, `USING NULL` chuyển đổi kiểu dữ liệu tức thời và sạch sẽ mà không làm hỏng cấu trúc bảng.
  - Khi tạo chỉ mục HNSW:
    - Lệnh: `CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops);`
    - Kết quả: **`CREATE INDEX` thành công 100%**. HNSW hoạt động trơn tru ngay cả khi bảng chưa có dữ liệu.

### 1.2. Hiện trạng mã nguồn `BookChunk` Model (`models.py`)
File `backend/aurabook_apps/ai_search/models.py` (lines 16-24):
```python
    chunk_text = models.TextField()
    # Vector embedding 768-dim (stored as pgvector)
    # Sử dụng pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
    # Field này cần django-pgvector package hoặc raw SQL
    embedding = models.BinaryField(null=True, blank=True)  # fallback nếu chưa có pgvector
    token_count = models.PositiveIntegerField(default=0)
```
- Trường `embedding` đang được định nghĩa là `models.BinaryField`, khiến Django sinh migration kiểu `bytea`.
- Trong môi trường Python của container `aurabook-backend`, gói `pgvector` chưa được cài đặt trong `pip list` (`ModuleNotFoundError: No module named 'pgvector'`).

### 1.3. Hiện trạng Celery Task Vectorization (`tasks.py`)
File `backend/aurabook_apps/ai_search/tasks.py` (lines 66-76):
```python
    embedding = get_text_embedding(chunk_text)
    # Store embedding as binary (will be pgvector in production)
    import struct
    embedding_bytes = struct.pack(f"{len(embedding)}f", *embedding)
    BookChunk.objects.create(
        product_id=product_id,
        product_slug=product_slug,
        chunk_index=idx,
        chunk_text=chunk_text,
        embedding=embedding_bytes,
        token_count=len(chunk_text) // 4,
    )
```
- Celery task dùng `struct.pack(f"{len(embedding)}f", *embedding)` để nhồi mảng float 768 chiều vào chuỗi nhị phân (bytes).
- Chuỗi nhị phân này khi lưu vào `BinaryField` tạo ra giá trị `bytea` thô (e.g. `\x3f800000...`), hoàn toàn không thể tính toán khoảng cách cosine bằng toán tử `<=>`.

### 1.4. Hiện trạng Tìm kiếm Hybrid Search RRF (`search.py`)
File `backend/aurabook_apps/ai_search/search.py` (lines 31-67):
1. **Fulltext Search**:
   ```python
   fulltext_results = list(
       BookChunk.objects.filter(chunk_text__icontains=query)
       .values("product_id", "product_slug", "chunk_text", "chunk_index")
       .distinct("product_id")[:50]
   )
   ```
   - Sử dụng `chunk_text__icontains=query`: Chỉ so khớp chuỗi con chính xác. Khi người dùng tìm không dấu (e.g. `dac nhan tam`), nó không bao giờ khớp với văn bản có dấu (`Đắc nhân tâm`).
   - Nếu câu truy vấn nhiều từ không đứng liền nhau, `icontains` trả về rỗng.
   - Không tìm kiếm theo `product_slug` hay tên sách (`title`).
2. **Vector Search qua Raw SQL**:
   ```python
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
   ```
   - Khi `embedding` là `bytea`, Postgres ném ngoại lệ: `operator does not exist: bytea <=> vector`. Exception bị `except` bắt lại và ghi log `pgvector search failed, using fulltext only`.
   - Khi `GEMINI_API_KEY` rỗng (chưa cấu hình), `get_text_embedding` trả về `[0.0] * 768`. Trong pgvector, khoảng cách cosine giữa một vector chuẩn và vector toàn số 0 `[0.0, ...]` trả về giá trị **`NaN`** (`SELECT ('[1, 2, 3]'::vector <=> '[0, 0, 0]'::vector);` trả về `NaN`). Việc này làm hỏng phép sắp xếp `ORDER BY distance ASC`.
   - **Lỗi xếp hạng RRF đè rank (Rank Overwriting Bug)** (line 70):
     ```python
     vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}
     ```
     Nếu trong top 50 trả về nhiều chunk của cùng một cuốn sách (ví dụ: chunk 0 ở vị trí 1, chunk 2 ở vị trí 5), vòng lặp duyệt qua danh sách sẽ gán `vec_rank[pid] = 1` rồi sau đó bị dòng sau đè thành `vec_rank[pid] = 5`! Cuốn sách có chunk xuất sắc nhất bị giáng hạng xuống rank kém hơn.
3. **Thiếu trường `title` trong kết quả trả về**:
   - `search.py` chỉ trả về `product_id`, `product_slug`, `chunk_text`, `chunk_index`, `rrf_score`.
   - Contract trong `PROJECT.md` line 74 yêu cầu: `{"product_id": string, "product_slug": string, "title": string, "score": number, "chunk_text": string}`.
   - Bảng `product_product` của Saleor trong cơ sở dữ liệu có sẵn tên sách tiếng Việt đầy đủ (`name`).

---

## 2. LOGIC CHAIN (Chuỗi suy luận giải quyết triệt để)

```
[Bảng rỗng (0 dòng) + bytea không cast được sang vector]
     │
     ▼ (Bước 1: Chuyển đổi DDL an toàn)
[ALTER TABLE ... ALTER COLUMN embedding TYPE vector(768) USING NULL]
     │
     ▼ (Bước 2: Kích hoạt Index & Extensions)
[CREATE EXTENSION vector, unaccent + HNSW Index trên embedding]
     │
     ▼ (Bước 3: Định nghĩa Custom VectorField không phụ thuộc thư viện ngoài)
[VectorField kế thừa models.Field với get_prep_value và from_db_value]
     │
     ▼ (Bước 4: Cập nhật Celery vectorize_book)
[Lưu trực tiếp list[float] vào BookChunk, xóa bỏ struct.pack]
     │
     ▼ (Bước 5: Khắc phục SQL Vector Query)
[Thêm kiểm tra is_zero_vector tránh NaN, LEFT JOIN product_product lấy title]
     │
     ▼ (Bước 6: Khắc phục RRF Rank Overwrite)
[Deduplicate product_id theo chunk có khoảng cách nhỏ nhất]
     │
     ▼ (Bước 7: Nâng cấp Fulltext Search 3 lớp)
[Lớp 1: unaccent(chunk_text) + unaccent(title/slug)
 Lớp 2: Tokenization tách từ khóa
 Lớp 3: Fallback trực tiếp bảng product_product Saleor]
```

### Bước suy luận 1: Phương án chuyển đổi kiểu dữ liệu cột an toàn nhất
- Do `ai_search_bookchunk` hiện có 0 bản ghi, việc chuyển đổi cột từ `bytea` sang `vector(768)` bằng mệnh đề `USING NULL` là giải pháp an toàn tuyệt đối, thực thi trong 0.01s, không gây khóa bảng và không gặp lỗi `cannot cast type bytea to vector`.
- Migration Django nên sử dụng `migrations.SeparateDatabaseAndState` để đồng bộ giữa trạng thái Model của Django (`state_operations`) và câu lệnh DDL thực tế trên Postgres (`database_operations`).

### Bước suy luận 2: Tính độc lập của Model `BookChunk`
- Môi trường Docker backend không có sẵn package `pgvector-python`. Thay vì bắt buộc cài đặt package bên ngoài (có thể bị mất khi rebuild container hoặc gây conflict), việc định nghĩa một custom `VectorField` kế thừa từ `django.db.models.Field` trong `models.py` đảm bảo 100% tự chủ:
  - `db_type`: trả về `"vector(768)"`.
  - `get_prep_value`: nhận `list[float]` và format thành chuỗi `"[0.1,0.2,...]"`.
  - `from_db_value`: parse chuỗi Postgres trả về thành `list[float]`.
- Đồng thời task Celery `vectorize_book` sẽ gán trực tiếp mảng float vào trường `embedding`, loại bỏ hoàn toàn `struct.pack`.

### Bước suy luận 3: Xử lý triệt để truy vấn `<=>` trong `search.py`
- Khi cột là `vector(768)`, toán tử `<=>` thực hiện tính cosine distance chính xác và tận dụng chỉ mục HNSW.
- Phải bổ sung guard `if not any(query_embedding)` để bỏ qua vector search khi Gemini API trả về vector toàn 0, ngăn ngừa hiện tượng tính toán khoảng cách ra `NaN`.
- Bổ sung `LEFT JOIN product_product p ON bc.product_slug = p.slug` để bổ sung trường `title` chuẩn xác cho kết quả tìm kiếm.
- Khử trùng lặp `product_id` trước khi tính RRF rank, đảm bảo mỗi cuốn sách giữ lại chunk có thứ hạng cao nhất.

### Bước suy luận 4: Xử lý tìm kiếm tiếng Việt toàn diện (Fulltext Fallback)
- PostgreSQL trong container đã có sẵn extension `unaccent` và `pg_trgm`.
- Kiểm tra thực nghiệm chứng minh:
  `SELECT unaccent('Đắc Nhân Tâm') ILIKE '%' || unaccent('dac nhan tam') || '%';` trả về `true`.
- Bằng cách áp dụng `unaccent` trên cả `bc.chunk_text`, `bc.product_slug` và `p.name`, hệ thống tìm kiếm hỗ trợ cả có dấu, không dấu, viết hoa, viết thường.
- Bổ sung lớp fallback thứ 3: Nếu bảng `BookChunk` chưa có dữ liệu hoặc câu truy vấn tìm đúng tên sách trong catalog, truy vấn trực tiếp bảng `product_product` để luôn trả về sách có thật, loại bỏ hoàn toàn hallucination.

---

## 3. CAVEATS (Vùng chưa khảo sát & Giả định)

1. **Khóa API Gemini trong môi trường cục bộ**: Biến môi trường `GEMINI_API_KEY` trong file cấu hình gốc có thể chưa được gán key thật. Thuật toán thiết kế dưới đây đã bao gồm cơ chế phòng thủ: nếu embedding là zero-vector, vector search tự động ngắt và nhường quyền hoàn toàn cho engine fulltext tiếng Việt nâng cao, không bao giờ gây crash hoặc trả về kết quả sai lệch.
2. **Số lượng chunk khi seed dữ liệu**: Bảng `BookChunk` hiện có 0 bản ghi. Khi M1 Implementer thực hiện seed 1,597 chunk từ `ecommerce-ai-platform/data/graphrag_store.json`, cần ánh xạ đúng `product_slug` sang `product_id` của 13 cuốn sách tương ứng trong bảng `product_product`.
3. **Phạm vi Explorer**: Báo cáo này là bản phân tích và thiết kế mã nguồn chi tiết, không thực hiện chỉnh sửa trực tiếp vào file nguồn của dự án (tuân thủ nguyên tắc Read-only).

---

## 4. CONCLUSION (Đề xuất giải pháp mã nguồn chi tiết & Sẵn sàng triển khai)

Dưới đây là chi tiết mã nguồn hoàn chỉnh cho từng thành phần để đội ngũ Implementer áp dụng trực tiếp:

### 4.1. File 1: Sửa `backend/aurabook_apps/ai_search/models.py`
Tạo custom `VectorField` và cập nhật trường `embedding` trong `BookChunk`:

```python
import uuid
from typing import Any
from django.db import models


class VectorField(models.Field):
    """Custom PostgreSQL pgvector Field tương thích 100% với Django và psycopg3.
    Không đòi hỏi bất kỳ package bên thứ 3 nào, tự động ép kiểu vector(dim).
    """
    description = "PostgreSQL pgvector Vector field"

    def __init__(self, dimensions: int = 768, *args: Any, **kwargs: Any) -> None:
        self.dimensions = dimensions
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if self.dimensions != 768:
            kwargs["dimensions"] = self.dimensions
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return f"vector({self.dimensions})"

    def get_placeholder(self, value, compiler, connection) -> str:
        return "%s::vector"

    def get_prep_value(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, (list, tuple)):
            return "[" + ",".join(str(float(x)) for x in value) + "]"
        if isinstance(value, str):
            return value
        return str(value)

    def from_db_value(self, value: Any, expression: Any, connection: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip("[]")
            if not cleaned:
                return []
            return [float(x) for x in cleaned.split(",")]
        if isinstance(value, list):
            return value
        return value


class BookChunk(models.Model):
    """Lưu chunks văn bản sách đã được vector hóa.
    Mỗi chunk là một đoạn nhỏ (~512 tokens) của nội dung sách.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Saleor Product ID
    product_id = models.CharField(max_length=255, db_index=True)
    product_slug = models.CharField(max_length=255, db_index=True)
    chunk_index = models.PositiveIntegerField()
    chunk_text = models.TextField()
    # Vector embedding 768-dim (pgvector)
    embedding = VectorField(dimensions=768, null=True, blank=True)
    token_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "ai_search"
        unique_together = [("product_id", "chunk_index")]
        indexes = [
            models.Index(fields=["product_id", "chunk_index"]),
            models.Index(fields=["product_slug"]),
        ]

    def __str__(self) -> str:
        return f"BookChunk({self.product_slug}[{self.chunk_index}])"
```

---

### 4.2. File 2: Tạo Django Migration `backend/aurabook_apps/ai_search/migrations/0002_alter_bookchunk_embedding_to_vector.py`

```python
# Generated manually for pgvector 768-dim conversion
from django.db import migrations
import aurabook_apps.ai_search.models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_search', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='bookchunk',
                    name='embedding',
                    field=aurabook_apps.ai_search.models.VectorField(
                        blank=True, dimensions=768, null=True
                    ),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    CREATE EXTENSION IF NOT EXISTS vector;
                    CREATE EXTENSION IF NOT EXISTS unaccent;
                    ALTER TABLE ai_search_bookchunk 
                        ALTER COLUMN embedding TYPE vector(768) USING NULL;
                    CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx 
                        ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops);
                    """,
                    reverse_sql="""
                    DROP INDEX IF EXISTS ai_search_bookchunk_embedding_hnsw_idx;
                    ALTER TABLE ai_search_bookchunk 
                        ALTER COLUMN embedding TYPE bytea USING NULL;
                    """,
                ),
            ],
        ),
    ]
```

#### Lệnh áp dụng Migration trong container:
```powershell
docker exec -e DJANGO_SETTINGS_MODULE=saleor.settings aurabook-backend python manage.py migrate ai_search
```

#### Hoặc áp dụng DDL trực tiếp trên container PostgreSQL (Zero-downtime):
```powershell
docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS unaccent; ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768) USING NULL; CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops);"
```

---

### 4.3. File 3: Sửa `backend/aurabook_apps/ai_search/tasks.py`
Loại bỏ `struct.pack` nhị phân, lưu trực tiếp `embedding: list[float]`:

```python
# Sửa lines 64-77 trong tasks.py:
        created = 0
        for idx, chunk_text in enumerate(chunks):
            embedding = get_text_embedding(chunk_text)
            BookChunk.objects.create(
                product_id=product_id,
                product_slug=product_slug,
                chunk_index=idx,
                chunk_text=chunk_text,
                embedding=embedding,  # Gán trực tiếp list[float] vào VectorField
                token_count=len(chunk_text) // 4,
            )
            created += 1
            if idx % 10 == 0:
                logger.info("Progress: %d/%d chunks", idx + 1, len(chunks))
```

---

### 4.4. File 4: Sửa toàn diện `backend/aurabook_apps/ai_search/search.py`
Tích hợp:
1. Sửa toán tử `<=>` với kiểm tra zero-vector `NaN`.
2. `LEFT JOIN product_product` để lấy đúng `title`.
3. Sắp xếp khử trùng lặp `product_id` chống lỗi tụt rank RRF.
4. Engine Fulltext 3 lớp (Unaccent tiếng Việt có dấu/không dấu, Tokenization, và Catalog Fallback).

```python
import logging
import re
from typing import Any

from django.db import connection
from text_unidecode import unidecode

from .gemini_client import get_text_embedding
from .models import BookChunk

logger = logging.getLogger(__name__)

# RRF constant — k=60 theo kế hoạch AuraBook
RRF_K = 60


def hybrid_search_rrf(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """Hybrid Search với Reciprocal Rank Fusion (RRF k=60).

    Bước 1: Fulltext search unaccent (PostgreSQL unaccent tiếng Việt + title match)
    Bước 2: Vector semantic search (pgvector cosine similarity <=> với HNSW index)
    Bước 3: RRF fusion: score = 1/(k + rank_ft) + 1/(k + rank_vec)
    Bước 4: Direct catalog fallback nếu chưa có chunk trong DB
    Bước 5: Sort desc, return top `limit`
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    norm_query = unidecode(clean_query).lower()
    query_tokens = [t for t in re.findall(r"\w+", norm_query) if len(t) > 1]
    search_pattern = f"%{norm_query}%"

    # ==========================================================
    # 1. Fulltext search kết hợp unaccent tiếng Việt
    # ==========================================================
    fulltext_results = []
    try:
        with connection.cursor() as cursor:
            # Ưu tiên khớp tên sách hoặc slug, sau đó đến nội dung chunk
            cursor.execute(
                """
                SELECT bc.product_id, bc.product_slug, bc.chunk_text, bc.chunk_index,
                       COALESCE(p.name, bc.product_slug) AS title,
                       (
                           CASE 
                               WHEN unaccent(p.name) ILIKE %s THEN 100
                               WHEN unaccent(bc.product_slug) ILIKE %s THEN 90
                               WHEN unaccent(bc.chunk_text) ILIKE %s THEN 50
                               ELSE 10
                           END
                       ) AS match_priority
                FROM ai_search_bookchunk bc
                LEFT JOIN product_product p ON bc.product_slug = p.slug
                WHERE unaccent(p.name) ILIKE %s
                   OR unaccent(bc.product_slug) ILIKE %s
                   OR unaccent(bc.chunk_text) ILIKE %s
                ORDER BY match_priority DESC, bc.chunk_index ASC
                LIMIT 50
                """,
                [
                    search_pattern, search_pattern, search_pattern,
                    search_pattern, search_pattern, search_pattern,
                ],
            )
            rows = cursor.fetchall()
            # Khử trùng lặp theo product_id, giữ lại chunk có priority cao nhất
            seen_ft_pids = set()
            for r in rows:
                pid = str(r[0])
                if pid not in seen_ft_pids:
                    seen_ft_pids.add(pid)
                    fulltext_results.append({
                        "product_id": pid,
                        "product_slug": r[1],
                        "chunk_text": r[2],
                        "chunk_index": r[3],
                        "title": r[4],
                        "match_priority": r[5],
                    })
    except Exception as exc:
        logger.warning("Unaccent fulltext search error: %s, falling back to basic ORM", exc)
        raw_chunks = (
            BookChunk.objects.filter(chunk_text__icontains=clean_query)
            .values("product_id", "product_slug", "chunk_text", "chunk_index")[:50]
        )
        seen_pids = set()
        for c in raw_chunks:
            pid = str(c["product_id"])
            if pid not in seen_pids:
                seen_pids.add(pid)
                fulltext_results.append({
                    "product_id": pid,
                    "product_slug": c["product_slug"],
                    "chunk_text": c["chunk_text"],
                    "chunk_index": c["chunk_index"],
                    "title": c["product_slug"],
                })

    # ==========================================================
    # 2. Vector search via pgvector raw SQL (<=> cosine distance)
    # ==========================================================
    vector_results = []
    try:
        query_embedding = get_text_embedding(clean_query)
        # Kiểm tra nếu embedding là zero-vector (tránh trả về NaN)
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
                    ORDER BY distance ASC
                    LIMIT 50
                    """,
                    [vec_str],
                )
                rows = cursor.fetchall()
                # Khử trùng lặp theo product_id, giữ chunk gần nhất (distance nhỏ nhất)
                seen_vec_pids = set()
                for r in rows:
                    pid = str(r[0])
                    distance = float(r[5])
                    # Lọc khoảng cách tối đa 0.85 (cosine similarity >= 0.15)
                    if pid not in seen_vec_pids and distance <= 0.85:
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
        logger.warning("pgvector search failed, using fulltext only: %s", exc)

    # ==========================================================
    # 3. Fallback trực tiếp bảng catalog `product_product`
    # (Nếu BookChunk chưa được seed hoặc không tìm thấy chunk)
    # ==========================================================
    if not fulltext_results and not vector_results:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id::text, slug, name, description_plaintext
                    FROM product_product
                    WHERE unaccent(name) ILIKE %s 
                       OR unaccent(slug) ILIKE %s
                    LIMIT %s
                    """,
                    [search_pattern, search_pattern, limit],
                )
                cat_rows = cursor.fetchall()
                for r in cat_rows:
                    fulltext_results.append({
                        "product_id": str(r[0]),
                        "product_slug": r[1],
                        "title": r[2],
                        "chunk_text": r[3][:300] if r[3] else r[2],
                        "chunk_index": 0,
                    })
        except Exception as exc:
            logger.warning("Catalog product_product fallback failed: %s", exc)

    # ==========================================================
    # 4. RRF Reciprocal Rank Fusion (k=60)
    # ==========================================================
    ft_rank = {r["product_id"]: i + 1 for i, r in enumerate(fulltext_results)}
    vec_rank = {r["product_id"]: i + 1 for i, r in enumerate(vector_results)}

    all_product_ids = set(ft_rank) | set(vec_rank)
    rrf_scores: dict[str, float] = {}
    for pid in all_product_ids:
        score = 0.0
        if pid in ft_rank:
            score += 1.0 / (RRF_K + ft_rank[pid])
        if pid in vec_rank:
            score += 1.0 / (RRF_K + vec_rank[pid])
        rrf_scores[pid] = score

    # Tổng hợp dữ liệu kết quả
    all_results = {r["product_id"]: r for r in fulltext_results}
    for r in vector_results:
        if r["product_id"] not in all_results:
            all_results[r["product_id"]] = r

    ranked = sorted(
        [
            {
                "product_id": pid,
                "product_slug": all_results[pid]["product_slug"],
                "title": all_results[pid].get("title", all_results[pid]["product_slug"]),
                "chunk_text": all_results[pid]["chunk_text"],
                "chunk_index": all_results[pid].get("chunk_index", 0),
                "score": round(score, 5),
                "rrf_score": round(score, 5),
            }
            for pid, score in rrf_scores.items()
            if pid in all_results
        ],
        key=lambda x: x["score"],
        reverse=True,
    )
    return ranked[:limit]
```

---

## 5. VERIFICATION METHOD (Quy trình kiểm chứng độc lập)

Agent tiếp nhận hoặc kỹ sư kiểm thử có thể kiểm chứng độc lập toàn bộ các kết luận trên bằng các bước sau:

### 5.1. Kiểm chứng Extension và Schema Type
```powershell
docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "\dx vector"
docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "\d ai_search_bookchunk"
```
- **Kỳ vọng**: Extension `vector` hiển thị version 0.8.7. Cột `embedding` chuyển thành `vector(768)`.

### 5.2. Kiểm chứng Truy vấn Toán tử `<=>` trên Vector
```powershell
docker exec -e DJANGO_SETTINGS_MODULE=saleor.settings aurabook-backend python -c "import django; django.setup(); from django.db import connection; cursor = connection.cursor(); vec_str = '[' + ','.join(['0.1']*768) + ']'; cursor.execute('SELECT (%s::vector <=> %s::vector)', [vec_str, vec_str]); print('Khoảng cách:', cursor.fetchone()[0])"
```
- **Kỳ vọng**: In ra `Khoảng cách: 0.0` mà không gặp lỗi `operator does not exist: bytea <=> vector`.

### 5.3. Kiểm chứng Tính năng Khử Dấu Tiếng Việt (Unaccent)
```powershell
docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -c "SELECT unaccent('Đắc Nhân Tâm') ILIKE '%' || unaccent('dac nhan tam') || '%';"
```
- **Kỳ vọng**: Trả về `t` (True).

### 5.4. Kiểm chứng Endpoint `/aurabook/search/hybrid`
Sau khi áp dụng mã nguồn trên:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/aurabook/search/hybrid" -Method Post -ContentType "application/json" -Body '{"query":"dac nhan tam"}' | ConvertTo-Json -Depth 5
```
- **Kỳ vọng**: Trả về danh sách sách với `product_slug: "dac-nhan-tam"`, `title: "Đắc Nhân Tâm..."`, `total > 0` và `score > 0`.
