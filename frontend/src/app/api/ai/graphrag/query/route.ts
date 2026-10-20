import { NextResponse } from "next/server";
import { graphRAGStore } from "@/lib/graphrag/graph-store";

export async function POST(req: Request) {
	try {
		const { query, activeSlug, synthesizeWithLLM } = (await req.json()) as {
			query?: string;
			activeSlug?: string;
			synthesizeWithLLM?: boolean;
		};

		if (!query || !query.trim()) {
			return NextResponse.json({ error: "Câu truy vấn không được để trống" }, { status: 400 });
		}

		// 1. Thực hiện truy vấn lai GraphRAG
		const result = graphRAGStore.queryGraphRAG(query.trim(), activeSlug);

		let llmResponse: string | null = null;

		// 2. Tùy chọn gọi LLM tổng hợp câu trả lời
		if (synthesizeWithLLM) {
			try {
				const prompt = `Bạn là Trợ lý Tri thức Sách AuraBook. Hãy dựa vào thông tin trích xuất từ Đồ thị Tri thức (GraphRAG) sau đây để trả lời câu hỏi của khách hàng thật ngắn gọn, ấm áp, chính xác:\n\n${result.contextSummary}\n\nKhách hỏi: "${query}"\nTrả lời:`;
				const ollamaRes = await fetch("http://localhost:11434/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model: "gemma2:2b",
						messages: [{ role: "user", content: prompt }],
						stream: false,
						options: { temperature: 0.3, num_predict: 150 },
					}),
					signal: AbortSignal.timeout(6000),
				});

				if (ollamaRes.ok) {
					const data = (await ollamaRes.json()) as any;
					llmResponse = data.message?.content?.trim() || null;
				}
			} catch (llmErr) {
				console.warn("[GraphRAG Query API] LLM synthesize fallback:", llmErr);
			}
		}

		return NextResponse.json({
			success: true,
			...result,
			llmResponse,
		});
	} catch (error: any) {
		console.error("[GraphRAG Query API Error]:", error);
		return NextResponse.json({ error: error?.message || "Lỗi truy vấn GraphRAG" }, { status: 500 });
	}
}
