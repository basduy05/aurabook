"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
	ArrowLeft,
	Users,
	FileText,
	MessageSquare,
	Bookmark,
	CheckCircle2,
	Calendar,
	BookOpen,
	UserPlus,
	UserCheck,
	Edit3,
	History,
	Clock,
	CornerDownRight,
	Send,
	X,
	Search,
	ExternalLink,
	Share2,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import {
	type CommunityUser,
	type CommunityPost,
	type CommunityComment,
	type UserProfileHistoryItem,
} from "@/lib/community/types";
import { formatCommunityExactTime } from "@/lib/community/time";
import { FormattedCommunityContent } from "./community-rich-editor";
import { CommunityPostCard } from "./community-post-card";
import { CommunityProfileModal } from "./community-profile-modal";

interface CommunityUserProfileViewProps {
	userIdOrUsername: string;
	currentUser: CommunityUser | null;
	onBack: () => void;
	onEditProfile?: () => void;
	savedPostIds: string[];
	onToggleSavePost: (postId: string) => void;
	allPosts: CommunityPost[];
	onViewOtherProfile: (idOrUsername: string) => void;
	onPostUpdated?: (updatedPost: CommunityPost) => void;
	onSelectPost?: (postId: string) => void;
}

export function CommunityUserProfileView({
	userIdOrUsername,
	currentUser,
	onBack,
	onEditProfile,
	savedPostIds,
	onToggleSavePost,
	allPosts,
	onViewOtherProfile,
	onPostUpdated,
	onSelectPost,
}: CommunityUserProfileViewProps) {
	const [user, setUser] = useState<CommunityUser | null>(null);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [comments, setComments] = useState<Array<{ comment: CommunityComment; post: CommunityPost }>>([]);
	const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]);
	const [followersUsers, setFollowersUsers] = useState<CommunityUser[]>([]);
	const [followingUsers, setFollowingUsers] = useState<CommunityUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Tabs: Only icon views that render content in the main feed
	const [activeTab, setActiveTab] = useState<"posts" | "comments" | "saved" | "history">("posts");

	// Followers & Following Popups
	const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
	const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
	const [modalSearch, setModalSearch] = useState("");

	// Local Profile Modal state (guarantees instant, reliable opening)
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [copiedProfileLink, setCopiedProfileLink] = useState(false);

	const [isFollowing, setIsFollowing] = useState(false);
	const [followersCount, setFollowersCount] = useState(0);
	const [isFollowLoading, setIsFollowLoading] = useState(false);

	// Comment replying state in profile
	const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
	const [replyText, setReplyText] = useState("");
	const [isSubmittingReply, setIsSubmittingReply] = useState(false);

	const cleanU1 = currentUser?.username?.replace(/^@/, "").toLowerCase();
	const cleanU2 = user?.username?.replace(/^@/, "").toLowerCase();
	const isSelf = Boolean(
		currentUser &&
			user &&
			(currentUser.id === user.id ||
				(cleanU1 && cleanU2 && cleanU1 === cleanU2)),
	);

	useEffect(() => {
		const fetchUserData = async () => {
			setIsLoading(true);
			try {
				const viewerParam = currentUser?.id ? `?viewerId=${encodeURIComponent(currentUser.id)}` : "";
				const res = await fetch(`/api/community/user/${encodeURIComponent(userIdOrUsername)}${viewerParam}`);
				if (res.ok) {
					const data = (await res.json()) as {
						user: CommunityUser;
						posts?: CommunityPost[];
						comments?: Array<{ comment: CommunityComment; post: CommunityPost }>;
						savedPosts?: CommunityPost[];
						followersUsers?: CommunityUser[];
						followingUsers?: CommunityUser[];
					};
					setUser(data.user);
					setPosts(data.posts || []);
					setComments(data.comments || []);
					setSavedPosts(data.savedPosts || []);
					setFollowersUsers(data.followersUsers || []);
					setFollowingUsers(data.followingUsers || []);

					const currentFollowers = data.user.followers || [];
					setFollowersCount(currentFollowers.length);
					if (currentUser) {
						setIsFollowing(currentFollowers.includes(currentUser.id));
					}
				}
			} catch (e) {
				console.error("Failed to load full user profile:", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [userIdOrUsername, currentUser]);

	const handleToggleFollow = async () => {
		if (!currentUser || !user || isFollowLoading) return;

		setIsFollowLoading(true);
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
			console.error("Failed to follow user:", e);
			setIsFollowing(!nextState);
			setFollowersCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
		} finally {
			setIsFollowLoading(false);
		}
	};

	const handleSaveProfileDirect = async (updated: Partial<CommunityUser>) => {
		if (!user) return;
		const res = await fetch("/api/community/profile", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: user.id,
				...updated,
			}),
		});
		if (!res.ok) {
			const errData = (await res.json()) as { error?: string };
			throw new Error(errData.error || "Không thể cập nhật hồ sơ");
		}
		const data = (await res.json()) as { user: CommunityUser };
		setUser(data.user);
		setIsProfileModalOpen(false);
		onEditProfile?.();
	};

	const handleCopyProfileLink = () => {
		if (typeof window === "undefined" || !user) return;
		const link = `${window.location.origin}${window.location.pathname}?user=${encodeURIComponent(user.username || user.id)}`;
		navigator.clipboard.writeText(link);
		setCopiedProfileLink(true);
		setTimeout(() => setCopiedProfileLink(false), 2000);
	};

	const handleReplyToCommentInProfile = async (postId: string, commentId: string) => {
		if (!currentUser || !replyText.trim() || isSubmittingReply) return;
		setIsSubmittingReply(true);
		try {
			const res = await fetch(`/api/community/posts/${postId}/comment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					author: {
						id: currentUser.id,
						username: currentUser.username,
						displayName: currentUser.displayName,
						avatar: currentUser.avatar,
					},
					content: replyText.trim(),
					parentId: commentId,
				}),
			});

			if (res.ok) {
				const data = (await res.json()) as { comment: CommunityComment };
				setComments((prev) =>
					prev.map((item) => {
						if (item.comment.id === commentId) {
							return {
								...item,
								comment: {
									...item.comment,
									replies: [...(item.comment.replies || []), data.comment],
								},
							};
						}
						return item;
					}),
				);
				setReplyText("");
				setReplyingCommentId(null);
			}
		} catch (e) {
			console.error("Failed to reply to comment in profile:", e);
		} finally {
			setIsSubmittingReply(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6 animate-pulse">
				<div className="h-44 rounded-2xl bg-muted/40 border border-border" />
				<div className="h-64 rounded-2xl bg-muted/30 border border-border" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
				<Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
				<h2 className="text-base font-semibold text-foreground">Không tìm thấy người dùng</h2>
				<p className="text-[13px] text-muted-foreground">
					Người dùng này không tồn tại hoặc đã thay đổi tên tài khoản.
				</p>
				<Button onClick={onBack} variant="outline-solid" size="sm" className="rounded-xl text-[13px] cursor-pointer">
					Quay lại Bảng tin
				</Button>
			</div>
		);
	}

	const historyList: UserProfileHistoryItem[] = user.profileHistory || [];
	const resolvedSavedPosts =
		savedPosts.length > 0
			? savedPosts
			: isSelf
				? allPosts.filter((p) => savedPostIds.includes(p.id))
				: allPosts.filter((p) => user?.savedPosts?.includes(p.id));

	const followingCount = user.following?.length || followingUsers.length || 0;

	return (
		<div className="space-y-5 min-w-0 w-full animate-in fade-in-0">
			{/* Gray Unified Profile Box: Phủ từ avatar đến ngày gia nhập thành màu xám. Mũi tên quay lại nằm bên trái tên người dùng. Avatar đẩy xuống bằng với phần bài viết */}
			<div className="rounded-2xl border border-border/80 bg-muted/50 dark:bg-muted/30 p-5 sm:p-6 shadow-2xs">
				<div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-end">
					{/* Avatar: Đẩy xuống bằng với hàng bài viết */}
					<div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-background bg-card shadow-sm overflow-hidden shrink-0 ring-2 ring-border/60 sm:self-end">
						<Image
							src={
								user.avatar ||
								"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
							}
							alt={user.displayName}
							fill
							sizes="96px"
							className="object-cover"
							unoptimized
						/>
					</div>

					{/* Profile info placed right inside this gray area */}
					<div className="flex-1 min-w-0 w-full space-y-2">
						{/* Row 1: Mũi tên quay lại + Tên người dùng + Username + Verified + Nút Chỉnh sửa / Theo dõi */}
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex flex-wrap items-center gap-2 min-w-0">
								{/* Mũi tên quay lại ngay bên cạnh trái tên người dùng */}
								<button
									type="button"
									onClick={onBack}
									className="rounded-full p-1 -ml-1 text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer"
									title="Quay lại Bảng tin cộng đồng"
									aria-label="Quay lại"
								>
									<ArrowLeft className="h-5 w-5" />
								</button>

								<h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
									{user.displayName}
								</h1>
								<span className="text-[13px] text-muted-foreground font-medium">
									{user.username}
								</span>
								<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
									<CheckCircle2 className="h-3 w-3" />
									Độc giả xác thực
								</span>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-2">
								{/* Share Profile Link Button */}
								<button
									type="button"
									onClick={handleCopyProfileLink}
									className="p-1.5 rounded-xl border border-border/70 hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									title="Sao chép liên kết trang cá nhân này"
								>
									<Share2 className="h-4 w-4" />
									<span className="sr-only">Chia sẻ liên kết</span>
								</button>
								{copiedProfileLink && (
									<span className="text-[11px] font-semibold text-primary animate-in fade-in-0">
										Đã copy link!
									</span>
								)}

								{isSelf ? (
									<Button
										type="button"
										onClick={() => setIsProfileModalOpen(true)}
										variant="outline-solid"
										size="sm"
										className="gap-1.5 text-[12px] font-semibold rounded-xl h-8 bg-background shadow-2xs hover:bg-card cursor-pointer"
									>
										<Edit3 className="h-3.5 w-3.5 text-primary" />
										<span>Chỉnh sửa hồ sơ</span>
									</Button>
								) : (
									<Button
										type="button"
										onClick={handleToggleFollow}
										disabled={isFollowLoading}
										size="sm"
										variant={isFollowing ? "outline-solid" : "default"}
										className="gap-1.5 text-[12px] font-semibold rounded-xl h-8 shadow-2xs cursor-pointer"
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

						{/* Row 2: Bio */}
						{user.bio ? (
							<p className="text-[13px] text-foreground/90 leading-relaxed max-w-2xl break-words">
								{user.bio.slice(0, 250)}
							</p>
						) : (
							<p className="text-[12.5px] text-muted-foreground italic">
								Chưa có lời giới thiệu bản thân.
							</p>
						)}

						{/* Row 3: Meta details */}
						<div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
								<span>Gia nhập: {formatCommunityExactTime(user.joinedAt)}</span>
							</div>
							{user.favoriteGenre && (
								<div className="flex items-center gap-1.5">
									<BookOpen className="h-3.5 w-3.5 text-primary" />
									<span>
										Thể loại: <strong className="text-foreground">{user.favoriteGenre}</strong>
									</span>
								</div>
							)}
						</div>

						{/* Row 4: Stats: Bài viết (không bôi đậm chữ khi active), Người theo dõi, Đang theo dõi (KHÔNG khung, KHÔNG bình luận) */}
						<div className="flex flex-wrap items-center gap-6 pt-1 text-[13px]">
							{/* Bài viết */}
							<button
								type="button"
								onClick={() => setActiveTab("posts")}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
							>
								<span className="font-bold text-foreground text-[14px]">{posts.length}</span>
								<span className="font-normal text-muted-foreground">bài viết</span>
							</button>

							{/* Người theo dõi */}
							<button
								type="button"
								onClick={() => {
									setModalSearch("");
									setIsFollowersModalOpen(true);
								}}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
							>
								<span className="font-bold text-foreground group-hover:text-primary transition-colors text-[14px]">
									{followersCount}
								</span>
								<span className="font-normal text-muted-foreground">người theo dõi</span>
							</button>

							{/* Đang theo dõi */}
							<button
								type="button"
								onClick={() => {
									setModalSearch("");
									setIsFollowingModalOpen(true);
								}}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
							>
								<span className="font-bold text-foreground group-hover:text-primary transition-colors text-[14px]">
									{followingCount}
								</span>
								<span className="font-normal text-muted-foreground">đang theo dõi</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Icon-Only Navigation Bar with Underline indicator (Chỉ icon bài viết, bình luận, đã lưu, lịch sử) */}
			<div className="flex items-center justify-center sm:justify-start gap-8 sm:gap-10 border-b border-border px-3">
				{/* Tab 1: Bài viết */}
				<button
					type="button"
					onClick={() => setActiveTab("posts")}
					className={`relative py-3 px-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
						activeTab === "posts" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
					}`}
					title={`Bài viết (${posts.length})`}
					aria-label="Bài viết"
				>
					<FileText className="h-5 w-5" />
					{activeTab === "posts" && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full animate-in fade-in-0" />
					)}
				</button>

				{/* Tab 2: Bình luận */}
				<button
					type="button"
					onClick={() => setActiveTab("comments")}
					className={`relative py-3 px-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
						activeTab === "comments" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
					}`}
					title={`Bình luận & Trả lời (${comments.length})`}
					aria-label="Bình luận"
				>
					<MessageSquare className="h-5 w-5" />
					{activeTab === "comments" && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full animate-in fade-in-0" />
					)}
				</button>

				{/* Tab 3: Đã lưu */}
				<button
					type="button"
					onClick={() => setActiveTab("saved")}
					className={`relative py-3 px-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
						activeTab === "saved" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
					}`}
					title={`Đã lưu (${resolvedSavedPosts.length})`}
					aria-label="Đã lưu"
				>
					<Bookmark className="h-5 w-5" />
					{activeTab === "saved" && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full animate-in fade-in-0" />
					)}
				</button>

				{/* Tab 4: Lịch sử thay đổi hồ sơ */}
				<button
					type="button"
					onClick={() => setActiveTab("history")}
					className={`relative py-3 px-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
						activeTab === "history" ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
					}`}
					title={`Lịch sử đổi hồ sơ (${historyList.length})`}
					aria-label="Lịch sử đổi hồ sơ"
				>
					<History className="h-5 w-5" />
					{activeTab === "history" && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full animate-in fade-in-0" />
					)}
				</button>
			</div>

			{/* Tab 1: Posts Tab (Full Interactive CommunityPostCard) */}
			{activeTab === "posts" && (
				<div className="space-y-4">
					{posts.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border p-12 text-center">
							<FileText className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
							<h3 className="font-semibold text-foreground text-[15px]">Chưa có bài viết nào</h3>
							<p className="mt-1 text-[13px] text-muted-foreground">
								Độc giả này chưa chia sẻ cảm nhận hoặc bài viết nào trong cộng đồng.
							</p>
						</div>
					) : (
						posts.map((post) => (
							<CommunityPostCard
								key={post.id}
								post={post}
								currentUser={currentUser}
								isSaved={savedPostIds.includes(post.id)}
								onToggleSave={onToggleSavePost}
								onViewAuthorProfile={onViewOtherProfile}
								onPostUpdated={(updated) => {
									setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
									onPostUpdated?.(updated);
								}}
								onToggleHidePost={async (postId) => {
									setPosts((prev) =>
										prev.map((p) => (p.id === postId ? { ...p, isHidden: !p.isHidden } : p)),
									);
								}}
							/>
						))
					)}
				</div>
			)}

			{/* Tab 2: Comments & Discussion Tab (With inline replies & jumping to original post) */}
			{activeTab === "comments" && (
				<div className="space-y-4">
					{comments.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border p-12 text-center">
							<MessageSquare className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
							<h3 className="font-semibold text-foreground text-[15px]">Chưa có bình luận nào</h3>
							<p className="mt-1 text-[13px] text-muted-foreground">
								Độc giả này chưa tham gia bình luận ở các bài viết.
							</p>
						</div>
					) : (
						comments.map((item, idx) => (
							<div
								key={idx}
								className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
							>
								{/* Context post header with CLICKABLE ORIGINAL POST LINK */}
								<div className="flex flex-wrap items-center justify-between gap-2 text-[12px] border-b border-border/60 pb-2.5">
									<div className="flex items-center gap-1.5 min-w-0 max-w-full">
										<span className="text-muted-foreground font-medium shrink-0">Đã bình luận vào:</span>
										<button
											type="button"
											onClick={() => onSelectPost?.(item.post.id)}
											className="font-bold text-foreground hover:text-primary hover:underline transition-colors truncate text-left cursor-pointer inline-flex items-center gap-1 group"
											title="Nhấn để xem bài viết gốc"
										>
											<span className="truncate">"{item.post?.title || "Bài viết cộng đồng"}"</span>
											<ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
										</button>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={() => onSelectPost?.(item.post.id)}
											className="text-[11.5px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
											title="Chuyển đến bài viết gốc"
										>
											<span>Xem bài viết gốc</span>
											<ExternalLink className="h-3 w-3" />
										</button>
										<span className="text-muted-foreground font-medium text-[11px]">
											• {formatCommunityExactTime(item.comment.createdAt)}
										</span>
									</div>
								</div>

								{/* Comment text */}
								<div className="text-[13.5px]">
									<FormattedCommunityContent
										content={item.comment.content}
										onTagClick={onViewOtherProfile}
									/>
								</div>

								{/* Action: Reply button */}
								<div className="pt-2 border-t border-border/40 flex items-center justify-between">
									<button
										type="button"
										onClick={() => {
											if (replyingCommentId === item.comment.id) {
												setReplyingCommentId(null);
											} else {
												setReplyingCommentId(item.comment.id);
												setReplyText(`@${user.username.replace(/^@/, "")} `);
											}
										}}
										className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline cursor-pointer"
									>
										<CornerDownRight className="h-3.5 w-3.5" />
										<span>Trả lời bình luận này</span>
									</button>
								</div>

								{/* Inline reply form */}
								{replyingCommentId === item.comment.id && (
									<form
										onSubmit={(e) => {
											e.preventDefault();
											handleReplyToCommentInProfile(item.post.id, item.comment.id);
										}}
										className="flex items-center gap-2 pt-2 animate-in fade-in-0"
									>
										<Input
											type="text"
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											placeholder={`Trả lời cho ${user.displayName}...`}
											className="h-8.5 text-[12px] bg-muted/30"
											autoFocus
											disabled={isSubmittingReply}
										/>
										<Button
											type="submit"
											size="sm"
											disabled={!replyText.trim() || isSubmittingReply}
											className="h-8.5 px-3 text-[12px] font-semibold shrink-0 cursor-pointer"
										>
											<Send className="h-3 w-3 mr-1" />
											Gửi
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setReplyingCommentId(null)}
											className="h-8.5 px-2 text-[12px] shrink-0 cursor-pointer"
										>
											Hủy
										</Button>
									</form>
								)}

								{/* Sub-replies */}
								{item.comment.replies && item.comment.replies.length > 0 && (
									<div className="ml-4 space-y-2 border-l-2 border-primary/20 pl-3 pt-2">
										{item.comment.replies.map((rep) => (
											<div key={rep.id} className="rounded-xl bg-muted/20 p-2.5 border border-border/40 text-[12.5px] space-y-1">
												<div className="flex items-center justify-between text-[11px]">
													<span className="font-bold text-foreground">{rep.author.displayName}</span>
													<span className="text-muted-foreground">{formatCommunityExactTime(rep.createdAt)}</span>
												</div>
												<FormattedCommunityContent content={rep.content} onTagClick={onViewOtherProfile} />
											</div>
										))}
									</div>
								)}
							</div>
						))
					)}
				</div>
			)}

			{/* Tab 3: Saved Posts Tab */}
			{activeTab === "saved" && (
				<div className="space-y-4">
					{resolvedSavedPosts.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border p-12 text-center">
							<Bookmark className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
							<h3 className="font-semibold text-foreground text-[15px]">Chưa có bài viết đã lưu nào</h3>
							<p className="mt-1 text-[13px] text-muted-foreground">
								Độc giả này chưa lưu bài viết nào.
							</p>
						</div>
					) : (
						resolvedSavedPosts.map((post) => (
							<CommunityPostCard
								key={post.id}
								post={post}
								currentUser={currentUser}
								isSaved={savedPostIds.includes(post.id)}
								onToggleSave={onToggleSavePost}
								onViewAuthorProfile={onViewOtherProfile}
								onPostUpdated={onPostUpdated}
							/>
						))
					)}
				</div>
			)}

			{/* Tab 4: Profile Change History Timeline */}
			{activeTab === "history" && (
				<div className="space-y-4">
					<div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
						<History className="h-5 w-5 text-amber-500 shrink-0" />
						<div className="text-[13px]">
							<span className="font-bold text-foreground">Lịch sử thay đổi hồ sơ: </span>
							<span className="text-muted-foreground">
								Ghi nhận tất cả các lần cập nhật ảnh đại diện, họ tên và thông tin tài khoản
							</span>
						</div>
					</div>

					{historyList.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border p-12 text-center">
							<History className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
							<h3 className="font-semibold text-foreground text-[15px]">Chưa có lịch sử thay đổi</h3>
							<p className="mt-1 text-[13px] text-muted-foreground">
								Hồ sơ người dùng này chưa từng được chỉnh sửa kể từ ngày khởi tạo.
							</p>
						</div>
					) : (
						<div className="space-y-3.5">
							{historyList.map((hist, idx) => (
								<div
									key={hist.id || idx}
									className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-3 relative"
								>
									<div className="flex items-center justify-between border-b border-border/60 pb-2.5">
										<div className="flex items-center gap-2">
											<span className="h-2 w-2 rounded-full bg-amber-500" />
											<span className="text-[13px] font-bold text-foreground">
												Cập nhật hồ sơ #{historyList.length - idx}
											</span>
										</div>
										<span className="text-[12px] text-muted-foreground font-medium flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatCommunityExactTime(hist.changedAt)}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
										{/* Previous version */}
										<div className="rounded-xl bg-muted/30 p-3.5 border border-border/60 space-y-2.5">
											<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
												Thông tin trước khi đổi:
											</span>
											<div className="flex items-center gap-3">
												{hist.previousAvatar && (
													<div className="relative h-11 w-11 rounded-full overflow-hidden border border-border bg-muted shrink-0">
														<Image
															src={hist.previousAvatar}
															alt="Previous avatar"
															fill
															sizes="44px"
															className="object-cover"
															unoptimized
														/>
													</div>
												)}
												<div>
													<div className="font-bold text-foreground">
														{hist.previousDisplayName || "Chưa đặt"}
													</div>
													<div className="text-[12px] text-muted-foreground">
														{hist.previousUsername || "Chưa đặt"}
													</div>
												</div>
											</div>
											{hist.previousBio && (
												<div className="text-[12px] text-muted-foreground italic line-clamp-2">
													"{hist.previousBio}"
												</div>
											)}
										</div>

										{/* New updated version */}
										<div className="rounded-xl bg-primary/5 p-3.5 border border-primary/20 space-y-2.5">
											<span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
												Thông tin mới cập nhật:
											</span>
											<div className="flex items-center gap-3">
												{hist.newAvatar && (
													<div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-primary bg-muted shrink-0 shadow-2xs">
														<Image
															src={hist.newAvatar}
															alt="New avatar"
															fill
															sizes="44px"
															className="object-cover"
															unoptimized
														/>
													</div>
												)}
												<div>
													<div className="font-bold text-foreground">
														{hist.newDisplayName || "Chưa đặt"}
													</div>
													<div className="text-[12px] text-primary font-semibold">
														{hist.newUsername || "Chưa đặt"}
													</div>
												</div>
											</div>
											{hist.newBio && (
												<div className="text-[12px] text-foreground/90 italic line-clamp-2">
													"{hist.newBio}"
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* POPUP MODAL 1: Followers Popup Modal */}
			{isFollowersModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs animate-in fade-in-0">
					<div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-primary" />
								<h2 className="text-base font-bold text-foreground">
									Người theo dõi ({followersUsers.length})
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setIsFollowersModalOpen(false)}
								className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						{/* Search in modal if list has items */}
						{followersUsers.length > 4 && (
							<div className="pt-3 pb-1 shrink-0">
								<div className="relative">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										type="text"
										value={modalSearch}
										onChange={(e) => setModalSearch(e.target.value)}
										placeholder="Tìm kiếm người theo dõi..."
										className="pl-8.5 h-8.5 text-[12.5px] bg-muted/30"
									/>
								</div>
							</div>
						)}

						{/* Body list */}
						<div className="overflow-y-auto mt-3 pr-1 space-y-2 flex-1">
							{followersUsers.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground text-[13px]">
									Chưa có người theo dõi nào.
								</div>
							) : (
								followersUsers
									.filter(
										(u) =>
											!modalSearch.trim() ||
											u.displayName.toLowerCase().includes(modalSearch.toLowerCase()) ||
											u.username.toLowerCase().includes(modalSearch.toLowerCase()),
									)
									.map((u) => (
										<div
											key={u.id}
											className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
										>
											<button
												type="button"
												onClick={() => {
													setIsFollowersModalOpen(false);
													onViewOtherProfile(u.username || u.id);
												}}
												className="flex items-center gap-3 text-left min-w-0 flex-1 group cursor-pointer"
											>
												<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
													<Image
														src={
															u.avatar ||
															"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
														}
														alt={u.displayName}
														fill
														sizes="40px"
														className="object-cover"
														unoptimized
													/>
												</div>
												<div className="min-w-0">
													<div className="font-bold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
														{u.displayName}
													</div>
													<div className="text-[11.5px] text-muted-foreground truncate">
														{u.username}
													</div>
													{u.bio && (
														<div className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
															{u.bio}
														</div>
													)}
												</div>
											</button>

											<Button
												type="button"
												variant="outline-solid"
												size="sm"
												onClick={() => {
													setIsFollowersModalOpen(false);
													onViewOtherProfile(u.username || u.id);
												}}
												className="text-[12px] h-7.5 rounded-xl font-semibold shrink-0 cursor-pointer"
											>
												Xem hồ sơ
											</Button>
										</div>
									))
							)}
						</div>
					</div>
				</div>
			)}

			{/* POPUP MODAL 2: Following Popup Modal */}
			{isFollowingModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs animate-in fade-in-0">
					<div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
							<div className="flex items-center gap-2">
								<UserCheck className="h-4 w-4 text-primary" />
								<h2 className="text-base font-bold text-foreground">
									Đang theo dõi ({followingUsers.length})
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setIsFollowingModalOpen(false)}
								className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						{/* Search in modal if list has items */}
						{followingUsers.length > 4 && (
							<div className="pt-3 pb-1 shrink-0">
								<div className="relative">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										type="text"
										value={modalSearch}
										onChange={(e) => setModalSearch(e.target.value)}
										placeholder="Tìm kiếm người đang theo dõi..."
										className="pl-8.5 h-8.5 text-[12.5px] bg-muted/30"
									/>
								</div>
							</div>
						)}

						{/* Body list */}
						<div className="overflow-y-auto mt-3 pr-1 space-y-2 flex-1">
							{followingUsers.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground text-[13px]">
									Chưa theo dõi người dùng nào.
								</div>
							) : (
								followingUsers
									.filter(
										(u) =>
											!modalSearch.trim() ||
											u.displayName.toLowerCase().includes(modalSearch.toLowerCase()) ||
											u.username.toLowerCase().includes(modalSearch.toLowerCase()),
									)
									.map((u) => (
										<div
											key={u.id}
											className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
										>
											<button
												type="button"
												onClick={() => {
													setIsFollowingModalOpen(false);
													onViewOtherProfile(u.username || u.id);
												}}
												className="flex items-center gap-3 text-left min-w-0 flex-1 group cursor-pointer"
											>
												<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
													<Image
														src={
															u.avatar ||
															"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
														}
														alt={u.displayName}
														fill
														sizes="40px"
														className="object-cover"
														unoptimized
													/>
												</div>
												<div className="min-w-0">
													<div className="font-bold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
														{u.displayName}
													</div>
													<div className="text-[11.5px] text-muted-foreground truncate">
														{u.username}
													</div>
													{u.bio && (
														<div className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
															{u.bio}
														</div>
													)}
												</div>
											</button>

											<Button
												type="button"
												variant="outline-solid"
												size="sm"
												onClick={() => {
													setIsFollowingModalOpen(false);
													onViewOtherProfile(u.username || u.id);
												}}
												className="text-[12px] h-7.5 rounded-xl font-semibold shrink-0 cursor-pointer"
											>
												Xem hồ sơ
											</Button>
										</div>
									))
							)}
						</div>
					</div>
				</div>
			)}

			{/* Reliable Profile Edit Modal directly integrated */}
			<CommunityProfileModal
				isOpen={isProfileModalOpen}
				user={user}
				onClose={() => setIsProfileModalOpen(false)}
				onSave={handleSaveProfileDirect}
			/>
		</div>
	);
}
