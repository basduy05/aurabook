from django.urls import path

from .views import AudioTeaserStreamView, AudioTeaserUploadView

urlpatterns = [
    path("<str:product_id>/teaser", AudioTeaserStreamView.as_view(), name="audio-teaser-stream"),
    path("<str:product_id>/upload", AudioTeaserUploadView.as_view(), name="audio-teaser-upload"),
]
