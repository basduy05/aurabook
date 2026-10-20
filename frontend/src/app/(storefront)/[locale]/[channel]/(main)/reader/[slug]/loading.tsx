import { Loader } from "@/ui/atoms/loader";
import { ShieldCheck, BookOpen } from "lucide-react";

export default function ReaderLoading() {
	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in-0 duration-200">
			{/* Top Bar Skeleton */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-lg bg-muted/60 animate-pulse" />
					<div className="space-y-1">
						<div className="h-4 w-44 rounded bg-muted/70 animate-pulse" />
						<div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
						<ShieldCheck className="h-3.5 w-3.5" />
						<span>Bảo Mật DRM Readium LCP</span>
					</div>
				</div>
			</header>

			{/* Center Loading Canvas */}
			<main className="relative flex flex-1 items-center justify-center p-6 bg-muted/10">
				<div className="flex flex-col items-center justify-center max-w-sm p-8 rounded-2xl border border-border/80 bg-card/90 shadow-xl backdrop-blur-xs text-center space-y-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<BookOpen className="h-7 w-7 animate-pulse" />
					</div>
					<Loader size="lg" text="Đang giải mã bản quyền và tải nội dung sách điện tử..." />
					<p className="text-[11px] text-muted-foreground leading-relaxed">
						Hệ thống đang xác thực chữ ký bản quyền DRM và nạp môi trường đọc chống sao chép bản quyền.
					</p>
				</div>
			</main>
		</div>
	);
}
