"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	Mic,
	MicOff,
	PhoneOff,
	PhoneCall,
	Phone,
	X,
	ShieldCheck,
	BookOpen,
	Send,
	Volume2,
	VolumeX,
	ExternalLink,
	Star,
	Truck,
	MessageSquare,
	Keyboard,
	ArrowLeft,
	RotateCcw,
	HelpCircle,
	ShoppingCart,
	Check,
	User,
	AlertCircle,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Badge } from "@/ui/components/ui/badge";
import { Loader } from "@/ui/atoms/loader";
import { cn } from "@/lib/utils";

interface BookVariantOption {
	id: string;
	name: string;
	type: "ebook" | "physical";
	sku: string;
	price: string;
	originalPrice?: string;
}

interface BookProductData {
	id: string;
	title: string;
	originalTitle: string;
	author: string;
	price: string;
	originalPrice: string;
	ebookPrice?: string;
	physicalPrice?: string;
	rating: number;
	reviewCount: number;
	coverImage: string;
	readerUrl: string;
	slug: string;
	badge: string;
	description: string;
	variants?: BookVariantOption[];
}

interface OrderData {
	orderCode: string;
	status: string;
	statusStep: number;
	carrier: string;
	trackingCode: string;
	estimate: string;
	items: string;
	total: string;
}

interface DRMData {
	standard: string;
	singleTabLock: string;
	maxDevices: string;
	formats: string;
	licenseStatus: string;
}

interface MessageCard {
	type: "product" | "order" | "drm" | "reader-feature";
	data: any;
}

interface Message {
	id: string;
	sender: "user" | "agent" | "system";
	text: string;
	timestamp: string;
	cards?: MessageCard[];
	audioBase64?: string;
	thinking?: string;
}

// 4 Chủ đề khảo sát trước phiên
const INTAKE_TOPICS = [
	{
		id: "book-advisory",
		title: "Tư vấn chọn sách & Sách bán chạy",
		desc: "Tìm sách phát triển bản thân, tâm lý học, kinh doanh hoặc sách kinh điển",
		icon: BookOpen,
	},
	{
		id: "order-tracking",
		title: "Tra cứu đơn hàng & Thời gian giao hàng",
		desc: "Kiểm tra tiến độ vận chuyển đơn hàng GHN, thời gian nhận sách",
		icon: Truck,
	},
	{
		id: "drm-reading",
		title: "Bản quyền Readium LCP & Đọc Web Reader",
		desc: "Hướng dẫn đọc sách bảo mật đơn tab, giấy phép đọc trên 6 thiết bị",
		icon: ShieldCheck,
	},
	{
		id: "general-support",
		title: "Chính sách mua hàng & Thắc mắc khác",
		desc: "Phương thức thanh toán, đổi trả trong 7 ngày, hỗ trợ tài khoản độc giả",
		icon: HelpCircle,
	},
];

export const DYNAMIC_FEEDBACK_TAGS: Record<number, string[]> = {
	1: [
		"⚠️ Phản hồi chưa chính xác",
		"🐢 Tốc độ phản hồi còn chậm",
		"❌ Chưa hiểu đúng câu hỏi",
		"📖 Gợi ý sách chưa phù hợp",
		"🔇 Âm thanh nghe gián đoạn",
	],
	2: [
		"⚠️ Cần cải thiện độ hiểu ngữ cảnh",
		"⏳ Phản hồi hơi chậm một chút",
		"🗣️ Giọng đọc cần tự nhiên hơn",
		"🔍 Cần tìm kiếm mở rộng hơn",
		"💬 Nội dung trả lời hơi dài",
	],
	3: [
		"👌 Hỗ trợ tạm ổn, đúng trọng tâm",
		"⚡ Tốc độ trả lời vừa phải",
		"📚 Gợi ý sách tương đối ổn",
		"🎙️ Giọng đọc nghe rõ ràng",
		"💡 Cần tư vấn thông minh hơn",
	],
	4: [
		"👍 Tư vấn nhiệt tình, dễ hiểu",
		"⚡ Phản hồi nhanh chóng, chính xác",
		"📚 Gợi ý đúng sở thích đọc",
		"🎙️ Giọng đọc tự nhiên, truyền cảm",
		"📦 Tra cứu đơn hàng chuẩn chỉ",
	],
	5: [
		"🌟 Rất thông minh & uyên bác",
		"⚡ Phản hồi siêu tốc, vượt mong đợi",
		"🎙️ Giọng phát thanh viên truyền cảm",
		"🎯 Tư vấn ấn phẩm chính xác 100%",
		"💖 Trải nghiệm xuất sắc tuyệt vời",
	],
};

interface FacePathConfig {
	leftEye: string;
	rightEye: string;
	mouth: string;
	color: string;
	strokeClass: string;
	bgClass: string;
	borderClass: string;
	label: string;
	textColor: string;
}

const FACE_CONFIGS: Record<number, FacePathConfig> = {
	1: {
		leftEye: "M 28 36 L 42 44",
		rightEye: "M 72 44 L 58 36",
		mouth: "M 28 76 Q 50 56 72 76",
		color: "#ef4444",
		strokeClass: "stroke-red-500",
		bgClass: "bg-red-500/10",
		borderClass: "border-red-500/30",
		label: "Rất không hài lòng (1 sao)",
		textColor: "text-red-500",
	},
	2: {
		leftEye: "M 30 38 L 42 42",
		rightEye: "M 70 42 L 58 38",
		mouth: "M 32 72 Q 50 63 68 72",
		color: "#f97316",
		strokeClass: "stroke-orange-500",
		bgClass: "bg-orange-500/10",
		borderClass: "border-orange-500/30",
		label: "Chưa hài lòng (2 sao)",
		textColor: "text-orange-500",
	},
	3: {
		leftEye: "M 30 40 L 44 40",
		rightEye: "M 56 40 L 70 40",
		mouth: "M 34 68 L 66 68",
		color: "#eab308",
		strokeClass: "stroke-amber-500",
		bgClass: "bg-amber-500/10",
		borderClass: "border-amber-500/30",
		label: "Tạm ổn / Bình thường (3 sao)",
		textColor: "text-amber-500",
	},
	4: {
		leftEye: "M 28 42 Q 36 33 44 42",
		rightEye: "M 56 42 Q 64 33 72 42",
		mouth: "M 30 65 Q 50 79 70 65",
		color: "#10b981",
		strokeClass: "stroke-emerald-500",
		bgClass: "bg-emerald-500/10",
		borderClass: "border-emerald-500/30",
		label: "Hài lòng & Tốt (4 sao)",
		textColor: "text-emerald-500",
	},
	5: {
		leftEye: "M 26 43 Q 36 29 46 43",
		rightEye: "M 54 43 Q 64 29 74 43",
		mouth: "M 26 62 Q 50 88 74 62",
		color: "#f59e0b",
		strokeClass: "stroke-amber-400",
		bgClass: "bg-amber-400/15",
		borderClass: "border-amber-400/40",
		label: "Tuyệt vời & Xuất sắc (5 sao)",
		textColor: "text-amber-500",
	},
};

/**
 * Biểu cảm gương mặt động vẽ bằng 3 đường Vector SVG:
 * - Đường 1: Mắt trái
 * - Đường 2: Mắt phải
 * - Đường 3: Khuôn miệng
 * Chuyển động mượt mà theo từng mức sao (1 đến 5 sao) mà người dùng chọn.
 */
function DynamicFace3Lines({ rating }: { rating: number }) {
	const clamped = Math.max(1, Math.min(5, Math.round(rating || 5)));
	const current = FACE_CONFIGS[clamped];

	return (
		<div className="flex flex-col items-center justify-center gap-1.5 my-1 animate-in fade-in zoom-in-95 duration-200">
			<div
				className={cn(
					"relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
					current.bgClass,
					current.borderClass,
				)}
			>
				<svg
					viewBox="0 0 100 100"
					className="h-12 w-12 transition-transform duration-300 hover:scale-105"
					aria-label={current.label}
				>
					{/* Đường 1: Mắt trái */}
					<path
						d={current.leftEye}
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={cn("transition-all duration-300 ease-out", current.strokeClass)}
					/>
					{/* Đường 2: Mắt phải */}
					<path
						d={current.rightEye}
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={cn("transition-all duration-300 ease-out", current.strokeClass)}
					/>
					{/* Đường 3: Miệng */}
					<path
						d={current.mouth}
						fill="none"
						stroke="currentColor"
						strokeWidth="6.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={cn("transition-all duration-300 ease-out", current.strokeClass)}
					/>
				</svg>
			</div>
			<span className={cn("text-xs font-semibold tracking-tight transition-colors duration-300", current.textColor)}>
				{current.label}
			</span>
		</div>
	);
}

type SessionPhase = "method_select" | "survey" | "connecting" | "active" | "rating" | "ended";
type ContactMethod = "call" | "chat";

/**
 * Component hiển thị sản phẩm tư vấn:
 * - Nếu chỉ có 1 ấn phẩm phù hợp: Hiển thị dạng Single Card chi tiết, đầy đủ bìa to, mô tả, giá, đánh giá & nút thêm vào giỏ.
 * - Nếu có nhiều ấn phẩm phù hợp: Hiển thị thanh trượt ngang có nút chuyển sang Trái (<) và sang Phải (>), loại bỏ chữ cuộn ngang.
 */
function ProductRailSection({
	cards,
	addedBookIds,
	onAddToCart,
	onViewDetail,
}: {
	cards: MessageCard[];
	addedBookIds: Record<string, boolean>;
	onAddToCart: (book: BookProductData, edition?: "ebook" | "physical", price?: string) => void;
	onViewDetail: (slug: string) => void;
}) {
	const railRef = useRef<HTMLDivElement>(null);
	const [selectedEditions, setSelectedEditions] = useState<Record<string, "ebook" | "physical">>({});

	const scrollRail = (direction: "left" | "right") => {
		if (railRef.current) {
			railRef.current.scrollBy({
				left: direction === "left" ? -250 : 250,
				behavior: "smooth",
			});
		}
	};

	const productCards = cards.filter((c) => c.type === "product");

	// TRƯỜNG HỢP 1: DUY NHẤT 1 ĐẦU SÁCH PHÙ HỢP -> HIỂN THỊ THÔNG TIN CHI TIẾT SẢN PHẨM RIÊNG BIỆT
	if (productCards.length === 1 && cards.length === 1) {
		const book: BookProductData = productCards[0].data;
		const edition = selectedEditions[book.id] || "ebook";
		const currentPrice = edition === "physical" ? (book.physicalPrice || "118.000₫") : (book.ebookPrice || book.price);
		const cartKey = `${book.id}-${edition}`;
		const isAdded = !!addedBookIds[book.id] || !!addedBookIds[cartKey];

		return (
			<div className="w-full my-2 text-left animate-in fade-in zoom-in-95 duration-150">
				<div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground mb-1.5 px-0.5">
					<BookOpen className="h-3.5 w-3.5 text-primary" />
					<span>Ấn phẩm phù hợp nhất với nhu cầu của bạn:</span>
				</div>

				<div className="rounded-xl border border-primary/30 bg-card p-3 shadow-xs space-y-2.5">
					<div className="flex gap-3">
						<div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary shadow-md">
							<img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
						</div>

						<div className="flex flex-1 flex-col justify-between overflow-hidden">
							<div>
								<h5 className="font-bold text-foreground text-xs leading-snug line-clamp-2">
									{book.title}
								</h5>
								<p className="text-[11px] text-muted-foreground italic truncate mt-0.5">
									Tác giả: {book.author}
								</p>
								{book.originalTitle && (
									<p className="text-[10px] text-muted-foreground/75 italic truncate">
										Gốc: {book.originalTitle}
									</p>
								)}
								<div className="flex items-center gap-1.5 mt-1.5">
									<Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
										{book.badge}
									</Badge>
									<div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-semibold">
										<Star className="h-3 w-3 fill-amber-500" />
										<span>{book.rating}</span>
									</div>
								</div>
							</div>

							<div className="flex items-baseline justify-between pt-1 border-t border-border/60">
								<div className="flex items-baseline gap-1.5">
									<span className="font-bold text-primary text-sm">{currentPrice}</span>
									{book.originalPrice && edition === "ebook" && (
										<span className="text-[10px] text-muted-foreground line-through">
											{book.originalPrice}
										</span>
									)}
								</div>
								<span className="text-[10px] font-medium text-muted-foreground">
									{edition === "ebook" ? "📖 Đọc DRM + Audio" : "📦 Sách in giao tận nhà"}
								</span>
							</div>
						</div>
					</div>

					{/* Bộ chọn 2 phiên bản Sách Điện Tử & Sách Vật Lý */}
					<div className="space-y-1">
						<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
							Chọn phiên bản phát hành:
						</span>
						<div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 rounded-lg border border-border/60">
							<button
								type="button"
								onClick={() => setSelectedEditions((prev) => ({ ...prev, [book.id]: "ebook" }))}
								className={cn(
									"py-1 px-2 rounded-md font-medium text-[11px] transition-all flex flex-col items-center justify-center text-center gap-0.5",
									edition === "ebook"
										? "bg-background text-primary shadow-xs font-semibold border border-primary/30"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<div className="flex items-center gap-1">
									<BookOpen className="h-3 w-3 text-primary" />
									<span>Sách Điện Tử</span>
								</div>
								<span className="text-[10px] font-bold text-primary">{book.ebookPrice || book.price}</span>
							</button>

							<button
								type="button"
								onClick={() => setSelectedEditions((prev) => ({ ...prev, [book.id]: "physical" }))}
								className={cn(
									"py-1 px-2 rounded-md font-medium text-[11px] transition-all flex flex-col items-center justify-center text-center gap-0.5",
									edition === "physical"
										? "bg-background text-emerald-600 shadow-xs font-semibold border border-emerald-500/30"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<div className="flex items-center gap-1">
									<Truck className="h-3 w-3 text-emerald-600" />
									<span>Sách Vật Lý</span>
								</div>
								<span className="text-[10px] font-bold text-emerald-600">{book.physicalPrice || "118.000₫"}</span>
							</button>
						</div>
					</div>

					{book.description && (
						<p className="text-[11px] leading-relaxed text-muted-foreground bg-secondary/40 p-2 rounded-md border border-border/40 line-clamp-3">
							{book.description}
						</p>
					)}

					<div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
						<button
							type="button"
							onClick={() => onAddToCart(book, edition, currentPrice)}
							className={cn(
								"flex-1 flex items-center justify-center gap-1.5 rounded-button py-2 text-xs font-semibold transition-all shadow-xs",
								isAdded
									? "bg-emerald-600 text-white"
									: "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-98",
							)}
						>
							{isAdded ? (
								<>
									<Check className="h-3.5 w-3.5" />
									<span>Đã thêm vào giỏ ✓</span>
								</>
							) : (
								<>
									<ShoppingCart className="h-3.5 w-3.5" />
									<span>Thêm vào giỏ ({edition === "physical" ? "Sách Giấy" : "Sách Điện Tử"})</span>
								</>
							)}
						</button>
						<button
							type="button"
							onClick={() => onViewDetail(book.slug)}
							className="rounded-button border border-input bg-background hover:bg-secondary px-2.5 py-2 text-xs font-medium text-foreground flex items-center gap-1 transition-colors"
							title="Xem chi tiết ấn phẩm"
						>
							<span>Chi tiết</span>
							<ExternalLink className="h-3 w-3" />
						</button>
					</div>
				</div>
			</div>
		);
	}

	// TRƯỜNG HỢP 2: NHIỀU ĐẦU SÁCH -> HIỂN THỊ LIST NGANG CÓ NÚT BẤM CHUYỂN TRÁI / PHẢI
	return (
		<div className="w-full my-2 text-left">
			<div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5 px-0.5">
				<span className="flex items-center gap-1.5 text-foreground">
					<BookOpen className="h-3.5 w-3.5 text-primary" />
					<span>Ấn phẩm gợi ý phù hợp:</span>
				</span>

				{/* Cụm nút bấm chuyển sang trái và sang phải */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => scrollRail("left")}
						className="h-6 w-6 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center text-foreground transition-all active:scale-95 shadow-2xs"
						title="Xem sách bên trái"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => scrollRail("right")}
						className="h-6 w-6 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center text-foreground transition-all active:scale-95 shadow-2xs"
						title="Xem sách bên phải"
					>
						<ChevronRight className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			<div
				ref={railRef}
				className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth"
			>
				{cards.map((card, idx) => {
					if (card.type === "product") {
						const book: BookProductData = card.data;
						const edition = selectedEditions[book.id] || "ebook";
						const currentPrice = edition === "physical" ? (book.physicalPrice || "118.000₫") : (book.ebookPrice || book.price);
						const cartKey = `${book.id}-${edition}`;
						const isAdded = !!addedBookIds[book.id] || !!addedBookIds[cartKey];
						return (
							<div
								key={`card-product-${book.id || book.slug || idx}-${idx}`}
								className="flex w-[260px] shrink-0 flex-col rounded-card border border-border bg-card p-3 shadow-xs hover:border-primary/50 transition-colors text-left"
							>
								<div className="flex gap-2.5">
									<div className="relative h-22 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-secondary shadow-2xs">
										<img
											src={book.coverImage}
											alt={book.title}
											className="h-full w-full object-cover"
										/>
									</div>

									<div className="flex flex-1 flex-col justify-between overflow-hidden">
										<div>
											<h5 className="font-semibold text-foreground text-xs line-clamp-1">
												{book.title}
											</h5>
											<p className="text-[11px] text-muted-foreground italic truncate">
												{book.author}
											</p>
											<Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
												{book.badge}
											</Badge>
										</div>

										<div className="flex items-center justify-between pt-1 border-t border-border/60">
											<span className="font-bold text-primary text-xs">{currentPrice}</span>
											<div className="flex items-center gap-0.5 text-amber-500 text-[10px]">
												<Star className="h-3 w-3 fill-amber-500" />
												<span>{book.rating}</span>
											</div>
										</div>
									</div>
								</div>

								{/* Bộ chọn phiên bản nhỏ gọn */}
								<div className="grid grid-cols-2 gap-1 my-2 p-0.5 bg-secondary/50 rounded-md text-[10px]">
									<button
										type="button"
										onClick={() => setSelectedEditions((prev) => ({ ...prev, [book.id]: "ebook" }))}
										className={cn(
											"py-0.5 px-1 rounded font-medium transition-all text-center",
											edition === "ebook"
												? "bg-background text-primary shadow-xs font-semibold"
												: "text-muted-foreground",
										)}
									>
										Điện tử: {book.ebookPrice || book.price}
									</button>
									<button
										type="button"
										onClick={() => setSelectedEditions((prev) => ({ ...prev, [book.id]: "physical" }))}
										className={cn(
											"py-0.5 px-1 rounded font-medium transition-all text-center",
											edition === "physical"
												? "bg-background text-emerald-600 shadow-xs font-semibold"
												: "text-muted-foreground",
										)}
									>
										Vật lý: {book.physicalPrice || "118.000₫"}
									</button>
								</div>

								<div className="flex items-center gap-1.5 pt-1.5 border-t border-border/60">
									<button
										type="button"
										onClick={() => onAddToCart(book, edition, currentPrice)}
										className={cn(
											"flex-1 flex items-center justify-center gap-1.5 rounded-button py-1.5 text-xs font-medium transition-all shadow-xs",
											isAdded
												? "bg-emerald-600 text-white"
												: "bg-primary hover:bg-primary/90 text-primary-foreground",
										)}
									>
										{isAdded ? (
											<>
												<Check className="h-3.5 w-3.5" />
												<span>Đã thêm ✓</span>
											</>
										) : (
											<>
												<ShoppingCart className="h-3.5 w-3.5" />
												<span>Thêm ({edition === "physical" ? "Giấy" : "Ebook"})</span>
											</>
										)}
									</button>
									<button
										type="button"
										onClick={() => onViewDetail(book.slug)}
										className="rounded-button border border-input bg-background hover:bg-accent p-1.5 text-foreground"
										title="Xem chi tiết"
									>
										<ExternalLink className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						);
					}

					if (card.type === "order") {
						const ord: OrderData = card.data;
						return (
							<div
								key={`card-order-${ord.orderCode || ord.trackingCode || idx}-${idx}`}
								className="w-[250px] shrink-0 rounded-card border border-border bg-card p-3 shadow-xs text-left"
							>
								<div className="flex items-center justify-between border-b border-border pb-1 mb-1.5">
									<span className="font-semibold text-foreground text-xs">
										Đơn #{ord.orderCode}
									</span>
									<Badge variant="outline-solid" className="text-[10px] text-primary">
										{ord.status}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground truncate">
									Vận đơn: <span className="font-mono text-foreground font-medium">{ord.trackingCode}</span>
								</p>
								<p className="text-xs text-muted-foreground truncate">
									Đơn vị: <span className="text-foreground">{ord.carrier}</span>
								</p>
								<div className="mt-2 flex items-center justify-between text-xs rounded bg-secondary p-1.5">
									<span className="text-muted-foreground">{ord.estimate}</span>
									<span className="font-bold text-foreground">{ord.total}</span>
								</div>
							</div>
						);
					}

					if (card.type === "drm") {
						const drm: DRMData = card.data;
						return (
							<div
								key={`card-drm-${drm.standard || idx}-${idx}`}
								className="w-[250px] shrink-0 rounded-card border border-border bg-card p-3 shadow-xs text-left"
							>
								<div className="flex items-center gap-1 font-semibold text-foreground text-xs mb-1">
									<ShieldCheck className="h-3.5 w-3.5 text-primary" />
									<span>Readium LCP DRM</span>
								</div>
								<p className="text-[11px] text-muted-foreground">• {drm.singleTabLock}</p>
								<p className="text-[11px] text-muted-foreground">• {drm.maxDevices}</p>
								<Badge variant="secondary" className="mt-2 text-[10px]">
									{drm.licenseStatus}
								</Badge>
							</div>
						);
					}

					return null;
				})}
			</div>
		</div>
	);
}

// Danh sách các câu thông báo giữ máy đa dạng, tự nhiên và thân thiện cho khách hàng
const HOLD_PHRASES = [
	"Dạ, em đang kiểm tra cơ sở dữ liệu sách cho mình, anh/chị đợi em một chút nhé ạ.",
	"Dạ vâng, để em tra cứu nhanh thông tin trên hệ thống cho mình nhé ạ.",
	"Dạ, em đang đối chiếu dữ liệu các ấn phẩm cho mình rồi ạ, anh/chị chờ em một lát nhé.",
	"Dạ vâng, em đang kiểm tra chi tiết trên hệ thống đây ạ, anh/chị đợi em một xíu nhé.",
	"Dạ, em đang kết nối tới kho dữ liệu để tìm thông tin chính xác nhất, anh/chị đợi em một chút nhé ạ.",
	"Dạ vâng, để em tra cứu kho sách của AuraBook cho mình ngay đây ạ, anh/chị giữ máy một lát nhé.",
	"Dạ, em đang kiểm tra tình trạng ấn phẩm trên hệ thống cho mình rồi ạ, anh/chị đợi em một xíu nhé.",
	"Dạ vâng, anh/chị đợi em một lát để em kiểm tra dữ liệu chính xác nhất cho mình nhé ạ.",
];

// Bộ tạo nhạc chờ tổng đài Web Audio API (Acoustic Chime / Gentle Rhodes Melody)
class HoldMusicSynth {
	private ctx: AudioContext | null = null;
	private isPlaying: boolean = false;
	private timer: any = null;
	private masterGain: GainNode | null = null;

	start() {
		if (this.isPlaying) return;
		this.isPlaying = true;
		try {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioCtx) return;
			this.ctx = new AudioCtx();
			if (this.ctx.state === "suspended") {
				this.ctx.resume().catch(() => {});
			}
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.setValueAtTime(0.065, this.ctx.currentTime); // Âm lượng êm ái, thanh lịch
			this.masterGain.connect(this.ctx.destination);

			// Giai điệu nhạc chờ AuraBook: Cmaj9 Arpeggio ấm áp (C4 - E4 - G4 - B4 - D5 - B4 - G4 - E4)
			const notes = [261.63, 329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63];
			let step = 0;

			const playNote = () => {
				if (!this.isPlaying || !this.ctx || !this.masterGain) return;
				try {
					const osc = this.ctx.createOscillator();
					const noteGain = this.ctx.createGain();

					osc.type = "sine";
					osc.frequency.setValueAtTime(notes[step % notes.length], this.ctx.currentTime);

					const now = this.ctx.currentTime;
					noteGain.gain.setValueAtTime(0, now);
					noteGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
					noteGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

					osc.connect(noteGain);
					noteGain.connect(this.masterGain);

					osc.start(now);
					osc.stop(now + 0.9);

					step++;
					this.timer = setTimeout(playNote, 430);
				} catch {}
			};

			playNote();
		} catch (e) {
			console.warn("[HoldMusicSynth] Error:", e);
		}
	}

	stop() {
		this.isPlaying = false;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (this.masterGain && this.ctx) {
			try {
				const now = this.ctx.currentTime;
				this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
				setTimeout(() => {
					this.ctx?.close().catch(() => {});
					this.ctx = null;
					this.masterGain = null;
				}, 300);
			} catch {
				this.ctx?.close().catch(() => {});
				this.ctx = null;
				this.masterGain = null;
			}
		}
	}
}

export function VoiceAgentWidget() {
	const pathname = usePathname();
	const router = useRouter();

	// Ẩn hoàn toàn widget ở trang đọc sách (Reader) theo đúng yêu cầu
	const isReader = pathname?.includes("/reader");

	const [isOpen, setIsOpen] = useState(false);
	const [sessionPhase, setSessionPhase] = useState<SessionPhase>("method_select");
	const [contactMethod, setContactMethod] = useState<ContactMethod>("call");

	// Xóa cache giọng cũ phía client để đảm bảo tuân thủ tuyệt đối cấu hình mặc định do Admin chỉ định
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				localStorage.removeItem("aurabook_voiceagent_voice");
			} catch {}
			fetch("/api/ai/admin/config")
				.then((r) => r.json())
				.then((data: any) => {
					if (data?.config?.voice?.llmModel) {
						setActiveModel(data.config.voice.llmModel);
					}
				})
				.catch(() => {});
		}
	}, []);

	// Survey Profile States (Họ tên, SĐT, Giới tính, Độ tuổi, Lý do hỗ trợ) - BẮT BUỘC ĐIỀN ĐỦ
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerGender, setCustomerGender] = useState<"Anh" | "Chị" | "Bạn" | "">("");
	const [customerAge, setCustomerAge] = useState<string>("");
	const [selectedTopic, setSelectedTopic] = useState<string>("");
	const [surveyError, setSurveyError] = useState<string>("");

	// Confirm Dialog kết thúc
	const [showEndConfirm, setShowEndConfirm] = useState(false);

	// Session Persistence
	const [sessionId, setSessionId] = useState<string>("");
	const [sessionStartTime, setSessionStartTime] = useState<string>("");
	const sessionIdRef = useRef<string>("");
	const sessionStartTimeRef = useRef<string>("");

	// Call & Audio states
	const [isConnected, setIsConnected] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isSpeakerOn, setIsSpeakerOn] = useState(true);
	const [agentSpeaking, setAgentSpeaking] = useState(false);
	const [callDuration, setCallDuration] = useState(0);
	const callDurationRef = useRef<number>(0);
	callDurationRef.current = callDuration;

	// Input & Streaming states
	const [inputText, setInputText] = useState("");
	const [showKeyboardInput, setShowKeyboardInput] = useState(false);
	const [liveUserTranscript, setLiveUserTranscript] = useState("");
	const [streamingText, setStreamingText] = useState("");
	const [streamingThinking, setStreamingThinking] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const [isWaitingResponse, setIsWaitingResponse] = useState(false);
	const isWaitingResponseRef = useRef<boolean>(false);
	const lastProcessedQueryRef = useRef<string>("");
	const lastProcessedTimeRef = useRef<number>(0);
	const holdMusicPlayerRef = useRef<HoldMusicSynth | null>(null);

	useEffect(() => {
		holdMusicPlayerRef.current = new HoldMusicSynth();
		return () => {
			holdMusicPlayerRef.current?.stop();
		};
	}, []);
	const [activeModel, setActiveModel] = useState<string>("gemma2:2b");
	const [activeBookSlug, setActiveBookSlug] = useState<string>("");

	// Inactivity Timeout state & ref (tự động nhắc nhở nhẹ sau 3 phút không tương tác, KHÔNG tự động hủy cuộc gọi hay xóa hội thoại)
	const [isSessionPaused, setIsSessionPaused] = useState(false);
	const [isWaitingInactivityPrompt, setIsWaitingInactivityPrompt] = useState(false);
	const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
	const inactivityGraceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const resetInactivityTimerRef = useRef<() => void>(() => {});
	const INACTIVITY_TIMEOUT_MS = 180 * 1000; // 3 phút để khách thoải mái đọc sách và đặt câu hỏi

	// Thêm vào giỏ states
	const [addedBookIds, setAddedBookIds] = useState<Record<string, boolean>>({});

	// Rating & Review states (Đếm ngược 20s tự động gửi nếu không đánh giá, tạm dừng khi có thao tác và đếm tiếp khi dừng)
	const [ratingStars, setRatingStars] = useState<number>(5);
	const [selectedTags, setSelectedTags] = useState<string[]>([
		DYNAMIC_FEEDBACK_TAGS[5][0],
		DYNAMIC_FEEDBACK_TAGS[5][1],
	]);
	const [feedbackComment, setFeedbackComment] = useState("");
	const [isSubmittingRating, setIsSubmittingRating] = useState(false);
	const [ratingCountdown, setRatingCountdown] = useState<number>(20);
	const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);
	const isRatingPausedRef = useRef<boolean>(false);
	const isRatingSubmittingRef = useRef<boolean>(false);
	const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const resumeCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);
	const triggerAutoSubmitRatingRef = useRef<() => void>(() => {});
	const resetToNewSessionRef = useRef<() => void>(() => {});

	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			sender: "agent",
			text: "Dạ em là Aura AI - Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách của AuraBook. Em rất vui được hỗ trợ ạ!",
			timestamp: "Vừa xong",
		},
	]);

	// messagesRef luôn đồng bộ với messages state để tránh stale closure làm mất lịch sử hội thoại
	const messagesRef = useRef<Message[]>(messages);
	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	const audioElementRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const speechRecognitionRef = useRef<any>(null);
	const speechDebounceRef = useRef<NodeJS.Timeout | null>(null);
	const speechRestartTimerRef = useRef<NodeJS.Timeout | null>(null);
	const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const isTerminatedRef = useRef<boolean>(false);

	// Ref chống lặp âm thanh (Echo cancellation guard)
	const isAudioPlayingRef = useRef(false);
	const ignoreSpeechUntilRef = useRef<number>(0);
	const isMutedRef = useRef(isMuted);
	isMutedRef.current = isMuted;
	const isConnectedRef = useRef(isConnected);
	isConnectedRef.current = isConnected;
	const agentSpeakingRef = useRef(agentSpeaking);
	agentSpeakingRef.current = agentSpeaking;
	const contactMethodRef = useRef(contactMethod);
	contactMethodRef.current = contactMethod;

	// Cuộn danh sách tin nhắn khi có nội dung mới
	useEffect(() => {
		if (isOpen && sessionPhase === "active") {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, isOpen, sessionPhase, streamingText, liveUserTranscript]);

	const formatDuration = (secs: number) => {
		const m = Math.floor(secs / 60)
			.toString()
			.padStart(2, "0");
		const s = (secs % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	// LƯU TOÀN BỘ PHIÊN HỘI THOẠI VÀO HỆ THỐNG NGAY LẬP TỨC (REALTIME PERSISTENCE)
	// Không đợi đến khi người dùng đánh giá mới lưu, đảm bảo bất kỳ tin nhắn, cuộc gọi nào cũng được ghi nhận ngay
	const persistSession = useCallback(
		async (
			status: "in_progress" | "completed",
			rating?: number,
			tags?: string[],
			comment?: string,
			overrideMessages?: Message[],
			overrideSessionId?: string,
			overrideStartTime?: string,
		) => {
			const idToUse = overrideSessionId || sessionIdRef.current || sessionId;
			if (!idToUse) return;
			const msgsToUse = overrideMessages || messagesRef.current;
			const startTimeToUse = overrideStartTime || sessionStartTimeRef.current || sessionStartTime || new Date().toLocaleString("vi-VN");
			try {
				await fetch("/api/ai/voice-agent/sessions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: idToUse,
						startedAt: startTimeToUse,
						endedAt: new Date().toLocaleString("vi-VN"),
						durationSeconds: callDurationRef.current,
						contactMethod: contactMethodRef.current,
						customerName: customerName.trim() || "Khách vãng lai",
						customerPhone: customerPhone.trim() || "",
						customerGender,
						customerAge,
						topic: selectedTopic,
						messages: msgsToUse.map((m) => ({
							id: m.id,
							sender: m.sender,
							text: m.text,
							timestamp: m.timestamp,
						})),
						rating: rating ?? ratingStars,
						reviewTags: tags ?? selectedTags,
						feedbackComment: comment ?? feedbackComment,
						status,
					}),
				});
			} catch (e) {
				console.warn("[VoiceAgent] Lỗi đồng bộ session:", e);
			}
		},
		[
			sessionId,
			sessionStartTime,
			customerName,
			customerPhone,
			customerGender,
			customerAge,
			selectedTopic,
			ratingStars,
			selectedTags,
			feedbackComment,
		],
	);

	// Tạm dừng nhận diện giọng nói khi Aura AI nói để mic không thu lại tiếng từ loa
	const pauseSpeechRecognitionForAudio = useCallback(() => {
		isAudioPlayingRef.current = true;
		ignoreSpeechUntilRef.current = Date.now() + 99999999;
		if (speechDebounceRef.current) {
			clearTimeout(speechDebounceRef.current);
			speechDebounceRef.current = null;
		}
		setLiveUserTranscript("");
	}, []);

	// Khôi phục micro sau khi loa dứt tiếng
	const resumeSpeechRecognitionAfterAudio = useCallback(() => {
		isAudioPlayingRef.current = false;
		// Chờ 1.2s sau khi âm thanh dứt hẳn để triệt tiêu toàn bộ tiếng vọng âm vang phòng (Echo cancellation)
		ignoreSpeechUntilRef.current = Date.now() + 1200;
		setLiveUserTranscript("");
		if (speechDebounceRef.current) {
			clearTimeout(speechDebounceRef.current);
			speechDebounceRef.current = null;
		}
		// Đảm bảo micro được kích hoạt lại nếu đã bị ngắt trong lúc phát loa
		setTimeout(() => {
			if (
				!isTerminatedRef.current &&
				isConnectedRef.current &&
				!isMutedRef.current &&
				!isAudioPlayingRef.current &&
				!isWaitingResponseRef.current &&
				contactMethodRef.current === "call"
			) {
				try {
					if (speechRecognitionRef.current) {
						speechRecognitionRef.current.start();
					} else {
						startSpeechRecognitionRef.current();
					}
				} catch (e: any) {
					if (e?.name !== "InvalidStateError") {
						startSpeechRecognitionRef.current();
					}
				}
			}
		}, 1250);
	}, []);

	// Phát âm thanh giọng Aura AI từ chuỗi Base64
	const playAuraAudio = useCallback(
		(base64Data: string, onAudioEndCallback?: () => void) => {
			if (isTerminatedRef.current || !base64Data) {
				onAudioEndCallback?.();
				return;
			}
			try {
				pauseSpeechRecognitionForAudio();

				if (!audioElementRef.current) {
					audioElementRef.current = new Audio();
				}
				const audio = audioElementRef.current;
				const mime = base64Data.startsWith("UklGR") ? "audio/wav" : "audio/mpeg";
				audio.src = `data:${mime};base64,${base64Data}`;
				audio.playbackRate = 1.0;
				setAgentSpeaking(true);

				audio.onended = () => {
					setAgentSpeaking(false);
					resumeSpeechRecognitionAfterAudio();
					onAudioEndCallback?.();
				};
				audio.onerror = () => {
					setAgentSpeaking(false);
					resumeSpeechRecognitionAfterAudio();
					onAudioEndCallback?.();
				};

				audio.play().catch((e) => {
					console.warn("[VoiceAgent] Audio autoplay bị chặn:", e);
					setAgentSpeaking(false);
					resumeSpeechRecognitionAfterAudio();
					onAudioEndCallback?.();
				});
			} catch (err) {
				console.error("[VoiceAgent] Lỗi phát âm thanh:", err);
				setAgentSpeaking(false);
				resumeSpeechRecognitionAfterAudio();
				onAudioEndCallback?.();
			}
		},
		[pauseSpeechRecognitionForAudio, resumeSpeechRecognitionAfterAudio],
	);

	// Phát lại âm thanh tin nhắn của AI (hoặc gọi TTS nếu chưa có audioBase64)
	const playMessageAudio = useCallback(
		async (msg: Message) => {
			if (isTerminatedRef.current) return;
			if (msg.audioBase64) {
				playAuraAudio(msg.audioBase64);
				return;
			}
			try {
				const res = await fetch("/api/ai/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: msg.text, speed: 1.0 }),
				});
				if (res.ok && !isTerminatedRef.current) {
					const data = (await res.json()) as any;
					if (data.audioBase64) {
						setMessages((prev) =>
							prev.map((m) => (m.id === msg.id ? { ...m, audioBase64: data.audioBase64 } : m)),
						);
						playAuraAudio(data.audioBase64);
					}
				}
			} catch (e) {
				console.warn("Lỗi phát audio tin nhắn:", e);
			}
		},
		[playAuraAudio],
	);

	// Xử lý và hiển thị ngay lập tức phản hồi của AI (Bảo toàn 100% lịch sử câu hỏi & câu trả lời)
	const streamAiResponse = useCallback(
		(fullText: string, cards: MessageCard[], audioBase64?: string, thinking?: string) => {
			if (isTerminatedRef.current) return;

			if (streamIntervalRef.current) {
				clearInterval(streamIntervalRef.current);
				streamIntervalRef.current = null;
			}

			setIsWaitingResponse(false);
			isWaitingResponseRef.current = false;

			const timeStr = new Date().toLocaleTimeString("vi-VN", {
				hour: "2-digit",
				minute: "2-digit",
			});

			const newAgentMsg: Message = {
				id: `agent-${Date.now()}`,
				sender: "agent",
				text: fullText,
				timestamp: timeStr,
				cards: cards,
				audioBase64: audioBase64,
				thinking: thinking,
			};

			// LƯU NGAY LẬP TỨC VÀO REF VÀ STATE - BẢO TOÀN 100% CÁC CÂU HỎI & CÂU TRẢ LỜI TRƯỚC ĐÓ
			setMessages((prev) => {
				const filtered = prev.filter((m) => m.id !== newAgentMsg.id);
				const updated = [...filtered, newAgentMsg];
				messagesRef.current = updated;
				persistSession("in_progress", undefined, undefined, undefined, updated);
				return updated;
			});

			setIsStreaming(false);
			setStreamingText("");
			setStreamingThinking("");
			resetInactivityTimerRef.current();

			// TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐỌC KHI Ở CHẾ ĐỘ NHẮN TIN (CHAT).
			// CHỈ TỰ ĐỘNG PHÁT ÂM DUY NHẤT KHI Ở CHẾ ĐỘ GỌI THOẠI (CALL).
			if (contactMethodRef.current === "call" && audioBase64 && isSpeakerOn && !isTerminatedRef.current) {
				playAuraAudio(audioBase64);
			}
		},
		[playAuraAudio, isSpeakerOn, persistSession],
	);

	// Xử lý gửi tin nhắn / câu hỏi từ khách hàng
	const handleSendMessage = useCallback(
		async (query: string) => {
			if (isTerminatedRef.current) return;
			const cleanQuery = query.trim();
			if (!cleanQuery) return;

			// Guard 1: Đang trong quá trình chờ AI phản hồi -> Chặn triệt để không nhận thêm trigger đúp
			if (isWaitingResponseRef.current) {
				console.log("[VoiceAgent] Đang chờ AI phản hồi, chặn trigger đúp:", cleanQuery);
				return;
			}

			// Guard 2: Chống nhảy 2 lần câu hỏi nếu SpeechRecognition gửi lại cùng nội dung trong 3.5s
			const now = Date.now();
			if (cleanQuery === lastProcessedQueryRef.current && (now - lastProcessedTimeRef.current < 3500)) {
				console.log("[VoiceAgent] Chặn trigger trùng lặp trong 3.5s:", cleanQuery);
				return;
			}
			lastProcessedQueryRef.current = cleanQuery;
			lastProcessedTimeRef.current = now;

			isWaitingResponseRef.current = true;
			setIsWaitingResponse(true);

			// Tạm ngắt nhận diện micro ngay khi bắt đầu xử lý để mic không thu đè tiếng thở/âm vang
			if (speechDebounceRef.current) {
				clearTimeout(speechDebounceRef.current);
				speechDebounceRef.current = null;
			}
			setLiveUserTranscript("");
			resetInactivityTimerRef.current();
			setIsSessionPaused(false);

			const timeStr = new Date().toLocaleTimeString("vi-VN", {
				hour: "2-digit",
				minute: "2-digit",
			});

			// LẤY DANH SÁCH TIN NHẮN TỪ REF ĐỂ LUÔN BẢO TOÀN TOÀN BỘ LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ
			const currentMessages = messagesRef.current;

			const newMsgHistory = currentMessages.map((m) => ({
				role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
				content: m.text,
			}));

			const userMsg: Message = {
				id: `user-${Date.now()}`,
				sender: "user",
				text: cleanQuery,
				timestamp: timeStr,
			};

			setMessages((prev) => {
				const nextMessages = [...prev, userMsg];
				messagesRef.current = nextMessages;
				persistSession("in_progress", undefined, undefined, undefined, nextMessages);
				return nextMessages;
			});

			// Phát câu thông báo giữ máy và bật nhạc chờ nếu là cuộc gọi thoại (Call)
			const isSimpleFarewell = /^(kết thúc|tạm biệt|bye|hẹn gặp lại|dừng lại|thôi cảm ơn)$/i.test(cleanQuery.toLowerCase());
			if (contactMethodRef.current === "call" && isSpeakerOn && !isSimpleFarewell) {
				const holdPhrase = HOLD_PHRASES[Math.floor(Math.random() * HOLD_PHRASES.length)];
				try {
					fetch("/api/ai/tts", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ text: holdPhrase, speed: 1.1 }),
					})
						.then(async (ttsRes) => {
							if (ttsRes.ok && isWaitingResponseRef.current && !isTerminatedRef.current) {
								const ttsData = (await ttsRes.json()) as any;
								if (ttsData.audioBase64 && isWaitingResponseRef.current && !isTerminatedRef.current) {
									playAuraAudio(ttsData.audioBase64, () => {
										// Khi câu nói giữ máy dứt lời, nếu backend vẫn đang xử lý -> phát nhạc chờ
										if (isWaitingResponseRef.current && !isTerminatedRef.current) {
											holdMusicPlayerRef.current?.start();
										}
									});
								} else if (isWaitingResponseRef.current && !isTerminatedRef.current) {
									holdMusicPlayerRef.current?.start();
								}
							}
						})
						.catch(() => {
							if (isWaitingResponseRef.current && !isTerminatedRef.current) {
								holdMusicPlayerRef.current?.start();
							}
						});
				} catch {
					if (isWaitingResponseRef.current && !isTerminatedRef.current) {
						holdMusicPlayerRef.current?.start();
					}
				}
			}

			abortControllerRef.current = new AbortController();

			try {
				const res = await fetch("/api/ai/voice-agent/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					signal: abortControllerRef.current.signal,
					body: JSON.stringify({
						query: cleanQuery,
						topic: selectedTopic,
						history: newMsgHistory,
						customerName,
						customerPhone,
						customerGender,
						customerAge,
						activeBookSlug,
						contactMethod: contactMethodRef.current,
					}),
				});

				// Tắt nhạc chờ ngay khi API trả kết quả
				holdMusicPlayerRef.current?.stop();
				// NGAY LẬP TỨC đánh dấu không còn chờ để ngăn chặn bất kỳ TTS giữ máy nào phát đè lên câu trả lời chính
				isWaitingResponseRef.current = false;

				if (isTerminatedRef.current) return;

				if (res.ok) {
					const data = ((await res.json()) || {}) as any;
					if (isTerminatedRef.current) return;

					if (data.activeModel) {
						setActiveModel(data.activeModel);
					}
					if (data.activeBookSlug) {
						setActiveBookSlug(data.activeBookSlug);
					}

					const replyText = data.text || "Em đã nhận thông tin và đang tra cứu cho mình ạ.";
					const replyCards = data.cards || [];
					const replyThinking = data.thinking || undefined;

					streamAiResponse(replyText, replyCards, data.audioBase64, replyThinking);
				} else {
					isWaitingResponseRef.current = false;
					setIsWaitingResponse(false);
					resumeSpeechRecognitionAfterAudio();
				}
			} catch (err: any) {
				holdMusicPlayerRef.current?.stop();
				isWaitingResponseRef.current = false;
				setIsWaitingResponse(false);
				resumeSpeechRecognitionAfterAudio();

				if (err?.name === "AbortError" || isTerminatedRef.current) {
					console.log("[VoiceAgent] Đã hủy yêu cầu ngầm theo lệnh kết thúc của người dùng.");
					return;
				}
				console.error("[VoiceAgent Chat Error]:", err);
				setMessages((prev) => {
					const errMsg: Message = {
						id: `agent-err-${Date.now()}`,
						sender: "agent",
						text: "Dạ hệ thống của AuraBook đang đồng bộ thêm dữ liệu. Anh/chị đợi em một chút nhé!",
						timestamp: timeStr,
					};
					const next = [...prev, errMsg];
					messagesRef.current = next;
					return next;
				});
				setAgentSpeaking(false);
			}
		},
		[selectedTopic, customerName, customerGender, customerAge, streamAiResponse, playAuraAudio, isSpeakerOn, resumeSpeechRecognitionAfterAudio],
	);

	// Ref lưu handleSendMessage để SpeechRecognition không bị khởi tạo lại khi tin nhắn thay đổi
	const handleSendMessageRef = useRef(handleSendMessage);
	useEffect(() => {
		handleSendMessageRef.current = handleSendMessage;
	}, [handleSendMessage]);

	const startSpeechRecognitionRef = useRef<() => void>(() => {});

	// Web Speech Recognition với Streaming Realtime
	const startSpeechRecognition = useCallback(() => {
		if (typeof window === "undefined" || isTerminatedRef.current) return;
		const SpeechRecognition =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) return;

		try {
			if (speechRecognitionRef.current) {
				try {
					speechRecognitionRef.current.abort();
				} catch {}
			}

			const recognition = new SpeechRecognition();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = "vi-VN";

			recognition.onresult = (event: any) => {
				if (
					isTerminatedRef.current ||
					isAudioPlayingRef.current ||
					agentSpeakingRef.current ||
					isMutedRef.current ||
					isWaitingResponseRef.current ||
					Date.now() < ignoreSpeechUntilRef.current
				) {
					return;
				}

				let interimTranscript = "";
				let finalTranscript = "";

				for (let i = event.resultIndex; i < event.results.length; ++i) {
					const result = event.results[i];
					const transcriptPart = result[0].transcript;
					if (result.isFinal) {
						finalTranscript += transcriptPart;
					} else {
						interimTranscript += transcriptPart;
					}
				}

				const currentLiveText = (finalTranscript || interimTranscript).trim();
				if (currentLiveText && !isTerminatedRef.current) {
					setLiveUserTranscript(currentLiveText);
					resetInactivityTimerRef.current();
					setIsSessionPaused(false);

					if (speechDebounceRef.current) {
						clearTimeout(speechDebounceRef.current);
					}
					// Chỉ kích hoạt gửi khi có finalTranscript hoặc câu tạm có ít nhất 4 từ và người dùng ngừng nói ít nhất 1.4s
					const hasEnoughWords = currentLiveText.split(/\s+/).length >= 4;
					if (finalTranscript || hasEnoughWords) {
						const debounceMs = finalTranscript ? 450 : 1400;
						speechDebounceRef.current = setTimeout(() => {
							if (
								!isTerminatedRef.current &&
								!isAudioPlayingRef.current &&
								!agentSpeakingRef.current &&
								!isMutedRef.current &&
								!isWaitingResponseRef.current &&
								Date.now() >= ignoreSpeechUntilRef.current &&
								currentLiveText.length >= 3
							) {
								handleSendMessageRef.current(currentLiveText);
							}
						}, debounceMs);
					}
				}
			};

			recognition.onerror = (event: any) => {
				if (event.error !== "no-speech" && event.error !== "aborted") {
					console.warn("[SpeechRecognition Error]:", event.error);
				}
			};

			recognition.onend = () => {
				if (speechRestartTimerRef.current) {
					clearTimeout(speechRestartTimerRef.current);
					speechRestartTimerRef.current = null;
				}
				if (
					!isTerminatedRef.current &&
					isConnectedRef.current &&
					!isMutedRef.current &&
					!isAudioPlayingRef.current &&
					!isWaitingResponseRef.current &&
					contactMethodRef.current === "call"
				) {
					speechRestartTimerRef.current = setTimeout(() => {
						if (
							!isTerminatedRef.current &&
							isConnectedRef.current &&
							!isMutedRef.current &&
							!isAudioPlayingRef.current &&
							!isWaitingResponseRef.current &&
							Date.now() >= ignoreSpeechUntilRef.current &&
							contactMethodRef.current === "call"
						) {
							try {
								recognition.start();
							} catch (e: any) {
								if (e?.name !== "InvalidStateError") {
									startSpeechRecognitionRef.current();
								}
							}
						}
					}, 500);
				}
			};

			recognition.start();
			speechRecognitionRef.current = recognition;
		} catch (e) {
			console.warn("[SpeechRecognition Start Error]:", e);
		}
	}, []);

	startSpeechRecognitionRef.current = startSpeechRecognition;

	const stopSpeechRecognition = useCallback(() => {
		if (speechRestartTimerRef.current) {
			clearTimeout(speechRestartTimerRef.current);
			speechRestartTimerRef.current = null;
		}
		if (speechDebounceRef.current) {
			clearTimeout(speechDebounceRef.current);
			speechDebounceRef.current = null;
		}
		if (speechRecognitionRef.current) {
			try {
				speechRecognitionRef.current.abort();
			} catch {}
			speechRecognitionRef.current = null;
		}
		setLiveUserTranscript("");
	}, []);



	// Bắt đầu kết nối sau khi hoàn tất khảo sát (Bắt buộc điền đủ tất cả các trường)
	const executeConnection = async () => {
		if (!customerName.trim()) {
			setSurveyError("Vui lòng nhập họ và tên của bạn.");
			return;
		}
		if (!customerPhone.trim()) {
			setSurveyError("Vui lòng nhập số điện thoại liên hệ.");
			return;
		}
		if (!/^[0-9+() -]{9,15}$/.test(customerPhone.trim())) {
			setSurveyError("Số điện thoại không hợp lệ. Vui lòng nhập từ 9-11 chữ số.");
			return;
		}
		if (!customerGender) {
			setSurveyError("Vui lòng chọn cách xưng hô phù hợp.");
			return;
		}
		if (!customerAge) {
			setSurveyError("Vui lòng chọn nhóm độ tuổi của bạn.");
			return;
		}
		if (!selectedTopic) {
			setSurveyError("Vui lòng chọn lý do / chủ đề cần hỗ trợ.");
			return;
		}
		setSurveyError("");

		isTerminatedRef.current = false;
		const newId = `sess-${Date.now()}`;
		const startTime = new Date().toLocaleString("vi-VN");
		setSessionId(newId);
		sessionIdRef.current = newId;
		setSessionStartTime(startTime);
		sessionStartTimeRef.current = startTime;

		setSessionPhase("connecting");

		const name = customerName.trim();
		let honorific: string = customerGender || "mình";
		if (name) {
			if (customerGender && name.toLowerCase().startsWith(customerGender.toLowerCase() + " ")) {
				honorific = name;
			} else {
				honorific = `${customerGender} ${name}`;
			}
		}
		const cleanTopic = (selectedTopic || "").replace(/^\d+\.\s*/, "").trim();
		const welcomeText = cleanTopic
			? `Dạ em chào ${honorific}! Em là Aura AI, chuyên viên tư vấn của AuraBook. Em thấy ${honorific} đang quan tâm đến "${cleanTopic}". Em có thể hỗ trợ gì cho mình ạ?`
			: `Dạ em chào ${honorific}! Em là Aura AI, chuyên viên tư vấn của AuraBook. Em rất vui được hỗ trợ ${honorific} hôm nay ạ!`;

		// Tối ưu hóa độ trễ thời gian thực: TẢI TRƯỚC ÂM THANH NGAY KHI VỪA BẮT ĐẦU KẾT NỐI!
		// Thay vì đợi hết animation mới fetch, fetch chạy ngầm song song ngay trong lúc hiển thị "Đang kết nối..."
		let prefetchGreetingPromise: Promise<string | null> | null = null;
		if (contactMethodRef.current === "call") {
			prefetchGreetingPromise = fetch("/api/ai/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: welcomeText,
					speed: 1.0,
				}),
			})
				.then((r) => (r.ok ? r.json() : null))
				.then((d: any) => d?.audioBase64 || null)
				.catch(() => null);
		}

		setTimeout(async () => {
			if (isTerminatedRef.current) return;
			setIsConnected(true);
			isConnectedRef.current = true;
			setSessionPhase("active");
			resetInactivityTimerRef.current();

			const welcomeMsg: Message = {
				id: "welcome-personalized",
				sender: "agent",
				text: welcomeText,
				timestamp: new Date().toLocaleTimeString("vi-VN", {
					hour: "2-digit",
					minute: "2-digit",
				}),
			};

			messagesRef.current = [welcomeMsg];
			setMessages([welcomeMsg]);
			// LƯU NGAY LẬP TỨC PHIÊN VÀO HỆ THỐNG ĐỂ ADMIN GIÁM SÁT REAL-TIME
			persistSession("in_progress", undefined, undefined, undefined, [welcomeMsg], newId, startTime);

			if (contactMethodRef.current === "call") {
				setCallDuration(0);
				timerRef.current = setInterval(() => {
					setCallDuration((prev) => prev + 1);
				}, 1000);

				startSpeechRecognition();

				// Phát âm thanh đã tải trước ngay lập tức (0ms độ trễ sau khi nhấc máy)
				if (prefetchGreetingPromise) {
					const audioBase64 = await prefetchGreetingPromise;
					if (audioBase64 && !isTerminatedRef.current && contactMethodRef.current === "call") {
						playAuraAudio(audioBase64);
						setMessages((prev) => {
							const updated = prev.map((m) =>
								m.id === "welcome-personalized" ? { ...m, audioBase64 } : m,
							);
							messagesRef.current = updated;
							return updated;
						});
					}
				}
			}
		}, 650);
	};

	// XÁC NHẬN KẾT THÚC HOÀN TOÀN: Hủy mọi fetch ngầm, dừng audio ngay lập tức, chuyển sang đánh giá
	const executeHardTermination = () => {
		isTerminatedRef.current = true;
		isWaitingResponseRef.current = false;
		holdMusicPlayerRef.current?.stop();

		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}
		if (inactivityGraceTimerRef.current) {
			clearTimeout(inactivityGraceTimerRef.current);
			inactivityGraceTimerRef.current = null;
		}
		setIsWaitingInactivityPrompt(false);
		setIsSessionPaused(false);

		// Hủy toàn bộ fetch ngầm
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}

		stopSpeechRecognition();

		// Tắt và hủy nguồn âm thanh phát ngay lập tức
		if (audioElementRef.current) {
			try {
				audioElementRef.current.pause();
				audioElementRef.current.src = "";
				audioElementRef.current.currentTime = 0;
			} catch {}
		}

		if (streamIntervalRef.current) {
			clearInterval(streamIntervalRef.current);
			streamIntervalRef.current = null;
		}

		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		setIsConnected(false);
		setAgentSpeaking(false);
		setLiveUserTranscript("");
		setIsStreaming(false);
		setStreamingText("");
		setIsWaitingResponse(false);
		setStreamingThinking("");

		// TỰ ĐỘNG LƯU NGAY LẬP TỨC TRẠNG THÁI HOÀN TẤT VÀO HỆ THỐNG
		persistSession("completed");

		// Chuyển sang màn hình đánh giá chất lượng
		setSessionPhase("rating");
	};

	// Xử lý nộp đánh giá chất lượng
	const handleSubmitRating = async () => {
		if (isRatingSubmittingRef.current) return;
		isRatingSubmittingRef.current = true;
		setIsSubmittingRating(true);

		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}
		if (resumeCountdownTimerRef.current) {
			clearTimeout(resumeCountdownTimerRef.current);
			resumeCountdownTimerRef.current = null;
		}

		await persistSession("completed", ratingStars, selectedTags, feedbackComment);
		setIsSubmittingRating(false);
		setSessionPhase("ended");
		isRatingSubmittingRef.current = false;
	};

	triggerAutoSubmitRatingRef.current = handleSubmitRating;

	// Tạm dừng đếm ngược khi có thao tác, tự động tiếp tục đếm ngược sau 2.5s người dùng ngừng thao tác
	const handleRatingInteraction = useCallback(() => {
		if (sessionPhase !== "rating" || isRatingSubmittingRef.current) return;
		setIsCountdownPaused(true);
		isRatingPausedRef.current = true;

		if (resumeCountdownTimerRef.current) {
			clearTimeout(resumeCountdownTimerRef.current);
		}
		resumeCountdownTimerRef.current = setTimeout(() => {
			setIsCountdownPaused(false);
			isRatingPausedRef.current = false;
		}, 2500);
	}, [sessionPhase]);

	// Xử lý chọn số sao đánh giá: Tự động cập nhật bộ câu lựa chọn tương ứng và ghi nhận thao tác
	const handleSelectStar = (star: number) => {
		setRatingStars(star);
		const tagsForStar = DYNAMIC_FEEDBACK_TAGS[star] || DYNAMIC_FEEDBACK_TAGS[5];
		setSelectedTags([tagsForStar[0], tagsForStar[1]]);
		handleRatingInteraction();
	};

	// Quản lý đếm ngược 20s tự động gửi đánh giá CSAT (Tạm dừng khi có thao tác, đếm tiếp khi dừng)
	useEffect(() => {
		if (sessionPhase !== "rating") {
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			if (resumeCountdownTimerRef.current) {
				clearTimeout(resumeCountdownTimerRef.current);
				resumeCountdownTimerRef.current = null;
			}
			return;
		}

		setRatingCountdown(20);
		setIsCountdownPaused(false);
		isRatingPausedRef.current = false;
		isRatingSubmittingRef.current = false;

		countdownIntervalRef.current = setInterval(() => {
			if (!isRatingPausedRef.current && !isRatingSubmittingRef.current) {
				setRatingCountdown((prev) => {
					if (prev <= 1) {
						if (countdownIntervalRef.current) {
							clearInterval(countdownIntervalRef.current);
							countdownIntervalRef.current = null;
						}
						triggerAutoSubmitRatingRef.current();
						return 0;
					}
					return prev - 1;
				});
			}
		}, 1000);

		return () => {
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			if (resumeCountdownTimerRef.current) {
				clearTimeout(resumeCountdownTimerRef.current);
				resumeCountdownTimerRef.current = null;
			}
		};
	}, [sessionPhase]);

	// ======================================================================
	// TỰ ĐỘNG HỎI THĂM KHI NGƯỜI DÙNG KHÔNG TƯƠNG TÁC (KHÔNG TỰ ĐỘNG HỦY CUỘC GỌI)
	// ======================================================================
	const handleInactivityTimeout = useCallback(async () => {
		if (isTerminatedRef.current || isAudioPlayingRef.current || agentSpeakingRef.current || isWaitingResponseRef.current) {
			return;
		}

		const name = customerName.trim();
		let honorific: string = customerGender || "mình";
		if (name) {
			if (customerGender && name.toLowerCase().startsWith(customerGender.toLowerCase() + " ")) {
				honorific = name;
			} else {
				honorific = `${customerGender} ${name}`;
			}
		}
		const inquiryText = `Dạ ${honorific} ơi, mình có còn ở đó không ạ? ${honorific} có muốn tiếp tục trò chuyện hay cần em giải đáp thêm điều gì không ạ?`;

		const timeStr = new Date().toLocaleTimeString("vi-VN", {
			hour: "2-digit",
			minute: "2-digit",
		});

		const inquiryMsg: Message = {
			id: `agent-inquiry-${Date.now()}`,
			sender: "agent",
			text: inquiryText,
			timestamp: timeStr,
		};

		setMessages((prev) => {
			const updated = [...prev, inquiryMsg];
			messagesRef.current = updated;
			persistSession("in_progress", undefined, undefined, undefined, updated);
			return updated;
		});

		setIsWaitingInactivityPrompt(true);

		if (contactMethodRef.current === "call" && isSpeakerOn && !isTerminatedRef.current) {
			try {
				const res = await fetch("/api/ai/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: inquiryText, speed: 1.0 }),
				});
				if (res.ok && !isTerminatedRef.current) {
					const data = (await res.json()) as { audioBase64?: string };
					if (data.audioBase64 && !isTerminatedRef.current) {
						playAuraAudio(data.audioBase64);
					}
				}
			} catch (e) {
				console.warn("[VoiceAgent Inquiry TTS Error]:", e);
			}
		}
	}, [customerName, customerGender, playAuraAudio, isSpeakerOn, persistSession]);

	const resetInactivityTimer = useCallback(() => {
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}
		if (inactivityGraceTimerRef.current) {
			clearTimeout(inactivityGraceTimerRef.current);
			inactivityGraceTimerRef.current = null;
		}
		setIsWaitingInactivityPrompt(false);

		if (isTerminatedRef.current) return;

		inactivityTimerRef.current = setTimeout(() => {
			handleInactivityTimeout();
		}, INACTIVITY_TIMEOUT_MS);
	}, [handleInactivityTimeout]);

	resetInactivityTimerRef.current = resetInactivityTimer;

	const resumeSession = useCallback(() => {
		setIsSessionPaused(false);
		resetInactivityTimer();
		if (contactMethodRef.current === "call") {
			startSpeechRecognition();
		}
	}, [resetInactivityTimer, startSpeechRecognition]);

	const toggleMute = () => {
		const next = !isMuted;
		setIsMuted(next);
		if (next) {
			stopSpeechRecognition();
		} else {
			startSpeechRecognition();
		}
	};

	const toggleSpeaker = () => {
		const next = !isSpeakerOn;
		setIsSpeakerOn(next);
		if (audioElementRef.current) {
			audioElementRef.current.muted = !next;
		}
	};

	const resetToNewSession = () => {
		executeHardTermination();
		setSessionPhase("method_select");
		setInputText("");
		setFeedbackComment("");
		setCustomerName("");
		setCustomerPhone("");
		setCustomerGender("");
		setCustomerAge("");
		setSelectedTopic("");
		setSurveyError("");
		setIsWaitingResponse(false);
		setStreamingThinking("");
		setActiveBookSlug("");
		isTerminatedRef.current = false;
	};

	resetToNewSessionRef.current = resetToNewSession;

	// Xử lý Thêm vào giỏ hàng (hỗ trợ cả phiên bản Sách Điện Tử & Sách Vật Lý)
	const handleAddToCart = (book: BookProductData, edition?: "ebook" | "physical", price?: string) => {
		const cartKey = `${book.id}-${edition || "ebook"}`;
		setAddedBookIds((prev) => ({ ...prev, [book.id]: true, [cartKey]: true }));
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("aurabook:cart-updated", {
					detail: {
						bookId: book.id,
						title: book.title,
						edition: edition === "physical" ? "Bản Sách Giấy (Sách Vật Lý)" : "Bản Ebook (Sách Điện Tử)",
						price: price || (edition === "physical" ? book.physicalPrice : book.ebookPrice) || book.price,
					},
				}),
			);
		}
		setTimeout(() => {
			setAddedBookIds((prev) => ({ ...prev, [book.id]: false, [cartKey]: false }));
		}, 3000);
	};

	// Ẩn hoàn toàn trong Reader view
	if (isReader) {
		return null;
	}


	return (
		<>
			{/* Nút bấm nổi mở CSKH AuraBook - ẨN ĐI KHI ĐÃ NHẤN MỞ THEO ĐÚNG YÊU CẦU */}
			{!isOpen && (
				<div className="fixed bottom-6 right-6 z-50 select-none animate-in fade-in zoom-in-95 duration-200">
					<button
						id="btn-voice-agent-trigger"
						onClick={() => setIsOpen(true)}
						className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shadow-lg border border-border transition-all duration-200 active:scale-95 bg-card hover:bg-secondary hover:border-primary/50"
						title="Trợ Lý Tư Vấn Sách AuraBook"
					>
						<img
							src="/android-chrome-192x192.png"
							alt="AuraBook Logo"
							className="h-8 w-8 rounded-lg object-contain transition-transform hover:scale-105"
						/>
					</button>
				</div>
			)}

			{/* ====================================================================== */}
			{/* KHUNG TƯ VẤN & CSKH AURABOOK */}
			{/* ====================================================================== */}
			{isOpen && (
				<div className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-[620px] w-[94vw] sm:w-[450px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all duration-300">
					{/* Header chung có Logo AuraBook */}
					<div className="flex items-center justify-between border-b border-border bg-card/95 px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background p-1 shadow-xs">
								<img
									src="/android-chrome-192x192.png"
									alt="AuraBook"
									className="h-full w-full object-contain"
								/>
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<h3 className="text-sm font-bold text-foreground">
										Aura AI
									</h3>
									<Badge variant="outline-solid" className="text-[10px] font-semibold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
										Trợ lý AI
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
									<span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
									{isConnected ? (
										<span className="font-mono text-foreground font-semibold">
											{formatDuration(callDuration)} • {contactMethod === "call" ? "Cuộc gọi thoại" : "Nhắn tin"}
										</span>
									) : (
										<span>Sẵn sàng hỗ trợ bạn</span>
									)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-1">
							{sessionPhase === "active" && (
								<button
									onClick={() => setShowEndConfirm(true)}
									className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
									title="Kết thúc cuộc trò chuyện"
								>
									<PhoneOff className="h-4 w-4" />
								</button>
							)}
							<button
								onClick={() => setIsOpen(false)}
								className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
								title="Thu nhỏ cửa sổ"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* POPUP CONFIRM KẾT THÚC CUỘC GỌI / ĐOẠN CHAT */}
					{showEndConfirm && (
						<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-5 animate-in fade-in">
							<div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 text-center shadow-xl space-y-3.5">
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
									<AlertCircle className="h-6 w-6" />
								</div>
								<div className="space-y-1">
									<h4 className="text-sm font-bold text-foreground">Xác nhận kết thúc?</h4>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Bạn có chắc chắn muốn kết thúc phiên tư vấn? Hệ thống sẽ dừng mọi phản hồi và ngắt kết nối hoàn toàn.
									</p>
								</div>
								<div className="flex gap-2 pt-1">
									<Button
										variant="outline-solid"
										size="sm"
										onClick={() => setShowEndConfirm(false)}
										className="flex-1 h-9 rounded-button text-xs font-medium"
									>
										Tiếp tục trò chuyện
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => {
											setShowEndConfirm(false);
											executeHardTermination();
										}}
										className="flex-1 h-9 rounded-button text-xs font-semibold"
									>
										Xác nhận kết thúc
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 1: XÁC NHẬN PHƯƠNG THỨC LIÊN LẠC (VOICE HAY CHAT) */}
					{/* ============================================================== */}
					{sessionPhase === "method_select" && (
						<div className="flex flex-1 flex-col justify-between p-6 bg-card text-center">
							<div className="space-y-3 mt-3">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background p-2 shadow-sm">
									<img
										src="/android-chrome-192x192.png"
										alt="AuraBook Logo"
										className="h-full w-full object-contain"
									/>
								</div>
								<div className="space-y-1">
									<h4 className="text-base font-bold text-foreground">
										Chào mừng bạn đến với AuraBook
									</h4>
									<p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
										Vui lòng chọn phương thức thuận tiện nhất để chuyên viên Aura AI hỗ trợ bạn:
									</p>
								</div>
							</div>

							<div className="space-y-3.5 my-auto">
								<button
									id="btn-select-call"
									onClick={() => {
										setContactMethod("call");
										setSessionPhase("survey");
									}}
									className="w-full flex items-center gap-3.5 rounded-card border border-border bg-card p-4 hover:border-primary hover:bg-secondary/40 transition-all text-left shadow-xs group"
								>
									<div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
										<PhoneCall className="h-5 w-5" />
									</div>
									<div>
										<h5 className="text-sm font-bold text-foreground">Cuộc gọi thoại (Voice Call)</h5>
										<p className="text-xs text-muted-foreground mt-0.5">
											Đàm thoại giọng nói hai chiều trực tiếp với trợ lý Aura AI chuẩn studio.
										</p>
									</div>
								</button>

								<button
									id="btn-select-chat"
									onClick={() => {
										setContactMethod("chat");
										setSessionPhase("survey");
									}}
									className="w-full flex items-center gap-3.5 rounded-card border border-border bg-card p-4 hover:border-primary hover:bg-secondary/40 transition-all text-left shadow-xs group"
								>
									<div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
										<MessageSquare className="h-5 w-5" />
									</div>
									<div>
										<h5 className="text-sm font-bold text-foreground">Nhắn tin trực tiếp (Live Chat)</h5>
										<p className="text-xs text-muted-foreground mt-0.5">
											Tra cứu sách, kiểm tra đơn hàng và nhận thông tin qua tin nhắn văn bản.
										</p>
									</div>
								</button>
							</div>

							<p className="text-xs text-muted-foreground">
								Bảo mật theo tiêu chuẩn Readium LCP & Nền tảng E-commerce AuraBook
							</p>
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 2: KHẢO SÁT DẠNG DROPTEXT (DROPDOWN SELECT, CHỮ TO RÕ RÀNG) */}
					{/* ============================================================== */}
					{sessionPhase === "survey" && (
						<div className="flex flex-1 flex-col justify-between p-6 bg-card overflow-y-auto space-y-4">
							<div className="flex items-center gap-2 border-b border-border pb-3">
								<button
									onClick={() => setSessionPhase("method_select")}
									className="rounded-button p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
								>
									<ArrowLeft className="h-4 w-4" />
								</button>
								<div>
									<h4 className="text-sm font-bold text-foreground">Thông tin tiếp nhận tư vấn</h4>
									<p className="text-xs text-muted-foreground">
										Hình thức: {contactMethod === "call" ? "Cuộc gọi thoại" : "Nhắn tin Live Chat"}
									</p>
								</div>
							</div>

							{/* Hiển thị lỗi nếu thiếu trường bắt buộc */}
							{surveyError && (
								<div
									id="survey-error-alert"
									className="flex items-center gap-2 p-3 rounded-card bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 animate-in fade-in"
								>
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>{surveyError}</span>
								</div>
							)}

							<div className="space-y-4 text-left">
								{/* 1. Trường Họ và Tên */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<User className="h-3.5 w-3.5 text-primary" />
										<span>Họ và tên của bạn</span>
										<span className="text-destructive font-bold text-sm">*</span>
									</label>
									<Input
										id="survey-input-name"
										type="text"
										placeholder="Ví dụ: Nguyễn Minh Tuấn"
										value={customerName}
										onChange={(e) => {
											setCustomerName(e.target.value);
											if (surveyError) setSurveyError("");
										}}
										className="h-10 text-sm rounded-button border border-border bg-background"
									/>
								</div>

								{/* 2. Trường Số Điện Thoại */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Phone className="h-3.5 w-3.5 text-primary" />
										<span>Số điện thoại liên hệ</span>
										<span className="text-destructive font-bold text-sm">*</span>
									</label>
									<Input
										id="survey-input-phone"
										type="tel"
										placeholder="Ví dụ: 0912345678"
										value={customerPhone}
										onChange={(e) => {
											setCustomerPhone(e.target.value);
											if (surveyError) setSurveyError("");
										}}
										className="h-10 text-sm rounded-button border border-border bg-background"
									/>
								</div>

								{/* 3. Droptext Giới Tính / Xưng Hô */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1">
										<span>Cách xưng hô phù hợp</span>
										<span className="text-destructive font-bold text-sm">*</span>
									</label>
									<select
										id="survey-select-gender"
										value={customerGender}
										onChange={(e) => {
											setCustomerGender(e.target.value as any);
											if (surveyError) setSurveyError("");
										}}
										className="w-full h-10 px-3 text-sm rounded-button border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
									>
										<option value="">-- Chọn cách xưng hô * --</option>
										<option value="Anh">Anh (Nam)</option>
										<option value="Chị">Chị (Nữ)</option>
										<option value="Bạn">Bạn (Khác / Trung tính)</option>
									</select>
								</div>

								{/* 4. Droptext Nhóm Độ Tuổi */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1">
										<span>Nhóm độ tuổi của bạn</span>
										<span className="text-destructive font-bold text-sm">*</span>
									</label>
									<select
										id="survey-select-age"
										value={customerAge}
										onChange={(e) => {
											setCustomerAge(e.target.value as any);
											if (surveyError) setSurveyError("");
										}}
										className="w-full h-10 px-3 text-sm rounded-button border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
									>
										<option value="">-- Chọn nhóm độ tuổi * --</option>
										<option value="Dưới 18">Dưới 18 tuổi (Học sinh)</option>
										<option value="18 - 24">18 - 24 tuổi (Sinh viên & Mới đi làm)</option>
										<option value="25 - 35">25 - 35 tuổi (Người đi làm & Trưởng thành)</option>
										<option value="Trên 35">Trên 35 tuổi (Trung niên & Chuyên gia)</option>
									</select>
								</div>

								{/* 5. Droptext Chủ Đề / Lí Do Hỗ Trợ */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1">
										<span>Lý do / Chủ đề cần hỗ trợ hôm nay</span>
										<span className="text-destructive font-bold text-sm">*</span>
									</label>
									<select
										id="survey-select-topic"
										value={selectedTopic}
										onChange={(e) => {
											setSelectedTopic(e.target.value);
											if (surveyError) setSurveyError("");
										}}
										className="w-full h-10 px-3 text-sm rounded-button border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
									>
										<option value="">-- Chọn lý do cần hỗ trợ * --</option>
										{INTAKE_TOPICS.map((topic) => (
											<option key={`intake-${topic.id}`} value={topic.title}>
												{topic.title}
											</option>
										))}
									</select>
									{selectedTopic && (
										<p className="text-[11px] text-muted-foreground italic px-1 pt-0.5">
											{INTAKE_TOPICS.find((t) => t.title === selectedTopic)?.desc}
										</p>
									)}
								</div>
							</div>

							<Button
								id="survey-submit-btn"
								onClick={executeConnection}
								className="w-full h-11 rounded-button font-semibold text-sm shadow-xs mt-2"
							>
								<span>Bắt đầu kết nối chuyên viên</span>
							</Button>
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 3: LOADING HÌNH THANG */}
					{/* ============================================================== */}
					{sessionPhase === "connecting" && (
						<div className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-card space-y-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background p-2 shadow-xs">
								<img
									src="/android-chrome-192x192.png"
									alt="AuraBook"
									className="h-full w-full object-contain"
								/>
							</div>

							<div className="space-y-1">
								<h4 className="text-base font-bold text-foreground">
									Đang kết nối tới chuyên viên Aura AI...
								</h4>
								<p className="text-xs text-muted-foreground">
									Đang nạp hồ sơ: <span className="font-semibold text-foreground">{customerGender} {customerName || "Độc giả"}</span> ({customerAge})
								</p>
								<p className="text-xs text-muted-foreground italic">
									Chủ đề: {selectedTopic}
								</p>
							</div>

							<div className="pt-2">
								<Loader text="Đang thiết lập kênh thoại studio..." size="md" />
							</div>
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 4: GIAO DIỆN HỘI THOẠI CHUẨN MESSENGER */}
					{/* ============================================================== */}
					{sessionPhase === "active" && (
						<div className="flex flex-1 flex-col overflow-hidden bg-card">
							{contactMethod === "call" && (
								<div className="flex items-center justify-between border-b border-border/70 bg-secondary/40 px-3.5 py-1.5 text-xs">
									<div className="flex items-center gap-1.5 text-muted-foreground">
										<Mic className={cn("h-3.5 w-3.5", agentSpeaking ? "text-muted-foreground" : "text-emerald-500 animate-pulse")} />
										<span>{agentSpeaking ? "Aura AI đang nói..." : "Đang lắng nghe bạn..."}</span>
									</div>
									<span className="font-mono text-foreground font-semibold">
										{formatDuration(callDuration)}
									</span>
								</div>
							)}

							{/* VÙNG MESSENGER FEED */}
							<div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
								{messages.map((m, idx) => {
									const isUser = m.sender === "user";
									return (
										<div
											key={`msg-${m.id || "chat"}-${idx}`}
											className={cn(
												"flex gap-2.5 items-end",
												isUser ? "flex-row-reverse" : "flex-row",
											)}
										>
											{/* Avatar tròn */}
											<div
												className={cn(
													"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border shadow-2xs select-none overflow-hidden",
													isUser
														? "bg-primary text-primary-foreground border-primary"
														: "bg-background border-border",
												)}
											>
												{isUser ? (
													customerName ? customerName.charAt(0).toUpperCase() : <User className="h-4 w-4" />
												) : (
													<img
														src="/android-chrome-192x192.png"
														alt="AuraBook"
														className="h-full w-full object-contain p-0.5"
													/>
												)}
											</div>

											{/* Bong bóng tin nhắn Messenger */}
											<div
												className={cn(
													"flex flex-col max-w-[82%] p-3 leading-relaxed shadow-xs transition-all",
													isUser
														? "bg-primary text-primary-foreground rounded-2xl rounded-br-xs"
														: "bg-secondary text-foreground border border-border rounded-2xl rounded-bl-xs",
												)}
											>
												<div
													className={cn(
														"flex items-center justify-between gap-3 text-[10px] mb-1",
														isUser ? "text-primary-foreground/80" : "text-muted-foreground",
													)}
												>
													<span className="font-semibold">
														{isUser ? (customerName ? `${customerGender} ${customerName}` : "Bạn") : "Aura AI"}
													</span>
													<span className="tabular-nums">{m.timestamp}</span>
												</div>

												{/* Khối hiển thị suy nghĩ của AI (nếu có) */}
												{m.thinking && (
													<details className="mb-2 rounded-lg border border-border/80 bg-background/70 p-2 text-xs group transition-all">
														<summary className="flex cursor-pointer select-none items-center gap-1.5 font-medium text-[11px] text-primary hover:text-primary/80">
															<HelpCircle className="h-3 w-3 text-primary shrink-0" />
															<span>Xem tiến trình suy nghĩ của AI ({activeModel || "gemma2:2b"})</span>
														</summary>
														<div className="mt-2 pl-3 border-l-2 border-primary/40 font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
															{m.thinking}
														</div>
													</details>
												)}

												<p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p>

												{/* Thẻ sản phẩm */}
												{m.cards && m.cards.length > 0 && (
													<div className="mt-2 pt-1 border-t border-border/60">
														<ProductRailSection
															cards={m.cards}
															addedBookIds={addedBookIds}
															onAddToCart={handleAddToCart}
															onViewDetail={(slug) => {
																router.push(`/products/${slug}`);
																setIsOpen(false);
															}}
														/>
													</div>
												)}

												{/* Nút nghe lại phát âm câu này: CHỈ ĐỂ ICON LOA, BỎ CHỮ */}
												{m.sender === "agent" && (
													<div className="mt-2 pt-1 flex items-center justify-between border-t border-border/40">
														<button
															type="button"
															onClick={() => playMessageAudio(m)}
															className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-secondary border border-border/60 transition-all shadow-2xs active:scale-95"
															title="Nghe phát âm từ Aura AI"
														>
															<Volume2 className="h-3 w-3 text-primary shrink-0" />
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})}

								{/* STREAMING NÓI CỦA NGƯỜI DÙNG REALTIME Ở BÊN PHẢI */}
								{liveUserTranscript && (
									<div className="flex gap-2.5 items-end flex-row-reverse animate-in fade-in duration-150">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground border border-primary shadow-2xs">
											{customerName ? customerName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
										</div>
										<div className="flex flex-col max-w-[82%] p-3 bg-primary text-primary-foreground rounded-2xl rounded-br-xs shadow-xs border border-primary-foreground/20">
											<div className="flex items-center justify-between gap-3 text-[10px] text-primary-foreground/90 mb-1">
												<span className="font-semibold flex items-center gap-1">
													<Mic className="h-3 w-3 animate-pulse" />
													<span>Bạn đang nói...</span>
												</span>
												<span className="text-[9px] font-mono animate-pulse">realtime</span>
											</div>
											<p className="whitespace-pre-line text-[14px] leading-relaxed italic font-medium">
												"{liveUserTranscript}"
											</p>
										</div>
									</div>
								)}

								{/* TRẠNG THÁI ĐANG CHỜ CHATBOT TRẢ LỜI: HIỂN THỊ LOADING HÌNH THANG */}
								{isWaitingResponse && (
									<div className="flex gap-2.5 items-end flex-row animate-in fade-in duration-150">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-2xs overflow-hidden p-0.5">
											<img
												src="/android-chrome-192x192.png"
												alt="AuraBook"
												className="h-full w-full object-contain"
											/>
										</div>
										<div className="flex flex-col max-w-[82%] p-3.5 bg-secondary text-foreground border border-border rounded-2xl rounded-bl-xs shadow-xs space-y-2">
											<div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
												<span className="font-semibold text-foreground">Aura AI</span>
												<span className="text-primary text-[10px] flex items-center gap-1 font-medium">
													<RotateCcw className="h-2.5 w-2.5 animate-spin text-primary" />
													<span>Đang suy nghĩ...</span>
												</span>
											</div>
											<div className="py-2.5 px-3 flex flex-col items-center justify-center text-center">
												<Loader size="sm" text="Aura AI đang xử lý câu trả lời..." />
											</div>
										</div>
									</div>
								)}

								{/* STREAMING TRẢ LỜI CỦA AURA AI Ở BÊN TRÁI */}
								{isStreaming && streamingText && (
									<div className="flex gap-2.5 items-end flex-row animate-in fade-in duration-150">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-2xs overflow-hidden p-0.5">
											<img
												src="/android-chrome-192x192.png"
												alt="AuraBook"
												className="h-full w-full object-contain"
											/>
										</div>
										<div className="flex flex-col max-w-[82%] p-3 bg-secondary text-foreground border border-border rounded-2xl rounded-bl-xs shadow-xs">
											<div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground mb-1.5">
												<span className="font-semibold text-foreground">Aura AI</span>
												<span className="text-primary text-[9px] flex items-center gap-1 font-medium">
													<span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
													<span>Đang trả lời...</span>
												</span>
											</div>

											{/* Streaming suy nghĩ của AI nếu có */}
											{streamingThinking && (
												<details open className="mb-2 rounded-lg border border-border/80 bg-background/80 p-2 text-xs">
													<summary className="flex cursor-pointer select-none items-center gap-1.5 font-medium text-[11px] text-primary">
														<HelpCircle className="h-3 w-3 text-primary shrink-0" />
														<span>Tiến trình suy nghĩ của AI ({activeModel || "gemma2:2b"})</span>
													</summary>
													<div className="mt-1.5 pl-3 border-l-2 border-primary/40 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
														{streamingThinking}
													</div>
												</details>
											)}

											<p className="whitespace-pre-line leading-relaxed text-[14px]">
												{streamingText}
												<span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary animate-pulse align-middle" />
											</p>
										</div>
									</div>
								)}

								<div ref={messagesEndRef} />
							</div>

							{/* PHẦN ĐIỀU KHIỂN DƯỚI CÙNG */}
							{isTerminatedRef.current ? (
								<div className="border-t border-border bg-card p-3 flex items-center justify-between gap-2 animate-in fade-in">
									<div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
										<Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
										<span className="truncate">Phiên tư vấn hoàn tất • Lịch sử được lưu</span>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<Button size="sm" variant="outline-solid" onClick={resetToNewSession} className="h-8 text-xs font-semibold">
											<RotateCcw className="h-3 w-3 mr-1" />
											<span>Tạo phiên mới</span>
										</Button>
										<Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 text-xs text-muted-foreground hover:text-foreground">
											<span>Đóng</span>
										</Button>
									</div>
								</div>
							) : contactMethod === "call" ? (
								<div className="border-t border-border bg-card p-3 space-y-2">
									{/* Banner nhắc nhở phản hồi 30s trong chế độ gọi thoại */}
									{isWaitingInactivityPrompt && (
										<div className="mx-1 mb-1 p-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs flex items-center justify-between gap-2 animate-in fade-in">
											<span className="flex items-center gap-1.5 font-medium">
												<AlertCircle className="h-3.5 w-3.5 shrink-0 animate-pulse" />
												<span className="text-[11px]">Aura AI đang đợi bạn phản hồi (30s)...</span>
											</span>
											<button
												type="button"
												onClick={() => {
													resetInactivityTimerRef.current();
													handleSendMessage("Dạ em vẫn đang nghe ạ!");
												}}
												className="shrink-0 rounded-lg bg-primary text-primary-foreground font-semibold px-2 py-0.5 text-[11px] hover:bg-primary/90 transition-colors shadow-2xs"
											>
												Vẫn đang nghe
											</button>
										</div>
									)}

									{showKeyboardInput && (
										<form
											onSubmit={(e) => {
												e.preventDefault();
												if (inputText.trim()) {
													handleSendMessage(inputText);
													setInputText("");
												}
											}}
											className="flex items-center gap-1.5 pb-1"
										>
											<Input
												ref={inputRef}
												type="text"
												placeholder="Gõ tin nhắn nếu micro bị ồn..."
												value={inputText}
												onChange={(e) => setInputText(e.target.value)}
												className="h-9 text-sm rounded-button"
											/>
											<Button type="submit" size="sm" className="h-8 px-2.5 rounded-button text-xs">
												<Send className="h-3.5 w-3.5" />
											</Button>
										</form>
									)}

									<div className="flex items-center justify-center gap-3">
										<button
											onClick={toggleMute}
											className={cn(
												"flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-95 shadow-xs",
												isMuted
													? "bg-destructive/10 text-destructive border-destructive/20"
													: "bg-secondary text-foreground border-border hover:bg-secondary/80",
											)}
											title={isMuted ? "Bật micro" : "Tắt micro"}
										>
											{isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
										</button>

										<button
											onClick={toggleSpeaker}
											className={cn(
												"flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-95 shadow-xs",
												!isSpeakerOn
													? "bg-amber-500/10 text-amber-600 border-amber-500/20"
													: "bg-secondary text-foreground border-border hover:bg-secondary/80",
											)}
											title={isSpeakerOn ? "Tắt loa" : "Bật loa"}
										>
											{isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
										</button>

										<button
											onClick={() => {
												setShowKeyboardInput(!showKeyboardInput);
												setTimeout(() => inputRef.current?.focus(), 100);
											}}
											className={cn(
												"flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-95 shadow-xs",
												showKeyboardInput
													? "bg-primary text-primary-foreground border-primary"
													: "bg-secondary text-foreground border-border hover:bg-secondary/80",
											)}
											title="Mở thanh gõ phím"
										>
											<Keyboard className="h-4 w-4" />
										</button>

										<button
											onClick={() => setShowEndConfirm(true)}
											className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-all active:scale-95"
											title="Kết thúc cuộc gọi hoàn toàn"
										>
											<PhoneOff className="h-5 w-5" />
										</button>
									</div>
								</div>
							) : (
								<div className="border-t border-border bg-card">
									{/* Banner thông báo Aura AI đang đợi người dùng phản hồi sau 30s */}
									{isWaitingInactivityPrompt && (
										<div className="mx-2 mt-2 p-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs flex items-center justify-between gap-2 animate-in fade-in">
											<span className="flex items-center gap-1.5 font-medium">
												<AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
												<span>Aura AI đang đợi bạn phản hồi (30s không hoạt động)...</span>
											</span>
											<button
												type="button"
												onClick={() => {
													resetInactivityTimerRef.current();
													handleSendMessage("Dạ em vẫn đang ở đây ạ!");
												}}
												className="shrink-0 rounded-lg bg-primary text-primary-foreground font-semibold px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors shadow-2xs"
											>
												Tiếp tục trò chuyện
											</button>
										</div>
									)}

									{/* Banner thông báo phiên đã tạm dừng */}
									{isSessionPaused && (
										<div className="mx-2 mt-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-2 animate-in fade-in">
											<span className="flex items-center gap-1.5 font-medium">
												<AlertCircle className="h-4 w-4 shrink-0" />
												<span>Phiên trò chuyện đã tạm dừng do không hoạt động.</span>
											</span>
											<button
												type="button"
												onClick={resumeSession}
												className="shrink-0 rounded-lg bg-primary text-primary-foreground font-semibold px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors shadow-2xs"
											>
												Tiếp tục
											</button>
										</div>
									)}

									<form
										onSubmit={(e) => {
											e.preventDefault();
											if (inputText.trim()) {
												handleSendMessage(inputText);
												setInputText("");
											}
										}}
										className="flex items-center gap-2 p-2.5"
									>
										<Input
											type="text"
											placeholder="Hỏi giá sách, tác giả hoặc đơn hàng..."
											value={inputText}
											onChange={(e) => {
												setInputText(e.target.value);
												resetInactivityTimerRef.current();
												if (isSessionPaused) setIsSessionPaused(false);
											}}
											onFocus={() => {
												resetInactivityTimerRef.current();
												if (isSessionPaused) setIsSessionPaused(false);
											}}
											className="h-9 text-sm rounded-button"
										/>
										<Button
											type="submit"
											size="icon"
											disabled={!inputText.trim()}
											className="h-9 w-9 shrink-0 rounded-button"
										>
											<Send className="h-4 w-4" />
										</Button>
									</form>
								</div>
							)}
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 5: ĐÁNH GIÁ CHẤT LƯỢNG CUỘC TRÒ CHUYỆN (RATING SCREEN) */}
					{/* ============================================================== */}
					{sessionPhase === "rating" && (
						<div
							className="flex flex-1 flex-col justify-between p-5 bg-card text-center overflow-y-auto select-none"
							onMouseMove={handleRatingInteraction}
							onMouseDown={handleRatingInteraction}
							onTouchStart={handleRatingInteraction}
							onTouchMove={handleRatingInteraction}
							onKeyDown={handleRatingInteraction}
						>
							<div className="space-y-1 mt-0.5">
								<h4 className="text-base font-bold text-foreground">
									Đánh giá chất lượng tư vấn
								</h4>
								<p className="text-xs text-muted-foreground">
									{customerGender} {customerName || "bạn"} thấy sự hỗ trợ của Aura AI hôm nay thế nào?
								</p>

								{/* GƯƠNG MẶT ĐỘNG 3 ĐƯỜNG SVG (MẮT TRÁI, MẮT PHẢI, KHUÔN MIỆNG) BIẾN THIÊN THEO SỐ SAO */}
								<DynamicFace3Lines rating={ratingStars} />
							</div>

							{/* BỘ CHỌN SỐ SAO (1 ĐẾN 5 SAO) */}
							<div className="flex items-center justify-center gap-2 my-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={`rating-star-btn-${star}`}
										type="button"
										onClick={() => handleSelectStar(star)}
										onMouseEnter={handleRatingInteraction}
										className="p-1 transition-transform hover:scale-120 active:scale-95"
										title={`${star} sao`}
									>
										<Star
											className={cn(
												"h-7 w-7 transition-colors",
												star <= ratingStars
													? "fill-amber-400 text-amber-400"
													: "fill-muted text-muted-foreground/30",
											)}
										/>
									</button>
								))}
							</div>

							{/* CÁC CÂU LỰA CHỌN THAY ĐỔI ĐỘNG THEO SỐ SAO NGƯỜI DÙNG CHỌN */}
							<div className="space-y-1.5 text-left">
								<span className="text-xs font-semibold text-foreground flex items-center justify-between">
									<span>Ý kiến đánh giá ({ratingStars} sao):</span>
									<span className="text-[11px] text-muted-foreground font-normal">Chọn tiêu chí phù hợp</span>
								</span>
								<div className="flex flex-wrap gap-1.5 min-h-[58px]">
									{(DYNAMIC_FEEDBACK_TAGS[ratingStars] || DYNAMIC_FEEDBACK_TAGS[5]).map((tag) => {
										const isSelected = selectedTags.includes(tag);
										return (
											<button
												key={`feedback-tag-${ratingStars}-${tag}`}
												type="button"
												onClick={() => {
													handleRatingInteraction();
													if (isSelected) {
														setSelectedTags(selectedTags.filter((t) => t !== tag));
													} else {
														setSelectedTags([...selectedTags, tag]);
													}
												}}
												className={cn(
													"px-2.5 py-1 text-xs font-medium rounded-full border transition-all text-left",
													isSelected
														? "border-primary bg-primary text-primary-foreground shadow-2xs"
														: "border-border bg-card text-muted-foreground hover:bg-secondary",
												)}
											>
												{tag}
											</button>
										);
									})}
								</div>
							</div>

							{/* GÓP Ý THÊM */}
							<div className="space-y-1 text-left mt-1">
								<span className="text-xs font-semibold text-foreground">
									Góp ý thêm (tùy chọn):
								</span>
								<Input
									type="text"
									placeholder="Chia sẻ thêm cảm nhận của bạn..."
									value={feedbackComment}
									onChange={(e) => {
										setFeedbackComment(e.target.value);
										handleRatingInteraction();
									}}
									onFocus={handleRatingInteraction}
									className="h-9 text-xs rounded-button"
								/>
							</div>

							{/* BANNER ĐẾM NGƯỢC 20S TỰ ĐỘNG GỬI ĐÁNH GIÁ (TẠM DỪNG KHI THAO TÁC, ĐẾM TIẾP KHI DỪNG) */}
							<div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg border bg-secondary/50 text-xs">
								<div className="flex items-center gap-1.5">
									{isCountdownPaused ? (
										<span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
											<span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
											<span>Đang thao tác: Đã tạm dừng đếm ngược</span>
										</span>
									) : (
										<span className="flex items-center gap-1 text-muted-foreground font-medium">
											<span className="inline-block h-2 w-2 rounded-full bg-primary animate-ping" />
											<span>Tự động gửi đánh giá sau:</span>
										</span>
									)}
								</div>
								<span
									className={cn(
										"font-mono font-bold px-2 py-0.5 rounded text-xs transition-colors",
										isCountdownPaused
											? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
											: ratingCountdown <= 5
												? "bg-destructive/20 text-destructive animate-pulse"
												: "bg-primary/10 text-primary",
									)}
								>
									{ratingCountdown}s
								</span>
							</div>

							<div className="pt-2">
								{isSubmittingRating ? (
									<Loader text="Đang gửi đánh giá của bạn..." size="sm" />
								) : (
									<Button
										onClick={handleSubmitRating}
										className="w-full h-10 rounded-button text-xs font-semibold shadow-xs"
									>
										<span>Gửi đánh giá & Hoàn tất</span>
									</Button>
								)}
							</div>
						</div>
					)}

					{/* ============================================================== */}
					{/* BƯỚC 6: TRẠNG THÁI KẾT THÚC (ENDED STATE) - BẢO TOÀN LỊCH SỬ */}
					{/* ============================================================== */}
					{sessionPhase === "ended" && (
						<div className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-card space-y-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-xs animate-in zoom-in-95 duration-200">
								<Check className="h-8 w-8" />
							</div>

							<div className="space-y-1">
								<h4 className="text-base font-bold text-foreground">Cảm ơn bạn đã trò chuyện!</h4>
								<p className="text-xs text-muted-foreground max-w-xs mx-auto">
									Đánh giá của bạn đã được ghi nhận vào hệ thống giám sát chất lượng AuraBook. Toàn bộ lịch sử tư vấn và sách gợi ý vẫn được lưu giữ trọn vẹn.
								</p>
								<div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
									{[1, 2, 3, 4, 5].slice(0, ratingStars).map((starNum) => (
										<Star key={`star-ended-${starNum}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
									))}
								</div>
							</div>

							<div className="flex flex-col gap-2 w-full max-w-xs pt-2">
								<Button
									onClick={() => setSessionPhase("active")}
									className="w-full h-10 rounded-button text-xs font-semibold shadow-xs"
								>
									<BookOpen className="h-3.5 w-3.5 mr-1.5" />
									<span>Xem lại nội dung & danh sách sách</span>
								</Button>
								<Button
									variant="outline-solid"
									onClick={resetToNewSession}
									className="w-full h-10 rounded-button text-xs font-semibold"
								>
									<RotateCcw className="h-3.5 w-3.5 mr-1.5" />
									<span>Bắt đầu cuộc trò chuyện mới</span>
								</Button>
								<Button
									variant="ghost"
									onClick={() => setIsOpen(false)}
									className="w-full h-9 rounded-button text-xs text-muted-foreground hover:text-foreground"
								>
									<span>Đóng cửa sổ</span>
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
