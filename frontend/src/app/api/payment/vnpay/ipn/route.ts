import { NextResponse } from "next/server";
import crypto from "crypto";

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

/**
 * Process VNPAY IPN webhook (Server-to-Server).
 * VNPAY sends HTTP GET request with query params to update payment status.
 */
async function processVnPayIpn(params: Record<string, string>) {
	const secretKey = process.env.VNPAY_HASH_SECRET?.trim();
	if (!secretKey) {
		console.error("[VNPAY IPN] Missing VNPAY_HASH_SECRET environment variable");
		return NextResponse.json({ RspCode: "99", Message: "Merchant configuration error" });
	}

	const secureHash = params.vnp_SecureHash;
	if (!secureHash) {
		console.warn("[VNPAY IPN] Missing vnp_SecureHash in request");
		return NextResponse.json({ RspCode: "97", Message: "Checksum failed" });
	}

	// Filter and sort all vnp_* parameters except signature fields
	const signParams: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		if (key.startsWith("vnp_") && key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
			signParams[key] = value;
		}
	}

	const sortedParams = sortObject(signParams);
	const signData = Object.keys(sortedParams)
		.map((key) => `${key}=${sortedParams[key]}`)
		.join("&");

	const calculatedHash = crypto
		.createHmac("sha512", secretKey)
		.update(Buffer.from(signData, "utf-8"))
		.digest("hex");

	if (calculatedHash.toLowerCase() !== secureHash.toLowerCase()) {
		console.warn(
			`[VNPAY IPN] Checksum mismatch. Expected: ${calculatedHash}, Received: ${secureHash}`,
		);
		return NextResponse.json({ RspCode: "97", Message: "Checksum failed" });
	}

	const txnRef = params.vnp_TxnRef ?? "unknown";
	const responseCode = params.vnp_ResponseCode;
	const transactionStatus = params.vnp_TransactionStatus;
	const amount = params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0;
	const bankCode = params.vnp_BankCode ?? "";
	const transactionNo = params.vnp_TransactionNo ?? "";

	if (responseCode === "00" && (!transactionStatus || transactionStatus === "00")) {
		console.info(
			`[VNPAY IPN] Payment Success: TxnRef=${txnRef}, Amount=${amount} VND, Bank=${bankCode}, VNPAY_TxnNo=${transactionNo}`,
		);
		// Return 00 to acknowledge success
		return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
	} else {
		console.warn(
			`[VNPAY IPN] Payment Failed/Cancelled: TxnRef=${txnRef}, ResponseCode=${responseCode}, TransactionStatus=${transactionStatus}`,
		);
		// Return 00 to acknowledge notification was received so VNPAY stops retrying
		return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const params: Record<string, string> = {};
		searchParams.forEach((val, key) => {
			params[key] = val;
		});

		return await processVnPayIpn(params);
	} catch (error: unknown) {
		console.error("[VNPAY IPN] Error handling GET request:", error);
		return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
	}
}

export async function POST(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const params: Record<string, string> = {};
		searchParams.forEach((val, key) => {
			params[key] = val;
		});

		// Check if body contains params
		try {
			const contentType = request.headers.get("content-type") || "";
			if (contentType.includes("application/json")) {
				const body = (await request.json()) as Record<string, string>;
				Object.assign(params, body);
			} else if (contentType.includes("application/x-www-form-urlencoded")) {
				const formData = await request.formData();
				formData.forEach((val, key) => {
					if (typeof val === "string") {
						params[key] = val;
					}
				});
			}
		} catch {
			// fallback to searchParams
		}

		return await processVnPayIpn(params);
	} catch (error: unknown) {
		console.error("[VNPAY IPN] Error handling POST request:", error);
		return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
	}
}
