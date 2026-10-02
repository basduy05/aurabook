import { updateCheckoutQuery } from "@/checkout/lib/checkout-search-params";
import {
	clearPaymentCompleting,
	stashPaymentCompletionError,
} from "@/checkout/lib/payment/checkout-payment-completion";

/**
 * Remove gateway return query params from checkout URL bar without full page reload.
 */
export function clearVietnamReturnUrlParams(): void {
	updateCheckoutQuery({
		processingPayment: null,
		gateway: null,
		vnp_Amount: null,
		vnp_BankCode: null,
		vnp_BankTranNo: null,
		vnp_CardType: null,
		vnp_OrderInfo: null,
		vnp_PayDate: null,
		vnp_ResponseCode: null,
		vnp_TmnCode: null,
		vnp_TransactionNo: null,
		vnp_TransactionStatus: null,
		vnp_TxnRef: null,
		vnp_SecureHash: null,
		partnerCode: null,
		orderId: null,
		requestId: null,
		amount: null,
		orderInfo: null,
		orderType: null,
		transId: null,
		resultCode: null,
		message: null,
		payType: null,
		responseTime: null,
		extraData: null,
		signature: null,
		status: null,
		payment_status: null,
		error: null,
		step: "payment",
	});
}

/**
 * Clean up gateway return params, clear the completing screen overlay,
 * and surface the error to the checkout payment step.
 */
export function reportVietnamReturnFailure(
	message: string,
	onError: (message: string) => void,
): void {
	clearVietnamReturnUrlParams();
	stashPaymentCompletionError(message);
	clearPaymentCompleting();
	onError(message);
	try {
		const channel = new BroadcastChannel("aurabook_order_sync");
		channel.postMessage({ type: "ORDER_FAILED", error: message });
		channel.close();
	} catch {
		// ignore
	}
}
