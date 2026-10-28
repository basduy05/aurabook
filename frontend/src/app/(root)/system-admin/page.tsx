import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cổng Quản Trị Hệ Thống Độc Lập | AuraBook Admin",
	description: "Cổng quản trị hệ thống đã được chuyển sang địa chỉ máy chủ độc lập http://localhost:3001",
};

export default function SystemAdminPage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
			<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
					<svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<h1 className="text-xl font-bold tracking-tight mb-2">
					Cổng Quản Trị Hệ Thống Độc Lập
				</h1>
				<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
					Theo thiết kế bảo mật, phân hệ Quản trị Hệ thống đã được chuyển sang một địa chỉ localhost riêng biệt dành riêng cho quản trị viên:
				</p>
				<div className="mb-6 rounded-lg bg-secondary/80 p-3 font-mono text-sm font-bold text-primary border border-border">
					http://localhost:3001
				</div>
				<a
					href="http://localhost:3001"
					className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
				>
					Mở Cổng Quản Trị (Port 3001) →
				</a>
			</div>
		</main>
	);
}
