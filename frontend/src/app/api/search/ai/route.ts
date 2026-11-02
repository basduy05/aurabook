import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			query?: string;
			limit?: number;
			alpha?: number;
		};
		const { query = "", limit = 12, alpha = 0.5 } = body;

		if (!query || typeof query !== "string" || !query.trim()) {
			return NextResponse.json({
				source: "empty_query",
				query: "",
				total: 0,
				results: [],
			});
		}

		const cleanQuery = query.trim().slice(0, 500);
		const safeLimit =
			typeof limit === "number" && Number.isFinite(limit)
				? Math.max(1, Math.min(50, Math.floor(limit)))
				: 12;
		const safeAlpha =
			typeof alpha === "number" && Number.isFinite(alpha)
				? Math.max(0.0, Math.min(1.0, alpha))
				: 0.5;

		// Query aurabook_apps.ai_search on Saleor Backend
		try {
			const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/aurabook/search/hybrid`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query: cleanQuery, limit: safeLimit, alpha: safeAlpha }),
				signal: AbortSignal.timeout(6000),
			});

			if (backendRes.ok) {
				const data = (await backendRes.json()) as {
					query?: string;
					total?: number;
					results?: Array<{
						product_id: string;
						product_slug: string;
						title: string;
						score: number;
						chunk_text: string;
						chunk_index?: number;
					}>;
				};
				return NextResponse.json({
					source: "ai_hybrid_rrf",
					query: data.query || cleanQuery,
					total: typeof data.total === "number" ? data.total : (data.results || []).length,
					results: data.results || [],
				});
			}
		} catch (beErr) {
			console.warn("[api/search/ai] Backend hybrid search unreachable:", beErr);
		}

		return NextResponse.json({
			source: "fallback",
			query: cleanQuery,
			total: 0,
			results: [],
		});
	} catch (error) {
		console.error("[api/search/ai] Internal error:", error);
		return NextResponse.json({ source: "error", total: 0, results: [] }, { status: 200 });
	}
}
