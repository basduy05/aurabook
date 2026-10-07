"use client";

import { useState } from "react";
import { ShieldCheck, BookOpen, Users, AlertCircle, X } from "lucide-react";
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

	if (!isOpen) return null;

	const handleConfirm = async () => {
		if (!accepted || isSubmitting) return;
		setIsSubmitting(true);
		try {
			await onAccept();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-md animate-in fade-in-0">
			<div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all sm:p-8 animate-in zoom-in-95">
				{/* Optional Close Button if not mandatory onboarding */}
				{!mandatory && onClose && (
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Đóng"
					>
						<X className="h-5 w-5" />
					</button>
				)}

				{/* Header */}
				<div className="flex items-center gap-3 border-b border-border pb-4">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
						<BookOpen className="h-6 w-6" />
					</div>
					<div>
						<h2 className="text-[15px] font-semibold tracking-tight text-foreground">
							{mandatory ? "Điều khoản tham gia Cộng đồng" : "Quy ước Cộng đồng Độc giả"}
						</h2>
						<p className="text-[13px] text-muted-foreground mt-0.5">
							Quy ước ứng xử và điều khoản tham gia diễn đàn văn hóa đọc Aurabook
						</p>
					</div>
				</div>

				{/* Guidelines Content */}
				<div className="my-5 max-h-72 space-y-3.5 overflow-y-auto pr-2 text-[13px] text-foreground/90">
					<div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
						<div className="flex items-center gap-2 font-semibold text-[13px] text-foreground">
							<Users className="h-4 w-4 text-primary" />
							<span>1. Tôn trọng và văn minh</span>
						</div>
						<p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
							Mỗi cuốn sách mang đến một góc nhìn riêng. Luôn lắng nghe, phản biện có văn hóa và tôn trọng sự đa dạng trong cách cảm nhận văn học.
						</p>
					</div>

					<div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
						<div className="flex items-center gap-2 font-semibold text-[13px] text-foreground">
							<BookOpen className="h-4 w-4 text-primary" />
							<span>2. Đánh giá trung thực, chất lượng</span>
						</div>
						<p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
							Khuyến khích chia sẻ trải nghiệm đọc thực tế, phân tích sâu về nội dung thay vì viết ngắn gọn không có giá trị tham khảo.
						</p>
					</div>

					<div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
						<div className="flex items-center gap-2 font-semibold text-[13px] text-foreground">
							<AlertCircle className="h-4 w-4 text-primary" />
							<span>3. Nghiêm cấm quảng cáo & Spam</span>
						</div>
						<p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
							Không chèn link bán hàng bên ngoài, không spam đánh giá giả mạo, không vi phạm bản quyền hay chia sẻ tài liệu lậu.
						</p>
					</div>

					<div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
						<div className="flex items-center gap-2 font-semibold text-[13px] text-foreground">
							<ShieldCheck className="h-4 w-4 text-primary" />
							<span>4. Bảo vệ tài khoản & Dữ liệu</span>
						</div>
						<p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
							Bạn có thể tùy biến tên hiển thị, ảnh đại diện và bio trong trang cá nhân. Mọi hành vi vi phạm có thể bị khoá quyền tham gia bởi Ban quản trị.
						</p>
					</div>
				</div>

				{/* Checkbox agreement */}
				<div className="rounded-xl border border-border bg-background p-3.5">
					<label className="flex items-start gap-3 cursor-pointer">
						<Checkbox
							id="accept-terms"
							checked={accepted}
							onCheckedChange={(checked) => setAccepted(!!checked)}
							className="mt-0.5"
						/>
						<span className="text-[13px] leading-normal text-foreground font-medium select-none">
							Tôi đã đọc kỹ và đồng ý tuân thủ toàn bộ Quy chuẩn & Điều khoản hoạt động của Cộng đồng Độc giả Aurabook.
						</span>
					</label>
				</div>

				{/* Actions */}
				<div className="mt-6 flex items-center justify-end gap-3">
					{!mandatory && onClose && (
						<Button
							type="button"
							variant="outline-solid"
							onClick={onClose}
							className="text-[13px]"
						>
							Đóng
						</Button>
					)}
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={!accepted || isSubmitting}
						className="w-full sm:w-auto px-6 py-2.5 font-semibold text-[13px]"
					>
						{isSubmitting ? "Đang xử lý..." : "Đồng ý & Tiếp tục"}
					</Button>
				</div>
			</div>
		</div>
	);
}
