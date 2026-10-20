import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { query?: string; limit?: number };
		const { query = "", limit = 12 } = body;

		if (!query || typeof query !== "string") {
			return NextResponse.json({ total: 0, results: [] });
		}

		// Query aurabook_apps.ai_search on Saleor Backend
		try {
			const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/aurabook/search/hybrid`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query, limit }),
				signal: AbortSignal.timeout(6000),
			});

			if (backendRes.ok) {
				const data = (await backendRes.json()) as {
					query?: string;
					total?: number;
					results?: unknown[];
				};
				return NextResponse.json({
					source: "ai_hybrid_rrf",
					query: data.query,
					total: data.total,
					results: data.results || [],
				});
			}
		} catch (beErr) {
			console.warn("[api/search/ai] Backend hybrid search unreachable:", beErr);
		}

		return NextResponse.json({
			source: "fallback",
			query,
			total: 0,
			results: [],
		});
	} catch (error) {
		console.error("[api/search/ai] Internal error:", error);
		return NextResponse.json({ total: 0, results: [] }, { status: 200 });
	}
}
