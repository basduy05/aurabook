import { NextResponse } from "next/server";
import { graphRAGStore } from "@/lib/graphrag/graph-store";

export async function POST(req: Request) {
	try {
		const { query, bookSlug, action } = (await req.json()) as {
			query?: string;
			bookSlug?: string;
			action?: "like" | "dislike";
		};

		if (!query || !bookSlug || (action !== "like" && action !== "dislike")) {
			return NextResponse.json(
				{ error: "Tham số không hợp lệ. Cần có query, bookSlug và action ('like' | 'dislike')" },
				{ status: 400 },
			);
		}

		const result = graphRAGStore.recordFeedback(query, bookSlug, action);

		return NextResponse.json(result);
	} catch (error: any) {
		console.error("[GraphRAG Feedback API Error]:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi ghi nhận phản hồi GraphRAG" },
			{ status: 500 },
		);
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const bookSlug = searchParams.get("bookSlug");
		const query = searchParams.get("query") || undefined;

		if (!bookSlug) {
			return NextResponse.json({ error: "Cần cung cấp bookSlug" }, { status: 400 });
		}

		const stats = graphRAGStore.getBookFeedbackStats(bookSlug, query);
		return NextResponse.json({ success: true, bookSlug, ...stats });
	} catch (error: any) {
		console.error("[GraphRAG Feedback Stats Error]:", error);
		return NextResponse.json({ error: error?.message || "Lỗi truy vấn thống kê" }, { status: 500 });
	}
}
