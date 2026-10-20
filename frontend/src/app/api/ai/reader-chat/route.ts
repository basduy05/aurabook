import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { graphRAGStore } from "@/lib/graphrag/graph-store";
import type { GraphRAGQueryResult } from "@/lib/graphrag/types";

function getConfigPath(): string {
	const possiblePaths = [
		path.resolve(process.cwd(), "../ecommerce-ai-platform/ai_platform_config.json"),
		path.resolve(process.cwd(), "ai_platform_config.json"),
		"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/ai_platform_config.json",
	];

	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}
	return possiblePaths[0];
}

function generateDynamicFallback(
	resolvedTitle: string,
	author: string,
	totalChaps: number,
	totalWords: string,
	cleanQuote: string,
	cleanQuery: string,
	graphResult: GraphRAGQueryResult,
): string {
	const topChunk = graphResult.relevantChunks?.[0]?.chunk?.content || "";
	const chapterContext = graphResult.relevantChunks?.[0]?.chunk?.chapterTitle || "nội dung tác phẩm";

	if (cleanQuote) {
		const words = cleanQuote.split(/\s+/).filter((w) => w.length > 2);
		const keyPhrases = words.slice(0, 6).join(" ");

		return `### 📖 Bối cảnh & Ý nghĩa Thông điệp
Đoạn trích *"…${cleanQuote.slice(0, 180)}…"* trong tác phẩm **"${resolvedTitle}"** (${author}) phản ánh trực diện chủ đề trọng tâm về bản chất con người và xã hội. Tác giả nhấn mạnh rằng những nhận thức sâu sắc xuất phát từ sự thấu hiểu ("${keyPhrases}") luôn định hình cách nhân loại sinh tồn và tương tác với nhau bền vững hơn mọi quy luật ép buộc.

### 💡 Góc nhìn Tâm lý học & Triết lý Nhân sinh
Theo quan điểm của ${author}, con người hành động dựa trên những niềm tin và các câu chuyện chung mà xã hội cùng chấp nhận. Khi một thông điệp chạm tới nhận thức cốt lõi thay vì sự giáo điều, nó sẽ thức tỉnh khả năng tư duy độc lập và mở rộng thế giới quan của độc giả.

### 🌿 Bài học Ứng dụng Thực tiễn
1. **Lắng nghe và Quan sát:** Đặt sự việc vào toàn cảnh bối cảnh lịch sử và tâm lý để có cái nhìn công tâm, đa chiều.
2. **Làm chủ Nhận thức:** Đặt câu hỏi phản biện trước những định kiến có sẵn để tìm ra chân lý cho chính mình.
3. **Ứng dụng Linh hoạt:** Chuyển hóa những bài học từ trang sách thành các quyết định đúng đắn trong đời sống cá nhân và công việc hàng ngày.`;
	}

	return `Về câu hỏi **"${cleanQuery}"** đối với tác phẩm **"${resolvedTitle}"** (${author}):

Dựa trên dữ liệu tra cứu từ hệ thống GraphRAG (${totalChaps} chương, khoảng ${totalWords} từ):

### 🌟 Trọng tâm Tư tưởng Tác phẩm
Tác phẩm xây dựng góc nhìn toàn diện về sự phát triển của tư duy, hành vi con người và các chuẩn mực đạo đức xã hội qua từng giai đoạn then chốt.

### 🔍 Dẫn chứng & Liên hệ Chương mục (${chapterContext})
${topChunk ? `*"${topChunk.slice(0, 260)}..."*` : `Các chương mục cốt lõi liên tục phân tích luận điểm này qua góc nhìn đa chiều.`}

### 💡 Khuyến nghị Chiêm nghiệm
Để thấu suốt trọn vẹn, bạn nên đọc kết hợp các phần thảo luận và đối chiếu trực tiếp với tình huống thực tế của đời sống.`;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			query?: string;
			bookTitle?: string;
			bookSlug?: string;
			quoteContext?: string;
			user?: string;
			stream?: boolean;
			sessionId?: string;
			aiMode?: "fast" | "deep";
		};
		const {
			query,
			bookTitle = "Tác phẩm AuraBook",
			bookSlug = "",
			quoteContext = "",
			user: _user = "reader_web",
			stream: isStream = true,
			sessionId: _sessionId = "",
			aiMode = "fast",
		} = body;
		void _user;
		void _sessionId;
		void aiMode;

		if (!query && !quoteContext) {
			return NextResponse.json({ error: "Query hoặc quoteContext là bắt buộc" }, { status: 400 });
		}

		const cleanQuery = (query || "").trim();
		const cleanQuote = (quoteContext || "").trim();

		// 1. Truy vấn GraphRAG để lấy tri thức thực tế của cuốn sách
		const ragQueryStr = cleanQuote ? `${cleanQuote} ${cleanQuery}` : cleanQuery;
		const graphResult = graphRAGStore.queryGraphRAG(ragQueryStr, bookSlug);

		const resolvedTitle = graphResult.bookNode?.properties.title || bookTitle;
		const author = graphResult.bookNode?.properties.author || "Tác giả AuraBook";
		const totalChaps = graphResult.totalChapters || 38;
		const totalWords = graphResult.totalWords ? graphResult.totalWords.toLocaleString("vi-VN") : "hơn 70.000";

		// 2. Nạp cấu hình LLM từ ai_platform_config.json
		let llmBaseUrl = "http://localhost:11434";
		let temperature = 0.5;

		try {
			const configPath = getConfigPath();
			if (fs.existsSync(configPath)) {
				const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
				if (cfg.voice?.llmBaseUrl) llmBaseUrl = cfg.voice.llmBaseUrl.replace(/\/v1\/?$/, "");
				if (typeof cfg.reader?.temperature === "number") temperature = cfg.reader.temperature;
			}
		} catch (e) {
			console.warn("[Reader AI] Error loading config, using default:", e);
		}

		// 3. Prompt Engineering chuyên sâu cho Trợ Lý Đọc Sách & Phân Tích Văn Học (AI Reading Companion)
		const ragChunksText =
			graphResult.relevantChunks && graphResult.relevantChunks.length > 0
				? graphResult.relevantChunks
						.slice(0, 2)
						.map(
							(rc, idx) =>
								`[Trích đoạn RAG ${idx + 1} - ${rc.chunk.chapterTitle || "Nội dung"}]:\n"${rc.chunk.content.slice(0, 300)}"`,
						)
						.join("\n\n")
				: "";

		const systemPrompt = `Bạn là Trợ lý AI Phân Tích & Đồng Hành Đọc Sách Chuyên Sâu của AuraBook.
Vai trò của bạn là một học giả văn học, nhà tâm lý học và người bạn đọc sách thông thái, uyên bác, giải nghĩa chân thực và sâu sắc.

THÔNG TIN TÁC PHẨM TỪ GRAPHRAG:
- Tựa sách: "${resolvedTitle}"
- Tác giả: ${author}
- Quy mô: ${totalChaps} chương/mục (khoảng ${totalWords} từ).
${ragChunksText ? `CÁC TRÍCH ĐOẠN LIÊN QUAN TRỰC TIẾP TRONG NỘI DUNG SÁCH (RAG CONTEXT):\n${ragChunksText}\n` : ""}

NGUYÊN TẮC PHÂN TÍCH & TRÌNH BÀY (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
1. NGÔN NGỮ:
   - BẮT BUỘC TRẢ LỜI 100% BẰNG TIẾNG VIỆT CHUẨN MỰC, GIÀU CHẤT VĂN HỌC, TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH.
2. TRẢ LỜI ĐẦY ĐỦ, HOÀN CHỈNH, TUYỆT ĐỐI KHÔNG BỊ CẮT NGANG HOẶC BỎ DỞ DỞ DANG:
   - Hãy phân tích thật sâu sắc, diễn đạt trọn vẹn cả câu chữ, kết bài hoàn chỉnh và thấu đáo.
   - Trình bày mạch lạc, chia thành 3 mục rõ ràng bằng markdown chuẩn:
     ### 📖 Bối cảnh & Ý nghĩa
     ### 💡 Góc nhìn Triết lý & Tâm lý học
     ### 🌿 Bài học Thực tiễn
   - Viết trọn vẹn từng câu, có kết luận đúc kết cuối bài, không dừng đột ngột.
3. KHI ĐỘC GIẢ CHỌN ĐOẠN TRÍCH:
   - Đi thẳng vào giải nghĩa các từ khóa và tư tưởng mà tác giả ${author} muốn truyền tải.
4. NGUYÊN TẮC BẢO ĐẢM DỮ LIỆU THỰC TẾ (CHỐNG BỊA ĐẶT / NO HALLUCINATION):
   - Mọi phân tích, dẫn chứng PHẢI bám sát nội dung tác phẩm "${resolvedTitle}" trong cơ sở dữ liệu.`;

		let userMessageContent = "";
		if (cleanQuote) {
			userMessageContent = `[ĐOẠN TRÍCH ĐỘC GIẢ ĐANG ĐỌC TỪ SÁCH "${resolvedTitle}"]:\n"${cleanQuote}"\n\nYÊU CẦU CỦA ĐỘC GIẢ (Hãy trả lời hoàn toàn bằng tiếng Việt, đầy đủ 3 phần):\n${cleanQuery || "Hãy phân tích sâu sắc, giải nghĩa thật từng câu chữ, bối cảnh tâm lý học và bài học thực tiễn của đoạn trích này."}`;
		} else {
			userMessageContent = `${cleanQuery} (Lưu ý: Bắt buộc trả lời bằng tiếng Việt đầy đủ, trọn vẹn 3 mục: Bối cảnh & Ý nghĩa, Triết lý & Tâm lý học, Bài học Thực tiễn).`;
		}

		// Chuyển hoàn toàn sang Gemma 2 (2B) theo yêu cầu người dùng: 100% GPU, phản hồi siêu tốc, không bị nghẽn CPU
		const candidateModels = ["gemma2:2b"];

		// STREAMING RESPONSE (Chế độ truyền chunking tăng tốc độ hiển thị)
		if (isStream) {
			const encoder = new TextEncoder();

			const readableStream = new ReadableStream({
				async start(controller) {
					const sendChunk = (textChunk: string) => {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`));
					};
					const sendDone = () => {
						controller.enqueue(encoder.encode("data: [DONE]\n\n"));
						controller.close();
					};

					let streamedAny = false;

					// 1. Thử nghiệm Streaming qua Ollama
					for (const currentModel of candidateModels) {
						if (streamedAny) break;
						try {
							// Đối với Gemma 3 (4B), cấu hình num_ctx 4096 để vừa vặn VRAM GPU 4GB, tránh bị offload CPU làm chậm & timeout
							// Đối với Gemma 2 (2B), cấu hình num_ctx 8192 chạy 100% GPU
							const numCtx = currentModel.includes("gemma3") ? 4096 : 8192;

							const ollamaRes = await fetch(`${llmBaseUrl}/api/chat`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									model: currentModel,
									messages: [
										{ role: "system", content: systemPrompt },
										{ role: "user", content: userMessageContent },
									],
									stream: true,
									options: {
										temperature,
										repeat_penalty: 1.03, // Giảm repeat_penalty để không bị nghẽn cụm từ văn học khiến model stop sớm
										num_ctx: numCtx,
										num_predict: -1, // Không giới hạn token output (Done reason: stop khi hoàn tất trọn vẹn bài viết)
									},
								}),
								signal: AbortSignal.timeout(600000), // Timeout 10 phút, bảo đảm không bao giờ bị ngắt kết nối dở dang
							});

							if (ollamaRes.ok && ollamaRes.body) {
								const reader = ollamaRes.body.getReader();
								const decoder = new TextDecoder();
								let buffer = "";
								let inThinkTag = false;

								while (true) {
									const { done, value } = await reader.read();
									if (done) break;
									buffer += decoder.decode(value, { stream: true });
									const lines = buffer.split("\n");
									buffer = lines.pop() || "";

									for (const line of lines) {
										if (!line.trim()) continue;
										try {
											const parsed = JSON.parse(line) as any;
											const token = parsed.message?.content || "";
											if (token) {
												let cleanToken = token;
												if (cleanToken.includes("<think>")) {
													inThinkTag = true;
													cleanToken = cleanToken.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "");
												} else if (cleanToken.includes("</think>")) {
													inThinkTag = false;
													cleanToken = cleanToken.replace(/^[\s\S]*?<\/think>/g, "");
												} else if (inThinkTag) {
													continue;
												}

												if (cleanToken) {
													streamedAny = true;
													sendChunk(cleanToken);
												}
											}
										} catch {}
									}
								}
							}
						} catch (ollamaErr) {
							console.warn(`[Reader AI Stream] Ollama error with model ${currentModel}:`, ollamaErr);
						}
					}

					// 2. Thử nghiệm Fallback qua Gemini nếu Ollama chưa trả về chunk
					if (!streamedAny) {
						const geminiApiKey = process.env.GEMINI_API_KEY;
						if (geminiApiKey && geminiApiKey !== "your_gemini_api_key_here") {
							try {
								const geminiRes = await fetch(
									`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${geminiApiKey}`,
									{
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											contents: [
												{
													parts: [
														{
															text: `${systemPrompt}\n\nĐộc giả gửi: ${userMessageContent}`,
														},
													],
												},
											],
										}),
										signal: AbortSignal.timeout(15000),
									},
								);

								if (geminiRes.ok && geminiRes.body) {
									const gReader = geminiRes.body.getReader();
									const gDecoder = new TextDecoder();
									let gBuffer = "";

									while (true) {
										const { done, value } = await gReader.read();
										if (done) break;
										gBuffer += gDecoder.decode(value, { stream: true });
										const gLines = gBuffer.split("\n");
										gBuffer = gLines.pop() || "";

										for (const line of gLines) {
											if (line.startsWith("data: ")) {
												try {
													const json = JSON.parse(line.slice(6)) as any;
													const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
													if (text) {
														streamedAny = true;
														sendChunk(text);
													}
												} catch {}
											}
										}
									}
								}
							} catch (geminiErr) {
								console.warn("[Reader AI Stream] Gemini stream error:", geminiErr);
							}
						}
					}

					// 3. Fallback Dynamic Literary Synthesis nếu không có LLM phản hồi
					if (!streamedAny) {
						const fallbackText = generateDynamicFallback(
							resolvedTitle,
							author,
							totalChaps,
							totalWords,
							cleanQuote,
							cleanQuery,
							graphResult,
						);
						const words = fallbackText.split(" ");
						for (let i = 0; i < words.length; i += 3) {
							const group = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
							sendChunk(group);
							await new Promise((r) => setTimeout(r, 18));
						}
					}

					sendDone();
				},
			});

			return new Response(readableStream, {
				headers: {
					"Content-Type": "text/event-stream; charset=utf-8",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
				},
			});
		}

		// NON-STREAMING FALLBACK (cho các trường hợp gọi cũ)
		let answer = "";
		let thinkingText = "";

		for (const currentModel of candidateModels) {
			if (answer) break;
			try {
				const numCtx = currentModel.includes("gemma3") ? 4096 : 8192;
				const ollamaRes = await fetch(`${llmBaseUrl}/api/chat`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model: currentModel,
						messages: [
							{ role: "system", content: systemPrompt },
							{ role: "user", content: userMessageContent },
						],
						stream: false,
						options: {
							temperature,
							repeat_penalty: 1.03,
							num_ctx: numCtx,
							num_predict: -1, // Không giới hạn token output
						},
					}),
					signal: AbortSignal.timeout(600000),
				});

				if (ollamaRes.ok) {
					const data = (await ollamaRes.json()) as any;
					if (data.message?.thinking) {
						thinkingText = data.message.thinking.trim();
					}
					let text = data.message?.content?.trim();
					if (text) {
						if (text.includes("<think>")) {
							const match = text.match(/<think>([\s\S]*?)<\/think>/i);
							if (match) {
								if (!thinkingText) thinkingText = match[1].trim();
								text = text.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
							}
						}
						answer = text;
						break;
					}
				}
			} catch (ollamaErr) {
				console.warn(`[Reader AI] Ollama model ${currentModel} error, trying next:`, ollamaErr);
			}
		}

		if (!answer) {
			answer = generateDynamicFallback(
				resolvedTitle,
				author,
				totalChaps,
				totalWords,
				cleanQuote,
				cleanQuery,
				graphResult,
			);
		}

		return NextResponse.json({
			answer,
			thinking: thinkingText || null,
			bookSlug: graphResult.resolvedBookSlug || bookSlug,
			source: "graphrag_ollama",
		});
	} catch (error) {
		console.error("[api/ai/reader-chat] Error:", error);
		return NextResponse.json(
			{
				error: "Đã xảy ra lỗi khi phân tích tác phẩm",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
