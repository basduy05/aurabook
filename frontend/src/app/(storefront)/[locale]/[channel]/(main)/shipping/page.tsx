import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
	Truck,
	PackageCheck,
	Clock,
	ChevronRight,
	CheckCircle2,
	Box,
	BadgeCheck,
} from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { buildStorefrontPath } from "@/lib/storefront-path";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi ? "Chính sách vận chuyển & Giao nhận | AuraBook" : "Shipping Policy | AuraBook",
		description: isVi
			? "Thông tin chi tiết về thời gian giao hàng, biểu phí vận chuyển GHN, quy cách đóng gói và quyền lợi đồng kiểm tại AuraBook."
			: "AuraBook Shipping Policy — delivery times, shipping rates, and packaging standards.",
	};
}

function ShippingPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="mb-10 h-28 max-w-3xl rounded-2xl bg-muted" />
			<div className="mb-12 h-44 rounded-2xl bg-muted" />
			<div className="space-y-6">
				<div className="h-48 rounded-2xl bg-muted" />
				<div className="h-48 rounded-2xl bg-muted" />
			</div>
		</div>
	);
}

export default function ShippingPolicyPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<ShippingPageFallback />}>
			<ShippingPolicyContent params={props.params} />
		</Suspense>
	);
}

async function ShippingPolicyContent(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await props.params;
	const isVi = locale === "vi";

	return (
		<div className="container-content py-10 pb-20">
			{/* Breadcrumb */}
			<nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
				<Link href={buildStorefrontPath(locale, channel)} className="hover:text-foreground transition-colors">
					{isVi ? "Trang chủ" : "Home"}
				</Link>
				<ChevronRight className="h-3 w-3" />
				<span className="text-foreground font-medium">
					{isVi ? "Chính sách vận chuyển" : "Shipping Policy"}
				</span>
			</nav>

			{/* Page Header */}
			<div className="mb-10 max-w-3xl">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant="outline-solid" className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
						<Truck className="h-3.5 w-3.5 text-primary" />
						{isVi ? "Đối tác vận chuyển GHN" : "GHN Express Partner"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{isVi ? "Cập nhật mới nhất: 2026" : "Updated: 2026"}
					</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
					{isVi ? "Chính sách vận chuyển & Giao nhận" : "Shipping & Delivery Policy"}
				</h1>
				<p className="mt-3 text-base text-muted-foreground leading-relaxed">
					{isVi
						? "AuraBook cam kết mang những cuốn sách nguyên vẹn, đẹp đẽ nhất đến tận tay bạn đọc với quy trình đóng gói nâng niu và dịch vụ chuyển phát nhanh chóng, an toàn trên toàn quốc."
						: "AuraBook is committed to delivering your books quickly, safely, and in immaculate packaging nationwide."}
				</p>
			</div>

			{/* Highlights Grid */}
			<div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
				<div className="grid gap-6 sm:grid-cols-4">
					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-2xs">
							<BadgeCheck className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{isVi ? "Freeship từ 350.000đ" : "Free Ship over 350k"}
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{isVi
								? "Miễn phí vận chuyển toàn quốc cho mọi đơn hàng đạt giá trị từ 350.000đ."
								: "Nationwide free shipping for all orders above 350,000 VND."}
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-2xs">
							<Box className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{isVi ? "Đóng gói 3 lớp bảo vệ" : "3-Layer Packaging"}
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{isVi
								? "Bọc màng co, lót bóng khí chống va đập góc và đóng hộp carton cứng cáp."
								: "Shrink-wrapped, corner bubble cushioning, and custom rigid carton boxes."}
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-2xs">
							<PackageCheck className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{isVi ? "Quyền đồng kiểm hàng" : "Inspection upon Delivery"}
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{isVi
								? "Bạn được kiểm tra ngoại quan gói hàng và sách trước khi thanh toán / ký nhận."
								: "Feel free to check parcel condition before accepting."}
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-2xs">
							<Clock className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{isVi ? "Giao nhanh 1 - 4 ngày" : "Fast 1-4 Days"}
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{isVi
								? "Giao nhanh từ Kho Tổng Hà Nội tới 63 tỉnh thành qua hệ thống Giao Hàng Nhanh."
								: "Dispatched from Hanoi Hub to all 63 provinces."}
						</p>
					</div>
				</div>
			</div>

			{/* Main Policy Content Sections */}
			<div className="space-y-10">
				{/* Section 1: Thời gian & Biểu phí */}
				<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
					<h2 className="text-xl font-bold text-foreground mb-4">
						{isVi ? "1. Biểu phí & Thời gian giao hàng ước tính" : "1. Shipping Rates & Estimated Timeframe"}
					</h2>
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-border text-xs font-semibold uppercase text-muted-foreground">
									<th className="py-3 pr-4">{isVi ? "Khu vực giao hàng" : "Region"}</th>
									<th className="py-3 px-4">{isVi ? "Thời gian dự kiến" : "Delivery Time"}</th>
									<th className="py-3 pl-4">{isVi ? "Cước phí chuẩn (Đơn < 350k)" : "Rate (< 350k)"}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60 text-foreground text-xs sm:text-sm">
								<tr>
									<td className="py-3.5 pr-4 font-medium">Hà Nội (Nội thành)</td>
									<td className="py-3.5 px-4 text-muted-foreground">1 - 2 ngày làm việc</td>
									<td className="py-3.5 pl-4 font-semibold text-primary">20.000đ</td>
								</tr>
								<tr>
									<td className="py-3.5 pr-4 font-medium">Các tỉnh miền Bắc</td>
									<td className="py-3.5 px-4 text-muted-foreground">2 - 3 ngày làm việc</td>
									<td className="py-3.5 pl-4 font-semibold text-primary">25.000đ - 30.000đ</td>
								</tr>
								<tr>
									<td className="py-3.5 pr-4 font-medium">Miền Trung & Miền Nam (gồm TP.HCM)</td>
									<td className="py-3.5 px-4 text-muted-foreground">2 - 4 ngày làm việc</td>
									<td className="py-3.5 pl-4 font-semibold text-primary">30.000đ</td>
								</tr>
								<tr className="bg-primary/5">
									<td className="py-3.5 pr-4 font-bold text-primary">
										{isVi ? "Đơn hàng từ 350.000đ trở lên" : "Orders above 350,000 VND"}
									</td>
									<td className="py-3.5 px-4 text-primary font-medium">{isVi ? "Toàn quốc" : "Nationwide"}</td>
									<td className="py-3.5 pl-4 font-bold text-success uppercase">{isVi ? "Miễn phí" : "FREE"}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* Section 2: Tiêu chuẩn đóng gói */}
				<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
					<h2 className="text-xl font-bold text-foreground mb-3">
						{isVi ? "2. Tiêu chuẩn đóng gói độc bản AuraBook" : "2. Packaging Standards"}
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						{isVi
							? "Chúng tôi hiểu rằng mỗi cuốn sách là một tác phẩm nghệ thuật vô giá đối với người sưu tầm. Quy trình đóng gói tại AuraBook tuân thủ nghiêm ngặt 3 bước bảo vệ:"
							: "Books are precious treasures. We protect every shipment with strict 3-step packaging:"}
					</p>
					<ul className="space-y-3 text-sm text-muted-foreground">
						<li className="flex items-start gap-2.5">
							<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
							<span>
								<strong className="text-foreground">Lớp 1 - Màng co nhiệt:</strong> Cố định mép sách, chống ẩm mốc và bụi bẩn trong quá trình lưu kho, vận chuyển.
							</span>
						</li>
						<li className="flex items-start gap-2.5">
							<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
							<span>
								<strong className="text-foreground">Lớp 2 - Đệm bóng khí đa lớp:</strong> Quấn bảo vệ 360 độ, tăng cường chống va đập cho các góc bìa sách.
							</span>
						</li>
						<li className="flex items-start gap-2.5">
							<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
							<span>
								<strong className="text-foreground">Lớp 3 - Hộp carton định hình:</strong> Hộp carton 3-5 lớp dập nổi dấu ấn AuraBook, niêm phong bằng băng keo an ninh.
							</span>
						</li>
					</ul>
				</div>

				{/* Section 3: Quy định đồng kiểm */}
				<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
					<h2 className="text-xl font-bold text-foreground mb-3">
						{isVi ? "3. Quyền đồng kiểm khi nhận hàng" : "3. Inspection Policy"}
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{isVi
							? "Nhân viên giao nhận của GHN sẽ chờ quý khách kiểm tra ngoại quan gói hàng (kiểm tra tình trạng hộp, số lượng sách bên trong). Quý khách lưu ý không bóc xé màng co hoặc đọc thử nội dung trước khi thanh toán. Nếu phát hiện kiện hàng bị ướt, móp méo nghiêm trọng hoặc sai sót số lượng, bạn có quyền từ chối nhận hàng và liên hệ ngay với hotline 1900 6868."
							: "You are encouraged to inspect the exterior condition of the parcel upon receiving from GHN couriers."}
					</p>
				</div>
			</div>
		</div>
	);
}
