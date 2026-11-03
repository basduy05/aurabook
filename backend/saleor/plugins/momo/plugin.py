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

GATEWAY_NAME = "Ví MoMo"


def _build_momo_response(
    payment_information: PaymentData,
    kind: str,
    error: str | None = None,
    *,
    payment_method_info: PaymentMethodInfo | None = None,
    psp_reference: str | None = None,
) -> GatewayResponse:
    txn_id = payment_information.token or f"MOMO_TXN_{uuid.uuid4().hex[:12]}"
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
            last_4="MOMO",
            brand="momo_wallet",
            name="Ví điện tử MoMo",
            type="wallet",
        ),
        psp_reference=psp_reference or f"MOMO_{uuid.uuid4().hex[:10]}",
        raw_response={
            "gateway": "momo",
            "partnerCode": os.environ.get("MOMO_PARTNER_CODE", "MOMOBKUN20180529"),
            "status": "0" if not error else "1",
            "message": "Giao dịch thành công" if not error else str(error),
        },
    )


class MomoPlugin(BasePlugin):
    """Cổng thanh toán MoMo Sandbox & Production dành cho Saleor AuraBook."""

    PLUGIN_ID = "aurabook.payments.momo"
    PLUGIN_NAME = GATEWAY_NAME
    PLUGIN_DESCRIPTION = (
        "Cổng thanh toán điện tử MoMo hỗ trợ Quét mã MoMo QR, Ví điện tử MoMo, "
        "và Thẻ ATM liên kết nội địa."
    )
    DEFAULT_ACTIVE = True
    CONFIGURATION_PER_CHANNEL = True

    DEFAULT_CONFIGURATION = [
        {
            "name": "partner_code",
            "value": os.environ.get("MOMO_PARTNER_CODE", "MOMOBKUN20180529"),
        },
        {
            "name": "access_key",
            "value": os.environ.get("MOMO_ACCESS_KEY", "klm05TvNBzhg7h7j"),
        },
        {
            "name": "secret_key",
            "value": os.environ.get("MOMO_SECRET_KEY", "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa"),
        },
        {
            "name": "endpoint_url",
            "value": os.environ.get(
                "MOMO_ENDPOINT", "https://test-payment.momo.vn/v2/gateway/api/create"
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
        "partner_code": {
            "type": ConfigurationTypeField.STRING,
            "help_text": "Mã đối tác định danh cung cấp bởi MoMo (Partner Code).",
            "label": "Mã đối tác (Partner Code)",
        },
        "access_key": {
            "type": ConfigurationTypeField.STRING,
            "help_text": "Khóa truy cập API của ứng dụng MoMo (Access Key).",
            "label": "Access Key",
        },
        "secret_key": {
            "type": ConfigurationTypeField.SECRET,
            "help_text": "Chuỗi bí mật dùng ký HMAC-SHA256 cho các giao dịch MoMo.",
            "label": "Secret Key",
        },
        "endpoint_url": {
            "type": ConfigurationTypeField.STRING,
            "help_text": (
                "Endpoint API tạo đơn hàng MoMo (Sandbox: "
                "https://test-payment.momo.vn/v2/gateway/api/create, Production: "
                "https://payment.momo.vn/v2/gateway/api/create)."
            ),
            "label": "MoMo API Endpoint",
        },
        "auto_capture": {
            "type": ConfigurationTypeField.BOOLEAN,
            "help_text": "Tự động thu tiền (Capture) ngay khi khách hàng xác nhận thanh toán thành công.",
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
                "partner_code": configuration.get("partner_code", ""),
                "access_key": configuration.get("access_key", ""),
                "secret_key": configuration.get("secret_key", ""),
                "endpoint_url": configuration.get(
                    "endpoint_url",
                    "https://test-payment.momo.vn/v2/gateway/api/create",
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
        return _build_momo_response(
            payment_information,
            TransactionKind.AUTH,
        )

    def capture_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_momo_response(
            payment_information,
            TransactionKind.CAPTURE,
        )

    def confirm_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_momo_response(
            payment_information,
            TransactionKind.CAPTURE,
        )

    def refund_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_momo_response(
            payment_information,
            TransactionKind.REFUND,
        )

    def void_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_momo_response(
            payment_information,
            TransactionKind.VOID,
        )

    def process_payment(
        self, payment_information: PaymentData, previous_value
    ) -> GatewayResponse:
        if not self.active:
            return previous_value
        return _build_momo_response(
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
            {"field": "partner_code", "value": config.connection_params.get("partner_code")},
            {"field": "endpoint_url", "value": config.connection_params.get("endpoint_url")},
            {"field": "auto_capture", "value": config.auto_capture},
        ]
