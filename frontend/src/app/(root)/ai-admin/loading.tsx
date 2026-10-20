import Image from "next/image";
import { Loader } from "@/ui/atoms/loader";
import { Badge } from "@/ui/components/ui/badge";
import { Sparkles, Activity, Server, Radio } from "lucide-react";

export default function AIAdminLoading() {
	return (
		<div className="min-h-screen w-full bg-background text-foreground pb-12 font-sans animate-in fade-in-0 duration-200">
			{/* Top Slim Progress Bar */}
			<div className="fixed top-0 left-0 right-0 h-1 bg-primary animate-pulse z-50" />

			{/* Top Branding Header */}
			<header className="border-b border-border bg-card px-4 sm:px-8 py-3.5 shadow-2xs">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="space-y-1">
						<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
							<span className="hover:text-foreground">Bảng điều khiển</span>
							<span>/</span>
							<span className="hover:text-foreground">Ứng dụng Saleor</span>
							<span>/</span>
							<span className="font-semibold text-foreground">Quản trị AI & DRM Platform</span>
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
									Trung Tâm Quản Trị AI & DRM Platform
								</h1>
								<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
									Saleor App v1.0
								</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<div className="h-8 w-28 rounded-button bg-muted animate-pulse" />
						<div className="h-8 w-32 rounded-button bg-muted animate-pulse" />
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
				{/* Main Loading Box with Saleor Loader */}
				<div className="flex flex-col items-center justify-center py-20 px-4 rounded-card border border-border bg-card shadow-card text-center">
					<div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
						<Sparkles className="w-7 h-7 animate-pulse" />
					</div>
					<Loader size="xl" text="Đang đồng bộ hóa trạng thái Dify, LiveKit, DRM và Ragas..." />
					<p className="mt-2 text-xs text-muted-foreground max-w-md">
						Hệ thống đang kết nối dữ liệu điều phối từ Saleor Core và nền tảng ecommerce-ai-platform. Vui lòng đợi trong giây lát.
					</p>
				</div>

				{/* Metric Cards Skeleton */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
					{[
						{ label: "Trạng thái hệ thống", icon: Activity },
						{ label: "Dịch vụ trực tuyến", icon: Server },
						{ label: "Độc giả đang đọc DRM", icon: Radio },
						{ label: "Độ trung thực Ragas", icon: Sparkles },
					].map((item, idx) => {
						const Icon = item.icon;
						return (
							<div
								key={idx}
								className="p-4 rounded-card bg-card border border-border shadow-card flex items-center gap-3"
							>
								<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
									<Icon className="w-5 h-5 animate-pulse" />
								</div>
								<div className="space-y-1.5 flex-1">
									<div className="text-xs text-muted-foreground">{item.label}</div>
									<div className="h-4 w-20 rounded bg-muted animate-pulse" />
								</div>
							</div>
						);
					})}
				</div>
			</main>
		</div>
	);
}
