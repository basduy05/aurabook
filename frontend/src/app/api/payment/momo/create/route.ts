import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		interface MoMoRequestBody {
			amount?: number | string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as MoMoRequestBody;
		const { amount, orderId } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const roundedAmount = Math.round(Number(amount));
		const redirectUrl = `/checkout/gateway?provider=momo&orderId=${encodeURIComponent(orderId)}&amount=${roundedAmount}`;

		return NextResponse.json({
			success: true,
			gateway: "momo",
			redirectUrl,
			payUrl: redirectUrl,
			orderId,
			amount: roundedAmount,
			testCredentials: {
				phoneNumber: "0968238772",
				otp: "000000",
				app: "MoMo Developer / Test Sandbox",
			},
		});
	} catch (error: unknown) {
		console.error("MoMo payment creation error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
