import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ChevronRight, Headphones, Mail, Phone } from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { FaqClient } from "./faq-client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi ? "Câu hỏi thường gặp (FAQ) | AuraBook" : "Frequently Asked Questions (FAQ) | AuraBook",
		description: isVi
			? "Tổng hợp câu hỏi thường gặp về đơn hàng, thanh toán VietQR, thời gian giao hàng và tài khoản tại AuraBook."
			: "Frequently Asked Questions about orders, payments, delivery, and personal accounts at AuraBook.",
	};
}

function FaqPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="mb-10 h-24 max-w-3xl rounded-2xl bg-muted" />
			<div className="mb-8 h-12 max-w-xl rounded-2xl bg-muted" />
			<div className="space-y-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="h-16 rounded-2xl bg-muted" />
				))}
			</div>
		</div>
	);
}

export default function FaqPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<FaqPageFallback />}>
			<FaqContent params={props.params} />
		</Suspense>
	);
}

async function FaqContent(props: {
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
					{isVi ? "Câu hỏi thường gặp" : "FAQs"}
				</span>
			</nav>

			{/* Page Header */}
			<div className="mb-10 max-w-3xl">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant="outline-solid" className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
						<HelpCircle className="h-3.5 w-3.5 text-primary" />
						{isVi ? "Trung tâm trợ giúp" : "Help Center"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{isVi ? "Cập nhật định kỳ" : "Regularly updated"}
					</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
					{isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
				</h1>
				<p className="mt-3 text-base text-muted-foreground leading-relaxed">
					{isVi
						? "Tìm kiếm nhanh lời giải đáp cho những thắc mắc phổ biến về quy trình đặt sách, hình thức thanh toán VietQR, thời gian vận chuyển và quyền lợi độc giả."
						: "Quickly find answers to common questions about book ordering, VietQR payments, delivery times, and reader member benefits."}
				</p>
			</div>

			{/* Interactive FAQ Client */}
			<FaqClient isVi={isVi} />

			{/* Still need help? Contact Box */}
			<div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Headphones className="h-6 w-6" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-bold text-foreground">
								{isVi ? "Bạn chưa tìm thấy câu trả lời mình cần?" : "Still have questions?"}
							</h3>
							<p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
								{isVi
									? "Đừng ngần ngại liên hệ trực tiếp với chuyên viên tư vấn của AuraBook để nhận được sự hỗ trợ nhanh chóng và tận tình nhất."
									: "Our friendly support team is ready to help you with any questions."}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3 shrink-0">
						<Link
							href={buildStorefrontPath(locale, channel, "/contact")}
							className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
						>
							<Mail className="h-4 w-4" />
							{isVi ? "Gửi tin nhắn" : "Message Us"}
						</Link>
						<a
							href="tel:19006868"
							className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
						>
							<Phone className="h-4 w-4 text-primary" />
							1900 6868
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
