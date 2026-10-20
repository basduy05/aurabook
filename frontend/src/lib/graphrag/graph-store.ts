import fs from "fs";
import path from "path";
import type {
	GraphNode,
	GraphEdge,
	VectorChunk,
	GraphRAGStoreData,
	EPUBMetadata,
	GraphRAGQueryResult,
} from "./types";
import { generateSemanticVector, searchVectorChunks, SEMANTIC_KEYWORDS } from "./vector-store";
import type { ProductCardData } from "@/ui/components/plp/product-card-data";

function getStoreFilePath(): string {
	const possiblePaths = [
		path.resolve(process.cwd(), "../ecommerce-ai-platform/data/graphrag_store.json"),
		path.resolve(process.cwd(), "src/data/graphrag_store.json"),
		"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/data/graphrag_store.json",
	];
	for (const p of possiblePaths) {
		const dir = path.dirname(p);
		if (fs.existsSync(dir)) return p;
	}
	return possiblePaths[0];
}

/**
 * Chuẩn hóa chuỗi tiếng Việt thành slug URL an toàn, hỗ trợ chuẩn xác ký tự đ/Đ
 */
export function slugifyVietnamese(str: string): string {
	return str
		.toLowerCase()
		.replace(/đ/g, "d")
		.replace(/Đ/g, "d")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}


// Dữ liệu hạt giống mặc định (Seed Data) chuẩn xác theo hệ thống Saleor AuraBook
const INITIAL_GRAPH_DATA: GraphRAGStoreData = {
	version: "1.0.0",
	updatedAt: new Date().toISOString(),
	nodes: [
		// 1. ĐẮC NHÂN TÂM
		{
			id: "book-dac-nhan-tam",
			type: "book",
			label: "Đắc Nhân Tâm",
			properties: {
				title: "Đắc Nhân Tâm",
				originalTitle: "How to Win Friends and Influence People",
				slug: "dac-nhan-tam",
				author: "Dale Carnegie",
				publisher: "First News & NXB Tổng Hợp TPHCM",
				publishYear: "1936",
				description: "Cẩm nang giao tiếp, thấu hiểu tâm lý và nghệ thuật thu phục lòng người kinh điển nhất mọi thời đại.",
				coverImage: "/products/book-dac-nhan-tam-cover.jpg",
				rating: 4.9,
				ebookPrice: "59.000₫",
				physicalPrice: "118.000₫",
			},
		},
		{
			id: "author-dale-carnegie",
			type: "author",
			label: "Dale Carnegie",
			properties: { name: "Dale Carnegie", biography: "Nhà văn, diễn giả người Mỹ nổi tiếng về phát triển kỹ năng con người." },
		},
		{
			id: "pub-first-news",
			type: "publisher",
			label: "First News & NXB Tổng Hợp TPHCM",
			properties: { name: "First News - Trí Việt" },
		},
		{
			id: "year-1936",
			type: "year",
			label: "1936",
			properties: { year: "1936" },
		},
		{
			id: "ed-dac-nhan-tam-ebook",
			type: "edition",
			label: "Sách Điện Tử (Ebook DRM)",
			properties: {
				format: "ebook",
				price: "59.000₫",
				originalPrice: "89.000₫",
				sku: "EB-DAC-NHAN-TAM",
				drmStandard: "Readium LCP (Audio + Single Tab Lock)",
			},
		},
		{
			id: "ed-dac-nhan-tam-physical",
			type: "edition",
			label: "Sách Vật Lý (Sách in giấy bìa mềm)",
			properties: {
				format: "physical",
				price: "118.000₫",
				originalPrice: "150.000₫",
				sku: "VT-DAC-NHAN-TAM",
				shipping: "Giao tận nhà toàn quốc",
			},
		},

		// 2. TRÍ TUỆ DO THÁI
		{
			id: "book-tri-tue-do-thai",
			type: "book",
			label: "Trí Tuệ Do Thái",
			properties: {
				title: "Trí Tuệ Do Thái",
				originalTitle: "Jerome Becomes a Genius",
				slug: "tri-tue-do-thai",
				author: "Eran Katz",
				publisher: "NXB Lao Động - Xã Hội & Alpha Books",
				publishYear: "2008",
				description: "Bí quyết rèn luyện trí nhớ phi thường, phương pháp tưởng tượng kỳ lạ và tư duy làm giàu sắc bén của người Do Thái.",
				coverImage: "/products/book-tri-tue-do-thai-cover.jpg",
				rating: 4.8,
				ebookPrice: "69.000₫",
				physicalPrice: "135.000₫",
			},
		},
		{
			id: "author-eran-katz",
			type: "author",
			label: "Eran Katz",
			properties: { name: "Eran Katz", biography: "Kỷ lục gia Guinness thế giới về khả năng ghi nhớ siêu đẳng." },
		},
		{
			id: "pub-alpha-books",
			type: "publisher",
			label: "Alpha Books & NXB Lao Động - Xã Hội",
			properties: { name: "Alpha Books" },
		},
		{
			id: "year-2008",
			type: "year",
			label: "2008",
			properties: { year: "2008" },
		},
		{
			id: "ed-tri-tue-do-thai-ebook",
			type: "edition",
			label: "Sách Điện Tử (Ebook DRM)",
			properties: {
				format: "ebook",
				price: "69.000₫",
				originalPrice: "95.000₫",
				sku: "EB-TRI-TUE-DO-THAI",
				drmStandard: "Readium LCP DRM",
			},
		},
		{
			id: "ed-tri-tue-do-thai-physical",
			type: "edition",
			label: "Sách Vật Lý (Sách in giấy tuyển chọn)",
			properties: {
				format: "physical",
				price: "135.000₫",
				originalPrice: "175.000₫",
				sku: "VT-TRI-TUE-DO-THAI",
				shipping: "Giao tận nhà toàn quốc",
			},
		},

		// 3. BỐN THỎA ƯỚC
		{
			id: "book-bon-thoa-uoc",
			type: "book",
			label: "Bốn Thỏa Ước",
			properties: {
				title: "Bốn Thỏa Ước",
				originalTitle: "The Four Agreements",
				slug: "bon-thoa-uoc",
				author: "Don Miguel Ruiz",
				publisher: "NXB Hà Nội",
				publishYear: "1997",
				description: "Triết lý Toltec khai sáng giúp bạn thoát khỏi những niềm tin giới hạn, chữa lành nội tâm và tìm thấy tự do đích thực.",
				coverImage: "/products/book-bon-thoa-uoc-cover.jpg",
				rating: 4.8,
				ebookPrice: "49.000₫",
				physicalPrice: "98.000₫",
			},
		},
		{
			id: "author-don-miguel-ruiz",
			type: "author",
			label: "Don Miguel Ruiz",
			properties: { name: "Don Miguel Ruiz", biography: "Bậc thầy tâm linh và tác giả người Mexico theo dòng minh triết Toltec." },
		},
		{
			id: "pub-nxb-ha-noi",
			type: "publisher",
			label: "NXB Hà Nội",
			properties: { name: "Nhà Xuất Bản Hà Nội" },
		},
		{
			id: "year-1997",
			type: "year",
			label: "1997",
			properties: { year: "1997" },
		},
		{
			id: "ed-bon-thoa-uoc-ebook",
			type: "edition",
			label: "Sách Điện Tử (Ebook DRM)",
			properties: {
				format: "ebook",
				price: "49.000₫",
				originalPrice: "69.000₫",
				sku: "EB-BON-THOA-UOC",
				drmStandard: "Readium LCP DRM",
			},
		},
		{
			id: "ed-bon-thoa-uoc-physical",
			type: "edition",
			label: "Sách Vật Lý (Sách in giấy)",
			properties: {
				format: "physical",
				price: "98.000₫",
				originalPrice: "125.000₫",
				sku: "VT-BON-THOA-UOC",
				shipping: "Giao tận nhà toàn quốc",
			},
		},

		// 4. SAPIENS: LƯỢC SỬ LOÀI NGƯỜI
		{
			id: "book-sapiens",
			type: "book",
			label: "Sapiens: Lược Sử Loài Người",
			properties: {
				title: "Sapiens: Lược Sử Loài Người",
				originalTitle: "A Brief History of Humankind",
				slug: "sapiens-luoc-su-loai-nguoi",
				author: "Yuval Noah Harari",
				publisher: "NXB Tri Thức & Nhã Nam",
				publishYear: "2014",
				description: "Hành trình vĩ đại từ loài vượn người trở thành kẻ thống trị địa cầu qua các cuộc cách mạng nhận thức, nông nghiệp và khoa học.",
				coverImage: "/products/book-sapiens-luoc-su-loai-nguoi-cover.jpeg",
				rating: 5.0,
				ebookPrice: "89.000₫",
				physicalPrice: "189.000₫",
			},
		},
		{
			id: "author-yuval-harari",
			type: "author",
			label: "Yuval Noah Harari",
			properties: { name: "Yuval Noah Harari", biography: "Nhà sử học, triết gia và tác giả người Israel." },
		},
		{
			id: "pub-nha-nam",
			type: "publisher",
			label: "Nhã Nam & NXB Tri Thức",
			properties: { name: "Nhã Nam" },
		},
		{
			id: "year-2014",
			type: "year",
			label: "2014",
			properties: { year: "2014" },
		},
		{
			id: "ed-sapiens-ebook",
			type: "edition",
			label: "Sách Điện Tử (Ebook DRM)",
			properties: {
				format: "ebook",
				price: "89.000₫",
				originalPrice: "120.000₫",
				sku: "EB-SAPIENS",
				drmStandard: "Readium LCP DRM",
			},
		},
		{
			id: "ed-sapiens-physical",
			type: "edition",
			label: "Sách Vật Lý (Sách in bìa cứng tuyển chọn)",
			properties: {
				format: "physical",
				price: "189.000₫",
				originalPrice: "240.000₫",
				sku: "VT-SAPIENS",
				shipping: "Giao tận nhà toàn quốc",
			},
		},
	],
	edges: [
		// Quan hệ Đắc Nhân Tâm
		{ id: "e-dnt-aut", source: "book-dac-nhan-tam", target: "author-dale-carnegie", type: "WRITTEN_BY" },
		{ id: "e-dnt-pub", source: "book-dac-nhan-tam", target: "pub-first-news", type: "PUBLISHED_BY" },
		{ id: "e-dnt-yr", source: "book-dac-nhan-tam", target: "year-1936", type: "PUBLISHED_IN" },
		{ id: "e-dnt-ed-eb", source: "book-dac-nhan-tam", target: "ed-dac-nhan-tam-ebook", type: "HAS_EDITION" },
		{ id: "e-dnt-ed-vt", source: "book-dac-nhan-tam", target: "ed-dac-nhan-tam-physical", type: "HAS_EDITION" },

		// Quan hệ Trí Tuệ Do Thái
		{ id: "e-ttdt-aut", source: "book-tri-tue-do-thai", target: "author-eran-katz", type: "WRITTEN_BY" },
		{ id: "e-ttdt-pub", source: "book-tri-tue-do-thai", target: "pub-alpha-books", type: "PUBLISHED_BY" },
		{ id: "e-ttdt-yr", source: "book-tri-tue-do-thai", target: "year-2008", type: "PUBLISHED_IN" },
		{ id: "e-ttdt-ed-eb", source: "book-tri-tue-do-thai", target: "ed-tri-tue-do-thai-ebook", type: "HAS_EDITION" },
		{ id: "e-ttdt-ed-vt", source: "book-tri-tue-do-thai", target: "ed-tri-tue-do-thai-physical", type: "HAS_EDITION" },

		// Quan hệ Bốn Thỏa Ước
		{ id: "e-btu-aut", source: "book-bon-thoa-uoc", target: "author-don-miguel-ruiz", type: "WRITTEN_BY" },
		{ id: "e-btu-pub", source: "book-bon-thoa-uoc", target: "pub-nxb-ha-noi", type: "PUBLISHED_BY" },
		{ id: "e-btu-yr", source: "book-bon-thoa-uoc", target: "year-1997", type: "PUBLISHED_IN" },
		{ id: "e-btu-ed-eb", source: "book-bon-thoa-uoc", target: "ed-bon-thoa-uoc-ebook", type: "HAS_EDITION" },
		{ id: "e-btu-ed-vt", source: "book-bon-thoa-uoc", target: "ed-bon-thoa-uoc-physical", type: "HAS_EDITION" },

		// Quan hệ Sapiens
		{ id: "e-sap-aut", source: "book-sapiens", target: "author-yuval-harari", type: "WRITTEN_BY" },
		{ id: "e-sap-pub", source: "book-sapiens", target: "pub-nha-nam", type: "PUBLISHED_BY" },
		{ id: "e-sap-yr", source: "book-sapiens", target: "year-2014", type: "PUBLISHED_IN" },
		{ id: "e-sap-ed-eb", source: "book-sapiens", target: "ed-sapiens-ebook", type: "HAS_EDITION" },
		{ id: "e-sap-ed-vt", source: "book-sapiens", target: "ed-sapiens-physical", type: "HAS_EDITION" },
	],
	chunks: [
		{
			id: "chunk-dnt-1",
			bookId: "book-dac-nhan-tam",
			bookSlug: "dac-nhan-tam",
			bookTitle: "Đắc Nhân Tâm",
			chapterTitle: "Phần 1: Nghệ thuật ứng xử căn bản",
			chapterIndex: 1,
			content: "Nguyên tắc số 1: Không chỉ trích, oán trách hay than phiền. Muốn lấy mật thì đừng phá tổ ong. Khi muốn thay đổi một người, hãy khích lệ và tạo niềm tin thay vì lên án.",
			embedding: generateSemanticVector("Nguyên tắc số 1: Không chỉ trích, oán trách hay than phiền. Muốn lấy mật thì đừng phá tổ ong."),
		},
		{
			id: "chunk-ttdt-1",
			bookId: "book-tri-tue-do-thai",
			bookSlug: "tri-tue-do-thai",
			bookTitle: "Trí Tuệ Do Thái",
			chapterTitle: "Chương 1: Phương pháp rèn luyện trí nhớ",
			chapterIndex: 1,
			content: "Bí quyết trí tuệ Do Thái không phải bẩm sinh mà đến từ phương pháp rèn luyện trí nhớ bằng sự liên tưởng kỳ lạ, sơ đồ hóa và nghệ thuật đặt câu hỏi chất vấn không ngừng theo tinh thần Talmud.",
			embedding: generateSemanticVector("Bí quyết trí tuệ Do Thái không phải bẩm sinh mà đến từ phương pháp rèn luyện trí nhớ bằng sự liên tưởng kỳ lạ."),
		},
		{
			id: "chunk-btu-1",
			bookId: "book-bon-thoa-uoc",
			bookSlug: "bon-thoa-uoc",
			bookTitle: "Bốn Thỏa Ước",
			chapterTitle: "Thỏa ước thứ nhất: Không phạm tội với lời nói",
			chapterIndex: 1,
			content: "Lời nói của bạn là sức mạnh sáng tạo thần thánh. Hãy luôn nói với sự chân thành và tình yêu thương, tuyệt đối không dùng lời nói chống lại chính mình hoặc vu khống người khác.",
			embedding: generateSemanticVector("Thỏa ước thứ nhất: Không phạm tội với lời nói. Lời nói của bạn là sức mạnh sáng tạo thần thánh."),
		},
		{
			id: "chunk-sap-1",
			bookId: "book-sapiens",
			bookSlug: "sapiens-luoc-su-loai-nguoi",
			bookTitle: "Sapiens: Lược Sử Loài Người",
			chapterTitle: "Chương 1: Cách mạng Nhận thức",
			chapterIndex: 1,
			content: "70.000 năm trước, Cách mạng Nhận thức nổ ra nhờ khả năng độc nhất vô nhị của Homo Sapiens: tạo ra và tin vào những trật tự tưởng tượng chung như tôn giáo, quốc gia và tiền tệ.",
			embedding: generateSemanticVector("70.000 năm trước, Cách mạng Nhận thức nổ ra nhờ khả năng độc nhất vô nhị của Homo Sapiens."),
		},
	],
};

class AuraBookGraphRAGStore {
	private data: GraphRAGStoreData | null = null;

	public load(): GraphRAGStoreData {
		if (this.data) return this.data;

		const filePath = getStoreFilePath();
		try {
			if (fs.existsSync(filePath)) {
				const raw = fs.readFileSync(filePath, "utf-8");
				this.data = JSON.parse(raw) as GraphRAGStoreData;
				if (!this.data.feedbackScores) this.data.feedbackScores = {};
				if (!this.data.feedbacks) this.data.feedbacks = [];
				return this.data;
			}
		} catch (err) {
			console.warn("[GraphRAG] Lỗi đọc file store, khởi tạo seed data:", err);
		}

		this.data = JSON.parse(JSON.stringify(INITIAL_GRAPH_DATA)) as GraphRAGStoreData;
		if (!this.data.feedbackScores) this.data.feedbackScores = {};
		if (!this.data.feedbacks) this.data.feedbacks = [];
		this.save();
		return this.data;
	}

	public save(): void {
		if (!this.data) return;
		this.data.updatedAt = new Date().toISOString();
		const filePath = getStoreFilePath();
		try {
			const dir = path.dirname(filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2), "utf-8");
		} catch (err) {
			console.error("[GraphRAG] Lỗi lưu file store:", err);
		}
	}

	/**
	 * Ghi nhận phản hồi Like/Dislike từ người dùng để AI tự học và liên tục cải thiện xếp hạng (RLHF)
	 */
	public recordFeedback(
		query: string,
		bookSlug: string,
		action: "like" | "dislike"
	): {
		success: boolean;
		query: string;
		bookSlug: string;
		action: "like" | "dislike";
		newScore: number;
		likesCount: number;
		dislikesCount: number;
		message: string;
	} {
		const store = this.load();
		if (!store.feedbackScores) store.feedbackScores = {};
		if (!store.feedbacks) store.feedbacks = [];

		const cleanQuery = (query || "").toLowerCase().trim();
		const delta = action === "like" ? 1.0 : -1.0;

		// 1. Cập nhật trực tiếp điểm cho cặp (query, bookSlug)
		const directKey = `${cleanQuery}:::${bookSlug}`;
		store.feedbackScores[directKey] = Number(((store.feedbackScores[directKey] || 0) + delta).toFixed(2));

		// 2. Lan tỏa tri thức sang các từ khóa thành phần
		const stopWords = new Set(["tôi", "cho", "và", "những", "các", "cuốn", "sách", "tìm", "muốn", "về", "của", "đọc"]);
		const words = cleanQuery.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
		for (const w of words) {
			const kwKey = `${w}:::${bookSlug}`;
			store.feedbackScores[kwKey] = Number(((store.feedbackScores[kwKey] || 0) + delta * 0.35).toFixed(2));
		}

		// 3. Ghi lại lịch sử feedback
		const recordId = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		store.feedbacks.push({
			id: recordId,
			query,
			normalizedQuery: cleanQuery,
			bookSlug,
			type: action,
			weightDelta: delta,
			timestamp: new Date().toISOString(),
		});

		// 4. Lưu bền vững vào file JSON
		this.save();

		const bookFeedbacks = store.feedbacks.filter(f => f.bookSlug === bookSlug);
		const likesCount = bookFeedbacks.filter(f => f.type === "like").length;
		const dislikesCount = bookFeedbacks.filter(f => f.type === "dislike").length;

		const message = action === "like"
			? `Aura AI đã được cộng điểm (+1.0) và ghi nhận ấn phẩm này rất phù hợp với từ khóa "${query}"!`
			: `Aura AI đã bị trừ điểm (-1.0) và sẽ điều chỉnh hạ độ ưu tiên gợi ý cho từ khóa "${query}"!`;

		return {
			success: true,
			query,
			bookSlug,
			action,
			newScore: store.feedbackScores[directKey],
			likesCount,
			dislikesCount,
			message,
		};
	}

	public getBookFeedbackStats(bookSlug: string, query?: string): { likesCount: number; dislikesCount: number; currentWeight: number } {
		const store = this.load();
		const feedbacks = store.feedbacks || [];
		const bookFeedbacks = feedbacks.filter(f => f.bookSlug === bookSlug);
		const likesCount = bookFeedbacks.filter(f => f.type === "like").length;
		const dislikesCount = bookFeedbacks.filter(f => f.type === "dislike").length;

		let currentWeight = 0;
		if (query) {
			const directKey = `${query.toLowerCase().trim()}:::${bookSlug}`;
			currentWeight = store.feedbackScores?.[directKey] || 0;
		}

		return { likesCount, dislikesCount, currentWeight };
	}

	public getNodes(): GraphNode[] {
		return this.load().nodes;
	}

	public getEdges(): GraphEdge[] {
		return this.load().edges;
	}

	public getAllChunks(): VectorChunk[] {
		return this.load().chunks;
	}

	/**
	 * Phân rã văn bản chương sách thành các đoạn văn (Chunks) ngữ nghĩa hoàn chỉnh (350 - 750 ký tự)
	 */
	private splitIntoSemanticChunks(text: string, maxLen = 700, minLen = 150): string[] {
		const rawParas = text.split(/\n\s*\n+/).map((p) => p.trim()).filter((p) => p.length > 20);
		const chunks: string[] = [];
		let current = "";

		for (const para of rawParas) {
			if (!current) {
				current = para;
			} else if (current.length + para.length + 2 <= maxLen) {
				current += "\n\n" + para;
			} else {
				if (current.length >= minLen) {
					chunks.push(current);
				}
				current = para;
			}
		}

		if (current.length >= minLen) {
			chunks.push(current);
		} else if (current.length > 30 && chunks.length > 0) {
			chunks[chunks.length - 1] += "\n\n" + current;
		} else if (current.length > 30) {
			chunks.push(current);
		}

		return chunks;
	}

	/**
	 * Nạp (Upsert) một ấn phẩm sách từ EPUB Metadata vào GraphRAG Store
	 */
	public upsertBookFromEPUB(meta: EPUBMetadata): {
		bookNode: GraphNode;
		createdNodesCount: number;
		createdEdgesCount: number;
		createdChunksCount: number;
	} {
		const store = this.load();
		const slug = slugifyVietnamese(meta.title);

		const bookId = `book-${slug}`;
		const authorId = `author-${slugifyVietnamese(meta.author)}`;
		const pubId = `pub-${slugifyVietnamese(meta.publisher)}`;
		const yearId = `year-${meta.publishYear || "2024"}`;
		const edEbookId = `ed-${slug}-ebook`;
		const edPhysicalId = `ed-${slug}-physical`;

		let totalWords = 0;
		if (Array.isArray(meta.chapters)) {
			totalWords = meta.chapters.reduce(
				(acc, c) => acc + (c.wordCount || c.contentText.split(/\s+/).filter(Boolean).length),
				0,
			);
		}

		// 1. Book Node
		const bookNode: GraphNode = {
			id: bookId,
			type: "book",
			label: meta.title,
			properties: {
				title: meta.title,
				originalTitle: meta.originalTitle || meta.title,
				slug,
				author: meta.author,
				publisher: meta.publisher,
				publishYear: meta.publishYear,
				description: meta.description,
				isbn: meta.isbn,
				coverImage: meta.coverImage || "/products/book-dac-nhan-tam-cover.jpg",
				rating: 4.9,
				ebookPrice: meta.ebookPrice,
				physicalPrice: meta.physicalPrice,
				totalWords,
			},
		};

		// 2. Author Node
		const authorNode: GraphNode = {
			id: authorId,
			type: "author",
			label: meta.author,
			properties: { name: meta.author },
		};

		// 3. Publisher Node
		const pubNode: GraphNode = {
			id: pubId,
			type: "publisher",
			label: meta.publisher,
			properties: { name: meta.publisher },
		};

		// 4. Year Node
		const yearNode: GraphNode = {
			id: yearId,
			type: "year",
			label: meta.publishYear || "2024",
			properties: { year: meta.publishYear || "2024" },
		};

		// 5. Editions Nodes (2 phiên bản chuẩn Saleor)
		const edEbookNode: GraphNode = {
			id: edEbookId,
			type: "edition",
			label: `Sách Điện Tử (${meta.title})`,
			properties: {
				format: "ebook",
				price: meta.ebookPrice,
				sku: `EB-${slug.toUpperCase()}`,
				drmStandard: "Readium LCP DRM",
			},
		};

		const edPhysicalNode: GraphNode = {
			id: edPhysicalId,
			type: "edition",
			label: `Sách Vật Lý (${meta.title})`,
			properties: {
				format: "physical",
				price: meta.physicalPrice,
				sku: `VT-${slug.toUpperCase()}`,
				shipping: "Giao tận nhà toàn quốc",
			},
		};

		// Dọn sạch TRIỆT ĐỂ toàn bộ nodes, edges, chunks cũ của cuốn sách này để tránh trùng lặp
		store.nodes = store.nodes.filter(
			(n) =>
				n.id !== bookId &&
				n.id !== edEbookId &&
				n.id !== edPhysicalId &&
				n.properties?.bookSlug !== slug &&
				!n.id.startsWith(`chap-${slug}-`) &&
				!n.id.startsWith(`ed-${slug}-`),
		);
		store.edges = store.edges.filter(
			(e) =>
				e.source !== bookId &&
				e.target !== bookId &&
				!e.source.startsWith(`chap-${slug}-`) &&
				!e.target.startsWith(`chap-${slug}-`) &&
				!e.source.startsWith(`ed-${slug}-`) &&
				!e.target.startsWith(`ed-${slug}-`) &&
				!e.id.startsWith(`e-${slug}-`),
		);
		store.chunks = store.chunks.filter((c) => c.bookSlug !== slug);

		// Thêm các node mới nếu chưa tồn tại
		const addNodeIfNotExists = (node: GraphNode) => {
			if (!store.nodes.some((n) => n.id === node.id)) {
				store.nodes.push(node);
			}
		};

		addNodeIfNotExists(bookNode);
		addNodeIfNotExists(authorNode);
		addNodeIfNotExists(pubNode);
		addNodeIfNotExists(yearNode);
		addNodeIfNotExists(edEbookNode);
		addNodeIfNotExists(edPhysicalNode);

		// Thêm Edges chính
		store.edges.push(
			{ id: `e-${slug}-aut`, source: bookId, target: authorId, type: "WRITTEN_BY" },
			{ id: `e-${slug}-pub`, source: bookId, target: pubId, type: "PUBLISHED_BY" },
			{ id: `e-${slug}-yr`, source: bookId, target: yearId, type: "PUBLISHED_IN" },
			{ id: `e-${slug}-ed-eb`, source: bookId, target: edEbookId, type: "HAS_EDITION" },
			{ id: `e-${slug}-ed-vt`, source: bookId, target: edPhysicalId, type: "HAS_EDITION" },
		);

		// Thêm Chapter nodes và Vector Chunks
		let createdChunksCount = 0;
		if (Array.isArray(meta.chapters) && meta.chapters.length > 0) {
			meta.chapters.forEach((chap, idx) => {
				const chapId = `chap-${slug}-${idx + 1}`;
				const chapTitle = chap.title || `Chương ${idx + 1}`;
				const charCount = chap.charCount || chap.contentText.length;
				const wordCount = chap.wordCount || chap.contentText.split(/\s+/).filter(Boolean).length;

				store.nodes.push({
					id: chapId,
					type: "chapter",
					label: chapTitle,
					properties: {
						chapterTitle: chapTitle,
						chapterIndex: idx + 1,
						bookId,
						bookSlug: slug,
						wordCount,
						charCount,
						href: chap.href,
						preview: chap.contentText.slice(0, 300),
					},
				});

				store.edges.push({
					id: `e-${slug}-chap-${idx + 1}`,
					source: bookId,
					target: chapId,
					type: "CONTAINS_CHAPTER",
				});

				// Sinh vector chunks từ nội dung chương với các đoạn văn ngữ nghĩa thực tế
				const chunkText = chap.contentText || "";
				if (chunkText.trim().length > 30) {
					const semanticChunks = this.splitIntoSemanticChunks(chunkText, 650, 150);
					// Giới hạn 6 chunks tiêu biểu nhất mỗi chương
					const selectedChunks = semanticChunks.slice(0, 6);
					selectedChunks.forEach((chunkContent, pIdx) => {
						const chunkId = `chunk-${slug}-${idx + 1}-${pIdx + 1}`;
						const embedding = generateSemanticVector(chunkContent);
						store.chunks.push({
							id: chunkId,
							bookId,
							bookSlug: slug,
							bookTitle: meta.title,
							chapterTitle: chapTitle,
							chapterIndex: idx + 1,
							content: chunkContent,
							embedding,
							createdAt: new Date().toISOString(),
						});
						createdChunksCount++;
					});
				}
			});
		}

		// Nếu không có chapters, tạo 1 chunk tóm tắt từ mô tả
		if (createdChunksCount === 0 && meta.description) {
			const chunkId = `chunk-${slug}-synopsis`;
			store.chunks.push({
				id: chunkId,
				bookId,
				bookSlug: slug,
				bookTitle: meta.title,
				chapterTitle: "Tóm tắt tác phẩm",
				chapterIndex: 0,
				content: meta.description,
				embedding: generateSemanticVector(meta.description),
				createdAt: new Date().toISOString(),
			});
			createdChunksCount++;
		}

		this.save();

		return {
			bookNode,
			createdNodesCount: store.nodes.length,
			createdEdgesCount: store.edges.length,
			createdChunksCount,
		};
	}


	/**
	 * Lấy Subgraph liên kết xung quanh một cuốn sách (1-hop neighborhood)
	 */
	public getConnectedSubgraph(bookId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
		const store = this.load();
		const bookNode = store.nodes.find((n) => n.id === bookId || n.properties.slug === bookId);
		if (!bookNode) return { nodes: [], edges: [] };

		const connectedEdges = store.edges.filter((e) => e.source === bookNode.id || e.target === bookNode.id);
		const connectedNodeIds = new Set<string>([bookNode.id]);
		for (const e of connectedEdges) {
			connectedNodeIds.add(e.source);
			connectedNodeIds.add(e.target);
		}

		const nodes = store.nodes.filter((n) => connectedNodeIds.has(n.id));
		return { nodes, edges: connectedEdges };
	}

	/**
	 * Tìm cuốn sách phù hợp nhất từ câu truy vấn (Hỗ trợ giải quyết Đại từ Anaphora)
	 */
	public resolveBookEntity(query: string, activeSlug?: string): GraphNode | null {
		const store = this.load();
		const lower = (query || "").toLowerCase();
		const books = store.nodes.filter((n) => n.type === "book");

		// 1. Kiểm tra nếu câu thoại chứa đại từ chỉ định thay thế ("nó", "quyển này", "cuốn này", "cuốn đó")
		const isAnaphoric =
			/^(mua nó|mua quyển này|mua cuốn này|mua cuốn đó|lấy nó|cho tôi mua nó|cho tôi mua quyển này|cho tôi mua cuốn này|mua nó bằng cách nào|mua quyển này|cuốn này giá bao nhiêu|giá nó bao nhiêu|quyển này bao nhiêu|nó có mấy bản|cuốn đó thế nào)$/i.test(
				lower,
			) ||
			lower.includes("mua nó") ||
			lower.includes("mua quyển này") ||
			lower.includes("mua cuốn này") ||
			lower.includes("cuốn vừa nãy") ||
			lower.includes("quyển vừa rồi") ||
			lower === "mua quyển này" ||
			lower === "mua nó bằng cách nào" ||
			lower === "mua nó";

		if (isAnaphoric && activeSlug) {
			const activeBook = books.find((b) => b.properties.slug === activeSlug);
			if (activeBook) return activeBook;
		}

		// 2. Tìm kiếm theo tên sách hoặc từ khóa đặc trưng
		if (lower.includes("trí tuệ do thái") || lower.includes("do thái") || lower.includes("eran katz")) {
			return books.find((b) => b.properties.slug === "tri-tue-do-thai") || null;
		}
		if (lower.includes("đắc nhân tâm") || (lower.includes("giao tiếp") && !lower.includes("thói quen"))) {
			return books.find((b) => b.properties.slug === "dac-nhan-tam") || null;
		}
		if (lower.includes("bốn thỏa ước") || lower.includes("thỏa ước") || lower.includes("chữa lành") || lower.includes("toltec")) {
			return books.find((b) => b.properties.slug === "bon-thoa-uoc") || null;
		}
		if (lower.includes("sapiens") || lower.includes("lược sử loài người") || lower.includes("loài người") || lower.includes("tiến hóa")) {
			return books.find((b) => b.properties.slug === "sapiens-luoc-su-loai-nguoi") || null;
		}

		// 3. Quét khớp title hoặc slug trong toàn bộ nodes
		for (const b of books) {
			const titleLower = (b.properties.title || "").toLowerCase();
			const slugLower = (b.properties.slug || "").toLowerCase();
			if (lower.includes(titleLower) || lower.includes(slugLower)) {
				return b;
			}
		}

		// 4. Nếu vẫn không thấy nhưng có activeSlug
		if (activeSlug) {
			const activeBook = books.find((b) => b.properties.slug === activeSlug);
			if (activeBook) return activeBook;
		}

		return null;
	}

	/**
	 * Thực hiện Truy Vấn Lai GraphRAG (Graph Traversal + Semantic Vector Search)
	 */
	public queryGraphRAG(query: string, activeSlug?: string): GraphRAGQueryResult {
		const store = this.load();
		const bookNode = this.resolveBookEntity(query, activeSlug);
		const targetSlug = bookNode?.properties.slug || activeSlug;

		// 1. Graph Subgraph Traversal
		const subgraph = bookNode ? this.getConnectedSubgraph(bookNode.id) : { nodes: [], edges: [] };

		// 2. Trích xuất thông tin 2 phiên bản (Editions)
		const editions: Array<{ type: "ebook" | "physical"; name: string; price: string; sku: string }> = [];
		const editionNodes = subgraph.nodes.filter((n) => n.type === "edition");
		for (const ed of editionNodes) {
			editions.push({
				type: ed.properties.format || "ebook",
				name: ed.label,
				price: ed.properties.price || "59.000₫",
				sku: ed.properties.sku || "",
			});
		}

		// 3. Semantic Vector Search
		const queryVec = generateSemanticVector(query);
		const relevantChunks = searchVectorChunks(query, queryVec, store.chunks, 3, targetSlug);

		// 4. Tổng hợp Context Summary cho LLM
		let contextSummary = "";
		let totalChapters = 0;
		let totalWords = 0;
		const chapterList: Array<{ index: number; title: string }> = [];

		if (bookNode) {
			const authorNode = subgraph.nodes.find((n) => n.type === "author");
			const pubNode = subgraph.nodes.find((n) => n.type === "publisher");
			const yearNode = subgraph.nodes.find((n) => n.type === "year");

			const chapterNodes = subgraph.nodes
				.filter((n) => n.type === "chapter")
				.sort((a, b) => ((a.properties.chapterIndex as number) || 0) - ((b.properties.chapterIndex as number) || 0));

			totalChapters = chapterNodes.length;
			chapterNodes.forEach((c) => {
				chapterList.push({
					index: (c.properties.chapterIndex as number) || chapterList.length + 1,
					title: c.label,
				});
			});

			totalWords = (bookNode.properties.totalWords as number) ||
				chapterNodes.reduce((acc, c) => acc + ((c.properties.wordCount as number) || 0), 0);

			// Nhận diện các phần chính hoặc trọng tâm lớn của sách
			const majorParts = chapterNodes.filter((c) =>
				/(phần\s+(một|hai|ba|bốn|năm|sáu|i|ii|iii|iv|v|\d+)|thỏa ước thứ|cách mạng|mở đầu|lời khuyên)/i.test(c.label),
			);

			contextSummary = `[GRAPHRAG TRI THỨC SÁCH]:\n` +
				`- Sách: "${bookNode.properties.title}" (Tên gốc: "${bookNode.properties.originalTitle || bookNode.properties.title}")\n` +
				`- Tác giả: ${authorNode?.label || bookNode.properties.author || "AuraBook"}\n` +
				`- Nhà xuất bản: ${pubNode?.label || bookNode.properties.publisher || "NXB Tổng Hợp"} (Năm: ${yearNode?.label || bookNode.properties.publishYear || "2024"})\n` +
				`- Quy mô & Cấu trúc thực tế: Tổng cộng ${totalChapters} chương/mục (khoảng ${totalWords.toLocaleString("vi-VN")} từ).\n`;

			if (majorParts.length > 0) {
				contextSummary += `- Các phần chính: ${majorParts.map((p) => p.label).join(" | ")}\n`;
			}

			if (chapterNodes.length > 0) {
				contextSummary += `- Một số chương tiêu biểu: ${chapterNodes.slice(0, 5).map((c, i) => `${i + 1}. ${c.label}`).join("; ")}\n`;
			}

			contextSummary += `- Tóm tắt nội dung: ${bookNode.properties.description || ""}\n`;

			if (relevantChunks.length > 0) {
				contextSummary += `- Trích đoạn tiêu biểu (${relevantChunks[0].chunk.chapterTitle}): "${relevantChunks[0].chunk.content.slice(0, 220)}..."\n`;
			}
		}

		return {
			query,
			resolvedBookSlug: targetSlug,
			bookNode: bookNode || undefined,
			subgraph,
			totalChapters,
			totalWords,
			chapters: chapterList,
			relevantChunks: relevantChunks.map((r) => ({
				chunk: {
					id: r.chunk.id,
					bookTitle: r.chunk.bookTitle,
					chapterTitle: r.chunk.chapterTitle,
					content: r.chunk.content,
				},
				score: r.score,
			})),
			editions,
			contextSummary,
		};
	}

	public getStats() {
		const store = this.load();
		const bookNodes = store.nodes.filter((n) => n.type === "book");
		const authorNodes = store.nodes.filter((n) => n.type === "author");
		const publisherNodes = store.nodes.filter((n) => n.type === "publisher");
		const editionNodes = store.nodes.filter((n) => n.type === "edition");
		const chapterNodes = store.nodes.filter((n) => n.type === "chapter");

		return {
			totalBooks: bookNodes.length,
			totalNodes: store.nodes.length,
			totalEdges: store.edges.length,
			totalChunks: store.chunks.length,
			lastUpdated: store.updatedAt,
			books: bookNodes.map((b) => {
				const ebPrice = typeof b.properties.ebookPrice === "number" ? b.properties.ebookPrice : (parseInt(String(b.properties.ebookPrice || "59000").replace(/\D/g, "")) || 59000);
				const vtPrice = typeof b.properties.physicalPrice === "number" ? b.properties.physicalPrice : (parseInt(String(b.properties.physicalPrice || "118000").replace(/\D/g, "")) || 118000);
				return {
					id: b.id,
					title: b.properties.title,
					slug: b.properties.slug,
					author: b.properties.author,
					publisher: b.properties.publisher,
					publishYear: b.properties.publishYear,
					ebookPrice: b.properties.ebookPrice,
					physicalPrice: b.properties.physicalPrice,
					coverImage: b.properties.coverImage,
					description: (b.properties.description || "")
						.replace(/<[^>]+>/g, " ")
						.replace(/&nbsp;/g, " ")
						.replace(/&amp;/g, "&")
						.replace(/&quot;/g, '"')
						.replace(/\s+/g, " ")
						.trim(),
					isbn: b.properties.isbn || "",
					editions: [
						{ type: "ebook", name: "Sách Điện Tử Readium LCP", price: ebPrice },
						{ type: "physical", name: "Sách Vật Lý", price: vtPrice },
					],
					chaptersCount: store.edges.filter((e) => e.source === b.id && e.type === "CONTAINS_CHAPTER").length,
					totalWords: b.properties.totalWords,
				};
			}),
			entityBreakdown: {
				books: bookNodes.length,
				authors: authorNodes.length,
				publishers: publisherNodes.length,
				editions: editionNodes.length,
				chapters: chapterNodes.length,
			},
		};
	}

	public getStoreFilePath(): string {
		return getStoreFilePath();
	}

	public getChapters(bookSlug: string) {
		const store = this.load();
		return store.nodes
			.filter((n) => n.type === "chapter" && n.properties?.bookSlug === bookSlug)
			.map((n) => ({
				id: n.id,
				title: n.label,
				chapterIndex: n.properties?.chapterIndex || 1,
				wordCount: n.properties?.wordCount || 0,
				charCount: n.properties?.charCount || 0,
				preview: n.properties?.preview || "",
				chunksCount: store.chunks.filter((c) => c.bookSlug === bookSlug && c.chapterIndex === n.properties?.chapterIndex).length,
			}))
			.sort((a, b) => a.chapterIndex - b.chapterIndex);
	}

	public getChunks(options?: { bookSlug?: string; search?: string; limit?: number; offset?: number }) {
		const store = this.load();
		let chunks = store.chunks;

		if (options?.bookSlug) {
			chunks = chunks.filter((c) => c.bookSlug === options.bookSlug);
		}

		if (options?.search) {
			const s = options.search.toLowerCase().trim();
			chunks = chunks.filter(
				(c) =>
					c.content.toLowerCase().includes(s) ||
					c.chapterTitle.toLowerCase().includes(s) ||
					c.bookTitle.toLowerCase().includes(s) ||
					c.id.toLowerCase().includes(s),
			);
		}

		const total = chunks.length;
		const offset = options?.offset || 0;
		const limit = options?.limit || 50;
		const paged = chunks.slice(offset, offset + limit);

		return {
			total,
			offset,
			limit,
			chunks: paged.map((c) => ({
				id: c.id,
				bookId: c.bookId,
				bookSlug: c.bookSlug,
				bookTitle: c.bookTitle,
				chapterTitle: c.chapterTitle,
				chapterIndex: c.chapterIndex,
				content: c.content,
				charCount: c.content.length,
				wordCount: c.content.split(/\s+/).filter(Boolean).length,
				embeddingDim: c.embedding?.length || 0,
				embeddingPreview: c.embedding?.slice(0, 5),
				createdAt: c.createdAt,
			})),
		};
	}

	public getRawData() {
		const store = this.load();
		const filePath = getStoreFilePath();
		let fileSize = 0;
		try {
			if (fs.existsSync(filePath)) {
				fileSize = fs.statSync(filePath).size;
			}
		} catch (e) { }

		return {
			filePath,
			fileSize,
			fileSizeBytes: fileSize,
			fileSizeFormatted: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
			version: store.version,
			updatedAt: store.updatedAt,
			totalNodes: store.nodes.length,
			totalEdges: store.edges.length,
			totalChunks: store.chunks.length,
		};
	}

	public cleanReset(): void {
		this.data = {
			version: "1.0.0",
			updatedAt: new Date().toISOString(),
			nodes: [],
			edges: [],
			chunks: [],
		};
		this.save();
	}

	/**
	 * Tìm kiếm sản phẩm sách theo ngữ cảnh ngữ nghĩa tự nhiên (GraphRAG Semantic Search)
	 * Kích hoạt khi tìm kiếm từ khóa truyền thống không thấy kết quả.
	 * Cho phép người dùng gõ ngôn ngữ tự nhiên tự do:
	 * Ví dụ: "sách đối nhân xử thế", "làm sao để tạo thói quen tốt", "nguồn gốc loài người", "lập trình phần mềm sạch"...
	 */
	public searchProductsByContext(
		query: string,
		options?: { locale?: string; channel?: string; limit?: number },
	): GraphRAGSearchResult {
		const store = this.load();
		const cleanQuery = (query || "").trim().toLowerCase();
		if (!cleanQuery) {
			return {
				products: [],
				matchedConcepts: [],
				totalCount: 0,
				reasoningSummary: "",
				queryInterpretation: "",
				recommendations: [],
				supplementaryRecommendations: [],
				hasDirectMatch: false,
			};
		}

		const channel = options?.channel || "channel-vnd";
		const locale = options?.locale || "vi";
		const limit = options?.limit || 12;

		// 1. Sinh vector ngữ nghĩa của câu truy vấn
		const queryVec = generateSemanticVector(cleanQuery);

		// 2. Nhận diện các khái niệm / cụm từ khóa ngữ nghĩa liên quan
		const matchedConcepts: string[] = [];
		const conceptLabels = [
			"Giao tiếp & Ứng xử (Đắc Nhân Tâm)",
			"Tâm lý học & Chữa lành (Bốn Thỏa Ước)",
			"Lịch sử & Tiến hóa nhân loại (Sapiens)",
			"Trí tuệ & Rèn luyện trí nhớ (Trí Tuệ Do Thái)",
			"Thói quen & Kỷ luật tinh thần (Bốn Thỏa Ước)",
			"Tư duy Logic & Học tập đỉnh cao (Trí Tuệ Do Thái)",
			"Kinh doanh & Phát triển bản thân",
			"Phát triển nhận thức & Kỹ năng sống",
		];

		SEMANTIC_KEYWORDS.forEach((cluster, idx) => {
			for (const kw of cluster) {
				if (cleanQuery.includes(kw)) {
					const label = conceptLabels[idx];
					if (label && !matchedConcepts.includes(label)) {
						matchedConcepts.push(label);
					}
					break;
				}
			}
		});

		// 3. Lấy danh sách các nút sách (Book Nodes)
		const bookNodes = [...store.nodes.filter((n) => n.type === "book")];

		// Bổ sung các đầu sách tiêu chuẩn nếu chưa có trong node
		const fallbackBooks: GraphNode[] = [
			{
				id: "book-dac-nhan-tam",
				type: "book",
				label: "Đắc Nhân Tâm",
				properties: {
					title: "Đắc Nhân Tâm",
					originalTitle: "How to Win Friends and Influence People",
					slug: "dac-nhan-tam",
					author: "Dale Carnegie",
					publisher: "First News & NXB Tổng Hợp TPHCM",
					description: "Cẩm nang giao tiếp, thấu hiểu tâm lý và nghệ thuật thu phục lòng người kinh điển nhất mọi thời đại.",
					coverImage: "/products/book-dac-nhan-tam-cover.jpg",
					ebookPrice: "59.000₫",
					physicalPrice: "118.000₫",
					rating: 4.9,
				},
			},
			{
				id: "book-bon-thoa-uoc",
				type: "book",
				label: "Bốn Thỏa Ước",
				properties: {
					title: "Bốn Thỏa Ước",
					originalTitle: "The Four Agreements",
					slug: "bon-thoa-uoc",
					author: "Don Miguel Ruiz",
					publisher: "NXB Tri Thức",
					description: "Triết lý Toltec khai sáng giúp bạn thoát khỏi những niềm tin giới hạn, chữa lành nội tâm và tìm thấy tự do đích thực.",
					coverImage: "/products/book-bon-thoa-uoc-cover.jpg",
					ebookPrice: "49.000₫",
					physicalPrice: "98.000₫",
					rating: 4.8,
				},
			},
			{
				id: "book-sapiens",
				type: "book",
				label: "Sapiens: Lược Sử Loài Người",
				properties: {
					title: "Sapiens: Lược Sử Loài Người",
					originalTitle: "A Brief History of Humankind",
					slug: "sapiens-luoc-su-loai-nguoi",
					author: "Yuval Noah Harari",
					publisher: "NXB Tri Thức & Nhã Nam",
					description: "Hành trình vĩ đại từ loài vượn người trở thành kẻ thống trị địa cầu qua các cuộc cách mạng nhận thức, nông nghiệp và khoa học.",
					coverImage: "/products/book-sapiens-luoc-su-loai-nguoi-cover.jpeg",
					ebookPrice: "89.000₫",
					physicalPrice: "189.000₫",
					rating: 5.0,
				},
			},
			{
				id: "book-tri-tue-do-thai",
				type: "book",
				label: "Trí Tuệ Do Thái",
				properties: {
					title: "Trí Tuệ Do Thái",
					originalTitle: "Jerome Becomes a Genius",
					slug: "tri-tue-do-thai",
					author: "Eran Katz",
					publisher: "Alpha Books & NXB Lao Động - Xã Hội",
					description: "Bí quyết rèn luyện trí nhớ phi thường, phương pháp tưởng tượng kỳ lạ và tư duy làm giàu sắc bén của người Do Thái.",
					coverImage: "/products/book-tri-tue-do-thai-cover.jpg",
					ebookPrice: "69.000₫",
					physicalPrice: "135.000₫",
					rating: 4.8,
				},
			},
		];

		for (const fb of fallbackBooks) {
			if (!bookNodes.some((b) => b.properties?.slug === fb.properties.slug)) {
				bookNodes.push(fb);
			}
		}

		// 4. Chấm điểm từng cuốn sách dựa trên GraphRAG Chunks & Entity Properties
		const VIETNAMESE_STOP_WORDS = new Set([
			"về", "của", "và", "các", "những", "trong", "cho", "với", "là", "có", "để", "được", "tôi", "bạn",
			"ở", "ra", "lại", "lên", "xuống", "một", "này", "đó", "thì", "mà", "sao", "gì", "ai", "đâu", "nào",
			"cuốn", "sách", "những", "các", "muốn", "tìm", "đọc", "như", "thế", "hỏi", "giúp", "với"
		]);

		const rawWords = cleanQuery.split(/\s+/).filter((w) => w.length > 0);
		const meaningfulWords = rawWords.filter((w) => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
		const phrases: string[] = [];
		for (let i = 0; i < rawWords.length - 1; i++) {
			if (!VIETNAMESE_STOP_WORDS.has(rawWords[i]) || !VIETNAMESE_STOP_WORDS.has(rawWords[i + 1])) {
				phrases.push(`${rawWords[i]} ${rawWords[i + 1]}`);
			}
		}

		const scoredBooks: Array<{
			book: GraphNode;
			score: number;
			matchReasons: string[];
			topChunk?: VectorChunk;
			matchedTerms: string[];
		}> = [];

		for (const book of bookNodes) {
			let score = 0;
			const matchReasons: string[] = [];
			const matchedTerms: string[] = [];
			const slug = book.properties?.slug || "";
			const title = (book.properties?.title || book.label || "").toLowerCase();
			const author = (book.properties?.author || "").toLowerCase();
			const desc = (book.properties?.description || "").toLowerCase();
			const origTitle = (book.properties?.originalTitle || "").toLowerCase();

			// 4.1. Khớp cụm từ nguyên vẹn (Phrase match - Điểm số cao nhất)
			for (const phrase of phrases) {
				if (title.includes(phrase)) {
					score += 1.4;
					matchReasons.push(`Khớp cụm từ tiêu đề: "${phrase}"`);
					matchedTerms.push(phrase);
				} else if (desc.includes(phrase)) {
					score += 0.9;
					matchReasons.push(`Khớp cụm từ trong giới thiệu: "${phrase}"`);
					matchedTerms.push(phrase);
				}
			}

			// 4.2. Khớp từng từ khóa có nghĩa (Đã loại stop words)
			let wordHits = 0;
			for (const w of meaningfulWords) {
				if (title.includes(w)) {
					score += 0.7;
					wordHits++;
					if (!matchedTerms.includes(w)) matchedTerms.push(w);
				} else if (desc.includes(w) || author.includes(w) || origTitle.includes(w)) {
					score += 0.4;
					wordHits++;
					if (!matchedTerms.includes(w)) matchedTerms.push(w);
				}
			}
			if (wordHits > 0 && matchReasons.length === 0) {
				matchReasons.push(`Khớp ${wordHits} từ khóa chủ đề`);
			}

			// 4.3. Khớp cụm chuyên đề ngữ nghĩa đặc trưng (Semantic Cluster Alignment)
			if (
				(cleanQuery.includes("loài người") || cleanQuery.includes("tiến hóa") || cleanQuery.includes("nhân loại") || cleanQuery.includes("văn minh") || cleanQuery.includes("sapiens") || cleanQuery.includes("harari") || cleanQuery.includes("lịch sử loài người")) &&
				slug === "sapiens-luoc-su-loai-nguoi"
			) {
				score += 1.6;
				matchReasons.push("Khớp chuyên đề: Lịch sử & Tiến hóa nhân loại");
				if (!matchedTerms.includes("loài người")) matchedTerms.push("loài người");
			}

			if (
				(cleanQuery.includes("do thái") || cleanQuery.includes("trí nhớ") || cleanQuery.includes("ghi nhớ") || cleanQuery.includes("eran katz") || cleanQuery.includes("trí tuệ") || cleanQuery.includes("thông minh") || cleanQuery.includes("tư duy phản biện")) &&
				slug === "tri-tue-do-thai"
			) {
				score += 1.6;
				matchReasons.push("Khớp chuyên đề: Rèn luyện trí nhớ & Trí tuệ Do Thái");
				if (!matchedTerms.includes("trí tuệ")) matchedTerms.push("trí tuệ");
			}

			if (
				(cleanQuery.includes("giao tiếp") || cleanQuery.includes("ứng xử") || cleanQuery.includes("đối nhân") || cleanQuery.includes("xử thế") || cleanQuery.includes("thu phục lòng người") || cleanQuery.includes("kết bạn") || cleanQuery.includes("đắc nhân tâm") || cleanQuery.includes("dale carnegie")) &&
				slug === "dac-nhan-tam"
			) {
				score += 1.6;
				matchReasons.push("Khớp chuyên đề: Giao tiếp & Thu phục lòng người");
				if (!matchedTerms.includes("đối nhân xử thế")) matchedTerms.push("đối nhân xử thế");
			}

			if (
				(cleanQuery.includes("bốn thỏa ước") || cleanQuery.includes("thỏa ước") || cleanQuery.includes("toltec") || cleanQuery.includes("chữa lành") || cleanQuery.includes("bình an") || cleanQuery.includes("nội tâm") || cleanQuery.includes("tự do nội tâm")) &&
				slug === "bon-thoa-uoc"
			) {
				score += 1.6;
				matchReasons.push("Khớp chuyên đề: Tâm lý học & Minh triết Toltec");
				if (!matchedTerms.includes("chữa lành nội tâm")) matchedTerms.push("chữa lành nội tâm");
			}

			// 4.4. Đối chiếu Vector Chunks trong kho lưu trữ
			const bookChunks = store.chunks.filter((c) => c.bookSlug === slug || c.bookId === book.id);
			let bestChunk: VectorChunk | undefined;
			if (bookChunks.length > 0) {
				const topChunks = searchVectorChunks(cleanQuery, queryVec, bookChunks, 3, slug);
				if (topChunks.length > 0 && topChunks[0].score > 0.28) {
					bestChunk = topChunks[0].chunk;
					const sim = topChunks[0].score;
					score += sim * 0.9;
					matchReasons.push(`Độ tương đồng nội dung văn bản: ${(sim * 100).toFixed(0)}%`);
				}
			}

			// 4.5. Tích hợp điểm thưởng/phạt tự học (RLHF / Active Learning Feedback)
			const directKey = `${cleanQuery}:::${slug}`;
			const directBonus = store.feedbackScores?.[directKey] || 0;
			let kwBonus = 0;
			for (const w of meaningfulWords) {
				const kwKey = `${w}:::${slug}`;
				if (store.feedbackScores?.[kwKey]) {
					kwBonus += store.feedbackScores[kwKey] * 0.25;
				}
			}
			const totalFeedbackBonus = directBonus * 0.8 + kwBonus;
			score += totalFeedbackBonus;

			// Lưu toàn bộ sách vào danh sách để phục vụ cả nhóm khớp cao và nhóm tham khảo mở rộng
			scoredBooks.push({
				book,
				score: Number(score.toFixed(4)),
				matchReasons: matchReasons.length > 0 ? matchReasons : ["Liên kết mở rộng trong đồ thị tri thức"],
				topChunk: bestChunk,
				matchedTerms,
			});
		}

		// 5. Phân tích ngữ nghĩa & kiểm tra độ khớp trực tiếp (Semantic Direct Match Check)
		const isOutOfCatalog =
			cleanQuery.includes("hồ chí minh") ||
			cleanQuery.includes("bác hồ") ||
			cleanQuery.includes("nguyễn ái quốc") ||
			cleanQuery.includes("nguyen ai quoc") ||
			cleanQuery.includes("ho chi minh") ||
			cleanQuery.includes("bac ho") ||
			cleanQuery.includes("võ nguyên giáp") ||
			cleanQuery.includes("vo nguyen giap") ||
			cleanQuery.includes("nấu ăn") ||
			cleanQuery.includes("truyện tranh");

		// Sắp xếp theo điểm tương đồng ngữ cảnh giảm dần
		scoredBooks.sort((a, b) => b.score - a.score);

		const topScore = scoredBooks[0]?.score || 0;
		const hasDirectMatch =
			!isOutOfCatalog &&
			topScore >= 0.65 &&
			(scoredBooks[0]?.matchedTerms?.length || 0) > 0;

		let finalMatches = scoredBooks.filter((item) => {
			if (hasDirectMatch) {
				if (item.score === topScore && topScore > 0.3) return true;
				return item.score >= 0.5 && item.score >= topScore * 0.35;
			}
			return false;
		}).slice(0, limit);

		// Nếu không có sách khớp trực tiếp (như tìm Hồ Chí Minh, nấu ăn...):
		// Lấy 3 cuốn tiêu biểu trong kho sách để người dùng có thể tham khảo mở rộng
		if (finalMatches.length === 0 && scoredBooks.length > 0) {
			finalMatches = scoredBooks.slice(0, Math.min(3, scoredBooks.length));
		}

		const primaryIds = new Set(finalMatches.map((m) => m.book.id));
		const supplementaryScored = scoredBooks.filter((m) => !primaryIds.has(m.book.id));

		// Hàm tính độ tương đồng chuẩn hóa (%) và nhãn phân loại trung thực
		const calculateSimilarityInfo = (itemScore: number, isPrimary: boolean, rankIdx: number) => {
			if (!hasDirectMatch) {
				const percent = Math.max(12, 22 - rankIdx * 4);
				return {
					percent,
					tier: "exploratory" as const,
					label: "Ấn phẩm tham khảo trong kho sách (Chưa có sách khớp trực tiếp)",
				};
			}

			let percent = 0;
			if (isPrimary) {
				if (rankIdx === 0) {
					percent = Math.min(98, Math.max(88, Math.round(85 + (itemScore / Math.max(topScore, 1)) * 12)));
				} else {
					percent = Math.min(88, Math.max(72, Math.round(70 + (itemScore / Math.max(topScore, 1)) * 16)));
				}
			} else {
				if (topScore > 0) {
					const ratio = itemScore / topScore;
					percent = Math.min(68, Math.max(25, Math.round(ratio * 65)));
				} else {
					percent = Math.max(25, 45 - rankIdx * 5);
				}
			}

			let tier: "high" | "medium" | "exploratory" = "exploratory";
			let label = "";

			if (percent >= 75) {
				tier = "high";
				label = `Độ tương đồng cao (${percent}%) • Khớp trọng tâm`;
			} else if (percent >= 50) {
				tier = "medium";
				label = `Độ tương đồng trung bình (${percent}%) • Góc nhìn bổ trợ`;
			} else {
				tier = "exploratory";
				label = `Độ tương đồng mở rộng (${percent}%) • Tham khảo đa chiều`;
			}

			return { percent, tier, label };
		};

		// Lấy thống kê số lượt like / dislike của cuốn sách
		const getBookFeedbackCounts = (bSlug: string) => {
			const bFeedbacks = (store.feedbacks || []).filter((f) => f.bookSlug === bSlug);
			const likesCount = bFeedbacks.filter((f) => f.type === "like").length;
			const dislikesCount = bFeedbacks.filter((f) => f.type === "dislike").length;
			return { likesCount, dislikesCount };
		};

		// 6. Chuyển đổi thành ProductCardData chuẩn và chi tiết đề xuất chuyên sâu
		let queryInterpretation = getQueryInterpretation(cleanQuery);
		let reasoningSummary = "";

		if (!hasDirectMatch) {
			if (isOutOfCatalog) {
				queryInterpretation = `Hệ thống phân tích ngữ nghĩa nhận diện bạn đang tìm kiếm về "${query}". Rất tiếc, kho sách hiện tại của AuraBook chưa có tác phẩm viết riêng về nhân vật / chủ đề này.`;
				reasoningSummary = `Kho sách AuraBook hiện chưa có ấn phẩm về "${query}". Dưới đây là các đầu sách tuyển chọn tiêu biểu trong kho sách để bạn tham khảo khám phá:`;
			} else {
				queryInterpretation = `Hệ thống phân tích ngữ nghĩa câu hỏi "${query}" nhưng chưa tìm thấy ấn phẩm khớp trọng tâm trực tiếp trong kho sách.`;
				reasoningSummary = `Dưới đây là các ấn phẩm nổi bật trong kho sách AuraBook để bạn tham khảo:`;
			}
		} else {
			reasoningSummary = matchedConcepts.length > 0
				? `GraphRAG AI đã phân tích câu hỏi "${query}", ưu tiên các tác phẩm khớp cao nhất về chủ đề: ${matchedConcepts.join(", ")}.`
				: `GraphRAG AI đã phân tích ngữ nghĩa câu hỏi "${query}" và tìm thấy ${finalMatches.length} ấn phẩm khớp trọng tâm nhất cùng ${supplementaryScored.length} tác phẩm tham khảo mở rộng.`;
		}

		// Tạo danh sách Đề xuất Trọng tâm (Primary Recommendations)
		const recommendations: BookRecommendationDetail[] = [];
		const products: ProductCardData[] = finalMatches.map(({ book, matchReasons, topChunk, matchedTerms, score: itemScore }, idx) => {
			const bSlug = book.properties?.slug || "dac-nhan-tam";
			const ebPriceStr = String(book.properties?.ebookPrice || "59.000₫");
			const vtPriceStr = String(book.properties?.physicalPrice || "118.000₫");
			const ebPriceNum = parseInt(ebPriceStr.replace(/\D/g, "")) || 59000;
			const vtPriceNum = parseInt(vtPriceStr.replace(/\D/g, "")) || 118000;
			const title = book.properties?.title || book.label;
			const author = book.properties?.author || "AuraBook Publishing";
			const coverImage = book.properties?.coverImage || "/products/book-dac-nhan-tam-cover.jpg";
			const href = `/${locale}/${channel}/products/${bSlug}`;

			// Tạo lý do và điểm sáng DYNAMIC theo đúng từ khóa người dùng
			let { reason, coreInsight } = generateDynamicRationale(
				book,
				cleanQuery,
				topChunk,
				matchReasons,
				matchedTerms
			);

			if (!hasDirectMatch) {
				reason = isOutOfCatalog
					? `Kho sách AuraBook hiện chưa có tác phẩm viết riêng về "${query}". Bạn có thể tham khảo ấn phẩm tiêu biểu "${title}" (${author}) từ kho sách hiện có của chúng tôi.`
					: `Ấn phẩm xuất sắc thuộc kho sách tuyển chọn của AuraBook để bạn tham khảo thêm.`;
				coreInsight = `Gợi ý tham khảo chất lượng cao từ kho tri thức AuraBook.`;
			}

			const { percent, tier, label } = calculateSimilarityInfo(itemScore, true, idx);
			const { likesCount, dislikesCount } = getBookFeedbackCounts(bSlug);

			recommendations.push({
				id: book.id,
				slug: bSlug,
				title,
				author,
				coverImage,
				price: ebPriceNum,
				href,
				recommendationReason: reason,
				coreInsight,
				matchedConcepts: matchReasons,
				similarityScore: percent,
				similarityTier: tier,
				similarityLabel: label,
				likesCount,
				dislikesCount,
			});

			return {
				id: book.id,
				name: title,
				slug: bSlug,
				brand: author,
				price: ebPriceNum,
				priceStop: vtPriceNum,
				compareAtPrice: null,
				discountPercent: null,
				currency: "VND",
				localeBcp47: "vi-VN",
				image: coverImage,
				href,
				badge: "New",
				isBestseller: true,
				category: {
					id: `cat-${bSlug}`,
					name: matchReasons[0] || "Ấn phẩm chọn lọc",
					slug: bSlug,
				},
			};
		});

		// Tạo danh sách Đề xuất Tham khảo Thêm (Supplementary Recommendations)
		const supplementaryRecommendations: BookRecommendationDetail[] = supplementaryScored.map(
			({ book, matchReasons, topChunk, matchedTerms, score: itemScore }, idx) => {
				const bSlug = book.properties?.slug || "dac-nhan-tam";
				const ebPriceStr = String(book.properties?.ebookPrice || "59.000₫");
				const ebPriceNum = parseInt(ebPriceStr.replace(/\D/g, "")) || 59000;
				const title = book.properties?.title || book.label;
				const author = book.properties?.author || "AuraBook Publishing";
				const coverImage = book.properties?.coverImage || "/products/book-dac-nhan-tam-cover.jpg";
				const href = `/${locale}/${channel}/products/${bSlug}`;

				let { reason, coreInsight } = generateDynamicRationale(
					book,
					cleanQuery,
					topChunk,
					matchReasons,
					matchedTerms
				);

				if (!hasDirectMatch) {
					reason = `Ấn phẩm tuyển chọn trong kho sách AuraBook để bạn tham khảo thêm.`;
					coreInsight = `Gợi ý đọc sách mở rộng từ AuraBook.`;
				}

				const { percent, tier, label } = calculateSimilarityInfo(itemScore, false, idx);
				const { likesCount, dislikesCount } = getBookFeedbackCounts(bSlug);

				return {
					id: book.id,
					slug: bSlug,
					title,
					author,
					coverImage,
					price: ebPriceNum,
					href,
					recommendationReason: reason,
					coreInsight,
					matchedConcepts: matchReasons,
					similarityScore: percent,
					similarityTier: tier,
					similarityLabel: label,
					likesCount,
					dislikesCount,
				};
			}
		);

		return {
			products,
			matchedConcepts,
			totalCount: products.length,
			reasoningSummary,
			queryInterpretation,
			recommendations,
			supplementaryRecommendations,
			hasDirectMatch,
		};
	}
}

export interface BookRecommendationDetail {
	id: string;
	slug: string;
	title: string;
	author: string;
	coverImage: string;
	price: number;
	href: string;
	recommendationReason: string;
	coreInsight: string;
	matchedConcepts: string[];
	similarityScore: number;
	similarityTier: "high" | "medium" | "exploratory";
	similarityLabel: string;
	likesCount?: number;
	dislikesCount?: number;
}

export interface GraphRAGSearchResult {
	products: ProductCardData[];
	matchedConcepts: string[];
	totalCount: number;
	reasoningSummary: string;
	queryInterpretation: string;
	recommendations: BookRecommendationDetail[];
	supplementaryRecommendations: BookRecommendationDetail[];
	hasDirectMatch: boolean;
}

function getQueryInterpretation(query: string): string {
	const lower = query.toLowerCase();
	if (lower.includes("loài người") || lower.includes("tiến hóa") || lower.includes("văn minh")) {
		return `Bạn đang tìm kiếm các luận điểm về "${query}" – hành trình tiến hóa sinh học, sự phát triển nhận thức và cách loài người vượt lên định hình lịch sử văn minh địa cầu.`;
	}
	if (lower.includes("thông tuệ") || lower.includes("trí tuệ") || lower.includes("thông minh") || lower.includes("sáng suốt")) {
		return `Bạn đang quan tâm đến sự thông tuệ và năng lực nhận thức sâu sắc cho chủ đề "${query}" – trạng thái thấu hiểu quy luật, làm chủ tâm trí và có tư duy sáng suốt trước những quyết định quan trọng của cuộc đời.`;
	}
	if (lower.includes("giao tiếp") || lower.includes("ứng xử") || lower.includes("đối nhân xử thế") || lower.includes("thu phục lòng người")) {
		return `Bạn đang tìm kiếm nghệ thuật thấu cảm và ứng xử nhân bản cho chủ đề "${query}" – kỹ năng lắng nghe sâu sắc, làm chủ cảm xúc và xây dựng các mối quan hệ chân thành, bền vững.`;
	}
	if (lower.includes("tâm lý") || lower.includes("chữa lành") || lower.includes("nội tâm") || lower.includes("bình an") || lower.includes("tự do")) {
		return `Bạn đang hướng đến hành trình thấu hiểu tâm lý học và giải phóng áp lực nội tâm cho chủ đề "${query}" – buông bỏ những định kiến áp đặt để tìm lại sự tự do tinh thần và an lạc nguyên bản.`;
	}
	if (lower.includes("thói quen") || lower.includes("kỷ luật") || lower.includes("năng suất") || lower.includes("thay đổi")) {
		return `Bạn đang tìm kiếm phương pháp chuyển hóa bản thân cho từ khóa "${query}" thông qua khoa học hành vi – cách thức xây dựng kỷ luật bền vững từ những thói quen vi mô mỗi ngày.`;
	}
	if (lower.includes("lập trình") || lower.includes("code") || lower.includes("mã sạch") || lower.includes("phần mềm")) {
		return `Bạn đang tìm kiếm chuẩn mực kỹ nghệ phần mềm và tư duy viết mã sạch cho "${query}" – triết lý giúp kiến trúc hệ thống bền vững, thanh lịch và chuyên nghiệp.`;
	}
	return `GraphRAG AI đã phân tích câu hỏi "${query}" và ánh xạ vào đồ thị tri thức để tìm ra những tác phẩm giải quyết trúng nhu cầu đọc của bạn.`;
}

/**
 * TẠO MỚI LIÊN TỤC LÝ DO ĐỀ XUẤT VÀ ĐIỂM SÁNG TRI THỨC DỰA TRÊN CHÍNH TỪ KHÓA CỦA NGƯỜI DÙNG
 */
function generateDynamicRationale(
	book: GraphNode,
	query: string,
	topChunk?: VectorChunk,
	_matchReasons: string[] = [],
	matchedTerms: string[] = []
): { reason: string; coreInsight: string } {
	const slug = book.properties?.slug || "";
	const title = book.properties?.title || book.label || "";
	const author = book.properties?.author || "";
	const termsHighlight = matchedTerms.length > 0 ? `từ khóa "${matchedTerms.join('", "')}"` : `yêu cầu "${query}"`;
	const chapterDetail = topChunk?.chapterTitle ? ` (Khớp nội dung tại chương: "${topChunk.chapterTitle}")` : "";

	let reason = "";
	let coreInsight = "";

	switch (slug) {
		case "sapiens-luoc-su-loai-nguoi":
			if (query.includes("loài người") || query.includes("tiến hóa") || query.includes("lịch sử")) {
				reason = `Được hệ thống xếp ưu tiên số 1 cho tìm kiếm "${query}": Tác phẩm của ${author} giải mã trực diện nguồn gốc, hành trình tiến hóa sinh học và những bước nhảy vọt về tư duy nhận thức đã đưa loài người trở thành kẻ thống trị địa cầu${chapterDetail}.`;
				coreInsight = `Điểm sáng đắt giá cho chủ đề "${query}": Nhờ "Cách mạng Nhận thức", loài người là sinh vật duy nhất có khả năng tư duy trừu tượng và tin vào các trật tự tưởng tượng chung (tiền tệ, quốc gia, tôn giáo) để hợp tác quy mô hàng triệu cá thể.`;
			} else if (query.includes("tư duy") || query.includes("nhận thức") || query.includes("thông tuệ")) {
				reason = `Hệ thống đề xuất "${title}" để trả lời cho truy vấn "${query}": Sách cung cấp một bức tranh toàn cảnh về cách tâm trí và tư duy loài người tiến hóa qua 3 cuộc cách mạng lớn: Nhận thức, Nông nghiệp và Khoa học${chapterDetail}.`;
				coreInsight = `Điểm sáng cho "${query}": Nhận thức của con người không đứng yên mà được định hình liên tục bởi các huyền thoại hư cấu do chính trí tuệ loài người sáng tạo ra.`;
			} else {
				reason = `Đề xuất cuốn sách này nhằm giải quyết ${termsHighlight} từ góc độ lịch sử nhân loại học: Tác phẩm phân tích cách các hệ tư tưởng và cấu trúc xã hội hình thành qua hàng vạn năm${chapterDetail}.`;
				coreInsight = `Góc nhìn cốt lõi cho "${query}": Khám phá bản chất của hạnh phúc con người và vị thế của cá nhân trong dòng chảy văn minh vĩ đại.`;
			}
			break;

		case "tri-tue-do-thai":
			if (query.includes("tư duy") || query.includes("trí nhớ") || query.includes("ghi nhớ") || query.includes("thông minh")) {
				reason = `Được chọn cho từ khóa "${query}" vì cuốn sách đi thẳng vào bản chất của phương pháp rèn luyện tư duy phản biện sắc bén và khả năng ghi nhớ phi thường của người Do Thái${chapterDetail}. Tác giả ${author} chứng minh tư duy là kỹ năng hoàn toàn có thể tôi luyện.`;
				coreInsight = `Điểm sáng thực hành cho "${query}": Ứng dụng kỹ thuật "Căn phòng La Mã", trí tưởng tượng liên tưởng kỳ lạ và văn hóa tranh luận havruta để nhân đôi hiệu suất tư duy.`;
			} else if (query.includes("làm giàu") || query.includes("kinh doanh") || query.includes("thành công")) {
				reason = `Đề xuất cho "${query}" vì tác phẩm đúc kết triết lý coi tri thức là cội nguồn của mọi sự thịnh vượng: Người Do Thái biến sự thông tuệ học thuật thành khả năng làm chủ tài chính và kinh doanh vượt trội${chapterDetail}.`;
				coreInsight = `Điểm sáng cốt lõi: Tri thức là tài sản duy nhất không một ai có thể cướp đoạt, và tư duy sắc bén chính là bệ phóng tạo nên sự giàu có bền vững.`;
			} else {
				reason = `Được đề xuất vì khớp với ${termsHighlight} về phát triển năng lực não bộ và trí tuệ: Cung cấp phương pháp học hỏi tích cực 5.000 năm của dân tộc thông thái bậc nhất${chapterDetail}.`;
				coreInsight = `Góc nhìn khai mở cho "${query}": Luôn nghi vấn, tranh biện để đi đến tận cùng bản chất sự thật thay vì chấp nhận thụ động.`;
			}
			break;

		case "dac-nhan-tam":
			if (query.includes("giao tiếp") || query.includes("ứng xử") || query.includes("đối nhân") || query.includes("xử thế")) {
				reason = `Khớp chuẩn xác nhất với từ khóa "${query}": Cuốn sách kinh điển của ${author} cung cấp bộ nguyên tắc tâm lý học hành vi giúp bạn làm chủ nghệ thuật đối nhân xử thế và thấu cảm sâu sắc trong từng cuộc trò chuyện${chapterDetail}.`;
				coreInsight = `Điểm sáng đắt giá cho "${query}": Chuyển hóa tâm thế từ việc "muốn người khác lắng nghe mình" sang "thấu hiểu và tôn vinh giá trị thực của đối phương".`;
			} else if (query.includes("thu phục") || query.includes("lòng người") || query.includes("lãnh đạo") || query.includes("kết bạn")) {
				reason = `Được AI chỉ định cho mục tiêu "${query}" vì tác phẩm chỉ ra cách tạo dựng sức hút cá nhân chân thành, chuyển hóa sự phản kháng của đối phương thành sự đồng thuận tự nguyện${chapterDetail}.`;
				coreInsight = `Bí quyết then chốt cho "${query}": Cách duy nhất để đạt được sự ủng hộ chân thành từ người khác là khơi gợi ở họ niềm khao khát tự thân được hợp tác.`;
			} else {
				reason = `Đề xuất tác phẩm vì mang lại lời giải sâu sắc cho tìm kiếm "${query}" dưới lăng kính trí tuệ cảm xúc (EQ) và nghệ thuật kết nối con người${chapterDetail}.`;
				coreInsight = `Điểm sáng cho "${query}": Lòng chân thành và sự tôn trọng đối phương là chìa khóa giải quyết mọi rào cản tâm lý.`;
			}
			break;

		case "bon-thoa-uoc":
			if (query.includes("tâm lý") || query.includes("chữa lành") || query.includes("nội tâm") || query.includes("bình an")) {
				reason = `Được tuyển chọn đặc biệt cho tìm kiếm "${query}": Tác phẩm dẫn lối độc giả thoát khỏi những tổn thương và xung đột nội tâm bằng minh triết Toltec cổ xưa, tái thiết sự an lạc tinh thần nguyên bản${chapterDetail}.`;
				coreInsight = `Điểm sáng chữa lành cho "${query}": Thực hành "Không vơ mọi chuyện vào mình" và "Không suy diễn" để chấm dứt 90% sự đau khổ vô hình trong tâm trí.`;
			} else if (query.includes("tự do") || query.includes("thỏa ước") || query.includes("bản thân")) {
				reason = `Đáp ứng trực tiếp truy vấn "${query}": Tác phẩm chỉ ra cách bẻ gãy những thỏa ước tiêu cực do xã hội áp đặt để giành lại quyền làm chủ cuộc đời mình${chapterDetail}.`;
				coreInsight = `Điểm sáng tự do cho "${query}": Lời nói của bạn mang năng lượng kiến tạo; dùng lời nói thuần khiết và luôn nỗ lực hết mình là đôi cánh đưa đến tự do nội tâm.`;
			} else {
				reason = `Được đề xuất cho chủ đề "${query}" nhằm cung cấp góc nhìn triết học và tâm lý học khai sáng về bản chất sự thật và tự do tâm trí${chapterDetail}.`;
				coreInsight = `Minh triết Toltec cho "${query}": Nhận thức rõ chiếc gương phản chiếu tâm trí để sống chân thật với chính mình.`;
			}
			break;

		default:
			reason = `Hệ thống đề xuất tác phẩm này cho từ khóa "${query}" dựa trên độ khớp ngữ nghĩa (${termsHighlight}) và các mắt xích thực thể trong kho tri thức${chapterDetail}.`;
			coreInsight = `Điểm sáng tri thức: Cung cấp góc nhìn chuyên sâu giải quyết đúng nhu cầu độc giả đang tìm kiếm về "${query}".`;
			break;
	}

	return { reason, coreInsight };
}

export const graphRAGStore = new AuraBookGraphRAGStore();

