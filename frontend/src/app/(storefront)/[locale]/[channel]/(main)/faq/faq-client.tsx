"use client";

import { useState } from "react";
import {
	ChevronDown,
	Search,
	CreditCard,
	Truck,
	BookOpen,
	ShieldCheck,
	User,
	HelpCircle,
	Sparkles,
} from "lucide-react";

interface FaqItem {
	q: string;
	a: string;
	category: string;
}

const FAQS_VI: FaqItem[] = [
	// Đặt hàng & Mua sách
	{
		category: "order",
		q: "Tôi có cần tạo tài khoản để mua sách tại AuraBook không?",
		a: "Bạn hoàn toàn có thể mua hàng với tư cách khách (guest checkout). Tuy nhiên, chúng tôi khuyến khích bạn tạo tài khoản AuraBook để dễ dàng theo dõi hành trình đơn hàng, lưu lại tủ sách yêu thích và tích lũy điểm thưởng thành viên.",
	},
	{
		category: "order",
		q: "Làm thế nào để kiểm tra tình trạng đơn hàng của tôi?",
		a: "Sau khi đặt hàng thành công, bạn sẽ nhận được email xác nhận kèm mã vận đơn. Nếu bạn đã có tài khoản, hãy truy cập mục 'Đơn hàng của tôi' trong trang Tài khoản để xem chi tiết lộ trình vận chuyển theo thời gian thực.",
	},
	{
		category: "order",
		q: "Tôi có thể hủy hoặc thay đổi thông tin đơn hàng sau khi đặt không?",
		a: "Nếu đơn hàng chưa chuyển sang trạng thái 'Đang chuẩn bị hàng' hoặc 'Đã bàn giao vận chuyển', bạn có thể liên hệ ngay hotline 1900 6868 hoặc email support@aurabook.vn để nhân viên hỗ trợ cập nhật hoặc hủy đơn.",
	},

	// Thanh toán
	{
		category: "payment",
		q: "AuraBook hỗ trợ những phương thức thanh toán nào?",
		a: "AuraBook hỗ trợ đa dạng phương thức: Chuyển khoản VietQR tự động qua mã QR động, Cổng thanh toán VNPAY (Thẻ ATM nội địa, Thẻ quốc tế Visa/Mastercard/JCB), và Thanh toán khi nhận hàng (COD).",
	},
	{
		category: "payment",
		q: "Thanh toán chuyển khoản VietQR tự động mất bao lâu để xác nhận?",
		a: "Hệ thống VietQR của AuraBook tích hợp webhook ngân hàng tự động 24/7. Ngay sau khi bạn quét mã QR và chuyển khoản thành công, hệ thống sẽ xác nhận đơn hàng trong vòng 3 - 5 giây.",
	},
	{
		category: "payment",
		q: "Tôi có thể yêu cầu xuất hóa đơn VAT điện tử cho đơn hàng không?",
		a: "Có. Tại bước thanh toán, bạn chỉ cần tích chọn 'Yêu cầu xuất hóa đơn VAT' và nhập thông tin công ty/mã số thuế, hoặc liên hệ bộ phận hỗ trợ khách hàng trong vòng 48h kể từ khi đặt hàng.",
	},

	// Giao hàng & Vận chuyển
	{
		category: "shipping",
		q: "Thời gian giao hàng tiêu chuẩn là bao lâu?",
		a: "Đơn hàng nội thành Hà Nội: 1 - 2 ngày làm việc. Các tỉnh thành phía Bắc: 2 - 3 ngày. Khu vực miền Trung và miền Nam (bao gồm TP.HCM): 2 - 4 ngày làm việc thông qua đối tác vận chuyển Giao Hàng Nhanh (GHN).",
	},
	{
		category: "shipping",
		q: "Phí vận chuyển được tính như thế nào?",
		a: "Phí vận chuyển được tính toán tự động dựa trên khoảng cách địa lý và trọng lượng ấn phẩm. AuraBook áp dụng chính sách Miễn phí vận chuyển toàn quốc cho các đơn hàng từ 350.000đ trở lên.",
	},
	{
		category: "shipping",
		q: "Sách được đóng gói như thế nào để tránh móp góc, trầy bìa?",
		a: "Tất cả sách tại AuraBook đều được bọc màng co bảo vệ, gia cố bằng bóng khí chống sốc 2 lớp và đóng trong hộp carton cứng chuyên dụng, đảm bảo sách tới tay bạn luôn nguyên vẹn hoàn hảo.",
	},

	// Bản quyền & Chất lượng
	{
		category: "quality",
		q: "AuraBook có cam kết sách chính hãng 100% không?",
		a: "Chắc chắn. AuraBook chỉ nhập sách trực tiếp từ các Nhà xuất bản và Công ty phát hành chính thống (Kim Đồng, Nhã Nam, Trẻ, Alpha Books, Omega+...). Nói không tuyệt đối với sách photo, sách lậu vi phạm bản quyền.",
	},
	{
		category: "quality",
		q: "Nếu sách bị lỗi in ấn (thiếu trang, mờ chữ) thì xử lý thế nào?",
		a: "Trong trường hợp hãn hữu sách gặp lỗi kỹ thuật từ nhà xuất bản (như mất trang, ngược bìa, mực lem), AuraBook sẽ hỗ trợ gửi cuốn mới thay thế hoàn toàn miễn phí ngay tại nhà bạn.",
	},

	// Tài khoản & Cộng đồng
	{
		category: "account",
		q: "Tủ sách cá nhân (Bookshelf) hoạt động như thế nào?",
		a: "Tủ sách cá nhân cho phép bạn phân loại sách đang đọc, sách đã đọc xong và danh sách muốn mua (Wishlist). Bạn cũng có thể viết cảm nhận, review tác phẩm và chia sẻ với cộng đồng độc giả AuraBook.",
	},
	{
		category: "account",
		q: "Làm thế nào để đổi mật khẩu hoặc cập nhật thông tin cá nhân?",
		a: "Bạn đăng nhập vào tài khoản, truy cập mục 'Hồ sơ cá nhân' để cập nhật họ tên, số điện thoại, địa chỉ nhận hàng mặc định hoặc thay đổi mật khẩu bảo mật.",
	},
];

const FAQS_EN: FaqItem[] = [
	{
		category: "order",
		q: "Do I need an account to purchase books at AuraBook?",
		a: "You can check out as a guest. However, creating an AuraBook account allows you to track order shipments, manage your personal bookshelf, and earn member points.",
	},
	{
		category: "order",
		q: "How can I track my order status?",
		a: "After placing an order, you will receive a confirmation email with a tracking number. If you have an account, visit 'My Orders' in your profile for real-time tracking.",
	},
	{
		category: "payment",
		q: "What payment methods are supported?",
		a: "We support automated VietQR dynamic code transfers, VNPAY gateway (Local ATM cards, Visa/Mastercard/JCB), and Cash on Delivery (COD).",
	},
	{
		category: "shipping",
		q: "What is the standard shipping timeframe?",
		a: "Hanoi metropolitan: 1-2 business days. Northern provinces: 2-3 days. Central and Southern regions (including HCMC): 2-4 business days via GHN Logistics.",
	},
	{
		category: "quality",
		q: "Are all books 100% authentic?",
		a: "Yes. AuraBook sources exclusively from authorized Vietnamese and international publishers. We strictly uphold copyright integrity and guarantee authentic prints.",
	},
	{
		category: "account",
		q: "How does the personal Bookshelf work?",
		a: "Your digital Bookshelf lets you organize books into reading, read, and wishlist shelves, as well as share reviews with the AuraBook reader community.",
	},
];

export function FaqClient({ isVi = true }: { isVi?: boolean }) {
	const rawFaqs = isVi ? FAQS_VI : FAQS_EN;
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	const categories = isVi
		? [
				{ id: "all", label: "Tất cả câu hỏi", icon: Sparkles },
				{ id: "order", label: "Đặt hàng & Mua sách", icon: BookOpen },
				{ id: "payment", label: "Thanh toán & Hóa đơn", icon: CreditCard },
				{ id: "shipping", label: "Giao hàng & Đóng gói", icon: Truck },
				{ id: "quality", label: "Chất lượng & Bản quyền", icon: ShieldCheck },
				{ id: "account", label: "Tài khoản & Tủ sách", icon: User },
			]
		: [
				{ id: "all", label: "All Questions", icon: Sparkles },
				{ id: "order", label: "Ordering", icon: BookOpen },
				{ id: "payment", label: "Payments", icon: CreditCard },
				{ id: "shipping", label: "Shipping", icon: Truck },
				{ id: "quality", label: "Authenticity", icon: ShieldCheck },
				{ id: "account", label: "Account", icon: User },
			];

	const filteredFaqs = rawFaqs.filter((item) => {
		const matchCategory = activeCategory === "all" || item.category === activeCategory;
		const query = searchQuery.trim().toLowerCase();
		const matchQuery = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
		return matchCategory && matchQuery;
	});

	const toggleFaq = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<div>
			{/* Search Input */}
			<div className="relative mb-8 max-w-xl">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder={
						isVi
							? "Tìm kiếm thắc mắc (ví dụ: giao hàng, vietqr, tài khoản...)"
							: "Search FAQs (e.g. shipping, payment, order...)"
					}
					className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-all"
				/>
			</div>

			{/* Category Filter Pills */}
			<div className="mb-8 flex flex-wrap items-center gap-2">
				{categories.map((cat) => {
					const Icon = cat.icon;
					const isActive = activeCategory === cat.id;
					return (
						<button
							key={cat.id}
							type="button"
							onClick={() => {
								setActiveCategory(cat.id);
								setOpenIndex(null);
							}}
							className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
								isActive
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
							}`}
						>
							<Icon className="h-3.5 w-3.5" />
							{cat.label}
						</button>
					);
				})}
			</div>

			{/* FAQ Accordion List */}
			<div className="space-y-3 mb-12">
				{filteredFaqs.length === 0 ? (
					<div className="rounded-2xl border border-border bg-card p-10 text-center">
						<HelpCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
						<p className="text-base font-semibold text-foreground">
							{isVi ? "Không tìm thấy câu hỏi phù hợp" : "No matching questions found"}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{isVi
								? "Vui lòng thử tìm với từ khóa khác hoặc liên hệ trực tiếp với chúng tôi."
								: "Please try another keyword or contact our support team."}
						</p>
					</div>
				) : (
					filteredFaqs.map((faq, index) => {
						const isOpen = openIndex === index;
						return (
							<div
								key={index}
								className="overflow-hidden rounded-2xl border border-border bg-card transition-all shadow-2xs"
							>
								<button
									type="button"
									onClick={() => toggleFaq(index)}
									className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm sm:text-base font-semibold text-foreground hover:bg-secondary/20 transition-colors"
								>
									<span>{faq.q}</span>
									<ChevronDown
										className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
											isOpen ? "rotate-180 text-primary" : ""
										}`}
									/>
								</button>
								{isOpen && (
									<div className="border-t border-border/60 bg-secondary/10 px-5 pb-5 pt-3">
										<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
											{faq.a}
										</p>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
