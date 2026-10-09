"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
	Eye,
	EyeOff,
	Edit3,
	History,
	X,
	BookOpen,
	ExternalLink,
	RefreshCw,
	SlidersHorizontal,
	MessageSquare,
	Heart,
	Send,
	Megaphone,
	ShieldCheck,
	Check,
	Plus,
	ArrowLeft,
	Sparkles,
	LogOut,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Badge } from "@/ui/components/ui/badge";
import { type CommunityUser, type CommunityPost } from "@/lib/community/types";
import { CommunityPostEditModal, PostHistoryModal } from "../community-post-edit-modal";

type MainTab = "management" | "communications";
type ManagementSubTab = "posts" | "users" | "settings";

export function CommunityAdminDashboard() {
	const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
	const [adminUser, setAdminUser] = useState<{ id: string; email: string; fullName: string; isStaff: boolean } | null>(null);

	// Navigation Tabs
	const [mainTab, setMainTab] = useState<MainTab>("management");
	const [mgmtSubTab, setMgmtSubTab] = useState<ManagementSubTab>("posts");

	// Communications State
	const [isCreatingCommPost, setIsCreatingCommPost] = useState(false);
	const [adminPostTitle, setAdminPostTitle] = useState("");
	const [adminPostCategory, setAdminPostCategory] = useState("Thông báo");
	const [adminPostContent, setAdminPostContent] = useState("");
	const [adminPostPinned, setAdminPostPinned] = useState(true);
	const [isSubmittingAdminPost, setIsSubmittingAdminPost] = useState(false);
	const [postSuccessMessage, setPostSuccessMessage] = useState("");

	// Data Collections
	const [users, setUsers] = useState<CommunityUser[]>([]);
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [postFilter, setPostFilter] = useState<"all" | "reviews" | "pinned" | "hidden">("all");
	const [commSearchQuery, setCommSearchQuery] = useState("");

	// Selected user for Real Account Details modal
	const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);

	// Modals for post moderation
	const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
	const [historyPost, setHistoryPost] = useState<CommunityPost | null>(null);
	const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);
	const [isSavingSettings, setIsSavingSettings] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Explicit login state when unauthenticated
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// Community Settings state (Macaw UI configuration switches)
	const [settings, setSettings] = useState({
		requireTerms: true,
		verifiedBuyersOnly: true,
		autoApprovePosts: true,
		filterSensitiveWords: true,
	});

	// Load data with authorization guard
	const loadData = async () => {
		setIsLoading(true);
		try {
			// Check access (reads isolated admin cookie or iframe referrer)
			const isIframe = typeof window !== "undefined" && window.self !== window.top;
			const checkUrl = isIframe
				? "/api/community/admin/check-access?from=dashboard"
				: "/api/community/admin/check-access";

			const authRes = await fetch(checkUrl);
			const authData = (await authRes.json()) as { authorized?: boolean; user?: any };

			if (authData.authorized) {
				setAuthStatus("authorized");
				setAdminUser(authData.user || { id: "admin-aurabook", email: "admin@aurabook.vn", fullName: "Quản trị viên Aurabook", isStaff: true });
			} else {
				setAuthStatus("unauthorized");
				setIsLoading(false);
				return;
			}

			const [usersRes, postsRes, settingsRes] = await Promise.all([
				fetch("/api/community/admin/users"),
				fetch("/api/community/admin/posts"),
				fetch("/api/community/admin/settings"),
			]);

			if (usersRes.ok) {
				const usersData = (await usersRes.json()) as { users: CommunityUser[] };
				setUsers(usersData.users || []);
			}

			if (postsRes.ok) {
				const postsData = (await postsRes.json()) as { posts: CommunityPost[] };
				setPosts(postsData.posts || []);
			}

			if (settingsRes?.ok) {
				const settingsData = (await settingsRes.json()) as { settings: typeof settings };
				if (settingsData.settings) {
					setSettings(settingsData.settings);
				}
			}
		} catch (error) {
			console.error("[community-admin] Load data error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setMounted(true);
		void loadData();
	}, []);

	// Handle Admin Login submission
	const handleAdminLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoggingIn(true);
		setLoginError("");
		try {
			const res = await fetch("/api/community/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: loginEmail, password: loginPassword }),
			});
			const data = (await res.json()) as { ok?: boolean; error?: string; user?: any };
			if (!res.ok || !data.ok) {
				setLoginError(data.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
				return;
			}
			setAuthStatus("authorized");
			setAdminUser(data.user);
			void loadData();
		} catch (err) {
			setLoginError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
		} finally {
			setIsLoggingIn(false);
		}
	};

	// Handle Admin Logout
	const handleAdminLogout = async () => {
		try {
			await fetch("/api/community/admin/logout", { method: "POST" });
		} catch (e) {
			console.error("Admin logout error:", e);
		}
		setAuthStatus("unauthorized");
		setAdminUser(null);
	};

	// Handle Toggle Block User
	const handleToggleBlock = async (userId: string) => {
		try {
			const res = await fetch("/api/community/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "toggle_block", userId }),
			});
			if (res.ok) {
				const data = (await res.json()) as { ok: boolean; isBlocked: boolean };
				setUsers((prev) =>
					prev.map((u) => (u.id === userId ? { ...u, isBlocked: data.isBlocked } : u)),
				);
				if (selectedUser?.id === userId) {
					setSelectedUser((prev) => (prev ? { ...prev, isBlocked: data.isBlocked } : null));
				}
			}
		} catch (e) {
			console.error("Failed to toggle block:", e);
		}
	};

	// Handle Delete Post
	const handleDeletePost = async (postId: string) => {
		if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này khỏi hệ thống?")) return;
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

	// Handle Toggle Pin
	const handleTogglePin = async (postId: string) => {
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "pin", postId }),
			});
			if (res.ok) {
				const data = (await res.json()) as { ok: boolean; isPinned: boolean };
				setPosts((prev) =>
					prev.map((p) => (p.id === postId ? { ...p, isPinned: data.isPinned } : p)),
				);
			}
		} catch (e) {
			console.error("Failed to toggle pin:", e);
		}
	};

	// Handle Toggle Hide
	const handleToggleHide = async (postId: string) => {
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "hide", postId }),
			});
			if (res.ok) {
				const data = (await res.json()) as { ok: boolean; isHidden: boolean };
				setPosts((prev) =>
					prev.map((p) => (p.id === postId ? { ...p, isHidden: data.isHidden } : p)),
				);
			}
		} catch (e) {
			console.error("Failed to toggle hide:", e);
		}
	};

	// Save Edited Post
	const handleSaveAdminEdit = async (postId: string, newTitle: string, newContent: string) => {
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "edit", postId, title: newTitle, content: newContent }),
			});
			if (res.ok) {
				const data = (await res.json()) as { ok: boolean; post: CommunityPost };
				if (data.post) {
					setPosts((prev) => prev.map((p) => (p.id === data.post.id ? data.post : p)));
				}
				setEditingPost(null);
			}
		} catch (e) {
			console.error("Failed to edit post:", e);
		}
	};

	// Save Settings
	const handleSaveSettings = async (newSettings?: typeof settings) => {
		const toSave = newSettings || settings;
		setIsSavingSettings(true);
		try {
			const res = await fetch("/api/community/admin/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(toSave),
			});
			if (res.ok) {
				setSettingsSavedAlert(true);
				setTimeout(() => setSettingsSavedAlert(false), 3000);
			}
		} catch (e) {
			console.error("Failed to save settings:", e);
		} finally {
			setIsSavingSettings(false);
		}
	};

	// Handle Create Admin Announcement Post (Saleor 2-Column Create View)
	const handleCreateAdminPost = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!adminPostTitle.trim() || !adminPostContent.trim()) {
			alert("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.");
			return;
		}
		setIsSubmittingAdminPost(true);
		setPostSuccessMessage("");
		try {
			const res = await fetch("/api/community/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create_admin_post",
					title: adminPostTitle.trim(),
					content: adminPostContent.trim(),
					category: adminPostCategory,
					isPinned: adminPostPinned,
				}),
			});
			if (res.ok) {
				const data = (await res.json()) as { post?: CommunityPost };
				if (data.post) {
					setPosts((prev) => [data.post!, ...prev]);
				}
				setAdminPostTitle("");
				setAdminPostContent("");
				setIsCreatingCommPost(false); // Return to list view smoothly
				setPostSuccessMessage("Thông báo truyền thông đã được phát hành thành công lên toàn hệ thống!");
				setTimeout(() => setPostSuccessMessage(""), 5000);
			} else {
				const err = (await res.json()) as { error?: string };
				alert(err.error || "Không thể đăng bài viết của quản trị viên.");
			}
		} catch (error) {
			console.error("Error creating admin post:", error);
			alert("Đã xảy ra lỗi khi phát hành bài viết.");
		} finally {
			setIsSubmittingAdminPost(false);
		}
	};

	// Filtered Collections
	const filteredUsers = users.filter((u) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			u.displayName.toLowerCase().includes(q) ||
			u.username.toLowerCase().includes(q) ||
			u.realAccount?.email?.toLowerCase().includes(q) ||
			u.realAccount?.fullName?.toLowerCase().includes(q)
		);
	});

	const filteredPosts = posts.filter((p) => {
		if (postFilter === "reviews" && !p.isFromProductReview && !p.book) return false;
		if (postFilter === "pinned" && !p.isPinned) return false;
		if (postFilter === "hidden" && !p.isHidden) return false;

		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			p.title.toLowerCase().includes(q) ||
			p.content.toLowerCase().includes(q) ||
			p.author.displayName.toLowerCase().includes(q) ||
			p.book?.title?.toLowerCase().includes(q)
		);
	});

	// Communications Posts (Posts created by Admin or Announcements)
	const communicationPosts = posts.filter((p) => {
		const isComm =
			p.author.username === "@aurabook_admin" ||
			p.author.id === "user-1" ||
			p.title.startsWith("[") ||
			p.isPinned;
		if (!isComm) return false;
		if (!commSearchQuery.trim()) return true;
		const q = commSearchQuery.toLowerCase();
		return (
			p.title.toLowerCase().includes(q) ||
			p.content.toLowerCase().includes(q) ||
			p.author.displayName.toLowerCase().includes(q)
		);
	});

	const totalReviewsCount = posts.filter((p) => p.isFromProductReview || !!p.book).length;

	// Loading or Checking State
	if (authStatus === "checking" || (isLoading && posts.length === 0 && authStatus === "authorized")) {
		return (
			<div className="flex min-h-[500px] w-full flex-col items-center justify-center gap-3 bg-background p-8 text-center text-foreground">
				<RefreshCw className="h-8 w-8 animate-spin text-primary" />
				<div className="space-y-1">
					<p className="text-sm font-semibold">Đang kiểm tra quyền Quản trị viên Aurabook...</p>
					<p className="text-xs text-muted-foreground">Kết nối Saleor Core & Dữ liệu Quản trị</p>
				</div>
			</div>
		);
	}

	// Unauthorized / Need Login State
	if (authStatus === "unauthorized") {
		return (
			<div className="flex min-h-[500px] w-full flex-col items-center justify-center bg-background px-4 py-12 text-foreground font-sans">
				<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
					<div className="text-center space-y-2">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/60 p-2 shadow-2xs">
							<Image
								src="/android-chrome-192x192.png"
								alt="Aurabook"
								width={40}
								height={40}
								className="h-10 w-10 rounded-xl object-contain"
								unoptimized
							/>
						</div>
						<h2 className="text-lg font-bold tracking-tight text-foreground">
							Cổng Quản Trị Aurabook
						</h2>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Khu vực dành riêng cho Nhân viên quản trị hệ thống (Staff Account).
						</p>
					</div>

					{loginError && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
							<ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
							<span>{loginError}</span>
						</div>
					)}

					<form onSubmit={handleAdminLogin} className="space-y-4">
						<div className="space-y-1.5 text-left">
							<label className="text-xs font-semibold text-foreground">Email Quản Trị</label>
							<Input
								type="email"
								placeholder="admin@example.com"
								value={loginEmail}
								onChange={(e) => setLoginEmail(e.target.value)}
								required
								className="h-9 text-xs"
							/>
						</div>
						<div className="space-y-1.5 text-left">
							<label className="text-xs font-semibold text-foreground">Mật Khẩu</label>
							<Input
								type="password"
								placeholder="••••••••"
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
								required
								className="h-9 text-xs"
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoggingIn}
							className="w-full h-9 text-xs font-semibold gap-2"
						>
							{isLoggingIn ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin" />
									<span>Đang xác thực...</span>
								</>
							) : (
								<>
									<Lock className="h-3.5 w-3.5" />
									<span>Đăng Nhập Quản Trị</span>
								</>
							)}
						</Button>
					</form>

					<div className="border-t border-border pt-4 text-center">
						<p className="text-[11px] text-muted-foreground">
							Mẹo: Khi mở trong Saleor Dashboard (localhost:9000), hệ thống tự động liên kết phiên làm việc an toàn.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-background text-foreground pb-12 font-sans">
			{/* Top Bar with Saleor Breadcrumb & System Status */}
			<header className="border-b border-border bg-card px-4 sm:px-8 py-3.5 shadow-2xs">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="space-y-1">
						<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
							<span className="hover:text-foreground">Bảng điều khiển</span>
							<span>/</span>
							<span className="hover:text-foreground">Ứng dụng Saleor</span>
							<span>/</span>
							<span className="font-semibold text-foreground">Quản trị Cộng đồng & Độc giả</span>
							{adminUser && (
								<>
									<span>•</span>
									<span className="text-primary font-medium">{adminUser.fullName || adminUser.email} (Staff)</span>
								</>
							)}
						</nav>
						<div className="flex items-center gap-3">
							<Image
								src="/android-chrome-192x192.png"
								alt="Aurabook"
								width={24}
								height={24}
								className="h-6 w-6 rounded-md object-contain"
								unoptimized
							/>
							<div className="flex items-center gap-2">
								<h1 className="text-sm font-bold tracking-tight text-foreground">
									Trung Tâm Quản Trị Cộng Đồng Aurabook
								</h1>
								<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
									Saleor App
								</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
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
						<Button
							type="button"
							variant="outline-solid"
							size="sm"
							onClick={handleAdminLogout}
							className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
						>
							<LogOut strokeWidth={1.75} className="h-3.5 w-3.5" />
							<span>Đăng xuất</span>
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
						<span className="text-[11px] text-muted-foreground mt-0.5 block">Tài khoản Saleor Core</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Thông báo phát hành</span>
							<Megaphone strokeWidth={1.75} className="h-4 w-4 text-primary" />
						</div>
						<div className="mt-2 text-2xl font-bold text-foreground">{communicationPosts.length}</div>
						<span className="text-[11px] text-muted-foreground mt-0.5 block">Từ Ban Quản Trị</span>
					</div>
				</div>

				{/* 2 Primary Navigation Tabs: Quản lý (Management) & Truyền thông (Communications) */}
				<div className="border-b border-border flex items-center gap-2">
					<button
						type="button"
						onClick={() => {
							setMainTab("management");
							setIsCreatingCommPost(false);
							setSearchQuery("");
						}}
						className={`border-b-2 px-5 py-3 text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
							mainTab === "management"
								? "border-primary text-primary bg-primary/5 rounded-t-lg"
								: "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
						}`}
					>
						<ShieldCheck strokeWidth={1.75} className="h-4 w-4" />
						<span>Tab Quản lý (Kiểm duyệt & Độc giả)</span>
					</button>

					<button
						type="button"
						onClick={() => {
							setMainTab("communications");
							setSearchQuery("");
						}}
						className={`border-b-2 px-5 py-3 text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
							mainTab === "communications"
								? "border-primary text-primary bg-primary/5 rounded-t-lg"
								: "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
						}`}
					>
						<Megaphone strokeWidth={1.75} className="h-4 w-4" />
						<span>Tab Truyền thông (Đăng bài & Thông báo)</span>
						{communicationPosts.length > 0 && (
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
								{communicationPosts.length}
							</Badge>
						)}
					</button>
				</div>

				{/* ============================================================== */}
				{/* TAB 1: QUẢN LÝ (MANAGEMENT)                                      */}
				{/* ============================================================== */}
				{mainTab === "management" && (
					<div className="space-y-6">
						{/* Sub-navigation inside Management */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									variant={mgmtSubTab === "posts" ? "default" : "outline-solid"}
									size="sm"
									onClick={() => setMgmtSubTab("posts")}
									className="text-xs h-8 gap-1.5"
								>
									<FileText strokeWidth={1.75} className="h-3.5 w-3.5" />
									<span>Kiểm duyệt Bài viết & Đánh giá ({posts.length})</span>
								</Button>
								<Button
									type="button"
									variant={mgmtSubTab === "users" ? "default" : "outline-solid"}
									size="sm"
									onClick={() => setMgmtSubTab("users")}
									className="text-xs h-8 gap-1.5"
								>
									<Users strokeWidth={1.75} className="h-3.5 w-3.5" />
									<span>Độc giả & Tài khoản Saleor ({users.length})</span>
								</Button>
								<Button
									type="button"
									variant={mgmtSubTab === "settings" ? "default" : "outline-solid"}
									size="sm"
									onClick={() => setMgmtSubTab("settings")}
									className="text-xs h-8 gap-1.5"
								>
									<SlidersHorizontal strokeWidth={1.75} className="h-3.5 w-3.5" />
									<span>Quy tắc Kiểm duyệt</span>
								</Button>
							</div>

							{/* Search input for Posts or Users */}
							{mgmtSubTab !== "settings" && (
								<div className="relative w-full sm:w-72">
									<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										type="text"
										placeholder={
											mgmtSubTab === "posts"
												? "Tìm theo tiêu đề, tác giả, sách..."
												: "Tìm độc giả, email, tên thật..."
										}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-8 pl-8 text-xs bg-background"
									/>
									{searchQuery && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
										>
											<X className="h-3 w-3" />
										</button>
									)}
								</div>
							)}
						</div>

						{/* SUB-VIEW: KIỂM DUYỆT BÀI VIẾT (POSTS & REVIEWS) */}
						{mgmtSubTab === "posts" && (
							<div className="space-y-4">
								{/* Filter Pills & Create Action */}
								<div className="flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
										<Button
											type="button"
											variant={postFilter === "all" ? "default" : "outline-solid"}
											size="sm"
											onClick={() => setPostFilter("all")}
											className="h-7 text-xs"
										>
											Tất cả ({posts.length})
										</Button>
										<Button
											type="button"
											variant={postFilter === "reviews" ? "default" : "outline-solid"}
											size="sm"
											onClick={() => setPostFilter("reviews")}
											className="h-7 text-xs gap-1"
										>
											<BookOpen className="h-3 w-3" />
											<span>Đánh giá từ PDP ({totalReviewsCount})</span>
										</Button>
										<Button
											type="button"
											variant={postFilter === "pinned" ? "default" : "outline-solid"}
											size="sm"
											onClick={() => setPostFilter("pinned")}
											className="h-7 text-xs gap-1"
										>
											<Pin className="h-3 w-3" />
											<span>Đã ghim ({posts.filter((p) => p.isPinned).length})</span>
										</Button>
										<Button
											type="button"
											variant={postFilter === "hidden" ? "default" : "outline-solid"}
											size="sm"
											onClick={() => setPostFilter("hidden")}
											className="h-7 text-xs gap-1"
										>
											<EyeOff className="h-3 w-3" />
											<span>Đang ẩn ({posts.filter((p) => p.isHidden).length})</span>
										</Button>
									</div>

									<Button
										type="button"
										size="sm"
										onClick={() => {
											setMainTab("communications");
											setIsCreatingCommPost(true);
										}}
										className="h-7 text-xs gap-1 font-semibold"
									>
										<Plus className="h-3.5 w-3.5" />
										<span>Đăng bài Quản trị viên</span>
									</Button>
								</div>

								{/* Macaw UI Table of Posts */}
								<div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
									<div className="overflow-x-auto">
										<table className="w-full text-left text-xs">
											<thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
												<tr>
													<th className="py-3 px-4">Bài viết & Nội dung</th>
													<th className="py-3 px-4">Tác giả</th>
													<th className="py-3 px-4">Sản phẩm / Nguồn</th>
													<th className="py-3 px-4 text-center">Tương tác</th>
													<th className="py-3 px-4 text-center">Trạng thái</th>
													<th className="py-3 px-4 text-right">Thao tác</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border/60">
												{filteredPosts.length === 0 ? (
													<tr>
														<td colSpan={6} className="py-12 text-center text-muted-foreground">
															Không tìm thấy bài viết hoặc đánh giá nào phù hợp với bộ lọc.
														</td>
													</tr>
												) : (
													filteredPosts.map((post) => (
														<tr key={post.id} className="hover:bg-muted/20 transition-colors">
															<td className="py-3 px-4 max-w-sm">
																<div className="font-semibold text-foreground line-clamp-1 flex items-center gap-1.5">
																	{post.isPinned && (
																		<Pin className="h-3 w-3 text-primary shrink-0" />
																	)}
																	<span>{post.title}</span>
																</div>
																<p className="text-muted-foreground text-[11px] line-clamp-2 mt-0.5">
																	{post.content}
																</p>
																<div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
																	<span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
																	{post.editHistory && post.editHistory.length > 0 && (
																		<span className="text-primary font-medium">
																			• Đã sửa ({post.editHistory.length} lần)
																		</span>
																	)}
																</div>
															</td>

															<td className="py-3 px-4">
																<div className="flex items-center gap-2">
																	<div className="relative h-7 w-7 rounded-full overflow-hidden border border-border shrink-0">
																		<Image
																			src={post.author.avatar || "/android-chrome-192x192.png"}
																			alt={post.author.displayName}
																			fill
																			sizes="28px"
																			className="object-cover"
																			unoptimized
																		/>
																	</div>
																	<div className="min-w-0">
																		<div className="font-medium text-foreground truncate max-w-[120px]">
																			{post.author.displayName}
																		</div>
																		<div className="text-[10px] text-muted-foreground truncate">
																			{post.author.username}
																		</div>
																	</div>
																</div>
															</td>

															<td className="py-3 px-4">
																{post.book ? (
																	<div className="flex items-center gap-1.5">
																		<BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
																		<span className="font-medium text-foreground truncate max-w-[150px]">
																			{post.book.title}
																		</span>
																	</div>
																) : (
																	<Badge variant="outline-solid" className="text-[10px] font-normal">
																		Mạng xã hội
																	</Badge>
																)}
															</td>

															<td className="py-3 px-4 text-center">
																<div className="inline-flex items-center gap-3 text-[11px] text-muted-foreground">
																	<span className="flex items-center gap-1">
																		<Heart className="h-3 w-3 text-destructive" />
																		<span>{post.likes?.length || 0}</span>
																	</span>
																	<span className="flex items-center gap-1">
																		<MessageSquare className="h-3 w-3 text-primary" />
																		<span>{post.comments?.length || 0}</span>
																	</span>
																</div>
															</td>

															<td className="py-3 px-4 text-center">
																{post.isHidden ? (
																	<Badge variant="destructive" className="text-[10px]">
																		Đang ẩn
																	</Badge>
																) : (
																	<Badge variant="outline-solid" className="text-[10px] text-success border-success/30">
																		Hiển thị
																	</Badge>
																)}
															</td>

															<td className="py-3 px-4 text-right">
																<div className="inline-flex items-center gap-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title={post.isPinned ? "Bỏ ghim" : "Ghim bài"}
																		onClick={() => handleTogglePin(post.id)}
																		className="h-7 w-7 p-0"
																	>
																		<Pin className={`h-3.5 w-3.5 ${post.isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title={post.isHidden ? "Bỏ ẩn bài viết" : "Ẩn bài viết"}
																		onClick={() => handleToggleHide(post.id)}
																		className="h-7 w-7 p-0"
																	>
																		{post.isHidden ? (
																			<Eye className="h-3.5 w-3.5 text-success" />
																		) : (
																			<EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
																		)}
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title="Sửa nội dung"
																		onClick={() => setEditingPost(post)}
																		className="h-7 w-7 p-0"
																	>
																		<Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
																	</Button>
																	{post.editHistory && post.editHistory.length > 0 && (
																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			title="Xem lịch sử chỉnh sửa"
																			onClick={() => setHistoryPost(post)}
																			className="h-7 w-7 p-0"
																		>
																			<History className="h-3.5 w-3.5 text-primary" />
																		</Button>
																	)}
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title="Xóa bài viết"
																		onClick={() => handleDeletePost(post.id)}
																		className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
																	>
																		<Trash2 className="h-3.5 w-3.5" />
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
							</div>
						)}

						{/* SUB-VIEW: QUẢN LÝ ĐỘC GIẢ (SALEOR USERS) */}
						{mgmtSubTab === "users" && (
							<div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
											<tr>
												<th className="py-3 px-4">Hồ sơ Độc giả</th>
												<th className="py-3 px-4">Tài khoản Saleor Thật</th>
												<th className="py-3 px-4 text-center">Đơn hàng</th>
												<th className="py-3 px-4 text-center">Tổng chi tiêu</th>
												<th className="py-3 px-4 text-center">Trạng thái</th>
												<th className="py-3 px-4 text-right">Hành động</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/60">
											{filteredUsers.length === 0 ? (
												<tr>
													<td colSpan={6} className="py-12 text-center text-muted-foreground">
														Không tìm thấy tài khoản độc giả nào.
													</td>
												</tr>
											) : (
												filteredUsers.map((user) => (
													<tr key={user.id} className="hover:bg-muted/20 transition-colors">
														<td className="py-3 px-4">
															<div className="flex items-center gap-2.5">
																<div className="relative h-9 w-9 rounded-full overflow-hidden border border-border shrink-0">
																	<Image
																		src={user.avatar}
																		alt={user.displayName}
																		fill
																		sizes="36px"
																		className="object-cover"
																		unoptimized
																	/>
																</div>
																<div>
																	<div className="font-semibold text-foreground">
																		{user.displayName}
																	</div>
																	<div className="text-[11px] text-muted-foreground">
																		{user.username}
																	</div>
																</div>
															</div>
														</td>

														<td className="py-3 px-4">
															<div className="space-y-0.5">
																<div className="font-medium text-foreground">
																	{user.realAccount?.fullName || "Chưa cập nhật"}
																</div>
																<div className="text-[11px] text-muted-foreground flex items-center gap-1">
																	<Mail className="h-3 w-3" />
																	<span>{user.realAccount?.email}</span>
																</div>
															</div>
														</td>

														<td className="py-3 px-4 text-center font-medium">
															{user.realAccount?.ordersCount || 0} đơn
														</td>

														<td className="py-3 px-4 text-center font-bold text-foreground">
															{user.realAccount?.totalSpent || "0 ₫"}
														</td>

														<td className="py-3 px-4 text-center">
															{user.isBlocked ? (
																<Badge variant="destructive" className="text-[10px]">
																	Bị khóa
																</Badge>
															) : (
																<Badge variant="outline-solid" className="text-[10px] text-success border-success/30">
																	Hoạt động
																</Badge>
															)}
														</td>

														<td className="py-3 px-4 text-right">
															<div className="inline-flex items-center gap-1.5">
																<Button
																	type="button"
																	variant="outline-solid"
																	size="sm"
																	onClick={() => setSelectedUser(user)}
																	className="h-7 text-[11px]"
																>
																	Chi tiết
																</Button>
																<Button
																	type="button"
																	variant={user.isBlocked ? "default" : "destructive"}
																	size="sm"
																	onClick={() => handleToggleBlock(user.id)}
																	className="h-7 text-[11px] gap-1"
																>
																	{user.isBlocked ? (
																		<>
																			<Unlock className="h-3 w-3" />
																			<span>Mở khóa</span>
																		</>
																	) : (
																		<>
																			<Lock className="h-3 w-3" />
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

						{/* SUB-VIEW: CẤU HÌNH KIỂM DUYỆT (GOVERNANCE SETTINGS) */}
						{mgmtSubTab === "settings" && (
							<div className="max-w-2xl rounded-xl border border-border bg-card p-6 space-y-6 shadow-2xs">
								<div className="space-y-1">
									<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
										<SlidersHorizontal className="h-4 w-4 text-primary" />
										<span>Quy chuẩn & Chính sách Cộng đồng</span>
									</h2>
									<p className="text-xs text-muted-foreground">
										Thiết lập điều kiện kiểm duyệt tự động cho bài thảo luận và đánh giá sách của độc giả.
									</p>
								</div>

								{settingsSavedAlert && (
									<div className="rounded-lg bg-success/10 border border-success/20 p-3 text-xs text-success font-medium flex items-center gap-2 animate-in fade-in">
										<Check className="h-4 w-4" />
										<span>Cấu hình chính sách kiểm duyệt đã được lưu thành công.</span>
									</div>
								)}

								<div className="space-y-4 divide-y divide-border/60">
									<div className="flex items-center justify-between pt-3">
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-foreground">
												Tự động phê duyệt bài viết mới
											</div>
											<div className="text-[11px] text-muted-foreground">
												Bài viết của độc giả sẽ xuất hiện ngay lập tức mà không cần quản trị viên duyệt trước.
											</div>
										</div>
										<input
											type="checkbox"
											checked={settings.autoApprovePosts}
											onChange={(e) => {
												const updated = { ...settings, autoApprovePosts: e.target.checked };
												setSettings(updated);
												void handleSaveSettings(updated);
											}}
											className="h-4 w-4 rounded accent-primary cursor-pointer"
										/>
									</div>

									<div className="flex items-center justify-between pt-3">
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-foreground">
												Chỉ người đã mua sách mới được đánh giá (Verified Buyer)
											</div>
											<div className="text-[11px] text-muted-foreground">
												Đối chiếu đơn hàng thực tế từ Saleor trước khi cho phép độc giả gửi đánh giá sao.
											</div>
										</div>
										<input
											type="checkbox"
											checked={settings.verifiedBuyersOnly}
											onChange={(e) => {
												const updated = { ...settings, verifiedBuyersOnly: e.target.checked };
												setSettings(updated);
												void handleSaveSettings(updated);
											}}
											className="h-4 w-4 rounded accent-primary cursor-pointer"
										/>
									</div>

									<div className="flex items-center justify-between pt-3">
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-foreground">
												Lọc tự động từ ngữ nhạy cảm & spam
											</div>
											<div className="text-[11px] text-muted-foreground">
												Tự động ẩn hoặc gắn cờ cảnh báo các bình luận chứa ngôn từ vi phạm quy ước.
											</div>
										</div>
										<input
											type="checkbox"
											checked={settings.filterSensitiveWords}
											onChange={(e) => {
												const updated = { ...settings, filterSensitiveWords: e.target.checked };
												setSettings(updated);
												void handleSaveSettings(updated);
											}}
											className="h-4 w-4 rounded accent-primary cursor-pointer"
										/>
									</div>

									<div className="flex items-center justify-between pt-3">
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-foreground">
												Yêu cầu đồng ý Điều khoản văn hóa đọc
											</div>
											<div className="text-[11px] text-muted-foreground">
												Độc giả phải xác nhận thỏa thuận cộng đồng trước khi đăng bài lần đầu tiên.
											</div>
										</div>
										<input
											type="checkbox"
											checked={settings.requireTerms}
											onChange={(e) => {
												const updated = { ...settings, requireTerms: e.target.checked };
												setSettings(updated);
												void handleSaveSettings(updated);
											}}
											className="h-4 w-4 rounded accent-primary cursor-pointer"
										/>
									</div>
								</div>

								<div className="pt-2">
									<Button
										type="button"
										onClick={() => void handleSaveSettings()}
										disabled={isSavingSettings}
										size="sm"
										className="text-xs font-semibold"
									>
										{isSavingSettings ? "Đang lưu..." : "Lưu thay đổi"}
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* ============================================================== */}
				{/* TAB 2: TRUYỀN THÔNG (COMMUNICATIONS - CHUẨN SALEOR DASHBOARD)    */}
				{/* ============================================================== */}
				{mainTab === "communications" && (
					<div className="space-y-6">
						{/* Success alert message */}
						{postSuccessMessage && (
							<div className="rounded-xl bg-success/10 border border-success/30 p-3.5 text-xs text-success font-medium flex items-center gap-2 animate-in fade-in">
								<CheckCircle2 className="h-4 w-4 shrink-0" />
								<span>{postSuccessMessage}</span>
							</div>
						)}

						{/* CHẾ ĐỘ 1: XEM DANH SÁCH THÔNG BÁO (LIST VIEW) */}
						{!isCreatingCommPost && (
							<div className="space-y-4">
								{/* Saleor Standard List Header */}
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-2xs">
									<div className="space-y-0.5">
										<div className="flex items-center gap-2">
											<h2 className="text-sm font-bold text-foreground">
												Quản Lý Thông Báo & Truyền Thông
											</h2>
											<Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
												{communicationPosts.length} bài
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											Toàn bộ các thông điệp, tin tức và sự kiện do Ban Quản Trị phát hành đến độc giả.
										</p>
									</div>

									<div className="flex items-center gap-2">
										<div className="relative w-full sm:w-64">
											<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
											<Input
												type="text"
												placeholder="Tìm kiếm thông báo..."
												value={commSearchQuery}
												onChange={(e) => setCommSearchQuery(e.target.value)}
												className="h-8 pl-8 text-xs bg-background"
											/>
											{commSearchQuery && (
												<button
													type="button"
													onClick={() => setCommSearchQuery("")}
													className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
												>
													<X className="h-3 w-3" />
												</button>
											)}
										</div>

										<Button
											type="button"
											onClick={() => setIsCreatingCommPost(true)}
											size="sm"
											className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs shrink-0"
										>
											<Plus className="h-3.5 w-3.5" />
											<span>Tạo thông báo mới</span>
										</Button>
									</div>
								</div>

								{/* Macaw UI Table of Communications */}
								<div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
									<div className="overflow-x-auto">
										<table className="w-full text-left text-xs">
											<thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
												<tr>
													<th className="py-3 px-4">Tiêu đề thông báo</th>
													<th className="py-3 px-4">Người phát hành</th>
													<th className="py-3 px-4 text-center">Ghim</th>
													<th className="py-3 px-4 text-center">Tương tác</th>
													<th className="py-3 px-4 text-center">Ngày đăng</th>
													<th className="py-3 px-4 text-right">Thao tác</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border/60">
												{communicationPosts.length === 0 ? (
													<tr>
														<td colSpan={6} className="py-16 text-center text-muted-foreground space-y-2">
															<Megaphone className="h-8 w-8 mx-auto text-muted-foreground/40" />
															<div className="text-sm font-semibold text-foreground">
																Chưa có thông báo truyền thông nào
															</div>
															<p className="text-xs text-muted-foreground">
																Nhấp vào nút &ldquo;Tạo thông báo mới&rdquo; ở góc trên để phát hành tin tức đầu tiên.
															</p>
														</td>
													</tr>
												) : (
													communicationPosts.map((post) => (
														<tr key={post.id} className="hover:bg-muted/20 transition-colors">
															<td className="py-3.5 px-4 max-w-md">
																<div className="font-semibold text-foreground line-clamp-1 flex items-center gap-1.5">
																	{post.isPinned && (
																		<Badge variant="default" title="Đã ghim" className="text-[9px] py-0 px-1 h-4 shrink-0">
																			<Pin className="h-2.5 w-2.5 fill-current" />
																		</Badge>
																	)}
																	<span>{post.title}</span>
																</div>
																<p className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5">
																	{post.content}
																</p>
															</td>

															<td className="py-3.5 px-4">
																<div className="flex items-center gap-2">
																	<div className="relative h-6 w-6 rounded-md overflow-hidden border border-border shrink-0">
																		<Image
																			src="/android-chrome-192x192.png"
																			alt="Admin"
																			fill
																			sizes="24px"
																			className="object-contain"
																			unoptimized
																		/>
																	</div>
																	<span className="font-medium text-foreground">
																		{post.author.displayName}
																	</span>
																</div>
															</td>

															<td className="py-3.5 px-4 text-center">
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => handleTogglePin(post.id)}
																	className="h-7 w-7 p-0"
																	title={post.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
																>
																	<Pin className={`h-3.5 w-3.5 ${post.isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
																</Button>
															</td>

															<td className="py-3.5 px-4 text-center">
																<div className="inline-flex items-center gap-2.5 text-[11px] text-muted-foreground">
																	<span className="flex items-center gap-1">
																		<Heart className="h-3 w-3 text-destructive" />
																		<span>{post.likes?.length || 0}</span>
																	</span>
																	<span className="flex items-center gap-1">
																		<MessageSquare className="h-3 w-3 text-primary" />
																		<span>{post.comments?.length || 0}</span>
																	</span>
																</div>
															</td>

															<td className="py-3.5 px-4 text-center text-muted-foreground text-[11px]">
																{new Date(post.createdAt).toLocaleDateString("vi-VN")}
															</td>

															<td className="py-3.5 px-4 text-right">
																<div className="inline-flex items-center gap-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title="Chỉnh sửa bài viết"
																		onClick={() => setEditingPost(post)}
																		className="h-7 w-7 p-0"
																	>
																		<Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		title="Xóa thông báo"
																		onClick={() => handleDeletePost(post.id)}
																		className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
																	>
																		<Trash2 className="h-3.5 w-3.5" />
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
							</div>
						)}

						{/* CHẾ ĐỘ 2: SOẠN THẢO 2-CỘT CHUẨN SALEOR DASHBOARD (CREATE VIEW) */}
						{isCreatingCommPost && (
							<div className="space-y-6 animate-in fade-in-0 duration-200">
								{/* Top Action Bar chuẩn Saleor */}
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-2xs">
									<div className="flex items-center gap-3">
										<Button
											type="button"
											variant="outline-solid"
											size="sm"
											onClick={() => setIsCreatingCommPost(false)}
											className="h-8 w-8 p-0 shrink-0"
											title="Quay lại danh sách"
										>
											<ArrowLeft className="h-4 w-4" />
										</Button>
										<div>
											<h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
												<span>Tạo Thông Báo Truyền Thông Mới</span>
												<Badge variant="outline-solid" className="text-[10px] text-primary border-primary/30 py-0">
													Bản thảo
												</Badge>
											</h2>
											<p className="text-[11px] text-muted-foreground mt-0.5">
												Soạn thảo thông điệp chính thức gửi đến toàn bộ mạng xã hội độc giả Aurabook
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline-solid"
											size="sm"
											onClick={() => setIsCreatingCommPost(false)}
											className="h-8 text-xs px-3"
										>
											Hủy
										</Button>
										<Button
											type="button"
											disabled={isSubmittingAdminPost || !adminPostTitle.trim() || !adminPostContent.trim()}
											onClick={(e) => void handleCreateAdminPost(e)}
											size="sm"
											className="h-8 text-xs font-bold gap-1.5 px-4 bg-primary text-primary-foreground shadow-xs"
										>
											<Send className="h-3.5 w-3.5" />
											<span>{isSubmittingAdminPost ? "Đang phát hành..." : "Phát hành thông báo"}</span>
										</Button>
									</div>
								</div>

								{/* Bố cục 2 Cột chuẩn Saleor Dashboard (2/3 Trái & 1/3 Phải) */}
								<form onSubmit={handleCreateAdminPost} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
									{/* CỘT TRÁI (2/3): THÔNG TIN CHÍNH */}
									<div className="lg:col-span-2 space-y-6">
										<div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-5">
											<div className="border-b border-border pb-3">
												<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
													<FileText className="h-3.5 w-3.5 text-primary" />
													<span>Thông tin chung (General Information)</span>
												</h3>
											</div>

											<div className="space-y-4">
												<div className="space-y-1.5">
													<label className="text-xs font-bold text-foreground">
														Tiêu đề thông báo / Tin tức <span className="text-destructive">*</span>
													</label>
													<Input
														type="text"
														value={adminPostTitle}
														onChange={(e) => setAdminPostTitle(e.target.value)}
														placeholder="Ví dụ: Cập nhật Lịch sự kiện Giao lưu Tác giả & Ra mắt Sách Tháng 10..."
														required
														className="h-10 text-xs bg-background"
													/>
												</div>

												<div className="space-y-1.5">
													<label className="text-xs font-bold text-foreground">
														Nội dung chi tiết <span className="text-destructive">*</span>
													</label>
													<textarea
														rows={8}
														value={adminPostContent}
														onChange={(e) => setAdminPostContent(e.target.value)}
														placeholder="Nhập nội dung thông điệp, hướng dẫn tham gia sự kiện hoặc thông báo chính thức đến độc giả..."
														required
														className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y font-sans leading-relaxed"
													/>
												</div>
											</div>
										</div>
									</div>

									{/* CỘT PHẢI (1/3): PHÂN LOẠI & LIVE PREVIEW */}
									<div className="lg:col-span-1 space-y-6">
										{/* Card: Phân loại & Trạng thái */}
										<div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
											<div className="border-b border-border pb-2.5">
												<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
													<SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
													<span>Phân loại & Hiển thị</span>
												</h3>
											</div>

											<div className="space-y-3.5">
												<div className="space-y-1">
													<label className="text-xs font-bold text-foreground">
														Phân loại truyền thông
													</label>
													<select
														value={adminPostCategory}
														onChange={(e) => setAdminPostCategory(e.target.value)}
														className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
													>
														<option value="Thông báo">Thông báo quan trọng</option>
														<option value="Sự kiện">Sự kiện & Workshop</option>
														<option value="Tin sách mới">Ra mắt sách mới</option>
														<option value="Khuyến mãi">Ưu đãi & Minigame</option>
													</select>
												</div>

												<div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
															<Pin className="h-3.5 w-3.5 text-primary" />
															<span>Ghim lên đầu trang</span>
														</div>
														<input
															type="checkbox"
															checked={adminPostPinned}
															onChange={(e) => setAdminPostPinned(e.target.checked)}
															className="h-4 w-4 rounded accent-primary cursor-pointer"
														/>
													</div>
													<p className="text-[11px] text-muted-foreground">
														Ưu tiên xuất hiện đầu tiên trên bảng tin cộng đồng.
													</p>
												</div>

												<div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
													<div>Người phát hành: <span className="font-semibold text-foreground">Ban Quản Trị Aurabook</span></div>
													<div>Tài khoản đại diện: <span className="font-mono text-primary">@aurabook_admin</span></div>
												</div>
											</div>
										</div>

										{/* Card: Xem trước trên Storefront (Live Preview) */}
										<div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
											<div className="border-b border-border pb-2.5 flex items-center justify-between">
												<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
													<Sparkles className="h-3.5 w-3.5 text-primary" />
													<span>Xem trước trên Storefront</span>
												</h3>
												<span className="text-[10px] text-primary font-medium">Live</span>
											</div>

											{/* Simulated Post Card on Feed */}
											<div className="rounded-xl border border-border bg-background p-3.5 space-y-2.5 shadow-xs">
												<div className="flex items-center gap-2">
													<div className="relative h-7 w-7 rounded-md overflow-hidden border border-border shrink-0">
														<Image
															src="/android-chrome-192x192.png"
															alt="Avatar"
															fill
															sizes="28px"
															className="object-contain"
															unoptimized
														/>
													</div>
													<div className="min-w-0">
														<div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
															<span>Ban Quản Trị Aurabook</span>
															<Badge variant="outline-solid" className="text-[8px] py-0 px-1 border-primary/30 text-primary">
																Staff
															</Badge>
														</div>
														<div className="text-[10px] text-muted-foreground">
															@aurabook_admin • Vừa xong
														</div>
													</div>
												</div>

												<div className="space-y-1">
													<div className="text-xs font-bold text-foreground line-clamp-2">
														{adminPostPinned && (
															<span title="Đã ghim" className="inline-flex items-center text-primary mr-1">
																<Pin className="h-3 w-3 inline fill-primary/30" />
															</span>
														)}
														<span className="text-primary font-bold mr-1">
															[{adminPostCategory.toUpperCase()}]
														</span>
														<span>{adminPostTitle.trim() || "Tiêu đề bài viết sẽ hiển thị ở đây..."}</span>
													</div>
													<p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
														{adminPostContent.trim() || "Nội dung bài viết sẽ hiển thị mô phỏng ở đây khi bạn nhập văn bản..."}
													</p>
												</div>

												<div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
													<span className="flex items-center gap-1">
														<Heart className="h-3 w-3 text-destructive" /> 0 thích
													</span>
													<span className="flex items-center gap-1">
														<MessageSquare className="h-3 w-3 text-primary" /> 0 bình luận
													</span>
												</div>
											</div>
										</div>
									</div>
								</form>
							</div>
						)}
					</div>
				)}
			</div>

			{/* ============================================================== */}
			{/* MODALS                                                         */}
			{/* ============================================================== */}

			{/* Real Account Details Modal */}
			{selectedUser && mounted && createPortal(
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs animate-in fade-in-0">
					<div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95">
						<button
							type="button"
							onClick={() => setSelectedUser(null)}
							className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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
				</div>,
				document.body,
			)}

			{/* Admin Edit Post Modal */}
			{editingPost && (
				<CommunityPostEditModal
					isOpen={!!editingPost}
					post={editingPost}
					onClose={() => setEditingPost(null)}
					onSave={handleSaveAdminEdit}
				/>
			)}

			{/* Admin View Revision History Modal */}
			{historyPost && (
				<PostHistoryModal
					isOpen={!!historyPost}
					post={historyPost}
					onClose={() => setHistoryPost(null)}
				/>
			)}
		</div>
	);
}
