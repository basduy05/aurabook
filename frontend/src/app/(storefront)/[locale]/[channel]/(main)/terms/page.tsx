import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Scale, CreditCard, Truck, RefreshCcw, HelpCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { buildStorefrontPath } from "@/lib/storefront-path";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi ? "Điều khoản dịch vụ & Quy chế hoạt động | Aurabook" : "Terms of Service | Aurabook",
		description: isVi
			? "Điều khoản dịch vụ, quy chế giao dịch thương mại điện tử và chính sách mua sắm tại Aurabook."
			: "Aurabook Terms of Service and E-Commerce Operational Regulations.",
	};
}

function TermsPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="mb-10 h-28 max-w-3xl rounded-2xl bg-muted" />
			<div className="mb-12 h-44 rounded-2xl bg-muted" />
			<div className="space-y-6">
				<div className="h-44 rounded-2xl bg-muted" />
				<div className="h-44 rounded-2xl bg-muted" />
			</div>
		</div>
	);
}

export default function TermsPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<TermsPageFallback />}>
			<TermsContent params={props.params} />
		</Suspense>
	);
}

async function TermsContent(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await props.params;
	const isVi = locale === "vi";

	return (
		<div className="container-content py-10 pb-20">
			{/* Breadcrumb */}
			<nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
				<Link href={buildStorefrontPath(locale, channel)} className="hover:text-foreground transition-colors">
					{isVi ? "Trang chủ" : "Home"}
				</Link>
				<ChevronRight className="h-3 w-3" />
				<span className="text-foreground font-medium">
					{isVi ? "Điều khoản dịch vụ" : "Terms of Service"}
				</span>
			</nav>

			{/* Page Header */}
			<div className="mb-10 max-w-3xl">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant="outline-solid" className="gap-1 px-2.5 py-0.5 text-xs font-semibold">
						<Scale className="h-3.5 w-3.5 text-primary" />
						{isVi ? "Quy chế giao dịch chuẩn TMĐT" : "Standard E-Commerce Terms"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{isVi ? "Hiệu lực từ: 10/10/2026" : "Effective: Oct 10, 2026"}
					</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
					{isVi ? "Điều khoản dịch vụ & Mua sắm" : "Terms of Service"}
				</h1>
				<p className="mt-3 text-base text-muted-foreground leading-relaxed">
					{isVi
						? "Chào mừng bạn đến với Aurabook. Khi truy cập website, đăng ký tài khoản hoặc đặt mua sách và ấn phẩm trên hệ thống của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được nêu dưới đây."
						: "Welcome to Aurabook. By accessing our platform, creating an account, or placing orders, you agree to be bound by these terms and conditions."}
				</p>
			</div>

			{/* Highlights Grid */}
			<div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
				<div className="grid gap-6 sm:grid-cols-4">
					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-xs">
							<BookOpen className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">100% Sách chính hãng</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Mọi ấn phẩm phân phối đều có bản quyền, nguồn gốc xuất bản minh bạch.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-xs">
							<Truck className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">Giao hàng GHN</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Vận hành từ Kho Tổng Hà Nội, đồng kiểm khi nhận và hỗ trợ hỏa tốc nội thành.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-xs">
							<RefreshCcw className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">Đổi trả trong 7 ngày</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Đổi mới miễn phí nếu sách gặp lỗi in ấn, rách trang hoặc hư hại trong vận chuyển.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary shadow-xs">
							<CreditCard className="h-4 w-4" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">Thanh toán tiện lợi</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Chuyển khoản VietQR tức thì (SePay), COD nhận hàng trả tiền hoặc cổng trực tuyến.
						</p>
					</div>
				</div>
			</div>

			{/* Terms Layout */}
			<div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
				{/* Sidebar Navigation */}
				<aside className="hidden lg:block">
					<div className="sticky top-24 rounded-xl border border-border bg-card p-5 text-sm space-y-3">
						<div className="flex items-center gap-2 font-semibold text-foreground pb-2 border-b border-border">
							<Scale className="h-4 w-4 text-primary" />
							<span>Danh mục điều khoản</span>
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li>
								<a href="#dieu-1" className="hover:text-foreground transition-colors block py-1">
									1. Tài khoản & Trách nhiệm
								</a>
							</li>
							<li>
								<a href="#dieu-2" className="hover:text-foreground transition-colors block py-1">
									2. Quy trình đặt hàng & Xác nhận
								</a>
							</li>
							<li>
								<a href="#dieu-3" className="hover:text-foreground transition-colors block py-1">
									3. Giá bán & Thanh toán
								</a>
							</li>
							<li>
								<a href="#dieu-4" className="hover:text-foreground transition-colors block py-1">
									4. Giao nhận & Bưu kiện GHN
								</a>
							</li>
							<li>
								<a href="#dieu-5" className="hover:text-foreground transition-colors block py-1">
									5. Chính sách đồng kiểm & Đổi trả
								</a>
							</li>
							<li>
								<a href="#dieu-6" className="hover:text-foreground transition-colors block py-1">
									6. Quyền sở hữu trí tuệ
								</a>
							</li>
							<li>
								<a href="#dieu-7" className="hover:text-foreground transition-colors block py-1">
									7. Giải quyết tranh chấp
								</a>
							</li>
						</ul>
					</div>
				</aside>

				{/* Detail Sections */}
				<div className="lg:col-span-3 space-y-10 text-foreground leading-relaxed">
					<section id="dieu-1" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">1</span>
							Tài khoản người dùng & Trách nhiệm sử dụng
						</h2>
						<p className="text-sm text-muted-foreground">
							Khi đăng ký tài khoản tại Aurabook, bạn cam kết cung cấp thông tin chính xác, cập nhật và đầy đủ về họ tên, số điện thoại và địa chỉ giao nhận.
						</p>
						<ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
							<li>Bạn có trách nhiệm bảo mật mật khẩu tài khoản và các hoạt động phát sinh từ tài khoản của mình.</li>
							<li>Không sử dụng nền tảng cho bất kỳ mục đích bất hợp pháp, phát tán phần mềm độc hại hoặc xâm phạm quyền lợi của người khác.</li>
							<li>Aurabook có quyền tạm khóa hoặc đình chỉ tài khoản nếu phát hiện hành vi gian lận hoặc vi phạm nghiêm trọng quy chế hoạt động.</li>
						</ul>
					</section>

					<section id="dieu-2" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">2</span>
							Quy trình đặt mua hàng hóa & Xác nhận giao dịch
						</h2>
						<p className="text-sm text-muted-foreground">
							Quy trình mua sách trên website Aurabook diễn ra theo các bước sau:
						</p>
						<div className="space-y-2 text-sm text-muted-foreground">
							<div className="flex items-start gap-2.5">
								<CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
								<span><strong>Bước 1:</strong> Độc giả duyệt danh mục sách, chọn ấn phẩm và thêm vào giỏ hàng.</span>
							</div>
							<div className="flex items-start gap-2.5">
								<CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
								<span><strong>Bước 2:</strong> Nhập thông tin nhận hàng (số nhà, tên đường, xã/phường, quận/huyện, tỉnh/thành phố). Hệ thống hỗ trợ định vị GPS tự động nhận diện khu vực nội thành/ngoại thành.</span>
							</div>
							<div className="flex items-start gap-2.5">
								<CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
								<span><strong>Bước 3:</strong> Lựa chọn phương thức giao nhận phù hợp và hoàn tất thanh toán.</span>
							</div>
							<div className="flex items-start gap-2.5">
								<CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
								<span><strong>Bước 4:</strong> Hệ thống tự động gửi email xác nhận kèm mã đơn hàng và mã vận đơn theo dõi hành trình trực tuyến.</span>
							</div>
						</div>
					</section>

					<section id="dieu-3" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">3</span>
							Giá cả, Khuyến mãi & Phương thức thanh toán
						</h2>
						<p className="text-sm text-muted-foreground">
							Giá sản phẩm niêm yết trên website là giá đã bao gồm thuế giá trị gia tăng (VAT) theo quy định hiện hành, chưa bao gồm cước vận chuyển (nếu có).
						</p>
						<ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
							<li><strong>Miễn phí vận chuyển (Freeship):</strong> Áp dụng cho các đơn hàng có giá trị từ 500.000 ₫ trở lên trên phạm vi toàn quốc.</li>
							<li><strong>Thanh toán VietQR / Chuyển khoản (SePay):</strong> Quét mã QR thanh toán tức thì, hệ thống ghi nhận và chuyển trạng thái đơn hàng hoàn toàn tự động.</li>
							<li><strong>Thanh toán khi nhận hàng (COD):</strong> Người nhận kiểm tra bưu kiện và thanh toán tiền mặt cho shipper GHN khi nhận bưu phẩm.</li>
						</ul>
					</section>

					<section id="dieu-4" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">4</span>
							Chính sách vận chuyển & Giao nhận qua GHN
						</h2>
						<p className="text-sm text-muted-foreground">
							Mọi đơn hàng của Aurabook được điều phối trực tiếp từ <strong>Kho Tổng Aurabook Hà Nội</strong> (Số 12 Duy Tân, Cầu Giấy, Hà Nội) thông qua đối tác vận chuyển Giao Hàng Nhanh (GHN):
						</p>
						<div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
							<div className="rounded-xl border border-border bg-card p-4">
								<h4 className="font-semibold text-foreground text-xs uppercase tracking-wide text-primary mb-1">
									Khu vực Nội thành Hà Nội
								</h4>
								<p className="text-muted-foreground mb-2">Áp dụng cho 12 quận nội thành chính thức.</p>
								<ul className="text-muted-foreground space-y-1 list-disc pl-4">
									<li><strong>Hỏa tốc:</strong> Giao siêu tốc trong 2 - 4 giờ làm việc.</li>
									<li><strong>Tiêu chuẩn:</strong> Giao trong ngày hoặc ngày kế tiếp.</li>
									<li>Cước phí ưu đãi nội thành từ 16.500 ₫.</li>
								</ul>
							</div>
							<div className="rounded-xl border border-border bg-card p-4">
								<h4 className="font-semibold text-foreground text-xs uppercase tracking-wide text-primary mb-1">
									Khu vực Ngoại thành & Toàn quốc
								</h4>
								<p className="text-muted-foreground mb-2">Huyện ngoại thành Hà Nội và 62 tỉnh/thành phố khác.</p>
								<ul className="text-muted-foreground space-y-1 list-disc pl-4">
									<li><strong>Thời gian:</strong> 1 - 3 ngày làm việc tùy khu vực bưu cục.</li>
									<li><strong>Cước phí:</strong> Tính tự động theo trọng lượng và cự ly của GHN.</li>
									<li>Cập nhật hành trình chi tiết qua API đối soát GHN.</li>
								</ul>
							</div>
						</div>
					</section>

					<section id="dieu-5" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">5</span>
							Chính sách đồng kiểm & Đổi trả hàng hóa
						</h2>
						<p className="text-sm text-muted-foreground">
							Aurabook khuyến khích độc giả kiểm tra bưu kiện ngay khi nhận hàng từ nhân viên phát GHN:
						</p>
						<ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
							<li><strong>Quyền đồng kiểm:</strong> Khách hàng được quyền kiểm tra ngoại quan gói sách (đúng tựa đề, số lượng, tình trạng bìa) trước khi thanh toán tiền hoặc ký nhận.</li>
							<li><strong>Điều kiện đổi trả:</strong> Sách bị lỗi kỹ thuật nhà xuất bản (trùng trang, thiếu trang, mất chữ), sách bị ướt/hư hại do vận chuyển hoặc giao sai tựa sách đặt mua.</li>
							<li><strong>Thời hạn giải quyết:</strong> Độc giả gửi thông báo yêu cầu đổi trả trong vòng <strong>07 ngày</strong> kể từ ngày bưu phẩm hiển thị trạng thái "Hoàn tất (Completed)".</li>
							<li><strong>Chi phí đổi trả:</strong> Aurabook chịu 100% phí vận chuyển phát sinh khi đổi trả do lỗi sản phẩm hoặc lỗi vận chuyển.</li>
						</ul>
					</section>

					<section id="dieu-6" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">6</span>
							Quyền sở hữu trí tuệ
						</h2>
						<p className="text-sm text-muted-foreground">
							Toàn bộ nội dung hiển thị trên Aurabook bao gồm logo, thương hiệu, hình ảnh bìa sách, bản thiết kế giao diện, mã nguồn, nội dung bài viết và đánh giá đều thuộc quyền sở hữu của Aurabook hoặc các đối tác xuất bản hợp pháp. Nghiêm cấm mọi hành vi sao chép, trích xuất dữ liệu tự động hoặc tái bản vì mục đích thương mại mà không có sự đồng ý bằng văn bản của Aurabook.
						</p>
					</section>

					<section id="dieu-7" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">7</span>
							Hỗ trợ khách hàng & Giải quyết tranh chấp
						</h2>
						<p className="text-sm text-muted-foreground">
							Mọi tranh chấp phát sinh trong quá trình giao dịch tại Aurabook trước hết sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải nhằm đảm bảo quyền lợi tốt nhất cho người tiêu dùng.
						</p>
						<div className="rounded-xl border border-border bg-card p-5 text-sm space-y-3">
							<div className="flex items-center gap-3">
								<HelpCircle className="h-4 w-4 text-primary shrink-0" />
								<span>Trung tâm hỗ trợ khách hàng: <strong className="text-foreground">support@aurabook.vn</strong></span>
							</div>
							<div className="flex items-center gap-3">
								<CreditCard className="h-4 w-4 text-primary shrink-0" />
								<span>Đường dây nóng khiếu nại đơn hàng: <strong className="text-foreground">0912 345 678</strong></span>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
