"use client";

import { useState, useEffect, type FC } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type CheckoutFragment, type AddressFragment } from "@/checkout/graphql";
import {
	CheckCircle2,
	RefreshCw,
	CreditCard,
	AlertTriangle,
	ShieldCheck,
	Check,
	ArrowRight,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { updateCheckoutBilling } from "@/checkout/lib/payment";
import { executeDummyPayment } from "@/checkout/lib/payment/providers/dummy-pay";
import { useCheckoutGatewayMessages } from "@/checkout/hooks/use-checkout-gateway-messages";
import { navigateToOrderConfirmation } from "@/checkout/lib/payment/navigate-to-order";
import { type BillingAddressData } from "./billing-address-section";
import { useTranslations } from "next-intl";

/** Decorative card surface style - matching original AuraBook card */
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

type PaymentMethodId = "test-card" | "vnpay" | "momo" | "zalopay" | "shopeepay";

interface PaymentMethodItem {
	id: PaymentMethodId;
	name: string;
	description: string;
	logo: string;
	logoWidth: number;
	logoHeight: number;
}

// 4 cổng thanh toán Việt Nam chính thức + Thẻ thử nghiệm
const PAYMENT_METHODS: PaymentMethodItem[] = [
	{
		id: "vnpay",
		name: "Cổng thanh toán VNPAY-QR / Thẻ ATM",
		description: "Quét mã QR hoặc dùng thẻ ATM 40+ ngân hàng nội địa (Vietcombank, BIDV, NCB...)",
		logo: "/images/payment/vnpay.svg",
		logoWidth: 84,
		logoHeight: 24,
	},
	{
		id: "momo",
		name: "Ví điện tử MoMo",
		description: "Thanh toán nhanh chóng bằng ứng dụng Ví MoMo trên điện thoại",
		logo: "/images/payment/momo.svg",
		logoWidth: 30,
		logoHeight: 30,
	},
	{
		id: "zalopay",
		name: "Ví điện tử ZaloPay",
		description: "Thanh toán tiện lợi bằng ví ZaloPay hoặc tài khoản Zalo liên kết",
		logo: "/images/payment/zalopay.svg",
		logoWidth: 80,
		logoHeight: 20,
	},
	{
		id: "shopeepay",
		name: "Ví điện tử ShopeePay",
		description: "Thanh toán an toàn qua ví điện tử ShopeePay",
		logo: "/images/payment/shopeepay.svg",
		logoWidth: 78,
		logoHeight: 24,
	},
];

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
	gatewayName: _gatewayName,
	onPaymentError,
	onPaymentActivityChange,
}) => {
	const tSteps = useTranslations("checkout.steps");
	const gatewayMessages = useCheckoutGatewayMessages();
	const searchParams = useSearchParams();

	// Mặc định chọn thẻ test hoặc VNPAY
	const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>("test-card");
	const [isLoading, setIsLoading] = useState(false);
	const [isVerifyingFromBank, setIsVerifyingFromBank] = useState(false);
	const [bankNoticeMessage, setBankNoticeMessage] = useState<string | null>(null);

	const totalAmount = checkout?.totalPrice?.gross?.amount ?? 0;
	const currency = checkout?.totalPrice?.gross?.currency ?? "VND";

	const formattedTotal = new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency,
	}).format(totalAmount);

	// TỰ ĐỘNG BẮT PHẢN HỒI XÁC NHẬN TỪ CỔNG THANH TOÁN / NGÂN HÀNG (Không dùng nút bấm tay)
	useEffect(() => {
		if (!checkout) return;

		const vnpResponseCode = searchParams.get("vnp_ResponseCode");
		const momoResultCode = searchParams.get("resultCode");
		const zalopayStatus = searchParams.get("status");
		const providerStatus = searchParams.get("provider_status");
		const gateway = searchParams.get("gateway");

		// Ngân hàng phản hồi thành công (vnpay: 00, momo: 0, zalopay: 1, provider_status: success)
		const isSuccessFromBank =
			vnpResponseCode === "00" ||
			momoResultCode === "0" ||
			zalopayStatus === "1" ||
			zalopayStatus === "SUCCESS" ||
			providerStatus === "success";

		// Khách hàng hủy giao dịch tại cổng (vnpay: 24, momo: 1006)
		const isCancelledByCustomer =
			vnpResponseCode === "24" ||
			momoResultCode === "1006" ||
			searchParams.get("error") === "cancelled";

		if (isSuccessFromBank && !isVerifyingFromBank) {
			setIsVerifyingFromBank(true);
			onPaymentActivityChange?.(true);

			const finalizeOrderFromBank = async () => {
				try {
					const dummyGatewayId = checkout.availablePaymentGateways?.[0]?.id || "saleor.io.dummy-payment-app";
					const result = await executeDummyPayment(
						{ checkoutId: checkout.id, amount: totalAmount },
						dummyGatewayId,
						gatewayMessages,
					);

					if (!result.ok) {
						throw new Error(result.error);
					}

					// Điều hướng sang trang xác nhận đơn hàng thành công
					navigateToOrderConfirmation(result.orderViewToken);
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : "Lỗi xác thực thanh toán từ ngân hàng";
					setIsVerifyingFromBank(false);
					onPaymentActivityChange?.(false);
					onPaymentError?.(msg);
				}
			};

			void finalizeOrderFromBank();
		} else if (isCancelledByCustomer) {
			setBankNoticeMessage(
				`Giao dịch thanh toán qua ${gateway?.toUpperCase() || "cổng thanh toán"} đã bị hủy. Bạn có thể chọn phương thức khác để hoàn tất đơn hàng.`,
			);
		} else if (vnpResponseCode && vnpResponseCode !== "00") {
			setBankNoticeMessage(
				`Cổng thanh toán phản hồi: Giao dịch không thành công (Mã lỗi: ${vnpResponseCode}). Vui lòng thử lại.`,
			);
		}
	}, [checkout, searchParams]);

	// Xử lý khi nhấn nút tiến hành thanh toán
	const handleProceedPayment = async () => {
		if (!checkout) return;
		setIsLoading(true);
		onPaymentActivityChange?.(true);

		try {
			// Cập nhật thông tin billing trước
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

			// TRƯỜNG HỢP 1: DÙNG TRỰC TIẾP THẺ THỬ NGHIỆM (Card test)
			if (selectedMethodId === "test-card") {
				const dummyGatewayId = checkout.availablePaymentGateways?.[0]?.id || "saleor.io.dummy-payment-app";
				const result = await executeDummyPayment(
					{ checkoutId: checkout.id, amount: totalAmount },
					dummyGatewayId,
					gatewayMessages,
				);

				if (!result.ok) {
					throw new Error(result.error);
				}

				navigateToOrderConfirmation(result.orderViewToken);
				return;
			}

			// TRƯỜNG HỢP 2: DÙNG CÁC CỔNG THANH TOÁN (VNPAY, MoMo, ZaloPay, ShopeePay)
			// Chuyển hướng sang giao diện cổng thanh toán
			const gatewayUrl = `/checkout/gateway?provider=${selectedMethodId}&orderId=${encodeURIComponent(checkout.id)}&amount=${totalAmount}&currency=${currency}`;
			window.location.href = gatewayUrl;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Lỗi khi xử lý thanh toán";
			onPaymentError?.(msg);
			setIsLoading(false);
			onPaymentActivityChange?.(false);
		}
	};

	// 1. MÀN HÌNH ĐANG XÁC THỰC KẾT QUẢ TỪ NGÂN HÀNG (Do ngân hàng chuyển hướng về)
	if (isVerifyingFromBank) {
		return (
			<section className="space-y-6">
				<h2 className="text-lg font-semibold">{tSteps("payment")}</h2>
				<div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6 text-center dark:border-sky-900/50 dark:bg-sky-950/30">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
						<RefreshCw className="h-7 w-7 animate-spin text-sky-600" />
					</div>
					<h3 className="mt-4 text-base font-bold text-sky-950 dark:text-sky-100">
						Đang xác thực kết quả thanh toán từ ngân hàng…
					</h3>
					<p className="mt-1.5 text-sm text-sky-700 dark:text-sky-300">
						Hệ thống đang đối chiếu dữ liệu giao dịch và tạo đơn hàng chính thức cho bạn.
					</p>
					<div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400">
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
						Ngân hàng đã xác nhận thanh toán thành công
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-6">
			<h2 className="text-lg font-semibold">{tSteps("payment")}</h2>

			{/* Thông báo từ ngân hàng nếu có */}
			{bankNoticeMessage && (
				<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
					<AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
					<div className="flex-1">{bankNoticeMessage}</div>
				</div>
			)}

			{/* 1. KHU VỰC THẺ THỬ NGHIỆM (Clickable & Usable) */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
					<span>Thẻ thanh toán thử nghiệm (Credit / Debit Card Test)</span>
					{selectedMethodId === "test-card" && (
						<span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
							<Check className="w-3.5 h-3.5" /> Đang chọn
						</span>
					)}
				</div>

				<div
					role="button"
					tabIndex={0}
					onClick={() => setSelectedMethodId("test-card")}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setSelectedMethodId("test-card");
						}
					}}
					className={`relative aspect-[856/500] w-full max-w-[420px] mx-auto rounded-2xl cursor-pointer transition-all duration-200 ${
						selectedMethodId === "test-card"
							? "ring-4 ring-sky-500/80 shadow-lg scale-[1.01]"
							: "opacity-85 hover:opacity-100 hover:scale-[1.005]"
					}`}
				>
					<div
						className="absolute inset-0 overflow-hidden rounded-2xl p-5 text-white sm:p-6"
						style={CARD_SURFACE_STYLE}
					>
						<div className="relative z-10 flex h-full flex-col justify-between">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CreditCard className="w-4 h-4 text-sky-400" />
									<span className="text-[11px] font-semibold tracking-wider uppercase text-white/70">
										AuraBook Test Card
									</span>
								</div>
								<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30">
									Sandbox Mode
								</span>
							</div>

							<div className="space-y-1">
								<p className="font-mono text-base tracking-[0.25em] text-white/95 sm:text-lg">
									•••• •••• •••• 4242
								</p>
								<p className="text-[10px] text-white/50">Thẻ thanh toán thử nghiệm tích hợp sẵn</p>
							</div>

							<div className="flex items-end justify-between text-xs text-white/70 sm:text-sm">
								<span className="uppercase tracking-wide font-medium">AuraBook Tester</span>
								<span className="font-mono">12/28</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 2. DANH SÁCH 4 CỔNG THANH TOÁN VIỆT NAM (1 CỘT, 4 HÀNG DÀI RA) */}
			<div className="space-y-3">
				<div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
					Hoặc chọn cổng thanh toán trực tuyến:
				</div>

				<div className="flex flex-col gap-2.5">
					{PAYMENT_METHODS.map((method) => {
						const isSelected = selectedMethodId === method.id;
						return (
							<div
								key={method.id}
								role="button"
								tabIndex={0}
								onClick={() => setSelectedMethodId(method.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setSelectedMethodId(method.id);
									}
								}}
								className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isSelected
										? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/25 ring-2 ring-sky-500/30 shadow-sm"
										: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
								}`}
							>
								{/* Left: Official Logo + Name + Description */}
								<div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
									<div className="h-9 w-24 shrink-0 flex items-center justify-center bg-white dark:bg-slate-800/80 rounded-lg p-1 border border-slate-100 dark:border-slate-800 shadow-2xs">
										<Image
											src={method.logo}
											alt={method.name}
											width={method.logoWidth}
											height={method.logoHeight}
											className="max-h-7 w-auto object-contain"
										/>
									</div>

									<div className="min-w-0 flex-1">
										<div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
											{method.name}
										</div>
										<div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
											{method.description}
										</div>
									</div>
								</div>

								{/* Right: Radio selection indicator */}
								<div className="shrink-0 flex items-center">
									<div
										className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
											isSelected
												? "border-sky-600 bg-sky-600 text-white"
												: "border-slate-300 dark:border-slate-600"
										}`}
									>
										{isSelected && <Check className="w-3 h-3 stroke-[3]" />}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* 3. NÚT TIẾN HÀNH THANH TOÁN CHÍNH */}
			<div className="pt-2 space-y-2">
				<Button
					type="button"
					onClick={handleProceedPayment}
					disabled={isLoading}
					className="w-full py-6 text-base font-bold shadow-md rounded-xl bg-sky-600 hover:bg-sky-700 text-white"
				>
					{isLoading ? (
						<div className="flex items-center justify-center gap-2">
							<RefreshCw className="w-5 h-5 animate-spin" />
							<span>Đang khởi tạo thanh toán…</span>
						</div>
					) : (
						<div className="flex items-center justify-center gap-2">
							{selectedMethodId === "test-card" ? (
								<>
									<CreditCard className="w-5 h-5" />
									<span>Thanh toán ngay bằng Thẻ thử nghiệm ({formattedTotal})</span>
								</>
							) : (
								<>
									<span>
										Tiến hành thanh toán qua{" "}
										{PAYMENT_METHODS.find((m) => m.id === selectedMethodId)?.name.split("/")[0] || "Cổng thanh toán"}
									</span>
									<ArrowRight className="w-5 h-5" />
								</>
							)}
						</div>
					)}
				</Button>

				<div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 text-center">
					<ShieldCheck className="w-4 h-4 text-emerald-600" />
					<span>
						{selectedMethodId === "test-card"
							? "Môi trường kiểm thử Saleor Dummy Payment an toàn"
							: "Thanh toán bảo mật qua chuẩn mã hóa ngân hàng (Redirect Gateway)"}
					</span>
				</div>
			</div>
		</section>
	);
};
