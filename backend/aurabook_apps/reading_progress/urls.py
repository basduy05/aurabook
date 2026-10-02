"""AuraBook Reading Progress App — xem DRMSession.ReadingProgress trong drm app."""
# Reading progress được tích hợp trực tiếp vào drm app.
# App này giữ lại để routing /aurabook/reading/library

from django.urls import path
from aurabook_apps.drm.views import ReadingProgressView


def library_view(request):
    """GET /aurabook/reading/library — Danh sách sách đã mua + progress."""
    import json
    from aurabook_apps.drm.models import ReadingProgress
    from django.http import JsonResponse

    user_email = request.GET.get("user_email")
    if not user_email:
        return JsonResponse({"error": "user_email required"}, status=400)

    progresses = ReadingProgress.objects.filter(user_email=user_email).order_by("-last_read_at")
    return JsonResponse({
        "library": [
            {
                "product_id": p.product_id,
                "current_page": p.current_page,
                "total_pages": p.total_pages,
                "completion_percent": p.progress_percent,
                "last_read_at": p.last_read_at.isoformat(),
            }
            for p in progresses
        ]
    })


urlpatterns = [
    path("library", library_view, name="reading-library"),
    path("progress/<str:product_id>", ReadingProgressView.as_view(), name="reading-progress"),
]
