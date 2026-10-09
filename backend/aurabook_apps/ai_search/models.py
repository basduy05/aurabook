import uuid

from django.db import models


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
    # Vector embedding 768-dim (stored as pgvector)
    # Sử dụng pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
    # Field này cần django-pgvector package hoặc raw SQL
    embedding = models.BinaryField(null=True, blank=True)  # fallback nếu chưa có pgvector
    token_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "ai_search"
        unique_together = [("product_id", "chunk_index")]
        indexes = [
            models.Index(fields=["product_id", "chunk_index"]),
        ]

    def __str__(self) -> str:
        return f"BookChunk({self.product_slug}[{self.chunk_index}])"
