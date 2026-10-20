import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
	Mail,
	Phone,
	MapPin,
	Clock,
	ChevronRight,
	HelpCircle,
	Headphones,
} from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { ContactFormClient } from "./contact-form-client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi ? "Liên hệ AuraBook | Hỗ trợ độc giả & Hợp tác xuất bản" : "Contact AuraBook | Reader Support & Partnerships",
		description: isVi
			? "Liên hệ với đội ngũ AuraBook — Hỗ trợ đơn hàng, giải đáp thắc mắc, phản hồi dịch vụ và cơ hội hợp tác xuất bản."
			: "Get in touch with AuraBook support and editorial team.",
	};
}

function ContactPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="mb-12 h-28 max-w-3xl rounded-2xl bg-muted" />
			<div className="grid gap-10 lg:grid-cols-12">
				<div className="h-96 rounded-2xl bg-muted lg:col-span-5" />
				<div className="h-96 rounded-2xl bg-muted lg:col-span-7" />
			</div>
		</div>
	);
}

export default function ContactPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<ContactPageFallback />}>
			<ContactContent params={props.params} />
		</Suspense>
	);
}

async function ContactContent(props: {
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
					{isVi ? "Liên hệ" : "Contact Us"}
				</span>
			</nav>

			{/* Page Header */}
			<div className="mb-12 max-w-3xl">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant="outline-solid" className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
						<Headphones className="h-3.5 w-3.5 text-primary" />
						{isVi ? "Hỗ trợ 7 ngày trong tuần" : "7-Day Support"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{isVi ? "Phản hồi trong 2 giờ" : "Replies within 2 hours"}
					</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
					{isVi ? "Liên hệ với AuraBook" : "Get in Touch with AuraBook"}
				</h1>
				<p className="mt-3 text-base text-muted-foreground leading-relaxed">
					{isVi
						? "Chúng tôi luôn ở đây để lắng nghe bạn. Cho dù bạn cần tư vấn chọn sách, hỏi thông tin vận chuyển đơn hàng, hay quan tâm đến hợp tác xuất bản — xin đừng ngần ngại gửi tin nhắn cho chúng tôi."
						: "We are always here to assist you with order inquiries, book consultations, or publishing partnerships."}
				</p>
			</div>

			{/* Contact Content Grid */}
			<div className="grid gap-10 lg:grid-cols-12 mb-16">
				{/* Info Column (5 cols) */}
				<div className="lg:col-span-5 space-y-6">
					{/* Main Contact Card */}
					<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
						<h2 className="text-lg font-bold text-foreground mb-6">
							{isVi ? "Kênh liên lạc trực tiếp" : "Direct Channels"}
						</h2>

						<div className="space-y-6">
							<div className="flex items-start gap-3.5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Phone className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{isVi ? "Hotline hỗ trợ" : "Customer Hotline"}
									</p>
									<a
										href="tel:19006868"
										className="text-base font-bold text-foreground hover:text-primary transition-colors"
									>
										1900 6868
									</a>
									<p className="text-xs text-muted-foreground mt-0.5">
										{isVi ? "Cước phí: 1.000đ/phút (08:00 - 21:30)" : "Daily: 08:00 - 21:30"}
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3.5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Mail className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{isVi ? "Email độc giả" : "Support Email"}
									</p>
									<a
										href="mailto:support@aurabook.vn"
										className="text-base font-bold text-foreground hover:text-primary transition-colors"
									>
										support@aurabook.vn
									</a>
									<p className="text-xs text-muted-foreground mt-0.5">
										{isVi ? "Hợp tác: partners@aurabook.vn" : "Partners: partners@aurabook.vn"}
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3.5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Clock className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{isVi ? "Giờ làm việc" : "Working Hours"}
									</p>
									<p className="text-sm font-semibold text-foreground">
										{isVi ? "Thứ 2 - Chủ Nhật: 08:00 - 21:30" : "Mon - Sun: 08:00 - 21:30"}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{isVi ? "Kể cả các ngày cuối tuần & lễ tết" : "Including weekends & holidays"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Locations Card */}
					<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
						<h2 className="text-lg font-bold text-foreground mb-4">
							{isVi ? "Văn phòng & Không gian trưng bày" : "Offices & Showrooms"}
						</h2>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
								<div>
									<p className="text-xs font-bold text-foreground">Hà Nội (Trụ sở chính & Kho trung tâm)</p>
									<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
										Tầng 3, Tòa nhà Tri Thức, 144 Xuân Thủy, Cầu Giấy, Hà Nội
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
								<div>
									<p className="text-xs font-bold text-foreground">TP. Hồ Chí Minh (Chi nhánh miền Nam)</p>
									<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
										282 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Form Column (7 cols) */}
				<div className="lg:col-span-7">
					<div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
						<div className="mb-6">
							<h2 className="text-xl font-bold text-foreground">
								{isVi ? "Gửi lời nhắn cho AuraBook" : "Leave us a message"}
							</h2>
							<p className="mt-1 text-xs sm:text-sm text-muted-foreground">
								{isVi
									? "Điền thông tin dưới đây, chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất."
									: "Fill in the details below and we will get back to you shortly."}
							</p>
						</div>
						<ContactFormClient isVi={isVi} />
					</div>
				</div>
			</div>

			{/* Quick FAQ Link Banner */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-primary shadow-2xs">
						<HelpCircle className="h-5 w-5" />
					</div>
					<div>
						<h3 className="text-base font-semibold text-foreground">
							{isVi ? "Bạn cần giải đáp câu hỏi nhanh?" : "Need a quick answer?"}
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground">
							{isVi
								? "Tra cứu các câu hỏi thường gặp về thanh toán, tài khoản, đóng gói và giao hàng."
								: "Check our FAQ section for common questions regarding shipping and orders."}
						</p>
					</div>
				</div>
				<Link
					href={buildStorefrontPath(locale, channel, "/faq")}
					className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground border border-border hover:bg-secondary transition-colors shrink-0"
				>
					{isVi ? "Xem câu hỏi thường gặp" : "View FAQs"}
					<ChevronRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}
