import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, RefreshCw, FileText, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { buildStorefrontPath } from "@/lib/storefront-path";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const isVi = locale === "vi";
	return {
		title: isVi ? "Chính sách bảo mật thông tin | Aurabook" : "Privacy Policy | Aurabook",
		description: isVi
			? "Chính sách bảo mật thông tin và dữ liệu cá nhân của Aurabook, tuân thủ Nghị định 13/2023/NĐ-CP."
			: "Aurabook Privacy Policy and Personal Data Protection statement.",
	};
}

function PrivacyPageFallback() {
	return (
		<div className="container-content py-10 pb-20 animate-pulse">
			<div className="mb-6 h-4 w-36 rounded bg-muted" />
			<div className="mb-10 h-28 max-w-3xl rounded-2xl bg-muted" />
			<div className="space-y-6">
				<div className="h-44 rounded-2xl bg-muted" />
				<div className="h-44 rounded-2xl bg-muted" />
			</div>
		</div>
	);
}

export default function PrivacyPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<Suspense fallback={<PrivacyPageFallback />}>
			<PrivacyContent params={props.params} />
		</Suspense>
	);
}

async function PrivacyContent(props: {
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
					{isVi ? "Chính sách bảo mật" : "Privacy Policy"}
				</span>
			</nav>

			{/* Page Header */}
			<div className="mb-10 max-w-3xl">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant="outline-solid" className="gap-1 px-2.5 py-0.5 text-xs font-semibold">
						<ShieldCheck className="h-3.5 w-3.5 text-success" />
						{isVi ? "Tuân thủ Nghị định 13/2023/NĐ-CP" : "Data Protection Compliant"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{isVi ? "Cập nhật lần cuối: 10/10/2026" : "Last updated: Oct 10, 2026"}
					</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
					{isVi ? "Chính sách bảo mật thông tin" : "Privacy Policy"}
				</h1>
				<p className="mt-3 text-base text-muted-foreground leading-relaxed">
					{isVi
						? "Aurabook trân trọng và cam kết bảo vệ tuyệt đối dữ liệu cá nhân của quý độc giả. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, bảo vệ và xử lý thông tin cá nhân của bạn khi trải nghiệm nền tảng thư viện và nhà sách Aurabook."
						: "At Aurabook, we respect and are committed to protecting your personal data. This Privacy Policy outlines how your personal information is collected, used, and safeguarded across our platform."}
				</p>
			</div>

			{/* Highlight Card */}
			<div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="flex gap-4 items-start">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-primary shadow-xs">
							<Lock className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-semibold text-foreground">Mã hóa toàn diện</h3>
							<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
								Mọi giao dịch thanh toán và thông tin khách hàng được mã hóa chuẩn SSL/TLS 256-bit an toàn.
							</p>
						</div>
					</div>
					<div className="flex gap-4 items-start">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-primary shadow-xs">
							<Eye className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-semibold text-foreground">Minh bạch thu thập</h3>
							<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
								Chỉ thu thập dữ liệu phục vụ xử lý đơn hàng và giao nhận qua đối tác vận chuyển chính thức.
							</p>
						</div>
					</div>
					<div className="flex gap-4 items-start">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-primary shadow-xs">
							<RefreshCw className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-semibold text-foreground">Quyền làm chủ dữ liệu</h3>
							<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
								Độc giả có toàn quyền truy cập, chỉnh sửa, yêu cầu trích xuất hoặc xóa dữ liệu cá nhân bất kỳ lúc nào.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Layout */}
			<div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
				{/* Table of Contents - Desktop Sticky */}
				<aside className="hidden lg:block">
					<div className="sticky top-24 rounded-xl border border-border bg-card p-5 text-sm space-y-3">
						<div className="flex items-center gap-2 font-semibold text-foreground pb-2 border-b border-border">
							<FileText className="h-4 w-4 text-primary" />
							<span>Mục lục chính sách</span>
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li>
								<a href="#muc-1" className="hover:text-foreground transition-colors block py-1">
									1. Mục đích thu thập dữ liệu
								</a>
							</li>
							<li>
								<a href="#muc-2" className="hover:text-foreground transition-colors block py-1">
									2. Phạm vi thông tin thu thập
								</a>
							</li>
							<li>
								<a href="#muc-3" className="hover:text-foreground transition-colors block py-1">
									3. Thời gian lưu trữ & bảo mật
								</a>
							</li>
							<li>
								<a href="#muc-4" className="hover:text-foreground transition-colors block py-1">
									4. Chia sẻ thông tin với bên thứ ba
								</a>
							</li>
							<li>
								<a href="#muc-5" className="hover:text-foreground transition-colors block py-1">
									5. Quyền của chủ thể dữ liệu
								</a>
							</li>
							<li>
								<a href="#muc-6" className="hover:text-foreground transition-colors block py-1">
									6. Thông tin liên hệ giải đáp
								</a>
							</li>
						</ul>
					</div>
				</aside>

				{/* Detailed Policy Sections */}
				<div className="lg:col-span-3 space-y-10 text-foreground leading-relaxed">
					<section id="muc-1" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">1</span>
							Mục đích thu thập dữ liệu cá nhân
						</h2>
						<p className="text-sm text-muted-foreground">
							Aurabook thu thập và xử lý dữ liệu cá nhân của người dùng cho các mục đích hợp pháp sau đây:
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
							<li>
								<strong className="text-foreground">Xử lý và hoàn tất đơn đặt hàng:</strong> Xác nhận đặt mua sách, xử lý thanh toán trực tuyến qua VietQR/SePay, xuất hóa đơn chứng từ.
							</li>
							<li>
								<strong className="text-foreground">Giao nhận bưu kiện:</strong> Phối hợp với đối tác giao nhận Giao Hàng Nhanh (GHN) để giao sách chính xác đến số nhà, xã/phường, quận/huyện của độc giả.
							</li>
							<li>
								<strong className="text-foreground">Chăm sóc khách hàng:</strong> Giải quyết khiếu nại, phản hồi thắc mắc, xử lý đổi trả hoặc hoàn tiền theo quy định.
							</li>
							<li>
								<strong className="text-foreground">Tối ưu trải nghiệm độc giả:</strong> Đề xuất danh mục sách phù hợp, nâng cấp giao diện và độ mượt mà khi mua sắm.
							</li>
						</ul>
					</section>

					<section id="muc-2" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">2</span>
							Phạm vi thông tin thu thập
						</h2>
						<p className="text-sm text-muted-foreground">
							Các thông tin cá nhân được thu thập bao gồm:
						</p>
						<div className="grid gap-3 sm:grid-cols-2 text-sm pt-1">
							<div className="rounded-xl border border-border bg-card p-4">
								<h4 className="font-semibold text-foreground text-xs uppercase tracking-wide text-primary mb-2">
									Thông tin định danh & liên lạc
								</h4>
								<ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
									<li>Họ và tên độc giả</li>
									<li>Địa chỉ email</li>
									<li>Số điện thoại nhận hàng</li>
									<li>Mật khẩu tài khoản (được mã hóa một chiều bCrypt)</li>
								</ul>
							</div>
							<div className="rounded-xl border border-border bg-card p-4">
								<h4 className="font-semibold text-foreground text-xs uppercase tracking-wide text-primary mb-2">
									Thông tin giao nhận & địa chỉ
								</h4>
								<ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
									<li>Tọa độ GPS (khi người dùng chủ động cho phép định vị)</li>
									<li>Số nhà, tên đường, ngõ ngách chi tiết</li>
									<li>Phường / Xã, Quận / Huyện, Tỉnh / Thành phố</li>
									<li>Ghi chú giao hàng của người nhận</li>
								</ul>
							</div>
						</div>
					</section>

					<section id="muc-3" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">3</span>
							Thời gian lưu trữ & Biện pháp an toàn bảo mật
						</h2>
						<p className="text-sm text-muted-foreground">
							Dữ liệu cá nhân của thành viên sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ hoặc tự thành viên đăng nhập và thực hiện hủy bỏ. Trong mọi trường hợp khác, dữ liệu cá nhân của người dùng sẽ được bảo mật trên máy chủ cơ sở dữ liệu của Aurabook.
						</p>
						<div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
							<p>
								🔒 <strong>Bảo mật máy chủ:</strong> Hệ thống lưu trữ dữ liệu tuân thủ mô hình phân quyền Role-Based Access Control (RBAC), kiểm toán nhật ký truy cập (Audit Logging).
							</p>
							<p>
								🛡️ <strong>Thanh toán an toàn:</strong> Aurabook không lưu trữ thông tin thẻ ngân hàng hay số tài khoản trực tiếp của khách hàng. Mọi giao dịch được xử lý an toàn qua cổng thanh toán được Ngân hàng Nhà nước cấp phép.
							</p>
						</div>
					</section>

					<section id="muc-4" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">4</span>
							Chia sẻ thông tin với đơn vị liên kết & Bên thứ ba
						</h2>
						<p className="text-sm text-muted-foreground">
							Aurabook cam kết không bán, chia sẻ dẫn đến làm lộ thông tin cá nhân của bạn vì mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp cần thiết sau:
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
							<li>
								<strong>Đối tác giao vận (Giao Hàng Nhanh - GHN):</strong> Cung cấp Họ tên, Số điện thoại và Địa chỉ nhận hàng để shipper bưu tá thực hiện phát bưu phẩm.
							</li>
							<li>
								<strong>Đối tác cổng thanh toán:</strong> Phục vụ đối soát mã thanh toán chuyển khoản đơn hàng.
							</li>
							<li>
								<strong>Cơ quan tư pháp có thẩm quyền:</strong> Khi có văn bản yêu cầu chính thức từ cơ quan nhà nước theo quy định của pháp luật Việt Nam.
							</li>
						</ul>
					</section>

					<section id="muc-5" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">5</span>
							Quyền của chủ thể dữ liệu (Nghị định 13/2023/NĐ-CP)
						</h2>
						<p className="text-sm text-muted-foreground">
							Căn cứ theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, độc giả Aurabook có đầy đủ các quyền:
						</p>
						<div className="grid gap-2.5 sm:grid-cols-2 text-xs">
							<div className="rounded-lg border border-border p-3">
								<p className="font-semibold text-foreground">1. Quyền được biết & đồng ý</p>
								<p className="text-muted-foreground mt-0.5">Biết rõ mục đích, loại dữ liệu được thu thập trước khi đồng ý chia sẻ.</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="font-semibold text-foreground">2. Quyền truy cập & chỉnh sửa</p>
								<p className="text-muted-foreground mt-0.5">Tự do xem, cập nhật thông tin địa chỉ, hồ sơ trong trang quản lý tài khoản.</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="font-semibold text-foreground">3. Quyền xóa dữ liệu</p>
								<p className="text-muted-foreground mt-0.5">Yêu cầu xóa vĩnh viễn dữ liệu cá nhân khi ngừng sử dụng dịch vụ.</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="font-semibold text-foreground">4. Quyền khiếu nại & bồi thường</p>
								<p className="text-muted-foreground mt-0.5">Khiếu nại với cơ quan chức năng nếu phát hiện dữ liệu bị sử dụng sai mục đích.</p>
							</div>
						</div>
					</section>

					<section id="muc-6" className="scroll-mt-24 space-y-3">
						<h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground border-b border-border pb-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">6</span>
							Bộ phận tiếp nhận & giải quyết thắc mắc
						</h2>
						<p className="text-sm text-muted-foreground">
							Mọi yêu cầu thực thi quyền dữ liệu cá nhân hoặc phản hồi về chính sách bảo mật, quý độc giả vui lòng liên hệ Bộ phận An toàn Dữ liệu Aurabook qua:
						</p>
						<div className="rounded-xl border border-border bg-card p-5 text-sm space-y-3 mt-2">
							<div className="flex items-center gap-3">
								<Mail className="h-4 w-4 text-primary shrink-0" />
								<span>Email chuyên trách: <strong className="text-foreground">privacy@aurabook.vn</strong></span>
							</div>
							<div className="flex items-center gap-3">
								<Phone className="h-4 w-4 text-primary shrink-0" />
								<span>Tổng đài hỗ trợ: <strong className="text-foreground">0912 345 678</strong> (8:00 - 21:00 hàng ngày)</span>
							</div>
							<div className="flex items-center gap-3">
								<MapPin className="h-4 w-4 text-primary shrink-0" />
								<span>Văn phòng điều hành: <span className="text-muted-foreground">Số 12 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội</span></span>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
