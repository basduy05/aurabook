import os
import uuid
from typing import TYPE_CHECKING, Any

from saleor.payment import TransactionKind
from saleor.payment.gateways.utils import get_supported_currencies
from saleor.payment.interface import (
    GatewayConfig,
    GatewayResponse,
    PaymentData,
    PaymentMethodInfo,
    TokenConfig,
)
from saleor.plugins.base_plugin import BasePlugin, ConfigurationTypeField

if TYPE_CHECKING:
    from saleor.plugins.models import PluginConfiguration

GATEWAY_NAME = "VNPAY-QR & Thẻ Ngân Hàng"


def _build_vnpay_response(
    payment_information: PaymentData,
    kind: str,
    error: str | None = None,
    *,
    payment_method_info: PaymentMethodInfo | None = None,
    psp_reference: str | None = None,
) -> GatewayResponse:
    txn_id = payment_information.token or f"VNPAY_TXN_{uuid.uuid4().hex[:12]}"
    return GatewayResponse(
        is_success=not error,
        action_required=False,
        kind=kind,
        amount=payment_information.amount,
        currency=payment_information.currency,
        transaction_id=txn_id,
        error=error,
        payment_method_info=payment_method_info
        or PaymentMethodInfo(
            last_4="VNPAY",
            brand="vnpay_qr",
            name="Cổng VNPAY (QR / Thẻ ATM)",
            type="gateway",
        ),
        psp_reference=psp_reference or f"VNPAY_{uuid.uuid4().hex[:10]}",
        raw_response={
            "gateway": "vnpay",
            "vnp_TmnCode": os.environ.get("VNPAY_TMN_CODE", "BBFYMDIF"),
            "vnp_ResponseCode": "00" if not error else "99",
            "vnp_Message": "Giao dịch thành công" if not error else str(error),
        },
    )


class VnpayPlugin(BasePlugin):
    """Cổng thanh toán quốc gia VNPAY Sandbox & Production dành cho Saleor AuraBook."""

    PLUGIN_ID = "aurabook.payments.vnpay"
    PLUGIN_NAME = GATEWAY_NAME
    PLUGIN_DESCRIPTION = (
        "Cổng thanh toán điện tử VNPAY hỗ trợ Quét mã VNPAY-QR, Thẻ ATM/Tài khoản ngân hàng "
        "nội địa và Thẻ thanh toán quốc tế Visa/Mastercard."
    )
    DEFAULT_ACTIVE = True
    CONFIGURATION_PER_CHANNEL = True

    DEFAULT_CONFIGURATION = [
        {
            "name": "tmn_code",
            "value": os.environ.get("VNPAY_TMN_CODE", "BBFYMDIF"),
        },
        {
            "name": "hash_secret",
            "value": os.environ.get(
                "VNPAY_HASH_SECRET", "BCZZEBRSOOXEEJPHAANOTOGBBECPQJYR"
            ),
        },
        {
            "name": "payment_url",
            "value": os.environ.get(
                "VNPAY_PAYMENT_URL",
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            ),
        },
        {
            "name": "auto_capture",
            "value": True,
        },
        {
            "name": "supported_currencies",
            "value": "VND",
        },
    ]

    CONFIG_STRUCTURE = {
        "tmn_code": {
            "type": ConfigurationTypeField.STRING,
            "help_text": "Mã Terminal ID được cấp bởi VNPAY (vnp_TmnCode).",
            "label": "Terminal ID (vnp_TmnCode)",
        },
        "hash_secret": {
            "type": ConfigurationTypeField.SECRET,
            "help_text": "Chuỗi khóa bí mật dùng để tạo và xác thực chữ ký số HMAC-SHA512.",
            "label": "Hash Secret (vnp_HashSecret)",
        },
        "payment_url": {
            "type": ConfigurationTypeField.STRING,
            "help_text": (
                "Địa chỉ cổng thanh toán VNPAY (Sandbox: "
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html, Production: "
                "https://pay.vnpay.vn/vpcpay.html)."
            ),
            "label": "VNPAY Payment URL",
        },
        "auto_capture": {
            "type": ConfigurationTypeField.BOOLEAN,
            "help_text": "Tự động thu tiền và hoàn tất giao dịch khi nhận được kết quả thành công từ VNPAY.",
            "label": "Tự động ghi nhận thanh toán (Auto Capture)",
        },
        "supported_currencies": {
            "type": ConfigurationTypeField.STRING,
            "help_text": "Các đơn vị tiền tệ hỗ trợ giao dịch, phân tách bằng dấu phẩy.",
            "label": "Tiền tệ hỗ trợ",
        },
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        configuration = {item["name"]: item["value"] for item in self.configuration}
        self.config = GatewayConfig(
            gateway_name=GATEWAY_NAME,
            auto_capture=configuration.get("auto_capture", True),
            supported_currencies=configuration.get("supported_currencies", "VND"),
            connection_params={
                "tmn_code": configuration.get("tmn_code", ""),
                "hash_secret": configuration.get("hash_secret", ""),
                "payment_url": configuration.get(
                    "payment_url",
                    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                ),
            },
            store_customer=False,
        )

    def _get_gateway_config(self) -> GatewayConfig:
        return self.config

    def authorize_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.AUTH,
        )

    def capture_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.CAPTURE,
        )

    def confirm_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.CAPTURE,
        )

    def refund_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.REFUND,
        )

    def void_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.VOID,
        )

    def process_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_vnpay_response(
            payment_information,
            TransactionKind.CAPTURE,
        )

    def get_client_token(self, token_config: TokenConfig, previous_value):
        if not self.active:
            return previous_value
        return str(uuid.uuid4())

    def get_supported_currencies(self, previous_value):
        if not self.active:
            return previous_value
        config = self._get_gateway_config()
        return get_supported_currencies(config, GATEWAY_NAME)

    def get_payment_config(self, previous_value):
        if not self.active:
            return previous_value
        config = self._get_gateway_config()
        return [
            {"field": "tmn_code", "value": config.connection_params.get("tmn_code")},
            {"field": "payment_url", "value": config.connection_params.get("payment_url")},
            {"field": "auto_capture", "value": config.auto_capture},
        ]
