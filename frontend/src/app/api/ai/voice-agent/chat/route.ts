import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { executePublicGraphQL } from "@/lib/graphql";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";
import { SearchProductsDocument, OrderDirection, ProductOrderField } from "@/gql/graphql";
import { graphRAGStore } from "@/lib/graphrag/graph-store";
import { getAllGHNShipments, getGHNShipmentByOrder, type GHNShipment } from "@/lib/shipping/ghn";

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

export interface BookVariantOption {
	id: string;
	name: string;
	type: "ebook" | "physical";
	sku: string;
	price: string;
	originalPrice?: string;
}

export interface BookProduct {
	id: string;
	title: string;
	originalTitle: string;
	author: string;
	price: string;
	originalPrice: string;
	ebookPrice: string;
	physicalPrice: string;
	rating: number;
	reviewCount: number;
	coverImage: string;
	readerUrl: string;
	slug: string;
	badge: string;
	description: string;
	variants: BookVariantOption[];
}

const CATALOG: BookProduct[] = [
	{
		id: "UHJvZHVjdDox",
		title: "Đắc Nhân Tâm",
		originalTitle: "How to Win Friends and Influence People",
		author: "Dale Carnegie",
		price: "59.000₫",
		originalPrice: "89.000₫",
		ebookPrice: "59.000₫",
		physicalPrice: "118.000₫",
		rating: 4.9,
		reviewCount: 1240,
		coverImage: "/products/book-dac-nhan-tam-cover.jpg",
		readerUrl: "/reader/dac-nhan-tam",
		slug: "dac-nhan-tam",
		badge: "Giao tiếp & Ứng xử",
		description: "Cẩm nang giao tiếp, thấu hiểu tâm lý và nghệ thuật thu phục lòng người kinh điển nhất mọi thời đại.",
		variants: [
			{
				id: "UHJvZHVjdFZhcmlhbnQ6Mg==",
				name: "Bản Ebook (Sách Điện Tử)",
				type: "ebook",
				sku: "EB-DAC-NHAN-TAM",
				price: "59.000₫",
				originalPrice: "89.000₫",
			},
			{
				id: "UHJvZHVjdFZhcmlhbnQ6Mw==",
				name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
				type: "physical",
				sku: "VT-DAC-NHAN-TAM",
				price: "118.000₫",
				originalPrice: "150.000₫",
			},
		],
	},
	{
		id: "UHJvZHVjdDoy",
		title: "Bốn Thỏa Ước",
		originalTitle: "The Four Agreements",
		author: "Don Miguel Ruiz",
		price: "49.000₫",
		originalPrice: "69.000₫",
		ebookPrice: "49.000₫",
		physicalPrice: "98.000₫",
		rating: 4.8,
		reviewCount: 890,
		coverImage: "/products/book-bon-thoa-uoc-cover.jpg",
		readerUrl: "/reader/bon-thoa-uoc",
		slug: "bon-thoa-uoc",
		badge: "Minh triết sống",
		description: "Triết lý Toltec khai sáng giúp bạn thoát khỏi những niềm tin giới hạn và tìm thấy tự do đích thực.",
		variants: [
			{
				id: "UHJvZHVjdFZhcmlhbnQ6NA==",
				name: "Bản Ebook (Sách Điện Tử)",
				type: "ebook",
				sku: "EB-BON-THOA-UOC",
				price: "49.000₫",
				originalPrice: "69.000₫",
			},
			{
				id: "UHJvZHVjdFZhcmlhbnQ6NQ==",
				name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
				type: "physical",
				sku: "VT-BON-THOA-UOC",
				price: "98.000₫",
				originalPrice: "125.000₫",
			},
		],
	},
	{
		id: "UHJvZHVjdDoz",
		title: "Sapiens: Lược Sử Loài Người",
		originalTitle: "A Brief History of Humankind",
		author: "Yuval Noah Harari",
		price: "89.000₫",
		originalPrice: "120.000₫",
		ebookPrice: "89.000₫",
		physicalPrice: "189.000₫",
		rating: 5.0,
		reviewCount: 2410,
		coverImage: "/products/book-sapiens-luoc-su-loai-nguoi-cover.jpeg",
		readerUrl: "/reader/sapiens-luoc-su-loai-nguoi",
		slug: "sapiens-luoc-su-loai-nguoi",
		badge: "Lược sử văn minh",
		description: "Hành trình vĩ đại từ loài vượn người trở thành kẻ thống trị địa cầu qua các cuộc cách mạng nhận thức.",
		variants: [
			{
				id: "UHJvZHVjdFZhcmlhbnQ6Ng==",
				name: "Bản Ebook (Sách Điện Tử)",
				type: "ebook",
				sku: "EB-SAPIENS",
				price: "89.000₫",
				originalPrice: "120.000₫",
			},
			{
				id: "UHJvZHVjdFZhcmlhbnQ6Nw==",
				name: "Bản Sách Giấy (Bìa Cứng Tuyển Chọn)",
				type: "physical",
				sku: "VT-SAPIENS",
				price: "189.000₫",
				originalPrice: "240.000₫",
			},
		],
	},
	{
		id: "UHJvZHVjdDo0",
		title: "Trí Tuệ Do Thái",
		originalTitle: "Jerome Becomes a Genius",
		author: "Eran Katz",
		price: "69.000₫",
		originalPrice: "95.000₫",
		ebookPrice: "69.000₫",
		physicalPrice: "135.000₫",
		rating: 4.8,
		reviewCount: 670,
		coverImage: "/products/book-tri-tue-do-thai-cover.jpeg",
		readerUrl: "/reader/tri-tue-do-thai",
		slug: "tri-tue-do-thai",
		badge: "Trí tuệ nhân loại",
		description: "Bí quyết rèn luyện trí nhớ phi thường và tư duy làm giàu sắc bén của người Do Thái.",
		variants: [
			{
				id: "UHJvZHVjdFZhcmlhbnQ6OA==",
				name: "Bản Ebook (Sách Điện Tử)",
				type: "ebook",
				sku: "EB-TRI-TUE-DO-THAI",
				price: "69.000₫",
				originalPrice: "95.000₫",
			},
			{
				id: "UHJvZHVjdFZhcmlhbnQ6OQ==",
				name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
				type: "physical",
				sku: "VT-TRI-TUE-DO-THAI",
				price: "135.000₫",
				originalPrice: "170.000₫",
			},
		],
	},
];

async function searchSaleorProducts(searchQuery: string): Promise<BookProduct[]> {
	try {
		const result = await executePublicGraphQL(SearchProductsDocument, {
			variables: {
				search: searchQuery,
				channel: "channel-vnd",
				sortBy: ProductOrderField.Rating,
				sortDirection: OrderDirection.Desc,
				first: 4,
				...graphqlLanguageCodeVariables("vi"),
			},
			revalidate: 60,
		});

		if (result.ok && result.data?.products?.edges?.length) {
			const products: BookProduct[] = [];
			for (const edge of result.data.products.edges) {
				const node = edge.node;
				if (!node) continue;

				const matchedCatalog = CATALOG.find((c) => c.slug === node.slug);
				if (matchedCatalog) {
					products.push(matchedCatalog);
					continue;
				}

				const minAmount = node.pricing?.priceRange?.start?.gross?.amount;
				const maxAmount = node.pricing?.priceRange?.stop?.gross?.amount;
				const ebookPrice = minAmount
					? `${new Intl.NumberFormat("vi-VN").format(minAmount)}₫`
					: "59.000₫";
				const physicalPrice = maxAmount && maxAmount > (minAmount || 0)
					? `${new Intl.NumberFormat("vi-VN").format(maxAmount)}₫`
					: (minAmount ? `${new Intl.NumberFormat("vi-VN").format(minAmount * 2)}₫` : "118.000₫");

				products.push({
					id: node.id,
					title: node.name,
					originalTitle: node.name,
					author: "AuraBook Publishing",
					price: ebookPrice,
					originalPrice: physicalPrice,
					ebookPrice,
					physicalPrice,
					rating: 4.9,
					reviewCount: 320,
					coverImage: node.thumbnail?.url || "/products/book-dac-nhan-tam-cover.jpg",
					readerUrl: `/reader/${node.slug}`,
					slug: node.slug,
					badge: node.category?.name || "Ấn phẩm nổi bật",
					description: node.category?.name
						? `Ấn phẩm tuyển chọn thuộc chuyên mục ${node.category.name} tại AuraBook.`
						: "Ấn phẩm chất lượng cao tại AuraBook.",
					variants: [
						{
							id: `${node.id}-eb`,
							name: "Bản Ebook (Sách Điện Tử)",
							type: "ebook",
							sku: `EB-${node.slug.toUpperCase()}`,
							price: ebookPrice,
						},
						{
							id: `${node.id}-vt`,
							name: "Bản Sách Giấy (Sách Vật Lý)",
							type: "physical",
							sku: `VT-${node.slug.toUpperCase()}`,
							price: physicalPrice,
						},
					],
				});
			}
			return products;
		}
	} catch (e) {
		console.warn("[VoiceAgent Chat] Saleor search fallback:", e);
	}
	return [];
}

/**
 * Chuẩn hóa ngữ nghĩa tiếng Việt và nhận diện lỗi chính tả phổ biến
 */
function normalizeVietnameseQuery(text: string): { lowerNorm: string; ascii: string } {
	const raw = (text || "").trim().toLowerCase();
	// Chuẩn hóa các biến thể sai chính tả thường gặp
	const norm = raw
		.replace(/đươn\s*hàng/g, "đơn hàng")
		.replace(/đươn/g, "đơn")
		.replace(/đon\s*hàng/g, "đơn hàng")
		.replace(/don\s*hang/g, "đơn hàng")
		.replace(/donhang/g, "đơn hàng")
		.replace(/kiem\s*tra/g, "kiểm tra")
		.replace(/ktra/g, "kiểm tra")
		.replace(/tra\s*cuu/g, "tra cứu")
		.replace(/van\s*chuyen/g, "vận chuyển")
		.replace(/giao\s*hang/g, "giao hàng")
		.replace(/khi\s*nao\s*nhan/g, "khi nào nhận")
		.replace(/van\s*don/g, "vận đơn")
		.replace(/ma\s*don/g, "mã đơn");

	const ascii = norm
		.replace(/đ/g, "d")
		.replace(/Đ/g, "d")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	return { lowerNorm: norm, ascii };
}

async function queryLLM({
	model,
	prompt,
	systemPrompt,
	timeoutMs = 4000,
	provider = "ollama",
	apiKey = "",
	baseUrl = "http://127.0.0.1:11434",
}: {
	model: string;
	prompt: string;
	systemPrompt: string;
	timeoutMs?: number;
	provider?: string;
	apiKey?: string;
	baseUrl?: string;
}): Promise<string | null> {
	// 1. Google Gemini Flash API (Siêu tốc ~300-500ms, Free Tier chính thức của Google)
	const isGemini = provider === "gemini" || model.toLowerCase().includes("gemini");
	if (isGemini) {
		const geminiKey = apiKey || process.env.GEMINI_API_KEY || "";
		if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
			try {
				const geminiModel = model.toLowerCase().includes("2.0") ? "gemini-2.0-flash" : "gemini-1.5-flash";
				const res = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							systemInstruction: { parts: [{ text: systemPrompt }] },
							contents: [{ role: "user", parts: [{ text: prompt }] }],
							generationConfig: {
								temperature: 0.25,
								maxOutputTokens: 250,
							},
						}),
						signal: AbortSignal.timeout(timeoutMs),
					},
				);
				if (res.ok) {
					const data = (await res.json()) as any;
					const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
					if (text) return text;
				}
			} catch (e) {
				console.warn("[VoiceAgent Chat] Gemini error, falling back to local Gemma:", e);
			}
		}
	}

	// 2. Ollama Local (Chạy hoàn toàn trên Gemma 2 2B của Google: 100% GPU, phản hồi siêu tốc dưới 1 giây)
	const targetBase = (baseUrl || "http://127.0.0.1:11434").replace(/\/v1\/?$/, "");
	const ollamaModelsToTry = ["gemma2:2b"];

	for (const curModel of ollamaModelsToTry) {
		try {
			const res = await fetch(`${targetBase}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: curModel,
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: prompt },
					],
					stream: false,
					keep_alive: "1h",
					options: {
						temperature: 0.25,
						num_predict: 200,
					},
				}),
				signal: AbortSignal.timeout(timeoutMs),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				const text = data.message?.content?.trim();
				if (text) return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
			} else {
				console.warn(`[VoiceAgent Chat] Model ${curModel} returned HTTP ${res.status}, trying next model.`);
			}
		} catch (e: any) {
			console.warn(`[VoiceAgent Chat] Error with model ${curModel}:`, e?.message || e);
		}
	}
	return null;
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as any;
		const {
			query,
			message,
			topic,
			history,
			customerName,
			customerPhone,
			customerGender,
			customerAge: _customerAge,
			model,
			contactMethod,
			voice,
		} = body;
		void _customerAge;

		// Nạp cấu hình giọng đọc & LLM (mặc định ưu tiên Gemma 2B của Google)
		let llmProvider = "ollama";
		let llmModel = "gemma2:2b";
		let llmBaseUrl = "http://localhost:11434";
		let llmApiKey = "";
		let ttsVoice = "vi_VN-hoaimy-aurabook";
		let ttsSpeed = 1.0;

		try {
			const configPath = getConfigPath();
			if (fs.existsSync(configPath)) {
				const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
				if (cfg.voice?.llmProvider) llmProvider = cfg.voice.llmProvider;
				if (cfg.voice?.llmBaseUrl) llmBaseUrl = cfg.voice.llmBaseUrl;
				if (cfg.voice?.llmApiKey) llmApiKey = cfg.voice.llmApiKey;
				if (cfg.voice?.llmModel) llmModel = cfg.voice.llmModel;
				if (cfg.voice?.ttsVoice) ttsVoice = cfg.voice.ttsVoice;
				if (typeof cfg.voice?.ttsSpeed === "number") ttsSpeed = cfg.voice.ttsSpeed;
			}
		} catch (e) {
			console.warn("[VoiceAgent Chat] Error loading config:", e);
		}

		if (model && model.trim()) {
			llmModel = model.trim();
		}

		const cleanQuery = (query || message || "").trim();
		const { lowerNorm, ascii } = normalizeVietnameseQuery(cleanQuery);
		const lower = lowerNorm;
		const selectedTopic = topic || "Tư vấn chọn sách & Sách bán chạy";

		const name = (customerName || "").trim();
		const phone = (customerPhone || "").trim();
		const gender = (customerGender || "Anh").trim();
		let honorific = gender;
		if (name) {
			if (gender && name.toLowerCase().startsWith(gender.toLowerCase() + " ")) {
				honorific = name;
			} else {
				honorific = `${gender} ${name}`;
			}
		}

		let answer = "";
		const thinkingSteps: string[] = [];
		const cards: any[] = [];

		// ======================================================================
		// 1. TẦNG SUY NGHĨ (THINKING PROCESS & DIALOGUE STATE TRACKING)
		// ======================================================================
		// 1.1. Quét lịch sử hội thoại để xác định sách đang được bàn luận (activeBookSlug)
		let activeBookSlug: string | undefined;
		const reversedHistory = [...(history || [])].reverse();
		for (const msg of reversedHistory) {
			const cLower = msg.content.toLowerCase();
			if (cLower.includes("trí tuệ do thái") || cLower.includes("do thái") || cLower.includes("eran katz")) {
				activeBookSlug = "tri-tue-do-thai";
				break;
			}
			if (cLower.includes("đắc nhân tâm") || cLower.includes("dale carnegie")) {
				activeBookSlug = "dac-nhan-tam";
				break;
			}
			if (cLower.includes("bốn thỏa ước") || cLower.includes("don miguel ruiz") || cLower.includes("toltec")) {
				activeBookSlug = "bon-thoa-uoc";
				break;
			}
			if (cLower.includes("sapiens") || cLower.includes("yuval noah harari") || cLower.includes("lược sử loài người")) {
				activeBookSlug = "sapiens-luoc-su-loai-nguoi";
				break;
			}
		}

		// 1.2. Nhận diện thực thể sách nếu có đề cập
		const resolvedNode = graphRAGStore.resolveBookEntity(cleanQuery, activeBookSlug);
		const currentBookSlug = resolvedNode?.properties.slug || activeBookSlug;
		if (resolvedNode?.properties.slug) {
			activeBookSlug = resolvedNode.properties.slug;
		}

		// ======================================================================
		// 2. PHÂN LOẠI Ý ĐỊNH CHÍNH XÁC (SEMANTIC INTENT CLASSIFICATION)
		// ======================================================================

		// 0. Ý ĐỊNH KẾT THÚC CUỘC GỌI / CẢM ƠN (FAREWELL / END_CALL)
		const isFarewell =
			lower.includes("kết thúc cuộc gọi") ||
			lower.includes("ket thuc cuoc goi") ||
			ascii.includes("ket thuc cuoc goi") ||
			lower.includes("kết thúc giúp") ||
			lower.includes("kết thúc trò chuyện") ||
			lower.includes("dừng cuộc gọi") ||
			lower.includes("tạm biệt") ||
			lower.includes("tam biet") ||
			ascii.includes("tam biet") ||
			lower.includes("bye") ||
			lower.includes("hẹn gặp lại") ||
			lower.includes("không cần nữa") ||
			lower.includes("không cần hỗ trợ") ||
			lower.includes("được rồi cảm ơn") ||
			lower.includes("thế thôi cảm ơn") ||
			lower.includes("vậy thôi cảm ơn") ||
			lower.includes("không đâu được rồi") ||
			lower === "cảm ơn" ||
			lower === "cảm ơn bạn" ||
			lower === "cảm ơn em" ||
			lower === "cảm ơn nhé" ||
			lower === "cảm ơn nha" ||
			lower === "kết thúc" ||
			lower === "dừng lại" ||
			lower === "thôi được rồi";

		// 0.1. YÊU CẦU TÌM CHỦ ĐỀ CHƯA CÓ TRONG KHO (OUT_OF_CATALOG, ví dụ: Hồ Chí Minh, Bác Hồ)
		const isUncleHoQuery =
			lower.includes("hồ chí minh") ||
			lower.includes("bác hồ") ||
			lower.includes("nguyễn ái quốc") ||
			lower.includes("nguyễn sinh cung") ||
			ascii.includes("ho chi minh") ||
			ascii.includes("bac ho");

		// 0.2. Ý ĐỊNH TƯ VẤN NHIỀU ẤN PHẨM (MULTI-BOOK CONSULTATION - ví dụ: 1 lịch sử và 1 công nghệ)
		const isMultiBookRequest =
			(lower.includes("hai quyển") ||
				lower.includes("2 quyển") ||
				lower.includes("hai cuốn") ||
				lower.includes("2 cuốn") ||
				lower.includes("hai đầu sách") ||
				lower.includes("2 đầu sách") ||
				lower.includes("vài quyển") ||
				lower.includes("mấy quyển")) &&
			((lower.includes("lịch sử") || ascii.includes("lich su")) &&
				(lower.includes("công nghệ") ||
					ascii.includes("cong nghe") ||
					lower.includes("lập trình") ||
					ascii.includes("lap trinh") ||
					lower.includes("code")));

		// A. Ý ĐỊNH TRA CỨU ĐƠN HÀNG (ORDER_LOOKUP)
		// Bắt lỗi chính tả: "đươn hàng", "don hang", "donhang", "kiểm tra đơn", "đơn gần nhất", "vận đơn", "tracking"...
		const isOrderInquiry =
			lower.includes("đơn hàng") ||
			lower.includes("vận chuyển") ||
			lower.includes("giao hàng") ||
			lower.includes("mã đơn") ||
			lower.includes("vận đơn") ||
			lower.includes("ghn") ||
			lower.includes("tracking") ||
			lower.includes("hàng của tôi") ||
			lower.includes("đơn của tôi") ||
			lower.includes("đơn gần nhất") ||
			lower.includes("đơn đã đặt") ||
			lower.includes("khi nào nhận") ||
			lower.includes("kiện hàng") ||
			ascii.includes("don hang") ||
			ascii.includes("van chuyen") ||
			ascii.includes("giao hang") ||
			ascii.includes("kiem tra don") ||
			ascii.includes("tra cuu don") ||
			selectedTopic.includes("đơn hàng");

		// B. Ý ĐỊNH MUA HÀNG (PURCHASE_INTENT)
		const isAnaphoricPurchase =
			/^(mua nó|mua quyển này|mua cuốn này|mua cuốn đó|lấy nó|cho tôi mua nó|cho tôi mua quyển này|cho tôi mua cuốn này|mua nó bằng cách nào|mua quyển này|thêm nó vào giỏ)$/i.test(
				lower,
			) ||
			lower.includes("mua nó") ||
			lower.includes("mua quyển này") ||
			lower.includes("mua cuốn này") ||
			lower.includes("lấy quyển này") ||
			lower === "mua quyển này" ||
			lower === "mua nó bằng cách nào" ||
			lower === "mua nó";

		const isPurchaseIntent =
			isAnaphoricPurchase ||
			/^(cho tôi mua|mua|đặt mua|lấy cuốn|chốt cuốn|mua ngay|thêm vào giỏ|tôi muốn mua)\s*(.*)/i.test(lower) ||
			lower.includes("cho tôi mua") ||
			lower.includes("mua ngay cuốn") ||
			lower.includes("đặt mua cuốn") ||
			lower.includes("cho mình mua");

		// C. PHẢN HỒI KHẲNG ĐỊNH NGẮN (AFFIRMATION)
		const isShortAffirmation =
			/^(có|dạ có|vâng|ừ|uk|được|muốn|xem|ok|yes|chắc chắn|đồng ý|hứng thú|quan tâm|tiếp tục|nói tiếp|có nhé|có nha)$/i.test(lower) ||
			lower === "có" || lower === "dạ có" || lower === "vâng" || lower === "ừ" || lower === "ok" || lower === "được";

		// D0. Ý ĐỊNH YÊU CẦU LIỆT KÊ / DANH SÁCH TOÀN BỘ TÁC PHẨM HIỆN CÓ (CATALOG_LISTING)
		const isCatalogListInquiry =
			// 1. Chứa từ khóa yêu cầu liệt kê, danh mục, danh sách, kể tên
			lower.includes("liệt kê") ||
			ascii.includes("liet ke") ||
			lower.includes("danh sách các tác phẩm") ||
			lower.includes("danh sách tác phẩm") ||
			lower.includes("danh mục tác phẩm") ||
			lower.includes("danh mục sách") ||
			lower.includes("danh sách sách") ||
			lower.includes("danh sách các cuốn") ||
			lower.includes("kể tên các tác phẩm") ||
			lower.includes("kể tên các cuốn sách") ||
			lower.includes("kể tên sách") ||
			ascii.includes("ke ten") ||
			// 2. Chứa cụm từ hỏi về các tác phẩm / sách hiện có trên hệ thống / kho sách
			lower.includes("các tác phẩm hiện có") ||
			lower.includes("các cuốn sách hiện có") ||
			lower.includes("các đầu sách hiện có") ||
			lower.includes("các ấn phẩm hiện có") ||
			lower.includes("các tác phẩm trong hệ thống") ||
			lower.includes("các tác phẩm của hệ thống") ||
			lower.includes("những tác phẩm hiện có") ||
			lower.includes("những tác phẩm trong hệ thống") ||
			lower.includes("những sách hiện có") ||
			lower.includes("những sách trong hệ thống") ||
			lower.includes("tác phẩm hiện có trong hệ thống") ||
			lower.includes("tác phẩm trong hệ thống") ||
			lower.includes("sách trong hệ thống") ||
			lower.includes("sách hiện có trong hệ thống") ||
			lower.includes("kho sách hiện có") ||
			lower.includes("kho sách có những") ||
			lower.includes("kho sách có gì") ||
			lower.includes("toàn bộ tác phẩm") ||
			lower.includes("tất cả tác phẩm") ||
			lower.includes("tất cả các tác phẩm") ||
			lower.includes("toàn bộ sách") ||
			lower.includes("tất cả sách") ||
			lower.includes("tất cả các sách") ||
			// 3. Câu hỏi về những sách / tác phẩm đang có / đang bán
			lower.includes("có những sách gì") ||
			lower.includes("có những tác phẩm gì") ||
			lower.includes("có những ấn phẩm gì") ||
			lower.includes("có những đầu sách gì") ||
			lower.includes("có những sách nào") ||
			lower.includes("có những tác phẩm nào") ||
			lower.includes("có những ấn phẩm nào") ||
			lower.includes("có những đầu sách nào") ||
			lower.includes("có những cuốn nào") ||
			lower.includes("có những cuốn sách nào") ||
			lower.includes("có những tựa sách nào") ||
			lower.includes("có sách gì") ||
			lower.includes("có tác phẩm gì") ||
			lower.includes("bán những sách gì") ||
			lower.includes("bán những tác phẩm gì") ||
			lower.includes("bên mình có những sách") ||
			lower.includes("bên mình có những tác phẩm") ||
			lower.includes("bên mình có sách gì") ||
			lower.includes("bên mình có tác phẩm gì") ||
			lower.includes("hệ thống có những sách") ||
			lower.includes("hệ thống có những tác phẩm") ||
			lower.includes("hệ thống có những ấn phẩm") ||
			lower.includes("hệ thống đang có những sách") ||
			lower.includes("hệ thống đang có những tác phẩm") ||
			lower.includes("hệ thống hiện có những sách") ||
			lower.includes("hệ thống hiện có những tác phẩm") ||
			lower.includes("bao nhiêu tác phẩm trong hệ thống") ||
			lower.includes("mấy tác phẩm trong hệ thống") ||
			ascii.includes("danh sach tac pham") ||
			ascii.includes("co nhung sach gi") ||
			ascii.includes("co nhung tac pham gi") ||
			ascii.includes("cac tac pham hien co") ||
			ascii.includes("cac tac pham trong he thong") ||
			// 4. Regex tổng quát cho mọi dạng câu hỏi liệt kê danh mục tác phẩm
			/(liệt kê|danh sách|danh mục|kể tên|tổng hợp|cho xem|cho biết|xem)\s*(toàn bộ|tất cả|các|những)?\s*(sách|tác phẩm|đầu sách|ấn phẩm|cuốn sách|tựa sách)/i.test(lower) ||
			/(tác phẩm|sách|đầu sách|ấn phẩm|cuốn sách|tựa sách)\s*(hiện có|đang có|đang bán|trong hệ thống|trên hệ thống|của hệ thống|của shop|ở đây)/i.test(lower) ||
			/(hệ thống|kho sách|bên mình|bên bạn|aurabook|shop|ở đây)\s*(đang\s+)?(có|bán|gồm)\s*(những|các|các loại|toàn bộ)?\s*(sách|tác phẩm|đầu sách|ấn phẩm|cuốn|gì)/i.test(lower) ||
			/(có|bán|gồm)\s*(những|các)?\s*(sách|tác phẩm|đầu sách|ấn phẩm|cuốn|tựa sách)\s*(gì|nào|đang bán|hiện có|trong hệ thống)/i.test(lower) ||
			/^(có những sách gì|có những tác phẩm gì|có sách gì|có tác phẩm gì|danh sách sách|các sách hiện có|sách hiện có|các tác phẩm hiện có|tác phẩm hiện có)$/i.test(lower);

		// D. Ý ĐỊNH TƯ VẤN SÁCH CHUNG (GENERAL_CONSULTATION - Chưa rõ gu đọc)
		const isGeneralConsultation =
			/^(tư vấn|gợi ý|tìm|chọn|mua|giới thiệu)\s*(sách|cuốn sách|sản phẩm|đầu sách)?/i.test(lower) ||
			lower.includes("tư vấn sản phẩm") ||
			lower.includes("tư vấn sách") ||
			lower.includes("gợi ý sách") ||
			lower.includes("có sách gì hay") ||
			lower.includes("sách nào hay") ||
			lower.includes("muốn mua sách") ||
			lower.includes("tư vấn giúp") ||
			lower === "tôi muốn mua sách" ||
			lower === "tư vấn cho tôi" ||
			lower === "tư vấn sách cho tôi" ||
			lower === "tư vấn sách giúp mình" ||
			lower === "gợi ý sách cho tôi";

		// E. CÓ SỞ THÍCH / CHỦ ĐỀ CỤ THỂ
		const hasSpecificPreference =
			lower.includes("tâm lý") ||
			lower.includes("chữa lành") ||
			lower.includes("giao tiếp") ||
			lower.includes("nghệ thuật sống") ||
			lower.includes("thói quen") ||
			lower.includes("kỷ luật") ||
			lower.includes("năng suất") ||
			lower.includes("lịch sử") ||
			lower.includes("loài người") ||
			lower.includes("tiến hóa") ||
			lower.includes("do thái") ||
			lower.includes("trí tuệ") ||
			lower.includes("trí nhớ") ||
			lower.includes("công nghệ") ||
			lower.includes("cong nghe") ||
			ascii.includes("cong nghe") ||
			lower.includes("lập trình") ||
			ascii.includes("lap trinh") ||
			lower.includes("code") ||
			lower.includes("mã sạch") ||
			ascii.includes("ma sach") ||
			lower.includes("phần mềm") ||
			ascii.includes("phan mem") ||
			lower.includes("tin học") ||
			ascii.includes("tin hoc") ||
			lower.includes("tech") ||
			lower.includes("it") ||
			lower.includes("kinh doanh") ||
			lower.includes("kỹ năng") ||
			lower.includes("phát triển bản thân") ||
			lower.includes("đắc nhân tâm") ||
			lower.includes("bốn thỏa ước") ||
			lower.includes("sapiens") ||
			lower.includes("atomic habits") ||
			lower.includes("clean code");

		// F. CÂU HỎI VỀ BẢN QUYỀN DRM READIUM LCP
		const isDrmInquiry =
			lower.includes("bản quyền") ||
			lower.includes("drm") ||
			lower.includes("lcp") ||
			lower.includes("thiết bị") ||
			selectedTopic.includes("Bản quyền");

		// G. CÂU HỎI NỘI DUNG TÁC PHẨM CỤ THỂ (FACTUAL Q&A TỪ GRAPHRAG)
		const isChapterQuestion =
			/(bao nhiêu|mấy|tổng số|danh sách|có các|gồm những)\s*(chương|phần|mục|hồi)/i.test(lower) ||
			/(chương|phần|mục)\s*(nào|gì|đầu|cuối|mấy)/i.test(lower) ||
			lower.includes("mục lục") ||
			lower.includes("bao nhiêu chương") ||
			lower.includes("mấy chương") ||
			lower.includes("bao nhiêu phần") ||
			lower.includes("chia làm mấy");

		const isMetadataQuestion =
			/(ai\s*(viết|sáng tác|là tác giả)|tác giả\s*(là ai|của)|năm\s*(xuất bản|sáng tác|ra mắt)|nhà xuất bản|nxb nào|bao nhiêu\s*(trang|từ)|dài bao nhiêu)/i.test(lower);

		const isContentQuestion =
			(/(nội dung|tóm tắt|nói về|kể về|bài học|nguyên tắc|thỏa ước|thông điệp|ý nghĩa|chủ đề)/i.test(lower) ||
				/(nói gì|viết gì|dạy gì|chia sẻ gì|khuyên gì)/i.test(lower) ||
				/(có hay không|đọc có được không|nói về điều gì)/i.test(lower)) &&
			(!!resolvedNode || !!activeBookSlug || hasSpecificPreference);

		const isFactualQuestion = (isChapterQuestion || isMetadataQuestion || isContentQuestion) && !isPurchaseIntent && !isOrderInquiry;

		// H. Ý ĐỊNH TÌM KIẾM TÊN SÁCH CỤ THỂ (SPECIFIC BOOK SEARCH)
		// Chỉ kích hoạt khi khách thực sự hỏi tìm một đầu sách/tác phẩm cụ thể và KHÔNG PHẢI là câu hỏi liệt kê, câu hỏi đơn hàng, bản quyền hay hỏi đáp chung
		const isBookSearchIntent =
			!isCatalogListInquiry &&
			!isOrderInquiry &&
			!isDrmInquiry &&
			!isGeneralConsultation &&
			(/(có bán|có cuốn|tìm sách|mua sách|tìm cuốn|hỏi sách|bán sách)\s+[a-z0-9]/i.test(lower) ||
				/(có|tìm|mua|hỏi|kiểm tra)\s*(cuốn|quyển|sách|tác phẩm|ấn phẩm|truyện)\s+[a-z0-9]/i.test(lower) ||
				lower.includes("nhà giả kim") ||
				lower.includes("nha gia kim") ||
				lower.includes("harry potter") ||
				lower.includes("rừng na uy") ||
				lower.includes("rung na uy") ||
				lower.includes("tôi tài giỏi") ||
				lower.includes("clean code") ||
				lower.includes("atomic habits") ||
				lower.includes("mã sạch") ||
				lower.includes("thói quen nguyên tử"));

		// ======================================================================
		// 3. TIẾN TRÌNH SUY NGHĨ & XỬ LÝ HÀNH ĐỘNG DỰA TRÊN Ý ĐỊNH
		// ======================================================================

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 0: KẾT THÚC CUỘC GỌI / CẢM ƠN (FAREWELL / END_CALL)
		// ----------------------------------------------------------------------
		if (isFarewell) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Khách hàng cảm ơn / yêu cầu kết thúc cuộc gọi. Chào tạm biệt ấm áp, kết thúc phiên hỗ trợ mà không tiếp tục hỏi thêm.`,
			);

			answer = `Dạ em cảm ơn ${honorific} rất nhiều ạ! Chúc ${honorific} một ngày làm việc thật vui vẻ và có những giờ phút đọc sách thật trọn vẹn tại AuraBook. Bất cứ khi nào cần tìm sách hay kiểm tra đơn hàng, em luôn sẵn sàng hỗ trợ ${honorific}. Em xin phép kết thúc cuộc gọi, tạm biệt ${honorific} ạ! 😊`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 0.1: CHỦ ĐỀ CHƯA CÓ TRONG KHO (HỒ CHÍ MINH / BÁC HỒ)
		// ----------------------------------------------------------------------
		else if (isUncleHoQuery) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Nhận diện truy vấn về Chủ tịch Hồ Chí Minh (chủ đề hiện chưa có trong kho sách). Phản hồi trung thực và gợi ý ấn phẩm lịch sử / văn minh hiện có để tham khảo.`,
			);

			const sapiens = CATALOG.find((b) => b.slug === "sapiens-luoc-su-loai-nguoi");
			if (sapiens) {
				cards.push({ type: "product", data: sapiens });
			}

			answer = `Dạ hiện tại kho sách của AuraBook chưa có ấn phẩm chuyên đề viết trực tiếp về Chủ tịch Hồ Chí Minh ạ. Nếu ${honorific} quan tâm đến các tác phẩm về lịch sử nhân loại hoặc nghệ thuật đối nhân xử thế, em xin phép gợi ý cuốn "Sapiens: Lược Sử Loài Người" của Yuval Noah Harari hoặc "Đắc Nhân Tâm" của Dale Carnegie để ${honorific} tham khảo thêm trong kho sách hiện có nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 0.2: TƯ VẤN 2 CUỐN ĐA LĨNH VỰC (1 LỊCH SỬ & 1 CÔNG NGHỆ)
		// ----------------------------------------------------------------------
		else if (isMultiBookRequest) {
			const historyBook = CATALOG.find((b) => b.slug === "sapiens-luoc-su-loai-nguoi") || CATALOG[2];
			const mindBook = CATALOG.find((b) => b.slug === "tri-tue-do-thai") || CATALOG[3];

			thinkingSteps.push(
				`Aura AI (${llmModel}): Nhận diện nhu cầu tư vấn 2 ấn phẩm đa lĩnh vực (1 Lịch sử/Văn minh & 1 Tư duy/Trí tuệ logic). Chọn "${historyBook.title}" và "${mindBook.title}".`,
			);

			cards.push({ type: "product", data: historyBook });
			cards.push({ type: "product", data: mindBook });

			answer = `Dạ em rất sẵn lòng gợi ý cho ${honorific} 2 ấn phẩm xuất sắc nhất trong kho sách hiện có của AuraBook đại diện cho 2 chủ đề mình đang tìm kiếm ạ:

1. 📜 Về Lịch sử & Văn minh: Cuốn "${historyBook.title}" của Yuval Noah Harari (Bản Ebook: ${historyBook.ebookPrice} / Bản Sách giấy: ${historyBook.physicalPrice}) - kiệt tác tái hiện toàn cảnh hành trình tiến hóa và các cuộc cách mạng nhận thức của loài người.
2. 💡 Về Tư duy & Phương pháp Trí tuệ: Cuốn "${mindBook.title}" của Eran Katz (Bản Ebook: ${mindBook.ebookPrice} / Bản Sách giấy: ${mindBook.physicalPrice}) - khám phá những bí quyết rèn luyện trí nhớ phi thường, tư duy logic và khả năng học tập giải quyết vấn đề đỉnh cao.

Em đã hiển thị thẻ chi tiết của cả 2 cuốn sách ngay bên dưới để ${honorific} tiện tham khảo và đặt mua nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 0.3: LIỆT KÊ TOÀN BỘ DANH MỤC CÁC TÁC PHẨM HIỆN CÓ (CATALOG_LISTING)
		// ----------------------------------------------------------------------
		else if (isCatalogListInquiry) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Nhận diện câu hỏi tổng quan yêu cầu liệt kê các tác phẩm hiện có trong kho sách AuraBook (CATALOG_OVERVIEW).`,
			);

			for (const b of CATALOG) {
				cards.push({ type: "product", data: b });
			}

			answer = `Dạ, hiện tại kho sách của AuraBook đang có sẵn các ấn phẩm tiêu biểu và bán chạy nhất sau đây ạ:

1. 📖 **Đắc Nhân Tâm** của Dale Carnegie (Bản Ebook: ${CATALOG[0].ebookPrice} / Bản Sách giấy: ${CATALOG[0].physicalPrice}) - Cẩm nang kinh điển về giao tiếp, thấu hiểu tâm lý và nghệ thuật thu phục lòng người.
2. 🌿 **Bốn Thỏa Ước** của Don Miguel Ruiz (Bản Ebook: ${CATALOG[1].ebookPrice} / Bản Sách giấy: ${CATALOG[1].physicalPrice}) - Minh triết sống Toltec giúp giải phóng những niềm tin giới hạn và tìm lại bình an nội tâm.
3. 📜 **Sapiens: Lược Sử Loài Người** của Yuval Noah Harari (Bản Ebook: ${CATALOG[2].ebookPrice} / Bản Sách giấy: ${CATALOG[2].physicalPrice}) - Toàn cảnh hành trình tiến hóa và các cuộc cách mạng vĩ đại của nhân loại.
4. 💡 **Trí Tuệ Do Thái** của Eran Katz (Bản Ebook: ${CATALOG[3].ebookPrice} / Bản Sách giấy: ${CATALOG[3].physicalPrice}) - Bí quyết rèn luyện trí nhớ phi thường và tư duy làm giàu sắc bén.

Tất cả tác phẩm đều có sẵn 2 phiên bản: **Bản Sách Điện Tử (Ebook DRM Readium LCP)** đọc trực tiếp trên Web Reader và **Bản Sách Giấy Vật Lý** giao tận nhà. Em đã hiển thị thẻ ấn phẩm chi tiết của toàn bộ các cuốn sách bên dưới để ${honorific} tiện tham khảo và chọn mua nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 1: TRA CỨU ĐƠN HÀNG TRONG CƠ SỞ DỮ LIỆU THỰC TẾ
		// ----------------------------------------------------------------------
		else if (isOrderInquiry) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Tra cứu tiến độ vận chuyển / đơn hàng (ORDER_LOOKUP) cho khách hàng ${honorific}.`,
			);

			const allShipments = getAllGHNShipments();
			let matchedShipment: GHNShipment | null = null;

			// 1. Quét theo mã đơn nếu có số hoặc mã GHN trong câu hỏi
			const explicitCodeMatch = cleanQuery.match(/(?:#|đơn\s+|mã\s+)?(\d{1,8}|GHN[A-Z0-9]+)/i);
			if (explicitCodeMatch) {
				const targetCode = explicitCodeMatch[1];
				matchedShipment = getGHNShipmentByOrder(targetCode) ||
					allShipments.find((s) => s.orderNumber === targetCode || s.orderId === targetCode || s.trackingCode.toLowerCase() === targetCode.toLowerCase()) ||
					null;
			}

			// 2. Quét theo Số điện thoại khách hàng nếu chưa thấy
			if (!matchedShipment && phone) {
				const cleanPhoneDigits = phone.replace(/\D/g, "").slice(-9);
				matchedShipment = allShipments.find((s) => s.recipient.phone.replace(/\D/g, "").includes(cleanPhoneDigits)) || null;
			}

			// 3. Quét theo Tên khách hàng (ví dụ: Duy, Duy Bas, Duy Nguyễn)
			if (!matchedShipment && name) {
				const nameLower = name.toLowerCase();
				const matchingByName = allShipments.filter((s) => {
					const rName = s.recipient.name.toLowerCase();
					return rName.includes(nameLower) || nameLower.split(/\s+/).some((part: string) => part.length >= 2 && rName.includes(part));
				});
				if (matchingByName.length > 0) {
					// Lấy đơn hàng mới nhất
					matchedShipment = matchingByName[0];
				}
			}

			// 4. Nếu khách hàng hỏi "đơn hàng gần nhất của tôi" và hệ thống có các đơn gần đây, lấy đơn mới nhất
			if (!matchedShipment && (lower.includes("gần nhất") || lower.includes("vừa đặt") || lower.includes("của tôi")) && allShipments.length > 0) {
				matchedShipment = allShipments[0];
			}

			// NẾU TÌM THẤY ĐƠN HÀNG HỢP LỆ TRONG CƠ SỞ DỮ LIỆU
			if (matchedShipment) {
				thinkingSteps.push(
					`Aura AI (${llmModel}): Xác thực vận đơn #${matchedShipment.orderNumber} (${matchedShipment.trackingCode}). Trạng thái: "${matchedShipment.statusDisplay}".`,
				);

				const estDateStr = matchedShipment.estimatedDeliveryDate
					? new Date(matchedShipment.estimatedDeliveryDate).toLocaleDateString("vi-VN", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
					})
					: "24 đến 48 giờ tới";

				const destAddress = matchedShipment.recipient.address
					? `${matchedShipment.recipient.address}, ${matchedShipment.recipient.district}`
					: "địa chỉ đã đăng ký";

				answer = `Dạ em chào ${honorific}! Em đã kiểm tra trên hệ thống vận đơn GHN rồi ạ. Đơn hàng gần nhất của ${honorific} là đơn #${matchedShipment.orderNumber} (Mã vận đơn: ${matchedShipment.trackingCode}), gồm ${matchedShipment.itemsSummary}. Hiện kiện hàng đang ở trạng thái "${matchedShipment.statusDisplay}" và dự kiến sẽ được giao đến ${destAddress} vào ngày ${estDateStr} ạ!`;

				cards.push({
					type: "order",
					data: {
						orderCode: matchedShipment.orderNumber || matchedShipment.orderId,
						status: matchedShipment.statusDisplay || "Đang vận chuyển",
						statusStep: matchedShipment.status === "delivered" ? 4 : matchedShipment.status === "delivering" ? 3 : matchedShipment.status === "storing" ? 2 : 1,
						carrier: matchedShipment.carrier || "Giao Hàng Nhanh (GHN)",
						trackingCode: matchedShipment.trackingCode,
						estimate: `Dự kiến: ${estDateStr}`,
						items: matchedShipment.itemsSummary || "Đơn hàng sách AuraBook",
						total: `${new Intl.NumberFormat("vi-VN").format((matchedShipment.fee || 22000) + (matchedShipment.codAmount || 118000))}₫`,
					},
				});
			} else {
				// NẾU KHÔNG TÌM THẤY ĐƠN HÀNG -> HỎI LẠI NGƯỜI DÙNG CÓ CƠ SỞ (CLARIFICATION)
				thinkingSteps.push(
					`Aura AI (${llmModel}): Chưa xác định được đơn hàng liên kết. Hướng dẫn khách hàng cung cấp mã đơn hoặc số điện thoại đặt hàng.`,
				);

				answer = `Dạ em chào ${honorific} ạ! Em rất sẵn lòng hỗ trợ tra cứu đơn hàng cho mình. Để em có thể tìm chính xác đơn hàng gần nhất của ${honorific} trên hệ thống, ${honorific} có thể cung cấp thêm Mã đơn hàng (ví dụ: #9) hoặc Số điện thoại khi đặt hàng giúp em được không ạ?`;
			}
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 2: TƯ VẤN SÁCH CHUNG (CHƯA RÕ GU ĐỌC CỦA KHÁCH HÀNG)
		// ----------------------------------------------------------------------
		else if (isGeneralConsultation && !hasSpecificPreference && !resolvedNode) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Khách hàng yêu cầu tư vấn nhưng chưa rõ thể loại đọc. Lắng nghe và gợi mở các chủ đề tiêu biểu (công nghệ lập trình, tâm lý học, lịch sử, kỹ năng).`,
			);

			answer = `Dạ em chào ${honorific} ạ! Em rất sẵn lòng tư vấn cho mình. Để em có thể gợi ý chính xác những ấn phẩm phù hợp nhất, ${honorific} có thể chia sẻ giúp em là mình đang quan tâm đến thể loại nào (như lập trình công nghệ, tâm lý học, lịch sử hay phát triển bản thân) và mục tiêu đọc của mình đợt này là gì không ạ?`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 3: Ý ĐỊNH MUA HÀNG (PURCHASE INTENT)
		// ----------------------------------------------------------------------
		else if (isPurchaseIntent) {
			const targetSlug = currentBookSlug || "dac-nhan-tam";
			const b = CATALOG.find((c) => c.slug === targetSlug) || CATALOG[0];

			thinkingSteps.push(
				`Aura AI (${llmModel}): Tiếp nhận ý định đặt mua ấn phẩm "${b.title}" (${b.author}).`,
			);

			cards.push({ type: "product", data: b });
			answer = `Dạ em đã chuẩn bị cuốn "${b.title}" cho ${honorific} rồi ạ. Sách hiện có 2 phiên bản chuẩn giá: Bản Sách Điện Tử (${b.ebookPrice}) đọc ngay trên Web Reader và Bản Sách Vật Lý (${b.physicalPrice}) giao tận nhà. ${honorific} chọn phiên bản ưng ý và bấm nút "Thêm vào giỏ" ở thẻ sản phẩm hiển thị ngay bên dưới để hoàn tất nhé!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 4: PHẢN HỒI ĐỒNG Ý / KHẲNG ĐỊNH NGẮN ("CÓ", "VÂNG", "OK")
		// ----------------------------------------------------------------------
		else if (isShortAffirmation) {
			const targetSlug = currentBookSlug || "dac-nhan-tam";
			const b = CATALOG.find((c) => c.slug === targetSlug) || CATALOG[0];

			thinkingSteps.push(
				`Aura AI (${llmModel}): Khách hàng xác nhận quan tâm. Giới thiệu chi tiết 2 phiên bản của "${b.title}".`,
			);

			cards.push({ type: "product", data: b });
			answer = `Dạ, cuốn sách bán chạy hàng đầu tại AuraBook chính là "${b.title}" của tác giả ${b.author}. Tác phẩm có 2 phiên bản: Bản Sách Điện Tử (${b.ebookPrice}) đọc ngay trên Web Reader có bản quyền DRM và Bản Sách Vật Lý (${b.physicalPrice}) giao tận nhà. Em đã hiển thị thẻ ấn phẩm chi tiết bên dưới, ${honorific} muốn chọn phiên bản nào ạ?`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 5: CÂU HỎI VỀ BẢN QUYỀN DRM & WEB READER
		// ----------------------------------------------------------------------
		else if (isDrmInquiry) {
			thinkingSteps.push(
				`Aura AI (${llmModel}): Hướng dẫn về tiêu chuẩn bảo vệ bản quyền Readium LCP DRM và trải nghiệm Web Reader.`,
			);

			cards.push({
				type: "drm",
				data: {
					standard: "Readium LCP (Licensed Content Protection)",
					singleTabLock: "Bảo vệ đọc đơn tab chống sao chép trái phép",
					maxDevices: "Tối đa 6 thiết bị cá nhân",
					formats: "EPUB chuẩn định dạng linh hoạt & PDF độ phân giải cao",
					licenseStatus: "Giấy phép vĩnh viễn (Lifetime Access)",
				},
			});

			answer = `Dạ, tất cả sách điện tử tại AuraBook đều được bảo vệ nghiêm ngặt bằng công nghệ bản quyền Readium LCP DRM tiêu chuẩn quốc tế. ${honorific} có thể an tâm đọc trực tiếp trên Web Reader với tài khoản đã đăng ký trên tối đa 6 thiết bị cá nhân ạ!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 6: CÂU HỎI NỘI DUNG TÁC PHẨM CỤ THỂ (FACTUAL Q&A TỪ GRAPHRAG)
		// ----------------------------------------------------------------------
		else if (isFactualQuestion) {
			const targetSlug = currentBookSlug || "dac-nhan-tam";
			const b = CATALOG.find((c) => c.slug === targetSlug) || CATALOG[0];
			const graphRAGQuery = graphRAGStore.queryGraphRAG(cleanQuery, targetSlug);

			thinkingSteps.push(
				`Aura AI (${llmModel}): Truy vấn tri thức GraphRAG & vector chunks của ấn phẩm "${b.title}".`,
			);

			cards.push({ type: "product", data: b });

			const totalChaps = graphRAGQuery.totalChapters || 38;
			const wordsStr = graphRAGQuery.totalWords ? graphRAGQuery.totalWords.toLocaleString("vi-VN") : "hơn 70.000";

			if (isChapterQuestion) {
				answer = `Dạ, cuốn sách "${b.title}" của tác giả ${b.author} có tổng cộng ${totalChaps} chương/mục (khoảng ${wordsStr} từ) được số hóa chuẩn xác từ bản EPUB gốc trên AuraBook ạ. [Trích dẫn: Mục lục ${b.title}].`;
			} else if (isMetadataQuestion) {
				answer = `Dạ, tác phẩm "${b.title}" được sáng tác bởi tác giả ${b.author}, phát hành chuẩn bản quyền trên nền tảng AuraBook ạ.`;
			} else if (graphRAGQuery.relevantChunks && graphRAGQuery.relevantChunks.length > 0) {
				const topChunk = graphRAGQuery.relevantChunks[0].chunk;
				answer = `Dạ, theo nội dung tác phẩm "${b.title}", trong "${topChunk.chapterTitle}": "${topChunk.content.slice(0, 160).trim()}..." [Trích dẫn: ${topChunk.chapterTitle}].`;
			} else {
				answer = `Dạ, tác phẩm "${b.title}" của ${b.author}: ${b.description} Em có thể chia sẻ cụ thể hơn về bất kỳ chương nào mà ${honorific} quan tâm ạ!`;
			}
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 7: TÌM KIẾM THEO CHỦ ĐỀ HOẶC TỪ KHÓA SÁCH CỤ THỂ
		// ----------------------------------------------------------------------
		else if (hasSpecificPreference || resolvedNode || isBookSearchIntent) {
			const isAtomicHabitsQuery =
				lower.includes("thói quen nguyên tử") ||
				lower.includes("thoi quen nguyen tu") ||
				ascii.includes("thoi quen nguyen tu") ||
				lower.includes("atomic habits") ||
				lower.includes("james clear");

			const isCleanCodeQuery =
				lower.includes("clean code") ||
				lower.includes("mã sạch") ||
				ascii.includes("ma sach") ||
				lower.includes("robert c. martin") ||
				lower.includes("uncle bob");

			// Xử lý trung thực và chu đáo khi khách hỏi 2 ấn phẩm không có trong hệ thống
			if (isAtomicHabitsQuery) {
				const bonThoaUoc = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || CATALOG[1];
				thinkingSteps.push(
					`Aura AI (${llmModel}): Nhận diện truy vấn sách "Thói Quen Nguyên Tử" (chưa có trong kho). Tư vấn trung thực và đề xuất giải pháp thay thế phù hợp nhất "${bonThoaUoc.title}".`,
				);
				cards.push({ type: "product", data: bonThoaUoc });
				answer = `Dạ hiện tại kho sách AuraBook chưa có ấn phẩm "Thói Quen Nguyên Tử" (Atomic Habits) ạ. Tuy nhiên, nếu ${honorific} muốn tìm kiếm giải pháp rèn luyện kỷ luật nội tâm, làm chủ tâm trí và xây dựng những thói quen tinh thần tích cực, em xin phép gợi ý cuốn kinh điển "${bonThoaUoc.title}" của Don Miguel Ruiz (Bản Ebook: ${bonThoaUoc.ebookPrice} / Sách giấy: ${bonThoaUoc.physicalPrice}) để ${honorific} tham khảo nhé ạ!`;
			} else if (isCleanCodeQuery) {
				const triTueDoThai = CATALOG.find((b) => b.slug === "tri-tue-do-thai") || CATALOG[3];
				thinkingSteps.push(
					`Aura AI (${llmModel}): Nhận diện truy vấn sách "Clean Code" (chưa có trong kho). Tư vấn trung thực và đề xuất giải pháp rèn luyện tư duy logic "${triTueDoThai.title}".`,
				);
				cards.push({ type: "product", data: triTueDoThai });
				answer = `Dạ hiện tại kho sách AuraBook chưa phân phối cuốn "Clean Code" (Mã Sạch) của Robert C. Martin ạ. Tuy nhiên, nếu ${honorific} quan tâm đến tư duy logic sắc bén, kỹ năng giải quyết vấn đề và phương pháp rèn luyện trí nhớ đỉnh cao (rất phù hợp và hữu ích cho người làm công nghệ), em xin phép gợi ý cuốn "${triTueDoThai.title}" của Eran Katz (Bản Ebook: ${triTueDoThai.ebookPrice} / Sách giấy: ${triTueDoThai.physicalPrice}) nhé ạ!`;
			} else {
				let matchedBook: BookProduct | null = null;
				if (lower.includes("đắc nhân tâm") || (lower.includes("giao tiếp") && !lower.includes("kỹ năng")) || lower.includes("ứng xử") || lower.includes("thấu hiểu")) {
					matchedBook = CATALOG.find((b) => b.slug === "dac-nhan-tam") || null;
				} else if (lower.includes("bốn thỏa ước") || lower.includes("tâm lý") || lower.includes("chữa lành") || lower.includes("toltec") || lower.includes("thói quen") || lower.includes("kỷ luật")) {
					matchedBook = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || null;
				} else if (lower.includes("sapiens") || lower.includes("lịch sử") || lower.includes("tiến hóa") || lower.includes("loài người") || lower.includes("văn minh")) {
					matchedBook = CATALOG.find((b) => b.slug === "sapiens-luoc-su-loai-nguoi") || null;
				} else if (lower.includes("do thái") || lower.includes("trí tuệ do thái") || lower.includes("trí nhớ") || lower.includes("tư duy") || lower.includes("logic") || lower.includes("eran katz") || lower.includes("công nghệ") || lower.includes("cong nghe") || lower.includes("lập trình") || lower.includes("lap trinh")) {
					matchedBook = CATALOG.find((b) => b.slug === "tri-tue-do-thai") || null;
				} else if (resolvedNode) {
					matchedBook = CATALOG.find((b) => b.slug === resolvedNode.properties.slug) || null;
				}

				if (matchedBook) {
					thinkingSteps.push(
						`Aura AI (${llmModel}): Nhận diện nhu cầu tư vấn chủ đề "${matchedBook.badge}". Khởi tạo đề xuất tác phẩm "${matchedBook.title}" (${matchedBook.author}).`,
					);

					cards.push({ type: "product", data: matchedBook });

					let categoryName = matchedBook.badge || "sách hay";
					if (matchedBook.slug === "sapiens-luoc-su-loai-nguoi") categoryName = "lịch sử và văn minh loài người";
					else if (matchedBook.slug === "dac-nhan-tam") categoryName = "nghệ thuật giao tiếp và đối nhân xử thế";
					else if (matchedBook.slug === "bon-thoa-uoc") categoryName = "tâm lý học và minh triết cuộc sống";
					else if (matchedBook.slug === "tri-tue-do-thai") categoryName = "trí tuệ và phương pháp tư duy";

					const systemPrompt = `Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu ấm áp, ân cần, tự nhiên và chuyên nghiệp. Xưng là "em" và gọi khách hàng là "${honorific}". Trả lời tự nhiên, súc tích trong 2-3 câu ngắn. Giới thiệu ấn phẩm "${matchedBook.title}" của tác giả ${matchedBook.author} thuộc lĩnh vực ${categoryName} (có Bản Ebook Sách Điện Tử ${matchedBook.ebookPrice} và Bản Sách Giấy Vật Lý ${matchedBook.physicalPrice}), hướng dẫn khách xem thẻ ấn phẩm chi tiết ngay bên dưới để chọn phiên bản và mua sách.`;

					const llmAnswer = await queryLLM({
						model: llmModel,
						provider: llmProvider,
						apiKey: llmApiKey,
						baseUrl: llmBaseUrl,
						prompt: `Khách hàng ${honorific} vừa nói: "${cleanQuery}". Hãy tư vấn giới thiệu cuốn "${matchedBook.title}" của tác giả ${matchedBook.author} đúng với lĩnh vực ${categoryName} cho khách một cách tự nhiên, hấp dẫn.`,
						systemPrompt,
						timeoutMs: 15000,
					});

					if (llmAnswer && llmAnswer.length > 20) {
						answer = llmAnswer;
					} else {
						answer = `Dạ, đúng với sự quan tâm của ${honorific} về lĩnh vực ${categoryName}, em xin gợi ý cuốn sách kinh điển "${matchedBook.title}" của tác giả ${matchedBook.author}. Tác phẩm hiện có 2 phiên bản phát hành chuẩn giá: Bản Sách Điện Tử (${matchedBook.ebookPrice}) đọc ngay trên Web Reader có bản quyền DRM và Bản Sách Vật Lý (${matchedBook.physicalPrice}) giao tận nhà. Em đã hiển thị thẻ ấn phẩm chi tiết ngay bên dưới để ${honorific} tiện tham khảo và đặt mua nhé ạ!`;
					}
				} else {
					// Thử tìm kiếm qua Saleor hoặc GraphRAG context
					const liveBooks = await searchSaleorProducts(cleanQuery);
					if (liveBooks.length > 0) {
						const b = liveBooks[0];
						cards.push({ type: "product", data: b });
						answer = `Dạ, em tìm thấy ấn phẩm "${b.title}" rất phù hợp với từ khóa của ${honorific}. Sách có 2 phiên bản Sách Điện Tử (${b.ebookPrice}) và Sách Vật Lý (${b.physicalPrice}) trên AuraBook ạ!`;
					} else {
						// NGUYÊN TẮC BẢO ĐẢM DỮ LIỆU CƠ SỞ DỮ LIỆU (ANTI-HALLUCINATION GUARDRAIL):
						// Trích xuất cụm từ nghi vấn là tên sách từ câu hỏi của khách
						let extractedBookName = cleanQuery
							.replace(/^(shop|bên\s+mình|bên\s+bạn|ad|bạn|hệ\s+thống|ở\s+đây|aurabook)?\s*(có\s+)?(bán\s+)?(cuốn\s+sách|sách|quyển\s+sách|quyển|cuốn|tác\s+phẩm|ấn\s+phẩm)\s*/i, "")
							.replace(/[\?\.!]+$/g, "")
							.replace(/\s*(không|k|ko|hả|ạ|nào|thế|vậy)+$/i, "")
							.replace(/[\?\.!]+$/g, "")
							.trim();

						const isCatalogOrSystemOverview =
							isCatalogListInquiry ||
							/^(trong hệ thống|trên hệ thống|hệ thống|hiện có|đang có|đang bán|ở đây|của shop|của bạn|kho sách|các tác phẩm|tác phẩm|sách|các cuốn sách|ấn phẩm|đầu sách|sách gì|tác phẩm gì|gì|nào|những sách gì|những tác phẩm gì|liệt kê|kể tên|danh sách|danh mục)$/i.test(extractedBookName.trim()) ||
							(/(trong hệ thống|hệ thống|hiện có|đang có|ở đây|kho sách|tác phẩm|sách|ấn phẩm)/i.test(cleanQuery) && /(có những|có gì|những gì|gồm những|là gì)/i.test(cleanQuery)) ||
							extractedBookName.length < 2;

						const isSubjectiveOrPopularQuery =
							/(hay nhất|bán chạy|nổi tiếng|phổ biến|được đọc nhiều|thích hợp|phù hợp|khuyên đọc|đáng đọc|tốt nhất)/i.test(cleanQuery);

						const isInformationalQuestion =
							/(thế nào|làm sao|tại sao|như thế nào|bao lâu|khi nào|được không|có được không|hướng dẫn|quy trình|chính sách|thanh toán|đổi trả|đăng ký|tài khoản)/i.test(cleanQuery);

						if (isCatalogOrSystemOverview) {
							// Khách hàng hỏi danh mục / tổng quan sách hiện có trong hệ thống
							for (const b of CATALOG) {
								cards.push({ type: "product", data: b });
							}
							answer = `Dạ, hiện tại kho sách của AuraBook đang có sẵn các ấn phẩm tiêu biểu và bán chạy nhất sau đây ạ:

1. 📖 **Đắc Nhân Tâm** của Dale Carnegie (Bản Ebook: ${CATALOG[0].ebookPrice} / Bản Sách giấy: ${CATALOG[0].physicalPrice})
2. 🌿 **Bốn Thỏa Ước** của Don Miguel Ruiz (Bản Ebook: ${CATALOG[1].ebookPrice} / Bản Sách giấy: ${CATALOG[1].physicalPrice})
3. 📜 **Sapiens: Lược Sử Loài Người** của Yuval Noah Harari (Bản Ebook: ${CATALOG[2].ebookPrice} / Bản Sách giấy: ${CATALOG[2].physicalPrice})
4. 💡 **Trí Tuệ Do Thái** của Eran Katz (Bản Ebook: ${CATALOG[3].ebookPrice} / Bản Sách giấy: ${CATALOG[3].physicalPrice})

Tất cả tác phẩm đều có sẵn Bản Ebook DRM đọc ngay và Sách Giấy giao tận nhà. Em đã hiển thị thẻ ấn phẩm bên dưới, ${honorific} muốn tìm hiểu cuốn nào ạ?`;
						} else if (isSubjectiveOrPopularQuery) {
							// Khách hỏi sách nào hay nhất, bán chạy nhất
							const topBook = CATALOG[0];
							const secondBook = CATALOG[2];
							cards.push({ type: "product", data: topBook });
							cards.push({ type: "product", data: secondBook });
							answer = `Dạ, hai ấn phẩm được đông đảo độc giả yêu thích và đón nhận nhiều nhất tại AuraBook hiện nay là cuốn "${topBook.title}" của Dale Carnegie (nghệ thuật giao tiếp và thấu hiểu lòng người) và kiệt tác "${secondBook.title}" của Yuval Noah Harari (toàn cảnh lịch sử văn minh nhân loại). Cả hai đều có sẵn Bản Ebook DRM đọc ngay và Bản Sách Giấy giao tận nhà. Em đã hiển thị thẻ ấn phẩm bên dưới để ${honorific} tiện tham khảo nhé ạ!`;
						} else if (isInformationalQuestion) {
							// Là câu hỏi giải thích / quy trình / thông tin -> để ngỏ để LLM (Gemma 2) trả lời tự nhiên ở TRƯỜNG HỢP 8
							answer = "";
						} else {
							// NGUYÊN TẮC BẢO ĐẢM DỮ LIỆU CƠ SỞ DỮ LIỆU (ANTI-HALLUCINATION GUARDRAIL):
							// Khách hàng thực sự tìm kiếm một tên sách cụ thể không có trong kho sách
							let suggestedBook: BookProduct = CATALOG[0]; // Mặc định Đắc Nhân Tâm
							let relatedTopic = "kỹ năng giao tiếp và đối nhân xử thế";

							if (
								lower.includes("nhà giả kim") ||
								lower.includes("nha gia kim") ||
								lower.includes("tâm lý") ||
								lower.includes("chữa lành") ||
								lower.includes("tinh thần") ||
								lower.includes("cảm xúc") ||
								lower.includes("nội tâm") ||
								lower.includes("hạnh phúc") ||
								lower.includes("thiền") ||
								lower.includes("thói quen")
							) {
								suggestedBook = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || CATALOG[1];
								relatedTopic = "tâm lý học và minh triết sống";
							} else if (
								lower.includes("harry potter") ||
								lower.includes("lịch sử") ||
								lower.includes("văn minh") ||
								lower.includes("tiến hóa") ||
								lower.includes("loài người") ||
								lower.includes("khoa học") ||
								lower.includes("xã hội") ||
								lower.includes("thế giới")
							) {
								suggestedBook = CATALOG.find((b) => b.slug === "sapiens-luoc-su-loai-nguoi") || CATALOG[2];
								relatedTopic = "lịch sử và văn minh nhân loại";
							} else if (
								lower.includes("kinh doanh") ||
								lower.includes("làm giàu") ||
								lower.includes("tiền") ||
								lower.includes("tài chính") ||
								lower.includes("trí nhớ") ||
								lower.includes("tư duy") ||
								lower.includes("logic") ||
								lower.includes("công nghệ") ||
								lower.includes("lập trình")
							) {
								suggestedBook = CATALOG.find((b) => b.slug === "tri-tue-do-thai") || CATALOG[3];
								relatedTopic = "trí tuệ, rèn luyện tư duy và làm giàu";
							}

							thinkingSteps.push(
								`Aura AI (${llmModel}): Kiểm tra cơ sở dữ liệu Saleor & CATALOG: Không tìm thấy ấn phẩm "${extractedBookName}". Kích hoạt Anti-Hallucination Guardrail: Xác nhận trung thực chưa có và đề xuất sách hiện có cùng chủ đề "${suggestedBook.title}" (${relatedTopic}).`,
							);

							cards.push({ type: "product", data: suggestedBook });

							answer = `Dạ hiện tại kho sách của AuraBook chưa có ấn phẩm "${extractedBookName}" trong hệ thống cơ sở dữ liệu ạ. Tuy nhiên, nếu ${honorific} quan tâm đến các tác phẩm cùng chủ đề ${relatedTopic}, em xin phép gợi ý cuốn "${suggestedBook.title}" của tác giả ${suggestedBook.author} (Bản Ebook: ${suggestedBook.ebookPrice} / Bản Sách giấy: ${suggestedBook.physicalPrice}) hiện đang có sẵn trên hệ thống để ${honorific} tham khảo nhé ạ!`;
						}
					}
				}
			}
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 8: CÂU HỎI MỞ / TƯ VẤN THÊM BẰNG MÔ HÌNH LLM
		// ----------------------------------------------------------------------
		if (!answer) {
			const systemPrompt = `Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu ấm áp, lịch sự, ân cần. Luôn xưng "em" và gọi khách hàng là "${honorific}".

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG BỊA ĐẶT / ZERO-HALLUCINATION):
1. Dữ liệu sách và sản phẩm PHẢI 100% dựa trên cơ sở dữ liệu thực tế của AuraBook (kho sách hiện có 4 tác phẩm tiêu biểu: Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens: Lược Sử Loài Người, Trí Tuệ Do Thái).
2. Nếu khách hàng hỏi bất kỳ cuốn sách, tác giả hoặc sản phẩm nào KHÔNG CÓ trong cơ sở dữ liệu trên, bạn BẮT BUỘC phải nói rõ là hệ thống AuraBook hiện chưa có cuốn sách đó, tuyệt đối KHÔNG ĐƯỢC tự bịa đặt thông tin, giá tiền hay bản quyền.
3. Nếu cùng chủ đề với điều khách tìm, bạn hãy gợi ý các ấn phẩm hiện có trong hệ thống (như Đắc Nhân Tâm cho kỹ năng giao tiếp, Bốn Thỏa Ước cho tâm lý chữa lành, Sapiens cho lịch sử nhân loại, Trí Tuệ Do Thái cho tư duy kinh doanh).`;

			const llmFallback = await queryLLM({
				model: llmModel,
				provider: llmProvider,
				apiKey: llmApiKey,
				baseUrl: llmBaseUrl,
				prompt: `Khách hàng ${honorific} vừa nói: "${cleanQuery}". Hãy phản hồi ân cần, tự nhiên và hỗ trợ khách.`,
				systemPrompt,
				timeoutMs: 15000,
			});

			if (llmFallback && llmFallback.length > 15) {
				answer = llmFallback;
			} else {
				answer = `Dạ em chào ${honorific} ạ! Em là Aura AI - Chuyên viên tư vấn của AuraBook. Em rất sẵn lòng hỗ trợ mình. ${honorific} có thể chia sẻ cụ thể hơn giúp em là mình đang quan tâm đến thể loại sách nào (như tâm lý học, lịch sử văn minh, trí tuệ tư duy hay nghệ thuật giao tiếp) hoặc cần tra cứu đơn hàng để em phục vụ mình tốt nhất nhé ạ!`;
			}

			thinkingSteps.push(
				`Aura AI (${llmModel}): Tiếp nhận câu hỏi mở từ khách hàng và tương tác phản hồi tự nhiên (đảm bảo Grounding cơ sở dữ liệu).`,
			);
		}

		// Tự động thêm lời cảm ơn đã kiên nhẫn chờ kiểm tra hệ thống / cơ sở dữ liệu nếu là câu hỏi tra cứu
		const isCasualSmallTalk = isFarewell || /^(xin chào|chào em|chào bạn|hello|hi|alo|a lô|bạn là ai|em là ai)$/i.test(lower.trim());
		const hasThankYouForWaiting = answer.toLowerCase().includes("cảm ơn") && (answer.toLowerCase().includes("đã đợi") || answer.toLowerCase().includes("đã chờ"));

		if (!isCasualSmallTalk && !hasThankYouForWaiting) {
			const thankPrefixes = [
				`Dạ, cảm ơn ${honorific} đã đợi em kiểm tra hệ thống ạ! `,
				`Dạ em đã kiểm tra xong cho mình rồi, cảm ơn ${honorific} đã đợi em nhé ạ! `,
				`Dạ, cảm ơn ${honorific} đã kiên nhẫn chờ em đối chiếu dữ liệu ạ! `,
				`Dạ, em cảm ơn ${honorific} đã đợi em tra cứu trên hệ thống ạ! `,
			];
			const thankPrefix = thankPrefixes[Math.floor(Math.random() * thankPrefixes.length)];
			if (answer.startsWith("Dạ, ") || answer.startsWith("Dạ em ") || answer.startsWith("Dạ hiện ")) {
				answer = `${thankPrefix}${answer.slice(0, 1).toLowerCase() + answer.slice(1)}`;
			} else {
				answer = `${thankPrefix}${answer}`;
			}
		}

		const activeVoice = ttsVoice || (voice && voice.trim()) || "vi_VN-hoaimy-aurabook";

		// Tạo âm thanh TTS nếu là cuộc gọi thoại (CALL)
		let audioBase64 = "";
		if (contactMethod === "call") {
			try {
				let cleanSpeakText = answer
					.replace(/\*\*\[.*?\]\*\*/g, "")
					.replace(/\[.*?\]/g, "")
					.replace(/[\*#_`]/g, "")
					.replace(/\s+/g, " ")
					.trim();

				// TỐI ƯU TỐC ĐỘ PHẢN HỒI GIỌNG NÓI (FAST VOICE UX):
				// Nếu câu trả lời danh mục hoặc văn bản quá dài (> 280 ký tự), rút gọn câu đọc cho TTS xử lý siêu tốc dưới 1.5 giây,
				// trong khi toàn bộ nội dung chi tiết và 4 thẻ sản phẩm vẫn hiển thị trọn vẹn trên màn hình.
				if (isCatalogListInquiry || cleanSpeakText.length > 280) {
					if (isCatalogListInquiry) {
						cleanSpeakText = `Dạ, cảm ơn ${honorific} đã đợi em tra cứu! Hiện tại kho sách AuraBook có 4 tác phẩm tiêu biểu gồm Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens Lược Sử Loài Người và Trí Tuệ Do Thái. Cả 4 ấn phẩm đều có sẵn bản Ebook DRM và sách giấy giao tận nơi. Em đã gửi thẻ chi tiết ngay trên màn hình để ${honorific} tiện chọn nhé ạ!`;
					} else if (cleanSpeakText.length > 320) {
						const sentences = cleanSpeakText.split(/(?<=[.?!])\s+/);
						if (sentences.length > 2) {
							cleanSpeakText = sentences.slice(0, 2).join(" ");
						}
					}
				}

				const ttsUrl = process.env.PIPER_TTS_URL || "http://127.0.0.1:5050/api/tts";
				const ttsRes = await fetch(ttsUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: cleanSpeakText, speed: ttsSpeed, voice: activeVoice, format: "base64" }),
					signal: AbortSignal.timeout(20000),
				});
				if (ttsRes.ok) {
					const ttsData = (await ttsRes.json()) as any;
					audioBase64 = ttsData.audioBase64 || "";
				}
			} catch (ttsErr) {
				console.warn("[VoiceAgent Chat] Lỗi kết nối TTS Server:", ttsErr);
			}
		}

		const thinkingText = thinkingSteps.join("\n");

		return NextResponse.json({
			text: answer,
			thinking: thinkingText || null,
			audioBase64,
			cards,
			topic: selectedTopic,
			activeModel: llmModel,
			activeVoice,
			activeBookSlug: currentBookSlug || activeBookSlug || null,
			timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
		});
	} catch (error) {
		console.error("[VoiceAgent Chat Route Error]:", error);
		return NextResponse.json({ error: "Lỗi xử lý tin nhắn" }, { status: 500 });
	}
}
