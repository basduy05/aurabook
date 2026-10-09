import uuid

from django.db import models
from django.utils import timezone


class DRMSession(models.Model):
    """Lưu session key đã mã hóa cho mỗi phiên đọc sách.
    Session key plaintext KHÔNG bao giờ được lưu — chỉ lưu ciphertext.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_email = models.EmailField(db_index=True)
    # Saleor Product ID (UUID hoặc global ID)
    product_id = models.CharField(max_length=255, db_index=True)
    # Saleor Order ID để xác minh trạng thái PAID/FULFILLED
    order_id = models.CharField(max_length=255)
    # AES-256-GCM encrypted session key (stored as bytes)
    key_nonce = models.BinaryField(max_length=12)        # 12-byte nonce
    key_ciphertext = models.BinaryField(max_length=64)   # 32-byte key + 16-byte tag
    # Thời hạn session
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)

    class Meta:
        app_label = "drm"
        indexes = [
            models.Index(fields=["user_email", "product_id"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_valid(self) -> bool:
        return not self.is_revoked and timezone.now() < self.expires_at

    def __str__(self) -> str:
        return f"DRMSession({self.user_email}, product={self.product_id})"


class ReadingProgress(models.Model):
    """Lưu tiến độ đọc sách của từng user."""

    user_email = models.EmailField(db_index=True)
    product_id = models.CharField(max_length=255, db_index=True)
    current_page = models.PositiveIntegerField(default=1)
    total_pages = models.PositiveIntegerField(default=1)
    completion_percent = models.FloatField(default=0.0)
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "drm"
        unique_together = [("user_email", "product_id")]

    @property
    def progress_percent(self) -> float:
        if self.total_pages == 0:
            return 0.0
        return round((self.current_page / self.total_pages) * 100, 1)

    def __str__(self) -> str:
        return f"ReadingProgress({self.user_email}, {self.product_id}: {self.completion_percent:.1f}%)"
