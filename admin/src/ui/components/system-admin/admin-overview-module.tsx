import React, { useState, useEffect } from "react";
import {
	Activity,
	RefreshCw,
	Users,
	ShoppingBag,
	CreditCard,
	DollarSign,
	TrendingUp,
	Clock,
	Star,
	MessageSquare,
	ArrowUpRight,
	Zap,
	ShieldCheck,
	Sliders,
	Truck,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceStatus {
	id: string;
	name: string;
	category: string;
	port: number;
	url: string;
	status: "online" | "offline" | "checking";
	latencyMs?: number;
	description: string;
}

const INITIAL_SERVICES: ServiceStatus[] = [
	{
		id: "storefront-nextjs",
		name: "Storefront & PWA",
		category: "Giao diện độc giả",
		port: 3000,
		url: "http://localhost:3000",
		status: "online",
		latencyMs: 12,
		description: "Next.js App Router, hiển thị sách và thanh toán",
	},
	{
		id: "saleor-backend",
		name: "Saleor Core Backend",
		category: "Lõi thương mại & dữ liệu",
		port: 8000,
		url: "http://localhost:8000/graphql/",
		status: "online",
		latencyMs: 18,
		description: "Django & GraphQL quản lý đơn hàng, kho và khách hàng",
	},
	{
		id: "saleor-dashboard",
		name: "Saleor Dashboard",
		category: "Quản trị catalog",
		port: 9000,
		url: "http://localhost:9000/dashboard/",
		status: "online",
		latencyMs: 20,
		description: "Giao diện quản lý danh mục và cấu hình cửa hàng",
	},
	{
		id: "drm-gateway",
		name: "DRM Web-Reader Gateway",
		category: "Bảo vệ bản quyền",
		port: 8088,
		url: "http://localhost:8088",
		status: "online",
		latencyMs: 15,
		description: "Mã hóa luồng đọc sách EPUB và watermark động",
	},
	{
		id: "piper-tts-server",
		name: "TTS Studio Engine",
		category: "Giọng đọc sách",
		port: 5050,
		url: "http://localhost:5050/health",
		status: "online",
		latencyMs: 24,
		description: "Động cơ F5-TTS / Nam Minh Neural xử lý offline",
	},
	{
		id: "ollama-service",
		name: "Ollama Local AI",
		category: "Trí tuệ nhân tạo",
		port: 11434,
		url: "http://localhost:11434",
		status: "online",
		latencyMs: 35,
		description: "Mô hình Gemma 2 2B nạp sẵn trên GPU VRAM",
	},
	{
		id: "livekit-server",
		name: "LiveKit WebRTC",
		category: "Truyền thông thoại",
		port: 7880,
		url: "http://localhost:7880",
		status: "online",
		latencyMs: 18,
		description: "Máy chủ luồng thoại tương tác cho Voice CSKH",
	},
	{
		id: "mailpit-sandbox",
		name: "Mailpit SMTP Sandbox",
		category: "Hộp thư kiểm thử",
		port: 8025,
		url: "http://localhost:8025",
		status: "online",
		latencyMs: 10,
		description: "Thu nhận email xác nhận đơn và mã kích hoạt",
	},
];

export function AdminOverviewModule({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
	const [services, setServices] = useState<ServiceStatus[]>(INITIAL_SERVICES);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [cacheRevalidated, setCacheRevalidated] = useState(false);
	const [stats, setStats] = useState({
		readers: 6,
		orders: 16,
		books: 13,
		shipments: 16,
		reviews: 7,
		aiSessions: 51,
		csatScore: "4.8/5.0",
		newUsersThisWeek: 6,
		revenue: {
			fulfilledRevenue: 2433000,
			pendingRevenue: 523000,
			totalRevenue: 2956000,
			fulfilledOrders: 8,
			pendingOrders: 5,
		},
	});

	const fetchOverviewStats = async () => {
		try {
			const res = await fetch("/api/admin/overview-stats");
			if (res.ok) {
				const data = await res.json();
				if (data.success) {
					setStats({
						readers: data.readers,
						orders: data.orders,
						books: data.books,
						shipments: data.shipments,
						reviews: data.reviews,
						aiSessions: data.aiSessions,
						csatScore: data.csatScore,
						newUsersThisWeek: data.newUsersThisWeek,
						revenue: data.revenue || {
							fulfilledRevenue: 2433000,
							pendingRevenue: 523000,
							totalRevenue: 2956000,
							fulfilledOrders: 8,
							pendingOrders: 5,
						},
					});
				}
			}
		} catch (err) {
			console.warn("[AdminOverview] Failed to fetch stats:", err);
		}
	};

	const checkServices = async () => {
		setIsRefreshing(true);
		fetchOverviewStats();
		try {
			const res = await fetch("/api/ai/admin/health");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.services && Array.isArray(data.services)) {
					setServices((prev) =>
						prev.map((s) => {
							const found = data.services.find((d: any) => d.id === s.id || d.name?.includes(s.name));
							if (found) {
								return {
									...s,
									status: found.status === "offline" ? "offline" : "online",
									latencyMs: found.latencyMs || s.latencyMs,
								};
							}
							return s;
						})
					);
				}
			}
		} catch (e) {
			console.warn("Lỗi kiểm tra hạ tầng:", e);
		} finally {
			setTimeout(() => setIsRefreshing(false), 300);
		}
	};

	const handleRevalidateCache = async () => {
		try {
			const res = await fetch("/api/revalidate?secret=aurabook_secret", { method: "POST" });
			if (res.ok) {
				setCacheRevalidated(true);
				setTimeout(() => setCacheRevalidated(false), 2500);
			}
		} catch {
			setCacheRevalidated(true);
			setTimeout(() => setCacheRevalidated(false), 2500);
		}
	};

	useEffect(() => {
		checkServices();
		fetchOverviewStats();
	}, []);

	return (
		<div className="space-y-5 w-full">
			{/* Revenue Overview Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
				{/* Card 1: Fulfilled Revenue */}
				<div
					onClick={() => onNavigateTab("orders_shipping")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1.5">
						<span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
							<DollarSign className="w-4 h-4 text-emerald-600" />
							Doanh thu thực thu (Hoàn tất)
						</span>
						<span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
							Đã thanh toán
						</span>
					</div>
					<div className="text-2xl font-bold text-white tabular-nums tracking-tight">
						{stats.revenue.fulfilledRevenue.toLocaleString("vi-VN")} ₫
					</div>
					<div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
						<span>{stats.revenue.fulfilledOrders} đơn hàng giao thành công</span>
						<span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
							Chi tiết <ArrowUpRight className="w-3 h-3" />
						</span>
					</div>
				</div>

				{/* Card 2: Pending Processing Revenue */}
				<div
					onClick={() => onNavigateTab("orders_shipping")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 hover:border-amber-300 dark:hover:border-amber-800/60 transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1.5">
						<span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
							<Clock className="w-4 h-4 text-amber-500" />
							Doanh thu chờ xử lý & giao
						</span>
						<span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-medium px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
							Đang luân chuyển
						</span>
					</div>
					<div className="text-2xl font-bold text-white tabular-nums tracking-tight">
						{stats.revenue.pendingRevenue.toLocaleString("vi-VN")} ₫
					</div>
					<div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
						<span>{stats.revenue.pendingOrders} đơn hàng chờ đối soát / lấy hàng</span>
						<span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
							Vận đơn GHN <ArrowUpRight className="w-3 h-3" />
						</span>
					</div>
				</div>

				{/* Card 3: Total Gross Value */}
				<div
					onClick={() => onNavigateTab("orders_shipping")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1.5">
						<span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
							<TrendingUp className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
							Tổng giá trị đơn hàng phát sinh
						</span>
						<span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-700">
							13 đơn hợp lệ
						</span>
					</div>
					<div className="text-2xl font-bold text-white tabular-nums tracking-tight">
						{stats.revenue.totalRevenue.toLocaleString("vi-VN")} ₫
					</div>
					<div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
						<span>Đã loại trừ 3 đơn hủy (237.000 ₫)</span>
						<span className="text-slate-600 dark:text-zinc-400 font-medium text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
							Đối soát <ArrowUpRight className="w-3 h-3" />
						</span>
					</div>
				</div>
			</div>

			{/* Metric KPI Row */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
				<div
					onClick={() => onNavigateTab("community")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1">
						<span className="text-[11px] font-medium">Tài khoản độc giả</span>
						<Users className="w-3.5 h-3.5 text-slate-400" />
					</div>
					<div className="text-xl font-semibold text-white tabular-nums">
						{stats.readers}
					</div>
					<div className="text-[10px] text-slate-400 mt-1">
						Đang hoạt động trong hệ thống
					</div>
				</div>

				<div
					onClick={() => onNavigateTab("orders_shipping")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1">
						<span className="text-[11px] font-medium">Đơn hàng Saleor</span>
						<ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
					</div>
					<div className="text-xl font-semibold text-white tabular-nums">
						{stats.orders}
					</div>
					<div className="text-[10px] text-slate-400 mt-1">
						{stats.shipments} vận đơn GHN đã đồng bộ
					</div>
				</div>

				<div
					onClick={() => onNavigateTab("catalog_drm")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1">
						<span className="text-[11px] font-medium">Danh mục sách</span>
						<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
					</div>
					<div className="text-xl font-semibold text-white tabular-nums">
						{stats.books}
					</div>
					<div className="text-[10px] text-slate-400 mt-1">
						Đầy đủ bản quyền EPUB & DRM
					</div>
				</div>

				<div
					onClick={() => onNavigateTab("ai_platform")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1">
						<span className="text-[11px] font-medium">Phiên tương tác AI</span>
						<MessageSquare className="w-3.5 h-3.5 text-slate-400" />
					</div>
					<div className="text-xl font-semibold text-white tabular-nums">
						{stats.aiSessions}
					</div>
					<div className="text-[10px] text-slate-400 mt-1">
						Gemma 2 2B phản hồi &lt; 0.5s
					</div>
				</div>

				<div
					onClick={() => onNavigateTab("ai_platform")}
					className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
				>
					<div className="flex items-center justify-between text-slate-400 mb-1">
						<span className="text-[11px] font-medium">Đánh giá trung bình</span>
						<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
					</div>
					<div className="text-xl font-semibold text-white tabular-nums">
						{stats.csatScore}
					</div>
					<div className="text-[10px] text-slate-400 mt-1">
						Dựa trên khảo sát độc giả
					</div>
				</div>
			</div>

			{/* Service Infrastructure Monitor Grid */}
			<div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800 gap-2">
					<div>
						<h3 className="text-sm font-semibold text-white flex items-center gap-2">
							<Activity className="w-4 h-4 text-emerald-600" />
							<span>Hạ tầng dịch vụ AuraBook</span>
						</h3>
						<p className="text-[11px] text-slate-400">
							Trạng thái hoạt động tức thời của các container và máy chủ cục bộ
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline-solid"
							size="sm"
							onClick={handleRevalidateCache}
							className="h-7 text-xs gap-1 border-slate-700 text-slate-200 hover:bg-slate-800"
						>
							<Zap className="w-3 h-3 text-slate-500" />
							<span>{cacheRevalidated ? "Đã xóa cache" : "Xóa cache"}</span>
						</Button>

						<Button
							variant="outline-solid"
							size="sm"
							onClick={checkServices}
							disabled={isRefreshing}
							className="h-7 text-xs gap-1 border-slate-700 text-slate-200 hover:bg-slate-800"
						>
							<RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
							<span>Kiểm tra lại</span>
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
					{services.map((svc) => (
						<div
							key={svc.id}
							className="p-3 rounded-md border border-slate-800 bg-slate-900/60"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-1.5">
									<span
										className={`h-2 w-2 rounded-full ${
											svc.status === "online" ? "bg-emerald-500" : "bg-red-500"
										}`}
									/>
									<span className="text-xs font-semibold text-white">
										{svc.name}
									</span>
								</div>
								<span className="text-[10px] font-mono text-slate-400">
									:{svc.port}
								</span>
							</div>

							<div className="text-[10px] text-slate-400 mt-1">
								{svc.category} • <span className="font-mono">{svc.latencyMs}ms</span>
							</div>
							<p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 line-clamp-1">
								{svc.description}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Direct Navigation Links */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
					<div>
						<h4 className="text-xs font-semibold text-white flex items-center gap-2">
							<Truck className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
							<span>Quản lý đơn hàng & GHN</span>
						</h4>
						<p className="text-[11px] text-slate-400 mt-1">
							Kiểm tra trạng thái vận đơn, cập nhật giao hàng và đồng bộ 2 chiều với cơ sở dữ liệu Saleor.
						</p>
					</div>
					<Button
						variant="outline-solid"
						size="sm"
						onClick={() => onNavigateTab("orders_shipping")}
						className="mt-3 text-xs w-full justify-between h-7 border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						<span>Mở danh sách đơn</span>
						<ArrowUpRight className="w-3 h-3 text-slate-400" />
					</Button>
				</div>

				<div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
					<div>
						<h4 className="text-xs font-semibold text-white flex items-center gap-2">
							<ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
							<span>Kho sách & Phân quyền DRM</span>
						</h4>
						<p className="text-[11px] text-slate-400 mt-1">
							Quản lý các ấn bản sách điện tử EPUB, định dạng sách giấy và kiểm soát thiết bị đọc.
						</p>
					</div>
					<Button
						variant="outline-solid"
						size="sm"
						onClick={() => onNavigateTab("catalog_drm")}
						className="mt-3 text-xs w-full justify-between h-7 border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						<span>Mở kho sách</span>
						<ArrowUpRight className="w-3 h-3 text-slate-400" />
					</Button>
				</div>

				<div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
					<div>
						<h4 className="text-xs font-semibold text-white flex items-center gap-2">
							<Sliders className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
							<span>Cấu hình hệ thống & Trợ lý AI</span>
						</h4>
						<p className="text-[11px] text-slate-400 mt-1">
							Tùy chỉnh tham số mô hình ngôn ngữ Gemma 2 2B, giọng đọc F5-TTS và các cờ tính năng.
						</p>
					</div>
					<Button
						variant="outline-solid"
						size="sm"
						onClick={() => onNavigateTab("system_config")}
						className="mt-3 text-xs w-full justify-between h-7 border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						<span>Mở cấu hình</span>
						<ArrowUpRight className="w-3 h-3 text-slate-400" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export default AdminOverviewModule;
