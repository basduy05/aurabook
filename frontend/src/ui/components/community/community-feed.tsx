"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	BookOpen,
	Library,
	Bookmark,
	ShieldAlert,
	ArrowLeft,
	CheckCircle2,
	Lock,
	Clock,
	ShoppingBag,
	ExternalLink,
	BookMarked,
	ArrowUp,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { type CommunityPost, type CommunityUser } from "@/lib/community/types";
import { type TrendingBookItem, type ActiveReaderItem } from "@/lib/community/storage";
import { type BookshelfItem } from "@/app/api/community/bookshelf/route";
import { CommunityRightNav } from "./community-right-nav";
import { CommunityLeftNav, type CommunityNavTab } from "./community-left-nav";
import { CommunityTermsModal } from "./community-terms-modal";
import { CommunityProfileModal } from "./community-profile-modal";
import { CommunityUserProfileView } from "./community-user-profile-view";
import { CommunityCreatePost } from "./community-create-post";
import { CommunityPostCard } from "./community-post-card";
import { CommunityGuestLanding } from "./community-guest-landing";
import { CommunityLoggedOutView } from "./community-logged-out-view";

const LOCAL_STORAGE_TERMS_KEY = "aurabook_community_terms_accepted_v2";

export function CommunityFeed() {
	const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeNav, setActiveNav] = useState<CommunityNavTab>("feed");
	const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
	const [viewProfileTarget, setViewProfileTarget] = useState<string | null>(null);
	const [focusedPostId, setFocusedPostId] = useState<string | null>(null);
	const [pendingNewPosts, setPendingNewPosts] = useState<CommunityPost[]>([]);

	// Helper to synchronize query parameters in browser URL
	const updateUrlState = (profile: string | null, post: string | null) => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		if (profile) {
			url.searchParams.set("user", profile);
			url.searchParams.delete("post");
			url.searchParams.delete("u");
			url.searchParams.delete("postId");
		} else if (post) {
			url.searchParams.set("post", post);
			url.searchParams.delete("user");
			url.searchParams.delete("u");
			url.searchParams.delete("postId");
		} else {
			url.searchParams.delete("user");
			url.searchParams.delete("post");
			url.searchParams.delete("u");
			url.searchParams.delete("postId");
		}
		window.history.pushState(null, "", url.toString());
	};

	const handleExitProfileAndPost = () => {
		setViewProfileTarget(null);
		setFocusedPostId(null);
		updateUrlState(null, null);
	};

	const handleViewProfile = (usernameOrId: string) => {
		setViewProfileTarget(usernameOrId);
		setFocusedPostId(null);
		updateUrlState(usernameOrId, null);
	};

	const handleSelectPost = (postId: string) => {
		setViewProfileTarget(null);
		setFocusedPostId(postId);
		updateUrlState(null, postId);
	};

	// Listen to URL searchParams on mount and on popstate (browser back/forward)
	useEffect(() => {
		if (typeof window === "undefined") return;

		const syncFromUrl = () => {
			const params = new URLSearchParams(window.location.search);
			const userParam = params.get("user") || params.get("u");
			const postParam = params.get("post") || params.get("postId");

			if (userParam) {
				setViewProfileTarget(userParam);
				setFocusedPostId(null);
			} else if (postParam) {
				setFocusedPostId(postParam);
				setViewProfileTarget(null);
			} else {
				setViewProfileTarget(null);
				setFocusedPostId(null);
			}
		};

		syncFromUrl();

		window.addEventListener("popstate", syncFromUrl);
		return () => window.removeEventListener("popstate", syncFromUrl);
	}, []);

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

	// Saved posts state (real user data synced with backend)
	const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

	// Bookshelf state (real digital books with reading progress)
	const [bookshelfData, setBookshelfData] = useState<{
		books: BookshelfItem[];
		stats: {
			totalBooks: number;
			readingCount: number;
			finishedCount: number;
			notStartedCount: number;
		};
		isLoading: boolean;
	}>({
		books: [],
		stats: { totalBooks: 0, readingCount: 0, finishedCount: 0, notStartedCount: 0 },
		isLoading: false,
	});

	const loadBookshelfData = async (userId?: string) => {
		try {
			setBookshelfData((prev) => ({ ...prev, isLoading: true }));
			const url = userId
				? `/api/community/bookshelf?userId=${encodeURIComponent(userId)}`
				: "/api/community/bookshelf";
			const res = await fetch(url);
			if (res.ok) {
				const data = (await res.json()) as {
					books?: BookshelfItem[];
					stats?: {
						totalBooks: number;
						readingCount: number;
						finishedCount: number;
						notStartedCount: number;
					};
				};
				setBookshelfData({
					books: data.books || [],
					stats: data.stats || {
						totalBooks: 0,
						readingCount: 0,
						finishedCount: 0,
						notStartedCount: 0,
					},
					isLoading: false,
				});
			} else {
				setBookshelfData((prev) => ({ ...prev, isLoading: false }));
			}
		} catch (e) {
			console.error("[community] Failed to load bookshelf:", e);
			setBookshelfData((prev) => ({ ...prev, isLoading: false }));
		}
	};

	const handleToggleSavePost = async (postId: string) => {
		if (!currentUser) {
			setIsTermsMandatory(false);
			setIsTermsOpen(true);
			return;
		}

		const isCurrentlySaved = savedPostIds.includes(postId);
		const nextSaved = isCurrentlySaved
			? savedPostIds.filter((id) => id !== postId)
			: [...savedPostIds, postId];
		setSavedPostIds(nextSaved);

		try {
			const res = await fetch(`/api/community/user/${encodeURIComponent(currentUser.id)}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "save", postId }),
			});
			if (res.ok) {
				const data = (await res.json()) as { isSaved: boolean; savedPosts: string[] };
				if (Array.isArray(data.savedPosts)) {
					setSavedPostIds(data.savedPosts);
					setCurrentUser((prev) => (prev ? { ...prev, savedPosts: data.savedPosts } : null));
				}
			}
		} catch (e) {
			console.error("[community] Failed to toggle save post:", e);
			setSavedPostIds((prev) =>
				isCurrentlySaved ? [...prev, postId] : prev.filter((id) => id !== postId),
			);
		}
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
					if (userProfile?.savedPosts && Array.isArray(userProfile.savedPosts)) {
						setSavedPostIds(userProfile.savedPosts);
					} else {
						setSavedPostIds([]);
					}
				} else {
					setSavedPostIds([]);
				}

				// Only enforce mandatory terms modal on actual authenticated users whose profile hasn't accepted yet
				if (userProfile && !hasAcceptedLocal && !userProfile.hasAcceptedTerms) {
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

				// 5. Fetch real bookshelf data
				await loadBookshelfData(userProfile?.id);
			} catch (e) {
				console.error("[community] Failed to load data:", e);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();
	}, []);

	// Real-time polling for new posts & interactions from others every 5 seconds
	useEffect(() => {
		const pollPosts = async () => {
			try {
				const postsRes = await fetch("/api/community/posts");
				if (!postsRes.ok) return;
				const data = (await postsRes.json()) as { posts: CommunityPost[] };
				if (!Array.isArray(data.posts)) return;

				setPosts((currentPosts) => {
					if (currentPosts.length === 0) {
						return data.posts;
					}

					const existingIds = new Set(currentPosts.map((p) => p.id));
					const incomingNew = data.posts.filter((p) => !existingIds.has(p.id));

					if (incomingNew.length > 0) {
						// Filter posts authored by other users to show the popup notification
						const othersPosts = incomingNew.filter(
							(p) =>
								!currentUser ||
								(p.author.id !== currentUser.id && p.author.username !== currentUser.username),
						);

						if (othersPosts.length > 0) {
							setPendingNewPosts((prevPending) => {
								const prevIds = new Set(prevPending.map((p) => p.id));
								const brandNew = othersPosts.filter((p) => !prevIds.has(p.id));
								if (brandNew.length > 0) {
									return [...brandNew, ...prevPending];
								}
								return prevPending;
							});
						}

						// Prepend posts created by current user immediately
						const myOwnPosts = incomingNew.filter(
							(p) =>
								currentUser &&
								(p.author.id === currentUser.id || p.author.username === currentUser.username),
						);
						if (myOwnPosts.length > 0) {
							return [...myOwnPosts, ...currentPosts];
						}
					}

					// Update existing posts in-place for real-time likes, comments, edit, pin, and hide
					const freshMap = new Map(data.posts.map((p) => [p.id, p]));
					let hasChanges = false;
					const updated = currentPosts.map((p) => {
						const fresh = freshMap.get(p.id);
						if (!fresh) return p;
						if (
							fresh.likes?.length !== p.likes?.length ||
							fresh.comments?.length !== p.comments?.length ||
							fresh.isPinned !== p.isPinned ||
							fresh.isHidden !== p.isHidden ||
							fresh.title !== p.title ||
							fresh.content !== p.content
						) {
							hasChanges = true;
							return fresh;
						}
						return p;
					});

					return hasChanges ? updated : currentPosts;
				});
			} catch {
				// Silent background error
			}
		};

		const interval = setInterval(pollPosts, 5000);
		return () => clearInterval(interval);
	}, [currentUser]);

	const handleApplyNewPosts = () => {
		if (pendingNewPosts.length === 0) return;
		setPosts((prev) => {
			const existingIds = new Set(prev.map((p) => p.id));
			const toAdd = pendingNewPosts.filter((p) => !existingIds.has(p.id));
			return [...toAdd, ...prev];
		});
		setPendingNewPosts([]);
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	// Refresh bookshelf whenever activeNav switches to bookshelf or user logs in
	useEffect(() => {
		if (activeNav === "bookshelf") {
			loadBookshelfData(currentUser?.id);
		}
	}, [activeNav, currentUser?.id]);

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
			if (activeTab === "following") {
				const followingList = currentUser?.following || [];
				const isFollowingAuthor =
					followingList.includes(p.author.id) ||
					followingList.includes(p.author.username) ||
					p.author.id === "admin-aurabook" ||
					p.author.username === "@aurabook_admin";
				if (!isFollowingAuthor) return false;
			}
		}

		return true;
	});

	// 1. If user is logged out (guest), hide left & right sidebars completely!
	if (!currentUser && !viewProfileTarget && !focusedPostId) {
		return (
			<div className="w-full min-h-[calc(100vh-4rem)] bg-[#fafafc]">
				<CommunityTermsModal
					isOpen={isTermsOpen}
					mandatory={isTermsMandatory}
					onClose={() => setIsTermsOpen(false)}
					onAccept={handleAcceptTerms}
				/>
				<CommunityLoggedOutView
					posts={posts}
					onOpenTerms={() => {
						setIsTermsMandatory(false);
						setIsTermsOpen(true);
					}}
					onSelectPost={handleSelectPost}
					onRequireLogin={() => {
						setIsTermsMandatory(true);
						setIsTermsOpen(true);
					}}
				/>
			</div>
		);
	}

	// 2. If logged out but viewing a specific post or profile, render centered without sidebars!
	if (!currentUser && (viewProfileTarget || focusedPostId)) {
		return (
			<div className="w-full min-h-[calc(100vh-4rem)] bg-background">
				<CommunityTermsModal
					isOpen={isTermsOpen}
					mandatory={isTermsMandatory}
					onClose={() => setIsTermsOpen(false)}
					onAccept={handleAcceptTerms}
				/>
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
					<div className="flex items-center justify-between border-b border-border pb-4">
						<button
							type="button"
							onClick={handleExitProfileAndPost}
							className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Quay lại trang Cộng đồng Aurabook</span>
						</button>
						<Link
							href="/vi/channel-vnd/login"
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground"
						>
							Đăng nhập
						</Link>
					</div>

					{viewProfileTarget ? (
						<CommunityUserProfileView
							userIdOrUsername={viewProfileTarget}
							currentUser={currentUser}
							onBack={handleExitProfileAndPost}
							onEditProfile={async () => {}}
							savedPostIds={savedPostIds}
							onToggleSavePost={handleToggleSavePost}
							allPosts={posts}
							onViewOtherProfile={handleViewProfile}
							onPostUpdated={handlePostUpdated}
							onSelectPost={handleSelectPost}
						/>
					) : (
						(() => {
							const focusedPost = posts.find((p) => p.id === focusedPostId);
							if (!focusedPost) {
								return (
									<div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
										<BookOpen className="mx-auto h-9 w-9 text-muted-foreground/60" />
										<h3 className="font-semibold text-foreground text-[15px]">
											Không tìm thấy bài viết
										</h3>
										<Button
											variant="outline-solid"
											size="sm"
											onClick={handleExitProfileAndPost}
											className="rounded-xl text-[12px] font-semibold cursor-pointer"
										>
											← Quay lại Bảng tin
										</Button>
									</div>
								);
							}
							return (
								<CommunityPostCard
									post={focusedPost}
									currentUser={currentUser}
									isSaved={savedPostIds.includes(focusedPost.id)}
									onToggleSave={handleToggleSavePost}
									onViewAuthorProfile={handleViewProfile}
									onPostUpdated={handlePostUpdated}
									onToggleHidePost={handleToggleHidePost}
									initialOpenComments={true}
									onRequireLogin={() => {
										setIsTermsMandatory(true);
										setIsTermsOpen(true);
									}}
								/>
							);
						})()
					)}
				</div>
			</div>
		);
	}

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
								handleExitProfileAndPost();
								setActiveNav(nav);
								if (nav === "feed") setActiveTab("for-you");
							}}
							savedCount={savedPostIds.length}
							bookshelfCount={bookshelfData.books.length}
							currentUser={currentUser}
							onOpenProfile={() => setIsProfileOpen(true)}
							onViewSelfProfile={() => {
								if (currentUser) {
									handleViewProfile(currentUser.username || currentUser.id);
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
								if (q.trim()) {
									handleExitProfileAndPost();
									if (activeNav !== "feed") setActiveNav("feed");
								}
							}}
							onSearchSubmit={(q) => {
								setSearchQuery(q);
								handleExitProfileAndPost();
								setActiveNav("feed");
							}}
							onSelectNotification={(item) => {
								if (item.postId) {
									handleSelectPost(item.postId);
								} else if (item.sender?.username) {
									handleViewProfile(item.sender.username);
								}
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
								onBack={handleExitProfileAndPost}
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
								onViewOtherProfile={handleViewProfile}
								onPostUpdated={handlePostUpdated}
								onSelectPost={handleSelectPost}
							/>
						) : focusedPostId ? (
							(() => {
								const focusedPost = posts.find((p) => p.id === focusedPostId);
								if (isLoading) {
									return (
										<div className="space-y-4 animate-pulse">
											<div className="h-16 rounded-2xl bg-muted/40 border border-border" />
											<div className="h-64 rounded-2xl bg-muted/30 border border-border" />
										</div>
									);
								}
								if (!focusedPost) {
									return (
										<div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
											<BookOpen className="mx-auto h-9 w-9 text-muted-foreground/60" />
											<h3 className="font-semibold text-foreground text-[15px]">
												Không tìm thấy bài viết
											</h3>
											<p className="text-[13px] text-muted-foreground">
												Bài viết không tồn tại hoặc đã bị gỡ bỏ.
											</p>
											<Button
												variant="outline-solid"
												size="sm"
												onClick={handleExitProfileAndPost}
												className="rounded-xl text-[12px] font-semibold cursor-pointer"
											>
												← Quay lại Bảng tin
											</Button>
										</div>
									);
								}
								return (
									<div className="space-y-4 animate-in fade-in-0">
										<div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 flex items-center gap-3 shadow-2xs">
											<button
												type="button"
												onClick={handleExitProfileAndPost}
												className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 hover:border-border transition-colors cursor-pointer shrink-0"
												title="Quay lại Bảng tin cộng đồng"
												aria-label="Quay lại tất cả bài viết"
											>
												<ArrowLeft className="h-5 w-5" />
											</button>
											<div className="min-w-0 flex-1">
												<div className="text-[14.5px] font-bold text-foreground truncate">
													{focusedPost.title}
												</div>
												<div className="text-[12px] text-muted-foreground truncate">
													Đang xem bài viết chi tiết • {focusedPost.author.displayName} ({focusedPost.author.username})
												</div>
											</div>
										</div>

										<CommunityPostCard
											post={focusedPost}
											currentUser={currentUser}
											isSaved={savedPostIds.includes(focusedPost.id)}
											onToggleSave={handleToggleSavePost}
											onViewAuthorProfile={handleViewProfile}
											onPostUpdated={handlePostUpdated}
											onToggleHidePost={handleToggleHidePost}
											initialOpenComments={true}
											onRequireLogin={() => {
												if (!currentUser?.hasAcceptedTerms) {
													setIsTermsMandatory(true);
													setIsTermsOpen(true);
												}
											}}
										/>
									</div>
								);
							})()
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
							<div className="space-y-6">
								{/* Bookshelf Header */}
								<div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<div className="flex items-start sm:items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
											<Library className="h-5 w-5" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h2 className="text-[16px] font-semibold text-foreground">
													Tủ sách cá nhân của tôi
												</h2>
												<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
													{bookshelfData.books.length} tác phẩm
												</span>
											</div>
											<p className="text-[13px] text-muted-foreground mt-0.5">
												Chỉ hiển thị các quyển sách đã mua và đã được cấp phát quyền đọc điện tử (DRM)
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Link href="/products">
											<Button variant="outline-solid" size="sm" className="h-8 text-[12px] gap-1.5 font-medium">
												<ShoppingBag className="h-3.5 w-3.5" />
												Kho sách
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setActiveNav("feed")}
											className="h-8 text-[12px] font-medium"
										>
											Về bảng tin
										</Button>
									</div>
								</div>

								{/* Real Stats Bar */}
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									<div className="rounded-xl bg-card border border-border/80 p-3.5 shadow-2xs">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[12px] font-medium">Đang đọc</span>
											<BookOpen className="h-3.5 w-3.5 text-primary" />
										</div>
										<span className="text-xl font-bold text-foreground mt-1.5 block">
											{bookshelfData.stats.readingCount} <span className="text-[13px] font-normal text-muted-foreground">cuốn</span>
										</span>
									</div>
									<div className="rounded-xl bg-card border border-border/80 p-3.5 shadow-2xs">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[12px] font-medium">Đã đọc xong</span>
											<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										</div>
										<span className="text-xl font-bold text-foreground mt-1.5 block">
											{bookshelfData.stats.finishedCount} <span className="text-[13px] font-normal text-muted-foreground">cuốn</span>
										</span>
									</div>
									<div className="rounded-xl bg-card border border-border/80 p-3.5 shadow-2xs">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[12px] font-medium">Chưa bắt đầu</span>
											<Clock className="h-3.5 w-3.5 text-muted-foreground" />
										</div>
										<span className="text-xl font-bold text-foreground mt-1.5 block">
											{bookshelfData.stats.notStartedCount} <span className="text-[13px] font-normal text-muted-foreground">cuốn</span>
										</span>
									</div>
									<div className="rounded-xl bg-card border border-border/80 p-3.5 shadow-2xs">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[12px] font-medium">Tổng sách số</span>
											<Lock className="h-3.5 w-3.5 text-primary" />
										</div>
										<span className="text-xl font-bold text-foreground mt-1.5 block">
											{bookshelfData.stats.totalBooks} <span className="text-[13px] font-normal text-muted-foreground">bản quyền</span>
										</span>
									</div>
								</div>

								{/* Books Grid or Empty State */}
								{bookshelfData.isLoading ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{[1, 2].map((i) => (
											<div key={i} className="h-52 rounded-2xl bg-muted/40 animate-pulse border border-border" />
										))}
									</div>
								) : !currentUser ? (
									<div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
										<Lock className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
										<h3 className="font-semibold text-foreground text-[15px]">Vui lòng đăng nhập</h3>
										<p className="mt-1 text-[13px] text-muted-foreground max-w-sm mx-auto">
											Đăng nhập để xem danh sách các cuốn sách điện tử bạn đã mua và được cấp quyền đọc.
										</p>
										<Link href="/login" className="mt-4 inline-block">
											<Button size="sm" className="h-8 text-[13px] font-medium">
												Đăng nhập ngay
											</Button>
										</Link>
									</div>
								) : bookshelfData.books.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
										<BookMarked className="mx-auto h-9 w-9 text-muted-foreground/60 mb-2.5" />
										<h3 className="font-semibold text-foreground text-[15px]">Tủ sách chưa có ấn phẩm nào</h3>
										<p className="mt-1.5 text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
											Tủ sách chỉ hiển thị những quyển sách bạn đã mua và đã được cấp phát quyền đọc điện tử (DRM). Khi bạn hoàn tất mua sách điện tử hoặc audiobook, tác phẩm sẽ tự động xuất hiện tại đây.
										</p>
										<Link href="/products" className="mt-4 inline-block">
											<Button variant="outline-solid" size="sm" className="h-8 text-[13px] font-medium gap-1.5">
												<ShoppingBag className="h-3.5 w-3.5" />
												Khám phá kho sách điện tử
											</Button>
										</Link>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{bookshelfData.books.map((book) => (
											<div
												key={book.id}
												className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-xs"
											>
												<div className="flex gap-3.5">
													{/* Real Book Thumbnail */}
													<div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 shadow-2xs">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={book.thumbnail}
															alt={book.title}
															className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
															loading="lazy"
														/>
														<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
													</div>

													{/* Book Details */}
													<div className="min-w-0 flex-1 space-y-1">
														<div className="flex items-center gap-1.5 flex-wrap">
															<span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
																<CheckCircle2 className="h-2.5 w-2.5" />
																Đã cấp quyền đọc
															</span>
															<span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
																{book.format}
															</span>
														</div>

														<Link
															href={`/products/${book.productSlug}`}
															className="block font-semibold text-[14px] text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
														>
															{book.title}
														</Link>

														<p className="text-[12px] text-muted-foreground truncate">
															{book.categoryName} • Đơn #{book.orderNumber}
														</p>
													</div>
												</div>

												{/* Reading Progress */}
												<div className="mt-3.5 pt-3 border-t border-border/60 space-y-2">
													<div className="flex items-center justify-between text-[11px]">
														<span className="text-muted-foreground font-medium">Tiến độ đọc:</span>
														<span className="font-semibold text-foreground">
															{book.readingProgress.percent}% (Trang {book.readingProgress.currentPage}/{book.readingProgress.totalPages})
														</span>
													</div>
													<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
														<div
															className="h-full bg-primary transition-all duration-300 rounded-full"
															style={{ width: `${Math.max(book.readingProgress.percent, 3)}%` }}
														/>
													</div>
												</div>

												{/* Action Buttons */}
												<div className="mt-3 flex items-center gap-2">
													<Link href={`/products/${book.productSlug}`} className="flex-1">
														<Button
															size="sm"
															className="w-full h-8 text-[12px] font-medium gap-1.5"
														>
															<BookOpen className="h-3.5 w-3.5" />
															Đọc sách
														</Button>
													</Link>
													{book.orderNumber && book.orderNumber !== "DRM-LICENSED" && (
														<Link href={`/vi/channel-vnd/account/orders/${book.orderNumber}`}>
															<Button
																variant="outline-solid"
																size="sm"
																className="h-8 px-2.5 text-[12px] text-muted-foreground hover:text-foreground"
																title="Xem đơn hàng đã mua"
															>
																<ExternalLink className="h-3.5 w-3.5" />
															</Button>
														</Link>
													)}
												</div>
											</div>
										))}
									</div>
								)}
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
												onViewAuthorProfile={handleViewProfile}
												onPostUpdated={handlePostUpdated}
												onToggleHidePost={handleToggleHidePost}
												onSelectPost={handleSelectPost}
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
								{/* Create Post Box for authenticated users or Guest Landing for visitors */}
								{currentUser ? (
									!currentUser.isBlocked && (
										<CommunityCreatePost
											currentUser={currentUser}
											onPostCreated={handlePostCreated}
											onRequireTermsOrProfile={() => {
												if (!currentUser.hasAcceptedTerms) {
													setIsTermsMandatory(true);
													setIsTermsOpen(true);
												} else {
													setIsProfileOpen(true);
												}
											}}
										/>
									)
								) : (
									<CommunityGuestLanding
										onOpenTerms={() => {
											setIsTermsMandatory(false);
											setIsTermsOpen(true);
										}}
									/>
								)}

								{/* Feed Filter Tabs - Strictly "Cho bạn" and "Đang theo dõi" */}
								<div className="flex items-center justify-between gap-2 border-b border-border pb-3">
									<div className="flex items-center gap-2 overflow-x-auto pb-1">
										<button
											type="button"
											onClick={() => setActiveTab("for-you")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "for-you"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Cho bạn
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("following")}
											className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
												activeTab === "following"
													? "bg-foreground text-background shadow-xs"
													: "bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											Đang theo dõi
										</button>
									</div>
								</div>

								{/* Floating Realtime New Posts Popup Banner */}
								{pendingNewPosts.length > 0 && (
									<div className="sticky top-20 z-30 flex justify-center -my-1 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
										<button
											type="button"
											onClick={handleApplyNewPosts}
											className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-primary-foreground/20"
										>
											<ArrowUp className="h-3.5 w-3.5 animate-bounce" />
											<span>
												Có {pendingNewPosts.length} bài viết mới • Nhấn để xem
											</span>
										</button>
									</div>
								)}

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
										<h3 className="font-semibold text-foreground text-[15px]">
											{activeTab === "following"
												? "Chưa có bài viết từ người bạn đang theo dõi"
												: "Chưa có bài viết nào"}
										</h3>
										<p className="mt-1 text-[13px] text-muted-foreground">
											{searchQuery
												? "Không tìm thấy kết quả phù hợp với từ khóa."
												: activeTab === "following"
												? "Bạn chưa theo dõi ai hoặc những người bạn theo dõi chưa đăng bài viết nào. Hãy theo dõi các độc giả khác trong cộng đồng!"
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
												onViewAuthorProfile={handleViewProfile}
												onPostUpdated={handlePostUpdated}
												onToggleHidePost={handleToggleHidePost}
												onSelectPost={handleSelectPost}
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
								handleExitProfileAndPost();
								setSearchQuery(title);
								if (activeNav !== "feed") setActiveNav("feed");
							}}
							onSelectReader={(name) => {
								// Find username from topReaders
								const reader = sidebarData.topReaders.find((r) => r.name === name || r.username === name);
								if (reader) {
									handleViewProfile(reader.username);
								} else {
									handleExitProfileAndPost();
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
