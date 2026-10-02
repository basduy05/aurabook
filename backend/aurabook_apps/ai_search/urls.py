from django.urls import path
from .views import HybridSearchView, RAGQueryView, OCRCoverView, VectorizeBookView

urlpatterns = [
    path("hybrid", HybridSearchView.as_view(), name="search-hybrid"),
    path("rag", RAGQueryView.as_view(), name="search-rag"),
    path("ocr-cover", OCRCoverView.as_view(), name="search-ocr-cover"),
    path("vectorize/<str:product_id>", VectorizeBookView.as_view(), name="search-vectorize"),
]
