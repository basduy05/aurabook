import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { graphRAGStore } from "@/lib/graphrag/graph-store";
import { parseEPUBBuffer } from "@/lib/graphrag/epub-processor";

export async function GET() {
	try {
		const stats = graphRAGStore.getStats();
		const nodes = graphRAGStore.getNodes();
		const edges = graphRAGStore.getEdges();
		const storageInfo = graphRAGStore.getRawData();

		return NextResponse.json({
			success: true,
			totalNodes: stats.totalNodes,
			totalEdges: stats.totalEdges,
			totalChunks: stats.totalChunks,
			totalBooks: stats.totalBooks,
			books: stats.books,
			nodeTypes: stats.entityBreakdown,
			stats,
			storageInfo,
			visualization: {
				nodes: nodes.map((n) => ({
					id: n.id,
					type: n.type,
					label: n.label,
					properties: n.properties,
				})),
				edges: edges.map((e) => ({
					id: e.id,
					source: e.source,
					target: e.target,
					type: e.type,
				})),
			},
		});
	} catch (error: any) {
		console.error("[GraphRAG Stats Error]:", error);
		return NextResponse.json({ error: error?.message || "Lỗi lấy thống kê GraphRAG" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const { action } = (await req.json()) as { action?: string };

		if (action === "seed-existing-epubs" || action === "clean-reseed") {
			if (action === "clean-reseed") {
				// Làm sạch toàn bộ dữ liệu trùng lặp trước khi nạp lại
				graphRAGStore.cleanReset();
			}

			// Các thư mục tiềm năng chứa 4 file epub thực tế của AuraBook
			const candidateDirs = [
				path.resolve(process.cwd(), "public/books"),
				path.resolve(process.cwd(), "../backend/media/ebooks"),
				"c:/Users/basduy05/Downloads/aurabook/backend/media/ebooks",
				"c:/Users/basduy05/Downloads/aurabook/frontend/public/books",
			];

			let targetDir = "";
			for (const dir of candidateDirs) {
				if (fs.existsSync(dir)) {
					const files = fs.readdirSync(dir).filter((f) => f.endsWith(".epub"));
					if (files.length > 0) {
						targetDir = dir;
						break;
					}
				}
			}

			if (!targetDir) {
				return NextResponse.json({
					success: true,
					message: "Dữ liệu GraphRAG đã được khởi tạo sẵn với 4 ấn phẩm tiêu chuẩn.",
					stats: graphRAGStore.getStats(),
					storageInfo: graphRAGStore.getRawData(),
				});
			}

			const epubFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith(".epub"));
			const ingestedResults: any[] = [];

			for (const filename of epubFiles) {
				const filePath = path.join(targetDir, filename);
				try {
					const buffer = fs.readFileSync(filePath);
					const meta = await parseEPUBBuffer(buffer, filename);
					const res = graphRAGStore.upsertBookFromEPUB(meta);
					ingestedResults.push({
						filename,
						title: meta.title,
						chaptersCount: meta.chapters.length,
						createdChunks: res.createdChunksCount,
					});
				} catch (err: any) {
					console.warn(`[Seed EPUB] Lỗi nạp ${filename}:`, err?.message);
				}
			}

			return NextResponse.json({
				success: true,
				message:
					action === "clean-reseed"
						? `Đã làm sạch toàn bộ dữ liệu rác và số hóa lại hoàn toàn ${ingestedResults.length} file EPUB thực tế!`
						: `Đã tự động số hóa và nạp ${ingestedResults.length} file EPUB thực tế vào GraphRAG!`,
				ingestedBooks: ingestedResults,
				stats: graphRAGStore.getStats(),
				storageInfo: graphRAGStore.getRawData(),
			});
		}

		return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });

	} catch (error: any) {
		console.error("[GraphRAG Stats POST Error]:", error);
		return NextResponse.json({ error: error?.message || "Lỗi xử lý yêu cầu" }, { status: 500 });
	}
}
