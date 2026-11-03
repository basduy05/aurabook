import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.app.models import App, AppToken, AppExtension
from saleor.app.types import AppType
from saleor.channel.models import Channel
from saleor.permission.models import Permission
from saleor.plugins.models import PluginConfiguration
from saleor.plugins.momo.plugin import MomoPlugin
from saleor.plugins.vnpay.plugin import VnpayPlugin
from saleor.webhook.models import Webhook

print("--- BẮT ĐẦU CẤU HÌNH APP, EXTENSIONS & PAYMENT PLUGINS TRONG SALEOR ---")

# 1. Cập nhật System Admin App với toàn bộ quyền quản trị
all_perm_codes = [
    "manage_users", "manage_settings", "manage_products", 
    "manage_orders", "handle_payments", "manage_checkouts",
    "manage_plugins", "manage_apps", "manage_channels", "manage_shipping"
]
perms = Permission.objects.filter(codename__in=all_perm_codes)

admin_app, _ = App.objects.update_or_create(
    identifier="aurabook.system.admin",
    defaults={
        "name": "System Admin App",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Ứng dụng Quản trị Hệ thống Độc lập AuraBook",
        "app_url": "http://localhost:3001",
        "configuration_url": "http://localhost:3001",
        "homepage_url": "http://localhost:3001",
        "version": "1.0.0",
    }
)
admin_app.permissions.set(perms)
print(f"1. Đã cập nhật quyền cho {admin_app.name}: {[p.codename for p in admin_app.permissions.all()]}")

token_str = "rMzfSy3fOblvdjuw0jcbmJ2pXfYWNU"
# Xóa các token cũ có cùng đuôi token_last_4 và gán mới chuẩn hash
AppToken.objects.filter(token_last_4=token_str[-4:]).delete()
AppToken.objects.filter(app=admin_app).delete()
token_obj, _ = AppToken.objects.create(
    app=admin_app,
    name="System Admin & Storefront Runtime Token",
    auth_token=token_str,
)
print(f"   Đã tạo AppToken chuẩn hash cho {admin_app.name} (last4={token_obj.token_last_4}).")

# 2. Cài đặt Payment App
payment_app, created = App.objects.update_or_create(
    identifier="saleor.io.dummy-payment-app",
    defaults={
        "name": "Cổng thanh toán Aurabook (VNPAY, MoMo, Thẻ Thử Nghiệm)",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Cổng thanh toán tích hợp Aurabook hỗ trợ VNPAY, MoMo Sandbox và Thẻ Test",
        "app_url": "http://localhost:3001?tab=system_config",
        "configuration_url": "http://localhost:3001?tab=system_config",
        "homepage_url": "http://localhost:3000",
        "version": "1.0.0",
    }
)
payment_app.permissions.set(perms)
print(f"2. Đã tạo/kích hoạt Payment App '{payment_app.name}' ({payment_app.identifier}).")

# 3. Đăng ký các Saleor App Extensions (MoMo, VNPAY, System Admin)
print("3. Đang cài đặt các App Extensions vào Saleor Dashboard...")

extensions_data = [
    {
        "app": payment_app,
        "identifier": "aurabook.extension.momo.orders",
        "label": "Cổng thanh toán MoMo",
        "mount": "navigation_orders",
        "target": "app_page",
        "url": "http://localhost:3001?tab=system_config&subtab=momo",
        "settings": {"gateway": "momo", "name": "MoMo Payment Gateway", "type": "payment_gateway"},
        "perms": ["handle_payments", "manage_orders"],
    },
    {
        "app": payment_app,
        "identifier": "aurabook.extension.momo.actions",
        "label": "Tra cứu giao dịch MoMo",
        "mount": "order_details_more_actions",
        "target": "popup",
        "url": "http://localhost:3001?tab=orders_shipping&gateway=momo",
        "settings": {"gateway": "momo", "name": "MoMo Transaction Actions", "type": "action_popup"},
        "perms": ["handle_payments", "manage_orders"],
    },
    {
        "app": payment_app,
        "identifier": "aurabook.extension.vnpay.orders",
        "label": "Cổng thanh toán VNPAY",
        "mount": "navigation_orders",
        "target": "app_page",
        "url": "http://localhost:3001?tab=system_config&subtab=vnpay",
        "settings": {"gateway": "vnpay", "name": "VNPay Payment Gateway", "type": "payment_gateway"},
        "perms": ["handle_payments", "manage_orders"],
    },
    {
        "app": payment_app,
        "identifier": "aurabook.extension.vnpay.actions",
        "label": "Tra cứu giao dịch VNPAY",
        "mount": "order_details_more_actions",
        "target": "popup",
        "url": "http://localhost:3001?tab=orders_shipping&gateway=vnpay",
        "settings": {"gateway": "vnpay", "name": "VNPay Transaction Actions", "type": "action_popup"},
        "perms": ["handle_payments", "manage_orders"],
    },
    {
        "app": admin_app,
        "identifier": "aurabook.extension.system.admin",
        "label": "Quản trị Hệ thống",
        "mount": "navigation_pages",
        "target": "app_page",
        "url": "http://localhost:3001",
        "settings": {"name": "System Admin", "type": "admin_hub"},
        "perms": ["manage_settings", "manage_users"],
    },
]

for ext_info in extensions_data:
    ext, created_ext = AppExtension.objects.update_or_create(
        app=ext_info["app"],
        identifier=ext_info["identifier"],
        defaults={
            "label": ext_info["label"],
            "mount": ext_info["mount"],
            "target": ext_info["target"],
            "url": ext_info["url"],
            "settings": ext_info["settings"],
        }
    )
    ext_perms = Permission.objects.filter(codename__in=ext_info["perms"])
    ext.permissions.set(ext_perms)
    action_str = "Tạo mới" if created_ext else "Cập nhật"
    print(f"   [{action_str} Extension] '{ext.label}' (mount={ext.mount}, target={ext.target})")

# 4. Kích hoạt & đồng bộ cấu hình Saleor Plugins (MomoPlugin & VnpayPlugin)
print("4. Đang đồng bộ và kích hoạt Plugin MoMo & VNPAY vào Saleor Plugins...")
channels = list(Channel.objects.all())

plugins_to_sync = [
    (MomoPlugin, MomoPlugin.PLUGIN_ID, MomoPlugin.PLUGIN_NAME, MomoPlugin.PLUGIN_DESCRIPTION, MomoPlugin.DEFAULT_CONFIGURATION),
    (VnpayPlugin, VnpayPlugin.PLUGIN_ID, VnpayPlugin.PLUGIN_NAME, VnpayPlugin.PLUGIN_DESCRIPTION, VnpayPlugin.DEFAULT_CONFIGURATION),
]

for plugin_cls, plugin_id, plugin_name, plugin_desc, plugin_default_config in plugins_to_sync:
    # 4.1 Global plugin config
    pc_global, _ = PluginConfiguration.objects.update_or_create(
        identifier=plugin_id,
        channel=None,
        defaults={
            "name": plugin_name,
            "description": plugin_desc,
            "active": True,
            "configuration": plugin_default_config,
        }
    )
    print(f"   [Plugin Global] {plugin_name} ({plugin_id}) -> active={pc_global.active}")

    # 4.2 Channel-specific plugin configs (đặc biệt channel-vnd)
    for ch in channels:
        pc_ch, _ = PluginConfiguration.objects.update_or_create(
            identifier=plugin_id,
            channel=ch,
            defaults={
                "name": plugin_name,
                "description": plugin_desc,
                "active": True,
                "configuration": plugin_default_config,
            }
        )
        print(f"   [Plugin Channel {ch.slug}] {plugin_name} -> active={pc_ch.active}")

# 5. Xóa bỏ các Webhook lỗi hoặc không tồn tại endpoint
Webhook.objects.filter(name="Aurabook Payment Sync Webhook").delete()
print("5. Đã làm sạch các Webhook không cần thiết.")
print("--- HOÀN TẤT CẤU HÌNH EXTENSIONS & PLUGINS TRONG SALEOR THÀNH CÔNG ---")
