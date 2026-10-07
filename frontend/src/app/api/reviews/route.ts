import { NextResponse } from "next/server";
import { getProductReviews, addReview } from "@/lib/reviews/storage";
import { type CreateReviewInput } from "@/lib/reviews/types";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const productSlug = searchParams.get("productSlug");

	if (!productSlug) {
		return NextResponse.json({ error: "Missing productSlug parameter" }, { status: 400 });
	}

	const data = getProductReviews(productSlug);
	return NextResponse.json(data);
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as CreateReviewInput;

		if (!body.productSlug || !body.authorName || !body.content || !body.rating) {
			return NextResponse.json(
				{ error: "Vui lòng điền đầy đủ họ tên, số sao và nội dung đánh giá." },
				{ status: 400 },
			);
		}

		if (body.rating < 1 || body.rating > 5) {
			return NextResponse.json(
				{ error: "Số sao đánh giá phải từ 1 đến 5 sao." },
				{ status: 400 },
			);
		}

		const result = addReview(body);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		console.error("[api/reviews] Error creating review:", error);
		return NextResponse.json({ error: "Lỗi hệ thống khi gửi đánh giá." }, { status: 500 });
	}
}
