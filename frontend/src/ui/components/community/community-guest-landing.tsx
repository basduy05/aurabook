"use client";

import Link from "next/link";
import {
	Sparkles,
	ShieldCheck,
	MessageSquare,
	Bookmark,
	UserPlus,
	LogIn,
	FileText,
	Award,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";

interface CommunityGuestLandingProps {
	onOpenTerms: () => void;
}

export function CommunityGuestLanding({ onOpenTerms }: CommunityGuestLandingProps) {
	return (
		<div className="w-full space-y-5 animate-in fade-in-0 duration-300">
			{/* Hero Welcome Card */}
			<div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
				<div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
				<div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

				<div className="relative z-10 space-y-4">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
						<Sparkles className="h-3.5 w-3.5" />
						<span>Cộng Đồng Độc Giả Aurabook</span>
					</div>

					<div className="space-y-2 max-w-2xl">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
							Không Gian Kết Nối Tri Thức & Lan Tỏa Niềm Say Mê Đọc Sách
						</h1>
						<p className="text-[13.5px] sm:text-[14px] text-muted-foreground leading-relaxed">
							Cộng đồng Aurabook là nơi các độc giả cùng nhau chia sẻ cảm nhận chân thực, trích dẫn những câu văn ý nghĩa và khám phá các tựa sách hay nhất. Để tham gia thảo luận và đăng bài, bạn hãy đăng ký hoặc đăng nhập tài khoản chính thức.
						</p>
					</div>

					{/* CTAs */}
					<div className="pt-2 flex flex-wrap items-center gap-3">
						<Link
							href="/vi/channel-vnd/login"
							className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition-opacity"
						>
							<LogIn className="h-4 w-4" />
							<span>Đăng nhập tài khoản</span>
						</Link>

						<Link
							href="/vi/channel-vnd/register"
							className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-[13px] font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<UserPlus className="h-4 w-4" />
							<span>Tạo tài khoản mới</span>
						</Link>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onOpenTerms}
							className="text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5"
						>
							<FileText className="h-4 w-4" />
							<span>Xem Điều khoản & Quy ước</span>
						</Button>
					</div>
				</div>
			</div>

			{/* 4 Value Propositions Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
				<div className="rounded-2xl border border-border/70 bg-card p-4.5 shadow-2xs space-y-2 transition-all hover:border-border">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<ShieldCheck className="h-4.5 w-4.5" />
						</div>
						<h3 className="text-[14px] font-bold text-foreground">Liên Kết Tài Khoản Thật</h3>
					</div>
					<p className="text-[12.5px] text-muted-foreground leading-relaxed pl-11">
						Mọi tài khoản đều liên kết với lịch sử mua hàng Saleor, loại bỏ hoàn toàn tài khoản ảo và các đánh giá giả mạo.
					</p>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-4.5 shadow-2xs space-y-2 transition-all hover:border-border">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
							<Award className="h-4.5 w-4.5" />
						</div>
						<h3 className="text-[14px] font-bold text-foreground">Huy Hiệu Người Mua Xác Thực</h3>
					</div>
					<p className="text-[12.5px] text-muted-foreground leading-relaxed pl-11">
						Tự động nhận huy hiệu độc giả xác thực khi chia sẻ cảm nhận về những cuốn sách bạn đã mua trên Aurabook.
					</p>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-4.5 shadow-2xs space-y-2 transition-all hover:border-border">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
							<Bookmark className="h-4.5 w-4.5" />
						</div>
						<h3 className="text-[14px] font-bold text-foreground">Tủ Sách & Lưu Trữ Cá Nhân</h3>
					</div>
					<p className="text-[12.5px] text-muted-foreground leading-relaxed pl-11">
						Dễ dàng lưu lại các bài viết giá trị, trích dẫn hay và theo dõi hành trình đọc sách của riêng bạn.
					</p>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-4.5 shadow-2xs space-y-2 transition-all hover:border-border">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
							<MessageSquare className="h-4.5 w-4.5" />
						</div>
						<h3 className="text-[14px] font-bold text-foreground">Thảo Luận Văn Minh & Đa Chiều</h3>
					</div>
					<p className="text-[12.5px] text-muted-foreground leading-relaxed pl-11">
						Diễn đàn tôn trọng mọi cảm thụ văn học, có kiểm duyệt nghiêm ngặt chống spam và bảo vệ bản quyền tác phẩm.
					</p>
				</div>
			</div>

			{/* Read-Only Notice Divider */}
			<div className="flex items-center gap-3 pt-2">
				<div className="h-px bg-border flex-1" />
				<span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
					Khám phá các bài viết nổi bật bên dưới
				</span>
				<div className="h-px bg-border flex-1" />
			</div>
		</div>
	);
}
