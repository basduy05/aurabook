import sys
from django.core.management.base import BaseCommand
from saleor.product.models import Category, Product, ProductVariant

from aurabook_apps.catalog_automation.currency import (
    ensure_product_published_in_all_channels,
    sync_variant_channel_listings,
)
from aurabook_apps.catalog_automation.translator import (
    sync_category_translations,
    sync_product_translations,
)


class Command(BaseCommand):
    help = "Tu dong dich song ngu (EN <-> VI) va tu dong quy doi gia da kenh (VND <-> USD) cho toan bo catalog"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Gioi han so luong san pham xu ly (0 la tat ca)",
        )

    def handle(self, *args, **options):
        try:
            if hasattr(sys.stdout, "reconfigure"):
                sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

        self.stdout.write(self.style.NOTICE("=== BAT DAU DONG BO VA DICH TU DONG CATALOG ==="))

        # 1. Dong bo Categories
        categories = Category.objects.all()
        self.stdout.write(f"Dang dong bo ban dich cho {categories.count()} danh muc...")
        for cat in categories:
            try:
                sync_category_translations(cat)
                self.stdout.write(self.style.SUCCESS(f"  [OK] Danh muc: {cat.name}"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  [ERROR] Danh muc {cat.name}: {e}"))

        # 2. Dong bo Products & Variants
        products_qs = Product.objects.all()
        limit = options.get("limit", 0)
        if limit > 0:
            products_qs = products_qs[:limit]

        total_products = products_qs.count()
        self.stdout.write(f"\nDang xu ly {total_products} san pham...")

        for i, product in enumerate(products_qs, 1):
            self.stdout.write(f"\n[{i}/{total_products}] San pham: {product.name} (ID: {product.id})")
            # Dich song ngu
            try:
                trans_list = sync_product_translations(product)
                trans_langs = [t.language_code for t in trans_list]
                self.stdout.write(self.style.SUCCESS(f"  [OK] Ban dich: {trans_langs}"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  [ERROR] Loi dich san pham: {e}"))

            # Dam bao publish tren moi kenh
            ensure_product_published_in_all_channels(product)

            # Dong bo gia cho tat ca bien the
            variants = product.variants.all()
            for v in variants:
                try:
                    listings = sync_variant_channel_listings(v)
                    listings_summary = [f"{l.channel.slug}: {l.price_amount} {l.currency}" for l in listings]
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Bien the {v.sku or v.id}: {', '.join(listings_summary)}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  [ERROR] Loi dong bo gia bien the {v.sku}: {e}"))

        self.stdout.write(self.style.SUCCESS("\n=== HOAN TAT DONG BO VA DICH TU DONG CATALOG! ==="))
