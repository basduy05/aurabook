import os
import sys
import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.order.models import Order, Fulfillment, FulfillmentLine, OrderEvent
from saleor.order import OrderStatus, FulfillmentStatus, OrderEvents
from saleor.warehouse.models import Warehouse, Stock

def sync_ghn_for_order(order_number, tracking_code=None, status="delivered", service_name="Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Kho Hà Nội)"):
    try:
        order = Order.objects.get(number=order_number)
    except Order.DoesNotExist:
        print(f"Order #{order_number} does not exist.")
        return None

    if not tracking_code:
        tracking_code = f"GHN{83921000 + int(order_number)}VN"

    hanoi_wh = Warehouse.objects.filter(name__icontains="Hà Nội").first()
    if not hanoi_wh:
        hanoi_wh = Warehouse.objects.first()

    now = timezone.now()

    # 1. Update Order metadata
    order.metadata["ghn_tracking_code"] = tracking_code
    order.metadata["ghn_carrier"] = "Giao Hàng Nhanh (GHN)"
    order.metadata["ghn_origin_warehouse"] = "Kho Tổng Aurabook Hà Nội"
    order.metadata["ghn_origin_address"] = "Số 12 Duy Tân, Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội"
    order.metadata["ghn_service"] = service_name
    order.metadata["ghn_status"] = status
    order.metadata["ghn_status_display"] = "Giao hàng thành công (Completed)" if status == "delivered" else "Đang giao hàng"
    order.metadata["delivery_status"] = "completed" if status == "delivered" else "delivering"
    order.metadata["delivery_status_display"] = "Đã hoàn tất (Completed)" if status == "delivered" else "Đang giao hàng"
    order.metadata["ghn_updated_at"] = now.isoformat()

    if status == "delivered":
        order.status = OrderStatus.FULFILLED
        order.metadata["delivered_at"] = now.isoformat()

    order.save()

    # 2. Create or update fulfillment
    fulfillment = order.fulfillments.first()
    if not fulfillment:
        fulfillment = Fulfillment.objects.create(
            order=order,
            fulfillment_order=1,
            status=FulfillmentStatus.FULFILLED,
            tracking_number=tracking_code,
            created_at=now,
            metadata={
                "carrier": "Giao Hàng Nhanh (GHN)",
                "tracking_code": tracking_code,
                "origin": "Kho Tổng Aurabook Hà Nội",
                "status": status,
                "status_display": "Giao hàng thành công (Completed)" if status == "delivered" else "Đang giao hàng",
            }
        )
        for line in order.lines.all():
            stock = None
            if line.variant:
                stock = Stock.objects.filter(product_variant=line.variant, warehouse=hanoi_wh).first()
                if not stock:
                    stock = Stock.objects.filter(product_variant=line.variant).first()
            FulfillmentLine.objects.create(
                fulfillment=fulfillment,
                order_line=line,
                quantity=line.quantity,
                stock=stock
            )
        print(f"Created fulfillment #{fulfillment.id} for Order #{order.number} with tracking {tracking_code}")
    else:
        fulfillment.tracking_number = tracking_code
        fulfillment.status = FulfillmentStatus.FULFILLED
        fulfillment.metadata["carrier"] = "Giao Hàng Nhanh (GHN)"
        fulfillment.metadata["tracking_code"] = tracking_code
        fulfillment.metadata["origin"] = "Kho Tổng Aurabook Hà Nội"
        fulfillment.metadata["status"] = status
        fulfillment.metadata["status_display"] = "Giao hàng thành công (Completed)" if status == "delivered" else "Đang giao hàng"
        fulfillment.save()
        print(f"Updated fulfillment #{fulfillment.id} for Order #{order.number} with tracking {tracking_code}")

    # 3. Add order event for timeline tracking in dashboard
    OrderEvent.objects.create(
        order=order,
        type=OrderEvents.TRACKING_UPDATED,
        parameters={"tracking_number": tracking_code, "carrier": "Giao Hàng Nhanh (GHN)"},
        date=now
    )

    print(f"Order #{order.number} successfully synced with GHN: status={status}, tracking={tracking_code}")
    return order

if __name__ == "__main__":
    if len(sys.argv) > 1:
        order_num = int(sys.argv[1])
        st = sys.argv[2] if len(sys.argv) > 2 else "delivered"
        sync_ghn_for_order(order_num, status=st)
    else:
        # Sync all existing orders
        for num in [1, 2, 3, 4]:
            sync_ghn_for_order(num, status="delivered")
