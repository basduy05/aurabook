import logging
import os

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .models import AudioTeaser

logger = logging.getLogger(__name__)

MEDIA_ROOT = getattr(settings, "MEDIA_ROOT", "/app/media")


@method_decorator(csrf_exempt, name="dispatch")
class AudioTeaserStreamView(View):
    """GET /aurabook/audio/{product_id}/teaser — Stream 60s audio teaser."""

    def get(self, request, product_id: str):
        try:
            teaser = AudioTeaser.objects.get(product_id=product_id)
        except AudioTeaser.DoesNotExist:
            return JsonResponse({"error": "Audio teaser not found"}, status=404)

        file_path = os.path.join(MEDIA_ROOT, teaser.file_path)
        if not os.path.exists(file_path):
            return JsonResponse({"error": "Audio file missing on disk"}, status=404)

        response = FileResponse(
            open(file_path, "rb"),
            content_type=teaser.mime_type,
        )
        response["Content-Disposition"] = f'inline; filename="teaser_{product_id}.wav"'
        response["Accept-Ranges"] = "bytes"
        return response


@method_decorator(csrf_exempt, name="dispatch")
class AudioTeaserUploadView(View):
    """POST /aurabook/audio/{product_id}/upload — Upload audio teaser (admin only)."""

    def post(self, request, product_id: str):
        if "audio" not in request.FILES:
            return JsonResponse({"error": "audio file is required"}, status=400)

        audio_file = request.FILES["audio"]
        product_slug = request.POST.get("product_slug", product_id)

        # Validate file
        if audio_file.size > 50 * 1024 * 1024:  # 50MB limit
            return JsonResponse({"error": "File too large (max 50MB)"}, status=400)

        # Save to media/audio_teasers/
        save_dir = os.path.join(MEDIA_ROOT, "audio_teasers")
        os.makedirs(save_dir, exist_ok=True)
        filename = f"teaser_{product_id}.wav"
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.writelines(audio_file.chunks())

        relative_path = f"audio_teasers/{filename}"
        mime_type = audio_file.content_type or "audio/wav"

        teaser, created = AudioTeaser.objects.update_or_create(
            product_id=product_id,
            defaults={
                "product_slug": product_slug,
                "file_path": relative_path,
                "file_size_bytes": audio_file.size,
                "mime_type": mime_type,
            },
        )

        return JsonResponse({
            "status": "created" if created else "updated",
            "product_id": product_id,
            "file_path": relative_path,
            "duration_seconds": teaser.duration_seconds,
        })
