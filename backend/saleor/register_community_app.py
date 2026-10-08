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

# Community Admin App is managed cleanly as an Installed App in Dashboard
# Remove any obsolete extensions to keep dashboard sidebar clean
AppExtension.objects.filter(app=app).delete()

print(f"SUCCESS: App '{app.name}' registered cleanly as Installed App in Dashboard.")
