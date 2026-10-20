import os
import sys

sys.path.insert(0, "/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from saleor.product.models import Product, Category, ProductType, ProductVariant, ProductMedia, DigitalContent
from saleor.attribute.models import Attribute, AttributeValue
from saleor.channel.models import Channel

print("=== PRODUCT TYPES ===")
for pt in ProductType.objects.all():
    print(f"ProductType: id={pt.id}, name={pt.name}, slug={pt.slug}, has_variants={pt.has_variants}, is_shipping_required={pt.is_shipping_required}")

print("\n=== ATTRIBUTES ===")
for attr in Attribute.objects.all():
    vals = [v.name for v in attr.values.all()]
    print(f"Attribute: id={attr.id}, name={attr.name}, slug={attr.slug}, type={attr.type}, values={vals}")

print("\n=== PRODUCTS ===")
for p in Product.objects.all():
    variants = list(p.variants.all())
    var_info = []
    for v in variants:
        is_dig = hasattr(v, 'digital_content')
        var_info.append(f"{v.name} (sku={v.sku}, digital={is_dig})")
    print(f"Product: id={p.id}, name={p.name}, slug={p.slug}, cat={p.category.name if p.category else None}, type={p.product_type.name}, variants={var_info}")
