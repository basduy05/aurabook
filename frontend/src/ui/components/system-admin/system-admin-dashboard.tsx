"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Activity,
	Users,
	FileText,
	Megaphone,
	Mic,
	Sparkles,
	ShieldCheck,
	MessageSquare,
	Sliders,
	Settings,
	ExternalLink,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
	CheckCircle2,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { CommunityAdminDashboard } from "@/ui/components/community/admin/community-admin-dashboard";
import { AIAdminDashboard, VOICE_MODELS, type TabKey as AITabKey } from "@/ui/components/ai-admin/ai-admin-dashboard";
import { cn } from "@/lib/utils";

export type SystemTabKey =
	| "health"
	| "readers"
	| "posts"
	| "announcements"
	| "voice"
	| "graphrag"
	| "drm"
	| "chatbot"
	| "eval"
	| "settings";

interface NavItem {
	key: SystemTabKey;
	label: string;
	shortLabel: string;
	icon: any;
	group: "infra" | "community" | "ai" | "settings";
	badge?: string;
}

const NAV_ITEMS: NavItem[] = [
	{
		key: "health",
		label: "Hạ tầng & Sức khỏe",
		shortLabel: "Hạ tầng",
		icon: Activity,
		group: "infra",
	},
	{
		key: "readers",
		label: "Quản lý Độc giả",
		shortLabel: "Độc giả",
		icon: Users,
		group: "community",
	},
	{
		key: "posts",
		label: "Kiểm duyệt Bài viết",
		shortLabel: "Bài viết",
		icon: FileText,
		group: "community",
	},
	{
		key: "announcements",
		label: "Thông báo Ban Quản Trị",
		shortLabel: "Thông báo",
		icon: Megaphone,
		group: "community",
	},
	{
		key: "voice",
		label: "Trợ lý Voice & Giọng nói",
		shortLabel: "Giọng nói",
		icon: Mic,
		group: "ai",
		badge: "Cốt lõi",
	},
	{
		key: "graphrag",
		label: "GraphRAG & Tri thức Sách",
		shortLabel: "GraphRAG",
		icon: Sparkles,
		group: "ai",
	},
	{
		key: "drm",
		label: "Bảo mật Bản quyền DRM",
		shortLabel: "DRM",
		icon: ShieldCheck,
		group: "ai",
	},
	{
		key: "chatbot",
		label: "Giám sát Hội thoại & CSAT",
		shortLabel: "Hội thoại",
		icon: MessageSquare,
		group: "ai",
	},
	{
		key: "eval",
		label: "Đánh giá Benchmark Ragas",
		shortLabel: "Ragas",
		icon: Sliders,
		group: "ai",
	},
	{
		key: "settings",
		label: "Quy định & Thiết lập",
		shortLabel: "Thiết lập",
		icon: Settings,
		group: "settings",
	},
];

export function SystemAdminDashboard() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const initialTab = (searchParams.get("tab") as SystemTabKey) || "health";
	const [activeTab, setActiveTab] = useState<SystemTabKey>(initialTab);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [selectedVoice, setSelectedVoice] = useState<string>("vi_VN-hoaimy-aurabook");
	const [isSyncing, setIsSyncing] = useState(false);

	// Load stored tab and voice selection on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const savedVoice = localStorage.getItem("aurabook_admin_selected_voice");
				if (savedVoice) {
					setSelectedVoice(savedVoice);
				}
				const paramTab = searchParams.get("tab") as SystemTabKey;
				if (!paramTab) {
					const savedTab = localStorage.getItem("aurabook_system_admin_tab") as SystemTabKey;
					if (savedTab && NAV_ITEMS.some((i) => i.key === savedTab)) {
						setActiveTab(savedTab);
					}
				}
			} catch (_) {}
		}
	}, [searchParams]);

	// Fetch authoritative voice from backend config
	const fetchVoiceSetting = async () => {
		try {
			const res = await fetch("/api/system/admin/voice");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.activeVoice) {
					setSelectedVoice(data.activeVoice);
					if (typeof window !== "undefined") {
						localStorage.setItem("aurabook_admin_selected_voice", data.activeVoice);
					}
				}
			}
		} catch (err) {
			console.warn("Fetch system voice error:", err);
		}
	};

	useEffect(() => {
		fetchVoiceSetting();

		// Listen to custom voice-changed events dispatched by child components
		const handleVoiceChanged = (e: any) => {
			if (e.detail?.voiceId) {
				setSelectedVoice(e.detail.voiceId);
			}
		};
		window.addEventListener("aurabook:voice-changed", handleVoiceChanged);
		return () => {
			window.removeEventListener("aurabook:voice-changed", handleVoiceChanged);
		};
	}, []);

	// Handle Tab Change
	const handleSelectTab = (tab: SystemTabKey) => {
		setActiveTab(tab);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem("aurabook_system_admin_tab", tab);
			} catch (_) {}
		}
		startTransition(() => {
			const params = new URLSearchParams(window.location.search);
			params.set("tab", tab);
			router.replace(`?${params.toString()}`, { scroll: false });
		});
	};

	const handleRefreshAll = async () => {
		setIsSyncing(true);
		await fetchVoiceSetting();
		setTimeout(() => setIsSyncing(false), 500);
	};

	const currentVoiceModel = VOICE_MODELS.find((m) => m.id === selectedVoice);
	const currentVoiceName = currentVoiceModel ? currentVoiceModel.name : selectedVoice;

	// Is current tab an AI-related tab?
	const isAiTab = ["health", "voice", "graphrag", "drm", "chatbot", "eval"].includes(activeTab);
	// Is current tab a community/reader-related tab?
	const isCommunityTab = ["readers", "posts", "announcements", "settings"].includes(activeTab);

	const aiTabMap: Record<string, AITabKey> = {
		health: "health",
		voice: "voice",
		graphrag: "graphrag",
		drm: "drm",
		chatbot: "chatbot",
		eval: "eval",
	};

	const communityTabMap: Record<string, "users" | "posts" | "announcements" | "settings"> = {
		readers: "users",
		posts: "posts",
		announcements: "announcements",
		settings: "settings",
	};

	return (
		<div className="min-h-screen w-full bg-background text-foreground font-sans">
			{/* Top Universal Header Bar */}
			<header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-2xs">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="space-y-0.5">
						<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
							<span className="hover:text-foreground">Bảng điều khiển Saleor</span>
							<span>/</span>
							<span className="hover:text-foreground">Ứng dụng Hệ thống</span>
							<span>/</span>
							<span className="font-semibold text-foreground">Quản trị Hệ thống Hợp Nhất</span>
						</nav>

						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/60 p-1 shadow-2xs">
								<Image
									src="/android-chrome-192x192.png"
									alt="Aurabook"
									width={20}
									height={20}
									className="h-5 w-5 rounded object-contain"
									unoptimized
								/>
							</div>
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
									Trung Tâm Quản Trị Hệ Thống Aurabook
								</h1>
								<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 text-primary border-primary/30 font-medium">
									Quản trị Độc giả & AI Platform
								</Badge>
							</div>
						</div>
					</div>

					{/* Right Action Bar & Voice Indicator */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* Persistent Active Voice Badge */}
						<button
							type="button"
							id="btn-active-voice-badge"
							onClick={() => handleSelectTab("voice")}
							title="Nhấn để tùy chỉnh và đổi giọng nói mặc định"
							className={cn(
								"group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer",
								activeTab === "voice"
									? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
									: "border-border bg-card hover:border-primary/40 text-foreground",
							)}
						>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
							</span>
							<Mic className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
							<div className="flex flex-col text-left">
								<span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
									Giọng đọc mặc định
								</span>
								<span className="font-semibold text-foreground truncate max-w-[150px]">
									{currentVoiceName}
								</span>
							</div>
						</button>

						<Button
							type="button"
							variant="outline-solid"
							size="sm"
							onClick={handleRefreshAll}
							disabled={isSyncing}
							className="h-8 text-xs gap-1.5"
						>
							<RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
							<span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}</span>
						</Button>

						<Link
							href="/vi/channel-vnd/community"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">Trang Độc Giả</span>
						</Link>

						<a
							href="http://localhost:8080"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">Dify Studio</span>
						</a>
					</div>
				</div>
			</header>

			{/* Main Container with Sidebar + Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
				<div className="flex flex-col md:flex-row gap-6 items-start">
					{/* Unified Navigation Sidebar */}
					<aside
						className={cn(
							"transition-all duration-300 rounded-xl bg-card border border-border p-2.5 shadow-card shrink-0 w-full md:sticky md:top-20",
							isSidebarCollapsed ? "md:w-16" : "md:w-64",
						)}
					>
						<div className="flex items-center justify-between p-1.5 mb-2 border-b border-border">
							{!isSidebarCollapsed && (
								<span className="text-xs font-bold text-foreground">Menu Hệ Thống</span>
							)}
							<button
								type="button"
								onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
								className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-auto"
								title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
							>
								{isSidebarCollapsed ? (
									<ChevronRight className="h-4 w-4" />
								) : (
									<ChevronLeft className="h-4 w-4" />
								)}
							</button>
						</div>

						{/* Nav Groups */}
						<div className="space-y-4">
							{/* Group 1: Infra */}
							<div>
								{!isSidebarCollapsed && (
									<div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Hạ tầng hệ thống
									</div>
								)}
								<div className="space-y-1">
									{NAV_ITEMS.filter((i) => i.group === "infra").map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.key;
										return (
											<button
												key={item.key}
												id={`nav-item-${item.key}`}
												type="button"
												onClick={() => handleSelectTab(item.key)}
												title={item.label}
												className={cn(
													"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all w-full text-left cursor-pointer",
													isActive
														? "bg-primary text-primary-foreground shadow-2xs"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
													isSidebarCollapsed ? "justify-center px-2" : "justify-start",
												)}
											>
												<Icon className="h-4 w-4 shrink-0" />
												{!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
											</button>
										);
									})}
								</div>
							</div>

							{/* Group 2: Community & Readers */}
							<div>
								{!isSidebarCollapsed && (
									<div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Quản trị độc giả
									</div>
								)}
								<div className="space-y-1">
									{NAV_ITEMS.filter((i) => i.group === "community").map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.key;
										return (
											<button
												key={item.key}
												id={`nav-item-${item.key}`}
												type="button"
												onClick={() => handleSelectTab(item.key)}
												title={item.label}
												className={cn(
													"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all w-full text-left cursor-pointer",
													isActive
														? "bg-primary text-primary-foreground shadow-2xs"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
													isSidebarCollapsed ? "justify-center px-2" : "justify-start",
												)}
											>
												<Icon className="h-4 w-4 shrink-0" />
												{!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
											</button>
										);
									})}
								</div>
							</div>

							{/* Group 3: AI & Security */}
							<div>
								{!isSidebarCollapsed && (
									<div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Hệ sinh thái AI & DRM
									</div>
								)}
								<div className="space-y-1">
									{NAV_ITEMS.filter((i) => i.group === "ai").map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.key;
										return (
											<button
												key={item.key}
												id={`nav-item-${item.key}`}
												type="button"
												onClick={() => handleSelectTab(item.key)}
												title={item.label}
												className={cn(
													"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all w-full text-left cursor-pointer",
													isActive
														? "bg-primary text-primary-foreground shadow-2xs"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
													isSidebarCollapsed ? "justify-center px-2" : "justify-start",
												)}
											>
												<Icon className="h-4 w-4 shrink-0" />
												{!isSidebarCollapsed && (
													<div className="flex items-center justify-between w-full min-w-0">
														<span className="truncate">{item.label}</span>
														{item.badge && (
															<Badge
																variant="outline-solid"
																className={cn(
																	"text-[9px] px-1 py-0 h-4 border-none",
																	isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
																)}
															>
																{item.badge}
															</Badge>
														)}
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Group 4: Settings */}
							<div>
								{!isSidebarCollapsed && (
									<div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Cấu hình
									</div>
								)}
								<div className="space-y-1">
									{NAV_ITEMS.filter((i) => i.group === "settings").map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.key;
										return (
											<button
												key={item.key}
												id={`nav-item-${item.key}`}
												type="button"
												onClick={() => handleSelectTab(item.key)}
												title={item.label}
												className={cn(
													"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all w-full text-left cursor-pointer",
													isActive
														? "bg-primary text-primary-foreground shadow-2xs"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
													isSidebarCollapsed ? "justify-center px-2" : "justify-start",
												)}
											>
												<Icon className="h-4 w-4 shrink-0" />
												{!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</aside>

					{/* Primary Content View Area */}
					<main className="flex-1 min-w-0 w-full space-y-6">
						{/* Active Tab Header Banner */}
						<div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Badge variant="outline-solid" className="text-xs text-primary border-primary/30">
										{NAV_ITEMS.find((i) => i.key === activeTab)?.group === "community"
											? "Phân hệ Độc giả"
											: NAV_ITEMS.find((i) => i.key === activeTab)?.group === "ai"
											? "Phân hệ Trí tuệ Nhân tạo"
											: NAV_ITEMS.find((i) => i.key === activeTab)?.group === "infra"
											? "Phân hệ Hạ tầng"
											: "Phân hệ Thiết lập"}
									</Badge>
									<span className="text-xs text-muted-foreground">•</span>
									<span className="text-xs text-muted-foreground">
										{activeTab === "voice"
											? `Giọng nói đang chọn: ${currentVoiceName}`
											: `Trang quản trị: ${NAV_ITEMS.find((i) => i.key === activeTab)?.label}`}
									</span>
								</div>
								<h2 className="text-lg font-bold text-foreground">
									{NAV_ITEMS.find((i) => i.key === activeTab)?.label}
								</h2>
							</div>

							{activeTab === "voice" && (
								<div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
									<CheckCircle2 className="h-4 w-4 shrink-0" />
									<span>Đã ghi nhớ lựa chọn giọng nói trên trình duyệt & máy chủ</span>
								</div>
							)}
						</div>

						{/* AI Modules (Health, Voice, GraphRAG, DRM, Chatbot, Eval) */}
						{isAiTab && (
							<AIAdminDashboard
								embedded
								hideSidebar
								activeTab={aiTabMap[activeTab]}
								onTabChange={(tabKey) => {
									handleSelectTab(tabKey as SystemTabKey);
								}}
							/>
						)}

						{/* Community / Reader Modules (Readers, Posts, Announcements, Settings) */}
						{isCommunityTab && (
							<CommunityAdminDashboard
								embedded
								embeddedTab={communityTabMap[activeTab]}
							/>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
