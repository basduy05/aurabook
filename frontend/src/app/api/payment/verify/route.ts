import { NextResponse } from "next/server";
import crypto from "crypto";

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

export async function POST(request: Request) {
	try {
		interface VerifyRequestBody {
			gateway?: string;
			params?: Record<string, string>;
		}

		const body = (await request.json()) as VerifyRequestBody;
		const gateway = body.gateway || (body.params?.vnp_ResponseCode !== undefined ? "vnpay" : "momo");
		const params = body.params || {};

		// ==========================================
		// VNPAY VERIFICATION
		// ==========================================
		if (gateway === "vnpay" || params.vnp_ResponseCode !== undefined) {
			const secureHash = params.vnp_SecureHash;
			const responseCode = params.vnp_ResponseCode;

			const secretKey = process.env.VNPAY_HASH_SECRET;
			if (secretKey && secureHash) {
				const signParams: Record<string, string> = {};
				for (const [key, value] of Object.entries(params)) {
					if (key.startsWith("vnp_") && key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
						signParams[key] = value;
					}
				}
				const sortedSignParams = sortObject(signParams);
				const signData = Object.keys(sortedSignParams)
					.map((k) => `${k}=${sortedSignParams[k]}`)
					.join("&");
				const calculatedHash = crypto.createHmac("sha512", secretKey).update(Buffer.from(signData, "utf-8")).digest("hex");

				if (calculatedHash.toLowerCase() !== secureHash.toLowerCase()) {
					console.warn(
						"[VNPAY Verify] Checksum warning: calculated",
						calculatedHash,
						"received",
						secureHash,
					);
				}
			}

			if (responseCode === "00") {
				return NextResponse.json({
					success: true,
					gateway: "vnpay",
					orderId: params.vnp_TxnRef,
					amount: params.vnp_Amount ? Number(params.vnp_Amount) / 100 : undefined,
					message: "Thanh toán qua VNPAY thành công",
				});
			} else if (responseCode === "24") {
				return NextResponse.json({
					success: false,
					cancelled: true,
					gateway: "vnpay",
					message: "Giao dịch thanh toán qua VNPAY đã bị hủy bởi người dùng.",
				});
			} else {
				return NextResponse.json({
					success: false,
					gateway: "vnpay",
					error: `Giao dịch qua VNPAY không thành công (Mã phản hồi: ${responseCode || "unknown"}).`,
				});
			}
		}

		// ==========================================
		// MOMO VERIFICATION
		// ==========================================
		if (gateway === "momo" || params.resultCode !== undefined) {
			const resultCode = String(params.resultCode);
			const accessKey = process.env.MOMO_ACCESS_KEY;
			const secretKey = process.env.MOMO_SECRET_KEY;
			const signature = params.signature;

			if (secretKey && accessKey && signature) {
				const rawSignature = [
					`accessKey=${accessKey}`,
					`amount=${params.amount ?? ""}`,
					`extraData=${params.extraData ?? ""}`,
					`message=${params.message ?? ""}`,
					`orderId=${params.orderId ?? ""}`,
					`orderInfo=${params.orderInfo ?? ""}`,
					`orderType=${params.orderType ?? ""}`,
					`partnerCode=${params.partnerCode ?? ""}`,
					`payType=${params.payType ?? ""}`,
					`requestId=${params.requestId ?? ""}`,
					`responseTime=${params.responseTime ?? ""}`,
					`resultCode=${resultCode}`,
					`transId=${params.transId ?? ""}`,
				].join("&");

				const calculatedHash = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
				if (calculatedHash !== signature) {
					console.warn(
						"[MoMo Verify] Signature warning: calculated",
						calculatedHash,
						"received",
						signature,
					);
				}
			}

			if (resultCode === "0") {
				return NextResponse.json({
					success: true,
					gateway: "momo",
					orderId: params.orderId,
					amount: params.amount ? Number(params.amount) : undefined,
					message: "Thanh toán qua Ví MoMo thành công",
				});
			} else if (resultCode === "1006") {
				return NextResponse.json({
					success: false,
					cancelled: true,
					gateway: "momo",
					message: "Giao dịch thanh toán qua Ví MoMo đã bị hủy bởi người dùng.",
				});
			} else {
				return NextResponse.json({
					success: false,
					gateway: "momo",
					error: `Giao dịch qua Ví MoMo không thành công (Mã kết quả: ${resultCode}).`,
				});
			}
		}

		return NextResponse.json(
			{ success: false, error: "Không xác định được cổng thanh toán để xác thực" },
			{ status: 400 },
		);
	} catch (error: unknown) {
		console.error("Payment verification API error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Lỗi xác thực thanh toán",
			},
			{ status: 500 },
		);
	}
}
