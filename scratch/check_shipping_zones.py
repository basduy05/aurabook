from saleor.shipping.models import ShippingZone
from saleor.warehouse.models import Warehouse, Stock
from saleor.product.models import ProductVariant

for z in ShippingZone.objects.all():
    print('Zone:', z.name, 'countries count:', len(z.countries), 'channels:', [c.slug for c in z.channels.all()])
    if 'VN' in [str(c) for c in z.countries]:
        print('  -> HAS VN!')

w_hn = Warehouse.objects.filter(name__icontains='Hà Nội').first()
print('Kho Tổng Hà Nội:', w_hn)
if w_hn:
    print('  Stock count in Kho Tổng Hà Nội:', Stock.objects.filter(warehouse=w_hn).count())
