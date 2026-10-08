import logging
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver

from saleor.product.models import (
    Category,
    Product,
    ProductVariant,
    ProductVariantChannelListing,
)
from .currency import (
    ensure_product_published_in_all_channels,
    sync_variant_channel_listings,
)
from .translator import (
    sync_category_translations,
    sync_product_translations,
)

logger = logging.getLogger(__name__)

# Cờ ngăn vòng lặp đệ quy trong Django Signals
_GUARD = threading.local()


@receiver(post_save, sender=Product)
def on_product_saved(sender, instance: Product, created: bool, **kwargs):
    """
    Kích hoạt khi sản phẩm được tạo mới hoặc chỉnh sửa (qua Dashboard, API, hoặc script).
    Tự động:
    1. Dịch tên, mô tả EditorJS, SEO sang cả EN và VI.
    2. Đảm bảo ProductChannelListing tồn tại trên tất cả các kênh (VND, USD...).
    """
    if getattr(_GUARD, "active", False):
        return

    _GUARD.active = True
    try:
        # Tự động dịch song ngữ
        sync_product_translations(instance)
        # Đảm bảo hiển thị trên mọi kênh
        ensure_product_published_in_all_channels(instance)
    except Exception as exc:
        logger.error("Lỗi khi auto-sync product %s: %s", instance.id, exc, exc_info=True)
    finally:
        _GUARD.active = False


@receiver(post_save, sender=ProductVariantChannelListing)
def on_variant_channel_listing_saved(sender, instance: ProductVariantChannelListing, created: bool, **kwargs):
    """
    Kích hoạt khi một mức giá được gán cho một biến thể trên bất kỳ kênh nào.
    Tự động:
    1. Tính và đồng bộ giá quy đổi sang các kênh còn lại (VND <-> USD).
    """
    if getattr(_GUARD, "active", False):
        return

    # Chỉ xử lý khi có giá hợp lệ
    try:
        price_val = float(instance.price_amount) if instance.price_amount is not None else 0
    except (ValueError, TypeError):
        price_val = 0

    if price_val <= 0:
        return

    _GUARD.active = True
    try:
        sync_variant_channel_listings(instance.variant)
    except Exception as exc:
        logger.error("Lỗi khi auto-sync variant listing %s: %s", instance.id, exc, exc_info=True)
    finally:
        _GUARD.active = False


@receiver(post_save, sender=Category)
def on_category_saved(sender, instance: Category, created: bool, **kwargs):
    """
    Tự động dịch danh mục khi tạo hoặc cập nhật.
    """
    if getattr(_GUARD, "active", False):
        return

    _GUARD.active = True
    try:
        sync_category_translations(instance)
    except Exception as exc:
        logger.error("Lỗi khi auto-sync category %s: %s", instance.id, exc)
    finally:
        _GUARD.active = False
