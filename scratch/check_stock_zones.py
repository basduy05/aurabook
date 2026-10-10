from saleor.product.models import Product, ProductVariant
from saleor.warehouse.models import Stock, Warehouse
from saleor.shipping.models import ShippingZone

vn_zones = ShippingZone.objects.filter(countries__contains=['VN'])
print('Shipping zones with VN:')
for z in vn_zones:
    print(f'  Zone: {z.name}, Warehouses: {[w.name for w in z.warehouses.all()]}')

print('\nAll Warehouses and their shipping zones:')
for w in Warehouse.objects.all():
    can_ship_vn = w.shipping_zones.filter(countries__contains=['VN']).exists()
    print(f'  Warehouse: {w.name}, can_ship_to_vn={can_ship_vn}, zones={[z.name for z in w.shipping_zones.all()]}')

p = Product.objects.get(name__icontains='Blue Polygon Shirt')
print(f'\nProduct: {p.name} (slug: {p.slug})')
for v in p.variants.all():
    print(f'  Variant: {v.name} ({v.sku})')
    for s in v.stocks.all():
        can_ship = s.warehouse.shipping_zones.filter(countries__contains=['VN']).exists()
        print(f'    Warehouse: {s.warehouse.name}, qty: {s.quantity}, can_ship_to_vn: {can_ship}')
