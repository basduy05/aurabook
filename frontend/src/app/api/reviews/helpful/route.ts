import { NextResponse } from "next/server";
import { markReviewHelpful } from "@/lib/reviews/storage";

export async function POST(request: Request) {
	try {
		const { reviewId } = (await request.json()) as { reviewId: string };
		if (!reviewId) {
			return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
		}
		const ok = markReviewHelpful(reviewId);
		return NextResponse.json({ ok });
	} catch {
		return NextResponse.json({ error: "Error updating helpful count" }, { status: 500 });
	}
}
