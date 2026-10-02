import uuid
from django.db import models


class AudioTeaser(models.Model):
    """60s audio teaser cho mỗi sách."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.CharField(max_length=255, unique=True, db_index=True)
    product_slug = models.CharField(max_length=255, db_index=True)
    file_path = models.CharField(max_length=500)   # relative path trong media/
    duration_seconds = models.FloatField(default=60.0)
    file_size_bytes = models.PositiveBigIntegerField(default=0)
    mime_type = models.CharField(max_length=50, default="audio/wav")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "audio"

    def __str__(self) -> str:
        return f"AudioTeaser({self.product_slug}, {self.duration_seconds:.0f}s)"
