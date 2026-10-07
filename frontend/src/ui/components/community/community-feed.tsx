"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	BookOpen,
	Search,
	Sparkles,
	ShieldCheck,
	Settings2,
	CheckCircle2,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityPost, type CommunityUser } from "@/lib/community/types";
import { CommunityTermsModal } from "./community-terms-modal";
import { CommunityProfileModal } from "./community-profile-modal";
import { CommunityCreatePost } from "./community-create-post";
import { CommunityPostCard } from "./community-post-card";

export function CommunityFeed() {
	const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"all" | "reviews" | "posts" | "pinned">("all");

	// Modals
	const [isTermsOpen, setIsTermsOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	// Load user profile & posts
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			try {
				// 1. Fetch user profile
				const profileRes = await fetch("/api/community/profile");
				if (profileRes.ok) {
					const profileData = (await profileRes.json()) as { user: CommunityUser };
					setCurrentUser(profileData.user);
					// If user hasn't accepted terms, trigger terms modal
					if (!profileData.user.hasAcceptedTerms) {
						setIsTermsOpen(true);
					}
				}

				// 2. Fetch posts
				const postsRes = await fetch("/api/community/posts");
				if (postsRes.ok) {
					const postsData = (await postsRes.json()) as { posts: CommunityPost[] };
					setPosts(postsData.posts);
				}
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
		if (!currentUser) return;
		try {
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
				setIsTermsOpen(false);
				// Prompt to customize profile after accepting terms!
				setIsProfileOpen(true);
			}
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
	};

	// Add new post
	const handlePostCreated = (newPost: CommunityPost) => {
		setPosts((prev) => [newPost, ...prev]);
	};

	// Filter posts
	const filteredPosts = posts.filter((p) => {
		// Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			const matchTitle = p.title.toLowerCase().includes(q);
			const matchContent = p.content.toLowerCase().includes(q);
			const matchBook = p.book?.title.toLowerCase().includes(q);
			const matchAuthor = p.author.displayName.toLowerCase().includes(q);
			if (!matchTitle && !matchContent && !matchBook && !matchAuthor) return false;
		}

		// Tab filter
		if (activeTab === "reviews") return p.isFromProductReview || !!p.book;
		if (activeTab === "posts") return !p.isFromProductReview;
		if (activeTab === "pinned") return p.isPinned;
		return true;
	});

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
			{/* Terms & Conditions Modal */}
			<CommunityTermsModal
				isOpen={isTermsOpen}
				onAccept={handleAcceptTerms}
			/>

			{/* Profile Customization Modal */}
			<CommunityProfileModal
				isOpen={isProfileOpen}
				user={currentUser}
				onClose={() => setIsProfileOpen(false)}
				onSave={handleSaveProfile}
			/>

			{/* Top Hero Banner */}
			<div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-10 shadow-xs mb-8">
				<div className="relative z-10 max-w-2xl space-y-3">
					<div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
						<Sparkles className="h-3.5 w-3.5 text-primary" />
						<span>Mạng xã hội Độc giả AuraBook</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Không gian chia sẻ & kết nối những tâm hồn yêu sách
					</h1>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Nơi trao đổi cảm nhận văn học, review những tác phẩm yêu thích và khám phá góc nhìn chân thực từ cộng đồng người đọc đã mua sách.
					</p>
					<div className="flex flex-wrap items-center gap-3 pt-2">
						<Button
							type="button"
							onClick={() => {
								if (!currentUser?.hasAcceptedTerms) {
									setIsTermsOpen(true);
								} else {
									setIsProfileOpen(true);
								}
							}}
							variant="outline-solid"
							className="gap-2 text-xs"
						>
							<Settings2 className="h-3.5 w-3.5" />
							Tùy chỉnh hồ sơ của bạn
						</Button>
						<Link href="/community/admin">
							<Button
								variant="ghost"
								className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
							>
								<ShieldCheck className="h-3.5 w-3.5 text-primary" />
								Quản trị Cộng đồng (Admin)
							</Button>
						</Link>
					</div>
				</div>
			</div>

			{/* Main Grid: Feed (Left) & Sidebar (Right) */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Main Feed Column */}
				<main className="lg:col-span-8 space-y-6">
					{/* Create Post Card */}
					<CommunityCreatePost
						currentUser={currentUser}
						onPostCreated={handlePostCreated}
						onRequireTermsOrProfile={() => {
							if (!currentUser?.hasAcceptedTerms) setIsTermsOpen(true);
							else setIsProfileOpen(true);
						}}
					/>

					{/* Feed Filter & Search Bar */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-4">
						{/* Tabs */}
						<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
							<button
								type="button"
								onClick={() => setActiveTab("all")}
								className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
									activeTab === "all"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Tất cả ({posts.length})
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("reviews")}
								className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
									activeTab === "reviews"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Đánh giá sách
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("posts")}
								className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
									activeTab === "posts"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Thảo luận tự do
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("pinned")}
								className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
									activeTab === "pinned"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Được ghim
							</button>
						</div>

						{/* Search Input */}
						<div className="relative sm:w-64">
							<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Tìm bài viết, tên sách..."
								className="h-8 pl-8 text-xs"
							/>
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
							<BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
							<h3 className="font-semibold text-foreground">Không tìm thấy bài viết nào</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								Hãy là người đầu tiên chia sẻ cảm nhận hoặc mở rộng bộ lọc tìm kiếm!
							</p>
						</div>
					) : (
						<div className="space-y-5">
							{filteredPosts.map((post) => (
								<CommunityPostCard
									key={post.id}
									post={post}
									currentUser={currentUser}
									onRequireLogin={() => {
										if (!currentUser?.hasAcceptedTerms) setIsTermsOpen(true);
									}}
								/>
							))}
						</div>
					)}
				</main>

				{/* Right Sidebar */}
				<aside className="lg:col-span-4 space-y-6">
					{/* User Profile Mini-Card */}
					<div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
						<div className="flex items-center gap-3.5">
							<div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/20">
								<Image
									src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
									alt="User Avatar"
									fill
									sizes="56px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-bold text-sm text-foreground truncate">
									{currentUser?.displayName || "Độc giả AuraBook"}
								</h3>
								<p className="text-xs text-muted-foreground truncate">
									{currentUser?.username || "@docgia"}
								</p>
								<div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
									<CheckCircle2 className="h-3 w-3" />
									Độc giả xác thực
								</div>
							</div>
						</div>

						{currentUser?.bio && (
							<p className="mt-3.5 text-xs text-foreground/85 leading-relaxed italic border-l-2 border-primary/40 pl-3">
								&quot;{currentUser.bio}&quot;
							</p>
						)}

						{currentUser?.favoriteGenre && (
							<div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Thể loại yêu thích:</span>
								<span className="font-semibold text-foreground">{currentUser.favoriteGenre}</span>
							</div>
						)}

						<div className="mt-4 pt-3 border-t border-border">
							<Button
								type="button"
								variant="outline-solid"
								onClick={() => setIsProfileOpen(true)}
								className="w-full text-xs h-8 gap-1.5"
							>
								<Settings2 className="h-3.5 w-3.5" />
								Chỉnh sửa thông tin cá nhân
							</Button>
						</div>
					</div>

					{/* Community Rules Box */}
					<div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
						<div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
							<ShieldCheck className="h-4 w-4 text-primary" />
							<span>Quy ước cộng đồng</span>
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
							<li className="flex items-start gap-2">
								<span className="text-primary font-bold">•</span>
								<span>Mọi đánh giá sản phẩm trên cửa hàng được tự động đồng bộ vào bảng tin.</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-primary font-bold">•</span>
								<span>Mỗi thành viên chỉ được bấm Thích 1 lần duy nhất cho mỗi bài viết.</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-primary font-bold">•</span>
								<span>Giữ gìn không gian trao đổi tri thức văn minh và tích cực.</span>
							</li>
						</ul>
						<button
							type="button"
							onClick={() => setIsTermsOpen(true)}
							className="text-xs font-semibold text-primary hover:underline pt-1 block"
						>
							Xem lại toàn bộ điều khoản →
						</button>
					</div>

					{/* Admin Quick Jump */}
					<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
						<p className="text-xs font-medium text-foreground mb-2">
							Dành cho Quản trị viên & Kiểm duyệt viên
						</p>
						<Link href="/community/admin">
							<Button className="w-full text-xs h-8 gap-1.5">
								<ShieldCheck className="h-3.5 w-3.5" />
								Vào trang Quản trị Mạng xã hội
							</Button>
						</Link>
					</div>
				</aside>
			</div>
		</div>
	);
}
