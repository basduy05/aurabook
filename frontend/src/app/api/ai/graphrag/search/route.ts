import { NextResponse } from "next/server";
import { graphRAGStore } from "@/lib/graphrag/graph-store";
import { searchProducts } from "@/lib/search";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query") || searchParams.get("q") || "";
		const channel = searchParams.get("channel") || "channel-vnd";
		const locale = searchParams.get("locale") || "vi";

		if (!query || query.trim().length === 0) {
			return NextResponse.json({
				products: [],
				isGraphRAG: false,
				totalCount: 0,
				matchedConcepts: [],
				reasoningSummary: "",
			});
		}

		// 1. Thử tìm kiếm thông thường (Saleor keyword search) trước
		let regularProducts: any[] = [];
		try {
			const res = await searchProducts({
				query: query.trim(),
				channel,
				locale,
				limit: 10,
			});
			if (res.products && res.products.length > 0) {
				regularProducts = res.products;
			}
		} catch (e) {
			console.warn("[GraphRAG Search API] Saleor search warning:", e);
		}

		if (regularProducts.length > 0) {
			return NextResponse.json({
				products: regularProducts,
				isGraphRAG: false,
				totalCount: regularProducts.length,
				matchedConcepts: [],
				reasoningSummary: `Tìm thấy ${regularProducts.length} kết quả khớp từ khóa trong kho hàng.`,
			});
		}

		// 2. Nếu không tìm thấy kết quả từ khóa -> CHUYỂN NGAY LẬP TỨC SANG GRAPHRAG THEO NGỮ CẢNH
		const ragResult = graphRAGStore.searchProductsByContext(query.trim(), {
			channel,
			locale,
			limit: 10,
		});

		return NextResponse.json({
			products: ragResult.products,
			isGraphRAG: true,
			totalCount: ragResult.totalCount,
			matchedConcepts: ragResult.matchedConcepts,
			reasoningSummary: ragResult.reasoningSummary,
			queryInterpretation: ragResult.queryInterpretation,
			recommendations: ragResult.recommendations,
		});
	} catch (error) {
		console.error("[GraphRAG Search Route Error]:", error);
		return NextResponse.json({ error: "Lỗi tìm kiếm ngữ cảnh GraphRAG" }, { status: 500 });
	}
}
