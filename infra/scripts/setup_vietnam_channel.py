import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from decimal import Decimal
from django.utils import timezone
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, ChannelWarehouse
from saleor.shipping.models import ShippingZone, ShippingMethodChannelListing
from saleor.product.models import Product, ProductVariant, ProductChannelListing, ProductVariantChannelListing

# 1. Create or get channel-vnd
channel, created = Channel.objects.get_or_create(
    slug="channel-vnd",
    defaults={
        "name": "Vietnam (VND)",
        "currency_code": "VND",
        "default_country": "VN",
        "is_active": True,
    }
)
print(f"Channel channel-vnd created={created}, id={channel.id}")

# 2. Attach warehouse & TaxConfiguration
from saleor.tax.models import TaxConfiguration

warehouse = Warehouse.objects.first()
if warehouse:
    ChannelWarehouse.objects.get_or_create(channel=channel, warehouse=warehouse)
    print(f"Attached warehouse {warehouse.name} to channel-vnd")

ref_tc = TaxConfiguration.objects.filter(channel_id=1).first()
tc, tc_created = TaxConfiguration.objects.get_or_create(
    channel=channel,
    defaults={
        "charge_taxes": ref_tc.charge_taxes if ref_tc else True,
        "tax_calculation_strategy": ref_tc.tax_calculation_strategy if ref_tc else "FLAT_RATES",
        "display_gross_prices": ref_tc.display_gross_prices if ref_tc else True,
        "prices_entered_with_tax": ref_tc.prices_entered_with_tax if ref_tc else True,
    }
)
print(f"TaxConfiguration for channel-vnd created={tc_created}")

# 3. Attach shipping zones & methods
default_ch = Channel.objects.filter(slug="default-channel").first()
for sz in ShippingZone.objects.all():
    sz.channels.add(channel)
    for sm in sz.shipping_methods.all():
        ShippingMethodChannelListing.objects.get_or_create(
            shipping_method=sm,
            channel=channel,
            defaults={
                "currency": "VND",
                "price_amount": Decimal("30000"),
                "minimum_order_price_amount": Decimal("0"),
            }
        )
print(f"Attached shipping zones and methods to channel-vnd")

# 4. Map products and variants to channel-vnd
now = timezone.now()
count_prod = 0
count_variant = 0

for product in Product.objects.all():
    # ProductChannelListing
    ProductChannelListing.objects.update_or_create(
        product=product,
        channel=channel,
        defaults={
            "is_published": True,
            "visible_in_listings": True,
            "available_for_purchase_at": now,
            "discounted_price_amount": Decimal("120000"),
        }
    )
    count_prod += 1

    # ProductVariantChannelListing
    for variant in product.variants.all():
        # Get price from default channel if exists
        def_listing = ProductVariantChannelListing.objects.filter(variant=variant, channel=default_ch).first()
        if def_listing and def_listing.price_amount:
            vnd_price = (def_listing.price_amount * Decimal("25000")).quantize(Decimal("1000"))
        else:
            vnd_price = Decimal("150000")

        ProductVariantChannelListing.objects.update_or_create(
            variant=variant,
            channel=channel,
            defaults={
                "currency": "VND",
                "price_amount": vnd_price,
                "cost_price_amount": vnd_price * Decimal("0.7"),
            }
        )
        count_variant += 1

print(f"Mapped {count_prod} products and {count_variant} variants to channel-vnd with VND pricing.")
