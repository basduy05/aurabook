import { Loader } from "@/ui/atoms/loader";

export function PageContentSkeleton() {
	return (
		<div className="container-content py-8 pb-16">
			<div className="mb-6 flex items-center justify-between">
				<div className="h-9 w-2/3 max-w-lg animate-pulse rounded bg-secondary" />
				<Loader size="sm" text="Đang tải nội dung..." />
			</div>
			<div className="prose mt-6 space-y-3">
				<div className="h-4 w-full animate-pulse rounded bg-secondary" />
				<div className="h-4 w-full animate-pulse rounded bg-secondary" />
				<div className="h-4 w-5/6 animate-pulse rounded bg-secondary" />
			</div>
		</div>
	);
}
