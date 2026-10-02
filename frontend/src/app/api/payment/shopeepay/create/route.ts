import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		interface ShopeePayRequestBody {
			amount?: number | string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as ShopeePayRequestBody;
		const { amount, orderId } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const roundedAmount = Math.round(Number(amount));
		const redirectUrl = `/checkout/gateway?provider=shopeepay&orderId=${encodeURIComponent(orderId)}&amount=${roundedAmount}`;

		return NextResponse.json({
			success: true,
			gateway: "shopeepay",
			redirectUrl,
			orderId,
			amount: roundedAmount,
		});
	} catch (error: unknown) {
		console.error("ShopeePay payment error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
