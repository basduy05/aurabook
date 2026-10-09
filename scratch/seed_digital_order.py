import os
from decimal import Decimal
from django.utils import timezone
from saleor.account.models import User, Address
from saleor.channel.models import Channel
from saleor.order.models import Order, OrderLine
from saleor.order import OrderStatus
from saleor.payment import ChargeStatus
from saleor.product.models import ProductVariant
from aurabook_apps.drm.models import DRMSession, ReadingProgress
from datetime import timedelta

print("Seeding real digital orders for all users...")
channel = Channel.objects.filter(slug="channel-vnd").first() or Channel.objects.first()
address = Address.objects.first()

users = list(User.objects.filter(email__in=["basduygame@gmail.com", "basduy05@gmail.com", "customer@example.com"]))
variants = list(ProductVariant.objects.filter(product__product_type__name="Audiobook"))

for idx, user in enumerate(users):
    existing = Order.objects.filter(user=user, lines__variant__in=variants).first()
    if existing:
        print(f"User {user.email} already has order {existing.number}")
        order = existing
    else:
        var = variants[idx % len(variants)]
        order = Order.objects.create(
            user=user,
            user_email=user.email,
            channel=channel,
            billing_address=address,
            shipping_address=None,
            status=OrderStatus.FULFILLED,
            charge_status=ChargeStatus.FULLY_CHARGED,
            currency=channel.currency_code,
            total_net_amount=Decimal("150000"),
            total_gross_amount=Decimal("150000"),
            subtotal_net_amount=Decimal("150000"),
            subtotal_gross_amount=Decimal("150000"),
            total_authorized_amount=Decimal("150000"),
            base_shipping_price_amount=Decimal("0"),
            undiscounted_base_shipping_price_amount=Decimal("0"),
            lines_count=1,
            should_refresh_prices=False,
        )
        line = OrderLine.objects.create(
            order=order,
            variant=var,
            product_name=var.product.name,
            variant_name=var.name,
            product_sku=var.sku,
            is_shipping_required=False,
            is_gift_card=False,
            quantity=1,
            quantity_fulfilled=1,
            unit_price_net_amount=Decimal("150000"),
            unit_price_gross_amount=Decimal("150000"),
            total_price_net_amount=Decimal("150000"),
            total_price_gross_amount=Decimal("150000"),
            undiscounted_unit_price_net_amount=Decimal("150000"),
            undiscounted_unit_price_gross_amount=Decimal("150000"),
            undiscounted_total_price_net_amount=Decimal("150000"),
            undiscounted_total_price_gross_amount=Decimal("150000"),
            base_unit_price_amount=Decimal("150000"),
            undiscounted_base_unit_price_amount=Decimal("150000"),
            currency=channel.currency_code,
        )
        print(f"Created real order #{order.number} for {user.email} with book {var.product.name}")

    # Seed ReadingProgress and DRM session for the product
    for line in order.lines.all():
        if line.variant:
            prod_id = str(line.variant.product.id)
            ReadingProgress.objects.update_or_create(
                user_email=user.email,
                product_id=prod_id,
                defaults={
                    "current_page": 45,
                    "total_pages": 180,
                    "completion_percent": 25.0,
                }
            )
            DRMSession.objects.update_or_create(
                user_email=user.email,
                product_id=prod_id,
                defaults={
                    "order_id": str(order.id),
                    "key_nonce": os.urandom(12),
                    "key_ciphertext": os.urandom(48),
                    "expires_at": timezone.now() + timedelta(days=365),
                    "is_revoked": False,
                }
            )
            print(f"Seeded DRM session and ReadingProgress for {user.email} - product {prod_id}")

print("Done seeding all digital orders!")
