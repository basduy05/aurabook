"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
	ShieldCheck,
	Clock,
	ArrowLeft,
	CheckCircle2,
	QrCode,
	CreditCard,
	Lock,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";

function GatewayContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const provider = searchParams.get("provider") || "vnpay";
	const orderId = searchParams.get("orderId") || "AB" + Date.now();
	const amountParam = Number(searchParams.get("amount") || 150000);
	const currency = searchParams.get("currency") || "VND";

	// Convert USD to VND if needed (1 USD ~ 25,400 VND)
	const isUsd = currency === "USD" || amountParam < 1000;
	const vndAmount = isUsd ? Math.round(amountParam * 25400) : Math.round(amountParam);

	const formattedVnd = new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
	}).format(vndAmount);

	// Timer countdown 15:00
	const [timeLeft, setTimeLeft] = useState(900);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeTab, setActiveTab] = useState<"qr" | "atm">("qr");

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	// Xử lý khi ngân hàng/cổng thanh toán phản hồi thành công
	const handleSimulateBankApproval = () => {
		setIsProcessing(true);
		setTimeout(() => {
			if (provider === "vnpay") {
				router.push(
					`/checkout?vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=${encodeURIComponent(orderId)}&vnp_Amount=${vndAmount * 100}&gateway=vnpay&provider_status=success`,
				);
			} else if (provider === "momo") {
				router.push(
					`/checkout?resultCode=0&message=Success&orderId=${encodeURIComponent(orderId)}&gateway=momo&provider_status=success`,
				);
			} else if (provider === "zalopay") {
				router.push(
					`/checkout?status=1&apptransid=ZP${Date.now()}&orderId=${encodeURIComponent(orderId)}&gateway=zalopay&provider_status=success`,
				);
			} else if (provider === "shopeepay") {
				router.push(
					`/checkout?status=SUCCESS&orderId=${encodeURIComponent(orderId)}&gateway=shopeepay&provider_status=success`,
				);
			} else {
				router.push(`/checkout?provider_status=success&gateway=${provider}`);
			}
		}, 1200);
	};

	// Xử lý khi người dùng hủy giao dịch tại cổng
	const handleCancelPayment = () => {
		if (provider === "vnpay") {
			router.push(`/checkout?vnp_ResponseCode=24&gateway=vnpay`);
		} else if (provider === "momo") {
			router.push(`/checkout?resultCode=1006&gateway=momo`);
		} else {
			router.push(`/checkout?error=cancelled&gateway=${provider}`);
		}
	};

	// Cấu hình visual từng nhà cung cấp
	const providerConfig = {
		vnpay: {
			name: "VNPAY-QR / Ngân hàng nội địa",
			logo: "/images/payment/vnpay.svg",
			logoWidth: 120,
			logoHeight: 34,
			brandColor: "bg-blue-600 hover:bg-blue-700 text-white",
			accentBorder: "border-blue-500",
			badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
			qrDesc: "Mở ứng dụng Mobile Banking của 40+ ngân hàng (Vietcombank, BIDV, Agribank, VietinBank, MB...) hoặc ví điện tử để quét mã",
		},
		momo: {
			name: "Cổng thanh toán Ví MoMo",
			logo: "/images/payment/momo.svg",
			logoWidth: 42,
			logoHeight: 42,
			brandColor: "bg-[#a50064] hover:bg-[#850050] text-white",
			accentBorder: "border-[#a50064]",
			badgeColor: "bg-pink-50 text-[#a50064] border-pink-200",
			qrDesc: "Mở ứng dụng Ví MoMo trên điện thoại để quét mã QR và xác nhận thanh toán",
		},
		zalopay: {
			name: "Cổng thanh toán ZaloPay",
			logo: "/images/payment/zalopay.svg",
			logoWidth: 110,
			logoHeight: 30,
			brandColor: "bg-[#0068ff] hover:bg-[#0055d4] text-white",
			accentBorder: "border-[#0068ff]",
			badgeColor: "bg-sky-50 text-[#0068ff] border-sky-200",
			qrDesc: "Mở ứng dụng Zalo hoặc ZaloPay để quét mã QR và hoàn tất giao dịch",
		},
		shopeepay: {
			name: "Cổng thanh toán Ví ShopeePay",
			logo: "/images/payment/shopeepay.svg",
			logoWidth: 100,
			logoHeight: 32,
			brandColor: "bg-[#ee4d2d] hover:bg-[#d63b1c] text-white",
			accentBorder: "border-[#ee4d2d]",
			badgeColor: "bg-orange-50 text-[#ee4d2d] border-orange-200",
			qrDesc: "Mở ứng dụng Shopee hoặc ShopeePay để quét mã QR và hoàn tất thanh toán",
		},
	}[provider as "vnpay" | "momo" | "zalopay" | "shopeepay"] || {
		name: "Cổng thanh toán VNPAY",
		logo: "/images/payment/vnpay.svg",
		logoWidth: 110,
		logoHeight: 32,
		brandColor: "bg-blue-600 hover:bg-blue-700 text-white",
		accentBorder: "border-blue-500",
		badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
		qrDesc: "Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã QR",
	};

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
			<div className="max-w-xl mx-auto space-y-5">
				{/* Top Branding Header */}
				<div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Image
							src={providerConfig.logo}
							alt={providerConfig.name}
							width={providerConfig.logoWidth}
							height={providerConfig.logoHeight}
							className="object-contain"
							priority
						/>
						<div className="hidden sm:block pl-3 border-l border-slate-200 dark:border-slate-700 text-xs text-slate-500">
							Cổng thanh toán trực tuyến
						</div>
					</div>
					<div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
						<Clock className="w-3.5 h-3.5 text-amber-500" />
						<span>{formattedTime}</span>
					</div>
				</div>

				{/* Order Summary Card */}
				<div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
					<div className="flex items-center justify-between text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
						<span className="text-slate-500">Đơn vị thụ hưởng:</span>
						<span className="font-semibold text-slate-800 dark:text-slate-100">Aurabook Publishing</span>
					</div>
					<div className="flex items-center justify-between text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
						<span className="text-slate-500">Mã giao dịch / Đơn hàng:</span>
						<span className="font-mono font-medium text-slate-700 dark:text-slate-300">#{orderId.slice(-8)}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-slate-600 dark:text-slate-300">Số tiền thanh toán:</span>
						<span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
							{formattedVnd}
						</span>
					</div>
				</div>

				{/* Payment Details Container */}
				<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
					{/* For VNPay, allow switching between QR and ATM card */}
					{provider === "vnpay" && (
						<div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800">
							<button
								type="button"
								onClick={() => setActiveTab("qr")}
								className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
									activeTab === "qr"
										? "border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								<QrCode className="w-4 h-4" />
								<span>VNPAY-QR</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("atm")}
								className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
									activeTab === "atm"
										? "border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								<CreditCard className="w-4 h-4" />
								<span>Thẻ ATM / Tài khoản</span>
							</button>
						</div>
					)}

					<div className="p-6 text-center space-y-5">
						{activeTab === "qr" ? (
							<>
								<div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md">
									{/* Stylized realistic QR Code representing payment */}
									<div className="w-56 h-56 mx-auto relative flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden p-2">
										<div className="w-full h-full bg-white rounded-lg p-2.5 flex flex-col items-center justify-between">
											{/* Corner blocks */}
											<div className="w-full flex justify-between">
												<div className="w-10 h-10 border-4 border-slate-900 rounded p-1 flex items-center justify-center">
													<div className="w-4 h-4 bg-slate-900 rounded-sm" />
												</div>
												<div className="w-10 h-10 border-4 border-slate-900 rounded p-1 flex items-center justify-center">
													<div className="w-4 h-4 bg-slate-900 rounded-sm" />
												</div>
											</div>

											{/* Center logo watermark */}
											<div className="p-1 rounded-md bg-white border border-slate-200 shadow-sm">
												<Image
													src={providerConfig.logo}
													alt={providerConfig.name}
													width={60}
													height={20}
													className="object-contain"
												/>
											</div>

											{/* Bottom corners */}
											<div className="w-full flex justify-between">
												<div className="w-10 h-10 border-4 border-slate-900 rounded p-1 flex items-center justify-center">
													<div className="w-4 h-4 bg-slate-900 rounded-sm" />
												</div>
												<div className="flex flex-col items-end justify-end gap-1">
													<div className="w-4 h-4 bg-slate-900" />
													<div className="w-2 h-2 bg-slate-900" />
												</div>
											</div>
										</div>
									</div>
								</div>
								<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
									{providerConfig.qrDesc}
								</p>
							</>
						) : (
							/* ATM Card Test Credentials View (VNPAY NCB) */
							<div className="text-left space-y-4 max-w-sm mx-auto">
								<div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
									<div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
										<Sparkles className="w-4 h-4 text-blue-600" />
										Thông tin thẻ thử nghiệm NCB chính thức (VNPAY):
									</div>
									<div className="grid grid-cols-3 gap-1 pt-1 text-slate-700 dark:text-slate-300">
										<span className="text-slate-500">Ngân hàng:</span>
										<span className="col-span-2 font-semibold">NCB (Ngân hàng Quốc Dân)</span>
										<span className="text-slate-500">Số thẻ:</span>
										<span className="col-span-2 font-mono font-bold">9704 1985 2619 1432 198</span>
										<span className="text-slate-500">Chủ thẻ:</span>
										<span className="col-span-2 font-semibold">NGUYEN VAN A</span>
										<span className="text-slate-500">Ngày phát hành:</span>
										<span className="col-span-2 font-semibold">07/15</span>
										<span className="text-slate-500">Mã OTP:</span>
										<span className="col-span-2 font-bold text-emerald-600">123456</span>
									</div>
								</div>
								<div className="text-xs text-slate-500 text-center">
									Nhấn nút bên dưới để ngân hàng NCB xác nhận giao dịch thành công và chuyển hướng về Aurabook.
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="pt-2 space-y-3">
							<Button
								type="button"
								onClick={handleSimulateBankApproval}
								disabled={isProcessing}
								className={`w-full py-6 text-base font-bold shadow-md rounded-xl ${providerConfig.brandColor}`}
							>
								{isProcessing ? (
									<div className="flex items-center justify-center gap-2">
										<RefreshCw className="w-5 h-5 animate-spin" />
										<span>Ngân hàng đang xử lý giao dịch…</span>
									</div>
								) : (
									<div className="flex items-center justify-center gap-2">
										<CheckCircle2 className="w-5 h-5" />
										<span>Xác nhận đã thanh toán từ ngân hàng</span>
									</div>
								)}
							</Button>

							<button
								type="button"
								onClick={handleCancelPayment}
								disabled={isProcessing}
								className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2 flex items-center justify-center gap-1.5 mx-auto"
							>
								<ArrowLeft className="w-3.5 h-3.5" />
								<span>Hủy giao dịch và quay lại trang giỏ hàng</span>
							</button>
						</div>
					</div>
				</div>

				{/* Security Compliance Footer */}
				<div className="text-center space-y-2 text-[11px] text-slate-400">
					<div className="flex items-center justify-center gap-4">
						<span className="flex items-center gap-1">
							<Lock className="w-3 h-3" /> Chuẩn bảo mật SSL 256-bit
						</span>
						<span>•</span>
						<span className="flex items-center gap-1">
							<ShieldCheck className="w-3 h-3" /> PCI-DSS Compliant
						</span>
					</div>
					<p>© 2026 Bản quyền thuộc về Aurabook &amp; Đối tác cổng thanh toán.</p>
				</div>
			</div>
		</div>
	);
}

export default function GatewayPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
					<div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
						<RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
						<span>Đang kết nối đến cổng thanh toán…</span>
					</div>
				</div>
			}
		>
			<GatewayContent />
		</Suspense>
	);
}
