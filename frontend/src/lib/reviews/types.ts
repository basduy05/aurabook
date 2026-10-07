export interface Review {
	id: string;
	productSlug: string;
	productId?: string;
	authorName: string;
	authorEmail?: string;
	rating: number; // 1 to 5
	title: string;
	content: string;
	createdAt: string; // ISO string
	isVerified: boolean; // Đã mua hàng
	helpfulCount: number;
}

export interface ReviewSummary {
	averageRating: number;
	totalReviews: number;
	recommendPercentage: number;
	distribution: {
		5: number;
		4: number;
		3: number;
		2: number;
		1: number;
	};
}

export interface CreateReviewInput {
	productSlug: string;
	productId?: string;
	authorName: string;
	authorEmail?: string;
	rating: number;
	title: string;
	content: string;
	isVerified?: boolean;
}
