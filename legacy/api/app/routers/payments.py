from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.order import WebhookIPNRequest
from app.services.payment_service import PaymentService, generate_hmac_signature

router = APIRouter(prefix="/payments", tags=["Payment Gateway & Webhook IPN"])


@router.post(
    "/webhook",
    summary="Tiếp nhận Webhook IPN từ Cổng Thanh toán Sandbox",
)
async def payment_webhook(
    req: WebhookIPNRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Tiếp nhận thông báo thanh toán:
    - Xác thực chữ ký số HMAC-SHA256 chống giả mạo.
    - Cập nhật trạng thái đơn hàng sang PAID.
    - Khấu trừ tồn kho vĩnh viễn và tự động cấp bản quyền đọc E-book.
    """
    return await PaymentService.process_webhook(db, req)


@router.post(
    "/sweep-expired",
    summary="Quét và hủy các đơn hàng PENDING quá hạn 15 phút (Worker)",
)
async def sweep_expired_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    cancelled_count = await PaymentService.sweep_expired_orders(db)
    return {
        "message": "Đã quét và hủy các đơn hết hạn",
        "cancelled_orders": cancelled_count,
    }


@router.get(
    "/sandbox-simulator",
    response_class=HTMLResponse,
    summary="Trang giả lập Cổng Thanh toán Sandbox (Giao diện HTML)",
)
async def sandbox_simulator_page(
    order_code: str = Query(...),
    amount: Decimal = Query(...),
    sig: str = Query(...),
) -> HTMLResponse:
    """Giao diện giả lập thanh toán thẻ ngân hàng / ví điện tử Sandbox cho người dùng thử nghiệm."""
    success_sig_data = f"{order_code}|{amount}|SUCCESS"
    fail_sig_data = f"{order_code}|{amount}|FAILED"
    success_sig = generate_hmac_signature(success_sig_data, settings.JWT_SECRET)
    fail_sig = generate_hmac_signature(fail_sig_data, settings.JWT_SECRET)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AuraBook - Cổng Thanh Toán Sandbox Simulator</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
            .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }}
            h2 {{ color: #38bdf8; margin-top: 0; }}
            .amount {{ font-size: 1.8rem; font-weight: bold; color: #4ade80; margin: 1rem 0; }}
            .btn {{ display: block; width: 100%; padding: 0.85rem; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; transition: background 0.2s; }}
            .btn-success {{ background: #16a34a; color: white; }}
            .btn-success:hover {{ background: #15803d; }}
            .btn-danger {{ background: #dc2626; color: white; }}
            .btn-danger:hover {{ background: #b91c1c; }}
            .info-box {{ background: #0f172a; padding: 0.85rem; border-radius: 6px; font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>💳 AuraBook Sandbox Payment</h2>
            <div class="info-box">
                <div>Mã đơn hàng: <strong>{order_code}</strong></div>
                <div>Chế độ: <em>Giả lập Sandbox Thử Nghiệm</em></div>
            </div>
            <div class="amount">{amount:,.0f} VNĐ</div>
            <p style="color: #cbd5e1; font-size: 0.9rem;">Chọn kịch bản kết quả để gửi Webhook IPN về hệ thống Backend:</p>

            <button class="btn btn-success" onclick="sendWebhook('SUCCESS', '{success_sig}')">✅ Thanh Toán Thành Công (Thẻ hợp lệ)</button>
            <button class="btn btn-danger" onclick="sendWebhook('FAILED', '{fail_sig}')">❌ Thanh Toán Thất Bại (Hết tiền / Hủy giao dịch)</button>

            <div id="result" style="margin-top: 1.25rem; font-size: 0.9rem;"></div>
        </div>

        <script>
            async function sendWebhook(status, sig) {{
                const resDiv = document.getElementById('result');
                resDiv.innerHTML = '<span style="color: #38bdf8;">Đang gửi Webhook IPN về hệ thống...</span>';
                try {{
                    const resp = await fetch('/api/v1/payments/webhook', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{
                            order_code: '{order_code}',
                            transaction_code: 'SANDBOX_' + Date.now(),
                            amount: {amount},
                            status: status,
                            signature: sig
                        }})
                    }});
                    const data = await resp.json();
                    if (resp.ok) {{
                        if (status === 'SUCCESS') {{
                            resDiv.innerHTML = '<span style="color: #4ade80;">🎉 Giao dịch thành công! Đã kích hoạt bản quyền E-book và trừ kho. Bạn có thể đóng tab này.</span>';
                        }} else {{
                            resDiv.innerHTML = '<span style="color: #f87171;">⚠️ Giao dịch thất bại: Đã hủy đơn và giải phóng kho giữ.</span>';
                        }}
                    }} else {{
                        resDiv.innerHTML = '<span style="color: #ef4444;">Lỗi: ' + JSON.stringify(data) + '</span>';
                    }}
                }} catch (e) {{
                    resDiv.innerHTML = '<span style="color: #ef4444;">Lỗi kết nối: ' + e.message + '</span>';
                }}
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
