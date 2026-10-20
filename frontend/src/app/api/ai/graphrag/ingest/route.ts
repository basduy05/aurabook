import { NextResponse } from "next/server";
import { parseEPUBBuffer, ingestEPUBFileFromDisk } from "@/lib/graphrag/epub-processor";
import { graphRAGStore } from "@/lib/graphrag/graph-store";

export async function POST(req: Request) {
	try {
		const contentType = req.headers.get("content-type") || "";

		// 1. Xử lý Upload file EPUB qua Multipart Form Data
		if (contentType.includes("multipart/form-data")) {
			const formData = await req.formData();
			const file = formData.get("file") as File | null;

			if (!file) {
				return NextResponse.json({ error: "Vui lòng chọn tệp .epub để tải lên" }, { status: 400 });
			}

			const filename = file.name;
			if (!filename.toLowerCase().endsWith(".epub")) {
				return NextResponse.json({ error: "Định dạng không hợp lệ. Chỉ chấp nhận tệp .epub" }, { status: 400 });
			}

			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			const startTime = Date.now();
			// Phân tích và nạp vào GraphRAG
			const meta = await parseEPUBBuffer(buffer, filename);
			const result = graphRAGStore.upsertBookFromEPUB(meta);
			const elapsedMs = Date.now() - startTime;

			return NextResponse.json({
				success: true,
				message: `Số hóa thành công ấn phẩm "${meta.title}" vào GraphRAG!`,
				book: {
					title: meta.title,
					author: meta.author,
					publisher: meta.publisher,
					publishYear: meta.publishYear,
					ebookPrice: meta.ebookPrice,
					physicalPrice: meta.physicalPrice,
					coverImage: meta.coverImage,
					isbn: meta.isbn,
					description: meta.description,
				},
				totalChapters: meta.chapters.length,
				totalChunks: result.createdChunksCount,
				elapsedMs,
				metadata: {
					title: meta.title,
					author: meta.author,
					publisher: meta.publisher,
					publishYear: meta.publishYear,
					ebookPrice: meta.ebookPrice,
					physicalPrice: meta.physicalPrice,
					chapterCount: meta.chapters.length,
					description: meta.description ? meta.description.slice(0, 200) + "..." : "",
				},
				graphStats: {
					totalNodes: result.createdNodesCount,
					totalEdges: result.createdEdgesCount,
					createdChunks: result.createdChunksCount,
				},
			});
		}

		// 2. Xử lý nạp từ đường dẫn có sẵn (JSON Body)
		const body = (await req.json()) as any;
		if (body.filePath) {
			const res = await ingestEPUBFileFromDisk(body.filePath);
			return NextResponse.json(res);
		}

		// 3. Nạp thủ công từ metadata form
		if (body.metadata) {
			const result = graphRAGStore.upsertBookFromEPUB(body.metadata);
			return NextResponse.json({
				success: true,
				message: `Đã lưu ấn phẩm "${body.metadata.title}" vào GraphRAG!`,
				result,
			});
		}

		return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
	} catch (error: any) {
		console.error("[GraphRAG Ingest API Error]:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi xử lý file EPUB và nạp GraphRAG" },
			{ status: 500 },
		);
	}
}
