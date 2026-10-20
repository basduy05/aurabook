import { Loader } from "@/ui/atoms/loader";

export default function OrdersLoading() {
	return (
		<div className="container-content py-8 sm:py-12 animate-in fade-in-0 duration-200">
			<div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl shadow-2xs text-center">
				<Loader size="xl" text="Đang tải lịch sử đơn hàng của bạn..." />
				<p className="mt-2 text-xs text-muted-foreground">
					Đang kết nối hệ thống tra cứu đơn hàng và hóa đơn số
				</p>
			</div>
		</div>
	);
}
