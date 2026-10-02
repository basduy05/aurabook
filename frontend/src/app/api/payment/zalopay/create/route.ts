import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		interface ZaloPayRequestBody {
			amount?: number | string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as ZaloPayRequestBody;
		const { amount, orderId } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const roundedAmount = Math.round(Number(amount));
		const redirectUrl = `/checkout/gateway?provider=zalopay&orderId=${encodeURIComponent(orderId)}&amount=${roundedAmount}`;

		return NextResponse.json({
			success: true,
			gateway: "zalopay",
			redirectUrl,
			orderUrl: redirectUrl,
			orderId,
			amount: roundedAmount,
			testCredentials: {
				appId: "2553",
				account: "Tài khoản ZaloPay Sandbox",
				note: "Quét mã QR hoặc đăng nhập tài khoản ZaloPay Sandbox để xác nhận",
			},
		});
	} catch (error: unknown) {
		console.error("ZaloPay payment creation error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
