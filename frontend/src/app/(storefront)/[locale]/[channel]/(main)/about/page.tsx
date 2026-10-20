import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
	BookOpen,
	Compass,
	HeartHandshake,
	ShieldCheck,
	Sparkles,
	Award,
	Users,
	Library,
	ArrowRight,
	ChevronRight,
	Layers,
	BookHeart,
} from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { Logo } from "@/ui/components/shared/logo";
import { buildStorefrontPath } from "@/lib/storefront-path";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi
			? "Giới thiệu về AuraBook | Nền tảng tri thức & Không gian sách tinh tuyển"
			: "About AuraBook | Curated Books & Reading Culture",
		description: isVi
			? "Tìm hiểu về AuraBook — Hành trình kết nối độc giả với những tác phẩm chọn lọc, tôn vinh văn hóa đọc và bản quyền xuất bản tại Việt Nam."
			: "Learn more about AuraBook — A curated book ecosystem bringing readers and meaningful literature together.",
	};
}

function AboutPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="h-72 w-full rounded-3xl bg-muted mb-16" />
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-16">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="h-28 rounded-2xl bg-muted" />
				))}
			</div>
		</div>
	);
}

export default function AboutPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<AboutPageFallback />}>
			<AboutContent params={props.params} />
		</Suspense>
	);
}

async function AboutContent({
	params: paramsPromise,
}: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await paramsPromise;
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
					{isVi ? "Về Aurabook" : "About AuraBook"}
				</span>
			</nav>

			{/* Hero Section */}
			<div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-secondary/30 p-8 sm:p-12 lg:p-16 mb-16 shadow-xs">
				<div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
					<div className="max-w-2xl">
						<div className="flex flex-wrap items-center gap-3 mb-6">
							<div className="inline-flex items-center rounded-2xl border border-border/80 bg-background/90 px-4 py-2 shadow-2xs backdrop-blur-xs">
								<Logo className="h-7 sm:h-8 w-auto" />
							</div>
							<Badge variant="outline-solid" className="gap-1.5 px-3 py-1 text-xs font-semibold">
								<Sparkles className="h-3.5 w-3.5 text-primary" />
								{isVi ? "Câu chuyện thương hiệu" : "Brand Story"}
							</Badge>
						</div>
						<h1 className="text-3xl font-bold tracking-tight sm:text-5xl text-foreground leading-[1.15]">
							{isVi ? (
								<>
									Nơi Tri Thức Giao Thoa <br className="hidden sm:inline" />
									<span className="text-primary">Cùng Cảm Xúc Sống Động</span>
								</>
							) : (
								"Where Literature Meets Inspiration"
							)}
						</h1>
						<p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
							{isVi
								? "AuraBook được sáng lập với khát vọng tạo nên một không gian văn hóa đọc tinh tuyển, nơi mỗi cuốn sách không chỉ là một ấn phẩm vật lý, mà là một trải nghiệm chạm đến chiều sâu tâm hồn của từng độc giả."
								: "AuraBook was founded to build a curated haven for book lovers, where every page inspires meaningful reflection and personal growth."}
						</p>
						<div className="mt-8 flex flex-wrap items-center gap-4">
							<Link
								href={buildStorefrontPath(locale, channel, "/products")}
								className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
							>
								{isVi ? "Khám phá kho sách" : "Explore Books"}
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href={buildStorefrontPath(locale, channel, "/community")}
								className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary"
							>
								<Users className="h-4 w-4 text-primary" />
								{isVi ? "Cộng đồng độc giả" : "Join Community"}
							</Link>
						</div>
					</div>

					<div className="hidden lg:flex shrink-0 items-center justify-center">
						<div className="relative flex h-44 w-52 items-center justify-center rounded-3xl border border-border/80 bg-background/70 p-6 shadow-xs backdrop-blur-xs">
							<Logo className="h-12 w-auto" />
						</div>
					</div>
				</div>
			</div>

			{/* Key Metrics / Highlights */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6 mb-16">
				<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<Library className="h-5 w-5" />
					</div>
					<p className="text-2xl sm:text-3xl font-bold text-foreground">15,000+</p>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
						{isVi ? "Đầu sách tinh tuyển" : "Curated Titles"}
					</p>
				</div>
				<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<Users className="h-5 w-5" />
					</div>
					<p className="text-2xl sm:text-3xl font-bold text-foreground">50,000+</p>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
						{isVi ? "Độc giả đồng hành" : "Active Readers"}
					</p>
				</div>
				<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<Award className="h-5 w-5" />
					</div>
					<p className="text-2xl sm:text-3xl font-bold text-foreground">100+</p>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
						{isVi ? "Nhà xuất bản uy tín" : "Publishing Partners"}
					</p>
				</div>
				<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<ShieldCheck className="h-5 w-5" />
					</div>
					<p className="text-2xl sm:text-3xl font-bold text-foreground">100%</p>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
						{isVi ? "Bản quyền chính hãng" : "Authentic Copyright"}
					</p>
				</div>
			</div>

			{/* Vision & Mission */}
			<div className="mb-16 grid gap-8 md:grid-cols-2">
				<div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-xs">
					<div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
							<Compass className="h-5 w-5" />
						</div>
						<h2 className="text-xl font-bold text-foreground sm:text-2xl">
							{isVi ? "Tầm nhìn của chúng tôi" : "Our Vision"}
						</h2>
						<p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
							{isVi
								? "Trở thành hệ sinh thái văn hóa đọc hàng đầu tại Việt Nam, tiên phong kết hợp giữa nền tảng công nghệ số hiện đại và sự tinh tế trong phong cách phục vụ, để mỗi người yêu sách đều tìm thấy góc tri thức riêng cho mình."
								: "To become the premier reading culture ecosystem in Vietnam, seamlessly uniting cutting-edge digital shopping with the tactile beauty of literary curation."}
						</p>
					</div>
					<div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 text-xs font-semibold text-primary">
						<Layers className="h-4 w-4" />
						<span>{isVi ? "Đổi mới trải nghiệm văn hóa đọc" : "Pioneering modern literary culture"}</span>
					</div>
				</div>

				<div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-xs">
					<div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
							<BookHeart className="h-5 w-5" />
						</div>
						<h2 className="text-xl font-bold text-foreground sm:text-2xl">
							{isVi ? "Sứ mệnh cốt lõi" : "Our Mission"}
						</h2>
						<p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
							{isVi
								? "Gìn giữ và tôn vinh giá trị bản quyền; chắt lọc những tựa sách có chiều sâu tư tưởng, nghệ thuật và thực tiễn; đồng thời xây dựng một cộng đồng độc giả sẻ chia, yêu thích học hỏi và phát triển bản thân không ngừng."
								: "To uphold publishing integrity, curate books of profound intellectual and aesthetic value, and foster a warm, inclusive community of continuous learners."}
						</p>
					</div>
					<div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 text-xs font-semibold text-primary">
						<HeartHandshake className="h-4 w-4" />
						<span>{isVi ? "Đồng hành cùng sự phát triển cá nhân" : "Lifelong companion in personal growth"}</span>
					</div>
				</div>
			</div>

			{/* Core Values */}
			<div className="mb-16">
				<div className="text-center max-w-2xl mx-auto mb-10">
					<Badge variant="outline-solid" className="mb-3">
						{isVi ? "Giá trị cốt lõi" : "Core Values"}
					</Badge>
					<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						{isVi ? "Nguyên Tắc Tạo Nên Bản Sắc AuraBook" : "Principles That Define Us"}
					</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						{isVi
							? "Những giá trị định hướng mọi quyết định và dịch vụ chúng tôi đem lại cho bạn đọc."
							: "The guiding compass behind every book selected and delivered to your doorstep."}
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-transform hover:-translate-y-1">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
							<BookOpen className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-base font-semibold text-foreground">
							{isVi ? "Tuyển chọn tinh hoa" : "Curated Excellence"}
						</h3>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{isVi
								? "Mỗi cuốn sách xuất hiện trên kệ AuraBook đều trải qua quá trình đánh giá kỹ càng về chất lượng nội dung, dịch thuật và độ bền bản in."
								: "Every book is thoughtfully evaluated for thematic depth, translation fidelity, and printing craft."}
						</p>
					</div>

					<div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-transform hover:-translate-y-1">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
							<ShieldCheck className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-base font-semibold text-foreground">
							{isVi ? "Tuyệt đối tôn trọng bản quyền" : "100% Genuine & Licensed"}
						</h3>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{isVi
								? "Nói không với sách lậu, sách vi phạm bản quyền. Chúng tôi bảo vệ thành quả lao động của tác giả, dịch giả và các đơn vị xuất bản."
								: "Zero tolerance for counterfeit copies. We champion original authorship and fair publishing standards."}
						</p>
					</div>

					<div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-transform hover:-translate-y-1">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
							<Layers className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-base font-semibold text-foreground">
							{isVi ? "Đóng gói nâng niu" : "Careful Packaging"}
						</h3>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{isVi
								? "Mỗi đơn hàng được đóng gói với 3 lớp bảo vệ chuyên dụng: màng co chống thấm, bọc bóng khí chống móp góc và hộp carton định hình."
								: "Custom three-layer packaging ensuring your books arrive in pristine, unblemished condition."}
						</p>
					</div>

					<div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-transform hover:-translate-y-1">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
							<Users className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-base font-semibold text-foreground">
							{isVi ? "Cộng đồng sẻ chia" : "Engaging Community"}
						</h3>
						<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{isVi
								? "Không chỉ là mua bán, AuraBook mang đến không gian tương tác, trao đổi cảm nhận và kết nối những bạn đọc cùng chung sở thích."
								: "Beyond an online store, AuraBook fosters a vibrant space for book reviews, thoughts, and book club discussions."}
						</p>
					</div>
				</div>
			</div>

			{/* Publishing Partners */}
			<div className="rounded-2xl border border-border bg-secondary/30 p-8 sm:p-12 mb-16">
				<div className="text-center max-w-xl mx-auto mb-8">
					<h3 className="text-lg font-bold text-foreground sm:text-xl">
						{isVi ? "Đối tác xuất bản đồng hành" : "Our Esteemed Publishing Partners"}
					</h3>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground">
						{isVi
							? "Hợp tác chặt chẽ cùng các nhà xuất bản hàng đầu để mang đến những tác phẩm giá trị nhất."
							: "Proudly collaborating with renowned publishers to deliver exceptional works."}
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-muted-foreground font-semibold text-sm">
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">NXB Kim Đồng</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">Nhã Nam</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">NXB Trẻ</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">Alpha Books</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">Omega Plus</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">First News - Trí Việt</span>
					<span className="rounded-lg bg-background px-4 py-2 border border-border shadow-2xs">NXB Văn Học</span>
				</div>
			</div>

			{/* Contact & Support Banner */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
				<div>
					<h3 className="text-lg font-bold text-foreground">
						{isVi ? "Bạn có câu hỏi hoặc cần tư vấn chọn sách?" : "Have questions or need a recommendation?"}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{isVi
							? "Đội ngũ tư vấn viên am hiểu sách của AuraBook luôn sẵn lòng hỗ trợ bạn mọi lúc."
							: "Our dedicated literary support team is always here to assist you."}
					</p>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					<Link
						href={buildStorefrontPath(locale, channel, "/contact")}
						className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
					>
						{isVi ? "Liên hệ ngay" : "Contact Us"}
						<ArrowRight className="h-4 w-4" />
					</Link>
					<Link
						href={buildStorefrontPath(locale, channel, "/faq")}
						className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
					>
						{isVi ? "Xem câu hỏi thường gặp" : "Browse FAQs"}
					</Link>
				</div>
			</div>
		</div>
	);
}
