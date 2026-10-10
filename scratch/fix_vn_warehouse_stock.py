from saleor.shipping.models import ShippingZone
from saleor.warehouse.models import Warehouse, Stock
from saleor.product.models import ProductVariant

vn_zone = ShippingZone.objects.filter(name__icontains='Việt Nam').first()
if not vn_zone:
    print('Creating or finding VN zone...')
    vn_zone = ShippingZone.objects.create(name='Việt Nam (GHN)', countries=['VN'])

w_hn = Warehouse.objects.filter(name__icontains='Hà Nội').first()
if not w_hn:
    w_hn = Warehouse.objects.create(name='Kho Tổng Aurabook Hà Nội', slug='kho-tong-aurabook-ha-noi')

# 1. Link VN zone to Kho Tổng Hà Nội AND Default Warehouse, Asia
warehouses_to_link = [w_hn]
for w_name in ['Default Warehouse', 'Default', 'Default for click and collect', 'Asia']:
    w = Warehouse.objects.filter(name=w_name).first()
    if w:
        warehouses_to_link.append(w)

for w in warehouses_to_link:
    vn_zone.warehouses.add(w)
    print(f'Linked VN Zone to warehouse: {w.name}')

# 2. Add stock for EVERY product variant in Kho Tổng Aurabook Hà Nội (500 units each)
variants = ProductVariant.objects.all()
created_count = 0
updated_count = 0

for v in variants:
    stock, created = Stock.objects.get_or_create(
        warehouse=w_hn,
        product_variant=v,
        defaults={'quantity': 500, 'quantity_allocated': 0}
    )
    if created:
        created_count += 1
    else:
        if stock.quantity < 50:
            stock.quantity = 500
            stock.save(update_fields=['quantity'])
            updated_count += 1

print(f'\nFinished! Added stock in Kho Tổng Hà Nội: {created_count} created, {updated_count} updated. Total variants: {variants.count()}')
print(f'Total stock records in Kho Tổng Hà Nội now: {Stock.objects.filter(warehouse=w_hn).count()}')
