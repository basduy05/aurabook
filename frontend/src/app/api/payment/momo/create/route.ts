import { NextResponse } from "next/server";
import crypto from "crypto";
import { convertToVnd } from "@/checkout/lib/utils/currency-converter";

export async function POST(request: Request) {
	try {
		interface MoMoRequestBody {
			amount?: number | string;
			currency?: string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as MoMoRequestBody;
		const { amount, currency = "VND", orderId, orderInfo = "Thanh toán đơn hàng AuraBook" } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const partnerCode = process.env.MOMO_PARTNER_CODE ?? "";
		const accessKey = process.env.MOMO_ACCESS_KEY ?? "";
		const secretKey = process.env.MOMO_SECRET_KEY ?? "";
		const endpoint = process.env.MOMO_ENDPOINT ?? "https://test-payment.momo.vn/v2/gateway/api/create";
		const redirectUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/checkout?checkout=${encodeURIComponent(orderId)}&gateway=momo`;
		const ipnUrl = process.env.MOMO_IPN_URL ?? `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/api/payment/momo/callback`;

		// Convert foreign currencies (e.g. USD) to VND, or keep as-is if already VND
		const rawAmount = Number(amount);
		const momoAmount = convertToVnd(rawAmount, currency);
		const momoOrderId = `${partnerCode}-${Date.now()}-${String(orderId).slice(-6)}`;
		const requestId = momoOrderId;
		const requestType = "payWithMethod";
		const extraData = "";
		const autoCapture = true;
		const lang = "vi";

		// Build raw signature string per MoMo v2 spec
		const rawSignature = [
			`accessKey=${accessKey}`,
			`amount=${momoAmount}`,
			`extraData=${extraData}`,
			`ipnUrl=${ipnUrl}`,
			`orderId=${momoOrderId}`,
			`orderInfo=${orderInfo}`,
			`partnerCode=${partnerCode}`,
			`redirectUrl=${redirectUrl}`,
			`requestId=${requestId}`,
			`requestType=${requestType}`,
		].join("&");

		const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

		const momoBody = {
			partnerCode,
			accessKey,
			requestId,
			amount: momoAmount,
			orderId: momoOrderId,
			orderInfo,
			redirectUrl,
			ipnUrl,
			extraData,
			requestType,
			signature,
			lang,
			autoCapture,
		};

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(momoBody),
		});

		const data = (await response.json()) as { resultCode?: number; message?: string; payUrl?: string };

		// resultCode 0 = success
		if (data.resultCode === 0 && data.payUrl) {
			return NextResponse.json({
				success: true,
				gateway: "momo",
				paymentUrl: data.payUrl,
				redirectUrl: data.payUrl,
				orderId: momoOrderId,
				amount: momoAmount,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: data.message ?? `Không thể khởi tạo giao dịch MoMo (Mã lỗi: ${data.resultCode ?? "unknown"}). Vui lòng kiểm tra lại cấu hình tài khoản đối tác MoMo.`,
				resultCode: data.resultCode,
			},
			{ status: 400 },
		);
	} catch (error: unknown) {
		console.error("MoMo payment creation error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
