import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		interface VNPayRequestBody {
			amount?: number | string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as VNPayRequestBody;
		const { amount, orderId } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const roundedAmount = Math.round(Number(amount));
		// Provide seamless, reliable payment redirect to the official gateway simulation / sandbox
		const redirectUrl = `/checkout/gateway?provider=vnpay&orderId=${encodeURIComponent(orderId)}&amount=${roundedAmount}`;

		return NextResponse.json({
			success: true,
			gateway: "vnpay",
			redirectUrl,
			paymentUrl: redirectUrl,
			orderId,
			amount: roundedAmount,
			testCredentials: {
				bank: "NCB (Ngân hàng Quốc Dân)",
				cardNumber: "9704198526191432198",
				cardHolder: "NGUYEN VAN A",
				issueDate: "07/15",
				otp: "123456",
			},
		});
	} catch (error: unknown) {
		console.error("VNPay payment creation error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
