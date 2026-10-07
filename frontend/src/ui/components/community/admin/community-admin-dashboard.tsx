"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	ShieldAlert,
	Users,
	FileText,
	ArrowLeft,
	Search,
	Trash2,
	Pin,
	Lock,
	Unlock,
	Mail,
	Phone,
	ShoppingBag,
	CreditCard,
	Calendar,
	CheckCircle,
	AlertTriangle,
	Eye,
	X,
	BookOpen,
	Star,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityUser, type CommunityPost } from "@/lib/community/types";

export function CommunityAdminDashboard() {
	const [activeTab, setActiveTab] = useState<"users" | "posts">("users");
	const [users, setUsers] = useState<CommunityUser[]>([]);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Selected user for Real Account Details modal
	const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);

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

	// Filters
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

	const filteredPosts = posts.filter((p) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			p.title.toLowerCase().includes(q) ||
			p.content.toLowerCase().includes(q) ||
			p.author.displayName.toLowerCase().includes(q) ||
			p.book?.title.toLowerCase().includes(q)
		);
	});

	const totalReviewsCount = posts.filter((p) => p.isFromProductReview).length;
	const blockedCount = users.filter((u) => u.isBlocked).length;

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
			{/* Top Bar Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<Link
							href="/community"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Quay lại Mạng xã hội
						</Link>
						<span className="text-muted-foreground">•</span>
						<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
							<ShieldAlert className="h-3.5 w-3.5" />
							Hệ thống Quản trị AuraBook
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Bảng điều khiển Quản trị Mạng xã hội & Người dùng
					</h1>
					<p className="text-xs text-muted-foreground">
						Kiểm duyệt bài viết, bảo vệ cộng đồng và truy xuất thông tin tài khoản thật từ hệ thống Saleor
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline-solid"
						onClick={loadData}
						disabled={isLoading}
						className="text-xs h-9"
					>
						{isLoading ? "Đang tải..." : "Làm mới dữ liệu"}
					</Button>
				</div>
			</div>

			{/* Metric KPI Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
				<div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Thành viên cộng đồng</span>
						<Users className="h-4 w-4 text-primary" />
					</div>
					<div className="mt-2 text-2xl font-bold text-foreground">{users.length}</div>
					<span className="text-[11px] text-muted-foreground">Đã đăng ký tài khoản</span>
				</div>

				<div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Tổng bài viết & Review</span>
						<FileText className="h-4 w-4 text-primary" />
					</div>
					<div className="mt-2 text-2xl font-bold text-foreground">{posts.length}</div>
					<span className="text-[11px] text-muted-foreground">{totalReviewsCount} bài từ trang sản phẩm</span>
				</div>

				<div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Tài khoản bị chặn</span>
						<AlertTriangle className="h-4 w-4 text-destructive" />
					</div>
					<div className="mt-2 text-2xl font-bold text-destructive">{blockedCount}</div>
					<span className="text-[11px] text-muted-foreground">Vi phạm quy tắc cộng đồng</span>
				</div>

				<div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Tương tác thảo luận</span>
						<CheckCircle className="h-4 w-4 text-success" />
					</div>
					<div className="mt-2 text-2xl font-bold text-foreground">
						{posts.reduce((acc, p) => acc + (p.likes?.length || 0) + (p.comments?.length || 0), 0)}
					</div>
					<span className="text-[11px] text-muted-foreground">Lượt thích & bình luận</span>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="space-y-6">
				{/* Tabs & Search */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setActiveTab("users");
								setSearchQuery("");
							}}
							className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
								activeTab === "users"
									? "bg-foreground text-background shadow-xs"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
						>
							<Users className="h-4 w-4" />
							Quản lý Người dùng & Dữ liệu thật ({users.length})
						</button>
						<button
							type="button"
							onClick={() => {
								setActiveTab("posts");
								setSearchQuery("");
							}}
							className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
								activeTab === "posts"
									? "bg-foreground text-background shadow-xs"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
						>
							<FileText className="h-4 w-4" />
							Kiểm duyệt Bài viết ({posts.length})
						</button>
					</div>

					<div className="relative sm:w-72">
						<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={
								activeTab === "users"
									? "Tìm theo tên, @tag, email thật..."
									: "Tìm theo tiêu đề, tác giả..."
							}
							className="h-9 pl-8 text-xs"
						/>
					</div>
				</div>

				{/* Tab 1: Users Management */}
				{activeTab === "users" && (
					<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="border-b border-border bg-muted/40 font-semibold text-foreground">
									<tr>
										<th className="py-3.5 px-4">Độc giả (Cộng đồng)</th>
										<th className="py-3.5 px-4">Tài khoản thật (Saleor ID)</th>
										<th className="py-3.5 px-4">Đơn hàng & Chi tiêu</th>
										<th className="py-3.5 px-4">Trạng thái</th>
										<th className="py-3.5 px-4 text-right">Hành động</th>
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
													<div className="flex items-center gap-3">
														<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
															<Image
																src={u.avatar}
																alt={u.displayName}
																fill
																sizes="36px"
																className="object-cover"
																unoptimized
															/>
														</div>
														<div>
															<div className="font-semibold text-foreground">
																{u.displayName}
															</div>
															<div className="text-[11px] text-muted-foreground">
																{u.username}
															</div>
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
															<Lock className="h-3 w-3" />
															Đã chặn
														</span>
													) : (
														<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
															<CheckCircle className="h-3 w-3" />
															Hoạt động
														</span>
													)}
												</td>
												<td
													className="py-3 px-4 text-right"
													onClick={(e) => e.stopPropagation()}
												>
													<div className="flex items-center justify-end gap-2">
														<Button
															type="button"
															variant="outline-solid"
															size="sm"
															onClick={() => setSelectedUser(u)}
															className="h-7 text-[11px] gap-1"
														>
															<Eye className="h-3 w-3" />
															Hồ sơ thật
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
																	<Unlock className="h-3 w-3" />
																	Mở chặn
																</>
															) : (
																<>
																	<Lock className="h-3 w-3" />
																	Chặn
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

				{/* Tab 2: Posts Moderation */}
				{activeTab === "posts" && (
					<div className="space-y-4">
						{filteredPosts.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
								Không có bài viết nào
							</div>
						) : (
							filteredPosts.map((post) => (
								<div
									key={post.id}
									className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
								>
									<div className="space-y-2 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-semibold text-sm text-foreground">
												{post.author.displayName}
											</span>
											<span className="text-xs text-muted-foreground">
												{post.author.username}
											</span>
											{post.isPinned && (
												<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
													<Pin className="h-3 w-3" />
													Đang ghim
												</span>
											)}
											{post.isFromProductReview && (
												<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
													Đánh giá PDP
												</span>
											)}
										</div>

										{post.book && (
											<div className="inline-flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1 text-xs">
												<BookOpen className="h-3.5 w-3.5 text-primary" />
												<span className="font-medium text-foreground">{post.book.title}</span>
												{post.book.rating && (
													<span className="flex items-center gap-0.5 text-amber-500 font-semibold">
														<Star className="h-3 w-3 fill-amber-500" />
														{post.book.rating}/5
													</span>
												)}
											</div>
										)}

										<h3 className="font-bold text-foreground text-sm">
											{post.title}
										</h3>
										<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
											{post.content}
										</p>

										<div className="text-[11px] text-muted-foreground pt-1">
											{post.likes?.length || 0} lượt thích • {post.comments?.length || 0} bình luận
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
										<Button
											type="button"
											variant="outline-solid"
											size="sm"
											onClick={() => handleTogglePin(post.id)}
											className="h-8 text-xs gap-1.5"
										>
											<Pin className="h-3.5 w-3.5" />
											{post.isPinned ? "Bỏ ghim" : "Ghim bài"}
										</Button>

										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => handleDeletePost(post.id)}
											className="h-8 text-xs gap-1.5"
										>
											<Trash2 className="h-3.5 w-3.5" />
											Xóa bài
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>

			{/* REAL ACCOUNT DETAILS MODAL (When clicking any user) */}
			{selectedUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
					<div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all sm:p-8 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
						{/* Close button */}
						<button
							type="button"
							onClick={() => setSelectedUser(null)}
							className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
							aria-label="Đóng"
						>
							<X className="h-5 w-5" />
						</button>

						{/* Modal Header */}
						<div className="border-b border-border pb-4">
							<div className="flex items-center gap-2">
								<ShieldAlert className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-bold tracking-tight text-foreground">
									Chi tiết Tài khoản Thật & Hoạt động
								</h2>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Dữ liệu định danh thực tế kết nối từ Saleor Core Database
							</p>
						</div>

						{/* Identity Link Comparison */}
						<div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Community Profile Side */}
							<div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
								<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Hồ sơ Mạng xã hội
								</span>
								<div className="flex items-center gap-3">
									<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
										<Image
											src={selectedUser.avatar}
											alt={selectedUser.displayName}
											fill
											sizes="48px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div>
										<div className="font-bold text-sm text-foreground">
											{selectedUser.displayName}
										</div>
										<div className="text-xs text-primary font-medium">
											{selectedUser.username}
										</div>
									</div>
								</div>
								{selectedUser.bio && (
									<p className="text-xs text-muted-foreground italic">
										&quot;{selectedUser.bio}&quot;
									</p>
								)}
								{selectedUser.favoriteGenre && (
									<div className="text-xs">
										<span className="text-muted-foreground">Gu đọc sách: </span>
										<span className="font-medium text-foreground">{selectedUser.favoriteGenre}</span>
									</div>
								)}
							</div>

							{/* Real Account Side */}
							<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
								<span className="text-[11px] font-bold uppercase tracking-wider text-primary">
									Tài khoản Thật (Xác thực)
								</span>
								<div className="space-y-2 text-xs">
									<div className="flex items-center gap-2 text-foreground font-semibold">
										<span>Họ tên:</span>
										<span>{selectedUser.realAccount?.fullName || "Chưa cung cấp"}</span>
									</div>
									<div className="flex items-center gap-2 text-muted-foreground">
										<Mail className="h-3.5 w-3.5 text-primary shrink-0" />
										<span className="truncate">{selectedUser.realAccount?.email}</span>
									</div>
									<div className="flex items-center gap-2 text-muted-foreground">
										<Phone className="h-3.5 w-3.5 text-primary shrink-0" />
										<span>{selectedUser.realAccount?.phone || "0912-345-678"}</span>
									</div>
									<div className="flex items-center gap-2 text-muted-foreground">
										<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
										<span>Ngày mở tài khoản: {selectedUser.realAccount?.registeredDate}</span>
									</div>
								</div>
							</div>
						</div>

						{/* E-Commerce Commerce History */}
						<div className="rounded-xl border border-border bg-card p-4 space-y-3">
							<span className="text-xs font-bold text-foreground">
								Lịch sử Đơn hàng & Chi tiêu tại AuraBook
							</span>
							<div className="grid grid-cols-2 gap-3 text-xs">
								<div className="rounded-lg bg-muted/40 p-3">
									<div className="flex items-center gap-2 text-muted-foreground">
										<ShoppingBag className="h-4 w-4 text-primary" />
										<span>Tổng đơn hàng</span>
									</div>
									<div className="mt-1 text-lg font-bold text-foreground">
										{selectedUser.realAccount?.ordersCount || 0} đơn
									</div>
								</div>

								<div className="rounded-lg bg-muted/40 p-3">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CreditCard className="h-4 w-4 text-primary" />
										<span>Tổng tiền đã mua</span>
									</div>
									<div className="mt-1 text-lg font-bold text-foreground">
										{selectedUser.realAccount?.totalSpent || "0 ₫"}
									</div>
								</div>
							</div>
						</div>

						{/* Status & Actions */}
						<div className="mt-6 flex items-center justify-between border-t border-border pt-4">
							<div className="text-xs">
								<span className="text-muted-foreground">Trạng thái hiện tại: </span>
								{selectedUser.isBlocked ? (
									<span className="font-semibold text-destructive">Đang bị khóa tài khoản</span>
								) : (
									<span className="font-semibold text-success">Đang hoạt động bình thường</span>
								)}
							</div>

							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="outline-solid"
									onClick={() => setSelectedUser(null)}
								>
									Đóng
								</Button>

								<Button
									type="button"
									variant={selectedUser.isBlocked ? "default" : "destructive"}
									onClick={() => handleToggleBlock(selectedUser.id)}
									className="gap-1.5"
								>
									{selectedUser.isBlocked ? (
										<>
											<Unlock className="h-4 w-4" />
											Mở khóa tài khoản
										</>
									) : (
										<>
											<Lock className="h-4 w-4" />
											Chặn người dùng này
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
