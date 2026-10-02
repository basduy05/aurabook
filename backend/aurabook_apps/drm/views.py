import json
import logging
from datetime import timedelta

import requests
from django.http import JsonResponse
from django.utils import timezone
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .crypto import generate_session_key, encrypt_session_key, decrypt_session_key
from .models import DRMSession, ReadingProgress

logger = logging.getLogger(__name__)

SALEOR_API_URL = "http://localhost:8000/graphql/"
SESSION_KEY_TTL_SECONDS = 3600  # 1 hour


def _get_token_from_request(request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def _verify_order_paid(user_email: str, product_id: str, token: str) -> str | None:
    """
    Kiểm tra Saleor GraphQL để xác minh user có order PAID/FULFILLED cho product_id.
    Trả về order_id nếu hợp lệ, None nếu không.
    """
    query = """
    query GetUserOrders($email: String!) {
        customers(filter: { email: $email }, first: 1) {
            edges {
                node {
                    orders(first: 50) {
                        edges {
                            node {
                                id
                                status
                                lines {
                                    variant {
                                        product { id }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """
    try:
        resp = requests.post(
            SALEOR_API_URL,
            json={"query": query, "variables": {"email": user_email}},
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        data = resp.json()
        customers = data.get("data", {}).get("customers", {}).get("edges", [])
        for customer in customers:
            for order_edge in customer["node"]["orders"]["edges"]:
                order = order_edge["node"]
                if order["status"] not in ("PAID", "FULFILLED", "DELIVERED"):
                    continue
                for line in order["lines"]:
                    pid = line["variant"]["product"]["id"]
                    if pid == product_id or product_id in pid:
                        return order["id"]
    except Exception as exc:
        logger.error("Error verifying order: %s", exc)
    return None


@method_decorator(csrf_exempt, name="dispatch")
class DRMSessionCreateView(View):
    """POST /aurabook/drm/session — Cấp session key mới."""

    def post(self, request):
        try:
            body = json.loads(request.body)
            product_id = body.get("product_id")
            user_email = body.get("user_email")
        except (json.JSONDecodeError, KeyError):
            return JsonResponse({"error": "Invalid request body"}, status=400)

        if not product_id or not user_email:
            return JsonResponse({"error": "product_id and user_email required"}, status=400)

        token = _get_token_from_request(request)
        if not token:
            return JsonResponse({"error": "Authorization token required"}, status=401)

        order_id = _verify_order_paid(user_email, product_id, token)
        if not order_id:
            return JsonResponse(
                {"error": "No PAID order found for this product"},
                status=403,
            )

        # Tạo và mã hóa session key
        session_key = generate_session_key()
        nonce, ciphertext = encrypt_session_key(session_key)

        expires_at = timezone.now() + timedelta(seconds=SESSION_KEY_TTL_SECONDS)
        session = DRMSession.objects.create(
            user_email=user_email,
            product_id=product_id,
            order_id=order_id,
            key_nonce=nonce,
            key_ciphertext=ciphertext,
            expires_at=expires_at,
        )

        return JsonResponse({
            "session_id": str(session.id),
            # Trả về session key hex cho client (client sẽ dùng trong WASM)
            "session_key": session_key.hex(),
            "expires_at": expires_at.isoformat(),
            "product_id": product_id,
        })


@method_decorator(csrf_exempt, name="dispatch")
class DRMSessionRevokeView(View):
    """DELETE /aurabook/drm/session/{session_id} — Thu hồi session key."""

    def delete(self, request, session_id: str):
        try:
            session = DRMSession.objects.get(id=session_id)
            session.is_revoked = True
            session.save(update_fields=["is_revoked"])
            return JsonResponse({"status": "revoked", "session_id": session_id})
        except DRMSession.DoesNotExist:
            return JsonResponse({"error": "Session not found"}, status=404)


@method_decorator(csrf_exempt, name="dispatch")
class ReadingProgressView(View):
    """
    GET  /aurabook/drm/progress/{product_id} → Lấy tiến độ đọc
    POST /aurabook/drm/progress/{product_id} → Cập nhật tiến độ
    """

    def get(self, request, product_id: str):
        user_email = request.GET.get("user_email")
        if not user_email:
            return JsonResponse({"error": "user_email required"}, status=400)
        try:
            progress = ReadingProgress.objects.get(user_email=user_email, product_id=product_id)
            return JsonResponse({
                "product_id": product_id,
                "current_page": progress.current_page,
                "total_pages": progress.total_pages,
                "completion_percent": progress.progress_percent,
                "last_read_at": progress.last_read_at.isoformat(),
            })
        except ReadingProgress.DoesNotExist:
            return JsonResponse({"current_page": 1, "completion_percent": 0.0})

    def post(self, request, product_id: str):
        try:
            body = json.loads(request.body)
            user_email = body["user_email"]
            current_page = int(body["current_page"])
            total_pages = int(body.get("total_pages", 1))
        except (json.JSONDecodeError, KeyError, ValueError):
            return JsonResponse({"error": "Invalid request body"}, status=400)

        progress, _ = ReadingProgress.objects.update_or_create(
            user_email=user_email,
            product_id=product_id,
            defaults={
                "current_page": current_page,
                "total_pages": total_pages,
                "completion_percent": round((current_page / max(total_pages, 1)) * 100, 1),
            },
        )
        return JsonResponse({
            "status": "updated",
            "completion_percent": progress.completion_percent,
        })
