"use client";

import { useEffect, useRef, type FC } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveCheckoutSearchParams } from "@/checkout/lib/checkout-search-params";
import { useCheckoutSession } from "@/checkout/providers/checkout-session";
import { useCheckout } from "@/checkout/hooks/use-checkout";
import { useCheckoutGatewayMessages } from "@/checkout/hooks/use-checkout-gateway-messages";
import { useCheckoutPaymentReturnError } from "@/checkout/providers/checkout-payment-return-error";
import {
	markPaymentCompleting,
	clearPaymentCompleting,
	isPaymentCompletingOrphaned,
} from "@/checkout/lib/payment/checkout-payment-completion";
import { executeDummyPayment } from "@/checkout/lib/payment/providers/dummy-pay";
import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import { navigateToOrderConfirmation } from "@/checkout/lib/payment/navigate-to-order";
import { clearVietnamReturnUrlParams, reportVietnamReturnFailure } from "./clear-vietnam-return-url";

/**
 * Shell-level host that processes VNPAY & MoMo payment callbacks.
 * - If gateway returned SUCCESS (vnp_ResponseCode === "00" or resultCode === "0"):
 *   Maintains PaymentCompletingScreen while calling /api/payment/verify and finalizing the Saleor order.
 * - If gateway returned FAILURE/CANCEL or no valid return params:
 *   Immediately clears the completing screen, cleans up URL params, and reports the error inline.
 */
export const VietnamPaymentCompletionHost: FC = () => {
	const { checkoutId } = useCheckoutSession();
	const searchParams = useSearchParams();
	const liveSearchParams = useLiveCheckoutSearchParams(searchParams);
	const { checkout } = useCheckout();
	const gatewayMessages = useCheckoutGatewayMessages();
	const { setError } = useCheckoutPaymentReturnError();

	const isProcessingRef = useRef(false);
	const returnAttemptRef = useRef<string | null>(null);

	useEffect(() => {
		if (!checkoutId) return;

		const vnpCode = liveSearchParams.get("vnp_ResponseCode");
		const momoCode = liveSearchParams.get("resultCode");
		const gateway = liveSearchParams.get("gateway");
		const hasReturnCode = vnpCode !== null || momoCode !== null;

		// 1. RECOVERY: If completing flag was orphaned (e.g. reload or back from external error page without return codes)
		if (!hasReturnCode && isPaymentCompletingOrphaned(checkoutId)) {
			clearPaymentCompleting();
			setError(
				"Giao dịch thanh toán chưa được hoàn tất hoặc đã bị gián đoạn. Vui lòng thực hiện lại đơn hàng.",
			);
			return;
		}

		if (!hasReturnCode) {
			return;
		}

		const isSuccessCode = vnpCode === "00" || momoCode === "0";
		const isCancelledCode = vnpCode === "24" || momoCode === "1006";

		// 2. IMMEDIATE FAILURE / CANCELLATION: Exit completing screen and show error on payment step
		if (!isSuccessCode) {
			const attemptKey = `fail:${gateway ?? ""}:${vnpCode ?? momoCode ?? ""}`;
			if (returnAttemptRef.current === attemptKey) return;
			returnAttemptRef.current = attemptKey;

			clearPaymentCompleting();
			const gatewayLabel = gateway === "vnpay" || vnpCode ? "VNPAY" : "Ví MoMo";
			const errorMsg = isCancelledCode
				? `Bạn đã hủy giao dịch qua ${gatewayLabel}. Vui lòng thực hiện lại đơn hàng hoặc chọn phương thức khác.`
				: `Giao dịch qua ${gatewayLabel} không thành công (Mã lỗi: ${vnpCode ?? momoCode}). Vui lòng kiểm tra lại tài khoản hoặc thực hiện lại đơn hàng.`;

			queueMicrotask(() => {
				reportVietnamReturnFailure(errorMsg, setError);
			});
			return;
		}

		// 3. SUCCESS RETURN: Keep completing screen displayed while verifying and creating order
		markPaymentCompleting(checkoutId);

		if (!checkout) {
			// Wait until checkout data is hydrated
			return;
		}

		const attemptKey = `success:${gateway ?? ""}:${vnpCode ?? momoCode ?? ""}:${liveSearchParams.get("vnp_TxnRef") ?? liveSearchParams.get("orderId") ?? ""}`;
		if (returnAttemptRef.current === attemptKey || isProcessingRef.current) {
			return;
		}

		returnAttemptRef.current = attemptKey;
		isProcessingRef.current = true;

		const verifyAndFinalize = async () => {
			try {
				const paramsObj = Object.fromEntries(liveSearchParams.entries());
				const res = await fetch("/api/payment/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						gateway: gateway || (vnpCode ? "vnpay" : "momo"),
						params: paramsObj,
					}),
				});

				const data = (await res.json()) as {
					success: boolean;
					cancelled?: boolean;
					message?: string;
					error?: string;
				};

				if (data.cancelled) {
					reportVietnamReturnFailure(
						data.message || "Giao dịch thanh toán đã bị hủy. Vui lòng thực hiện lại đơn hàng.",
						setError,
					);
					return;
				}

				if (!data.success) {
					reportVietnamReturnFailure(
						data.error || "Xác thực thanh toán thất bại. Vui lòng thực hiện lại đơn hàng.",
						setError,
					);
					return;
				}

				// Record payment method details on checkout for Saleor Admin visibility
				const isVnpay = gateway === "vnpay" || Boolean(vnpCode);
				const isMomo = gateway === "momo" || Boolean(momoCode);

				let methodName = "Thanh toán điện tử";
				let note = "";
				let pspReference = "";
				let extraMetadata: Record<string, string | number | boolean | null | undefined> = {};

				if (isVnpay) {
					const txnNo = liveSearchParams.get("vnp_TransactionNo") ?? "";
					const bankCode = liveSearchParams.get("vnp_BankCode") ?? "";
					const cardType = liveSearchParams.get("vnp_CardType") ?? "";
					const payDate = liveSearchParams.get("vnp_PayDate") ?? "";
					const vnpAmount = liveSearchParams.get("vnp_Amount");
					const parsedAmount = vnpAmount ? Number(vnpAmount) / 100 : undefined;

					pspReference = txnNo || `VNPAY_${liveSearchParams.get("vnp_TxnRef") ?? Date.now()}`;
					methodName = bankCode ? `VNPAY (${bankCode})` : "Cổng VNPAY";
					note = `Phương thức thanh toán: Cổng VNPAY${bankCode ? ` (Ngân hàng: ${bankCode})` : ""}${txnNo ? `, Mã GD VNPAY: ${txnNo}` : ""}${cardType ? `, Loại thẻ: ${cardType}` : ""}`;

					extraMetadata = {
						vnp_TransactionNo: txnNo,
						vnp_BankCode: bankCode,
						vnp_CardType: cardType,
						vnp_PayDate: payDate,
						vnp_TxnRef: liveSearchParams.get("vnp_TxnRef") ?? "",
						vnp_Amount: parsedAmount,
						vnp_ResponseCode: vnpCode,
					};
				} else if (isMomo) {
					const transId = liveSearchParams.get("transId") ?? "";
					const payType = liveSearchParams.get("payType") ?? "";
					const orderId = liveSearchParams.get("orderId") ?? "";

					pspReference = transId || `MOMO_${orderId || Date.now()}`;
					methodName = "Ví MoMo";
					note = `Phương thức thanh toán: Ví MoMo${transId ? ` (Mã GD MoMo: ${transId})` : ""}${payType ? `, Loại: ${payType}` : ""}`;

					extraMetadata = {
						momo_transId: transId,
						momo_payType: payType,
						momo_orderId: orderId,
						momo_resultCode: momoCode,
					};
				}

				await getCheckoutTransport().recordPaymentInfo({
					checkoutId: checkout.id,
					methodName,
					gateway: isVnpay ? "vnpay" : isMomo ? "momo" : "test-card",
					note,
					metadata: extraMetadata,
				});

				// Finalize order in Saleor
				const dummyGatewayId =
					checkout.availablePaymentGateways?.[0]?.id ?? "saleor.io.dummy-payment-app";
				const totalAmount = checkout.totalPrice?.gross?.amount ?? 0;

				const result = await executeDummyPayment(
					{ checkoutId: checkout.id, amount: totalAmount },
					dummyGatewayId,
					gatewayMessages,
					{
						paymentMethodName: methodName,
						pspReference,
						message: `Thanh toán thành công qua ${methodName}`,
					},
				);

				if (!result.ok) {
					reportVietnamReturnFailure(result.error, setError);
					return;
				}

				// Broadcast order completion across tabs
				try {
					const channel = new BroadcastChannel("aurabook_order_sync");
					channel.postMessage({ type: "ORDER_COMPLETED", token: result.orderViewToken });
					channel.close();
				} catch {
					// ignore
				}
				try {
					localStorage.setItem(
						"aurabook:completed_order",
						JSON.stringify({ token: result.orderViewToken, at: Date.now() }),
					);
				} catch {
					// ignore
				}

				// Success: clear return query params and navigate to order confirmation
				clearVietnamReturnUrlParams();
				navigateToOrderConfirmation(result.orderViewToken);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : "Lỗi hoàn tất đơn hàng";
				reportVietnamReturnFailure(msg, setError);
			} finally {
				isProcessingRef.current = false;
			}
		};

		void verifyAndFinalize();
	}, [checkout, checkoutId, gatewayMessages, liveSearchParams, setError]);

	// Listen for order completion or failure events broadcast from other tabs (e.g. gateway tab)
	useEffect(() => {
		const handleCompleted = (token: string) => {
			if (!token) return;
			clearPaymentCompleting();
			clearVietnamReturnUrlParams();
			navigateToOrderConfirmation(token);
		};

		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel("aurabook_order_sync");
			channel.onmessage = (event) => {
				if (event.data?.type === "ORDER_COMPLETED" && event.data?.token) {
					handleCompleted(event.data.token);
				} else if (event.data?.type === "ORDER_FAILED" && event.data?.error) {
					setError(event.data.error);
				}
			};
		} catch {
			// ignore
		}

		const handleStorage = (e: StorageEvent) => {
			if (e.key === "aurabook:completed_order" && e.newValue) {
				try {
					const data = JSON.parse(e.newValue) as { token?: string };
					if (data.token) {
						handleCompleted(data.token);
					}
				} catch {
					// ignore
				}
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => {
			channel?.close();
			window.removeEventListener("storage", handleStorage);
		};
	}, [setError]);

	return null;
};
