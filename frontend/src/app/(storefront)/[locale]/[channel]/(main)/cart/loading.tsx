import { Loader } from "@/ui/atoms/loader";

export default function CartLoading() {
	return (
		<div className="container-content py-8 sm:py-12 animate-in fade-in-0 duration-200">
			<div className="mb-8">
				<div className="h-8 w-44 rounded-lg bg-muted/70 animate-pulse" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				<div className="lg:col-span-8 space-y-4">
					<div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl shadow-2xs text-center">
						<Loader size="xl" text="Đang đồng bộ hóa giỏ hàng và danh sách ấn phẩm..." />
						<p className="mt-2 text-xs text-muted-foreground">
							Vui lòng đợi giây lát trong khi chúng tôi chuẩn bị thông tin đơn hàng
						</p>
					</div>

					{[1, 2].map((i) => (
						<div key={i} className="flex gap-4 p-4 rounded-2xl border border-border bg-card">
							<div className="h-24 w-18 rounded-lg bg-muted/60 animate-pulse shrink-0" />
							<div className="space-y-2 flex-1">
								<div className="h-4 w-2/3 rounded bg-muted/60 animate-pulse" />
								<div className="h-4 w-24 rounded bg-muted/40 animate-pulse" />
							</div>
						</div>
					))}
				</div>

				<div className="lg:col-span-4 p-6 rounded-2xl border border-border bg-card space-y-4">
					<div className="h-6 w-32 rounded bg-muted/60 animate-pulse" />
					<div className="space-y-2">
						<div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
						<div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
					</div>
					<div className="h-12 w-full rounded-xl bg-muted/60 animate-pulse" />
				</div>
			</div>
		</div>
	);
}
