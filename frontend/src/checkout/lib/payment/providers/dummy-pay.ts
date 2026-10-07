import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import { getTransactionInitializeError, type CheckoutGatewayMessages } from "@/checkout/lib/payment-gateways";
import { type PaymentContext, type PaymentResult } from "../types";
import { completeCheckoutOrder } from "../complete-order";

export interface DummyPaymentOptions {
	paymentMethodName?: string;
	pspReference?: string;
	message?: string;
}

/**
 * Saleor Dummy Payment app — test checkouts only.
 * Simulates a successful charge via transactionInitialize + checkoutComplete.
 */
export async function executeDummyPayment(
	context: PaymentContext,
	gatewayId: string,
	messages: CheckoutGatewayMessages,
	options?: DummyPaymentOptions,
): Promise<PaymentResult> {
	const initResult = await getCheckoutTransport().initializeTransaction({
		checkoutId: context.checkoutId,
		amount: context.amount,
		paymentGateway: {
			id: gatewayId,
			data: {
				event: {
					includePspReference: true,
					type: "CHARGE_SUCCESS",
				},
				paymentMethodName: options?.paymentMethodName,
				pspReference: options?.pspReference,
				message: options?.message,
			},
		},
	});

	if (!initResult.ok) {
		console.error("Payment initialization error:", initResult.error);
		return {
			ok: false,
			error: initResult.error || messages.paymentTryAgain,
			errorKey: "payment",
		};
	}

	const transactionError = getTransactionInitializeError(initResult.data, messages);
	if (transactionError) {
		console.error("Transaction initialize failed:", initResult.data);
		return { ok: false, error: transactionError, errorKey: "payment" };
	}

	return completeCheckoutOrder(context.checkoutId);
}
