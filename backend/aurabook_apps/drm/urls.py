from django.urls import path
from .views import DRMSessionCreateView, DRMSessionRevokeView, ReadingProgressView

urlpatterns = [
    path("session", DRMSessionCreateView.as_view(), name="drm-session-create"),
    path("session/<str:session_id>", DRMSessionRevokeView.as_view(), name="drm-session-revoke"),
    path("progress/<str:product_id>", ReadingProgressView.as_view(), name="drm-progress"),
]
