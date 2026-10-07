import fs from "node:fs";
import path from "node:path";
import { type Review, type ReviewSummary, type CreateReviewInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

const SEED_REVIEWS: Review[] = [
	{
		id: "rev-1",
		productSlug: "dac-nhan-tam",
		authorName: "Nguyễn Minh Tuấn",
		rating: 5,
		title: "Cuốn sách gối đầu giường kinh điển",
		content: "Đắc Nhân Tâm thực sự là tác phẩm kinh điển. Giấy in của Aurabook rất đẹp, font chữ rõ ràng, đóng gói cẩn thận 3 lớp chống sốc. Rất hài lòng!",
		createdAt: "2026-09-15T08:30:00.000Z",
		isVerified: true,
		helpfulCount: 14,
	},
	{
		id: "rev-2",
		productSlug: "dac-nhan-tam",
		authorName: "Trần Thu Hà",
		rating: 5,
		title: "Giao hàng nhanh, nội dung sâu sắc",
		content: "Đặt hôm trước hôm sau đã nhận được sách ở Hà Nội. Nội dung từng chương đều thấm thía, giúp mình cải thiện rất nhiều trong kỹ năng giao tiếp công việc.",
		createdAt: "2026-09-20T14:15:00.000Z",
		isVerified: true,
		helpfulCount: 8,
	},
	{
		id: "rev-3",
		productSlug: "dac-nhan-tam",
		authorName: "Lê Hoàng Long",
		rating: 4,
		title: "Bìa đẹp, sách rất giá trị",
		content: "Chất lượng sách tốt, dịch mượt mà. Sẽ tiếp tục ủng hộ Aurabook thêm các đầu sách phát triển bản thân khác.",
		createdAt: "2026-10-01T09:45:00.000Z",
		isVerified: true,
		helpfulCount: 3,
	},
	{
		id: "rev-4",
		productSlug: "nha-gia-kim",
		authorName: "Phạm Hải Đăng",
		rating: 5,
		title: "Một hành trình kỳ diệu",
		content: "Cuốn sách ngắn nhưng truyền cảm hứng mãnh liệt để theo đuổi ước mơ. 'Khi bạn thực sự khao khát điều gì, cả vũ trụ sẽ hợp sức giúp bạn đạt được điều đó'. Rất tuyệt vời!",
		createdAt: "2026-09-18T10:20:00.000Z",
		isVerified: true,
		helpfulCount: 19,
	},
	{
		id: "rev-5",
		productSlug: "nha-gia-kim",
		authorName: "Vũ Mai Phương",
		rating: 5,
		title: "Sách mới tinh, thơm mùi giấy",
		content: "Được tặng kèm bookmark xinh xắn. Câu chuyện của chàng chăn cừu Santiago đọc đi đọc lại vẫn luôn thấy ý nghĩa mới.",
		createdAt: "2026-09-28T16:00:00.000Z",
		isVerified: true,
		helpfulCount: 6,
	},
	{
		id: "rev-6",
		productSlug: "tuoi-tre-dang-gia-bao-nhieu",
		authorName: "Đỗ Kim Ngân",
		rating: 5,
		title: "Cuốn sách đánh thức tuổi trẻ",
		content: "Đọc xong thấy có thêm động lực học tập và trải nghiệm. Rất phù hợp cho các bạn học sinh, sinh viên và người mới đi làm.",
		createdAt: "2026-09-22T11:10:00.000Z",
		isVerified: true,
		helpfulCount: 11,
	},
	{
		id: "rev-7",
		productSlug: "tuoi-tre-dang-gia-bao-nhieu",
		authorName: "Hoàng Văn Nam",
		rating: 4,
		title: "Khá thực tế và hữu ích",
		content: "Nhiều lời khuyên chân thành và danh sách sách đọc tham khảo rất chất lượng. Giao hàng nhanh và đóng gói kỹ.",
		createdAt: "2026-10-02T13:30:00.000Z",
		isVerified: true,
		helpfulCount: 4,
	},
];

function ensureDataFile(): Review[] {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		if (!fs.existsSync(REVIEWS_FILE)) {
			fs.writeFileSync(REVIEWS_FILE, JSON.stringify(SEED_REVIEWS, null, 2), "utf8");
			return SEED_REVIEWS;
		}
		const content = fs.readFileSync(REVIEWS_FILE, "utf8");
		const parsed = JSON.parse(content);
		if (Array.isArray(parsed)) {
			return parsed as Review[];
		}
		return SEED_REVIEWS;
	} catch (e) {
		console.error("[reviews] Failed to read reviews file:", e);
		return SEED_REVIEWS;
	}
}

function saveReviews(reviews: Review[]) {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
	} catch (e) {
		console.error("[reviews] Failed to write reviews file:", e);
	}
}

export function getProductReviews(productSlug: string): { reviews: Review[]; summary: ReviewSummary } {
	const all = ensureDataFile();
	const normalizedSlug = productSlug.toLowerCase().trim();
	const reviews = all
		.filter((r) => r.productSlug.toLowerCase().trim() === normalizedSlug)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	const total = reviews.length;
	const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
	let sum = 0;
	let positiveCount = 0;

	for (const r of reviews) {
		const rate = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
		distribution[rate] = (distribution[rate] || 0) + 1;
		sum += r.rating;
		if (r.rating >= 4) {
			positiveCount += 1;
		}
	}

	const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;
	const recommendPercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 100;

	return {
		reviews,
		summary: {
			averageRating,
			totalReviews: total,
			recommendPercentage,
			distribution,
		},
	};
}

export function addReview(input: CreateReviewInput): { review: Review; summary: ReviewSummary } {
	const all = ensureDataFile();
	const newReview: Review = {
		id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		productSlug: input.productSlug.toLowerCase().trim(),
		productId: input.productId,
		authorName: input.authorName.trim(),
		authorEmail: input.authorEmail?.trim(),
		rating: Math.max(1, Math.min(5, Math.round(input.rating))),
		title: input.title.trim(),
		content: input.content.trim(),
		createdAt: new Date().toISOString(),
		isVerified: input.isVerified ?? true,
		helpfulCount: 0,
	};

	all.unshift(newReview);
	saveReviews(all);

	const { summary } = getProductReviews(input.productSlug);
	return { review: newReview, summary };
}

export function markReviewHelpful(reviewId: string): boolean {
	const all = ensureDataFile();
	const rev = all.find((r) => r.id === reviewId);
	if (rev) {
		rev.helpfulCount = (rev.helpfulCount || 0) + 1;
		saveReviews(all);
		return true;
	}
	return false;
}
