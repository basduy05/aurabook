import { NextResponse } from "next/server";
import crypto from "crypto";

import { convertToVnd } from "@/checkout/lib/utils/currency-converter";

/**
 * Standard VNPAY parameter sorting & RFC 3986 encoding function.
 * Matches official VNPAY Node.js SDK and sample code.
 */
function sortObject(obj: Record<string, string>): Record<string, string> {
	const sorted: Record<string, string> = {};
	const str: string[] = [];

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			str.push(encodeURIComponent(key));
		}
	}
	str.sort();

	for (let key = 0; key < str.length; key++) {
		const originalKey = decodeURIComponent(str[key]);
		sorted[str[key]] = encodeURIComponent(obj[originalKey] ?? "").replace(/%20/g, "+");
	}
	return sorted;
}

/** Format Date to yyyyMMddHHmmss in Asia/Ho_Chi_Minh timezone */
function formatVnTime(date: Date): string {
	const formatter = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Ho_Chi_Minh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	const parts = formatter.formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
	return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export async function POST(request: Request) {
	try {
		interface VNPayRequestBody {
			amount?: number | string;
			currency?: string;
			orderId?: string;
			orderInfo?: string;
			locale?: string;
			ipAddr?: string;
		}

		const body = (await request.json()) as VNPayRequestBody;
		const { amount, currency = "VND", orderId, locale = "vn", ipAddr = "127.0.0.1" } = body;

		if (!amount || !orderId) {
			return NextResponse.json(
				{ success: false, error: "Thiếu thông tin số tiền (amount) hoặc mã đơn (orderId)" },
				{ status: 400 },
			);
		}

		const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
		const secretKey = process.env.VNPAY_HASH_SECRET?.trim();
		const vnpayUrl =
			process.env.VNPAY_PAYMENT_URL?.trim() || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
		const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() || "http://localhost:3000";
		const returnUrl = `${storefrontUrl}/checkout?checkout=${encodeURIComponent(orderId)}&gateway=vnpay`;

		if (!tmnCode || !secretKey) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Cổng VNPAY chưa được cấu hình Terminal ID (vnp_TmnCode) hoặc Hash Secret trong hệ thống.",
				},
				{ status: 500 },
			);
		}

		// Convert foreign currencies (e.g. USD) to VND, or keep as-is if already VND
		const rawAmount = Number(amount);
		const vndAmount = convertToVnd(rawAmount, currency);
		// Amount in VND * 100 per VNPAY spec (integer only)
		const vnpAmount = vndAmount * 100;

		const now = new Date();
		const createDate = formatVnTime(now);
		// Expire in 15 minutes
		const expireDate = formatVnTime(new Date(now.getTime() + 15 * 60 * 1000));

		// Unique transaction reference (max 100 chars, alphanumeric + underscores)
		const cleanRef = String(orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(-8) || "ORD";
		const txnRef = `${cleanRef}_${Date.now().toString().slice(-6)}`;

		let vnpParams: Record<string, string> = {
			vnp_Version: process.env.VNPAY_VERSION ?? "2.1.0",
			vnp_Command: process.env.VNPAY_COMMAND ?? "pay",
			vnp_TmnCode: tmnCode,
			vnp_Amount: String(vnpAmount),
			vnp_CreateDate: createDate,
			vnp_CurrCode: "VND",
			vnp_IpAddr: ipAddr,
			vnp_Locale: locale,
			vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
			vnp_OrderType: "other",
			vnp_ReturnUrl: returnUrl,
			vnp_TxnRef: txnRef,
			vnp_ExpireDate: expireDate,
		};

		// 1. Sort object alphabetically and encode
		vnpParams = sortObject(vnpParams);

		// 2. Build signData string
		const signData = Object.keys(vnpParams)
			.map((key) => `${key}=${vnpParams[key]}`)
			.join("&");

		// 3. Compute HmacSHA512 hash
		const hmac = crypto.createHmac("sha512", secretKey);
		const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

		// 4. Final payment URL with signData and vnp_SecureHash
		const paymentUrl = `${vnpayUrl}?${signData}&vnp_SecureHash=${signed}`;

		return NextResponse.json({
			success: true,
			gateway: "vnpay",
			paymentUrl,
			redirectUrl: paymentUrl,
			orderId,
			amount: vnpAmount / 100,
			txnRef,
		});
	} catch (error: unknown) {
		console.error("VNPay payment creation error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Lỗi không xác định khi tạo đơn VNPAY",
			},
			{ status: 500 },
		);
	}
}
