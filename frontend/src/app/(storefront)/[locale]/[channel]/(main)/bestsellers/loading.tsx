import { Loader } from "@/ui/atoms/loader";

export default function BestsellersLoading() {
	return (
		<div className="container-content py-8 sm:py-12 animate-in fade-in-0 duration-200">
			<div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl shadow-2xs text-center mb-8">
				<Loader size="xl" text="Đang tải danh sách sách bán chạy nhất..." />
				<p className="mt-2 text-xs text-muted-foreground">
					Thống kê từ lượt mua thực tế và bảng xếp hạng độc giả tuần này
				</p>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
				{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
					<div key={i} className="space-y-3">
						<div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted/60" />
						<div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
						<div className="h-4 w-16 animate-pulse rounded bg-muted/40" />
					</div>
				))}
			</div>
		</div>
	);
}
