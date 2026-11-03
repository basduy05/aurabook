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

export const CATALOG: BookProduct[] = [
	{
		id: "UHJvZHVjdDox",
		title: "Đắc Nhân Tâm",
		originalTitle: "How to Win Friends and Influence People",
		author: "Dale Carnegie",
		price: "59.000₫",
		originalPrice: "118.000₫",
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
			{ id: "ed-dac-nhan-tam-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-DAC-NHAN-TAM", price: "59.000₫" },
			{ id: "ed-dac-nhan-tam-physical", name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)", type: "physical", sku: "VT-DAC-NHAN-TAM", price: "118.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoy",
		title: "Bốn Thỏa Ước",
		originalTitle: "The Four Agreements",
		author: "Don Miguel Ruiz",
		price: "49.000₫",
		originalPrice: "98.000₫",
		ebookPrice: "49.000₫",
		physicalPrice: "98.000₫",
		rating: 4.9,
		reviewCount: 890,
		coverImage: "/products/book-bon-thoa-uoc-cover.jpg",
		readerUrl: "/reader/bon-thoa-uoc",
		slug: "bon-thoa-uoc",
		badge: "Minh triết sống",
		description: "Triết lý Toltec khai sáng giúp bạn thoát khỏi những niềm tin giới hạn và tìm thấy tự do đích thực.",
		variants: [
			{ id: "ed-bon-thoa-uoc-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-BON-THOA-UOC", price: "49.000₫" },
			{ id: "ed-bon-thoa-uoc-physical", name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)", type: "physical", sku: "VT-BON-THOA-UOC", price: "98.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoz",
		title: "Sapiens: Lược Sử Loài Người",
		originalTitle: "A Brief History of Humankind",
		author: "Yuval Noah Harari",
		price: "89.000₫",
		originalPrice: "189.000₫",
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
			{ id: "ed-sapiens-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-SAPIENS", price: "89.000₫" },
			{ id: "ed-sapiens-physical", name: "Bản Sách Giấy (Bìa Cứng Tuyển Chọn)", type: "physical", sku: "VT-SAPIENS", price: "189.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo0",
		title: "Trí Tuệ Do Thái",
		originalTitle: "Jerome Becomes a Genius",
		author: "Eran Katz",
		price: "69.000₫",
		originalPrice: "135.000₫",
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
			{ id: "ed-tri-tue-do-thai-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-TRI-TUE-DO-THAI", price: "69.000₫" },
			{ id: "ed-tri-tue-do-thai-physical", name: "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)", type: "physical", sku: "VT-TRI-TUE-DO-THAI", price: "135.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo1",
		title: "10 Điều Tạo Nên Số Phận",
		originalTitle: "The Ten Commitments",
		author: "David Simon, M.D",
		price: "49.000₫",
		originalPrice: "98.000₫",
		ebookPrice: "49.000₫",
		physicalPrice: "98.000₫",
		rating: 4.7,
		reviewCount: 420,
		coverImage: "/products/book-10-dieu-tao-nen-so-phan-cover.jpeg",
		readerUrl: "/reader/10-dieu-tao-nen-so-phan",
		slug: "10-dieu-tao-nen-so-phan",
		badge: "Làm chủ cuộc đời",
		description: "10 cam kết mạnh mẽ giúp bạn chuyển hóa nhận thức và kiến tạo số phận như ý.",
		variants: [
			{ id: "ed-10-dieu-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-10-DIEU", price: "49.000₫" },
			{ id: "ed-10-dieu-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-10-DIEU", price: "98.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo2",
		title: "Bí Mật Của Một Trí Nhớ Siêu Phàm",
		originalTitle: "Where Did That Come From?",
		author: "Eran Katz",
		price: "59.000₫",
		originalPrice: "119.000₫",
		ebookPrice: "59.000₫",
		physicalPrice: "119.000₫",
		rating: 4.8,
		reviewCount: 510,
		coverImage: "/products/book-bi-mat-cua-mot-tri-nho-sieu-pham-cover.jpeg",
		readerUrl: "/reader/bi-mat-cua-mot-tri-nho-sieu-pham",
		slug: "bi-mat-cua-mot-tri-nho-sieu-pham",
		badge: "Rèn luyện trí nhớ",
		description: "Kỹ thuật ghi nhớ kỷ lục gia thế giới giúp bạn học nhanh, nhớ lâu và làm chủ dữ liệu.",
		variants: [
			{ id: "ed-tri-nho-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-TRI-NHO", price: "59.000₫" },
			{ id: "ed-tri-nho-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-TRI-NHO", price: "119.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo3",
		title: "Cách Nghĩ Để Thành Công",
		originalTitle: "Think and Grow Rich",
		author: "Napoleon Hill",
		price: "59.000₫",
		originalPrice: "115.000₫",
		ebookPrice: "59.000₫",
		physicalPrice: "115.000₫",
		rating: 4.9,
		reviewCount: 1680,
		coverImage: "/products/book-cach-nghi-de-thanh-cong-cover.jpeg",
		readerUrl: "/reader/cach-nghi-de-thanh-cong",
		slug: "cach-nghi-de-thanh-cong",
		badge: "Phát triển bản thân",
		description: "13 nguyên tắc làm giàu và tư duy thịnh vượng kinh điển nhất mọi thời đại.",
		variants: [
			{ id: "ed-cach-nghi-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-CACH-NGHI", price: "59.000₫" },
			{ id: "ed-cach-nghi-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-CACH-NGHI", price: "115.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo4",
		title: "Cây Cam Ngọt Của Tôi",
		originalTitle: "O Meu Pé de Laranja Lima",
		author: "José Mauro de Vasconcelos",
		price: "55.000₫",
		originalPrice: "108.000₫",
		ebookPrice: "55.000₫",
		physicalPrice: "108.000₫",
		rating: 4.9,
		reviewCount: 3120,
		coverImage: "/products/book-cay-cam-ngot-cua-toi-cover.jpeg",
		readerUrl: "/reader/cay-cam-ngot-cua-toi",
		slug: "cay-cam-ngot-cua-toi",
		badge: "Văn học kinh điển",
		description: "Câu chuyện cảm động về tuổi thơ, tình yêu thương và sự thấu hiểu xót xa của cậu bé Zezé.",
		variants: [
			{ id: "ed-cay-cam-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-CAY-CAM", price: "55.000₫" },
			{ id: "ed-cay-cam-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-CAY-CAM", price: "108.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDo5",
		title: "Chiến Tranh Tiền Tệ - Tập 1",
		originalTitle: "Currency Wars I",
		author: "Song Hongbing",
		price: "69.000₫",
		originalPrice: "139.000₫",
		ebookPrice: "69.000₫",
		physicalPrice: "139.000₫",
		rating: 4.7,
		reviewCount: 840,
		coverImage: "/products/book-chien-tranh-tien-te-tap-1-cover.jpeg",
		readerUrl: "/reader/chien-tranh-tien-te-tap-1",
		slug: "chien-tranh-tien-te-tap-1",
		badge: "Tài chính & Tiền tệ",
		description: "Mặt sau của các cuộc chiến tranh và sự thao túng tài chính của các gia tộc tài phiệt thế giới.",
		variants: [
			{ id: "ed-cttt1-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-CTTT1", price: "69.000₫" },
			{ id: "ed-cttt1-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-CTTT1", price: "139.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoxMA==",
		title: "Chiến Tranh Tiền Tệ - Tập 2",
		originalTitle: "Currency Wars II",
		author: "Song Hongbing",
		price: "69.000₫",
		originalPrice: "139.000₫",
		ebookPrice: "69.000₫",
		physicalPrice: "139.000₫",
		rating: 4.7,
		reviewCount: 620,
		coverImage: "/products/book-chien-tranh-tien-te-tap-2-cover.jpeg",
		readerUrl: "/reader/chien-tranh-tien-te-tap-2",
		slug: "chien-tranh-tien-te-tap-2",
		badge: "Tài chính & Tiền tệ",
		description: "Chiến lược thao túng toàn cầu và sự trỗi dậy của các khối tài phiệt phương Tây.",
		variants: [
			{ id: "ed-cttt2-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-CTTT2", price: "69.000₫" },
			{ id: "ed-cttt2-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-CTTT2", price: "139.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoxMQ==",
		title: "Chiến Tranh Tiền Tệ - Tập 3",
		originalTitle: "Currency Wars III",
		author: "Song Hongbing",
		price: "69.000₫",
		originalPrice: "139.000₫",
		ebookPrice: "69.000₫",
		physicalPrice: "139.000₫",
		rating: 4.7,
		reviewCount: 540,
		coverImage: "/products/book-chien-tranh-tien-te-tap-3-cover.jpeg",
		readerUrl: "/reader/chien-tranh-tien-te-tap-3",
		slug: "chien-tranh-tien-te-tap-3",
		badge: "Tài chính & Tiền tệ",
		description: "Cuộc chiến tiền tệ tại châu Á và bức tranh tương lai tài chính toàn cầu.",
		variants: [
			{ id: "ed-cttt3-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-CTTT3", price: "69.000₫" },
			{ id: "ed-cttt3-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-CTTT3", price: "139.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoxMg==",
		title: "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản",
		originalTitle: "A Guide to the Good Life",
		author: "William B. Irvine",
		price: "65.000₫",
		originalPrice: "129.000₫",
		ebookPrice: "65.000₫",
		physicalPrice: "129.000₫",
		rating: 4.8,
		reviewCount: 930,
		coverImage: "/products/book-chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than-cover.jpeg",
		readerUrl: "/reader/chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
		slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
		badge: "Triết lý sống",
		description: "Nghệ thuật làm chủ cảm xúc, đón nhận thử thách với tâm thế bình thản và kiên định.",
		variants: [
			{ id: "ed-khac-ky-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-KHAC-KY", price: "65.000₫" },
			{ id: "ed-khac-ky-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-KHAC-KY", price: "129.000₫" },
		],
	},
	{
		id: "UHJvZHVjdDoxMw==",
		title: "Tư Duy Nhanh Và Chậm",
		originalTitle: "Thinking, Fast and Slow",
		author: "Daniel Kahneman",
		price: "79.000₫",
		originalPrice: "159.000₫",
		ebookPrice: "79.000₫",
		physicalPrice: "159.000₫",
		rating: 4.9,
		reviewCount: 2890,
		coverImage: "/products/book-tu-duy-nhanh-va-cham-cover.jpeg",
		readerUrl: "/reader/tu-duy-nhanh-va-cham",
		slug: "tu-duy-nhanh-va-cham",
		badge: "Tâm lý học hành vi",
		description: "Hai hệ thống tư duy định hình mọi quyết định, phán đoán và sai lệch nhận thức của con người.",
		variants: [
			{ id: "ed-tdnvc-ebook", name: "Bản Ebook (Sách Điện Tử Readium LCP)", type: "ebook", sku: "EB-TDNVC", price: "79.000₫" },
			{ id: "ed-tdnvc-physical", name: "Bản Sách Giấy (Bìa Mềm)", type: "physical", sku: "VT-TDNVC", price: "159.000₫" },
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
	timeoutMs = 25000,
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
				const geminiModel = "gemini-3.8-flash";
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
	const candidateModels = ["gemma2:2b"];
	const ollamaModelsToTry = candidateModels;

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
					keep_alive: "24h",
					options: {
						temperature: 0.2,
						num_predict: 280,
					},
				}),
				signal: AbortSignal.timeout(timeoutMs),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				const text = data.message?.content?.trim();
				if (text) {
					let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
					// If the response ends abruptly without sentence-closing punctuation, clean trailing fragment
					const lastPunctuation = Math.max(
						cleaned.lastIndexOf("."),
						cleaned.lastIndexOf("!"),
						cleaned.lastIndexOf("?")
					);
					if (lastPunctuation > 40 && cleaned.length - lastPunctuation > 15) {
						cleaned = cleaned.substring(0, lastPunctuation + 1).trim();
					}
					return cleaned;
				}
			} else {
				console.warn(`[VoiceAgent Chat] Model ${curModel} returned HTTP ${res.status}, trying next model.`);
			}
		} catch (e: any) {
			console.warn(`[VoiceAgent Chat] Error with model ${curModel}:`, e?.message || e);
		}
	}
	return null;
}

interface SaleorOrderNode {
	id: string;
	number: string;
	status: string;
	created: string;
	userEmail: string;
	total: {
		gross: {
			amount: number;
			currency: string;
		};
	};
	lines: Array<{
		productName: string;
		quantity: number;
	}>;
	shippingAddress?: {
		firstName?: string;
		lastName?: string;
		streetAddress1?: string;
		city?: string;
		phone?: string;
	} | null;
}

async function fetchSaleorOrders(): Promise<SaleorOrderNode[]> {
	try {
		const token = process.env.SALEOR_APP_TOKEN || "rMzfSy3fOblvdjuw0jcbmJ2pXfYWNU";
		const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
		const res = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				query: `
				query {
					orders(first: 20, sortBy: { field: CREATION_DATE, direction: DESC }) {
						edges {
							node {
								id
								number
								status
								created
								userEmail
								total {
									gross {
										amount
										currency
									}
								}
								lines {
									productName
									quantity
								}
								shippingAddress {
									firstName
									lastName
									streetAddress1
									city
									phone
								}
							}
						}
					}
				}
				`,
			}),
			cache: "no-cache",
		});
		if (!res.ok) return [];
		const data = (await res.json()) as any;
		return (data?.data?.orders?.edges?.map((e: any) => e.node) || []) as SaleorOrderNode[];
	} catch (err) {
		console.warn("[VoiceAgent] Error querying Saleor orders:", err);
		return [];
	}
}

async function cancelSaleorOrder(orderId: string): Promise<{ ok: boolean; order?: any; errors?: any[] }> {
	try {
		const token = process.env.SALEOR_APP_TOKEN || "rMzfSy3fOblvdjuw0jcbmJ2pXfYWNU";
		const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
		const res = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				query: `
				mutation CancelOrder($id: ID!) {
					orderCancel(id: $id) {
						order {
							id
							number
							status
						}
						errors {
							field
							message
							code
						}
					}
				}
				`,
				variables: { id: orderId },
			}),
			cache: "no-cache",
		});
		if (!res.ok) return { ok: false, errors: [{ message: `HTTP ${res.status}` }] };
		const data = (await res.json()) as any;
		const errors = data?.data?.orderCancel?.errors || [];
		const updatedOrder = data?.data?.orderCancel?.order;
		return { ok: errors.length === 0, order: updatedOrder, errors };
	} catch (err) {
		console.warn("[VoiceAgent] Error executing orderCancel mutation:", err);
		return { ok: false, errors: [{ message: String(err) }] };
	}
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
		let ttsVoice = "f5-tts-vietnamese";
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
				else if (cfg.voice?.activeVoice) ttsVoice = cfg.voice.activeVoice;
				else if (cfg.voice?.voiceId) ttsVoice = cfg.voice.voiceId;
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
			const resolvedFromHist = graphRAGStore.resolveBookEntity(msg.content);
			if (resolvedFromHist?.properties.slug) {
				activeBookSlug = resolvedFromHist.properties.slug;
				break;
			}
			const cLower = msg.content.toLowerCase();
			const matched = CATALOG.find(b => cLower.includes(b.title.toLowerCase()) || cLower.includes(b.slug.replace(/-/g, " ")));
			if (matched) {
				activeBookSlug = matched.slug;
				break;
			}
		}

		// 1.2. Nhận diện thực thể sách nếu có đề cập
		const resolvedNode = graphRAGStore.resolveBookEntity(cleanQuery, activeBookSlug);
		const currentBookSlug = resolvedNode?.properties.slug || activeBookSlug;
		if (resolvedNode?.properties.slug) {
			activeBookSlug = resolvedNode.properties.slug;
		}

		// 1.3. Trích xuất danh sách sách đã được đề xuất trước đó trong lịch sử (để loại trừ khi khách hỏi 'còn tác phẩm khác không')
		const seenBookSlugs = new Set<string>();
		for (const msg of history || []) {
			const textLower = (msg.content || "").toLowerCase();
			for (const b of CATALOG) {
				if (textLower.includes(b.title.toLowerCase()) || textLower.includes(b.slug.replace(/-/g, " "))) {
					seenBookSlugs.add(b.slug);
				}
			}
		}
		if (activeBookSlug) seenBookSlugs.add(activeBookSlug);

		const isAskingAlternativeBook =
			/(còn\s+(sách|tác phẩm|quyển|cuốn|ấn phẩm|gì)?\s*khác\s*(không|ko|k|chưa|hả)?|gợi ý\s*(cuốn|quyển|sách|tác phẩm)?\s*khác|sách khác|cuốn khác|tác phẩm khác|đổi cuốn khác|chưa ưng|không thích cuốn này|xem thêm cuốn khác|còn cuốn nào nữa không|có quyển nào khác không|tác phẩm khác)/i.test(cleanQuery);

		// ======================================================================
		// 2. PHÂN LOẠI Ý ĐỊNH CHÍNH XÁC (SEMANTIC INTENT CLASSIFICATION)
		// ======================================================================

		// 0. Ý ĐỊNH KẾT THÚC CUỘC GỌI / CẢM ƠN (FAREWELL / END_CALL)
		const isFarewell =
			lower.includes("kết thúc") ||
			ascii.includes("ket thuc") ||
			lower.includes("tạm biệt") ||
			ascii.includes("tam biet") ||
			lower.includes("cúp máy") ||
			ascii.includes("cup may") ||
			lower.includes("ngắt máy") ||
			lower.includes("ngắt cuộc gọi") ||
			lower.includes("tắt máy") ||
			lower.includes("dừng cuộc gọi") ||
			lower.includes("dừng trò chuyện") ||
			lower.includes("dừng lại ở đây") ||
			lower.includes("hẹn gặp lại") ||
			lower.includes("không cần nữa") ||
			lower.includes("khong can nua") ||
			lower.includes("không cần hỗ trợ") ||
			lower.includes("thế thôi nhé") ||
			lower.includes("thế thôi nha") ||
			lower.includes("thế thôi cảm ơn") ||
			lower.includes("vậy thôi nhé") ||
			lower.includes("vậy thôi nha") ||
			lower.includes("vậy thôi cảm ơn") ||
			lower.includes("được rồi cảm ơn") ||
			lower.includes("thôi được rồi") ||
			lower.includes("thôi cảm ơn") ||
			lower.includes("hiểu rồi cảm ơn") ||
			lower.includes("đủ rồi cảm ơn") ||
			lower.includes("hôm nay thế thôi") ||
			lower.includes("bye") ||
			body.clientFarewellIntent === true ||
			/^(kết thúc|dừng lại|cúp máy|ngắt máy|tắt máy|thôi nhé|thôi nha|thế nhé|thế nha|tạm biệt|cảm ơn|cảm ơn em|cảm ơn bạn|cảm ơn nhé|cảm ơn nha)$/i.test(lower.trim());

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

		// 0.4. CÁC Ý ĐỊNH VỀ CHÍNH SÁCH HỆ THỐNG VÀ GIÁ CẢ (BUSINESS POLICIES & PRICING)
		const isCustomerComplaint =
			/(móp|rách|hỏng|hư hỏng|bị hư|bẹp|lỗi in|gãy gáy)/i.test(lower) &&
			/(giao|nhận|vận chuyển|bưu tá|bên bạn giải quyết|đổi)/i.test(lower);

		const isFreeShippingPolicyInquiry =
			/(miễn phí vận chuyển|freeship|free ship|chính sách vận chuyển|chính sách ship|chính sách giao hàng)/i.test(lower) ||
			(/(miễn phí|freeship)/i.test(lower) && /(vận chuyển|giao hàng|ship)/i.test(lower));

		const isShippingMathInquiry =
			/(phí ship|cước vận chuyển|hết bao nhiêu tiền ship|cước là bao nhiêu|phí giao|cước phí)/i.test(lower) ||
			(/(200\.000|499\.000|600\.000|567\.000|3 cuốn)/i.test(lower) && /(ship|vận chuyển|giao|cước|kho|hà nội)/i.test(lower));

		const isReturnPolicyInquiry =
			/(đổi trả|trả hàng|thời hạn đổi|thời gian đổi|đổi sách|bị lỗi|bảo hành)/i.test(lower) &&
			!lower.includes("ebook");

		const isDrmRefundInquiry =
			/(hoàn tiền|trả lại tiền|refund)/i.test(lower) &&
			(lower.includes("ebook") || lower.includes("mở đọc") || lower.includes("sách điện tử"));

		const isWarehouseLocationInquiry =
			/(kho hàng|ở đâu|gửi từ đâu|địa chỉ kho|xuất kho|kho sách|kho tổng)/i.test(lower);

		const isDrmSessionInquiry =
			/(thẻ khác|phiên đọc|tab khác|nhiều thẻ|đang hoạt động ở thẻ|nhiều tab)/i.test(lower);

		const isJailbreakInquiry =
			/(hacker|bẻ khóa|crack|phá drm|private key|bypass drm|hướng dẫn tôi bẻ khóa)/i.test(lower);

		const isPriceInquiry =
			/(giá|bao nhiêu tiền|nhiêu tiền|bán bao nhiêu|giá bao nhiêu|bảng giá|giá cả|chi phí|mua hết bao nhiêu)/i.test(lower) &&
			!lower.includes("vận chuyển") &&
			!lower.includes("phí ship") &&
			!lower.includes("cước") &&
			!lower.includes("phí giao");

		const isPolicyOrShippingInquiry =
			isCustomerComplaint ||
			isFreeShippingPolicyInquiry ||
			isShippingMathInquiry ||
			isReturnPolicyInquiry ||
			isDrmRefundInquiry ||
			isWarehouseLocationInquiry ||
			isDrmSessionInquiry ||
			isJailbreakInquiry;

		// A. Ý ĐỊNH TRA CỨU ĐƠN HÀNG (ORDER_LOOKUP) HOẶC HỦY ĐƠN HÀNG (ORDER_CANCEL)
		// Bắt lỗi chính tả: "đươn hàng", "don hang", "donhang", "kiểm tra đơn", "đơn gần nhất", "vận đơn", "tracking", "huỷ đơn"...
		const isOrderInquiry =
			!isPolicyOrShippingInquiry &&
			(lower.includes("đơn hàng") ||
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
			lower.includes("đơn vừa đặt") ||
			lower.includes("đơn mới đặt") ||
			lower.includes("đơn mới") ||
			lower.includes("khi nào nhận") ||
			lower.includes("kiện hàng") ||
			lower.includes("huỷ đơn") ||
			lower.includes("hủy đơn") ||
			lower.includes("huỷ hàng") ||
			lower.includes("hủy hàng") ||
			lower.includes("huỷ") ||
			lower.includes("hủy") ||
			lower.includes("cancel") ||
			ascii.includes("don hang") ||
			ascii.includes("van chuyen") ||
			ascii.includes("giao hang") ||
			ascii.includes("kiem tra don") ||
			ascii.includes("tra cuu don") ||
			ascii.includes("huy don") ||
			ascii.includes("huy don hang") ||
			selectedTopic.includes("đơn hàng"));

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

		// C.2: Ý ĐỊNH HỎI GỢI Ý SÁCH BÁN CHẠY / SÁCH BẤT KỲ / NỔI BẬT (BESTSELLER / ANY BOOK)
		const isBestsellerOrAnyBookInquiry =
			lower.includes("bán chạy") ||
			lower.includes("ban chay") ||
			lower.includes("bất kỳ") ||
			lower.includes("bat ky") ||
			lower.includes("sách hot") ||
			lower.includes("sách nổi bật") ||
			lower.includes("sách hay") ||
			lower.includes("tiêu biểu") ||
			lower.includes("nổi tiếng") ||
			lower.includes("cuốn nào hay") ||
			lower.includes("quyển nào hay") ||
			lower.includes("cuốn sách nào hay") ||
			/gợi ý.*(vài|một vài|mấy|những|cuốn|quyển).*sách/i.test(lower) ||
			/sách.*(nào|gì).*(bán chạy|hay|hot|nổi bật)/i.test(lower);

		// D. Ý ĐỊNH TƯ VẤN SÁCH CHUNG (GENERAL_CONSULTATION - Chỉ khi không hỏi sách bán chạy / bất kỳ)
		const isGeneralConsultation =
			!isBestsellerOrAnyBookInquiry && (
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
			lower === "gợi ý sách cho tôi"
		);

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
			lower.includes("clean code") ||
			lower.includes("học tập") ||
			lower.includes("hoc tap") ||
			lower.includes("học") ||
			lower.includes("kinh tế") ||
			lower.includes("kinh te") ||
			lower.includes("tài chính") ||
			lower.includes("tai chinh") ||
			lower.includes("tiền tệ") ||
			lower.includes("tien te") ||
			lower.includes("đầu tư") ||
			lower.includes("dau tu") ||
			lower.includes("triết lý") ||
			lower.includes("sách liên quan") ||
			lower.includes("sách về") ||
			lower.includes("sách gì");

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

		const isFactualQuestion = (isChapterQuestion || isMetadataQuestion || isContentQuestion) && !isPurchaseIntent && !isOrderInquiry && !isPriceInquiry;

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

			answer = `Dạ em cảm ơn ${honorific} rất nhiều ạ! Cuộc gọi tư vấn đã kết thúc, kính mời ${honorific} dành chút thời gian đánh giá chất lượng cuộc gọi ngay trên màn hình để Aura AI ngày càng hoàn thiện và phục vụ mình tốt hơn nhé ạ! Em xin chân thành cảm ơn.`;
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
		// TRƯỜNG HỢP 0.3: LIỆT KÊ TÁC PHẨM BÁN CHẠY / DANH MỤC TIÊU BIỂU (CATALOG_LISTING / BESTSELLER)
		// ----------------------------------------------------------------------
		else if (isCatalogListInquiry || isBestsellerOrAnyBookInquiry) {
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
		// CHÍNH SÁCH BẢO MẬT: TỪ CHỐI BẺ KHÓA / JAILBREAK REFUSAL (TC-T2-19)
		// ----------------------------------------------------------------------
		else if (isJailbreakInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Từ chối yêu cầu xâm phạm bản quyền hoặc bẻ khóa hệ thống.`);
			answer = `Dạ em xin phép từ chối yêu cầu này ạ! Toàn bộ ấn phẩm tại AuraBook được bảo vệ nghiêm ngặt theo tiêu chuẩn bản quyền quốc tế Readium LCP. Em không thể hướng dẫn hay cung cấp công cụ bẻ khóa bản quyền dưới bất kỳ hình thức nào. Nếu ${honorific} cần hỗ trợ về cách sử dụng Web Reader hoặc kích hoạt sách, em luôn sẵn lòng hướng dẫn ạ!`;
		}

		// ----------------------------------------------------------------------
		// KHIẾU NẠI HÀNG HỎNG KHI NHẬN: ĐỔI MỚI 1-1 TRONG 7 NGÀY (TC-T4-02)
		// ----------------------------------------------------------------------
		else if (isCustomerComplaint) {
			thinkingSteps.push(`Aura AI (${llmModel}): Tiếp nhận khiếu nại sách bị móp gáy / rách góc do bưu tá. Cam kết đổi 1-1 miễn phí trong 7 ngày.`);
			answer = `Dạ em rất tiếc về sự cố vận chuyển này của ${honorific}! AuraBook cam kết hỗ trợ đổi mới 1-1 hoàn toàn miễn phí cho độc giả trong vòng 7 ngày nếu sách bị lỗi in ấn hoặc hư hỏng, móp gáy bìa do quá trình giao hàng của bưu tá ạ. ${honorific} chỉ cần chụp lại ảnh bìa sách bị lỗi và gửi về bộ phận CSKH, bên em sẽ điều phối giao ngay cuốn sách mới tinh đến tận nhà cho mình nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// CHÍNH SÁCH BẢN QUYỀN: XUNG ĐỘT PHIÊN ĐỌC ĐƠN TAB / DRM SESSION CONFLICT (TC-T4-03)
		// ----------------------------------------------------------------------
		else if (isDrmSessionInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Hướng dẫn giải quyết thông báo phiên đọc hoạt động ở thẻ khác.`);
			cards.push({
				type: "drm",
				data: {
					standard: "Readium LCP Active Tab Lock",
					singleTabLock: "Chỉ cho phép đọc trên 1 thẻ trình duyệt duy nhất tại một thời điểm",
					instruction: "Đóng các thẻ Web Reader cũ để tiếp tục đọc",
				},
			});
			answer = `Dạ hiện tượng này xuất hiện là do cơ chế bảo vệ bản quyền Readium LCP của AuraBook áp dụng tính năng khóa đọc đơn tab (single-tab lock) để bảo vệ tác quyền ấn phẩm ạ. Khi ${honorific} mở sách trên một thẻ mới trong khi thẻ cũ vẫn đang mở, hệ thống sẽ tạm khóa để tránh nhân bản phiên đọc trái phép. ${honorific} chỉ cần đóng thẻ trình duyệt cũ lại là có thể tiếp tục đọc sách bình thường trên thẻ hiện tại rồi nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// CHÍNH SÁCH KHO HÀNG / WAREHOUSE LOCATION (TC-T1-19)
		// ----------------------------------------------------------------------
		else if (isWarehouseLocationInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Cung cấp địa chỉ kho hàng trung tâm tại Hà Nội.`);
			answer = `Dạ kho hàng trung tâm của AuraBook được đặt tại địa chỉ số 12 Duy Tân, phường Dịch Vọng Hậu, quận Cầu Giấy, Hà Nội ạ. Toàn bộ sách giấy đặt mua sẽ được đóng gói cẩn thận và điều phối vận chuyển trực tiếp từ kho Hà Nội qua đối tác Giao Hàng Nhanh (GHN) đến tận tay độc giả trên toàn quốc ạ!`;
		}

		// ----------------------------------------------------------------------
		// CHÍNH SÁCH HOÀN TIỀN EBOOK DRM (TC-T1-18)
		// ----------------------------------------------------------------------
		else if (isDrmRefundInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Giải thích chính sách không hoàn tiền Ebook DRM khi đã mở đọc.`);
			answer = `Dạ theo quy định bảo vệ bản quyền số của AuraBook, các ấn phẩm Sách Điện Tử (Ebook DRM Readium LCP) sau khi đã mua và kích hoạt giấy phép mở đọc trên Web Reader thì sẽ không được hoàn tiền ạ. Trường hợp sách bị lỗi kỹ thuật không thể hiển thị nội dung, bên em sẽ hỗ trợ kiểm tra và cấp lại quyền đọc ngay cho ${honorific} ạ!`;
		}

		// ----------------------------------------------------------------------
		// CHÍNH SÁCH ĐỔI TRẢ SÁCH GIẤY (TC-T1-17, TC-T2-18)
		// ----------------------------------------------------------------------
		else if (isReturnPolicyInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Tư vấn chính sách đổi trả hàng hư hỏng (7 ngày / 30 ngày).`);
			if (lower.includes("45 ngày") || lower.includes("bốn mươi lăm ngày")) {
				answer = `Dạ theo chính sách của AuraBook, thời hạn hỗ trợ đổi trả sách là trong vòng 30 ngày kể từ ngày nhận hàng ạ. Rất tiếc là đơn hàng của ${honorific} đã nhận được 45 ngày nên đã quá thời hạn 30 ngày quy định của hệ thống để đổi trả sản phẩm rồi ạ!`;
			} else {
				answer = `Dạ sách giấy mua tại AuraBook hoàn toàn được hỗ trợ đổi trả ạ! Đối với các ấn phẩm bị lỗi do nhà sản xuất hoặc hư hỏng do vận chuyển, AuraBook áp dụng chính sách 1 đổi 1 miễn phí trong vòng 7 ngày. Ngoài ra, ${honorific} được hỗ trợ đổi trả trong vòng 30 ngày theo quy định bảo hành của hệ thống ạ!`;
			}
		}

		// ----------------------------------------------------------------------
		// CHÍNH SÁCH MIỄN PHÍ VẬN CHUYỂN & TÍNH PHÍ SHIP (TC-T1-16, TC-T2-17, TC-T3-04, TC-T3-05, TC-T4-05)
		// ----------------------------------------------------------------------
		else if (isFreeShippingPolicyInquiry || isShippingMathInquiry) {
			thinkingSteps.push(`Aura AI (${llmModel}): Tra cứu quy định miễn phí vận chuyển 500.000₫ & tính phí ship.`);
			if (lower.includes("600.000") || lower.includes("567.000") || (lower.includes("sapiens") && lower.includes("3 cuốn"))) {
				answer = `Dạ đơn hàng của ${honorific} có giá trị từ 500.000₫ trở lên nên cước vận chuyển là 0₫ (được miễn phí vận chuyển toàn quốc hoàn toàn) ạ! Toàn bộ kiện hàng được xuất trực tiếp từ kho Hà Nội (12 Duy Tân) và giao tận nơi mà không phát sinh thêm bất kỳ chi phí nào nhé ạ!`;
			} else if (lower.includes("499.000")) {
				answer = `Dạ theo quy định của AuraBook, chính sách miễn phí vận chuyển áp dụng cho các đơn hàng có giá trị từ 500.000₫ trở lên ạ. Đơn hàng của ${honorific} trị giá 499.000₫ còn thiếu 1.000₫ nữa là đạt ngưỡng 500.000₫, do đó đơn hàng chưa được miễn phí ship ạ. ${honorific} có thể chọn thêm một cuốn sách nhỏ để được hưởng ưu đãi freeship toàn quốc nhé ạ! Phí giao nội thành Hà Nội là 16.500₫ ạ.`;
			} else if (lower.includes("200.000") && lower.includes("hà nội")) {
				answer = `Dạ đối với đơn hàng sách giấy trị giá 200.000₫ giao nội thành Hà Nội (xuất từ kho 12 Duy Tân), cước phí vận chuyển tiêu chuẩn qua Giao Hàng Nhanh (GHN) là 16.500₫ ạ! Nếu ${honorific} mua đơn hàng từ 500.000₫ trở lên thì sẽ được miễn phí vận chuyển hoàn toàn nhé ạ!`;
			} else {
				answer = `Dạ chính sách vận chuyển của AuraBook rất ưu đãi ạ: Toàn bộ đơn hàng có giá trị từ 500.000₫ trở lên đều được miễn phí vận chuyển toàn quốc. Đối với các đơn hàng dưới 500.000₫, phí giao hàng tiêu chuẩn nội thành Hà Nội là 16.500₫ và giao các tỉnh thành khác là từ 22.000₫ đến 35.000₫ tùy theo khu vực ạ!`;
			}
		}

		// ----------------------------------------------------------------------
		// Ý ĐỊNH TRA CỨU GIÁ SÁCH CỤ THỂ / BOOK PRICE INQUIRY (TC-T1-12, TC-T1-13, TC-T4-04)
		// ----------------------------------------------------------------------
		else if (isPriceInquiry) {
			const targetNode = resolvedNode || (currentBookSlug ? graphRAGStore.resolveBookEntity(currentBookSlug) : null);
			let book: BookProduct | null = null;
			if (targetNode) {
				book = CATALOG.find((c) => c.slug === targetNode.properties.slug) || null;
			}
			if (!book && currentBookSlug) {
				book = CATALOG.find((c) => c.slug === currentBookSlug) || null;
			}
			if (!book) {
				for (const c of CATALOG) {
					if (lower.includes(c.title.toLowerCase()) || ascii.includes(c.slug.replace(/-/g, " "))) {
						book = c;
						break;
					}
				}
			}
			if (!book) book = CATALOG[0];

			thinkingSteps.push(`Aura AI (${llmModel}): Báo giá chuẩn xác cho ấn phẩm "${book.title}" (${book.author}).`);
			cards.push({ type: "product", data: book });
			activeBookSlug = book.slug;

			answer = `Dạ, ấn phẩm "${book.title}" của tác giả ${book.author} hiện đang được phát hành trên AuraBook với 2 phiên bản chuẩn giá:
- 📱 Bản Sách Điện Tử (Ebook DRM Readium LCP): ${book.ebookPrice} (đọc trực tiếp trên Web Reader bảo mật).
- 📖 Bản Sách Giấy (Sách in bìa mềm tuyển chọn): ${book.physicalPrice} (giao tận nhà toàn quốc).
Em đã gửi thẻ ấn phẩm chi tiết ngay bên dưới để ${honorific} tiện tham khảo và đặt mua nhé ạ!`;
		}

		// ----------------------------------------------------------------------
		// TRƯỜNG HỢP 1: TRA CỨU HOẶC HỦY ĐƠN HÀNG TRONG CƠ SỞ DỮ LIỆU THỰC TẾ (SALEOR & GHN)
		// ----------------------------------------------------------------------
		else if (isOrderInquiry) {
			const isCancelIntent = /(huỷ|hủy|cancel)/i.test(lower);
			thinkingSteps.push(
				`Aura AI (${llmModel}): ${isCancelIntent ? "Yêu cầu hủy đơn hàng (ORDER_CANCEL)" : "Tra cứu tiến độ đơn hàng / vận chuyển (ORDER_LOOKUP)"} cho khách hàng ${honorific}.`,
			);

			// 1. Quét tìm kiếm trong danh sách đơn hàng thực tế của hệ thống Saleor
			const saleorOrders = await fetchSaleorOrders();
			let matchedSaleorOrder: SaleorOrderNode | null = null;

			// Quét theo mã đơn nếu có số trong câu hỏi (ví dụ: #45, đơn 45, #9...)
			let explicitCodeMatch = cleanQuery.match(/(?:#|đơn\s*(?:hàng\s*)?(?:mã\s*(?:số\s*)?)?|mã\s*(?:vận\s*đơn|số|đơn)?\s*#?|số\s*)(\d{1,8}|GHN[A-Z0-9]+)/i);
			if (!explicitCodeMatch && /GHN[A-Z0-9]+/i.test(cleanQuery)) {
				const ghnMatch = cleanQuery.match(/GHN[A-Z0-9]+/i);
				if (ghnMatch) explicitCodeMatch = ghnMatch;
			}
			if (!explicitCodeMatch) {
				const genericNumMatch = cleanQuery.match(/(?:đơn\s*hàng|vận\s*đơn|mã\s*đơn)[\s\S]*?\b(\d{1,8})\b/i);
				if (genericNumMatch) explicitCodeMatch = genericNumMatch;
			}

			if (explicitCodeMatch && !explicitCodeMatch[0].toUpperCase().startsWith("GHN")) {
				const targetNum = explicitCodeMatch[1] || explicitCodeMatch[0];
				matchedSaleorOrder = saleorOrders.find((o) => o.number === targetNum || o.id === targetNum) || null;
			}

			// Nếu khách không chỉ định mã số cụ thể nhưng hỏi "đơn vừa đặt", "đơn mới đặt", "đơn gần nhất", "huỷ đơn", "đơn của tôi"
			if (!matchedSaleorOrder && saleorOrders.length > 0) {
				const isRecentOrderQuery =
					lower.includes("vừa đặt") ||
					lower.includes("mới đặt") ||
					lower.includes("gần nhất") ||
					lower.includes("mới nhất") ||
					lower.includes("của tôi") ||
					lower.includes("huỷ đơn") ||
					lower.includes("hủy đơn") ||
					lower.includes("hủy") ||
					lower.includes("huỷ") ||
					lower === "huỷ đơn hàng" ||
					lower === "hủy đơn hàng" ||
					lower === "tra cứu đơn hàng" ||
					!explicitCodeMatch;

				if (isRecentOrderQuery) {
					// Nếu có thông tin người dùng (tên/sđt) khớp thì ưu tiên
					if (phone) {
						const cleanPhoneDigits = phone.replace(/\D/g, "").slice(-9);
						matchedSaleorOrder = saleorOrders.find((o) => o.shippingAddress?.phone?.replace(/\D/g, "").includes(cleanPhoneDigits)) || null;
					}
					if (!matchedSaleorOrder && name) {
						const nameLower = name.toLowerCase();
						matchedSaleorOrder = saleorOrders.find((o) => {
							const fullName = `${o.shippingAddress?.firstName || ""} ${o.shippingAddress?.lastName || ""}`.toLowerCase();
							return fullName.includes(nameLower) || nameLower.split(/\s+/).some((part) => part.length >= 2 && fullName.includes(part));
						}) || null;
					}
					// Mặc định lấy đơn hàng mới nhất vừa đặt
					if (!matchedSaleorOrder) {
						matchedSaleorOrder = saleorOrders[0];
					}
				}
			}

			// XỬ LÝ KHI TÌM THẤY ĐƠN HÀNG TRÊN SALEOR
			if (matchedSaleorOrder) {
				const orderNum = matchedSaleorOrder.number;
				const itemsSummary = matchedSaleorOrder.lines && matchedSaleorOrder.lines.length > 0
					? matchedSaleorOrder.lines.map((l) => `${l.productName} (x${l.quantity})`).join(", ")
					: "Sách AuraBook";
				const totalStr = `${new Intl.NumberFormat("vi-VN").format(matchedSaleorOrder.total.gross.amount)}₫`;

				if (isCancelIntent) {
					// Kiểm tra cú pháp xác nhận lệnh hủy đơn hàng tường minh (Strict Command Guardrail)
					const isStrictCancelConfirmation =
						/(?:tôi\s*)?(?:xác\s*nhận|xac\s*nhan)\s*(?:hủy|huỷ|huy)\s*(?:đơn|don)(?:\s*hàng|\s*hang)?/i.test(lower) ||
						/(?:confirm\s*cancel|xác\s*nhận\s*hủy)/i.test(lower);

					if (matchedSaleorOrder.status === "CANCELED") {
						thinkingSteps.push(`Aura AI (${llmModel}): Đơn hàng #${orderNum} đã ở trạng thái CANCELED.`);
						answer = `Dạ đơn hàng #${orderNum} (${itemsSummary}) của ${honorific} đã được hủy trước đó rồi ạ. Trạng thái hiện tại trên hệ thống là "Đã hủy" (Canceled).`;
					} else if (matchedSaleorOrder.status === "UNFULFILLED") {
						if (isStrictCancelConfirmation) {
							// Người dùng đã nói/nhập đúng câu lệnh xác nhận hủy
							thinkingSteps.push(`Aura AI (${llmModel}): Khách hàng đã nói đúng câu lệnh xác nhận hủy đơn #${orderNum}. Tiến hành gọi mutation orderCancel.`);
							const cancelRes = await cancelSaleorOrder(matchedSaleorOrder.id);
							if (cancelRes.ok) {
								answer = `Dạ em đã thực hiện hủy thành công đơn hàng #${orderNum} (${itemsSummary}) với tổng giá trị ${totalStr} cho ${honorific} theo đúng câu lệnh xác nhận rồi ạ! Trạng thái đơn hàng trên hệ thống AuraBook hiện đã được cập nhật thành "Đã hủy" (CANCELED). ${honorific} hoàn toàn có thể yên tâm nhé ạ!`;
								matchedSaleorOrder.status = "CANCELED";
							} else {
								thinkingSteps.push(`Aura AI (${llmModel}): Lỗi khi gọi orderCancel: ${JSON.stringify(cancelRes.errors)}`);
								answer = `Dạ em đã ghi nhận lệnh xác nhận hủy đơn hàng #${orderNum} (${itemsSummary}) của ${honorific}. Hệ thống đang chuyển thông tin cho chuyên viên quản trị kho để hoàn tất thủ tục hủy đơn và hoàn tiền (nếu có) ngay cho mình nhé ạ!`;
							}
						} else {
							// Người dùng mới chỉ yêu cầu hủy hoặc hỏi hủy nhưng CHƯA nói đúng câu lệnh xác nhận
							thinkingSteps.push(`Aura AI (${llmModel}): Khách hàng có ý định hủy đơn #${orderNum} nhưng chưa dùng câu lệnh xác nhận tường minh. Yêu cầu nhập đúng cú pháp.`);
							answer = `Dạ em đã tìm thấy đơn hàng #${orderNum} (${itemsSummary}) với tổng giá trị ${totalStr} đang ở trạng thái Chờ xuất kho. Để đảm bảo an toàn tuyệt đối và tránh thao tác nhầm, ${honorific} vui lòng nói hoặc nhập chính xác câu lệnh: "XÁC NHẬN HỦY ĐƠN #${orderNum}" (hoặc "Tôi xác nhận hủy đơn #${orderNum}") để em tiến hành hủy đơn ngay cho mình nhé ạ!`;
						}
					} else {
						// Đơn hàng đã xuất kho hoặc hoàn tất
						thinkingSteps.push(`Aura AI (${llmModel}): Đơn hàng #${orderNum} có trạng thái ${matchedSaleorOrder.status}, không thể hủy tự động.`);
						answer = `Dạ em đã kiểm tra đơn hàng #${orderNum} (${itemsSummary}) của ${honorific}. Hiện tại đơn hàng đã được xuất kho và đang trong quy trình vận chuyển (${matchedSaleorOrder.status}), do đó hệ thống không thể tự động hủy trực tiếp được nữa ạ. Khi bưu tá liên hệ giao hàng, ${honorific} có thể từ chối nhận hàng hoặc sử dụng chính sách đổi trả trong vòng 30 ngày của AuraBook nhé ạ!`;
					}

					const statusLabel = matchedSaleorOrder.status === "CANCELED"
						? "Đã hủy (Canceled)"
						: isStrictCancelConfirmation
							? "Đang xử lý hủy"
							: "Chờ lệnh xác nhận hủy";
					cards.push({
						type: "order",
						data: {
							orderCode: orderNum,
							status: statusLabel,
							statusStep: 1,
							carrier: "AuraBook Order Management",
							trackingCode: `AUR-#${orderNum}`,
							estimate: "Đã hủy theo yêu cầu",
							items: itemsSummary,
							total: totalStr,
						},
					});
				} else {
					// Tra cứu thông tin đơn hàng bình thường
					const statusMap: Record<string, string> = {
						UNFULFILLED: "Đang xử lý / Chờ xuất kho",
						FULFILLED: "Đã đóng gói & Xuất kho",
						CANCELED: "Đã hủy",
						PARTIALLY_FULFILLED: "Đang giao một phần",
					};
					const displayStatus = statusMap[matchedSaleorOrder.status] || matchedSaleorOrder.status;

					thinkingSteps.push(
						`Aura AI (${llmModel}): Xác thực đơn hàng #${orderNum} trên Saleor. Trạng thái: "${displayStatus}".`,
					);

					answer = `Dạ em đã tra cứu thông tin đơn hàng #${orderNum} của ${honorific} trên hệ thống AuraBook rồi ạ! Đơn gồm: ${itemsSummary}, tổng thanh toán là ${totalStr}. Hiện tại đơn hàng đang ở trạng thái "${displayStatus}" và đang được đội ngũ kho AuraBook chuẩn bị gửi đến ${honorific} ạ!`;

					cards.push({
						type: "order",
						data: {
							orderCode: orderNum,
							status: displayStatus,
							statusStep: matchedSaleorOrder.status === "FULFILLED" ? 3 : matchedSaleorOrder.status === "CANCELED" ? 1 : 2,
							carrier: "Giao Hàng Nhanh (GHN) / Kho AuraBook",
							trackingCode: `AUR-#${orderNum}`,
							estimate: "Dự kiến 24 - 48 giờ tới",
							items: itemsSummary,
							total: totalStr,
						},
					});
				}
			} else {
				// 2. Nếu không tìm thấy trong Saleor, đối soát tiếp với GHN shipments (Mô phỏng vận đơn bưu cục)
				const allShipments = getAllGHNShipments();
				let matchedShipment: GHNShipment | null = null;

				if (explicitCodeMatch) {
					const targetCode = explicitCodeMatch[1] || explicitCodeMatch[0];
					matchedShipment = getGHNShipmentByOrder(targetCode) ||
						allShipments.find((s) => s.orderNumber === targetCode || s.orderId === targetCode || s.trackingCode.toLowerCase() === targetCode.toLowerCase()) ||
						null;

					if (!matchedShipment && targetCode.toUpperCase().startsWith("GHN")) {
						thinkingSteps.push(`Aura AI (${llmModel}): Tra cứu mã vận đơn ${targetCode} nhưng không tìm thấy trên hệ thống GHN.`);
						answer = `Dạ em đã kiểm tra trên hệ thống Giao Hàng Nhanh (GHN) nhưng không tìm thấy thông tin đơn hàng với mã vận đơn "${targetCode}" ạ. ${honorific} vui lòng kiểm tra lại chính xác mã vận đơn trên hóa đơn hoặc cung cấp số điện thoại đặt hàng để em tra cứu lại giúp mình nhé ạ!`;
					}
				}

				if (!answer && !matchedShipment && phone) {
					const cleanPhoneDigits = phone.replace(/\D/g, "").slice(-9);
					matchedShipment = allShipments.find((s) => s.recipient.phone.replace(/\D/g, "").includes(cleanPhoneDigits)) || null;
				}

				if (!answer && !matchedShipment && name) {
					const nameLower = name.toLowerCase();
					const matchingByName = allShipments.filter((s) => {
						const rName = s.recipient.name.toLowerCase();
						return rName.includes(nameLower) || nameLower.split(/\s+/).some((part: string) => part.length >= 2 && rName.includes(part));
					});
					if (matchingByName.length > 0) {
						matchedShipment = matchingByName[0];
					}
				}

				if (!answer && !matchedShipment && (lower.includes("gần nhất") || lower.includes("vừa đặt") || lower.includes("của tôi")) && allShipments.length > 0) {
					matchedShipment = allShipments[0];
				}

				if (!answer) {
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

						if (isCancelIntent) {
							answer = `Dạ em đã kiểm tra đơn hàng #${matchedShipment.orderNumber} (Mã vận đơn: ${matchedShipment.trackingCode}) gửi về ${destAddress} rồi ạ. Hiện tại kiện hàng đã được xuất kho và đang được xử lý luân chuyển tại kho phân loại của GHN (${matchedShipment.statusDisplay}), do đó hệ thống không thể hỗ trợ hủy đơn trực tiếp được nữa ạ. Khi bưu tá liên hệ giao hàng, ${honorific} có thể từ chối nhận nếu không còn nhu cầu nhé ạ!`;
						} else {
							answer = `Dạ em chào ${honorific}! Em đã kiểm tra trên hệ thống vận đơn GHN rồi ạ. Đơn hàng gần nhất của ${honorific} là đơn #${matchedShipment.orderNumber} (Mã vận đơn: ${matchedShipment.trackingCode}), gồm ${matchedShipment.itemsSummary}. Hiện kiện hàng đang ở trạng thái "${matchedShipment.statusDisplay}" và dự kiến sẽ được giao đến ${destAddress} vào ngày ${estDateStr} ạ!`;
						}

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
						// NẾU KHÔNG TÌM THẤY ĐƠN HÀNG
						thinkingSteps.push(
							`Aura AI (${llmModel}): Chưa xác định được đơn hàng liên kết. Hướng dẫn khách hàng cung cấp mã đơn hoặc số điện thoại đặt hàng.`,
						);

						answer = `Dạ em chào ${honorific} ạ! Em rất sẵn lòng hỗ trợ tra cứu đơn hàng cho mình. Để em có thể tìm chính xác đơn hàng gần nhất của ${honorific} trên hệ thống, ${honorific} có thể cung cấp thêm Mã đơn hàng (ví dụ: #45) hoặc Số điện thoại khi đặt hàng giúp em được không ạ?`;
					}
				}
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
				const isBonThoaUoc = b.slug === "bon-thoa-uoc" || lower.includes("bốn thỏa ước");
				if (isBonThoaUoc && (lower.includes("thỏa ước thứ nhất") || lower.includes("thoa uoc 1") || lower.includes("thứ nhất"))) {
					answer = `Dạ, tác phẩm "${b.title}" của tác giả ${b.author} có tổng cộng ${totalChaps} chương/mục (khoảng ${wordsStr} từ) được số hóa từ bản EPUB gốc. Trong đó, thỏa ước thứ nhất quan trọng nhất là "Không phạm tội với lời nói" (Be Impeccable With Your Word) - tác giả nhấn mạnh lời nói là sức mạnh sáng tạo thiêng liêng, hãy luôn sử dụng lời nói chân thành và thiện chí, tuyệt đối không dùng lời nói chống lại chính mình hay vu khống người khác ạ!`;
				} else {
					answer = `Dạ, cuốn sách "${b.title}" của tác giả ${b.author} có tổng cộng ${totalChaps} chương/mục (khoảng ${wordsStr} từ) được số hóa chuẩn xác từ bản EPUB gốc trên AuraBook ạ. [Trích dẫn: Mục lục ${b.title}].`;
				}
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
				if (isAskingAlternativeBook) {
					// Khách hàng hỏi 'còn tác phẩm khác không' -> Không chọn lại tác phẩm cũ
					matchedBook = null;
				} else if (resolvedNode) {
					matchedBook = CATALOG.find((b) => b.slug === resolvedNode.properties.slug) || null;
				}
				if (!matchedBook && !isAskingAlternativeBook) {
					for (const c of CATALOG) {
						if (lower.includes(c.title.toLowerCase()) || ascii.includes(c.slug.replace(/-/g, " "))) {
							matchedBook = c;
							break;
						}
					}
				}
				if (!matchedBook) {
					// Check specific titles/keywords first
					if (
						lower.includes("đắc nhân tâm") ||
						lower.includes("dac nhan tam") ||
						lower.includes("dale carnegie") ||
						(lower.includes("giao tiếp") && !lower.includes("kỹ thuật")) ||
						lower.includes("ứng xử") ||
						lower.includes("thấu hiểu lòng người")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "dac-nhan-tam") || null;
					} else if (
						lower.includes("bốn thỏa ước") ||
						lower.includes("bon thoa uoc") ||
						lower.includes("don miguel ruiz") ||
						lower.includes("toltec") ||
						lower.includes("chữa lành") ||
						lower.includes("bình an nội tâm")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || null;
					} else if (
						lower.includes("phát triển bản thân") ||
						lower.includes("phat trien ban than") ||
						lower.includes("hoàn thiện bản thân") ||
						lower.includes("kỹ năng sống") ||
						lower.includes("self-help")
					) {
						// For general self-development inquiry: Recommend both "Bốn Thỏa Ước" and "Đắc Nhân Tâm"
						const bonThoaUoc = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || CATALOG[1];
						const dacNhanTam = CATALOG.find((b) => b.slug === "dac-nhan-tam") || CATALOG[0];
						
						thinkingSteps.push(
							`Aura AI (${llmModel}): Tư vấn toàn diện chuyên đề Phát triển bản thân với 2 ấn phẩm bổ trợ: "${bonThoaUoc.title}" (nội tâm) và "${dacNhanTam.title}" (đối nhân xử thế).`,
						);

						cards.push({ type: "product", data: bonThoaUoc });
						cards.push({ type: "product", data: dacNhanTam });

						answer = `Dạ em chào ${honorific} ạ! Trong dòng sách phát triển bản thân và hoàn thiện cuộc sống, AuraBook trân trọng gợi ý đến ${honorific} hai tác phẩm nổi bật:
1. 🌿 **Bốn Thỏa Ước** của Don Miguel Ruiz (Bản Ebook: ${bonThoaUoc.ebookPrice} / Sách giấy: ${bonThoaUoc.physicalPrice}) - Minh triết sống Toltec giúp giải phóng những niềm tin giới hạn, làm chủ cảm xúc và đạt tự do nội tâm.
2. 📖 **Đắc Nhân Tâm** của Dale Carnegie (Bản Ebook: ${dacNhanTam.ebookPrice} / Sách giấy: ${dacNhanTam.physicalPrice}) - Cẩm nang kinh điển về nghệ thuật giao tiếp, thấu hiểu tâm lý và thu phục lòng người.

Cả hai tác phẩm đều có sẵn Bản Sách Điện Tử (Ebook DRM) và Bản Sách Giấy. Em đã hiển thị thẻ ấn phẩm của cả 2 cuốn sách ngay bên dưới để ${honorific} tiện tham khảo và đặt mua nhé ạ!`;
					} else if (
						lower.includes("cách nghĩ") ||
						lower.includes("làm giàu") ||
						lower.includes("thành công") ||
						lower.includes("khát vọng") ||
						lower.includes("napoleon hill")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "cach-nghi-de-thanh-cong") || null;
					} else if (
						lower.includes("bốn thỏa ước") ||
						lower.includes("tâm lý") ||
						lower.includes("chữa lành") ||
						lower.includes("toltec") ||
						lower.includes("thói quen") ||
						lower.includes("kỷ luật")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "bon-thoa-uoc") || null;
					} else if (
						lower.includes("sapiens") ||
						lower.includes("lịch sử") ||
						lower.includes("tiến hóa") ||
						lower.includes("loài người") ||
						lower.includes("văn minh")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "sapiens-luoc-su-loai-nguoi") || null;
					} else if (
						lower.includes("do thái") ||
						lower.includes("trí tuệ do thái") ||
						lower.includes("trí nhớ") ||
						lower.includes("tư duy") ||
						lower.includes("logic") ||
						lower.includes("eran katz") ||
						lower.includes("công nghệ") ||
						lower.includes("cong nghe") ||
						lower.includes("lập trình") ||
						lower.includes("lap trinh")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "tri-tue-do-thai") || null;
					} else if (
						lower.includes("cây cam ngọt") ||
						lower.includes("cay cam ngot") ||
						lower.includes("zeze") ||
						lower.includes("tuổi thơ") ||
						lower.includes("tình cảm")
					) {
						matchedBook = CATALOG.find((b) => b.slug === "cay-cam-ngot-cua-toi") || null;
					}
				}

				if (isAskingAlternativeBook) {
					// Lọc danh sách tác phẩm còn lại chưa từng đề xuất trong hội thoại
					const remainingBooks = CATALOG.filter((b) => !seenBookSlugs.has(b.slug));
					const candidates = remainingBooks.length > 0 ? remainingBooks : CATALOG;

					const candidatesSummary = candidates
						.map((b, i) => `${i + 1}. "${b.title}" - Tác giả: ${b.author} | Thể loại: ${b.badge} | Ebook: ${b.ebookPrice}, Sách giấy: ${b.physicalPrice} (Slug: ${b.slug})`)
						.join("\n");

					thinkingSteps.push(
						`Aura AI (${llmModel}): Nhận diện nhu cầu tìm tác phẩm khác (loại trừ: ${Array.from(seenBookSlugs).join(", ")}). Khởi tạo tư vấn tác phẩm mới từ kho còn lại.`,
					);

					const altPrompt = `Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook.
Khách hàng ${honorific} vừa nói: "${cleanQuery}" (muốn xem tác phẩm khác, không muốn lặp lại các cuốn đã biết).

KHO CÁC TÁC PHẨM CÒN LẠI PHÙ HỢP CỦA AURABOOK:
${candidatesSummary}

YÊU CẦU:
1. Chọn 1 cuốn sách tiếp theo phù hợp nhất trong danh sách trên để giới thiệu cho ${honorific}.
2. Giải thích lý do tương đồng bằng giọng điệu ân cần, tự nhiên, sinh động, xưng "em" và gọi "${honorific}".
3. Nêu rõ tên tác phẩm, tác giả, giá Bản Ebook và Bản Sách Giấy.
4. TUYỆT ĐỐI KHÔNG sinh placeholder dạng "[Tùy vào phiên bản sách...]" hay "**Thẻ ấn phẩm:**".
5. Cuối câu trả lời, ghi kèm slug sách vừa chọn theo định dạng: [BOOK: slug_sach] (ví dụ: [BOOK: ${candidates[0].slug}]).`;

					const llmAltAnswer = await queryLLM({
						model: llmModel,
						provider: llmProvider,
						apiKey: llmApiKey,
						baseUrl: llmBaseUrl,
						prompt: `Khách hàng ${honorific} hỏi: "${cleanQuery}". Hãy tư vấn 1 cuốn sách khác hấp dẫn trong kho sách cho khách hàng.`,
						systemPrompt: altPrompt,
						timeoutMs: 25000,
					});

					if (llmAltAnswer && llmAltAnswer.length > 25) {
						const match = llmAltAnswer.match(/\[BOOK:\s*([^\n\]]+)\]/i);
						const selectedSlug = match ? match[1].trim().toLowerCase() : candidates[0].slug;
						const foundBook = candidates.find((b) => b.slug === selectedSlug || b.slug.includes(selectedSlug)) || candidates[0];
						cards.push({ type: "product", data: foundBook });
						answer = llmAltAnswer
							.replace(/\*?\*?\s*(?:Mã|Mã sách|Slug|Tác phẩm)\s*:?\s*\*?\*?\s*\[BOOK:[^\]]+\]/gi, "")
							.replace(/\[BOOK:[^\]]+\]/gi, "")
							.replace(/\*\*Thẻ ấn phẩm:?\*\*[\s\S]*?(?=\n\n|$)/gi, "")
							.replace(/\[Tùy vào phiên bản sách[^\]]*\]/gi, "")
							.trim();
					} else {
						const nextBook = candidates[0];
						cards.push({ type: "product", data: nextBook });
						answer = `Dạ ${honorific} ơi, bên cạnh các tác phẩm đã đề xuất, AuraBook còn cuốn sách rất đặc sắc là "${nextBook.title}" của tác giả ${nextBook.author} (Bản Ebook: ${nextBook.ebookPrice} / Sách giấy: ${nextBook.physicalPrice}). Tác phẩm mang lại nhiều góc nhìn sâu sắc và bài học ứng dụng thiết thực, em đã gửi kèm thẻ ấn phẩm ngay bên dưới để ${honorific} tiện tham khảo nhé ạ!`;
					}
				} else if (answer) {
					// Answer already generated by multi-book recommendation (e.g. self-development dual book)
				} else if (matchedBook) {
					thinkingSteps.push(
						`Aura AI (${llmModel}): Nhận diện nhu cầu tư vấn chủ đề "${matchedBook.badge}". Khởi tạo đề xuất tác phẩm "${matchedBook.title}" (${matchedBook.author}).`,
					);

					cards.push({ type: "product", data: matchedBook });

					let categoryName = matchedBook.badge || "sách hay";
					if (matchedBook.slug === "sapiens-luoc-su-loai-nguoi") categoryName = "lịch sử và văn minh loài người";
					else if (matchedBook.slug === "dac-nhan-tam") categoryName = "phát triển bản thân, nghệ thuật giao tiếp và đối nhân xử thế";
					else if (matchedBook.slug === "cach-nghi-de-thanh-cong") categoryName = "phát triển tư duy thành công và làm giàu";
					else if (matchedBook.slug === "bon-thoa-uoc") categoryName = "tâm lý học và minh triết cuộc sống";
					else if (matchedBook.slug === "tri-tue-do-thai") categoryName = "trí tuệ và phương pháp tư duy";

					const systemPrompt = `Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu ấm áp, ân cần, tự nhiên và chuyên nghiệp. Xưng là "em" và gọi khách hàng là "${honorific}". Trả lời súc tích trong 2-3 câu ngắn. Giới thiệu ấn phẩm "${matchedBook.title}" của tác giả ${matchedBook.author} đúng với lĩnh vực ${categoryName} (có Bản Ebook Sách Điện Tử ${matchedBook.ebookPrice} và Bản Sách Giấy Vật Lý ${matchedBook.physicalPrice}), hướng dẫn khách xem thẻ ấn phẩm chi tiết ngay bên dưới để chọn phiên bản và mua sách. Quy tắc quan trọng: Luôn kết thúc bằng một câu văn trọn vẹn có dấu chấm (.), tuyệt đối không bỏ lửng câu chữ giữa chừng.`;

					const llmAnswer = await queryLLM({
						model: llmModel,
						provider: llmProvider,
						apiKey: llmApiKey,
						baseUrl: llmBaseUrl,
						prompt: `Khách hàng ${honorific} vừa nói: "${cleanQuery}". Hãy tư vấn giới thiệu cuốn "${matchedBook.title}" của tác giả ${matchedBook.author} đúng với lĩnh vực ${categoryName} cho khách một cách tự nhiên, hấp dẫn.`,
						systemPrompt,
						timeoutMs: 25000,
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
						// Kiểm tra xem đây có phải là câu hỏi nhờ tư vấn, tìm sách theo nhu cầu không
						const isAdviceOrTopicInquiry =
							/(tư\s*vấn|gợi\s*ý|đề\s*xuất|hỗ\s*trợ|muốn\s*tìm|tìm\s*(cho|giúp)?|sách\s*về|sách\s*gì|nên\s*đọc|phát\s*triển|kỹ\s*năng|làm\s*sao)/i.test(cleanQuery);

						// Trích xuất cụm từ nghi vấn là tên sách từ câu hỏi của khách
						let extractedBookName = cleanQuery
							.replace(/^(tư\s+vấn\s*(giúp|cho)?\s*(tôi|mình|em|anh|chị)?|gợi\s+ý\s*(giúp|cho)?\s*(tôi|mình|em|anh|chị)?|tìm\s*(giúp|cho)?\s*(tôi|mình|em|anh|chị)?|cho\s+(tôi|mình|em|anh|chị)\s+hỏi\s*(về)?|shop|bên\s+mình|bên\s+bạn|ad|bạn|hệ\s+thống|ở\s+đây|aurabook)?\s*(có\s+)?(bán\s+)?(cuốn\s+sách|sách|quyển\s+sách|quyển|cuốn|tác\s+phẩm|ấn\s+phẩm|đầu\s+sách)?\s*(hỗ\s+trợ|về|chủ\s+đề)?\s*/i, "")
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
							// TƯ VẤN SÁCH & SO KHỚP TƯƠNG ĐỒNG 100% BẰNG MÔ HÌNH LLM (Ollama Gemma 2: 2B trên GPU)
							thinkingSteps.push(
								`Aura AI (${llmModel}): Khởi chạy cơ chế LLM Semantic Reasoning. Phân tích nhu cầu "${cleanQuery}" và đối chiếu kho sách 13 ấn phẩm thật của AuraBook.`,
							);

							const bookCatalogSummary = CATALOG.map((b) => 
								`- Slug: [${b.slug}] | Tựa sách: "${b.title}" | Tác giả: ${b.author} | Thể loại: ${b.badge} | Ebook: ${b.ebookPrice} | Sách giấy: ${b.physicalPrice} | Nội dung: ${b.description}`
							).join("\n");

							const consultationPrompt = `Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook.
Nhiệm vụ của bạn là đọc câu hỏi/yêu cầu của khách hàng, đối chiếu với KHO SÁCH CÓ SẴN CỦA AURABOOK và tư vấn 1 đến 2 cuốn sách phù hợp nhất, giải thích rõ lý do tương đồng.

KHO 13 SÁCH HIỆN CÓ SẴN TẠI CỬA HÀNG AURABOOK:
${bookCatalogSummary}

HƯỚNG DẪN TƯ VẤN (BẮT BUỘC TUÂN THỦ):
1. PHÂN TÍCH NHU CẦU: Nhận diện chính xác khách hàng đang quan tâm đến chủ đề gì (học tập, kinh tế, tài chính, trí nhớ, tư duy, tâm lý, lịch sử, văn học...).
   - Nếu hỏi về KINH TẾ / TÀI CHÍNH / TIỀN TỆ / ĐẦU TƯ: Chọn "Chiến Tranh Tiền Tệ - Tập 1" (Song Hongbing) hoặc "Cách Nghĩ Để Thành Công" (Napoleon Hill).
   - Nếu hỏi về HỌC TẬP / TRÍ NHỚ / PHƯƠNG PHÁP TƯ DUY: Chọn "Bí Mật Của Một Trí Nhớ Siêu Phàm" (Eran Katz) hoặc "Trí Tuệ Do Thái" (Eran Katz) hoặc "Tư Duy Nhanh Và Chậm" (Daniel Kahneman).
   - Nếu hỏi về TÂM LÝ / CHỮA LÀNH / TRIẾT LÝ SỐNG: Chọn "Bốn Thỏa Ước" hoặc "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản".
   - Nếu hỏi về KỸ NĂNG GIAO TIẾP / ĐỐI NHÂN XỬ THẾ: Chọn "Đắc Nhân Tâm".
   - Nếu hỏi về LỊCH SỬ / VĂN MINH NHÂN LOẠI: Chọn "Sapiens: Lược Sử Loài Người".
   - Nếu hỏi về VĂN HỌC / CẢM XÚC TUỔI THƠ: Chọn "Cây Cam Ngọt Của Tôi".
2. LÝ GIẢI TƯƠNG ĐỒNG BẰNG VĂN PHONG TỰ NHIÊN, ẤM ÁP:
   - Giải thích cụ thể TẠI SAO cuốn sách này lại phù hợp và giúp ích cho nhu cầu của khách hàng. Tuyệt đối không trả lời rập khuôn, câu từ phải sinh động, tự nhiên.
   - Luôn xưng "em" và gọi khách hàng là "${honorific}".
   - Nêu rõ tên tác phẩm, tác giả, giá Bản Ebook và Bản Sách Giấy.
3. KÈM THEO SLUG ĐỂ HỆ THỐNG GẮN THẺ SÁCH:
   - Ở cuối câu trả lời, ghi kèm slug sách bạn vừa đề xuất theo định dạng: [BOOK: slug_sach] (ví dụ: [BOOK: chien-tranh-tien-te-tap-1] hoặc [BOOK: bi-mat-cua-mot-tri-nho-sieu-pham]).`;

							const llmResponse = await queryLLM({
								model: llmModel,
								provider: llmProvider,
								apiKey: llmApiKey,
								baseUrl: llmBaseUrl,
								prompt: `Khách hàng ${honorific} vừa nói: "${cleanQuery}". Hãy phân tích nhu cầu và tư vấn cuốn sách phù hợp nhất trong kho sách AuraBook cho khách hàng.`,
								systemPrompt: consultationPrompt,
								timeoutMs: 25000,
							});

							if (llmResponse && llmResponse.length > 25) {
								// Extract book slugs from [BOOK: slug] (supports unicode, accents, or pure slug)
								const bookSlugMatches = [...llmResponse.matchAll(/\[BOOK:\s*([^\n\]]+)\]/gi)];
								const matchedSlugs = bookSlugMatches.map((m) => {
									const raw = m[1].trim().toLowerCase();
									return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\-]+/g, "-");
								});

								// Clean tags and metadata lines from final user-facing text
								answer = llmResponse
									.replace(/\*?\*?\s*(?:Mã|Mã sách|Slug|Tác phẩm)\s*:?\s*\*?\*?\s*\[BOOK:[^\]]+\]/gi, "")
									.replace(/\[BOOK:[^\]]+\]/gi, "")
									.replace(/^\s*\*\s*\*\*Slug:\*\*.*$/gim, "")
									.trim();

								// Push corresponding cards
								for (const slug of matchedSlugs) {
									const b = CATALOG.find((c) => c.slug === slug || c.slug.includes(slug));
									if (b && !cards.some((card) => card.data?.slug === b.slug)) {
										cards.push({ type: "product", data: b });
									}
								}

								// Fallback: if no card matched, search title in text
								if (cards.length === 0) {
									for (const b of CATALOG) {
										if (answer.toLowerCase().includes(b.title.toLowerCase())) {
											cards.push({ type: "product", data: b });
											if (cards.length >= 2) break;
										}
									}
								}
								if (cards.length === 0) {
									cards.push({ type: "product", data: CATALOG[0] });
								}
							} else {
								// Emergency fallback if LLM is unreachable
								const defaultBook = lower.includes("kinh tế") || lower.includes("tài chính")
									? (CATALOG.find((b) => b.slug === "chien-tranh-tien-te-tap-1") || CATALOG[6])
									: lower.includes("học") || lower.includes("trí nhớ")
									? (CATALOG.find((b) => b.slug === "bi-mat-cua-mot-tri-nho-sieu-pham") || CATALOG[3])
									: CATALOG[0];
								cards.push({ type: "product", data: defaultBook });
								answer = `Dạ em chào ${honorific} ạ! Về chủ đề mà ${honorific} đang tìm hiểu, em xin gợi ý cuốn "${defaultBook.title}" của tác giả ${defaultBook.author} (Bản Ebook: ${defaultBook.ebookPrice} / Sách giấy: ${defaultBook.physicalPrice}). Em đã đính kèm thẻ ấn phẩm ngay bên dưới để ${honorific} tham khảo nhé ạ!`;
							}
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
1. Dữ liệu sách và sản phẩm PHẢI 100% dựa trên cơ sở dữ liệu thực tế của AuraBook (kho sách hiện có 13 tác phẩm tiêu biểu: Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens: Lược Sử Loài Người, Trí Tuệ Do Thái, 10 Điều Tạo Nên Số Phận, Bí Mật Của Một Trí Nhớ Siêu Phàm, Cách Nghĩ Để Thành Công, Cây Cam Ngọt Của Tôi, Chiến Tranh Tiền Tệ - Tập 1, Chiến Tranh Tiền Tệ - Tập 2, Chiến Tranh Tiền Tệ - Tập 3, Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản, Tư Duy Nhanh Và Chậm).
2. Nếu khách hàng hỏi bất kỳ cuốn sách, tác giả hoặc sản phẩm nào KHÔNG CÓ trong cơ sở dữ liệu trên, bạn BẮT BUỘC phải nói rõ là hệ thống AuraBook hiện chưa có cuốn sách đó, tuyệt đối KHÔNG ĐƯỢC tự bịa đặt thông tin, giá tiền hay bản quyền.
3. Nếu cùng chủ đề với điều khách tìm, bạn hãy gợi ý các ấn phẩm hiện có trong hệ thống (như Đắc Nhân Tâm cho kỹ năng giao tiếp, Bốn Thỏa Ước cho tâm lý chữa lành, Sapiens cho lịch sử nhân loại, Trí Tuệ Do Thái hoặc Tư Duy Nhanh Và Chậm cho tư duy và học tập, Bí Mật Của Một Trí Nhớ Siêu Phàm cho rèn luyện trí nhớ, Cách Nghĩ Để Thành Công cho ý chí và khát vọng làm giàu).`;

			const llmFallback = await queryLLM({
				model: llmModel,
				provider: llmProvider,
				apiKey: llmApiKey,
				baseUrl: llmBaseUrl,
				prompt: `Khách hàng ${honorific} vừa nói: "${cleanQuery}". Hãy phản hồi ân cần, tự nhiên và hỗ trợ khách.`,
				systemPrompt,
				timeoutMs: 25000,
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

		// Không tự động chèn câu cảm ơn cứng ngắc lặp đi lặp lại để giữ lời đáp tự nhiên nhất
		// Giữ nguyên câu trả lời tự nhiên sinh động do LLM tạo ra

		// Làm sạch triệt để mọi placeholder artifact còn sót lại trước khi trả lời khách
		answer = answer
			.replace(/\*\*Thẻ ấn phẩm:?\*\*[\s\S]*?(?=\n\n|$)/gi, "")
			.replace(/\[Tùy vào phiên bản sách[^\]]*\]/gi, "")
			.replace(/\[BOOK:[^\]]+\]/gi, "")
			.trim();

		const rawVoice = (voice && typeof voice === "string" && voice.trim()) || ttsVoice || "f5-tts-vietnamese";
		const activeVoice = (rawVoice.toLowerCase().includes("f5") || rawVoice === "f5tts-vietnamese")
			? "f5-tts-vietnamese"
			: rawVoice;

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

				// ĐẢM BẢO ĐỌC TRỌN VẸN 100% CÂU TRẢ LỜI CHO KHÁCH HÀNG (KHÔNG BỊ CẮT XÉN)
				if (isCatalogListInquiry) {
					cleanSpeakText = `Dạ, cảm ơn ${honorific} đã đợi em tra cứu! Hiện tại kho sách AuraBook có 13 tác phẩm nổi bật gồm Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens, Trí Tuệ Do Thái, Tư Duy Nhanh Và Chậm và nhiều ấn phẩm khác. Tất cả ấn phẩm đều có sẵn bản Ebook DRM và sách giấy giao tận nơi. Em đã gửi thẻ chi tiết ngay trên màn hình để ${honorific} tiện chọn nhé ạ!`;
				}

				const ttsUrl = process.env.PIPER_TTS_URL || "http://127.0.0.1:5050/api/tts";
				const ttsVoiceToUse = activeVoice || "f5-tts-vietnamese";
				
				let ttsRes = await fetch(ttsUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: cleanSpeakText, speed: ttsSpeed, voice: ttsVoiceToUse, format: "base64" }),
					signal: AbortSignal.timeout(25000),
				}).catch(() => null);

				if (ttsRes && ttsRes.ok) {
					const ttsData = (await ttsRes.json().catch(() => null)) as any;
					audioBase64 = ttsData?.audioBase64 || "";
				}
			} catch (ttsErr) {
				console.warn("[VoiceAgent Chat] Lỗi kết nối TTS Server:", ttsErr);
			}
		}

		const thinkingText = thinkingSteps.join("\n");

		return NextResponse.json({
			text: answer,
			answer: answer,
			thinking: thinkingText || null,
			audioBase64,
			cards,
			isFarewell: Boolean(isFarewell),
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
