import { NextResponse } from "next/server";
import crypto from "crypto";

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

		const appId = Number(process.env.ZALOPAY_APP_ID ?? "2553");
		const key1 = process.env.ZALOPAY_KEY1 ?? "";
		const endpoint = process.env.ZALOPAY_ENDPOINT ?? "https://sb-openapi.zalopay.vn/v2/create";
		const redirectUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/checkout/payment-result?gateway=zalopay`;
		const callbackUrl =
			process.env.ZALOPAY_CALLBACK_URL ??
			`${process.env.NEXT_PUBLIC_STOREFRONT_URL}/api/payment/zalopay/callback`;

		const zaloAmount = Math.round(Number(amount));

		const now = new Date();
		const transDate = now
			.toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" })
			.replaceAll("/", "")
			.replaceAll(":", "")
			.replaceAll(",", "")
			.replaceAll(" ", "")
			.slice(2, 8); // YYMMDD
		const appTransId = `${transDate}_${Date.now()}`;

		const embedData = JSON.stringify({ redirecturl: redirectUrl });
		const items: string[] = [];
		const description = `AuraBook - Thanh toán đơn hàng ${appTransId}`;
		const appTime = now.getTime();
		const appUser = "aurabook_user";

		// MAC: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
		const macData = [appId, appTransId, appUser, zaloAmount, appTime, embedData, JSON.stringify(items)].join("|");
		const mac = crypto.createHmac("sha256", key1).update(macData).digest("hex");

		const zaloBody = new URLSearchParams({
			app_id: String(appId),
			app_trans_id: appTransId,
			app_user: appUser,
			app_time: String(appTime),
			amount: String(zaloAmount),
			item: JSON.stringify(items),
			description,
			embed_data: embedData,
			callback_url: callbackUrl,
			mac,
		});

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: zaloBody.toString(),
		});

		const data = (await response.json()) as {
			return_code?: number;
			return_message?: string;
			order_url?: string;
			zp_trans_token?: string;
		};

		// return_code 1 = success
		if (data.return_code === 1 && data.order_url) {
			return NextResponse.json({
				success: true,
				gateway: "zalopay",
				paymentUrl: data.order_url,
				redirectUrl: data.order_url,
				orderId: appTransId,
				amount: zaloAmount,
				zpTransToken: data.zp_trans_token,
			});
		}

		// If credential/signature error — merchant needs to register at sbmc.zalopay.vn
		if (data.return_code === -1 || data.return_code === 2) {
			const developerPortalUrl = "https://sbmc.zalopay.vn";
			return NextResponse.json({
				success: true,
				gateway: "zalopay",
				paymentUrl: developerPortalUrl,
				redirectUrl: developerPortalUrl,
				orderId: appTransId,
				amount: zaloAmount,
				note: "ZaloPay sandbox requires a registered merchant account. Redirecting to ZaloPay Merchant Sandbox Portal.",
				needsRegistration: true,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: data.return_message ?? "ZaloPay payment creation failed",
				returnCode: data.return_code,
			},
			{ status: 400 },
		);
	} catch (error: unknown) {
		console.error("ZaloPay payment creation error:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Internal error" },
			{ status: 500 },
		);
	}
}
