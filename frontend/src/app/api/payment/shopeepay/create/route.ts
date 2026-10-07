import { NextResponse } from "next/server";
import crypto from "crypto";

// ShopeePay (AirPay) Open API - Staging/Sandbox environment
// Docs: https://open.staging.airpay.com.vn/open/merchant/v3
// Note: ShopeePay does not provide fully open sandbox for all merchants by default.
// This uses the staging environment with publicly documented test credentials.
const SHOPEEPAY_STAGING_HOST = "https://open.staging.airpay.com.vn";
const SHOPEEPAY_CREATE_ORDER_PATH = "/open/merchant/v3/order/create";

export async function POST(request: Request) {
	try {
		interface ShopeePayRequestBody {
			amount?: number | string;
			orderId?: string;
			orderInfo?: string;
		}
		const body = (await request.json()) as ShopeePayRequestBody;
		const { amount, orderId, orderInfo = "Thanh toán Aurabook" } = body;

		if (!amount || !orderId) {
			return NextResponse.json({ success: false, error: "Missing amount or orderId" }, { status: 400 });
		}

		const shopeeAmount = Math.round(Number(amount));
		// ShopeePay requires amount in cents (VND * 100)
		const shopeeAmountCents = shopeeAmount * 100;

		const clientId = process.env.SHOPEEPAY_CLIENT_ID ?? "";
		const secretKey = process.env.SHOPEEPAY_SECRET_KEY ?? "";
		const returnUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/checkout/payment-result?gateway=shopeepay`;

		// If no ShopeePay credentials configured, return the merchant portal link for testing
		if (!clientId || !secretKey) {
			// Fallback: open the ShopeePay demo/staging portal for manual testing
			const demoUrl = `https://open.staging.airpay.com.vn/`;
			return NextResponse.json({
				success: true,
				gateway: "shopeepay",
				paymentUrl: demoUrl,
				redirectUrl: demoUrl,
				orderId,
				amount: shopeeAmount,
				note: "ShopeePay sandbox requires merchant credentials. Redirecting to staging portal.",
			});
		}

		const timestamp = Math.floor(Date.now() / 1000);
		const referenceId = `aurabook_${Date.now()}_${String(orderId).slice(-6)}`;

		const requestBody = {
			reference_id: referenceId,
			amount: shopeeAmountCents,
			currency: "VND",
			merchant_ext_id: clientId,
			description: orderInfo,
			expired_time: timestamp + 900, // 15 minutes
			redirect_url: returnUrl,
		};

		const bodyStr = JSON.stringify(requestBody);
		const sigContent = `${SHOPEEPAY_CREATE_ORDER_PATH}|${bodyStr}`;
		const signature = crypto.createHmac("sha256", secretKey).update(sigContent).digest("hex");

		const response = await fetch(`${SHOPEEPAY_STAGING_HOST}${SHOPEEPAY_CREATE_ORDER_PATH}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Airpay-Clientid": clientId,
				"X-Airpay-Req-H": signature,
				"X-Airpay-Ts": String(timestamp),
			},
			body: bodyStr,
		});

		const data = (await response.json()) as { errcode?: number; errmsg?: string; checkout_url?: string };

		if (data.errcode !== 0) {
			return NextResponse.json(
				{ success: false, error: data.errmsg ?? "ShopeePay order creation failed", errcode: data.errcode },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			gateway: "shopeepay",
			paymentUrl: data.checkout_url,
			redirectUrl: data.checkout_url,
			orderId: referenceId,
			amount: shopeeAmount,
		});
	} catch (error: unknown) {
		console.error("ShopeePay payment error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
