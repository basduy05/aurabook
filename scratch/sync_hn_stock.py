import sys
from saleor.warehouse.models import Warehouse, Stock
from saleor.shipping.models import ShippingZone
from saleor.product.models import ProductVariant

try:
    w_hn = Warehouse.objects.filter(slug='kho-tong-aurabook-ha-noi').first()
    if not w_hn:
        w_hn = Warehouse.objects.create(name='Kho Tổng Aurabook Hà Nội', slug='kho-tong-aurabook-ha-noi')
        print('Created Kho Tổng Aurabook Hà Nội')
    else:
        print('Found Kho Tổng Aurabook Hà Nội:', w_hn.id)

    # 1. Update Shipping Zone for VN
    vn_zones = ShippingZone.objects.filter(countries__contains=['VN'])
    if not vn_zones.exists():
        vn_zones = ShippingZone.objects.filter(name__icontains='Nam')
    
    for zone in vn_zones:
        print(f"Configuring zone: {zone.name} (id={zone.id})")
        # Ensure Kho Tong Ha Noi is linked
        zone.warehouses.add(w_hn)
        # Also link Default and Asia warehouses as backup
        for slug in ['default-warehouse', 'default', 'asia']:
            w = Warehouse.objects.filter(slug=slug).first()
            if w:
                zone.warehouses.add(w)
                print(f"  Added warehouse {w.name} to zone {zone.name}")
        zone.save()

    # 2. Add stock for ALL ProductVariants in Kho Tổng Aurabook Hà Nội
    variants = ProductVariant.objects.all()
    created_count = 0
    updated_count = 0

    for variant in variants:
        stock, created = Stock.objects.get_or_create(
            warehouse=w_hn,
            product_variant=variant,
            defaults={'quantity': 500, 'quantity_allocated': 0}
        )
        if created:
            created_count += 1
        else:
            if stock.quantity < 50:
                stock.quantity = 500
                stock.save(update_fields=['quantity'])
                updated_count += 1

    print(f"\nStock update complete!")
    print(f"Total variants: {variants.count()}")
    print(f"Created stock entries in Kho HN: {created_count}")
    print(f"Updated stock entries in Kho HN: {updated_count}")
    print(f"Total stock entries in Kho HN: {Stock.objects.filter(warehouse=w_hn).count()}")

    # Verify Blue Polygon Shirt
    shirt_variants = ProductVariant.objects.filter(product__name__icontains='Polygon')
    for sv in shirt_variants:
        hn_stock = Stock.objects.filter(warehouse=w_hn, product_variant=sv).first()
        print(f"Variant: {sv.product.name} - {sv.name} -> Kho HN qty: {hn_stock.quantity if hn_stock else 'NONE'}")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    raise
