import { graphRAGStore, type BookRecommendationDetail, type GraphRAGSearchResult } from "@/lib/graphrag/graph-store";
import type { ProductCardData } from "@/ui/components/plp/product-card-data";

const OLLAMA_HOST = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export interface LLMSemanticSearchOutput extends GraphRAGSearchResult {
	isLLMResult: boolean;
}

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

export async function getLLMSemanticSearch(
	query: string,
	options: { locale: string; channel: string },
): Promise<LLMSemanticSearchOutput> {
	const cleanQuery = (query || "").trim();
	const { locale, channel } = options;

	// Thử gọi LLM Gemma 2: 2B trên Ollama Local
	try {
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

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);

		const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: "gemma2:2b",
				messages: [{ role: "user", content: prompt }],
				stream: false,
				format: "json",
				options: {
					temperature: 0.2,
					num_predict: 400,
				},
			}),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (res.ok) {
			const data = (await res.json()) as any;
			const content = data.message?.content;
			if (content) {
				const parsed = JSON.parse(content) as {
					queryInterpretation?: string;
					reasoningSummary?: string;
					matchedConcepts?: string[];
					matches?: Array<{ slug?: string; score?: number; reason?: string }>;
				};
				if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
					const recommendations: BookRecommendationDetail[] = [];
					for (const m of parsed.matches) {
						if (!m.slug) continue;
						const book = CATALOG_BOOKS.find((b) => b.slug === m.slug || m.slug?.includes(b.slug));
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

					// Các sách tham khảo thêm
					const supplementary: BookRecommendationDetail[] = [];
					for (const b of CATALOG_BOOKS) {
						if (!recommendations.some((r) => r.slug === b.slug) && supplementary.length < 3) {
							supplementary.push({
								id: b.slug,
								title: b.title,
								author: b.author,
								slug: b.slug,
								coverImage: `/covers/${b.slug}.jpg`,
								price: bookPriceFallback(b.slug, b.price),
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
						const products: ProductCardData[] = recommendations.map((r) => ({
							id: r.id,
							name: r.title,
							slug: r.slug,
							thumbnail: { url: r.coverImage, alt: r.title },
							pricing: {
								priceRange: {
									start: { gross: { amount: r.price, currency: "VND" } },
									stop: { gross: { amount: r.price, currency: "VND" } },
								},
							},
							category: { name: r.matchedConcepts[0] || "Sách điện tử DRM", slug: "sach" },
							editionType: "DIGITAL",
						}));

						return {
							isLLMResult: true,
							products,
							totalCount: recommendations.length,
							queryInterpretation: parsed.queryInterpretation || `Nhu cầu tìm hiểu về ${cleanQuery}`,
							reasoningSummary: parsed.reasoningSummary || "AI đã chọn lọc ấn phẩm tối ưu dựa trên phân tích ngữ nghĩa",
							matchedConcepts: Array.isArray(parsed.matchedConcepts) ? parsed.matchedConcepts : ["Phân tích ngữ nghĩa AI"],
							recommendations,
							supplementaryRecommendations: supplementary,
							hasDirectMatch: true,
						};
					}
				}
			}
		}
	} catch (err) {
		console.warn("[ai-semantic] Fallback to internal GraphRAG:", err);
	}

	// Fallback sang GraphRAG cục bộ
	const rag = graphRAGStore.searchProductsByContext(cleanQuery, { locale, channel });
	return {
		isLLMResult: false,
		products: rag.products,
		totalCount: rag.totalCount,
		queryInterpretation: rag.queryInterpretation,
		reasoningSummary: rag.reasoningSummary,
		matchedConcepts: rag.matchedConcepts,
		recommendations: rag.recommendations,
		supplementaryRecommendations: rag.supplementaryRecommendations || [],
		hasDirectMatch: rag.hasDirectMatch ?? true,
	};
}

function bookPriceFallback(slug: string, fallback: number): number {
	const b = CATALOG_BOOKS.find((x) => x.slug === slug);
	return b ? b.price : fallback;
}
