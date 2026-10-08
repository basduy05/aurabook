import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.app.models import App, AppExtension
from saleor.app.types import AppType
from saleor.permission.models import Permission

# Create or update Community Admin App
app, created = App.objects.update_or_create(
    identifier="aurabook.community.admin",
    defaults={
        "name": "Quản trị Cộng đồng & Độc giả",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Quản lý, kiểm duyệt bài viết và tra cứu thông tin tài khoản thật từ Saleor",
        "app_url": "http://localhost:3000/community-admin",
        "configuration_url": "http://localhost:3000/community-admin",
        "homepage_url": "http://localhost:3000/vi/channel-vnd/community",
        "manifest_url": "http://localhost:3000/api/community/admin/manifest",
        "version": "1.0.0",
    }
)

perms = Permission.objects.filter(codename__in=["manage_users", "manage_orders"])
app.permissions.set(perms)

# Create or update AppExtension for Navigation
ext, ext_created = AppExtension.objects.update_or_create(
    app=app,
    label="Quản lý Cộng đồng",
    defaults={
        "url": "http://localhost:3000/community-admin",
        "mount": "navigation_pages",
        "target": "app_page",
    }
)
ext.permissions.set(Permission.objects.filter(codename="manage_users"))

print(f"SUCCESS: App '{app.name}' (ID: {app.id}, Created: {created})")
print(f"SUCCESS: AppExtension '{ext.label}' (ID: {ext.id}, Created: {ext_created})")
