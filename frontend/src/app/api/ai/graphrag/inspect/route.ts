import { NextResponse } from "next/server";
import { graphRAGStore } from "@/lib/graphrag/graph-store";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const type = searchParams.get("type") || "overview";
		const bookSlug = searchParams.get("bookSlug") || "";
		const search = searchParams.get("search") || "";
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const offset = parseInt(searchParams.get("offset") || "0", 10);
		const chapterIndex = parseInt(searchParams.get("chapterIndex") || "1", 10);
		const nodeType = searchParams.get("nodeType") || "";
		const edgeType = searchParams.get("edgeType") || "";

		if (type === "chapters") {
			if (!bookSlug) {
				return NextResponse.json({ error: "Thiếu bookSlug" }, { status: 400 });
			}
			const chapters = graphRAGStore.getChapters(bookSlug);
			return NextResponse.json({ success: true, bookSlug, total: chapters.length, chapters });
		}

		if (type === "chapter_detail") {
			if (!bookSlug) {
				return NextResponse.json({ error: "Thiếu bookSlug" }, { status: 400 });
			}
			const nodes = graphRAGStore.getNodes();
			const chapNode = nodes.find(
				(n) => n.type === "chapter" && n.properties?.bookSlug === bookSlug && n.properties?.chapterIndex === chapterIndex,
			);
			const chunks = graphRAGStore.getChunks({ bookSlug }).chunks.filter((c) => c.chapterIndex === chapterIndex);
			const fullContentFromChunks = chunks.map((c) => c.content).join("\n\n");

			return NextResponse.json({
				success: true,
				bookSlug,
				chapterIndex,
				chapter: chapNode
					? {
							id: chapNode.id,
							title: chapNode.label,
							wordCount: chapNode.properties?.wordCount || 0,
							charCount: chapNode.properties?.charCount || 0,
							preview: chapNode.properties?.preview || "",
							fullContent: fullContentFromChunks || chapNode.properties?.preview || "",
					  }
					: null,
				chunks,
			});
		}

		if (type === "chunks") {
			const result = graphRAGStore.getChunks({ bookSlug: bookSlug || undefined, search: search || undefined, limit, offset });
			return NextResponse.json({ success: true, ...result });
		}

		if (type === "nodes") {
			let nodes = graphRAGStore.getNodes();
			if (nodeType) {
				nodes = nodes.filter((n) => n.type === nodeType);
			}
			return NextResponse.json({
				success: true,
				total: nodes.length,
				nodes: nodes.slice(offset, offset + limit).map((n) => ({
					id: n.id,
					type: n.type,
					label: n.label,
					properties: n.properties,
				})),
			});
		}

		if (type === "edges") {
			let edges = graphRAGStore.getEdges();
			if (edgeType) {
				edges = edges.filter((e) => e.type === edgeType);
			}
			return NextResponse.json({
				success: true,
				total: edges.length,
				edges: edges.slice(offset, offset + limit),
			});
		}

		if (type === "raw") {
			const rawData = graphRAGStore.getRawData();
			return NextResponse.json({ success: true, ...rawData });
		}

		// Overview
		const stats = graphRAGStore.getStats();
		const raw = graphRAGStore.getRawData();
		return NextResponse.json({
			success: true,
			stats,
			raw,
		});
	} catch (error: any) {
		console.error("[GraphRAG Inspect Error]:", error);
		return NextResponse.json({ error: error?.message || "Lỗi truy xuất dữ liệu GraphRAG" }, { status: 500 });
	}
}
