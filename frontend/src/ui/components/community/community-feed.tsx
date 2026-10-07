"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	BookOpen,
	Library,
	Bookmark,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { type CommunityPost, type CommunityUser } from "@/lib/community/types";
import { type TrendingBookItem, type ActiveReaderItem } from "@/lib/community/storage";
import { CommunityRightNav } from "./community-right-nav";
import { CommunityLeftNav, type CommunityNavTab } from "./community-left-nav";
import { CommunityTermsModal } from "./community-terms-modal";
import { CommunityProfileModal } from "./community-profile-modal";
import { CommunityUserProfileView } from "./community-user-profile-view";
import { CommunityCreatePost } from "./community-create-post";
import { CommunityPostCard } from "./community-post-card";

const LOCAL_STORAGE_TERMS_KEY = "aurabook_community_terms_accepted_v2";

export function CommunityFeed() {
	const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeNav, setActiveNav] = useState<CommunityNavTab>("feed");
	const [activeTab, setActiveTab] = useState<"all" | "reviews" | "posts" | "pinned">("all");
	const [viewProfileTarget, setViewProfileTarget] = useState<string | null>(null);

	// Real sidebar statistics (trending books & active readers)
	const [sidebarData, setSidebarData] = useState<{
		trendingBooks: TrendingBookItem[];
		topReaders: ActiveReaderItem[];
	}>({ trendingBooks: [], topReaders: [] });
	const [isSidebarLoading, setIsSidebarLoading] = useState(true);

	// Modals
	const [isTermsOpen, setIsTermsOpen] = useState(false);
	const [isTermsMandatory, setIsTermsMandatory] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	// Saved posts state (synced with localStorage)
	const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem("aurabook_community_saved_post_ids");
				if (saved) return JSON.parse(saved) as string[];
			} catch {}
		}
		return ["post-1"];
	});

	const handleToggleSavePost = (postId: string) => {
		setSavedPostIds((prev) => {
			const next = prev.includes(postId)
				? prev.filter((id) => id !== postId)
				: [...prev, postId];
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem("aurabook_community_saved_post_ids", JSON.stringify(next));
				} catch {}
			}
			return next;
		});
	};

	// Fetch real sidebar statistics (trending books & active readers)
	const loadSidebarData = async () => {
		try {
			setIsSidebarLoading(true);
			const sidebarRes = await fetch("/api/community/sidebar");
			if (sidebarRes.ok) {
				const sData = (await sidebarRes.json()) as {
					trendingBooks: TrendingBookItem[];
					topReaders: ActiveReaderItem[];
				};
				setSidebarData(sData);
			}
		} catch (e) {
			console.error("[community] Failed to load sidebar data:", e);
		} finally {
			setIsSidebarLoading(false);
		}
	};

	// Load user profile & posts & real sidebar statistics
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			try {
				// 1. Check local terms acceptance
				const hasAcceptedLocal = localStorage.getItem(LOCAL_STORAGE_TERMS_KEY) === "true";

				// 2. Fetch user profile
				const profileRes = await fetch("/api/community/profile");
				let userProfile: CommunityUser | null = null;
				if (profileRes.ok) {
					const profileData = (await profileRes.json()) as { user: CommunityUser };
					userProfile = profileData.user;
					setCurrentUser(userProfile);
				}

				// If NOT accepted in localStorage AND NOT in profile, enforce mandatory terms modal!
				if (!hasAcceptedLocal && (!userProfile || !userProfile.hasAcceptedTerms)) {
					setIsTermsMandatory(true);
					setIsTermsOpen(true);
				}

				// 3. Fetch posts
				const postsRes = await fetch("/api/community/posts");
				if (postsRes.ok) {
					const postsData = (await postsRes.json()) as { posts: CommunityPost[] };
					setPosts(postsData.posts);
				}

				// 4. Fetch real sidebar statistics
				await loadSidebarData();
			} catch (e) {
				console.error("[community] Failed to load data:", e);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();
	}, []);

	// Accept terms
	const handleAcceptTerms = async () => {
		try {
			localStorage.setItem(LOCAL_STORAGE_TERMS_KEY, "true");
			if (currentUser) {
				const res = await fetch("/api/community/profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: currentUser.id,
						hasAcceptedTerms: true,
					}),
				});
				if (res.ok) {
					const data = (await res.json()) as { user: CommunityUser };
					setCurrentUser(data.user);
				}
			}
			setIsTermsOpen(false);
			setIsTermsMandatory(false);
			// Automatically open profile setup after accepting terms!
			setIsProfileOpen(true);
		} catch (e) {
			console.error("Failed to accept terms:", e);
		}
	};

	// Save profile
	const handleSaveProfile = async (updated: Partial<CommunityUser>) => {
		if (!currentUser) return;
		const res = await fetch("/api/community/profile", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: currentUser.id,
				...updated,
			}),
		});

		if (!res.ok) {
			const data = (await res.json()) as { error?: string };
			throw new Error(data.error || "Không thể cập nhật hồ sơ");
		}

		const data = (await res.json()) as { user: CommunityUser };
		setCurrentUser(data.user);
		loadSidebarData();
	};

	// Add new post & immediately refresh real sidebar stats
	const handlePostCreated = (newPost: CommunityPost) => {
		setPosts((prev) => [newPost, ...prev]);
		loadSidebarData();
	};

	const handlePostUpdated = (updatedPost: CommunityPost) => {
		setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
	};

	const handleToggleHidePost = async (postId: string) => {
		setPosts((prev) => prev.filter((p) => p.id !== postId));
	};

	// Filter posts
	const filteredPosts = posts.filter((p) => {
		// Navigation tabs filter
		if (activeNav === "reviews" && !p.book && !p.isFromProductReview) return false;
		if (activeNav === "saved" && !savedPostIds.includes(p.id)) return false;

		// Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			const matchTitle = p.title.toLowerCase().includes(q);
			const matchContent = p.content.toLowerCase().includes(q);
			const matchBook = p.book?.title.toLowerCase().includes(q);
			const matchAuthor = p.author.displayName.toLowerCase().includes(q);
			if (!matchTitle && !matchContent && !matchBook && !matchAuthor) return false;
		}

		// Feed tab filter
		if (activeNav === "feed") {
			if (activeTab === "reviews") return p.isFromProductReview || !!p.book;
			if (activeTab === "posts") return !p.isFromProductReview;
			if (activeTab === "pinned") return p.isPinned;
		}

		return true;
	});

	return (
		<div className="w-full min-h-[calc(100vh-4rem)]">
			{/* Terms & Conditions Modal */}
			<CommunityTermsModal
				isOpen={isTermsOpen}
				mandatory={isTermsMandatory}
				onClose={() => setIsTermsOpen(false)}
				onAccept={handleAcceptTerms}
			/>

			{/* Profile Customization Modal */}
			<CommunityProfileModal
				isOpen={isProfileOpen}
				user={currentUser}
				onClose={() => setIsProfileOpen(false)}
				onSave={handleSaveProfile}
			/>

			{/* Main Social Layout: 3 Columns Spanning Wide */}
			<div className="w-full max-w-[1840px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start w-full">
					{/* Left Column: Fixed / Sticky Navigation Sidebar (with Profile & Settings at the bottom) */}
					<aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start z-20 pr-1">
						<CommunityLeftNav
							activeNav={activeNav}
							onSelectNav={(nav) => {
								setActiveNav(nav);
								if (nav === "reviews") setActiveTab("reviews");
								else if (nav === "feed") setActiveTab("all");
							}}
							savedCount={savedPostIds.length}
							currentUser={currentUser}
							onOpenProfile={() => setIsProfileOpen(true)}
							onViewSelfProfile={() => {
								if (currentUser) {
									setViewProfileTarget(currentUser.username || currentUser.id);
								} else {
									setIsProfileOpen(true);
								}
							}}
							onOpenTerms={() => {
								setIsTermsMandatory(false);
								setIsTermsOpen(true);
							}}
							searchQuery={searchQuery}
							onSearchChange={(q) => {
								setSearchQuery(q);
								if (q.trim() && activeNav !== "feed") {
									setActiveNav("feed");
								}
							}}
							onSearchSubmit={(q) => {
								setSearchQuery(q);
								setActiveNav("feed");
							}}
						/>
					</aside>

					{/* Middle Column: Main Social Feed (Scrollable) */}
					<main className="lg:col-span-6 space-y-6 min-w-0 w-full">
						{/* Blocked User Notice & Access Denied Screen */}
						{currentUser?.isBlocked ? (
							<div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-8 text-center space-y-4 shadow-xs animate-in fade-in-0">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
									<ShieldAlert className="h-8 w-8" />
								</div>
								<div className="space-y-1.5">
									<h2 className="text-lg font-bold text-destructive">
										Tài khoản bị khóa quyền truy cập cộng đồng
									</h2>
									<p className="text-xs sm:text-sm text-foreground/85 max-w-md mx-auto leading-relaxed">
										Tài khoản <span className="font-semibold text-foreground">{currentUser.displayName}</span> ({currentUser.username}) đã bị quản trị viên khóa quyền truy cập do vi phạm quy ước hoặc điều khoản cộng đồng. Bạn không có quyền xem bảng tin, đăng bài hoặc tương tác trong không gian này.
									</p>
								</div>
								<div className="pt-2 flex flex-wrap justify-center items-center gap-3">
									<Link
										href="/vi/channel-vnd"
										className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
									>
										Quay lại trang mua sách
									</Link>
									<Button
										type="button"
										variant="outline-solid"
										size="sm"
										onClick={() =>
											alert(
												"Vui lòng gửi email đến banquantri@aurabook.vn để được hỗ trợ mở khóa tài khoản.",
											)
										}
										className="text-xs font-semibold rounded-xl h-8.5"
									>
										Liên hệ hỗ trợ mở khóa
									</Button>
								</div>
							</div>
						) : viewProfileTarget ? (
							<CommunityUserProfileView
								userIdOrUsername={viewProfileTarget}
								currentUser={currentUser}
								onBack={() => setViewProfileTarget(null)}
								onEditProfile={async () => {
									try {
										const res = await fetch("/api/community/profile");
										if (res.ok) {
											const d = (await res.json()) as { user: CommunityUser };
											setCurrentUser(d.user);
										}
										loadSidebarData();
									} catch (e) {
										console.error(e);
									}
								}}
								savedPostIds={savedPostIds}
								onToggleSavePost={handleToggleSavePost}
								allPosts={posts}
								onViewOtherProfile={(idOrUsername) => setViewProfileTarget(idOrUsername)}
								onPostUpdated={handlePostUpdated}
							/>
						) : (
							<>

						{/* Active Search Filter Banner */}
						{searchQuery.trim() && (
							<div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3 shadow-2xs">
								<div className="text-[13px]">
									<span className="font-semibold text-foreground">Đang lọc theo từ khóa: </span>
									<span className="text-primary font-bold">"{searchQuery}"</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSearchQuery("")}
									className="h-8 text-[13px] font-semibold hover:bg-primary/10 text-primary"
								>
									Xóa lọc
								</Button>
							</div>
						)}

						{/* Different view depending on selected left navigation */}
						{activeNav === "bookshelf" ? (
							<div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
								<div className="flex items-center gap-2 border-b border-border pb-3">
									<Library className="h-5 w-5 text-primary" />
									<h2 className="text-[15px] font-semibold text-foreground">
										Tủ sách cá nhân của tôi
									</h2>
								</div>
								<div className="grid grid-cols-2 gap-4 pt-2">
									<div className="rounded-xl bg-muted/30 p-4 border border-border/60">
										<span className="text-[13px] text-muted-foreground block font-medium">Đang đọc</span>
										<span className="text-xl font-bold text-foreground mt-1 block">2 cuốn</span>
									</div>
									<div className="rounded-xl bg-muted/30 p-4 border border-border/60">
										<span className="text-[13px] text-muted-foreground block font-medium">Đã đọc xong</span>
										<span className="text-xl font-bold text-foreground mt-1 block">12 cuốn</span>
									</div>
								</div>
								<p className="text-[13px] text-muted-foreground pt-2 leading-relaxed">
									Mẹo: Khi bạn để lại nhận xét cho sách đã mua, tác phẩm sẽ tự động lưu vào tủ sách này.
								</p>
							</div>
						) : activeNav === "saved" ? (
							<div className="space-y-6">
								<div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
											<Bookmark className="h-5 w-5" />
										</div>
										<div>
											<h2 className="text-[15px] font-semibold text-foreground">
												Bài viết đã lưu ({filteredPosts.length})
											</h2>
											<p className="text-[13px] text-muted-foreground mt-0.5">
												Các bài viết và đánh giá bạn đã đánh dấu để xem lại
											</p>
										</div>
									</div>
									<Button
										variant="outline-solid"
										size="sm"
										onClick={() => setActiveNav("feed")}
										className="text-[13px] font-medium"
									>
										Quay lại bảng tin
									</Button>
								</div>

								{/* Saved Posts Feed */}
								{isLoading ? (
									<div className="space-y-4">
										{[1, 2].map((i) => (
											<div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border border-border" />
										))}
									</div>
								) : filteredPosts.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-border p-12 text-center">
										<Bookmark className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
										<h3 className="font-semibold text-foreground text-[15px]">Chưa có bài viết đã lưu nào</h3>
										<p className="mt-1 text-[13px] text-muted-foreground">
											Bấm nút lưu trên các bài viết ở bảng tin để giữ lại tại đây!
										</p>
									</div>
								) : (
									<div className="space-y-5">
										{filteredPosts.map((post) => (
											<CommunityPostCard
												key={post.id}
												post={post}
												currentUser={currentUser}
												isSaved={savedPostIds.includes(post.id)}
												onToggleSave={handleToggleSavePost}
												onViewAuthorProfile={(authorId) => setViewProfileTarget(authorId)}
												onPostUpdated={handlePostUpdated}
												onToggleHidePost={handleToggleHidePost}
												onRequireLogin={() => {
													if (!currentUser?.hasAcceptedTerms) {
														setIsTermsMandatory(true);
														setIsTermsOpen(true);
													}
												}}
											/>
										))}
									</div>
								)}
							</div>
						) : (
							<>
								{/* Create Post Box (Hidden if user is blocked) */}
								{!currentUser?.isBlocked && (
									<CommunityCreatePost
										currentUser={currentUser}
										onPostCreated={handlePostCreated}
										onRequireTermsOrProfile={() => {
											if (!currentUser?.hasAcceptedTerms) {
												setIsTermsMandatory(true);
												setIsTermsOpen(true);
											} else {
												setIsProfileOpen(true);
											}
										}}
									/>
								)}

								{/* Feed Filter Tabs */}
								<div className="flex items-center justify-between gap-2 border-b border-border pb-3">
									<div className="flex items-center gap-2 overflow-x-auto pb-1">
										<button
											type="button"
											onClick={() => setActiveTab("all")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "all"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Tất cả ({posts.length})
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("reviews")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "reviews"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Đánh giá sách
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("posts")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "posts"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Thảo luận
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("pinned")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "pinned"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Được ghim
										</button>
									</div>
								</div>

								{/* Posts Feed */}
								{isLoading ? (
									<div className="space-y-4">
										{[1, 2, 3].map((i) => (
											<div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border border-border" />
										))}
									</div>
								) : filteredPosts.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-border p-12 text-center">
										<BookOpen className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
										<h3 className="font-semibold text-foreground text-[15px]">Chưa có bài viết nào</h3>
										<p className="mt-1 text-[13px] text-muted-foreground">
											{searchQuery
												? "Không tìm thấy kết quả phù hợp với từ khóa."
												: "Hãy là người đầu tiên chia sẻ cảm nhận hoặc viết đánh giá sách!"}
										</p>
									</div>
								) : (
									<div className="space-y-5">
										{filteredPosts.map((post) => (
											<CommunityPostCard
												key={post.id}
												post={post}
												currentUser={currentUser}
												isSaved={savedPostIds.includes(post.id)}
												onToggleSave={handleToggleSavePost}
												onViewAuthorProfile={(authorId) => setViewProfileTarget(authorId)}
												onPostUpdated={handlePostUpdated}
												onToggleHidePost={handleToggleHidePost}
												onRequireLogin={() => {
													if (!currentUser?.hasAcceptedTerms) {
														setIsTermsMandatory(true);
														setIsTermsOpen(true);
													}
												}}
											/>
										))}
									</div>
								)}
							</>
						)}
					</>
				)}
			</main>

					{/* Right Column: Fixed / Sticky Right Sidebar (Real Trending Books & Real Active Readers) */}
					<aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start z-20 pl-1">
						<CommunityRightNav
							trendingBooks={sidebarData.trendingBooks}
							topReaders={sidebarData.topReaders}
							isLoading={isSidebarLoading}
							onSelectBook={(title) => {
								setSearchQuery(title);
								if (activeNav !== "feed") setActiveNav("feed");
							}}
							onSelectReader={(name) => {
								// Find username from topReaders
								const reader = sidebarData.topReaders.find((r) => r.name === name || r.username === name);
								if (reader) {
									setViewProfileTarget(reader.username);
								} else {
									setSearchQuery(name);
									if (activeNav !== "feed") setActiveNav("feed");
								}
							}}
						/>
					</aside>
				</div>
			</div>
		</div>
	);
}
