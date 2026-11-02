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
