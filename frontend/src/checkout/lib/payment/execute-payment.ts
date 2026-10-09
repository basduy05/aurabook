import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import { type CheckoutGatewayMessages, getUnsupportedGatewayMessage } from "@/checkout/lib/payment-gateways";
import { completeCheckoutOrder } from "./complete-order";
import { executeDummyPayment } from "./providers/dummy-pay";
import { type PaymentContext, type PaymentResult, type ResolvedPaymentProvider } from "./types";

/**
 * Runs the Saleor transaction flow for the resolved provider.
 * Add new providers here (e.g. Stripe) — each implements initialize → client SDK → process → complete.
 */
export async function executePayment(
	provider: ResolvedPaymentProvider,
	context: PaymentContext,
	messages: CheckoutGatewayMessages,
): Promise<PaymentResult> {
	if (context.amount === 0) {
		return completeCheckoutOrder(context.checkoutId);
	}

	switch (provider.type) {
		case "dummy": {
			if (typeof window !== "undefined") {
				const selectedMethod =
					sessionStorage.getItem("checkout:selected_payment_method") || "test-card";

				if (selectedMethod === "vnpay" || selectedMethod === "momo") {
					sessionStorage.setItem("checkout:pending_gateway", selectedMethod);
					const endpoint =
						selectedMethod === "vnpay"
							? "/api/payment/vnpay/create"
							: "/api/payment/momo/create";

					try {
						const response = await fetch(endpoint, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								orderId: context.checkoutId,
								amount: context.amount,
								currency: "VND",
								orderInfo: "Aurabook - Thanh toán đơn hàng",
							}),
						});

						const data = (await response.json()) as {
							success: boolean;
							paymentUrl?: string;
							redirectUrl?: string;
							error?: string;
						};

						if (!data.success || (!data.paymentUrl && !data.redirectUrl)) {
							return {
								ok: false,
								error:
									data.error ??
									`Không thể kết nối đến cổng thanh toán ${selectedMethod.toUpperCase()}. Vui lòng kiểm tra lại cấu hình hoặc thử lại.`,
								errorKey: "payment",
							};
						}

						const targetUrl = data.paymentUrl ?? data.redirectUrl!;
						window.location.href = targetUrl;
						// Keep promise pending so loading spinner stays active until page unloads
						return new Promise(() => {});
					} catch (err: unknown) {
						const msg = err instanceof Error ? err.message : "Lỗi khi xử lý thanh toán";
						return {
							ok: false,
							error: msg,
							errorKey: "payment",
						};
					}
				}

				// Test Card flow in browser
				const testPspRef = `TEST_CARD_${Date.now()}`;
				const methodName = "Thẻ thanh toán thử nghiệm (Credit / Debit Card Test)";
				const note = `Phương thức thanh toán: ${methodName} (Mã GD: ${testPspRef}, Thẻ: 4242)`;

				try {
					await getCheckoutTransport().recordPaymentInfo({
						checkoutId: context.checkoutId,
						methodName,
						gateway: "test-card",
						note,
						metadata: {
							card_brand: "Visa / Mastercard Test",
							card_last4: "4242",
							test_reference: testPspRef,
						},
					});
				} catch (err) {
					console.warn("Could not record payment info:", err);
				}

				return executeDummyPayment(context, provider.gateway.id, messages, {
					paymentMethodName: "Thẻ thanh toán thử nghiệm",
					pspReference: testPspRef,
					message: "Thanh toán thành công qua thẻ thử nghiệm",
				});
			}

			return executeDummyPayment(context, provider.gateway.id, messages);
		}
		case "stripe":
			return {
				ok: false,
				error: messages.stripeUseCardForm,
				errorKey: "payment",
			};
		case "none":
			return {
				ok: false,
				error: messages.noGatewayConfigured,
				errorKey: "payment",
			};
		case "unsupported":
			return {
				ok: false,
				error: getUnsupportedGatewayMessage(provider.gateways, messages),
				errorKey: "payment",
			};
		case "dummy_missing":
			return { ok: false, error: messages.dummyMissingBody, errorKey: "payment" };
	}
}
