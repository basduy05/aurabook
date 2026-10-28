import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const REVIEWS_FILE = path.resolve(process.cwd(), "data/reviews.json");

function readReviews(): any[] {
	try {
		if (fs.existsSync(REVIEWS_FILE)) {
			return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf-8"));
		}
	} catch (e) {
		console.error("[Admin Reviews] Error reading reviews:", e);
	}
	return [];
}

function writeReviews(reviews: any[]) {
	fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

export async function GET() {
	const reviews = readReviews();
	return NextResponse.json({
		success: true,
		total: reviews.length,
		reviews,
	});
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			action: "toggle_status" | "delete" | "toggle_verified";
			reviewId: string;
			isHidden?: boolean;
		};

		const reviews = readReviews();
		const idx = reviews.findIndex((r) => r.id === body.reviewId);

		if (idx === -1) {
			return NextResponse.json({ success: false, error: "Không tìm thấy đánh giá" }, { status: 404 });
		}

		if (body.action === "delete") {
			reviews.splice(idx, 1);
			writeReviews(reviews);
			return NextResponse.json({ success: true, message: "Đã xóa đánh giá thành công" });
		}

		if (body.action === "toggle_status") {
			reviews[idx].isHidden = body.isHidden ?? !reviews[idx].isHidden;
			writeReviews(reviews);
			return NextResponse.json({
				success: true,
				review: reviews[idx],
				message: reviews[idx].isHidden ? "Đã ẩn đánh giá" : "Đã duyệt hiển thị đánh giá",
			});
		}

		if (body.action === "toggle_verified") {
			reviews[idx].isVerified = !reviews[idx].isVerified;
			writeReviews(reviews);
			return NextResponse.json({
				success: true,
				review: reviews[idx],
				message: "Đã cập nhật trạng thái xác thực người mua",
			});
		}

		return NextResponse.json({ success: false, error: "Hành động không hợp lệ" }, { status: 400 });
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || "Lỗi xử lý đánh giá" }, { status: 500 });
	}
}
