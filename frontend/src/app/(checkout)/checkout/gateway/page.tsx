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
	Sparkles,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Loader } from "@/ui/atoms/loader";

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
	const [activeTab, setActiveTab] = useState<"qr" | "atm">("atm");

	// Form state cho người dùng tự nhập thông tin thẻ / số tài khoản
	const [cardNumber, setCardNumber] = useState("");
	const [cardHolder, setCardHolder] = useState("");
	const [issueDate, setIssueDate] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"card" | "otp">("card");
	const [formError, setFormError] = useState("");

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	// Xử lý khi nhấn Tiếp tục (từ màn hình nhập thẻ sang OTP)
	const handleCardSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const cleanCard = cardNumber.replace(/\s+/g, "");
		if (cleanCard.length < 12) {
			setFormError("Vui lòng nhập đúng số thẻ ngân hàng (tối thiểu 12-16 số)");
			return;
		}
		if (!cardHolder.trim()) {
			setFormError("Vui lòng nhập tên chủ thẻ (in hoa không dấu, ví dụ NGUYEN VAN A)");
			return;
		}
		setFormError("");
		setIsProcessing(true);
		setTimeout(() => {
			setIsProcessing(false);
			setStep("otp");
		}, 600);
	};

	// Xử lý khi người dùng điền nhanh thông tin thẻ test NCB
	const handleFillTestCard = () => {
		setCardNumber("9704 1985 2619 1432 198");
		setCardHolder("NGUYEN VAN A");
		setIssueDate("07/15");
		setFormError("");
	};

	// Xử lý khi xác thực OTP thành công
	const handleOtpSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!otp.trim() || otp.length < 4) {
			setFormError("Vui lòng nhập mã OTP xác thực (mã thử nghiệm: 123456)");
			return;
		}
		handleSimulateBankApproval();
	};

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
							/* ATM Card & Bank Account Entry Form */
							<div className="text-left space-y-4 max-w-md mx-auto">
								{/* Quick fill card test banner */}
								<div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
									<div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
										<Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
										<span>Thẻ test NCB: <strong>9704 1985...</strong></span>
									</div>
									<button
										type="button"
										onClick={handleFillTestCard}
										className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
									>
										Điền nhanh
									</button>
								</div>

								{formError && (
									<div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
										{formError}
									</div>
								)}

								{step === "card" ? (
									<form onSubmit={handleCardSubmit} className="space-y-3.5 text-xs">
										<div>
											<label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
												Số thẻ ngân hàng / Số tài khoản
											</label>
											<input
												type="text"
												placeholder="Ví dụ: 9704 1985 2619 1432 198"
												value={cardNumber}
												onChange={(e) => setCardNumber(e.target.value)}
												className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>

										<div>
											<label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
												Tên chủ thẻ (In hoa không dấu)
											</label>
											<input
												type="text"
												placeholder="Ví dụ: NGUYEN VAN A"
												value={cardHolder}
												onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
												className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
													Ngày phát hành (MM/YY)
												</label>
												<input
													type="text"
													placeholder="07/15"
													value={issueDate}
													onChange={(e) => setIssueDate(e.target.value)}
													className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
													Ngân hàng phát hành
												</label>
												<input
													type="text"
													disabled
													value="NCB - Ngân hàng Quốc Dân"
													className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs cursor-not-allowed"
												/>
											</div>
										</div>

										<Button
											type="submit"
											disabled={isProcessing}
											className={`w-full py-5 text-sm font-bold shadow rounded-xl mt-2 ${providerConfig.brandColor}`}
										>
											{isProcessing ? "Đang xác thực thẻ..." : "Tiếp tục xác thực OTP"}
										</Button>
									</form>
								) : (
									<form onSubmit={handleOtpSubmit} className="space-y-3.5 text-xs">
										<div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
											<div className="text-slate-500">Mã xác thực OTP đã được gửi đến số điện thoại đăng ký thẻ:</div>
											<div className="font-mono font-bold text-slate-800 dark:text-slate-200">
												**** **** **** {cardNumber.slice(-4) || "1198"}
											</div>
											<div className="text-[11px] text-emerald-600 font-medium">
												(Mã OTP thử nghiệm: <strong>123456</strong>)
											</div>
										</div>

										<div>
											<label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
												Nhập mã xác thực OTP
											</label>
											<input
												type="text"
												maxLength={6}
												placeholder="Nhập 123456"
												value={otp}
												onChange={(e) => setOtp(e.target.value)}
												className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
												autoFocus
											/>
										</div>

										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => setStep("card")}
												className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-300"
											>
												Quay lại
											</button>
											<Button
												type="submit"
												disabled={isProcessing}
												className={`flex-1 py-5 text-sm font-bold shadow rounded-xl ${providerConfig.brandColor}`}
											>
												{isProcessing ? "Đang hoàn tất thanh toán..." : "Xác nhận thanh toán"}
											</Button>
										</div>
									</form>
								)}
							</div>
						)}

						{/* Bottom Cancel Button */}
						<div className="pt-2">
							<button
								type="button"
								onClick={handleCancelPayment}
								disabled={isProcessing}
								className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2 flex items-center justify-center gap-1.5 mx-auto"
							>
								<ArrowLeft className="w-3.5 h-3.5" />
								<span>Hủy giao dịch và quay lại trang thanh toán</span>
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
					<Loader size="lg" text="Đang kết nối đến cổng thanh toán bảo mật…" />
				</div>
			}
		>
			<GatewayContent />
		</Suspense>
	);
}
