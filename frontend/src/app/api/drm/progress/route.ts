import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const productId = searchParams.get("productId") || searchParams.get("slug") || "default";
		const userEmail = searchParams.get("userEmail") || "";

		if (!userEmail) {
			return NextResponse.json({ currentPage: 1, completionPercent: 0 }, { status: 200 });
		}

		const backendRes = await fetch(
			`${BACKEND_INTERNAL_URL}/aurabook/drm/progress/${encodeURIComponent(productId)}?user_email=${encodeURIComponent(userEmail)}`,
			{ cache: "no-store" },
		);

		if (backendRes.ok) {
			const data = await backendRes.json();
			return NextResponse.json(data);
		}

		return NextResponse.json({ currentPage: 1, completionPercent: 0 }, { status: 200 });
	} catch (error) {
		console.warn("[api/drm/progress] Backend offline, returning fallback:", error);
		return NextResponse.json({ currentPage: 1, completionPercent: 0 }, { status: 200 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			productId?: string;
			userEmail?: string;
			currentPage?: number;
			totalPages?: number;
			isTrial?: boolean;
		};
		const { productId = "default", userEmail, currentPage = 1, totalPages = 150, isTrial = false } = body;

		if (!userEmail) {
			return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
		}

		// Đọc thử (Trial / Preview) không được cấp quyền lưu vào tủ sách vĩnh viễn của người dùng
		if (isTrial) {
			return NextResponse.json({ success: true, isTrial: true, message: "Bản đọc thử không cấp phát vào tủ sách" });
		}

		const backendRes = await fetch(
			`${BACKEND_INTERNAL_URL}/aurabook/drm/progress/${encodeURIComponent(productId)}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					user_email: userEmail,
					current_page: currentPage,
					total_pages: totalPages,
				}),
			},
		);

		if (backendRes.ok) {
			const data = (await backendRes.json()) as Record<string, unknown>;
			return NextResponse.json({ success: true, ...data });
		}

		return NextResponse.json({ success: true, simulated: true });
	} catch (error) {
		console.warn("[api/drm/progress] Backend offline, simulated save:", error);
		return NextResponse.json({ success: true, simulated: true });
	}
}
