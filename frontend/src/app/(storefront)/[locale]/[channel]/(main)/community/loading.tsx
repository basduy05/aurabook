import { Loader } from "@/ui/atoms/loader";

export default function CommunityLoading() {
	return (
		<div className="container-content py-6 sm:py-8 lg:py-10 animate-in fade-in-0 duration-200">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Left Sidebar Skeleton */}
				<aside className="w-full lg:w-64 shrink-0 space-y-4">
					<div className="h-44 rounded-2xl border border-border/80 bg-card p-4 space-y-3">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-full bg-muted/60 animate-pulse" />
							<div className="space-y-1.5 flex-1">
								<div className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
								<div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
							</div>
						</div>
						<div className="h-8 w-full rounded-xl bg-muted/40 animate-pulse" />
					</div>
					<div className="h-56 rounded-2xl border border-border/80 bg-card p-4 space-y-2">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="h-9 w-full rounded-lg bg-muted/30 animate-pulse" />
						))}
					</div>
				</aside>

				{/* Center Main Stream */}
				<main className="flex-1 space-y-5">
					<div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl shadow-2xs text-center">
						<Loader size="xl" text="Đang tải dữ liệu Cộng đồng Độc giả AuraBook..." />
						<p className="mt-2 text-xs text-muted-foreground">
							Kết nối các bài chia sẻ, trích dẫn sách và thảo luận mới nhất
						</p>
					</div>

					{/* Feed cards skeleton */}
					{[1, 2].map((i) => (
						<div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-muted/60 animate-pulse" />
								<div className="space-y-1">
									<div className="h-4 w-32 rounded bg-muted/60 animate-pulse" />
									<div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
								</div>
							</div>
							<div className="space-y-2">
								<div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
								<div className="h-4 w-4/5 rounded bg-muted/40 animate-pulse" />
							</div>
						</div>
					))}
				</main>

				{/* Right Sidebar Skeleton */}
				<aside className="hidden xl:block w-72 shrink-0 space-y-4">
					<div className="h-64 rounded-2xl border border-border/80 bg-card p-4 space-y-3">
						<div className="h-4 w-32 rounded bg-muted/60 animate-pulse" />
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-3">
								<div className="h-14 w-10 rounded bg-muted/60 animate-pulse shrink-0" />
								<div className="space-y-1 flex-1">
									<div className="h-3.5 w-full rounded bg-muted/50 animate-pulse" />
									<div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
								</div>
							</div>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
