"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
	Users,
	FileText,
	MessageSquare,
	Bookmark,
	CheckCircle2,
	Calendar,
	BookOpen,
	X,
	UserPlus,
	UserCheck,
	Edit3,
	Heart,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { type CommunityUser, type CommunityPost, type CommunityComment } from "@/lib/community/types";

interface CommunityUserProfileModalProps {
	isOpen: boolean;
	userIdOrUsername: string | null;
	currentUser: CommunityUser | null;
	onClose: () => void;
	onEditProfile?: () => void;
	savedPostIds?: string[];
	allPosts?: CommunityPost[];
}

export function CommunityUserProfileModal({
	isOpen,
	userIdOrUsername,
	currentUser,
	onClose,
	onEditProfile,
	savedPostIds = [],
	allPosts = [],
}: CommunityUserProfileModalProps) {
	const [user, setUser] = useState<CommunityUser | null>(null);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [comments, setComments] = useState<Array<{ comment: CommunityComment; post: CommunityPost }>>([]);
	const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"posts" | "comments" | "saved">("posts");
	const [isFollowing, setIsFollowing] = useState(false);
	const [followersCount, setFollowersCount] = useState(0);
	const [isFollowLoading, setIsFollowLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isSelf =
		currentUser &&
		user &&
		(currentUser.id === user.id || currentUser.username === user.username);

	useEffect(() => {
		if (!isOpen || !userIdOrUsername) return;

		const fetchUserData = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/community/user/${encodeURIComponent(userIdOrUsername)}`);
				if (res.ok) {
					const data = (await res.json()) as {
						user: CommunityUser;
						posts: CommunityPost[];
						comments: Array<{ comment: CommunityComment; post: CommunityPost }>;
						savedPosts?: CommunityPost[];
					};
					setUser(data.user);
					setPosts(data.posts || []);
					setComments(data.comments || []);
					setSavedPosts(data.savedPosts || []);
					const currentFollowers = data.user.followers || [];
					setFollowersCount(currentFollowers.length);
					if (currentUser) {
						setIsFollowing(currentFollowers.includes(currentUser.id));
					}
				}
			} catch (e) {
				console.error("Failed to load user profile:", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [isOpen, userIdOrUsername, currentUser]);

	if (!isOpen || !userIdOrUsername) return null;

	const handleToggleFollow = async () => {
		if (!currentUser || !user || isFollowLoading) return;

		setIsFollowLoading(true);
		// Optimistic update
		const nextState = !isFollowing;
		setIsFollowing(nextState);
		setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

		try {
			const res = await fetch(`/api/community/user/${encodeURIComponent(user.id)}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentUserId: currentUser.id }),
			});
			if (res.ok) {
				const data = (await res.json()) as { isFollowing: boolean; followersCount: number };
				setIsFollowing(data.isFollowing);
				setFollowersCount(data.followersCount);
			}
		} catch (e) {
			console.error("Failed to follow:", e);
			// Rollback
			setIsFollowing(!nextState);
			setFollowersCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
		} finally {
			setIsFollowLoading(false);
		}
	};

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return "Gần đây";
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("vi-VN", {
				month: "long",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	// Saved posts for this user
	const savedPostsList =
		savedPosts.length > 0
			? savedPosts
			: isSelf
				? allPosts.filter((p) => savedPostIds.includes(p.id))
				: allPosts.filter((p) => user?.savedPosts?.includes(p.id));

	if (!isOpen || !mounted) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
			<div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
				{/* Top Cover / Header */}
				<div className="relative h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-muted/40 p-4 flex justify-between items-start">
					<div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-xs">
						<Users className="h-3 w-3 text-primary" />
						<span>Hồ sơ độc giả</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors backdrop-blur-xs"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* User Profile Information Card */}
				<div className="px-6 pb-4 pt-0 relative shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
						<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-md">
							<Image
								src={
									user?.avatar ||
									"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
								}
								alt={user?.displayName || "Độc giả"}
								fill
								sizes="80px"
								className="object-cover"
								unoptimized
							/>
						</div>

						{/* Action Button: Edit or Follow */}
						<div className="flex items-center gap-2">
							{isSelf ? (
								<Button
									type="button"
									variant="outline-solid"
									size="sm"
									onClick={() => {
										onClose();
										onEditProfile?.();
									}}
									className="text-xs font-semibold gap-1.5 rounded-xl h-8"
								>
									<Edit3 className="h-3.5 w-3.5" />
									<span>Chỉnh sửa hồ sơ</span>
								</Button>
							) : (
								<Button
									type="button"
									variant={isFollowing ? "outline-solid" : "default"}
									size="sm"
									onClick={handleToggleFollow}
									disabled={isFollowLoading}
									className={`text-xs font-semibold gap-1.5 rounded-xl h-8 ${
										isFollowing ? "text-primary border-primary/40 hover:bg-primary/10" : ""
									}`}
								>
									{isFollowing ? (
										<>
											<UserCheck className="h-3.5 w-3.5 text-primary" />
											<span>Đang theo dõi</span>
										</>
									) : (
										<>
											<UserPlus className="h-3.5 w-3.5" />
											<span>Theo dõi</span>
										</>
									)}
								</Button>
							)}
						</div>
					</div>

					{/* Names & Bio */}
					<div className="space-y-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base font-bold text-foreground">
								{user?.displayName || "Độc giả Aurabook"}
							</h3>
							<span className="text-xs text-muted-foreground">{user?.username}</span>
							{user?.realAccount?.ordersCount && user.realAccount.ordersCount > 0 ? (
								<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
									<CheckCircle2 className="h-3 w-3" />
									Khách đã mua sách
								</span>
							) : null}
						</div>

						{user?.bio && (
							<p className="text-xs text-foreground/80 leading-relaxed max-w-xl">
								{user.bio}
							</p>
						)}

						<div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
							{user?.favoriteGenre && (
								<span className="flex items-center gap-1">
									<BookOpen className="h-3.5 w-3.5 text-primary" />
									<span>Yêu thích: {user.favoriteGenre}</span>
								</span>
							)}
							<span className="flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5" />
								<span>Tham gia từ {formatDate(user?.joinedAt)}</span>
							</span>
						</div>
					</div>

					{/* Followers & Social Metrics */}
					<div className="flex items-center gap-6 border-y border-border my-3.5 py-2.5 text-xs">
						<div>
							<span className="font-bold text-foreground text-sm">{posts.length}</span>{" "}
							<span className="text-muted-foreground">Bài viết</span>
						</div>
						<div>
							<span className="font-bold text-foreground text-sm">{followersCount}</span>{" "}
							<span className="text-muted-foreground">Người theo dõi</span>
						</div>
						<div>
							<span className="font-bold text-foreground text-sm">
								{user?.following?.length || 1}
							</span>{" "}
							<span className="text-muted-foreground">Đang theo dõi</span>
						</div>
					</div>
				</div>

				{/* Navigation Tabs for Activity */}
				<div className="border-b border-border px-6 flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("posts")}
						className={`border-b-2 py-2 px-3 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
							activeTab === "posts"
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<FileText className="h-3.5 w-3.5" />
						<span>Bài viết ({posts.length})</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("comments")}
						className={`border-b-2 py-2 px-3 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
							activeTab === "comments"
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<MessageSquare className="h-3.5 w-3.5" />
						<span>Bình luận ({comments.length})</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("saved")}
						className={`border-b-2 py-2 px-3 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
							activeTab === "saved"
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<Bookmark className="h-3.5 w-3.5" />
						<span>Đã lưu ({savedPostsList.length})</span>
					</button>
				</div>

				{/* Activity Content Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{isLoading ? (
						<div className="space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse border border-border" />
							))}
						</div>
					) : activeTab === "posts" ? (
						posts.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
								Người dùng chưa đăng bài viết nào
							</div>
						) : (
							<div className="space-y-3">
								{posts.map((p) => (
									<div key={p.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
										<div className="font-semibold text-xs text-foreground">{p.title}</div>
										<p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
											{p.content}
										</p>
										{p.book && (
											<div className="inline-flex items-center gap-2 rounded-lg bg-card px-2.5 py-1 text-[11px] border border-border">
												<BookOpen className="h-3 w-3 text-primary" />
												<span className="font-medium">{p.book.title}</span>
											</div>
										)}
										<div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
											<span className="flex items-center gap-1">
												<Heart className="h-3 w-3 text-red-500" />
												{p.likes?.length || 0} thích
											</span>
											<span className="flex items-center gap-1">
												<MessageSquare className="h-3 w-3 text-primary" />
												{p.comments?.length || 0} bình luận
											</span>
										</div>
									</div>
								))}
							</div>
						)
					) : activeTab === "comments" ? (
						comments.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
								Người dùng chưa có bình luận nào
							</div>
						) : (
							<div className="space-y-3">
								{comments.map((item, idx) => (
									<div key={idx} className="rounded-xl border border-border bg-muted/20 p-4 space-y-1.5">
										<div className="text-[11px] text-muted-foreground flex items-center gap-1">
											<span>Bình luận vào bài:</span>
											<span className="font-semibold text-foreground truncate max-w-xs">
												"{item.post?.title || 'Bài viết'}"
											</span>
										</div>
										<p className="text-xs text-foreground/90 bg-card p-2.5 rounded-lg border border-border/60">
											{item.comment.content}
										</p>
									</div>
								))}
							</div>
						)
					) : (
						savedPostsList.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
								Chưa có bài viết đã lưu nào
							</div>
						) : (
							<div className="space-y-3">
								{savedPostsList.map((p) => (
									<div key={p.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-1.5">
										<div className="font-semibold text-xs text-foreground">{p.title}</div>
										<p className="text-xs text-foreground/80 line-clamp-2">{p.content}</p>
										{p.book && (
											<div className="text-[11px] text-primary font-medium">
												Sách: {p.book.title}
											</div>
										)}
									</div>
								))}
							</div>
						)
					)}
				</div>
			</div>
		</div>,
		document.body,
	);
}
