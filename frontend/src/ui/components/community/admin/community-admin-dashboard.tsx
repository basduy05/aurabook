"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	ShieldAlert,
	Users,
	FileText,
	Search,
	Trash2,
	Pin,
	Lock,
	Unlock,
	Mail,
	Phone,
	CheckCircle2,
	AlertTriangle,
	Eye,
	X,
	BookOpen,
	Star,
	ExternalLink,
	RefreshCw,
	SlidersHorizontal,
	MessageSquare,
	Heart,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { type CommunityUser, type CommunityPost } from "@/lib/community/types";

type AdminTab = "posts" | "reviews" | "users" | "settings";

export function CommunityAdminDashboard() {
	const [activeTab, setActiveTab] = useState<AdminTab>("posts");
	const [users, setUsers] = useState<CommunityUser[]>([]);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [postFilter, setPostFilter] = useState<"all" | "pinned" | "with-book">("all");

	// Selected user for Real Account Details modal
	const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);

	// Community Settings state (Macaw UI configuration switches)
	const [settings, setSettings] = useState({
		requireTerms: true,
		verifiedBuyersOnly: true,
		autoApprovePosts: true,
		filterSensitiveWords: true,
	});

	// Load data
	const loadData = async () => {
		setIsLoading(true);
		try {
			const [usersRes, postsRes] = await Promise.all([
				fetch("/api/community/admin/users"),
				fetch("/api/community/posts"),
			]);

			if (usersRes.ok) {
				const usersData = (await usersRes.json()) as { users: CommunityUser[] };
				setUsers(usersData.users);
			}

			if (postsRes.ok) {
				const postsData = (await postsRes.json()) as { posts: CommunityPost[] };
				setPosts(postsData.posts);
			}
		} catch (e) {
			console.error("Failed to load admin data:", e);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	// Toggle user blocked
	const handleToggleBlock = async (userId: string) => {
		try {
			const res = await fetch("/api/community/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});
			if (res.ok) {
				setUsers((prev) =>
					prev.map((u) => (u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u)),
				);
				if (selectedUser && selectedUser.id === userId) {
					setSelectedUser((prev) => (prev ? { ...prev, isBlocked: !prev.isBlocked } : null));
				}
			}
		} catch (e) {
			console.error("Failed to toggle block:", e);
		}
	};

	// Delete post
	const handleDeletePost = async (postId: string) => {
		if (!confirm("Bạn có chắc chắn muốn xóa bài viết này khỏi cộng đồng?")) return;
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete", postId }),
			});
			if (res.ok) {
				setPosts((prev) => prev.filter((p) => p.id !== postId));
			}
		} catch (e) {
			console.error("Failed to delete post:", e);
		}
	};

	// Toggle pin post
	const handleTogglePin = async (postId: string) => {
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "pin", postId }),
			});
			if (res.ok) {
				setPosts((prev) =>
					prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p)),
				);
			}
		} catch (e) {
			console.error("Failed to toggle pin:", e);
		}
	};

	// Filtered collections
	const filteredUsers = users.filter((u) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			u.displayName.toLowerCase().includes(q) ||
			u.username.toLowerCase().includes(q) ||
			u.realAccount?.email.toLowerCase().includes(q) ||
			u.realAccount?.fullName.toLowerCase().includes(q)
		);
	});

	const reviewsPosts = posts.filter((p) => p.isFromProductReview || !!p.book);

	const filteredPosts = posts.filter((p) => {
		if (postFilter === "pinned" && !p.isPinned) return false;
		if (postFilter === "with-book" && !p.book) return false;

		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			p.title.toLowerCase().includes(q) ||
			p.content.toLowerCase().includes(q) ||
			p.author.displayName.toLowerCase().includes(q) ||
			p.book?.title.toLowerCase().includes(q)
		);
	});

	const totalReviewsCount = reviewsPosts.length;
	const blockedCount = users.filter((u) => u.isBlocked).length;

	return (
		<div className="w-full bg-background text-foreground pb-12">
			{/* Top Bar with Saleor Breadcrumb & System Status */}
			<header className="border-b border-border bg-card/60 backdrop-blur-xs px-4 sm:px-8 py-3.5">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="space-y-0.5">
						<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="hover:text-foreground">Bảng điều khiển</span>
							<span>/</span>
							<span className="hover:text-foreground">Ứng dụng Saleor</span>
							<span>/</span>
							<span className="font-semibold text-foreground">Quản trị Cộng đồng & Độc giả</span>
						</nav>
						<h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl flex items-center gap-2">
							<span>Cộng đồng & Đánh giá Sách</span>
							<span className="rounded-full bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5">
								Saleor App v1.0
							</span>
						</h1>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Link
							href="/vi/channel-vnd/community"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Xem trang cộng đồng</span>
						</Link>
						<Button
							type="button"
							variant="outline-solid"
							size="sm"
							onClick={loadData}
							disabled={isLoading}
							className="h-8 text-xs gap-1.5"
						>
							<RefreshCw strokeWidth={1.75} className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
							<span>{isLoading ? "Đang đồng bộ..." : "Đồng bộ"}</span>
						</Button>
					</div>
				</div>
			</header>

			{/* Main Workspace Area */}
			<div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
				{/* Macaw UI KPI Metric Cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Tổng bài thảo luận</span>
							<FileText strokeWidth={1.75} className="h-4 w-4 text-primary" />
						</div>
						<div className="mt-2 text-2xl font-bold text-foreground">{posts.length}</div>
						<span className="text-[11px] text-muted-foreground mt-0.5 block">Trên toàn mạng xã hội</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Đánh giá từ sản phẩm</span>
							<BookOpen strokeWidth={1.75} className="h-4 w-4 text-primary" />
						</div>
						<div className="mt-2 text-2xl font-bold text-foreground">{totalReviewsCount}</div>
						<span className="text-[11px] text-muted-foreground mt-0.5 block">Đồng bộ từ PDP Storefront</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Độc giả tham gia</span>
							<Users strokeWidth={1.75} className="h-4 w-4 text-primary" />
						</div>
						<div className="mt-2 text-2xl font-bold text-foreground">{users.length}</div>
						<span className="text-[11px] text-muted-foreground mt-0.5 block">100% tài khoản Saleor</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Tài khoản bị hạn chế</span>
							<AlertTriangle strokeWidth={1.75} className="h-4 w-4 text-destructive" />
						</div>
						<div className="mt-2 text-2xl font-bold text-destructive">{blockedCount}</div>
						<span className="text-[11px] text-muted-foreground mt-0.5 block">Vi phạm quy ước</span>
					</div>
				</div>

				{/* Navigation Tabs (Saleor Macaw UI style) */}
				<div className="border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-1 overflow-x-auto">
						<button
							type="button"
							onClick={() => {
								setActiveTab("posts");
								setSearchQuery("");
							}}
							className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
								activeTab === "posts"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<FileText strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Bài viết & Thảo luận ({posts.length})</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveTab("reviews");
								setSearchQuery("");
							}}
							className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
								activeTab === "reviews"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<BookOpen strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Đánh giá từ sản phẩm ({reviewsPosts.length})</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveTab("users");
								setSearchQuery("");
							}}
							className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
								activeTab === "users"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Users strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Quản lý Độc giả ({users.length})</span>
						</button>

						<button
							type="button"
							onClick={() => setActiveTab("settings")}
							className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
								activeTab === "settings"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<SlidersHorizontal strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Quy ước & Cấu hình</span>
						</button>
					</div>

					{/* Search input in tab bar */}
					{activeTab !== "settings" && (
						<div className="relative w-full sm:w-64 pb-2 sm:pb-0">
							<Search strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Tìm kiếm nội dung, tác giả..."
								className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
							/>
						</div>
					)}
				</div>

				{/* TAB 1: POSTS MODERATION */}
				{activeTab === "posts" && (
					<div className="space-y-4">
						{/* Sub-filters */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPostFilter("all")}
								className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
									postFilter === "all"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Tất cả ({posts.length})
							</button>
							<button
								type="button"
								onClick={() => setPostFilter("with-book")}
								className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
									postFilter === "with-book"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Có gắn sách ({reviewsPosts.length})
							</button>
							<button
								type="button"
								onClick={() => setPostFilter("pinned")}
								className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
									postFilter === "pinned"
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Đang ghim ({posts.filter((p) => p.isPinned).length})
							</button>
						</div>

						{/* Posts List (Threads-style moderation cards) */}
						{filteredPosts.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
								Không tìm thấy bài viết nào phù hợp với bộ lọc
							</div>
						) : (
							<div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
								{filteredPosts.map((post) => (
									<div key={post.id} className="p-4 sm:p-5 hover:bg-muted/20 transition-colors">
										<div className="flex items-start justify-between gap-4">
											<div className="flex items-start gap-3 min-w-0 flex-1">
												<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
													<Image
														src={post.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
														alt={post.author.displayName}
														fill
														sizes="36px"
														className="object-cover"
														unoptimized
													/>
												</div>
												<div className="space-y-1.5 min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-semibold text-xs text-foreground">
															{post.author.displayName}
														</span>
														<span className="text-[11px] text-muted-foreground">
															{post.author.username}
														</span>
														{post.author.isVerifiedBuyer && (
															<span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
																<CheckCircle2 strokeWidth={1.75} className="h-3 w-3" />
																Đã mua hàng
															</span>
														)}
														{post.isPinned && (
															<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
																<Pin strokeWidth={1.75} className="h-3 w-3" />
																Đã ghim
															</span>
														)}
														{post.isFromProductReview && (
															<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
																Đánh giá PDP
															</span>
														)}
													</div>

													<h3 className="font-semibold text-xs text-foreground">
														{post.title}
													</h3>
													<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
														{post.content}
													</p>

													{/* Attached Book with thumbnail, price and exact link */}
													{post.book && (
														<div className="mt-2.5 rounded-lg border border-border/80 bg-muted/20 p-2.5 flex items-center justify-between gap-3 max-w-lg">
															<div className="flex items-center gap-2.5 min-w-0">
																<div className="relative h-11 w-8 shrink-0 overflow-hidden rounded border border-border/80 bg-muted">
																	<Image
																		src={post.book.thumbnail || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80"}
																		alt={post.book.title}
																		fill
																		sizes="32px"
																		className="object-cover"
																		unoptimized
																	/>
																</div>
																<div className="min-w-0">
																	<div className="font-semibold text-xs text-foreground truncate">
																		{post.book.title}
																	</div>
																	{post.book.author && (
																		<div className="text-[11px] text-muted-foreground truncate">
																			{post.book.author}
																		</div>
																	)}
																	<div className="flex items-center gap-2 mt-0.5">
																		<span className="text-xs font-bold text-primary">
																			{post.book.price || "120.000 ₫"}
																		</span>
																		{post.book.rating && (
																			<span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-semibold">
																				<Star strokeWidth={1.75} className="h-3 w-3 fill-amber-400 text-amber-400" />
																				{post.book.rating}
																			</span>
																		)}
																	</div>
																</div>
															</div>

															<Link
																href={`/vi/channel-vnd/products/${post.book.slug}`}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
															>
																<span>Mở link</span>
																<ExternalLink strokeWidth={1.75} className="h-3 w-3" />
															</Link>
														</div>
													)}

													<div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
														<span className="flex items-center gap-1">
															<Heart strokeWidth={1.75} className="h-3 w-3 text-red-500" />
															{post.likes?.length || 0} lượt thích
														</span>
														<span className="flex items-center gap-1">
															<MessageSquare strokeWidth={1.75} className="h-3 w-3 text-primary" />
															{post.comments?.length || 0} bình luận
														</span>
													</div>
												</div>
											</div>

											{/* Moderation Actions */}
											<div className="flex items-center gap-1.5 shrink-0">
												<Button
													type="button"
													variant="outline-solid"
													size="sm"
													onClick={() => handleTogglePin(post.id)}
													className="h-7 text-[11px] gap-1"
												>
													<Pin strokeWidth={1.75} className="h-3 w-3" />
													<span>{post.isPinned ? "Bỏ ghim" : "Ghim"}</span>
												</Button>
												<Button
													type="button"
													variant="destructive"
													size="sm"
													onClick={() => handleDeletePost(post.id)}
													className="h-7 text-[11px] gap-1"
												>
													<Trash2 strokeWidth={1.75} className="h-3 w-3" />
													<span>Xóa</span>
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* TAB 2: REVIEWS MODERATION */}
				{activeTab === "reviews" && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								Danh sách đánh giá được đồng bộ tự động từ trang chi tiết sản phẩm sách (PDP)
							</p>
							<span className="text-xs font-semibold text-foreground">{reviewsPosts.length} đánh giá</span>
						</div>

						{reviewsPosts.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
								Chưa có đánh giá nào từ sản phẩm
							</div>
						) : (
							<div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
								{reviewsPosts.map((rev) => (
									<div key={rev.id} className="p-4 sm:p-5 hover:bg-muted/20 transition-colors">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-2 flex-1">
												<div className="flex items-center gap-2">
													<div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border">
														<Image
															src={rev.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
															alt={rev.author.displayName}
															fill
															sizes="28px"
															className="object-cover"
															unoptimized
														/>
													</div>
													<span className="font-semibold text-xs text-foreground">{rev.author.displayName}</span>
													<span className="text-[11px] text-muted-foreground">{rev.author.username}</span>
													<span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
														<CheckCircle2 strokeWidth={1.75} className="h-3 w-3" />
														Khách đã mua
													</span>
												</div>

												{rev.book && (
													<div className="inline-flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/20 px-3 py-1.5 text-xs">
														<div className="relative h-8 w-6 shrink-0 overflow-hidden rounded border border-border/80">
															<Image
																src={rev.book.thumbnail || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80"}
																alt={rev.book.title}
																fill
																sizes="24px"
																className="object-cover"
																unoptimized
															/>
														</div>
														<div className="space-y-0.5">
															<div className="font-semibold text-foreground flex items-center gap-2">
																<span>{rev.book.title}</span>
																<span className="text-primary font-bold">{rev.book.price}</span>
															</div>
															{rev.book.rating && (
																<div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
																	<Star strokeWidth={1.75} className="h-3 w-3 fill-amber-400 text-amber-400" />
																	<span>{rev.book.rating}/5 sao</span>
																</div>
															)}
														</div>
														<Link
															href={`/vi/channel-vnd/products/${rev.book.slug}`}
															target="_blank"
															rel="noopener noreferrer"
															className="ml-auto text-primary hover:underline font-semibold text-[11px] flex items-center gap-1"
														>
															<span>Xem sách</span>
															<ExternalLink strokeWidth={1.75} className="h-3 w-3" />
														</Link>
													</div>
												)}

												<p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
													{rev.content}
												</p>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												<Button
													type="button"
													variant="outline-solid"
													size="sm"
													onClick={() => handleTogglePin(rev.id)}
													className="h-7 text-[11px] gap-1"
												>
													<Pin strokeWidth={1.75} className="h-3 w-3" />
													<span>{rev.isPinned ? "Bỏ ghim" : "Ghim"}</span>
												</Button>
												<Button
													type="button"
													variant="destructive"
													size="sm"
													onClick={() => handleDeletePost(rev.id)}
													className="h-7 text-[11px] gap-1"
												>
													<Trash2 strokeWidth={1.75} className="h-3 w-3" />
													<span>Gỡ bài</span>
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* TAB 3: USERS & REAL SALEOR ACCOUNT DATA */}
				{activeTab === "users" && (
					<div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="border-b border-border bg-muted/40 font-semibold text-foreground">
									<tr>
										<th className="py-3 px-4">Độc giả (Mạng xã hội)</th>
										<th className="py-3 px-4">Tài khoản thật Saleor</th>
										<th className="py-3 px-4">Đơn hàng & Chi tiêu</th>
										<th className="py-3 px-4">Trạng thái</th>
										<th className="py-3 px-4 text-right">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{filteredUsers.length === 0 ? (
										<tr>
											<td colSpan={5} className="py-8 text-center text-muted-foreground">
												Không tìm thấy thành viên nào phù hợp
											</td>
										</tr>
									) : (
										filteredUsers.map((u) => (
											<tr
												key={u.id}
												className="hover:bg-muted/30 transition-colors cursor-pointer"
												onClick={() => setSelectedUser(u)}
											>
												<td className="py-3 px-4">
													<div className="flex items-center gap-2.5">
														<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
															<Image
																src={u.avatar}
																alt={u.displayName}
																fill
																sizes="32px"
																className="object-cover"
																unoptimized
															/>
														</div>
														<div>
															<div className="font-semibold text-foreground">{u.displayName}</div>
															<div className="text-[11px] text-muted-foreground">{u.username}</div>
														</div>
													</div>
												</td>
												<td className="py-3 px-4">
													<div className="space-y-0.5">
														<div className="font-medium text-foreground">
															{u.realAccount?.fullName || "Chưa cập nhật"}
														</div>
														<div className="text-[11px] text-muted-foreground">
															{u.realAccount?.email}
														</div>
													</div>
												</td>
												<td className="py-3 px-4">
													<div className="space-y-0.5">
														<div className="font-semibold text-foreground">
															{u.realAccount?.totalSpent || "0 ₫"}
														</div>
														<div className="text-[11px] text-muted-foreground">
															{u.realAccount?.ordersCount || 0} đơn hàng
														</div>
													</div>
												</td>
												<td className="py-3 px-4">
													{u.isBlocked ? (
														<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
															<Lock strokeWidth={1.75} className="h-3 w-3" />
															Đã khóa
														</span>
													) : (
														<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
															<CheckCircle2 strokeWidth={1.75} className="h-3 w-3" />
															Hoạt động
														</span>
													)}
												</td>
												<td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center justify-end gap-1.5">
														<Button
															type="button"
															variant="outline-solid"
															size="sm"
															onClick={() => setSelectedUser(u)}
															className="h-7 text-[11px] gap-1"
														>
															<Eye strokeWidth={1.75} className="h-3 w-3" />
															<span>Hồ sơ thật</span>
														</Button>
														<Button
															type="button"
															variant={u.isBlocked ? "default" : "outline-solid"}
															size="sm"
															onClick={() => handleToggleBlock(u.id)}
															className={`h-7 text-[11px] gap-1 ${
																u.isBlocked
																	? "bg-success text-success-foreground hover:bg-success/90"
																	: "text-destructive border-destructive/30 hover:bg-destructive/10"
															}`}
														>
															{u.isBlocked ? (
																<>
																	<Unlock strokeWidth={1.75} className="h-3 w-3" />
																	<span>Mở khóa</span>
																</>
															) : (
																<>
																	<Lock strokeWidth={1.75} className="h-3 w-3" />
																	<span>Khóa</span>
																</>
															)}
														</Button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 4: SETTINGS & POLICIES (Macaw UI Form Cards) */}
				{activeTab === "settings" && (
					<div className="space-y-4 max-w-3xl">
						<div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
							<div className="border-b border-border pb-3">
								<h2 className="text-sm font-bold text-foreground">Quy ước & Kiểm soát Độc giả</h2>
								<p className="text-xs text-muted-foreground mt-0.5">
									Cấu hình điều kiện gia nhập và quyền đăng bài trong mạng xã hội
								</p>
							</div>

							<div className="space-y-4 divide-y divide-border">
								<div className="flex items-center justify-between pt-2">
									<div className="space-y-0.5 pr-4">
										<div className="text-xs font-semibold text-foreground">
											Yêu cầu chấp nhận Điều khoản khi mới vào
										</div>
										<p className="text-[11px] text-muted-foreground">
											Bắt buộc hiển thị popup cam kết quy ước cộng đồng trước khi cho phép xem và tham gia.
										</p>
									</div>
									<button
										type="button"
										onClick={() => setSettings((s) => ({ ...s, requireTerms: !s.requireTerms }))}
										className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
											settings.requireTerms ? "bg-primary" : "bg-muted"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-xs transform transition-transform ${
												settings.requireTerms ? "translate-x-4" : "translate-x-0"
											}`}
										/>
									</button>
								</div>

								<div className="flex items-center justify-between pt-4">
									<div className="space-y-0.5 pr-4">
										<div className="text-xs font-semibold text-foreground">
											Chỉ cho phép người đã mua sách đánh giá
										</div>
										<p className="text-[11px] text-muted-foreground">
											Khách hàng phải có đơn hàng đã hoàn thành (Fulfillment) cho sản phẩm tương ứng mới được viết review.
										</p>
									</div>
									<button
										type="button"
										onClick={() =>
											setSettings((s) => ({ ...s, verifiedBuyersOnly: !s.verifiedBuyersOnly }))
										}
										className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
											settings.verifiedBuyersOnly ? "bg-primary" : "bg-muted"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-xs transform transition-transform ${
												settings.verifiedBuyersOnly ? "translate-x-4" : "translate-x-0"
											}`}
										/>
									</button>
								</div>

								<div className="flex items-center justify-between pt-4">
									<div className="space-y-0.5 pr-4">
										<div className="text-xs font-semibold text-foreground">
											Tự động duyệt bài viết mới
										</div>
										<p className="text-[11px] text-muted-foreground">
											Bài viết và thảo luận sẽ hiển thị ngay lên Bảng tin sau khi gửi.
										</p>
									</div>
									<button
										type="button"
										onClick={() =>
											setSettings((s) => ({ ...s, autoApprovePosts: !s.autoApprovePosts }))
										}
										className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
											settings.autoApprovePosts ? "bg-primary" : "bg-muted"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-xs transform transition-transform ${
												settings.autoApprovePosts ? "translate-x-4" : "translate-x-0"
											}`}
										/>
									</button>
								</div>

								<div className="flex items-center justify-between pt-4">
									<div className="space-y-0.5 pr-4">
										<div className="text-xs font-semibold text-foreground">
											Bộ lọc chống spam & từ khóa nhạy cảm
										</div>
										<p className="text-[11px] text-muted-foreground">
											Tự động gắn cờ các bài viết chứa liên kết lạ hoặc ngôn từ không chuẩn mực.
										</p>
									</div>
									<button
										type="button"
										onClick={() =>
											setSettings((s) => ({
												...s,
												filterSensitiveWords: !s.filterSensitiveWords,
											}))
										}
										className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
											settings.filterSensitiveWords ? "bg-primary" : "bg-muted"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-xs transform transition-transform ${
												settings.filterSensitiveWords ? "translate-x-4" : "translate-x-0"
											}`}
										/>
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* REAL SALEOR ACCOUNT DETAILS MODAL */}
			{selectedUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
					<div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
						{/* Close button */}
						<button
							type="button"
							onClick={() => setSelectedUser(null)}
							className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
							aria-label="Đóng"
						>
							<X strokeWidth={1.75} className="h-4 w-4" />
						</button>

						{/* Modal Header */}
						<div className="border-b border-border pb-3.5">
							<div className="flex items-center gap-2">
								<ShieldAlert strokeWidth={1.75} className="h-4 w-4 text-primary" />
								<h2 className="text-base font-bold text-foreground">
									Hồ sơ Khách hàng & Dữ liệu Thật Saleor
								</h2>
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Thông tin định danh và lịch sử mua sắm kết nối từ Saleor Core GraphQL
							</p>
						</div>

						{/* Side-by-side identity details */}
						<div className="my-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
							{/* Community Identity */}
							<div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5">
								<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Hồ sơ Mạng xã hội
								</span>
								<div className="flex items-center gap-2.5">
									<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
										<Image
											src={selectedUser.avatar}
											alt={selectedUser.displayName}
											fill
											sizes="40px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="min-w-0">
										<div className="font-semibold text-xs text-foreground truncate">
											{selectedUser.displayName}
										</div>
										<div className="text-[11px] text-muted-foreground truncate">
											{selectedUser.username}
										</div>
									</div>
								</div>
								<div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/60">
									<div>
										Trạng thái điều khoản:{" "}
										<span className="font-semibold text-success">
											{selectedUser.hasAcceptedTerms ? "Đã đồng ý" : "Chưa xác nhận"}
										</span>
									</div>
									<div>
										Xác minh khách hàng:{" "}
										<span className="font-semibold text-primary">
											{(selectedUser.realAccount?.ordersCount || 0) > 0 ? "Đã mua sách" : "Chưa mua"}
										</span>
									</div>
								</div>
							</div>

							{/* Real Saleor Customer */}
							<div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5">
								<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Khách hàng Saleor Thật
								</span>
								<div className="space-y-1.5 text-xs">
									<div className="font-semibold text-foreground">
										{selectedUser.realAccount?.fullName || "Chưa có họ tên"}
									</div>
									<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
										<Mail strokeWidth={1.75} className="h-3 w-3 shrink-0" />
										<span className="truncate">{selectedUser.realAccount?.email}</span>
									</div>
									<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
										<Phone strokeWidth={1.75} className="h-3 w-3 shrink-0" />
										<span>{selectedUser.realAccount?.phone || "Chưa có SĐT"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Commercial metrics */}
						<div className="grid grid-cols-3 gap-3 my-4">
							<div className="rounded-lg bg-muted/40 p-3 border border-border text-center">
								<span className="text-[10px] text-muted-foreground block font-medium">Tổng chi tiêu</span>
								<span className="text-sm font-bold text-foreground mt-0.5 block">
									{selectedUser.realAccount?.totalSpent || "0 ₫"}
								</span>
							</div>
							<div className="rounded-lg bg-muted/40 p-3 border border-border text-center">
								<span className="text-[10px] text-muted-foreground block font-medium">Đơn hàng</span>
								<span className="text-sm font-bold text-foreground mt-0.5 block">
									{selectedUser.realAccount?.ordersCount || 0} đơn
								</span>
							</div>
							<div className="rounded-lg bg-muted/40 p-3 border border-border text-center">
								<span className="text-[10px] text-muted-foreground block font-medium">Trạng thái</span>
								<span
									className={`text-sm font-bold mt-0.5 block ${
										selectedUser.isBlocked ? "text-destructive" : "text-success"
									}`}
								>
									{selectedUser.isBlocked ? "Bị khóa" : "Bình thường"}
								</span>
							</div>
						</div>

						{/* Actions inside modal */}
						<div className="mt-5 pt-3.5 border-t border-border flex items-center justify-end gap-2">
							<Button
								type="button"
								variant="outline-solid"
								size="sm"
								onClick={() => setSelectedUser(null)}
								className="text-xs h-8"
							>
								Đóng
							</Button>
							<Button
								type="button"
								variant={selectedUser.isBlocked ? "default" : "destructive"}
								size="sm"
								onClick={() => handleToggleBlock(selectedUser.id)}
								className="text-xs h-8 gap-1.5"
							>
								{selectedUser.isBlocked ? (
									<>
										<Unlock strokeWidth={1.75} className="h-3.5 w-3.5" />
										<span>Mở khóa tài khoản</span>
									</>
								) : (
									<>
										<Lock strokeWidth={1.75} className="h-3.5 w-3.5" />
										<span>Khóa khỏi cộng đồng</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
