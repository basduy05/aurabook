"use client";

import { useState, useEffect, type FC } from "react";
import Image from "next/image";
import { type CheckoutFragment, type AddressFragment } from "@/checkout/graphql";
import { FlaskConical } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { updateCheckoutBilling } from "@/checkout/lib/payment";
import { executeDummyPayment } from "@/checkout/lib/payment/providers/dummy-pay";
import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import { useCheckoutGatewayMessages } from "@/checkout/hooks/use-checkout-gateway-messages";
import { useCheckoutPaymentMessages } from "@/checkout/hooks/use-checkout-payment-messages";
import { navigateToOrderConfirmation } from "@/checkout/lib/payment/navigate-to-order";
import {
	markPaymentCompleting,
	clearPaymentCompleting,
} from "@/checkout/lib/payment/checkout-payment-completion";
import { type BillingAddressData } from "./billing-address-section";
import { PaymentTrustSignals } from "./payment-trust-signals";
import { LoadingSpinner } from "@/checkout/ui-kit/loading-spinner";
import { formatMoneyWithFallback } from "@/checkout/lib/utils/money";
import { convertToVnd, formatVnd } from "@/checkout/lib/utils/currency-converter";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Soft ambient sheen — corner blooms only, no diagonal stripe. Exactly matches storefront. */
const CARD_SURFACE_STYLE = {
	background: [
		"radial-gradient(130% 100% at 0% 0%, rgba(255,255,255,0.11), transparent 52%)",
		"radial-gradient(130% 100% at 100% 100%, rgba(255,255,255,0.11), transparent 52%)",
		"linear-gradient(168deg, oklch(0.2 0 0) 0%, oklch(0.11 0 0) 45%, oklch(0.15 0 0) 100%)",
	].join(", "),
	boxShadow: [
		"inset 0 1px 0 rgba(255,255,255,0.14)",
		"inset 0 -1px 0 rgba(0,0,0,0.25)",
		"0 2px 16px rgba(0,0,0,0.1)",
	].join(", "),
} as const;

type PaymentMethodId = "test-card" | "vnpay" | "momo";

interface PaymentMethodItem {
	id: PaymentMethodId;
	name: string;
	description: string;
	logo: string;
	logoWidth: number;
	logoHeight: number;
	logoClassName: string;
}

const PAYMENT_METHODS: PaymentMethodItem[] = [
	{
		id: "vnpay",
		name: "VNPAY",
		description: "Quét mã QR hoặc dùng thẻ ATM / thẻ quốc tế qua cổng VNPAY",
		logo: "/images/payment/vnpay.svg",
		logoWidth: 120,
		logoHeight: 34,
		logoClassName: "h-8 sm:h-9 w-auto object-contain",
	},
	{
		id: "momo",
		name: "Ví MoMo",
		description: "Thanh toán nhanh bằng ứng dụng MoMo (Sandbox)",
		logo: "/images/payment/momo.svg",
		logoWidth: 40,
		logoHeight: 40,
		logoClassName: "h-9 w-9 sm:h-10 sm:w-10 object-contain",
	},
];

/**
 * Decorative card preview — styled exactly like storefront's TestCardMockup.
 * Flat, non-floating, with token-driven active ring indicator.
 */
interface TestCardMockupProps {
	isSelected: boolean;
	onClick: () => void;
}

const TestCardMockup: FC<TestCardMockupProps> = ({ isSelected, onClick }) => (
	<div
		role="button"
		tabIndex={0}
		aria-label="Thẻ thanh toán thử nghiệm"
		aria-pressed={isSelected}
		onClick={onClick}
		onKeyDown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onClick();
			}
		}}
		className={cn(
			"relative aspect-[856/520] w-full max-w-[420px] mx-auto rounded-2xl cursor-pointer transition-opacity",
			isSelected
				? "opacity-100 ring-2 ring-foreground ring-offset-2 ring-offset-background"
				: "opacity-60 hover:opacity-90",
		)}
	>
		<div
			className="absolute inset-0 overflow-hidden rounded-2xl p-5 text-white sm:p-6"
			style={CARD_SURFACE_STYLE}
		>
			<div className="relative z-10 flex h-full flex-col justify-between">
				<div className="flex justify-end">
					<span className="text-[10px] font-medium uppercase tracking-widest text-white/45 sm:text-xs">
						Test
					</span>
				</div>
				<p className="font-mono text-base tracking-[0.2em] text-white/90 sm:text-lg">•••• •••• •••• 4242</p>
				<div className="flex items-end justify-between text-xs text-white/60 sm:text-sm">
					<span className="uppercase tracking-wide">Test cardholder</span>
					<span>12/28</span>
				</div>
			</div>
		</div>
	</div>
);

export interface SimulatedVietnamPaymentsProps {
	checkout?: CheckoutFragment;
	billing?: {
		billingData: BillingAddressData;
		sameAsBilling: boolean;
		hasShippingAddress: boolean;
		shippingAddress: AddressFragment | null | undefined;
		userAddresses: ReadonlyArray<AddressFragment> | undefined;
		authenticated: boolean;
	};
	gatewayName?: string | null;
	onPaymentError?: (message: string) => void;
	onPaymentActivityChange?: (active: boolean) => void;
}

export const SimulatedVietnamPayments: FC<SimulatedVietnamPaymentsProps> = ({
	checkout,
	billing,
	gatewayName,
	onPaymentError,
	onPaymentActivityChange,
}) => {
	const tSteps = useTranslations("checkout.steps");
	const tActions = useTranslations("checkout.actions");
	const gatewayMessages = useCheckoutGatewayMessages();
	const paymentMessages = useCheckoutPaymentMessages();

	const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>("test-card");
	const [isLoading, setIsLoading] = useState(false);

	const label = gatewayName?.trim() || paymentMessages.dummyGateway;
	const grossPrice = checkout?.totalPrice?.gross;
	const totalAmount = grossPrice?.amount ?? 0;
	const currency = grossPrice?.currency?.toUpperCase() ?? "VND";
	const isVnd = currency === "VND";
	const vndAmount = convertToVnd(totalAmount, currency);
	const formattedVnd = formatVnd(vndAmount);
	const formattedTotal = formatMoneyWithFallback(grossPrice);

	// Detect if returning from an abandoned or failed external payment gateway redirect
	useEffect(() => {
		try {
			sessionStorage.setItem("checkout_return_path", window.location.pathname);
			const pendingGateway = sessionStorage.getItem("checkout:pending_gateway");
			if (pendingGateway) {
				sessionStorage.removeItem("checkout:pending_gateway");
				const params = new URLSearchParams(window.location.search);
				const vnpCode = params.get("vnp_ResponseCode");
				const momoCode = params.get("resultCode");
				if (vnpCode !== "00" && momoCode !== "0") {
					const name = pendingGateway === "vnpay" ? "VNPAY" : "Ví MoMo";
					onPaymentError?.(
						`Giao dịch thanh toán qua ${name} chưa hoàn tất hoặc cổng thanh toán gặp sự cố (Mã lỗi cổng thanh toán / Không tìm thấy website). Vui lòng thực hiện lại đơn hàng hoặc chọn phương thức khác.`,
					);
				}
			}
		} catch {
			// ignore
		}
	}, [onPaymentError]);

	const handleProceedPayment = async () => {
		if (!checkout) return;
		setIsLoading(true);
		onPaymentActivityChange?.(true);

		// Synchronously pre-open new tab for real external gateways (VNPAY, MoMo) to avoid browser popup blockers
		let paymentTab: Window | null = null;
		if (selectedMethodId !== "test-card") {
			try {
				paymentTab = window.open("", "_blank");
				if (paymentTab && !paymentTab.closed) {
					try {
						paymentTab.document.write(
							`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Đang kết nối cổng thanh toán...</title><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#fafafa;color:#222;}p{font-size:15px;}</style></head><body><p>Đang kết nối đến cổng thanh toán, vui lòng đợi trong giây lát...</p></body></html>`,
						);
					} catch {
						// ignore
					}
				}
			} catch {
				// popup blocked or not supported
			}
		}

		try {
			// Update billing first
			if (billing) {
				await updateCheckoutBilling({
					checkoutId: checkout.id,
					sameAsBilling: billing.sameAsBilling,
					hasShippingAddress: billing.hasShippingAddress,
					billingData: billing.billingData,
					shippingAddress: billing.shippingAddress,
					userAddresses: billing.userAddresses,
					authenticated: billing.authenticated,
				});
			}

			// Test card — show completing screen immediately and finalize via dummy gateway
			if (selectedMethodId === "test-card") {
				markPaymentCompleting(checkout.id);

				const testPspRef = `TEST_CARD_${Date.now()}`;
				const methodName = "Thẻ thanh toán thử nghiệm (Credit / Debit Card Test)";
				const note = `Phương thức thanh toán: ${methodName} (Mã GD: ${testPspRef}, Thẻ: 4242)`;

				await getCheckoutTransport().recordPaymentInfo({
					checkoutId: checkout.id,
					methodName,
					gateway: "test-card",
					note,
					metadata: {
						card_brand: "Visa / Mastercard Test",
						card_last4: "4242",
						test_reference: testPspRef,
					},
				});

				const dummyGatewayId =
					checkout.availablePaymentGateways?.[0]?.id ?? "saleor.io.dummy-payment-app";
				const result = await executeDummyPayment(
					{ checkoutId: checkout.id, amount: totalAmount },
					dummyGatewayId,
					gatewayMessages,
					{
						paymentMethodName: "Thẻ thanh toán thử nghiệm",
						pspReference: testPspRef,
						message: "Thanh toán thành công qua thẻ thử nghiệm",
					},
				);

				if (!result.ok) {
					clearPaymentCompleting();
					throw new Error(result.error);
				}

				navigateToOrderConfirmation(result.orderViewToken);
				return;
			}

			// Real payment gateways (VNPAY, MoMo) — record pending state and fetch payment URL
			try {
				sessionStorage.setItem("checkout:pending_gateway", selectedMethodId);
			} catch {
				// ignore
			}

			const apiEndpointMap: Record<string, string> = {
				vnpay: "/api/payment/vnpay/create",
				momo: "/api/payment/momo/create",
			};

			const endpoint = apiEndpointMap[selectedMethodId];
			if (!endpoint) {
				if (paymentTab && !paymentTab.closed) paymentTab.close();
				throw new Error("Phương thức thanh toán không hợp lệ");
			}

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderId: checkout.id,
					amount: totalAmount,
					currency,
					orderInfo: `AuraBook - Thanh toán đơn hàng`,
				}),
			});

			const data = (await response.json()) as {
				success: boolean;
				paymentUrl?: string;
				redirectUrl?: string;
				error?: string;
			};

			if (!data.success || (!data.paymentUrl && !data.redirectUrl)) {
				if (paymentTab && !paymentTab.closed) paymentTab.close();
				throw new Error(
					data.error ??
						`Không thể kết nối đến cổng thanh toán ${selectedMethodId.toUpperCase()}. Vui lòng kiểm tra lại cấu hình hoặc thử lại.`,
				);
			}

			// Open in new tab without overwriting current tab
			const targetUrl = data.paymentUrl ?? data.redirectUrl!;
			if (paymentTab && !paymentTab.closed) {
				paymentTab.location.href = targetUrl;
			} else {
				const fallbackPopup = window.open(targetUrl, "_blank");
				if (!fallbackPopup) {
					// Fallback only if popups are completely blocked by user's browser settings
					window.location.href = targetUrl;
					return;
				}
			}

			// Show loading screen (PaymentCompletingScreen) on the current checkout tab while waiting for payment
			markPaymentCompleting(checkout.id);
			setIsLoading(false);
			onPaymentActivityChange?.(false);
		} catch (err: unknown) {
			if (paymentTab && !paymentTab.closed) {
				paymentTab.close();
			}
			clearPaymentCompleting();
			const msg = err instanceof Error ? err.message : "Lỗi khi xử lý thanh toán";
			onPaymentError?.(msg);
			setIsLoading(false);
			onPaymentActivityChange?.(false);
		}
	};

	return (
		<section className="space-y-6">
			{/* Storefront-exact Dummy Payment Section with TestCardMockup */}
			<div className="space-y-3">
				<h2 className="text-lg font-semibold">{tSteps("payment")}</h2>
				<p className="flex items-start gap-2 text-sm text-muted-foreground">
					<FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
					<span>
						<span className="text-foreground">{label}</span>
						{" · "}
						{paymentMessages.dummyTestMode}
					</span>
				</p>
				<TestCardMockup
					isSelected={selectedMethodId === "test-card"}
					onClick={() => setSelectedMethodId("test-card")}
				/>
			</div>

			{/* PAYMENT METHOD LIST — Styled strictly following storefront selection components */}
			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">
					Hoặc chọn cổng thanh toán trực tuyến:
				</p>

				<div className="space-y-3">
					{PAYMENT_METHODS.map((method) => {
						const isSelected = selectedMethodId === method.id;
						return (
							<label
								key={method.id}
								className={cn(
									"flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-colors",
									"focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2",
									isSelected
										? "border-foreground bg-secondary/50"
										: "border-border hover:border-muted-foreground/50",
								)}
							>
								<input
									type="radio"
									name="payment_gateway"
									value={method.id}
									checked={isSelected}
									onChange={() => setSelectedMethodId(method.id)}
									className="sr-only"
								/>

								{/* Left: Logo without border box + Name + Description */}
								<div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
									<div className="shrink-0 flex items-center justify-center w-28 sm:w-32">
										<Image
											src={method.logo}
											alt={method.name}
											width={method.logoWidth}
											height={method.logoHeight}
											className={method.logoClassName}
										/>
									</div>

									<div className="min-w-0 flex-1">
										<span className="font-medium text-foreground">{method.name}</span>
										<p className="text-sm text-muted-foreground mt-0.5">
											{method.description}
										</p>
									</div>
								</div>

								{/* Right: Storefront radio indicator */}
								<div
									className={cn(
										"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
										isSelected ? "border-foreground" : "border-muted-foreground/50",
									)}
								>
									{isSelected && <div className="h-2.5 w-2.5 rounded-full bg-foreground" />}
								</div>
							</label>
						);
					})}
				</div>
			</div>

			{/* PROCEED BUTTON & TRUST SIGNALS */}
			<div className="pt-2 space-y-3">
				{!isVnd && selectedMethodId !== "test-card" && (
					<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
						<span>Tỷ giá quy đổi sang cổng thanh toán:</span>
						<span className="font-semibold text-foreground">
							{formattedTotal} ≈ {formattedVnd}
						</span>
					</div>
				)}

				<Button
					type="button"
					size="lg"
					onClick={handleProceedPayment}
					disabled={isLoading}
					className="h-12 w-full font-medium"
				>
					{isLoading ? (
						<span className="flex items-center justify-center gap-2">
							<LoadingSpinner />
							<span>{tActions("processingPayment")}</span>
						</span>
					) : (
						<span>
							{selectedMethodId === "test-card"
								? tActions("payTotal", { total: formattedTotal })
								: isVnd
									? `Tiến hành thanh toán qua ${PAYMENT_METHODS.find((m) => m.id === selectedMethodId)?.name ?? "cổng thanh toán"}`
									: `Tiến hành thanh toán qua ${PAYMENT_METHODS.find((m) => m.id === selectedMethodId)?.name ?? "cổng thanh toán"} (${formattedVnd})`}
						</span>
					)}
				</Button>

				<PaymentTrustSignals />
			</div>
		</section>
	);
};
