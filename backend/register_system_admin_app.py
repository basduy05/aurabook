import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.app.models import App, AppExtension
from saleor.app.types import AppType
from saleor.permission.models import Permission

# 1. Gỡ bỏ hai ứng dụng riêng lẻ trước đây: Quản trị độc giả & Quản trị AI
deleted_count, _ = App.objects.filter(identifier__in=[
    "aurabook.community.admin",
    "aurabook.ai.platform.admin",
]).delete()
print(f"Đã gỡ bỏ {deleted_count} ứng dụng quản trị cũ để hợp nhất.")

# 2. Tạo ứng dụng hợp nhất duy nhất: Quản trị Hệ thống
app, created = App.objects.update_or_create(
    identifier="aurabook.system.admin",
    defaults={
        "name": "Quản trị Hệ thống",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Trung tâm Quản trị Hợp nhất: Quản trị Độc giả, Kiểm duyệt Cộng đồng & Hệ sinh thái AI (Voice CSKH, GraphRAG, DRM Security)",
        "app_url": "http://localhost:3000/system-admin",
        "configuration_url": "http://localhost:3000/system-admin",
        "homepage_url": "http://localhost:3000/system-admin",
        "manifest_url": "http://localhost:3000/api/system/admin/manifest",
        "version": "1.0.0",
    }
)

perms = Permission.objects.filter(codename__in=["manage_users", "manage_settings", "manage_products", "manage_orders"])
app.permissions.set(perms)

# Xóa các extension cũ để thanh menu Saleor Dashboard luôn gọn gàng và chuẩn xác
AppExtension.objects.filter(app=app).delete()

print(f"THÀNH CÔNG: Đã đăng ký '{app.name}' ({app.identifier}) vào Saleor Dashboard làm Installed App duy nhất.")
