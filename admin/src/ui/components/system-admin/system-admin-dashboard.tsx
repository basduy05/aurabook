"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Activity,
	BookOpen,
	Users,
	Sparkles,
	Settings,
	ExternalLink,
	LogOut,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
	Truck,
	Sun,
	Moon,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
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
	description: string;
}

const UNIFIED_NAV_ITEMS: NavGroupItem[] = [
	{
		key: "overview",
		label: "Tổng quan hệ thống",
		shortLabel: "Tổng quan",
		icon: Activity,
		description: "Tình trạng hạ tầng 8 dịch vụ và chỉ số hoạt động",
	},
	{
		key: "catalog_drm",
		label: "Quản lý kho sách & DRM",
		shortLabel: "Kho sách & DRM",
		icon: BookOpen,
		description: "Danh mục sách, định dạng EPUB và phân quyền DRM",
	},
	{
		key: "orders_shipping",
		label: "Đơn hàng & Vận chuyển GHN",
		shortLabel: "Đơn & GHN",
		icon: Truck,
		description: "Quản lý đơn hàng Saleor và theo dõi vận đơn GHN",
	},
	{
		key: "community",
		label: "Cộng đồng & Độc giả",
		shortLabel: "Cộng đồng",
		icon: Users,
		description: "Quản lý tài khoản độc giả, bài viết và đánh giá",
	},
	{
		key: "ai_platform",
		label: "Trợ lý AI & Giọng nói",
		shortLabel: "Trợ lý AI",
		icon: Sparkles,
		description: "Cấu hình Ollama Gemma 2 2B, F5-TTS và GraphRAG",
	},
	{
		key: "system_config",
		label: "Cấu hình hệ thống",
		shortLabel: "Cấu hình",
		icon: Settings,
		description: "Tham số vận hành và chính sách nền tảng",
	},
];

export function SystemAdminDashboard({ onLogout }: { onLogout?: () => void } = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

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
	const [isSyncing, setIsSyncing] = useState(false);
	const [isDark] = useState<boolean>(true);

	useEffect(() => {
		if (isDark) {
			document.documentElement.classList.add("dark");
			try { localStorage.setItem("aurabook_admin_theme", "dark"); } catch (_) {}
		} else {
			document.documentElement.classList.remove("dark");
			try { localStorage.setItem("aurabook_admin_theme", "light"); } catch (_) {}
		}
	}, [isDark]);

	


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

	const handleRefreshAll = () => {
		setIsSyncing(true);
		window.location.reload();
	};

	const currentNavItem = UNIFIED_NAV_ITEMS.find((i) => i.key === activeTab) || UNIFIED_NAV_ITEMS[0];

	return (
		<div className="min-h-screen w-full bg-[#090d16] text-slate-100 font-sans flex flex-col">
			{/* Clean Enterprise Top Navigation Bar */}
			<header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md px-6 py-3">
				<div className="w-full flex items-center justify-between gap-4">
					{/* Brand & Breadcrumbs */}
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 p-1">
							<img
								src="/android-chrome-192x192.png"
								alt="AuraBook"
								className="h-5 w-5 rounded object-contain"
							/>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-sm font-semibold tracking-tight text-white">
									AuraBook
								</h1>
								<span className="text-xs text-slate-400 dark:text-zinc-500">/</span>
								<span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
									Quản trị hệ thống
								</span>
							</div>
							<p className="text-[11px] text-slate-500 dark:text-zinc-400">
								{currentNavItem.description}
							</p>
						</div>
					</div>

					{/* System Status & Actions */}
					<div className="flex items-center gap-2.5">
						{/* Realtime Engine Status */}
						<div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
							<span className="h-2 w-2 rounded-full bg-emerald-500" />
							<span>Hệ thống trực tuyến</span>
							<span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">(Local AI)</span>
						</div>

						{/* Refresh Button */}
						<Button
							type="button"
							variant="outline-solid"
							size="sm"
							onClick={handleRefreshAll}
							disabled={isSyncing}
							className="h-8 text-xs gap-1.5 border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-2xs font-medium cursor-pointer"
						>
							<RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
							<span>{isSyncing ? "Đang tải..." : "Làm mới"}</span>
						</Button>

						{/* Quick External Links */}
												{/* Theme Badge */}
						<div className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300">
							<Moon className="h-3.5 w-3.5 text-blue-400" />
							<span>Dark Console</span>
						</div>

						<a
						href="http://localhost:3000"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
						>
							<ExternalLink className="h-3 w-3 text-slate-400" />
							<span>Cửa hàng</span>
						</a>

						<a
							href="http://localhost:9000/dashboard/"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
						>
							<ExternalLink className="h-3 w-3 text-slate-400" />
							<span>Saleor</span>
						</a>

						{onLogout && (
							<button
								type="button"
								onClick={onLogout}
								className="inline-flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
								title="Đăng xuất phiên quản trị"
							>
								<LogOut className="h-3 w-3" />
								<span>Đăng xuất</span>
							</button>
						)}
					</div>
				</div>
			</header>

			{/* Main Layout Body */}
			<div className="flex-1 w-full px-6 py-5 flex flex-col md:flex-row gap-6 items-start">
				{/* Quiet Navigation Sidebar */}
				<aside
					className={cn(
						"transition-all duration-200 rounded-lg bg-[#0f172a] border border-slate-800 p-2 shrink-0 w-full md:sticky md:top-20",
						isSidebarCollapsed ? "md:w-14" : "md:w-60",
					)}
				>
					<div className="flex items-center justify-between px-2 py-1.5 mb-1 text-slate-400 dark:text-zinc-500">
						{!isSidebarCollapsed && (
							<span className="text-[11px] font-semibold uppercase tracking-wider">
								Menu quản trị
							</span>
						)}
						<button
							type="button"
							onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
							className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ml-auto cursor-pointer"
							title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
						>
							{isSidebarCollapsed ? (
								<ChevronRight className="h-4 w-4" />
							) : (
								<ChevronLeft className="h-4 w-4" />
							)}
						</button>
					</div>

					{/* Navigation List */}
					<nav className="space-y-0.5">
						{UNIFIED_NAV_ITEMS.map((item) => {
							const Icon = item.icon;
							const isActive = activeTab === item.key;
							return (
								<button
									key={item.key}
									type="button"
									onClick={() => handleSelectTab(item.key)}
									title={item.label}
									className={cn(
										"flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors w-full text-left cursor-pointer",
										isActive
											? "bg-blue-600 text-white font-semibold shadow-sm"
											: "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
										isSidebarCollapsed ? "justify-center px-1" : "justify-start",
									)}
								>
									<Icon className="h-4 w-4 shrink-0" />
									{!isSidebarCollapsed && (
										<span className="truncate">{item.label}</span>
									)}
								</button>
							);
						})}
					</nav>
				</aside>

				{/* Primary Content View Area */}
				<main className="flex-1 min-w-0 w-full space-y-5">
					{/* Module Views */}
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
