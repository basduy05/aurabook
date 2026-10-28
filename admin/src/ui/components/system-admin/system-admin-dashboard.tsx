"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Activity,
	BookOpen,
	ShoppingBag,
	Users,
	Sparkles,
	Settings,
	ExternalLink,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
	CheckCircle2,
	Mic,
	ShieldCheck,
	Truck,
	Radio,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { cn } from "@/lib/utils";

// The 6 Unified Admin Modules
import { AdminOverviewModule } from "./admin-overview-module";
import { AdminCatalogDrmModule } from "./admin-catalog-drm-module";
import { AdminOrdersShippingModule } from "./admin-orders-shipping-module";
import { AdminCommunityModule } from "./admin-community-module";
import { AdminAiPlatformModule } from "./admin-ai-platform-module";
import { AdminSystemConfigModule } from "./admin-system-config-module";

export type AdminUnifiedTab =
	| "overview"
	| "catalog_drm"
	| "orders_shipping"
	| "community"
	| "ai_platform"
	| "system_config";

interface NavGroupItem {
	key: AdminUnifiedTab;
	label: string;
	shortLabel: string;
	icon: any;
	badge?: string;
	description: string;
}

const UNIFIED_NAV_ITEMS: NavGroupItem[] = [
	{
		key: "overview",
		label: "Tổng Quan & Hạ Tầng",
		shortLabel: "Hạ Tầng",
		icon: Activity,
		description: "Trạng thái live 6 dịch vụ, xóa cache ISR & KPI tổng thể",
	},
	{
		key: "catalog_drm",
		label: "Sách, Ebook & DRM",
		shortLabel: "Sách & DRM",
		icon: BookOpen,
		badge: "Bản quyền",
		description: "Kho sách, giá bán, đồng bộ GraphRAG & quản trị thiết bị DRM",
	},
	{
		key: "orders_shipping",
		label: "Đơn Hàng & Vận Chuyển GHN",
		shortLabel: "Đơn & GHN",
		icon: Truck,
		badge: "GHN Live",
		description: "Vận đơn GHN trực tuyến, đổi trạng thái 1 click đồng bộ Saleor",
	},
	{
		key: "community",
		label: "Cộng Đồng, Độc Giả & Đánh Giá",
		shortLabel: "Cộng Đồng",
		icon: Users,
		description: "Quản lý thành viên, kiểm duyệt bài viết, duyệt đánh giá sách & thông báo BQT",
	},
	{
		key: "ai_platform",
		label: "Nền Tảng AI Voice & GraphRAG",
		shortLabel: "AI Studio",
		icon: Sparkles,
		badge: "Cốt lõi",
		description: "Mô hình giọng nói TTS, truy vấn tri thức GraphRAG, hội thoại CSAT & Ragas",
	},
	{
		key: "system_config",
		label: "Trung Tâm Cấu Hình & Feature Flags",
		shortLabel: "Cấu Hình",
		icon: Settings,
		badge: "Không Cần Code",
		description: "Bật/tắt tính năng, chọn model LLM, sửa System Prompt & Dify RAG",
	},
];

export function SystemAdminDashboard() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	// Read initial tab from search param or localStorage
	const getInitialTab = (): AdminUnifiedTab => {
		const paramTab = searchParams.get("tab") as AdminUnifiedTab;
		if (paramTab && UNIFIED_NAV_ITEMS.some((i) => i.key === paramTab)) return paramTab;
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("aurabook_unified_admin_tab") as AdminUnifiedTab;
			if (saved && UNIFIED_NAV_ITEMS.some((i) => i.key === saved)) return saved;
		}
		return "overview";
	};

	const [activeTab, setActiveTab] = useState<AdminUnifiedTab>(getInitialTab);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [selectedVoice, setSelectedVoice] = useState<string>("vi_VN-hoaimy-aurabook");
	const [isSyncing, setIsSyncing] = useState(false);

	// Load authoritative voice
	const fetchVoiceSetting = async () => {
		try {
			const res = await fetch("/api/system/admin/voice");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.activeVoice) {
					setSelectedVoice(data.activeVoice);
				}
			}
		} catch (err) {
			console.warn("Lỗi tải giọng đọc:", err);
		}
	};

	useEffect(() => {
		fetchVoiceSetting();
	}, []);

	// Handle tab switch
	const handleSelectTab = (tab: AdminUnifiedTab) => {
		setActiveTab(tab);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem("aurabook_unified_admin_tab", tab);
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

	const currentNavItem = UNIFIED_NAV_ITEMS.find((i) => i.key === activeTab) || UNIFIED_NAV_ITEMS[0];

	return (
		<div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col">
			{/* Top Universal Full-Width Header Bar */}
			<header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md px-4 lg:px-6 py-2.5 shadow-2xs">
				<div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					{/* Left: Branding & Breadcrumbs */}
					<div className="space-y-0.5">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/60 p-1 shadow-2xs">
								<img
									src="/android-chrome-192x192.png"
									alt="Aurabook"
									className="h-5 w-5 rounded object-contain"
								/>
							</div>
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
									Trung Tâm Quản Trị Hệ Thống Aurabook
								</h1>
								<Badge variant="outline-solid" className="text-[10px] py-0 px-2 text-primary border-primary/30 font-semibold">
									Cổng Độc Lập :3001
								</Badge>
							</div>
						</div>

						<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
							<span className="font-medium">Aurabook Platform</span>
							<span>/</span>
							<span className="font-semibold text-foreground">{currentNavItem.label}</span>
							<span>•</span>
							<span className="hidden sm:inline text-muted-foreground">{currentNavItem.description}</span>
						</nav>
					</div>

					{/* Right: Actions, Voice Indicator & External Port Links */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* Active Voice Indicator */}
						<button
							type="button"
							onClick={() => handleSelectTab("ai_platform")}
							title="Nhấn để tùy chỉnh giọng nói trong AI Studio"
							className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:border-primary/40 px-2.5 py-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer"
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
								<span className="font-semibold text-foreground truncate max-w-[130px]">
									{selectedVoice.includes("hoaimy") ? "Hoài My (VTV Studio)" : selectedVoice}
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

						{/* External Port Links */}
						<a
							href="http://localhost:3000"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink className="h-3 w-3 text-blue-500" />
							<span className="hidden md:inline">Cửa Hàng</span>
							<span className="font-mono text-muted-foreground">(:3000)</span>
						</a>

						<a
							href="http://localhost:9000/dashboard/"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink className="h-3 w-3 text-purple-500" />
							<span className="hidden md:inline">Saleor</span>
							<span className="font-mono text-muted-foreground">(:9000)</span>
						</a>

						<a
							href="http://localhost:8080"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<ExternalLink className="h-3 w-3 text-emerald-500" />
							<span className="hidden md:inline">Dify</span>
							<span className="font-mono text-muted-foreground">(:8080)</span>
						</a>
					</div>
				</div>
			</header>

			{/* Main Full-Width Body with Sidebar + Dynamic Module View */}
			<div className="flex-1 w-full px-4 lg:px-6 py-4 flex flex-col md:flex-row gap-5 items-start max-w-none">
				{/* Fluid Sidebar */}
				<aside
					className={cn(
						"transition-all duration-300 rounded-xl bg-card border border-border p-2 shadow-card shrink-0 w-full md:sticky md:top-16",
						isSidebarCollapsed ? "md:w-16" : "md:w-64",
					)}
				>
					<div className="flex items-center justify-between p-1.5 mb-1.5 border-b border-border">
						{!isSidebarCollapsed && (
							<span className="text-xs font-bold text-foreground uppercase tracking-wider text-[10px]">
								6 Phân Hệ Quản Trị
							</span>
						)}
						<button
							type="button"
							onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
							className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-auto cursor-pointer"
							title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
						>
							{isSidebarCollapsed ? (
								<ChevronRight className="h-4 w-4" />
							) : (
								<ChevronLeft className="h-4 w-4" />
							)}
						</button>
					</div>

					{/* Navigation List */}
					<div className="space-y-1">
						{UNIFIED_NAV_ITEMS.map((item) => {
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
										"flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold transition-all w-full text-left cursor-pointer",
										isActive
											? "bg-primary text-primary-foreground shadow-2xs font-bold"
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
														"text-[9px] px-1 py-0 h-4 border-none font-semibold",
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

					{!isSidebarCollapsed && (
						<div className="mt-4 pt-3 border-t border-border px-2">
							<div className="text-[10px] text-muted-foreground leading-relaxed">
								Admin Port :3001 kết nối trực tiếp với backend qua reverse proxy. Mọi thay đổi áp dụng tức thì.
							</div>
						</div>
					)}
				</aside>

				{/* Primary Content View Area - Full Width */}
				<main className="flex-1 min-w-0 w-full space-y-4">
					{/* Active Module Header Banner */}
					<div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="space-y-0.5">
							<div className="flex items-center gap-2">
								<Badge variant="outline-solid" className="text-xs text-primary border-primary/30 font-semibold">
									Phân Hệ Quản Trị #{UNIFIED_NAV_ITEMS.findIndex((i) => i.key === activeTab) + 1}
								</Badge>
								<span className="text-xs text-muted-foreground">•</span>
								<span className="text-xs text-muted-foreground">{currentNavItem.description}</span>
							</div>
							<h2 className="text-lg font-bold text-foreground flex items-center gap-2">
								<currentNavItem.icon className="w-5 h-5 text-primary" />
								<span>{currentNavItem.label}</span>
							</h2>
						</div>

						{activeTab === "system_config" && (
							<div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
								<CheckCircle2 className="h-4 w-4 shrink-0" />
								<span>Lưu trực tiếp vào máy chủ không cần sửa code</span>
							</div>
						)}
					</div>

					{/* 6 Unified Modules */}
					{activeTab === "overview" && (
						<AdminOverviewModule onNavigateTab={(tab) => handleSelectTab(tab as AdminUnifiedTab)} />
					)}

					{activeTab === "catalog_drm" && <AdminCatalogDrmModule />}

					{activeTab === "orders_shipping" && <AdminOrdersShippingModule />}

					{activeTab === "community" && <AdminCommunityModule />}

					{activeTab === "ai_platform" && <AdminAiPlatformModule />}

					{activeTab === "system_config" && <AdminSystemConfigModule />}
				</main>
			</div>
		</div>
	);
}

export default SystemAdminDashboard;
