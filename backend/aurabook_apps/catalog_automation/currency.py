import logging
import os
from decimal import Decimal

from saleor.channel.models import Channel
from saleor.product.models import (
    Product,
    ProductChannelListing,
    ProductVariant,
    ProductVariantChannelListing,
)

logger = logging.getLogger(__name__)

# Tỷ giá hối đoái cơ sở (USD làm mốc)
DEFAULT_RATES = {
    "USD": 1.0,
    "VND": float(os.environ.get("EXCHANGE_RATE_USD_VND", 25400.0)),
    "PLN": float(os.environ.get("EXCHANGE_RATE_USD_PLN", 3.96)),
}


def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """Tính tỷ giá giữa 2 đơn vị tiền tệ từ bảng tỷ giá USD cơ sở.
    """
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()

    if from_curr == to_curr:
        return 1.0

    rate_from = DEFAULT_RATES.get(from_curr, 1.0)
    rate_to = DEFAULT_RATES.get(to_curr, 1.0)

    # rate_to (quy ra USD) / rate_from (quy ra USD)
    return rate_to / rate_from


def convert_price(amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
    """Quy đổi giá tiền từ from_currency sang to_currency với quy tắc làm tròn chuẩn e-commerce.
    - VND: làm tròn đến hàng nghìn (ví dụ 149,000 đ hoặc 150,000 đ)
    - USD / EUR / PLN: làm tròn 2 chữ số thập phân (ví dụ 5.99)
    """
    if not amount or amount <= 0:
        return Decimal("0.00")

    rate = get_exchange_rate(from_currency, to_currency)
    converted = float(amount) * rate

    to_curr = to_currency.upper()
    if to_curr == "VND":
        # Làm tròn hàng nghìn
        rounded = round(converted, -3)
        return Decimal(str(int(rounded)))
    # Làm tròn 2 chữ số thập phân
    rounded = round(converted, 2)
    return Decimal(f"{rounded:.2f}")


def sync_variant_channel_listings(variant: ProductVariant) -> list[ProductVariantChannelListing]:
    """Tự động đồng bộ và sinh giá cho biến thể trên tất cả các kênh (VND, USD, PLN...).
    Nếu variant đã có giá ở 1 kênh (ví dụ VND), hệ thống sẽ tự động tính và tạo listing
    cho các kênh còn lại (USD) để không bị lỗi 'sản phẩm không khả dụng' khi chuyển kênh.
    """
    channels = list(Channel.objects.filter(is_active=True))
    if not channels:
        return []

    # Tìm listing nguồn có giá hợp lệ
    existing_listings = {
        l.channel_id: l for l in variant.channel_listings.filter(price_amount__isnull=False)
    }

    if not existing_listings:
        # Chưa có kênh nào có giá, không thể quy đổi
        return []

    # Chọn listing có giá làm nguồn
    source_listing = None
    # Ưu tiên kênh VND hoặc USD nếu có
    for l in existing_listings.values():
        if l.channel.slug in ("channel-vnd", "default-channel"):
            source_listing = l
            break
    if not source_listing:
        source_listing = next(iter(existing_listings.values()))

    source_amount = source_listing.price_amount
    source_curr = source_listing.currency

    synced_listings = []

    for channel in channels:
        target_curr = channel.currency_code
        curr_listing = existing_listings.get(channel.id)

        if curr_listing and curr_listing.price_amount:
            synced_listings.append(curr_listing)
            continue

        # Kênh này chưa có giá -> tự động tính và tạo mới
        converted_amount = convert_price(source_amount, source_curr, target_curr)
        new_listing, created = ProductVariantChannelListing.objects.update_or_create(
            variant=variant,
            channel=channel,
            defaults={
                "currency": target_curr,
                "price_amount": converted_amount,
                "discounted_price_amount": converted_amount,
                "cost_price_amount": convert_price(source_listing.cost_price_amount, source_curr, target_curr)
                if source_listing.cost_price_amount
                else None,
            },
        )
        logger.info(
            "Tự động tạo giá cho variant %s trên channel %s: %s %s (quy đổi từ %s %s)",
            variant.sku or variant.id,
            channel.slug,
            converted_amount,
            target_curr,
            source_amount,
            source_curr,
        )
        synced_listings.append(new_listing)

    # Đảm bảo ProductChannelListing cũng tồn tại cho tất cả channel để sản phẩm hiển thị
    ensure_product_published_in_all_channels(variant.product, channels)

    return synced_listings


def ensure_product_published_in_all_channels(product: Product, channels: list[Channel] | None = None):
    """Đảm bảo sản phẩm có ProductChannelListing được publish trên tất cả các kênh đang active.
    """
    if channels is None:
        channels = list(Channel.objects.filter(is_active=True))

    for channel in channels:
        ProductChannelListing.objects.get_or_create(
            product=product,
            channel=channel,
            defaults={
                "is_published": True,
                "visible_in_listings": True,
                "currency": channel.currency_code,
            },
        )
