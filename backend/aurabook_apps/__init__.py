"""
AuraBook Custom Saleor Apps
===========================
Các apps này tích hợp vào Saleor backend như Django apps độc lập.

Apps:
  - drm             : AES-256-GCM DRM session key management
  - ai_search       : Gemini RAG + Hybrid Search RRF k=60
  - audio           : Audio Teaser 60s management
  - reading_progress: Tiến độ đọc sách theo user

Cài đặt:
  Thêm vào backend/saleor/settings.py:
    INSTALLED_APPS += [
        "aurabook_apps.drm",
        "aurabook_apps.ai_search",
        "aurabook_apps.audio",
        "aurabook_apps.reading_progress",
    ]

  Thêm vào backend/saleor/urls.py:
    from django.urls import path, include
    urlpatterns += [
        path("aurabook/", include("aurabook_apps.urls")),
    ]
"""
