import { NextResponse } from "next/server";
import http from "node:http";

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;

const CATALOG_BOOKS = [
	{
		slug: "dac-nhan-tam",
		title: "Đắc Nhân Tâm",
		author: "Dale Carnegie",
		topic: "Giao tiếp, ứng xử, thu phục lòng người, nghệ thuật lãnh đạo, phát triển bản thân",
		price: 59000,
		category: "Giao tiếp & Ứng xử",
	},
	{
		slug: "bon-thoa-uoc",
		title: "Bốn Thỏa Ước",
		author: "Don Miguel Ruiz",
		topic: "Tâm lý học Toltec, chữa lành tổn thương, tự do nội tâm, buông bỏ phán xét, giải tỏa áp lực stress",
		price: 69000,
		category: "Tâm lý & Chữa lành",
	},
	{
		slug: "sapiens-luoc-su-loai-nguoi",
		title: "Sapiens: Lược Sử Loài Người",
		author: "Yuval Noah Harari",
		topic: "Lịch sử tiến hóa sinh học và nhận thức, sự hình thành tôn giáo, tiền tệ, đế quốc và tương lai nhân loại",
		price: 89000,
		category: "Lịch sử & Khoa học",
	},
	{
		slug: "tu-duy-nhanh-va-cham",
		title: "Tư Duy Nhanh Và Chậm",
		author: "Daniel Kahneman",
		topic: "Tâm lý học hành vi, kinh tế học hành vi, hệ thống tư duy 1 và 2, các bẫy nhận thức khi ra quyết định",
		price: 79000,
		category: "Tâm lý & Tư duy",
	},
	{
		slug: "tri-tue-do-thai",
		title: "Trí Tuệ Do Thái",
		author: "Eran Katz",
		topic: "Phương pháp rèn luyện trí não, kỹ thuật ghi nhớ đỉnh cao, triết lý giáo dục và tư duy kinh doanh của người Do Thái",
		price: 65000,
		category: "Trí tuệ & Học tập",
	},
	{
		slug: "bi-mat-cua-mot-tri-nho-sieu-pham",
		title: "Bí Mật Của Một Trí Nhớ Siêu Phàm",
		author: "Eran Katz",
		topic: "Kỹ năng ghi nhớ siêu tốc, phương pháp học tập hiệu quả, ghi nhớ số liệu và ngôn ngữ",
		price: 59000,
		category: "Học tập & Rèn luyện",
	},
	{
		slug: "cach-nghi-de-thanh-cong",
		title: "Cách Nghĩ Để Thành Công",
		author: "Napoleon Hill",
		topic: "Tư duy làm giàu, động lực tài chính, 13 nguyên tắc thành công, làm chủ số phận và kinh doanh",
		price: 69000,
		category: "Kinh doanh & Làm giàu",
	},
	{
		slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than",
		title: "Chủ Nghĩa Khắc Kỷ",
		author: "William B. Irvine",
		topic: "Triết học Stoicism, nghệ thuật sống bình thản, làm chủ cảm xúc, vượt qua nghịch cảnh và áp lực cuộc sống",
		price: 75000,
		category: "Triết học & Lối sống",
	},
	{
		slug: "10-dieu-tao-nen-so-phan",
		title: "10 Điều Tạo Nên Số Phận",
		author: "Nhiều tác giả",
		topic: "Kỷ luật bản thân, thói quen tích cực, định hướng cuộc đời, rèn luyện nhân cách và nghị lực",
		price: 55000,
		category: "Kỹ năng sống",
	},
	{
		slug: "chien-tranh-tien-te-tap-1",
		title: "Chiến Tranh Tiền Tệ - Tập 1",
		author: "Song Hongbing",
		topic: "Lịch sử tài chính thế giới, các gia tộc tài phiệt ngân hàng quốc tế, bản chất dòng tiền và lạm phát",
		price: 79000,
		category: "Kinh tế & Tài chính",
	},
	{
		slug: "chien-tranh-tien-te-tap-2",
		title: "Chiến Tranh Tiền Tệ - Tập 2",
		author: "Song Hongbing",
		topic: "Quyền lực ngầm tài chính, các cuộc khủng hoảng kinh tế toàn cầu, sự trỗi dậy của các thế lực tiền tệ",
		price: 79000,
		category: "Kinh tế & Tài chính",
	},
	{
		slug: "chien-tranh-tien-te-tap-3",
		title: "Chiến Tranh Tiền Tệ - Tập 3",
		author: "Song Hongbing",
		topic: "Cục diện tài chính thời đại mới, chiến lược tiền tệ quốc gia và tương lai dòng tiền",
		price: 79000,
		category: "Kinh tế & Tài chính",
	},
	{
		slug: "truyen-kieu",
		title: "Truyện Kiều",
		author: "Nguyễn Du",
		topic: "Kiệt tác văn học cổ điển Việt Nam, số phận con người, giá trị nhân đạo và nghệ thuật thi ca",
		price: 49000,
		category: "Văn học cổ điển",
	},
];

function callOllamaNative(prompt: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const payload = JSON.stringify({
			model: "gemma2:2b",
			messages: [{ role: "user", content: prompt }],
			stream: false,
			format: "json",
			options: {
				temperature: 0.2,
				num_predict: 250,
			keep_alive: "24h",
			},
		});

		const req = http.request(
			{
				hostname: OLLAMA_HOST,
				port: OLLAMA_PORT,
				path: "/api/chat",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(payload),
				},
				timeout: 15000,
			},
			(res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => {
					try {
						const json = JSON.parse(data);
						const content = json.message?.content;
						if (content) {
							resolve(JSON.parse(content));
						} else {
							resolve(null);
						}
					} catch (e) {
						resolve(null);
					}
				});
			},
		);

		req.on("error", (err) => { console.error("[api/search/ai] Ollama HTTP error:", err.message); resolve(null); });
		req.on("timeout", () => { console.error("[api/search/ai] Ollama HTTP timeout!");
			req.destroy();
			resolve(null);
		});

		req.write(payload);
		req.end();
	});
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			query?: string;
			locale?: string;
			channel?: string;
		};
		const { query = "", locale = "vi", channel = "channel-vnd" } = body;

		if (!query || typeof query !== "string" || !query.trim()) {
			return NextResponse.json({
				source: "empty_query",
				query: "",
				total: 0,
				results: [],
			});
		}

		const cleanQuery = query.trim().slice(0, 500);

		const prompt = `Bạn là bộ não phân tích ngữ nghĩa sách AI của nền tảng AuraBook.
Đọc hiểu sâu sắc ý định tìm kiếm của độc giả và chọn ra từ 1 đến 3 cuốn sách phù hợp nhất từ kho sau:
${JSON.stringify(
	CATALOG_BOOKS.map((b) => ({ slug: b.slug, title: b.title, author: b.author, topic: b.topic })),
	null,
	2,
)}

Yêu cầu/câu hỏi của độc giả: "${cleanQuery}"

Yêu cầu trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown):
{
  "queryInterpretation": "Tóm tắt ngắn gọn 1 câu về ý định hoặc vấn đề của độc giả",
  "reasoningSummary": "Giải thích ngắn gọn 1-2 câu lý do vì sao bộ sách này phù hợp nhất với mong muốn của họ",
  "matchedConcepts": ["Khái niệm 1", "Khái niệm 2"],
  "matches": [
    {
      "slug": "slug chính xác của sách",
      "score": 0.95,
      "reason": "1 câu lý giải chi tiết vì sao sách này giải quyết được yêu cầu"
    }
  ]
}`;

		// Gọi Native Node.js HTTP tới Ollama
		const llmParsed = await callOllamaNative(prompt);

		// Nếu LLM Gemma 2 trả về kết quả
		if (llmParsed && Array.isArray(llmParsed.matches) && llmParsed.matches.length > 0) {
			const recommendations = [];
			for (const m of llmParsed.matches) {
				if (!m.slug) continue;
				const book = CATALOG_BOOKS.find((b) => b.slug === m.slug || m.slug.includes(b.slug));
				if (!book) continue;

				recommendations.push({
					id: book.slug,
					title: book.title,
					author: book.author,
					slug: book.slug,
					coverImage: `/covers/${book.slug}.jpg`,
					price: book.price,
					similarityScore: Math.round((m.score || 0.9) * 100),
					recommendationReason: m.reason || `Phù hợp với chủ đề ${book.category}`,
					coreInsight: book.topic,
					matchedConcepts: [book.category],
					similarityTier: (m.score || 0.9) >= 0.85 ? "high" : "medium",
					similarityLabel: (m.score || 0.9) >= 0.85 ? "Tương đồng cao (Gemma 2 AI)" : "Tương đồng tốt",
					href: `/${locale}/${channel}/products/${book.slug}`,
				});
			}

			// Sách tham khảo
			const supplementary = [];
			for (const b of CATALOG_BOOKS) {
				if (!recommendations.some((r) => r.slug === b.slug) && supplementary.length < 3) {
					supplementary.push({
						id: b.slug,
						title: b.title,
						author: b.author,
						slug: b.slug,
						coverImage: `/covers/${b.slug}.jpg`,
						price: b.price,
						similarityScore: 75,
						recommendationReason: `Tác phẩm liên quan cùng nhóm ${b.category}`,
						coreInsight: b.topic,
						matchedConcepts: [b.category],
						similarityTier: "medium",
						similarityLabel: "Tham khảo liên quan",
						href: `/${locale}/${channel}/products/${b.slug}`,
					});
				}
			}

			if (recommendations.length > 0) {
				return NextResponse.json({
					source: "llm_gemma2_semantic",
					model: "gemma2:2b",
					query: cleanQuery,
					total: recommendations.length,
					queryInterpretation: llmParsed.queryInterpretation || `Nhu cầu tìm hiểu về ${cleanQuery}`,
					reasoningSummary: llmParsed.reasoningSummary || "AI đã chọn lọc ấn phẩm tối ưu dựa trên phân tích ngữ nghĩa",
					matchedConcepts: Array.isArray(llmParsed.matchedConcepts) ? llmParsed.matchedConcepts : ["Phân tích ngữ nghĩa AI"],
					recommendations,
					supplementaryRecommendations: supplementary,
				});
			}
		}

		// Fallback nếu không parse được
		const fallbackBook = CATALOG_BOOKS[0];
		return NextResponse.json({
			source: "catalog_fallback",
			query: cleanQuery,
			total: 1,
			queryInterpretation: `Tìm kiếm về ${cleanQuery}`,
			reasoningSummary: "Đề xuất ấn phẩm nổi bật trong kho sách AuraBook",
			matchedConcepts: ["Sách tiêu biểu"],
			recommendations: [
				{
					id: fallbackBook.slug,
					title: fallbackBook.title,
					author: fallbackBook.author,
					slug: fallbackBook.slug,
					coverImage: `/covers/${fallbackBook.slug}.jpg`,
					price: fallbackBook.price,
					similarityScore: 80,
					recommendationReason: fallbackBook.topic,
					coreInsight: fallbackBook.topic,
					matchedConcepts: [fallbackBook.category],
					similarityTier: "medium",
					similarityLabel: "Ấn phẩm tiêu biểu",
					href: `/${locale}/${channel}/products/${fallbackBook.slug}`,
				},
			],
			supplementaryRecommendations: [],
		});
	} catch (error: any) {
		console.error("[api/search/ai] Exception:", error);
		return NextResponse.json({ source: "error", error: error.message }, { status: 200 });
	}
}
