from django.urls import include, path

urlpatterns = [
    path("drm/", include("aurabook_apps.drm.urls")),
    path("search/", include("aurabook_apps.ai_search.urls")),
    path("audio/", include("aurabook_apps.audio.urls")),
    path("reading/", include("aurabook_apps.reading_progress.urls")),
]
