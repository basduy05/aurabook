import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.app.models import App, AppExtension
from saleor.app.types import AppType
from saleor.permission.models import Permission

# Create or update AI Platform Admin App
app, created = App.objects.update_or_create(
    identifier="aurabook.ai.platform.admin",
    defaults={
        "name": "Trung tâm Quản trị AI & DRM Platform",
        "type": AppType.THIRDPARTY,
        "is_active": True,
        "about_app": "Điều hành hệ sinh thái AI: Dify Core RAG, LiveKit Voice CSKH, DRM Security & Tiến độ đọc sách, Ragas Evals",
        "app_url": "http://localhost:3000/ai-admin",
        "configuration_url": "http://localhost:3000/ai-admin",
        "homepage_url": "http://localhost:3000/ai-admin",
        "manifest_url": "http://localhost:3000/api/ai/admin/manifest",
        "version": "1.0.0",
    }
)

perms = Permission.objects.filter(codename__in=["manage_settings", "manage_products", "manage_orders"])
app.permissions.set(perms)

# Keep extensions clean for dashboard navigation
AppExtension.objects.filter(app=app).delete()

print(f"SUCCESS: App '{app.name}' registered cleanly in Saleor Dashboard as Installed App.")
