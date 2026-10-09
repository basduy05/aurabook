import fs from "node:fs";
import path from "node:path";
import {
	type CommunityPost,
	type CommunityUser,
	type CommunityComment,
	type PostEditHistory,
	type CommunityAdminSettings,
	type CommunityNotification,
	type UserProfileHistoryItem,
} from "./types";
import { type Review } from "@/lib/reviews/types";

const DATA_DIR = path.join(process.cwd(), "data");
const COMMUNITY_FILE = path.join(DATA_DIR, "community.json");

interface CommunityData {
	users: CommunityUser[];
	posts: CommunityPost[];
	notifications?: CommunityNotification[];
	settings?: CommunityAdminSettings;
}

const SEED_SETTINGS: CommunityAdminSettings = {
	requireTerms: true,
	verifiedBuyersOnly: true,
	autoApprovePosts: true,
	filterSensitiveWords: true,
};

export const ADMIN_USER_ID = "admin-aurabook";

export const AURABOOK_ADMIN_USER: CommunityUser = {
	id: ADMIN_USER_ID,
	username: "@aurabook_admin",
	displayName: "Quản trị viên Aurabook",
	avatar: "/android-chrome-512x512.png",
	bio: "Tài khoản chính thức của Ban Quản Trị Aurabook. Cập nhật thông báo, chính sách và đồng hành cùng cộng đồng độc giả.",
	favoriteGenre: "Sách chọn lọc & Thông báo",
	hasAcceptedTerms: true,
	isBlocked: false,
	joinedAt: "2026-01-01T00:00:00.000Z",
	realAccount: {
		id: "admin-account-aurabook",
		email: "admin@aurabook.vn",
		fullName: "Quản trị viên Aurabook",
		ordersCount: 0,
		totalSpent: "0 ₫",
		registeredDate: "01/01/2026",
		lastActive: "Đang hoạt động",
	},
	savedPosts: [],
	followers: [],
	following: [],
	role: "admin",
};

const SEED_USERS: CommunityUser[] = [
	AURABOOK_ADMIN_USER,
	{
		id: "user-1",
		username: "@basduy05",
		displayName: "Nguyễn Bá Duy",
		avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		bio: "Đam mê đọc sách phát triển bản thân, công nghệ và kinh doanh.",
		favoriteGenre: "Kỹ năng sống & Kinh doanh",
		hasAcceptedTerms: true,
		isBlocked: false,
		joinedAt: "2026-08-10T09:00:00.000Z",
		realAccount: {
			id: "VXNlcjox",
			email: "basduygame@gmail.com",
			fullName: "Nguyễn Bá Duy",
			phone: "0912345678",
			ordersCount: 4,
			totalSpent: "2.460.000 ₫",
			registeredDate: "10/08/2026",
			lastActive: "Đang hoạt động",
		},
		savedPosts: ["post-1"],
		following: [ADMIN_USER_ID],
		role: "member",
	},
];

const SEED_POSTS: CommunityPost[] = [
	{
		id: "post-1",
		author: {
			id: "user-1",
			username: "@basduy05",
			displayName: "Nguyễn Bá Duy",
			avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
			isVerifiedBuyer: true,
		},
		book: {
			slug: "dac-nhan-tam",
			title: "Đắc Nhân Tâm",
			price: "86.000 ₫",
			author: "Dale Carnegie",
			thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
			rating: 5,
		},
		title: "Bài học sâu sắc về sự lắng nghe chân thành trong Đắc Nhân Tâm",
		content:
			"Sau khi đọc lại cuốn Đắc Nhân Tâm lần thứ 3, mình nhận ra bài học giá trị nhất không phải là làm sao để nói hay, mà là nghệ thuật lắng nghe bằng cả tấm lòng. Khi bạn thực sự quan tâm đến người đối diện, mọi cánh cửa giao tiếp đều tự động mở ra. Rất khuyên mọi người nên có một cuốn trên bàn làm việc!",
		likes: ["user-1"],
		comments: [],
		createdAt: "2026-10-05T14:30:00.000Z",
		isPinned: true,
	},
];

const SEED_NOTIFICATIONS: CommunityNotification[] = [];

function loadData(): CommunityData {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		if (!fs.existsSync(COMMUNITY_FILE)) {
			const initial: CommunityData = { users: SEED_USERS, posts: SEED_POSTS, notifications: SEED_NOTIFICATIONS };
			fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(initial, null, 2), "utf8");
			return initial;
		}
		const content = fs.readFileSync(COMMUNITY_FILE, "utf8");
		const parsed = JSON.parse(content) as CommunityData;
		const posts = parsed.posts || SEED_POSTS;
		const postIds = new Set(posts.map((p) => p.id));

		const rawUsers = parsed.users || SEED_USERS;
		let adminExists = false;
		const users: CommunityUser[] = [];

		for (const u of rawUsers) {
			if (u.id === ADMIN_USER_ID || u.username === "@aurabook_admin") {
				adminExists = true;
				users.push({
					...AURABOOK_ADMIN_USER,
					...u,
					id: ADMIN_USER_ID,
					username: "@aurabook_admin",
					displayName: "Quản trị viên Aurabook",
					role: "admin",
					avatar: "/android-chrome-512x512.png",
					bio: (u.bio || AURABOOK_ADMIN_USER.bio).slice(0, 150),
				});
			} else {
				const isBasDuy = u.realAccount?.email === "basduygame@gmail.com";
				users.push({
					...u,
					role: isBasDuy ? "member" : (u.role || "member"),
					bio: (u.bio || "").slice(0, 150),
					savedPosts: Array.isArray(u.savedPosts)
						? u.savedPosts.filter((id) => postIds.has(id))
						: [],
				});
			}
		}

		if (!adminExists) {
			users.unshift({ ...AURABOOK_ADMIN_USER });
		}

		// Ensure everyone automatically follows the administrator
		const nonAdminUserIds = users.filter((u) => u.id !== ADMIN_USER_ID).map((u) => u.id);
		const adminUser = users.find((u) => u.id === ADMIN_USER_ID);
		if (adminUser) {
			adminUser.followers = nonAdminUserIds;
		}
		for (const u of users) {
			if (u.id !== ADMIN_USER_ID) {
				u.following = u.following || [];
				if (!u.following.includes(ADMIN_USER_ID)) {
					u.following.push(ADMIN_USER_ID);
				}
			}
		}

		// Ensure admin posts, comments, and notifications always display the Aurabook logo
		for (const p of posts) {
			if (p.author.id === ADMIN_USER_ID || p.author.username === "@aurabook_admin") {
				p.author.avatar = "/android-chrome-512x512.png";
			}
			if (Array.isArray(p.comments)) {
				for (const c of p.comments) {
					if (c.author.id === ADMIN_USER_ID || c.author.username === "@aurabook_admin") {
						c.author.avatar = "/android-chrome-512x512.png";
					}
					if (Array.isArray(c.replies)) {
						for (const r of c.replies) {
							if (r.author.id === ADMIN_USER_ID || r.author.username === "@aurabook_admin") {
								r.author.avatar = "/android-chrome-512x512.png";
							}
						}
					}
				}
			}
		}

		const rawNotifs = parsed.notifications || SEED_NOTIFICATIONS;
		for (const n of rawNotifs) {
			if (n.sender?.id === ADMIN_USER_ID || n.sender?.username === "@aurabook_admin") {
				n.sender.avatar = "/android-chrome-512x512.png";
			}
		}

		return {
			users,
			posts,
			notifications: rawNotifs,
			settings: parsed.settings || SEED_SETTINGS,
		};
	} catch (e) {
		console.error("[community] Failed to load data:", e);
		return { users: SEED_USERS, posts: SEED_POSTS, notifications: SEED_NOTIFICATIONS, settings: SEED_SETTINGS };
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
export function getCommunityPost(postId: string): CommunityPost | null {
	const data = loadData();
	return data.posts.find((p) => p.id === postId) || null;
}

export function getCommunityPosts(filter?: { bookSlug?: string; search?: string; includeHidden?: boolean }): CommunityPost[] {
	const data = loadData();
	let posts = [...data.posts];

	// Filter out hidden posts unless includeHidden is true
	if (!filter?.includeHidden) {
		posts = posts.filter((p) => !p.isHidden);
	}

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

	// Check if author is blocked
	const authorUser = data.users.find((u) => u.id === postData.author.id || u.username === postData.author.username);
	if (authorUser?.isBlocked) {
		throw new Error("Tài khoản của bạn đã bị quản trị viên khóa quyền truy cập cộng đồng.");
	}

	const newPost: CommunityPost = {
		...postData,
		id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		likes: [],
		comments: [],
		createdAt: new Date().toISOString(),
		editHistory: [],
	};

	data.posts.unshift(newPost);
	saveData(data);

	// Trigger notifications for any @mentions in post
	parseAndNotifyMentions(newPost.content, newPost.author, newPost.id, "post");

	return newPost;
}

export function editCommunityPost(
	postId: string,
	newTitle: string,
	newContent: string,
	editorUser?: { id: string; displayName: string },
): CommunityPost {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (!post) {
		throw new Error("Bài viết không tồn tại");
	}

	// Check if editor is blocked (unless admin)
	if (editorUser?.id !== "admin") {
		const editor = data.users.find(
			(u) => u.id === editorUser?.id || u.username === editorUser?.id || u.id === post.author.id,
		);
		if (editor?.isBlocked) {
			throw new Error("Tài khoản của bạn đã bị quản trị viên khóa quyền truy cập cộng đồng.");
		}
	}

	// Save existing version to edit history
	const historyItem: PostEditHistory = {
		id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		title: post.title,
		content: post.content,
		editedAt: new Date().toISOString(),
		editedBy: editorUser?.displayName || post.author.displayName,
	};

	post.editHistory = post.editHistory || [];
	post.editHistory.unshift(historyItem);
	post.title = newTitle.trim();
	post.content = newContent.trim();
	post.updatedAt = new Date().toISOString();

	saveData(data);
	return post;
}

export function toggleLikePost(postId: string, userIdOrIp: string): { likesCount: number; isLiked: boolean; likes: string[] } {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (!post) {
		throw new Error("Bài viết không tồn tại");
	}

	// Check if user is blocked
	const user = data.users.find((u) => u.id === userIdOrIp || u.username === userIdOrIp);
	if (user?.isBlocked) {
		throw new Error("Tài khoản của bạn đã bị quản trị viên khóa quyền truy cập cộng đồng.");
	}

	const index = post.likes.indexOf(userIdOrIp);
	let isLiked = false;
	if (index === -1) {
		post.likes.push(userIdOrIp);
		isLiked = true;

		// Trigger like notification if not liking own post
		if (post.author.id !== userIdOrIp && post.author.username !== userIdOrIp) {
			const liker = user || {
				id: userIdOrIp,
				username: "@docgia",
				displayName: "Một độc giả",
				avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			};
			createCommunityNotification({
				recipientId: post.author.id,
				sender: {
					id: liker.id,
					username: liker.username,
					displayName: liker.displayName,
					avatar: liker.avatar,
				},
				type: "like",
				title: `${liker.displayName} đã thích bài viết của bạn`,
				content: post.title,
				postId: post.id,
			});
		}
	} else {
		post.likes.splice(index, 1);
		isLiked = false;
	}

	saveData(data);
	return { likesCount: post.likes.length, isLiked, likes: post.likes };
}

export function addCommentToPost(
	postId: string,
	commentData: {
		author: CommunityPost["author"];
		content: string;
		parentId?: string;
	},
) {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (!post) {
		throw new Error("Bài viết không tồn tại");
	}

	// Check if author is blocked
	const authorUser = data.users.find(
		(u) => u.id === commentData.author.id || u.username === commentData.author.username,
	);
	if (authorUser?.isBlocked) {
		throw new Error("Tài khoản của bạn đã bị quản trị viên khóa quyền truy cập cộng đồng.");
	}

	const newComment: CommunityComment = {
		id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		author: {
			id: commentData.author.id,
			username: commentData.author.username,
			displayName: commentData.author.displayName,
			avatar: commentData.author.avatar,
		},
		content: commentData.content.trim(),
		createdAt: new Date().toISOString(),
		parentId: commentData.parentId,
		replies: [],
	};

	if (commentData.parentId) {
		// Nested reply to an existing comment
		const parentComment = post.comments.find((c) => c.id === commentData.parentId);
		if (parentComment) {
			parentComment.replies = parentComment.replies || [];
			parentComment.replies.push(newComment);

			// Trigger reply notification to parent comment author if not self
			if (parentComment.author.id !== commentData.author.id && parentComment.author.username !== commentData.author.username) {
				createCommunityNotification({
					recipientId: parentComment.author.id,
					sender: {
						id: commentData.author.id,
						username: commentData.author.username,
						displayName: commentData.author.displayName,
						avatar: commentData.author.avatar,
					},
					type: "reply",
					title: `${commentData.author.displayName} đã trả lời bình luận của bạn`,
					content: commentData.content.trim().slice(0, 120),
					postId: post.id,
				});
			}
		} else {
			post.comments.push(newComment);
		}
	} else {
		// Top-level comment
		post.comments.push(newComment);

		// Trigger comment notification to post author if not self
		if (post.author.id !== commentData.author.id && post.author.username !== commentData.author.username) {
			createCommunityNotification({
				recipientId: post.author.id,
				sender: {
					id: commentData.author.id,
					username: commentData.author.username,
					displayName: commentData.author.displayName,
					avatar: commentData.author.avatar,
				},
				type: "comment",
				title: `${commentData.author.displayName} đã bình luận về bài viết của bạn`,
				content: commentData.content.trim().slice(0, 120),
				postId: post.id,
			});
		}
	}

	saveData(data);

	// Parse @mentions
	parseAndNotifyMentions(
		commentData.content,
		commentData.author,
		post.id,
		commentData.parentId ? "reply" : "comment",
	);

	return newComment;
}

export function deleteCommunityPost(postId: string): boolean {
	const data = loadData();
	const prevLen = data.posts.length;
	data.posts = data.posts.filter((p) => p.id !== postId);
	if (data.posts.length !== prevLen) {
		// Clean up savedPosts from all users
		for (const u of data.users) {
			if (Array.isArray(u.savedPosts)) {
				u.savedPosts = u.savedPosts.filter((id) => id !== postId);
			}
		}

		saveData(data);

		// If post came from a product review, also remove from reviews.json
		try {
			const reviewsFile = path.join(DATA_DIR, "reviews.json");
			if (fs.existsSync(reviewsFile)) {
				const reviews = JSON.parse(fs.readFileSync(reviewsFile, "utf8")) as Review[];
				const reviewId = postId.startsWith("post-review-")
					? postId.replace("post-review-", "")
					: null;
				if (reviewId) {
					const updatedReviews = reviews.filter((r) => r.id !== reviewId);
					if (updatedReviews.length !== reviews.length) {
						fs.writeFileSync(reviewsFile, JSON.stringify(updatedReviews, null, 2), "utf8");
					}
				}
			}
		} catch (e) {
			console.error("[deleteCommunityPost] Failed to sync review deletion:", e);
		}

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

export function toggleHideCommunityPost(postId: string): boolean {
	const data = loadData();
	const post = data.posts.find((p) => p.id === postId);
	if (post) {
		post.isHidden = !post.isHidden;
		saveData(data);
		return !!post.isHidden;
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

export function toggleFollowUser(
	currentUserId: string,
	targetUserId: string,
): { isFollowing: boolean; followersCount: number } {
	const data = loadData();
	const currentUser = data.users.find((u) => u.id === currentUserId || u.username === currentUserId);
	const targetUser = data.users.find((u) => u.id === targetUserId || u.username === targetUserId);

	if (!targetUser) {
		throw new Error("Người dùng không tồn tại");
	}

	targetUser.followers = targetUser.followers || [];
	if (currentUser) {
		currentUser.following = currentUser.following || [];
	}

	const followerId = currentUser ? currentUser.id : currentUserId;

	if (targetUser.id === ADMIN_USER_ID) {
		// All members automatically follow admin and cannot unfollow
		if (currentUser && !currentUser.following?.includes(ADMIN_USER_ID)) {
			currentUser.following = [...(currentUser.following || []), ADMIN_USER_ID];
		}
		if (!targetUser.followers?.includes(followerId)) {
			targetUser.followers = [...(targetUser.followers || []), followerId];
		}
		saveData(data);
		return { isFollowing: true, followersCount: targetUser.followers.length };
	}

	const index = targetUser.followers.indexOf(followerId);
	let isFollowing = false;

	if (index === -1) {
		targetUser.followers.push(followerId);
		if (currentUser) {
			currentUser.following = currentUser.following || [];
			if (!currentUser.following.includes(targetUser.id)) {
				currentUser.following.push(targetUser.id);
			}
		}
		isFollowing = true;

		// Trigger follow notification
		createCommunityNotification({
			recipientId: targetUser.id,
			sender: {
				id: currentUser ? currentUser.id : followerId,
				username: currentUser ? currentUser.username : `@${followerId}`,
				displayName: currentUser ? currentUser.displayName : "Người dùng Aurabook",
				avatar: currentUser ? currentUser.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			},
			type: "follow",
			title: `${currentUser?.displayName || "Một độc giả"} đã bắt đầu theo dõi bạn`,
			content: "Nhấn để xem trang cá nhân và theo dõi lại",
		});
	} else {
		targetUser.followers.splice(index, 1);
		if (currentUser) {
			currentUser.following = (currentUser.following || []).filter((id) => id !== targetUser.id);
		}
		isFollowing = false;
	}

	saveData(data);
	return { isFollowing, followersCount: targetUser.followers.length };
}

export function toggleSaveUserPost(
	userIdOrUsername: string,
	postId: string,
): { isSaved: boolean; savedPosts: string[] } {
	const data = loadData();
	const user = data.users.find((u) => u.id === userIdOrUsername || u.username === userIdOrUsername);
	if (!user) {
		throw new Error("Người dùng không tồn tại");
	}
	user.savedPosts = user.savedPosts || [];
	const index = user.savedPosts.indexOf(postId);
	let isSaved = false;
	if (index === -1) {
		user.savedPosts.push(postId);
		isSaved = true;
	} else {
		user.savedPosts.splice(index, 1);
		isSaved = false;
	}
	saveData(data);
	return { isSaved, savedPosts: user.savedPosts };
}

export function getUserActivity(userIdOrUsername: string, viewerIdOrUsername?: string) {
	const data = loadData();
	const targetUser = data.users.find(
		(u) => u.id === userIdOrUsername || u.username === userIdOrUsername,
	);
	const username = targetUser ? targetUser.username : userIdOrUsername;
	const userId = targetUser ? targetUser.id : userIdOrUsername;

	const isSelf =
		viewerIdOrUsername &&
		(viewerIdOrUsername === userId ||
			viewerIdOrUsername === username ||
			(targetUser && viewerIdOrUsername === targetUser.id));

	// User's posts (hide hidden posts if viewer is not the author themselves)
	let userPosts = data.posts.filter(
		(p) => p.author.id === userId || p.author.username === username,
	);
	if (!isSelf) {
		userPosts = userPosts.filter((p) => !p.isHidden);
	}

	// User's comments across all posts (including replies)
	const userComments: Array<{ comment: CommunityComment; post: CommunityPost }> = [];
	for (const p of data.posts) {
		for (const c of p.comments || []) {
			if (c.author.id === userId || c.author.username === username) {
				userComments.push({ comment: c, post: p });
			}
			for (const r of c.replies || []) {
				if (r.author.id === userId || r.author.username === username) {
					userComments.push({ comment: r, post: p });
				}
			}
		}
	}

	// User's saved posts
	const userSavedPostIds = targetUser?.savedPosts || [];
	const savedPosts = data.posts.filter((p) => userSavedPostIds.includes(p.id));

	// Followers & Following detailed user objects
	const followersUserIds = targetUser?.followers || [];
	const followingUserIds = targetUser?.following || [];

	const followersUsers: CommunityUser[] = data.users.filter(
		(u) => followersUserIds.includes(u.id) || followersUserIds.includes(u.username),
	);
	const followingUsers: CommunityUser[] = data.users.filter(
		(u) => followingUserIds.includes(u.id) || followingUserIds.includes(u.username),
	);

	return {
		user: targetUser || null,
		posts: userPosts,
		comments: userComments,
		savedPosts: savedPosts,
		followersUsers,
		followingUsers,
	};
}

// =========================================================================
// REAL NOTIFICATIONS API
// =========================================================================
export function createCommunityNotification(
	notification: Omit<CommunityNotification, "id" | "createdAt" | "isRead">,
): CommunityNotification {
	const data = loadData();
	data.notifications = data.notifications || SEED_NOTIFICATIONS;

	const newNotif: CommunityNotification = {
		...notification,
		id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		createdAt: new Date().toISOString(),
		isRead: false,
	};
	data.notifications.unshift(newNotif);
	saveData(data);
	return newNotif;
}

export function getNotificationsForUser(userIdOrUsername: string): {
	notifications: CommunityNotification[];
	unreadCount: number;
} {
	const data = loadData();
	const user = data.users.find((u) => u.id === userIdOrUsername || u.username === userIdOrUsername);
	const targetId = user?.id || userIdOrUsername;
	const targetUsername = user?.username || userIdOrUsername;

	const allNotifs = data.notifications || SEED_NOTIFICATIONS;
	const userNotifs = allNotifs.filter(
		(n) => n.recipientId === targetId || n.recipientId === targetUsername,
	);

	const unreadCount = userNotifs.filter((n) => !n.isRead).length;
	return { notifications: userNotifs, unreadCount };
}

export function markNotificationRead(notifId: string): boolean {
	const data = loadData();
	data.notifications = data.notifications || SEED_NOTIFICATIONS;
	const item = data.notifications.find((n) => n.id === notifId);
	if (item) {
		item.isRead = true;
		saveData(data);
		return true;
	}
	return false;
}

export function markAllNotificationsRead(userIdOrUsername: string): boolean {
	const data = loadData();
	const user = data.users.find((u) => u.id === userIdOrUsername || u.username === userIdOrUsername);
	const targetId = user?.id || userIdOrUsername;
	const targetUsername = user?.username || userIdOrUsername;

	data.notifications = data.notifications || SEED_NOTIFICATIONS;
	for (const n of data.notifications) {
		if (n.recipientId === targetId || n.recipientId === targetUsername) {
			n.isRead = true;
		}
	}
	saveData(data);
	return true;
}

function parseAndNotifyMentions(
	content: string,
	sender: { id: string; username: string; displayName: string; avatar: string },
	postId: string,
	context: "post" | "comment" | "reply",
) {
	const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/g);
	if (!mentionMatches) return;

	const data = loadData();
	const uniqueUsernames = Array.from(new Set(mentionMatches.map((m) => m.toLowerCase())));

	for (const rawMention of uniqueUsernames) {
		const targetUser = data.users.find(
			(u) =>
				u.username.toLowerCase() === rawMention ||
				u.username.toLowerCase() === `@${rawMention.replace(/^@/, "")}`,
		);
		if (targetUser && targetUser.id !== sender.id && targetUser.username !== sender.username) {
			createCommunityNotification({
				recipientId: targetUser.id,
				sender: {
					id: sender.id,
					username: sender.username,
					displayName: sender.displayName,
					avatar: sender.avatar,
				},
				type: "tag",
				title: `${sender.displayName} đã nhắc đến bạn trong một ${context === "post" ? "bài viết" : "bình luận"}`,
				content: content.slice(0, 120),
				postId,
			});
		}
	}
}

export function getCommunitySettings(): CommunityAdminSettings {
	const data = loadData();
	return (
		data.settings || {
			requireTerms: true,
			verifiedBuyersOnly: true,
			autoApprovePosts: true,
			filterSensitiveWords: true,
		}
	);
}

export function saveCommunitySettings(settings: Partial<CommunityAdminSettings>): CommunityAdminSettings {
	const data = loadData();
	data.settings = {
		...(data.settings || {
			requireTerms: true,
			verifiedBuyersOnly: true,
			autoApprovePosts: true,
			filterSensitiveWords: true,
		}),
		...settings,
	};
	saveData(data);
	return data.settings;
}

// =========================================================================
// SAVE USER WITH DEEP PROPAGATION & PROFILE CHANGE HISTORY
// =========================================================================
export function saveCommunityUserWithPropagation(updatedUser: Partial<CommunityUser> & { id: string }): CommunityUser {
	const data = loadData();
	let existingIndex = data.users.findIndex((u) => u.id === updatedUser.id);
	let existing: CommunityUser;

	if (existingIndex !== -1) {
		existing = data.users[existingIndex];
	} else {
		existing = data.users[0] || SEED_USERS[0];
		existingIndex = 0;
	}

	const oldAvatar = existing.avatar;
	const oldDisplayName = existing.displayName;
	const oldUsername = existing.username;
	const oldBio = existing.bio;
	const oldGenre = existing.favoriteGenre || "";

	const newAvatar = updatedUser.avatar || oldAvatar;
	const newDisplayName = updatedUser.displayName?.trim() || oldDisplayName;
	const newUsername = updatedUser.username
		? (updatedUser.username.startsWith("@") ? updatedUser.username : `@${updatedUser.username}`)
		: oldUsername;
	const newBio = updatedUser.bio !== undefined ? updatedUser.bio.trim().slice(0, 150) : oldBio;
	const newGenre = updatedUser.favoriteGenre !== undefined ? updatedUser.favoriteGenre.trim() : oldGenre;

	// Check if key profile attributes changed
	const hasProfileChanged =
		newAvatar !== oldAvatar ||
		newDisplayName !== oldDisplayName ||
		newUsername !== oldUsername ||
		newBio !== oldBio ||
		newGenre !== oldGenre;

	let history = existing.profileHistory || [];
	if (hasProfileChanged) {
		const historyEntry: UserProfileHistoryItem = {
			id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
			changedAt: new Date().toISOString(),
			previousAvatar: oldAvatar,
			previousDisplayName: oldDisplayName,
			previousUsername: oldUsername,
			previousBio: oldBio,
			previousFavoriteGenre: oldGenre,
			newAvatar: newAvatar,
			newDisplayName: newDisplayName,
			newUsername: newUsername,
			newBio: newBio,
			newFavoriteGenre: newGenre,
			favoriteGenre: newGenre || oldGenre,
			followersCount: existing.followers ? existing.followers.length : 0,
			followingCount: existing.following ? existing.following.length : 0,
		};
		history = [historyEntry, ...history];
	}

	const savedUser: CommunityUser = {
		...existing,
		...updatedUser,
		avatar: newAvatar,
		displayName: newDisplayName,
		username: newUsername,
		bio: newBio,
		favoriteGenre: newGenre,
		profileHistory: history,
	};

	data.users[existingIndex] = savedUser;

	// Deep propagation across ALL historic posts, comments, replies & notifications!
	const userMatches = (id?: string, uname?: string) => {
		return id === existing.id || uname === oldUsername || uname === newUsername;
	};

	for (const post of data.posts) {
		if (userMatches(post.author.id, post.author.username)) {
			post.author.displayName = newDisplayName;
			post.author.username = newUsername;
			post.author.avatar = newAvatar;
		}

		for (const comm of post.comments || []) {
			if (userMatches(comm.author.id, comm.author.username)) {
				comm.author.displayName = newDisplayName;
				comm.author.username = newUsername;
				comm.author.avatar = newAvatar;
			}
			for (const rep of comm.replies || []) {
				if (userMatches(rep.author.id, rep.author.username)) {
					rep.author.displayName = newDisplayName;
					rep.author.username = newUsername;
					rep.author.avatar = newAvatar;
				}
			}
		}
	}

	data.notifications = data.notifications || SEED_NOTIFICATIONS;
	for (const notif of data.notifications) {
		if (userMatches(notif.sender.id, notif.sender.username)) {
			notif.sender.displayName = newDisplayName;
			notif.sender.username = newUsername;
			notif.sender.avatar = newAvatar;
		}
	}

	saveData(data);
	return savedUser;
}

export function saveCommunityUser(user: CommunityUser): CommunityUser {
	return saveCommunityUserWithPropagation(user);
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
export function syncReviewToCommunity(
	review: Review,
	bookTitle: string,
	extra?: { price?: string; thumbnail?: string; author?: string },
) {
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
				price: extra?.price || "120.000 ₫",
				thumbnail: extra?.thumbnail || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
				author: extra?.author || "Tác giả Aurabook",
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

export interface TrendingBookItem {
	title: string;
	author: string;
	slug: string;
	rating: number;
	reviewsCount: number;
	thumbnail: string;
}

export interface ActiveReaderItem {
	name: string;
	username: string;
	avatar: string;
	reviews: number;
}

export function getCommunitySidebarData(): {
	trendingBooks: TrendingBookItem[];
	topReaders: ActiveReaderItem[];
} {
	const communityData = loadData();
	const reviewsFile = path.join(DATA_DIR, "reviews.json");
	let reviewsList: Review[] = [];
	try {
		if (fs.existsSync(reviewsFile)) {
			reviewsList = JSON.parse(fs.readFileSync(reviewsFile, "utf8")) as Review[];
		}
	} catch {}

	// 1. Calculate REAL trending books from actual posts and reviews
	const bookStats = new Map<
		string,
		{
			title: string;
			author: string;
			slug: string;
			ratings: number[];
			count: number;
			thumbnail: string;
		}
	>();

	// Known real books dictionary
	const KNOWN_BOOKS: Record<string, { title: string; author: string; thumbnail: string }> = {
		"dac-nhan-tam": {
			title: "Đắc Nhân Tâm",
			author: "Dale Carnegie",
			thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
		},
		"nha-gia-kim": {
			title: "Nhà Giả Kim",
			author: "Paulo Coelho",
			thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80",
		},
		"tuoi-tre-dang-gia-bao-nhieu": {
			title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
			author: "Rosie Nguyễn",
			thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80",
		},
		"tu-duy-nhanh-va-cham": {
			title: "Tư Duy Nhanh Và Chậm",
			author: "Daniel Kahneman",
			thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80",
		},
		"cay-cam-ngot-cua-toi": {
			title: "Cây Cam Ngọt Của Tôi",
			author: "José Mauro de Vasconcelos",
			thumbnail: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&auto=format&fit=crop&q=80",
		},
	};

	const nonBookSlugs = new Set([
		"dry-sunglasses",
		"monokai-dimmed-sunnies",
		"ascii-tee",
		"team-shirt",
		"blue-polygon-shirt",
		"dark-polygon-tee",
		"reversed-monotype-tee",
		"cubes-fountain-tee",
		"darko-polo",
		"blue-plimsolls",
		"balance-trail-720",
		"plimsolls",
		"canvas-sneakers",
		"dash-force",
		"pirates-beanie",
		"tactical-neck-warmer",
		"hoodie",
		"grey-hoodie",
		"t-shirt",
		"carrot-juice",
		"apple-juice",
		"bean-juice",
		"banana-juice",
		"mighty-mug",
		"the-dash-cushion",
		"white-parrot-cusion",
		"gift-card",
		"gift-card-500",
		"gift-card-50",
	]);

	// From active, non-hidden community posts
	for (const post of communityData.posts) {
		if (post.isHidden) continue;
		if (post.book?.slug && !nonBookSlugs.has(post.book.slug)) {
			const slug = post.book.slug;
			const known = KNOWN_BOOKS[slug];
			const existing = bookStats.get(slug) || {
				title: known?.title || post.book.title,
				author: known?.author || post.book.author || "Tác giả Aurabook",
				slug,
				ratings: [] as number[],
				count: 0,
				thumbnail:
					known?.thumbnail ||
					post.book.thumbnail ||
					"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
			};
			existing.count += 1 + (post.comments?.length || 0);
			if (post.book.rating) {
				existing.ratings.push(post.book.rating);
			}
			bookStats.set(slug, existing);
		}
	}

	// From product reviews - only add to books that currently have active community posts
	for (const rev of reviewsList) {
		if (rev.productSlug && !nonBookSlugs.has(rev.productSlug)) {
			const slug = rev.productSlug;
			if (bookStats.has(slug)) {
				const existing = bookStats.get(slug)!;
				existing.count += 1;
				if (rev.rating) {
					existing.ratings.push(rev.rating);
				}
			}
		}
	}

	const trendingBooks: TrendingBookItem[] = Array.from(bookStats.values())
		.filter((b) => b.count > 0)
		.map((b) => {
			const avgRating =
				b.ratings.length > 0
					? Math.round((b.ratings.reduce((acc, r) => acc + r, 0) / b.ratings.length) * 10) / 10
					: 4.8;
			return {
				title: b.title,
				author: b.author,
				slug: b.slug,
				rating: avgRating,
				reviewsCount: b.count,
				thumbnail: b.thumbnail,
			};
		})
		.sort((a, b) => b.reviewsCount - a.reviewsCount)
		.slice(0, 4);

	// 2. Calculate REAL active readers
	const userActivityMap = new Map<
		string,
		{
			name: string;
			username: string;
			avatar: string;
			count: number;
		}
	>();

	// Add registered community users
	for (const u of communityData.users) {
		if (!u.isBlocked) {
			userActivityMap.set(u.username, {
				name: u.displayName,
				username: u.username,
				avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}`,
				count: 0,
			});
		}
	}

	// Count real posts for each author
	for (const p of communityData.posts) {
		const key = p.author.username;
		const existing = userActivityMap.get(key) || {
			name: p.author.displayName,
			username: p.author.username,
			avatar: p.author.avatar,
			count: 0,
		};
		existing.count += 1;
		userActivityMap.set(key, existing);
	}

	// Count reviews
	for (const rev of reviewsList) {
		const authorName = rev.authorName;
		const matchedUser = communityData.users.find(
			(u) =>
				u.displayName.toLowerCase() === authorName.toLowerCase() ||
				u.realAccount?.fullName?.toLowerCase() === authorName.toLowerCase(),
		);
		if (matchedUser) {
			const existing = userActivityMap.get(matchedUser.username);
			if (existing) {
				existing.count += 1;
			}
		}
	}

	const topReaders: ActiveReaderItem[] = communityData.users
		.filter((u) => !u.isBlocked)
		.map((u) => {
			const stats = userActivityMap.get(u.username);
			return {
				name: u.displayName,
				username: u.username,
				avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}`,
				reviews: stats?.count || 0,
			};
		})
		.sort((a, b) => b.reviews - a.reviews)
		.slice(0, 4);

	return { trendingBooks, topReaders };
}
