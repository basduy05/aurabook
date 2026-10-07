import fs from "node:fs";
import path from "node:path";
import { type CommunityPost, type CommunityUser } from "./types";
import { type Review } from "@/lib/reviews/types";

const DATA_DIR = path.join(process.cwd(), "data");
const COMMUNITY_FILE = path.join(DATA_DIR, "community.json");

interface CommunityData {
	users: CommunityUser[];
	posts: CommunityPost[];
}

const SEED_USERS: CommunityUser[] = [
	{
		id: "user-1",
		username: "@basduy",
		displayName: "Duy Nguyễn",
		avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		bio: "Đam mê đọc sách phát triển bản thân, công nghệ và kinh doanh.",
		favoriteGenre: "Kỹ năng sống & Kinh doanh",
		hasAcceptedTerms: true,
		isBlocked: false,
		joinedAt: "2026-08-10T09:00:00.000Z",
		realAccount: {
			id: "VXNlcjox",
			email: "basduygame@gmail.com",
			fullName: "Duy Nguyễn",
			phone: "0912345678",
			ordersCount: 4,
			totalSpent: "2.460.000 ₫",
			registeredDate: "10/08/2026",
			lastActive: "Hôm nay, 15:20",
		},
	},
	{
		id: "user-2",
		username: "@minhtuan_read",
		displayName: "Minh Tuấn",
		avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
		bio: "Mỗi ngày 30 trang sách để mở rộng thế giới quan.",
		favoriteGenre: "Văn học cổ điển & Triết học",
		hasAcceptedTerms: true,
		isBlocked: false,
		joinedAt: "2026-09-01T14:20:00.000Z",
		realAccount: {
			id: "VXNlcjoy",
			email: "minhtuan.nguyen@example.com",
			fullName: "Nguyễn Minh Tuấn",
			phone: "0987654321",
			ordersCount: 2,
			totalSpent: "450.000 ₫",
			registeredDate: "01/09/2026",
			lastActive: "Hôm qua, 20:15",
		},
	},
	{
		id: "user-3",
		username: "@thuha_books",
		displayName: "Thu Hà",
		avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
		bio: "Yêu thích không gian yên tĩnh và những trang sách thơm mùi giấy mới.",
		favoriteGenre: "Tiểu thuyết & Nghệ thuật sống",
		hasAcceptedTerms: true,
		isBlocked: false,
		joinedAt: "2026-09-12T10:00:00.000Z",
		realAccount: {
			id: "VXNlcjoz",
			email: "thuha.tran@example.com",
			fullName: "Trần Thu Hà",
			phone: "0909123456",
			ordersCount: 3,
			totalSpent: "720.000 ₫",
			registeredDate: "12/09/2026",
			lastActive: "3 ngày trước",
		},
	},
];

const SEED_POSTS: CommunityPost[] = [
	{
		id: "post-1",
		author: {
			id: "user-1",
			username: "@basduy",
			displayName: "Duy Nguyễn",
			avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
			isVerifiedBuyer: true,
		},
		book: {
			slug: "dac-nhan-tam",
			title: "Đắc Nhân Tâm",
			rating: 5,
		},
		title: "Bài học sâu sắc về sự lắng nghe chân thành trong Đắc Nhân Tâm",
		content:
			"Sau khi đọc lại cuốn Đắc Nhân Tâm lần thứ 3, mình nhận ra bài học giá trị nhất không phải là làm sao để nói hay, mà là nghệ thuật lắng nghe bằng cả tấm lòng. Khi bạn thực sự quan tâm đến người đối diện, mọi cánh cửa giao tiếp đều tự động mở ra. Rất khuyên mọi người nên có một cuốn trên bàn làm việc!",
		likes: ["user-2", "user-3"],
		comments: [
			{
				id: "comm-1",
				author: {
					id: "user-2",
					username: "@minhtuan_read",
					displayName: "Minh Tuấn",
					avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
				},
				content: "Hoàn toàn đồng ý với anh Duy! Đặc biệt là chương về việc nhớ tên người khác, áp dụng vào công việc thấy hiệu quả bất ngờ.",
				createdAt: "2026-10-06T10:15:00.000Z",
			},
		],
		createdAt: "2026-10-05T14:30:00.000Z",
		isPinned: true,
	},
	{
		id: "post-2",
		author: {
			id: "user-3",
			username: "@thuha_books",
			displayName: "Thu Hà",
			avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
			isVerifiedBuyer: true,
		},
		book: {
			slug: "nha-gia-kim",
			title: "Nhà Giả Kim",
			rating: 5,
		},
		title: "Theo đuổi vận mệnh của chính mình",
		content:
			"Hành trình vượt qua sa mạc của Santiago nhắc nhở chúng ta rằng: kho báu không nằm ở điểm đến, mà nằm ở tất cả những trải nghiệm và bài học bạn tích lũy được trên đường đi. Một cuốn sách nhẹ nhàng nhưng đầy chất thơ.",
		likes: ["user-1"],
		comments: [],
		createdAt: "2026-10-06T16:00:00.000Z",
	},
];

function loadData(): CommunityData {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		if (!fs.existsSync(COMMUNITY_FILE)) {
			const initial: CommunityData = { users: SEED_USERS, posts: SEED_POSTS };
			fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(initial, null, 2), "utf8");
			return initial;
		}
		const content = fs.readFileSync(COMMUNITY_FILE, "utf8");
		const parsed = JSON.parse(content) as CommunityData;
		return {
			users: parsed.users || SEED_USERS,
			posts: parsed.posts || SEED_POSTS,
		};
	} catch (e) {
		console.error("[community] Failed to load data:", e);
		return { users: SEED_USERS, posts: SEED_POSTS };
	}
}

function saveData(data: CommunityData) {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(data, null, 2), "utf8");
	} catch (e) {
		console.error("[community] Failed to save data:", e);
	}
}

// Posts API
export function getCommunityPosts(filter?: { bookSlug?: string; search?: string }): CommunityPost[] {
	const data = loadData();
	let posts = [...data.posts];

	if (filter?.bookSlug) {
		const s = filter.bookSlug.toLowerCase().trim();
		posts = posts.filter((p) => p.book?.slug?.toLowerCase().trim() === s);
	}

	if (filter?.search) {
		const q = filter.search.toLowerCase().trim();
		posts = posts.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				p.content.toLowerCase().includes(q) ||
				p.author.displayName.toLowerCase().includes(q) ||
				p.book?.title.toLowerCase().includes(q),
		);
	}

	// Sort pinned first, then newest
	return posts.sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1;
		if (!a.isPinned && b.isPinned) return 1;
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
}

export function createCommunityPost(postData: Omit<CommunityPost, "id" | "createdAt" | "likes" | "comments">): CommunityPost {
	const data = loadData();
	const newPost: CommunityPost = {
		...postData,
		id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		likes: [],
		comments: [],
		createdAt: new Date().toISOString(),
	};

	data.posts.unshift(newPost);
	saveData(data);
	return newPost;
}

export function toggleLikePost(postId: string, userIdOrIp: string): { likesCount: number; isLiked: boolean } {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (!post) {
		throw new Error("Bài viết không tồn tại");
	}

	const index = post.likes.indexOf(userIdOrIp);
	let isLiked = false;
	if (index === -1) {
		// Like (Strictly 1 like per user/session)
		post.likes.push(userIdOrIp);
		isLiked = true;
	} else {
		// Unlike
		post.likes.splice(index, 1);
		isLiked = false;
	}

	saveData(data);
	return { likesCount: post.likes.length, isLiked };
}

export function addCommentToPost(postId: string, commentData: { author: CommunityPost["author"]; content: string }) {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (!post) {
		throw new Error("Bài viết không tồn tại");
	}

	const newComment = {
		id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		author: {
			id: commentData.author.id,
			username: commentData.author.username,
			displayName: commentData.author.displayName,
			avatar: commentData.author.avatar,
		},
		content: commentData.content.trim(),
		createdAt: new Date().toISOString(),
	};

	post.comments.push(newComment);
	saveData(data);
	return newComment;
}

export function deleteCommunityPost(postId: string): boolean {
	const data = loadData();
	const prevLen = data.posts.length;
	data.posts = data.posts.filter((p) => p.id !== postId);
	if (data.posts.length !== prevLen) {
		saveData(data);
		return true;
	}
	return false;
}

export function togglePinCommunityPost(postId: string): boolean {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (post) {
		post.isPinned = !post.isPinned;
		saveData(data);
		return post.isPinned;
	}
	return false;
}

// Users API
export function getCommunityUsers(): CommunityUser[] {
	const data = loadData();
	return data.users;
}

export function getCommunityUserById(userId: string): CommunityUser | undefined {
	const data = loadData();
	return data.users.find((u) => u.id === userId || u.username === userId);
}

export function saveCommunityUser(user: CommunityUser): CommunityUser {
	const data = loadData();
	const index = data.users.findIndex((u) => u.id === user.id);
	if (index !== -1) {
		data.users[index] = user;
	} else {
		data.users.push(user);
	}
	saveData(data);
	return user;
}

export function toggleUserBlockedStatus(userId: string): boolean {
	const data = loadData();
	const user = data.users.find((u) => u.id === userId);
	if (user) {
		user.isBlocked = !user.isBlocked;
		saveData(data);
		return user.isBlocked;
	}
	return false;
}

/** Automatically sync a product review from PDP to community feed! */
export function syncReviewToCommunity(review: Review, bookTitle: string) {
	try {
		const data = loadData();
		const syncPostId = `post-review-${review.id}`;
		if (data.posts.some((p) => p.id === syncPostId)) {
			return; // already synced
		}

		const newPost: CommunityPost = {
			id: syncPostId,
			author: {
				id: `user-guest-${review.authorName}`,
				username: `@${review.authorName.toLowerCase().replace(/\s+/g, "_")}`,
				displayName: review.authorName,
				avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.authorName)}&background=0D8ABC&color=fff`,
				isVerifiedBuyer: review.isVerified,
			},
			book: {
				slug: review.productSlug,
				title: bookTitle || review.productSlug,
				rating: review.rating,
			},
			title: review.title,
			content: review.content,
			likes: [],
			comments: [],
			createdAt: review.createdAt,
			isFromProductReview: true,
		};

		data.posts.unshift(newPost);
		saveData(data);
	} catch (e) {
		console.error("[community] Failed to sync review to community:", e);
	}
}
