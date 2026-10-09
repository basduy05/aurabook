import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
django.setup()

from saleor.account.models import Address
from saleor.warehouse.models import Warehouse, ChannelWarehouse
from saleor.channel.models import Channel
from saleor.shipping.models import ShippingZone, ShippingMethod, ShippingMethodChannelListing
from saleor.shipping import ShippingMethodType
from prices import Money

def setup():
    print("Setting up Hanoi Warehouse and GHN Shipping in Saleor...")

    # 1. Address for Hanoi Warehouse
    addr, _ = Address.objects.get_or_create(
        street_address_1="Số 12 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy",
        city="Hà Nội",
        country="VN",
        defaults={
            "first_name": "Quản Lý",
            "last_name": "Kho Hà Nội",
            "company_name": "Nhà sách Trực tuyến Aurabook Việt Nam",
            "postal_code": "100000",
            "phone": "+84912345678"
        }
    )

    # 2. Warehouse
    warehouse, created = Warehouse.objects.get_or_create(
        slug="kho-tong-aurabook-ha-noi",
        defaults={
            "name": "Kho Tổng Aurabook Hà Nội",
            "email": "khohanoi@aurabook.vn",
            "address": addr
        }
    )
    if not created:
        warehouse.name = "Kho Tổng Aurabook Hà Nội"
        warehouse.address = addr
        warehouse.save()

    print(f"Warehouse: {warehouse.name} ({warehouse.slug})")

    # Link warehouse with channel-vnd
    channel_vnd = Channel.objects.filter(slug="channel-vnd").first()
    if channel_vnd:
        ChannelWarehouse.objects.get_or_create(channel=channel_vnd, warehouse=warehouse)
        print(f"Linked warehouse with {channel_vnd.slug}")

    # Link warehouse with shipping zones
    zones = ShippingZone.objects.all()
    for z in zones:
        warehouse.shipping_zones.add(z)

    # 3. Shipping Methods for GHN
    # Check or create Vietnam Shipping Zone or add to Asia zone
    asia_zone = ShippingZone.objects.filter(name="Asia").first() or zones.first()

    ghn_standard, _ = ShippingMethod.objects.get_or_create(
        name="Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Kho Hà Nội)",
        shipping_zone=asia_zone,
        defaults={
            "type": ShippingMethodType.PRICE_BASED,
            "minimum_delivery_days": 2,
            "maximum_delivery_days": 4
        }
    )

    ghn_express, _ = ShippingMethod.objects.get_or_create(
        name="Giao Hàng Nhanh (GHN) - Hỏa Tốc (Nội thành HN)",
        shipping_zone=asia_zone,
        defaults={
            "type": ShippingMethodType.PRICE_BASED,
            "minimum_delivery_days": 1,
            "maximum_delivery_days": 2
        }
    )

    if channel_vnd:
        # 22,000 VND for Standard
        smcl_std, _ = ShippingMethodChannelListing.objects.get_or_create(
            shipping_method=ghn_standard,
            channel=channel_vnd,
            defaults={
                "price_amount": 22000,
                "currency": "VND"
            }
        )
        smcl_std.price_amount = 22000
        smcl_std.save()

        # 35,000 VND for Express
        smcl_exp, _ = ShippingMethodChannelListing.objects.get_or_create(
            shipping_method=ghn_express,
            channel=channel_vnd,
            defaults={
                "price_amount": 35000,
                "currency": "VND"
            }
        )
        smcl_exp.price_amount = 35000
        smcl_exp.save()

    print("GHN Shipping Methods configured successfully!")

if __name__ == "__main__":
    setup()
