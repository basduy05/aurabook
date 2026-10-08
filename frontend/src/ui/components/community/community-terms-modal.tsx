"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	ShieldCheck,
	BookOpen,
	Users,
	AlertCircle,
	X,
	Award,
	Scale,
	Lock,
	Sparkles,
	CheckCircle2,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Checkbox } from "@/ui/components/ui/checkbox";

interface CommunityTermsModalProps {
	isOpen: boolean;
	mandatory?: boolean;
	onClose?: () => void;
	onAccept: () => Promise<void>;
}

export function CommunityTermsModal({
	isOpen,
	mandatory = false,
	onClose,
	onAccept,
}: CommunityTermsModalProps) {
	const [accepted, setAccepted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!isOpen || !mounted) return null;

	const handleConfirm = async () => {
		if (!accepted || isSubmitting) return;
		setIsSubmitting(true);
		try {
			await onAccept();
		} finally {
			setIsSubmitting(false);
		}
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-foreground/75 backdrop-blur-md animate-in fade-in-0 duration-200">
			<div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
				{/* Close Button if not mandatory */}
				{!mandatory && onClose && (
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
						aria-label="Đóng"
					>
						<X className="h-5 w-5" />
					</button>
				)}

				{/* Header */}
				<div className="flex items-start gap-3.5 border-b border-border/70 pb-4 shrink-0">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 shrink-0">
						<BookOpen className="h-6 w-6" />
					</div>
					<div className="min-w-0 pr-6">
						<div className="flex items-center gap-2 flex-wrap">
							<h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
								Quy Ước & Điều Khoản Cộng Đồng Độc Giả Aurabook
							</h2>
							<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-semibold text-[11px] px-2.5 py-0.5">
								<Sparkles className="h-3 w-3" />
								Phiên bản 2026
							</span>
						</div>
						<p className="text-[12.5px] sm:text-[13px] text-muted-foreground mt-1 leading-relaxed">
							Quy chuẩn văn hóa ứng xử, bảo vệ bản quyền và điều khoản tham gia diễn đàn văn học dành cho độc giả chính thức.
						</p>
					</div>
				</div>

				{/* Detailed Terms Content - Custom Scrollbar */}
				<div className="my-4 space-y-3.5 overflow-y-auto pr-1.5 text-[13px] text-foreground/90 flex-1">
					{/* Điều 1 */}
					<div className="rounded-2xl border border-border/80 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
						<div className="flex items-center gap-2.5 font-bold text-[13.5px] text-foreground">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<Users className="h-3.5 w-3.5" />
							</div>
							<span>1. Văn Hóa Ứng Xử & Tôn Trọng Đa Chiều</span>
						</div>
						<div className="mt-2 text-[12.5px] sm:text-[13px] text-muted-foreground space-y-1.5 leading-relaxed pl-8">
							<p>
								• Mỗi độc giả có góc nhìn, thị hiếu và cảm thụ văn học riêng. Mọi phản biện cần giữ thái độ văn minh, xây dựng và tôn trọng cá tính người viết.
							</p>
							<p>
								• Nghiêm cấm tuyệt đối mọi hành vi thù địch, miệt thị vùng miền, tôn giáo, phân biệt đối xử, quấy rối hoặc bôi nhọ danh dự của tác giả, dịch giả và các thành viên khác.
							</p>
						</div>
					</div>

					{/* Điều 2 */}
					<div className="rounded-2xl border border-border/80 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
						<div className="flex items-center gap-2.5 font-bold text-[13.5px] text-foreground">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<Award className="h-3.5 w-3.5" />
							</div>
							<span>2. Tính Trung Thực & Giá Trị Đánh Giá Sách</span>
						</div>
						<div className="mt-2 text-[12.5px] sm:text-[13px] text-muted-foreground space-y-1.5 leading-relaxed pl-8">
							<p>
								• Bài đánh giá (review) cần dựa trên trải nghiệm đọc thực tế. Chúng tôi khuyến khích phân tích nội dung, trích dẫn bài học và liên hệ thực tiễn để mang lại giá trị tham khảo cao nhất.
							</p>
							<p>
								• Cấm hành vi "đánh giá bẩn" (review bombing), nhận tiền quảng cáo trá hình hoặc tạo tài khoản ảo nhằm can thiệp xếp hạng của tác phẩm trên hệ thống Aurabook.
							</p>
						</div>
					</div>

					{/* Điều 3 */}
					<div className="rounded-2xl border border-border/80 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
						<div className="flex items-center gap-2.5 font-bold text-[13.5px] text-foreground">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<Scale className="h-3.5 w-3.5" />
							</div>
							<span>3. Bảo Vệ Bản Quyền & Sở Hữu Trí Tuệ</span>
						</div>
						<div className="mt-2 text-[12.5px] sm:text-[13px] text-muted-foreground space-y-1.5 leading-relaxed pl-8">
							<p>
								• Tôn trọng bản quyền tác giả và nhà xuất bản. Nghiêm cấm chia sẻ tệp sách lậu (PDF, EPUB không bản quyền), bản scan hoặc đường dẫn tải tài liệu xâm phạm bản quyền.
							</p>
							<p>
								• Khi trích dẫn nội dung từ tác phẩm, vui lòng nêu rõ tên sách, tác giả và nhà phát hành. Không sao chép toàn bộ chương sách mà không có sự cho phép.
							</p>
						</div>
					</div>

					{/* Điều 4 */}
					<div className="rounded-2xl border border-border/80 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
						<div className="flex items-center gap-2.5 font-bold text-[13.5px] text-foreground">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<AlertCircle className="h-3.5 w-3.5" />
							</div>
							<span>4. Nghiêm Cấm Quảng Cáo Rác, Lừa Đảo & Spam</span>
						</div>
						<div className="mt-2 text-[12.5px] sm:text-[13px] text-muted-foreground space-y-1.5 leading-relaxed pl-8">
							<p>
								• Không được chèn link liên kết tiếp thị bên thứ ba, link bán hàng cá nhân hoặc các nội dung cờ bạc, đa cấp, tài chính rủi ro vào bài viết hay bình luận.
							</p>
							<p>
								• Không gửi hàng loạt bình luận vô nghĩa, lặp lại nội dung hoặc gắn thẻ (mention) thành viên khác một cách ác ý.
							</p>
						</div>
					</div>

					{/* Điều 5 */}
					<div className="rounded-2xl border border-border/80 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
						<div className="flex items-center gap-2.5 font-bold text-[13.5px] text-foreground">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<Lock className="h-3.5 w-3.5" />
							</div>
							<span>5. Liên Kết Tài Khoản Thật & Biện Pháp Xử Lý Vi Phạm</span>
						</div>
						<div className="mt-2 text-[12.5px] sm:text-[13px] text-muted-foreground space-y-1.5 leading-relaxed pl-8">
							<p>
								• Hồ sơ cộng đồng luôn đồng bộ và gắn chặt với tài khoản mua hàng chính thức. Khi đăng xuất tài khoản chính, trạng thái cộng đồng sẽ tự động chấm dứt.
							</p>
							<p>
								• Các bài viết vi phạm sẽ bị ẩn hoặc xóa mà không cần báo trước. Tài khoản cố ý vi phạm nghiêm trọng sẽ bị khóa quyền truy cập cộng đồng vĩnh viễn bởi Ban Quản Trị.
							</p>
						</div>
					</div>
				</div>

				{/* Checkbox agreement */}
				<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shrink-0">
					<label className="flex items-start gap-3 cursor-pointer">
						<Checkbox
							id="accept-terms"
							checked={accepted}
							onCheckedChange={(checked) => setAccepted(!!checked)}
							className="mt-0.5 border-primary/60 data-[state=checked]:bg-primary"
						/>
						<span className="text-[12.5px] sm:text-[13px] leading-relaxed text-foreground font-medium select-none">
							Tôi xác nhận đã đọc, hiểu rõ và tự nguyện cam kết tuân thủ đầy đủ các Điều khoản & Quy ước Cộng đồng Độc giả Aurabook nêu trên.
						</span>
					</label>
				</div>

				{/* Actions */}
				<div className="mt-4 flex items-center justify-between gap-3 shrink-0 pt-2 border-t border-border/60">
					<div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
						<ShieldCheck className="h-4 w-4 text-emerald-500" />
						<span>Xác thực bởi Aurabook Trust & Safety</span>
					</div>

					<div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
						{!mandatory && onClose && (
							<Button
								type="button"
								variant="outline-solid"
								onClick={onClose}
								className="text-[13px] rounded-xl font-medium px-4"
							>
								Đóng
							</Button>
						)}
						<Button
							type="button"
							onClick={handleConfirm}
							disabled={!accepted || isSubmitting}
							className="w-full sm:w-auto px-6 py-2.5 font-bold text-[13px] rounded-xl shadow-md gap-2"
						>
							<CheckCircle2 className="h-4 w-4" />
							<span>{isSubmitting ? "Đang xử lý..." : "Tôi đồng ý & Tiếp tục"}</span>
						</Button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
