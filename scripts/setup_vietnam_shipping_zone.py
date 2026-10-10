import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
django.setup()

from saleor.shipping.models import ShippingZone, ShippingMethod, ShippingMethodChannelListing
from saleor.shipping import ShippingMethodType
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, ChannelWarehouse

def configure_vietnam_shipping():
    channel_vnd = Channel.objects.filter(slug="channel-vnd").first()
    default_channel = Channel.objects.filter(slug="default-channel").first()
    warehouse = Warehouse.objects.filter(name__icontains="Aurabook").first() or Warehouse.objects.first()

    # 1. Shipping Zone riêng cho Vietnam
    vn_zone, _ = ShippingZone.objects.get_or_create(
        name="Việt Nam (GHN)",
        defaults={"countries": ["VN"]}
    )
    vn_zone.countries = ["VN"]
    vn_zone.save()

    if channel_vnd:
        vn_zone.channels.add(channel_vnd)
    if default_channel:
        vn_zone.channels.add(default_channel)

    if warehouse:
        warehouse.shipping_zones.add(vn_zone)
        if channel_vnd:
            ChannelWarehouse.objects.get_or_create(channel=channel_vnd, warehouse=warehouse)
        if default_channel:
            ChannelWarehouse.objects.get_or_create(channel=default_channel, warehouse=warehouse)

    # Cũng xóa 'VN' khỏi các zone khác để tránh conflict
    for z in ShippingZone.objects.exclude(id=vn_zone.id):
        if "VN" in [c.code for c in z.countries]:
            countries = [c.code for c in z.countries if c.code != "VN"]
            z.countries = countries
            z.save()
            print(f"Removed VN from {z.name}")

    # 2. Định nghĩa 4 phương thức vận chuyển chuẩn GHN
    methods_data = [
        {
            "name": "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Nội thành HN)",
            "min_days": 1,
            "max_days": 2,
            "vnd_price": 16500,
            "vnd_min_order": 0,
            "vnd_max_order": 499999,
            "usd_price": 0.70,
            "usd_min_order": 0,
            "usd_max_order": 20.0,
        },
        {
            "name": "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Kho Hà Nội)",
            "min_days": 2,
            "max_days": 4,
            "vnd_price": 22000,
            "vnd_min_order": 0,
            "vnd_max_order": 499999,
            "usd_price": 0.90,
            "usd_min_order": 0,
            "usd_max_order": 20.0,
        },
        {
            "name": "Giao Hàng Nhanh (GHN) - Hỏa Tốc (Nội thành HN)",
            "min_days": 1,
            "max_days": 1,
            "vnd_price": 35000,
            "vnd_min_order": 0,
            "vnd_max_order": None,
            "usd_price": 1.40,
            "usd_min_order": 0,
            "usd_max_order": None,
        },
        {
            "name": "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Miễn phí)",
            "min_days": 1,
            "max_days": 3,
            "vnd_price": 0,
            "vnd_min_order": 500000,
            "vnd_max_order": None,
            "usd_price": 0.0,
            "usd_min_order": 20.0,
            "usd_max_order": None,
        },
    ]

    for m in methods_data:
        sm, _ = ShippingMethod.objects.get_or_create(
            name=m["name"],
            shipping_zone=vn_zone,
            defaults={
                "type": ShippingMethodType.PRICE_BASED,
                "minimum_delivery_days": m["min_days"],
                "maximum_delivery_days": m["max_days"],
            }
        )
        sm.type = ShippingMethodType.PRICE_BASED
        sm.shipping_zone = vn_zone
        sm.minimum_delivery_days = m["min_days"]
        sm.maximum_delivery_days = m["max_days"]
        sm.save()

        # Channel VND
        if channel_vnd:
            cl_vnd, _ = ShippingMethodChannelListing.objects.get_or_create(
                shipping_method=sm,
                channel=channel_vnd,
                defaults={
                    "price_amount": m["vnd_price"],
                    "currency": "VND",
                    "minimum_order_price_amount": m["vnd_min_order"],
                    "maximum_order_price_amount": m["vnd_max_order"],
                }
            )
            cl_vnd.price_amount = m["vnd_price"]
            cl_vnd.currency = "VND"
            cl_vnd.minimum_order_price_amount = m["vnd_min_order"]
            cl_vnd.maximum_order_price_amount = m["vnd_max_order"]
            cl_vnd.save()

        # Default Channel (USD)
        if default_channel:
            cl_usd, _ = ShippingMethodChannelListing.objects.get_or_create(
                shipping_method=sm,
                channel=default_channel,
                defaults={
                    "price_amount": m["usd_price"],
                    "currency": "USD",
                    "minimum_order_price_amount": m["usd_min_order"],
                    "maximum_order_price_amount": m["usd_max_order"],
                }
            )
            cl_usd.price_amount = m["usd_price"]
            cl_usd.currency = "USD"
            cl_usd.minimum_order_price_amount = m["usd_min_order"]
            cl_usd.maximum_order_price_amount = m["usd_max_order"]
            cl_usd.save()

        print(f"Configured method: {sm.name} in VN Zone")

    print("Vietnam Shipping Zone and methods configured successfully!")

if __name__ == "__main__":
    configure_vietnam_shipping()
