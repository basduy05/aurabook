import os
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode()
os.environ["RSA_PRIVATE_KEY"] = pem
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from saleor.product.models import Product, Category, ProductVariant

print(f"=== TỔNG QUAN HỆ THỐNG AURABOOK ===")
print(f"Tổng số danh mục: {Category.objects.count()}")
for cat in Category.objects.filter(level=0):
    print(f"📁 {cat.name} ({cat.slug})")
    for sub in cat.get_children():
        print(f"   └── 📄 {sub.name} ({sub.slug})")

print(f"\nTổng số sản phẩm sách: {Product.objects.count()}")
for p in Product.objects.all():
    print(f"\n📖 Sách: {p.name}")
    print(f"   Danh mục: {p.category.name if p.category else 'N/A'}")
    print(f"   Phân loại (Variants):")
    for v in p.variants.all():
        prices = [f"{l.channel.currency_code}: {l.price_amount:,.0f}" for l in v.channel_listings.all()]
        stock_sum = sum(s.quantity for s in v.stocks.all())
        print(f"     • {v.name} | SKU: {v.sku} | Giá: {', '.join(prices)} | Kho: {stock_sum} bản | Cân nặng: {v.weight}")
