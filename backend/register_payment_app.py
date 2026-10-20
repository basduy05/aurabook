import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.app.models import App, AppToken
from saleor.app.types import AppType
from saleor.permission.models import Permission
from saleor.webhook.models import Webhook, WebhookEvent
from saleor.webhook.event_types import WebhookEventSyncType

print("--- BẮT ĐẦU CẤU HÌNH APP & PAYMENT GATEWAY TRONG SALEOR ---")

# 1. Cập nhật AppToken và quyền cho aurabook.system.admin (Tránh lỗi SALEOR_APP_TOKEN)
admin_app = App.objects.filter(identifier="aurabook.system.admin").first()
if admin_app:
    # Bổ sung đầy đủ quyền bao gồm handle_payments và manage_checkouts
    all_perm_codes = [
        "manage_users", "manage_settings", "manage_products", 
        "manage_orders", "handle_payments", "manage_checkouts"
    ]
    perms = Permission.objects.filter(codename__in=all_perm_codes)
    admin_app.permissions.set(perms)
    print(f"1. Đã cập nhật quyền cho {admin_app.name}: {[p.codename for p in admin_app.permissions.all()]}")

    token_str = "rMzfSy3fOblvdjuw0jcbmJ2pXfYWNU"
    token_obj = AppToken.objects.filter(auth_token=token_str).first()
    if not token_obj:
        # Xóa token cũ của app nếu có và tạo đúng token đồng bộ với .env.local
        AppToken.objects.filter(app=admin_app).delete()
        token_obj = AppToken.objects.create(
            app=admin_app,
            name="System Admin Token",
            auth_token=token_str,
        )
        print(f"   Đã gắn AppToken '{token_str}' cho {admin_app.name}.")
    else:
        token_obj.app = admin_app
        token_obj.save()
        print(f"   AppToken '{token_str}' đã hợp lệ cho {admin_app.name}.")

# 2. Cài đặt App Thanh Toán: saleor.io.dummy-payment-app
payment_app, created = App.objects.update_or_create(
    identifier="saleor.io.dummy-payment-app",
    defaults={
        "name": "Cổng thanh toán Aurabook (VNPAY, MoMo, Thẻ Thử Nghiệm)",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Cổng thanh toán tích hợp Aurabook hỗ trợ VNPAY, MoMo Sandbox và Thẻ Test",
        "app_url": "http://localhost:3000",
        "configuration_url": "http://localhost:3000",
        "homepage_url": "http://localhost:3000",
        "version": "1.0.0",
    }
)
pay_perms = Permission.objects.filter(codename__in=["handle_payments", "manage_checkouts", "manage_orders"])
payment_app.permissions.set(pay_perms)
print(f"2. Đã tạo/kích hoạt Payment App '{payment_app.name}' ({payment_app.identifier}).")

# Đảm bảo payment_app có AppToken
if not AppToken.objects.filter(app=payment_app).exists():
    AppToken.objects.create(app=payment_app, name="Dummy Payment Token")
    print(f"   Đã tạo AppToken cho {payment_app.name}.")

# 3. Đăng ký Webhook cho Payment App để Saleor nhận diện availablePaymentGateways
webhook, _ = Webhook.objects.update_or_create(
    app=payment_app,
    name="Aurabook Payment Sync Webhook",
    defaults={
        "target_url": "http://localhost:3000/api/payment/webhook",
        "is_active": True,
    }
)

sync_events = [
    WebhookEventSyncType.PAYMENT_LIST_GATEWAYS,
    WebhookEventSyncType.PAYMENT_GATEWAY_INITIALIZE_SESSION,
    WebhookEventSyncType.TRANSACTION_INITIALIZE_SESSION,
    WebhookEventSyncType.TRANSACTION_PROCESS_SESSION,
]

WebhookEvent.objects.filter(webhook=webhook).delete()
for event_type in sync_events:
    WebhookEvent.objects.create(webhook=webhook, event_type=event_type)

print(f"3. Đã đăng ký Webhook và {len(sync_events)} Sync Payment Events cho {payment_app.name}.")
print("--- HOÀN TẤT CẤU HÌNH PAYMENT TRONG SALEOR THÀNH CÔNG ---")
