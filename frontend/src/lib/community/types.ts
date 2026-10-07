export interface CommunityRealAccount {
	id: string;
	email: string;
	fullName: string;
	phone?: string;
	ordersCount: number;
	totalSpent: string;
	registeredDate: string;
	lastActive: string;
}

export interface CommunityUser {
	id: string;
	username: string; // e.g. @tuannm
	displayName: string;
	avatar: string;
	bio: string;
	favoriteGenre: string;
	hasAcceptedTerms: boolean;
	isBlocked: boolean;
	joinedAt: string;
	realAccount: CommunityRealAccount;
	followers?: string[]; // IDs or usernames of followers
	following?: string[]; // IDs or usernames of users followed
	savedPosts?: string[]; // IDs of saved posts
}

export interface CommunityComment {
	id: string;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatar: string;
	};
	content: string;
	createdAt: string;
}

export interface PostEditHistory {
	id: string;
	title: string;
	content: string;
	editedAt: string;
	editedBy?: string;
}

export interface CommunityPost {
	id: string;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatar: string;
		isVerifiedBuyer: boolean;
	};
	book: {
		slug: string;
		title: string;
		thumbnail?: string;
		price?: string;
		author?: string;
		rating?: number;
	} | null;
	title: string;
	content: string;
	likes: string[]; // List of user IDs or session tokens who liked
	comments: CommunityComment[];
	createdAt: string;
	updatedAt?: string;
	editHistory?: PostEditHistory[];
	isPinned?: boolean;
	isFromProductReview?: boolean;
	isHidden?: boolean;
}

export interface CommunityAdminSettings {
	requireTerms: boolean;
	verifiedBuyersOnly: boolean;
	autoApprovePosts: boolean;
	filterSensitiveWords: boolean;
}
