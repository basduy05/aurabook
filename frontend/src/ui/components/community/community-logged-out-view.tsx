"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	LogIn,
	UserPlus,
	ShieldCheck,
	BookOpen,
	Award,
	MessageSquare,
	FileText,
	Heart,
	Compass,
	PenTool,
	Users2,
	BookmarkCheck,
	Pin,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { type CommunityPost } from "@/lib/community/types";

interface CommunityLoggedOutViewProps {
	posts: CommunityPost[];
	onOpenTerms: () => void;
	onSelectPost: (postId: string) => void;
	onRequireLogin: () => void;
}

export function CommunityLoggedOutView({
	posts,
	onOpenTerms,
	onSelectPost,
	onRequireLogin,
}: CommunityLoggedOutViewProps) {
	const showcasePosts = useMemo(() => (posts || []).slice(0, 6), [posts]);

	return (
		<div className="w-full min-h-screen bg-[#fafafc] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white pb-28">
			{/* Subtle Editorial Paper Texture & Warm Ambient Lighting */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
				<div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[950px] rounded-full bg-radial from-amber-100/40 via-neutral-100/30 to-transparent blur-[130px]" />
				<div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-neutral-200/30 blur-[90px]" />
				<div className="absolute top-2/3 -right-40 h-80 w-80 rounded-full bg-amber-50/40 blur-[90px]" />
			</div>

			<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 space-y-16 sm:space-y-24">
				{/* 1. Brand Identity & Artistic Editorial Heading */}
				<header className="text-center space-y-6 max-w-3xl mx-auto">
					{/* Logo Badge with Warm Luxury Ring */}
					<div className="inline-flex items-center gap-2.5 rounded-full border border-neutral-300/80 bg-white/90 px-4 py-1.5 shadow-xs backdrop-blur-md">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-neutral-300 p-0.5">
							<Image
								src="/android-chrome-192x192.png"
								alt="Aurabook Logo"
								width={22}
								height={22}
								className="h-full w-full object-contain"
								unoptimized
							/>
						</div>
						<span className="text-[11.5px] font-semibold tracking-widest uppercase text-neutral-600">
							Aurabook • Diễn Đàn Độc Giả Số
						</span>
						<span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
					</div>

					{/* High-Fashion Editorial Typography for "AURABOOK COMMUNITY" */}
					<div className="space-y-2 sm:space-y-3">
						<div className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
							Không Gian Kết Nối Tri Thức
						</div>
						<h1 className="flex flex-col items-center justify-center gap-1 sm:gap-2 leading-none">
							<span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 uppercase">
								AURABOOK
							</span>
							<span className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-normal tracking-wide text-neutral-900 bg-linear-to-r from-neutral-950 via-neutral-800 to-amber-950 bg-clip-text">
								Community
							</span>
						</h1>
					</div>

					{/* Storytelling Hook Copywriting */}
					<p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
						Mỗi cuốn sách là một hành trình, và mỗi độc giả là một người bạn đồng hành.
						Nơi bạn tự do sẻ chia cảm nhận chân thật, ghi dấu những trang văn chạm đến trái tim
						và tìm thấy những tâm hồn đồng điệu.
					</p>

					{/* Primary High-Contrast Action Buttons */}
					<div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
						<Link
							href="/vi/channel-vnd/login"
							className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-bold text-white shadow-md shadow-neutral-950/20 hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
						>
							<LogIn className="h-4 w-4" />
							<span>Đăng Nhập Ngay</span>
						</Link>

						<Link
							href="/vi/channel-vnd/register"
							className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-neutral-900 shadow-xs hover:bg-neutral-50 hover:border-neutral-400 transition-all"
						>
							<UserPlus className="h-4 w-4" />
							<span>Tạo Tài Khoản Mới</span>
						</Link>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onOpenTerms}
							className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 gap-1.5 h-10 px-3 cursor-pointer"
						>
							<FileText className="h-3.5 w-3.5" />
							<span>Quy ước cộng đồng</span>
						</Button>
					</div>
				</header>

				{/* 2. The 3-Chapter Visual Storytelling Journey (Visual Storyteller & Content Creator) */}
				<section className="space-y-8 pt-4">
					<div className="text-center space-y-2 max-w-xl mx-auto">
						<span className="text-[11px] font-mono tracking-widest text-amber-700 uppercase font-semibold">
							The Reader's Journey
						</span>
						<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
							Hành Trình Đọc Sách Tại Aurabook
						</h2>
						<p className="text-xs sm:text-sm text-neutral-600">
							Từ khoảnh khắc chạm tay vào trang sách đầu tiên đến khi hòa mình vào cộng đồng độc giả.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Chapter 1 */}
						<div className="group rounded-3xl border border-neutral-200/90 bg-white p-7 space-y-4 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all">
							<div className="flex items-center justify-between">
								<span className="text-xs font-mono font-bold text-neutral-400">CHƯƠNG 01</span>
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/50">
									<Compass className="h-5 w-5" />
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
									Khơi Mở Tri Thức
								</h3>
								<p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
									Mỗi tác phẩm là một cánh cửa mở ra thế giới mới. Bạn không chỉ mua một cuốn sách, mà bắt đầu một cuộc đối thoại tư duy cùng tác giả.
								</p>
							</div>
							<div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-500">
								<BookmarkCheck className="h-3.5 w-3.5 text-amber-600" />
								<span>Kho sách bản quyền chọn lọc</span>
							</div>
						</div>

						{/* Chapter 2 */}
						<div className="group rounded-3xl border border-neutral-200/90 bg-white p-7 space-y-4 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all">
							<div className="flex items-center justify-between">
								<span className="text-xs font-mono font-bold text-neutral-400">CHƯƠNG 02</span>
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 border border-neutral-200">
									<PenTool className="h-5 w-5" />
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-lg font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors">
									Lắng Đọng Cảm Nhận
								</h3>
								<p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
									Tự do ghi lại những dòng cảm xúc, trích dẫn để đời và góc nhìn chiêm nghiệm. Mọi đánh giá đều từ bạn đọc thật gắn liền với lịch sử mua hàng.
								</p>
							</div>
							<div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-500">
								<ShieldCheck className="h-3.5 w-3.5 text-neutral-800" />
								<span>Huy hiệu Người Mua Xác Thực</span>
							</div>
						</div>

						{/* Chapter 3 */}
						<div className="group rounded-3xl border border-neutral-200/90 bg-white p-7 space-y-4 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all">
							<div className="flex items-center justify-between">
								<span className="text-xs font-mono font-bold text-neutral-400">CHƯƠNG 03</span>
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/50">
									<Users2 className="h-5 w-5" />
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
									Lan Tỏa Đồng Điệu
								</h3>
								<p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
									Tìm thấy những người bạn có cùng gu đọc, trao đổi văn minh và cùng nhau lan tỏa những giá trị tri thức cao đẹp đến vạn người.
								</p>
							</div>
							<div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-500">
								<Award className="h-3.5 w-3.5 text-amber-600" />
								<span>Diễn đàn độc giả văn minh</span>
							</div>
						</div>
					</div>
				</section>

				{/* 4. Public Discussions Feed Showcase (Clean White Cards) */}
				<section className="space-y-6 pt-6 border-t border-neutral-200">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
						<div className="space-y-1">
							<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
								<MessageSquare className="h-3.5 w-3.5 text-neutral-900" />
								<span>Bảng Tin Công Khai</span>
							</div>
							<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
								Thảo Luận Mới Nhất Từ Bạn Đọc
							</h2>
						</div>
					</div>

					{/* 2-Column Responsive Card Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
						{showcasePosts.length === 0
							? [1, 2, 3, 4].map((i) => (
									<div
										key={`showcase-skeleton-${i}`}
										className="h-44 rounded-2xl border border-neutral-200/80 bg-neutral-100/50 animate-pulse"
									/>
								))
							: showcasePosts.map((post, idx) => (
									<article
										key={post.id ? `post-${post.id}` : `showcase-${idx}`}
										onClick={() => onSelectPost(post.id)}
								className="group cursor-pointer rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-4 hover:border-neutral-400 hover:shadow-md transition-all shadow-xs flex flex-col justify-between"
							>
								<div className="space-y-3">
									{/* Post Author */}
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2.5">
											<div className="h-8 w-8 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-800">
												{post.author.displayName.slice(0, 1)}
											</div>
											<div>
												<div className="text-xs font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
													{post.author.displayName}
												</div>
												<div className="text-[11px] text-neutral-500 font-mono">
													{post.author.username}
												</div>
											</div>
										</div>

										{post.isPinned && (
											<span
												title="Bài viết được ghim"
												className="rounded-full border border-amber-300 bg-amber-50 p-1 text-amber-800"
											>
												<Pin className="h-3 w-3 fill-amber-500/20" />
											</span>
										)}
									</div>

									{/* Post Title & Excerpt */}
									<div className="space-y-1.5">
										<h3 className="text-sm sm:text-base font-bold text-neutral-900 line-clamp-1 group-hover:text-amber-900 transition-colors">
											{post.title}
										</h3>
										<p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
											{post.content}
										</p>
									</div>

									{/* Book Pill if tagged */}
									{post.book && (
										<div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-2.5 flex items-center gap-2 text-xs text-neutral-700">
											<BookOpen className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
											<span className="truncate font-medium">{post.book.title}</span>
										</div>
									)}
								</div>

								{/* Bottom Action Stats */}
								<div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
									<div className="flex items-center gap-4">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onRequireLogin();
											}}
											className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
										>
											<Heart className="h-3.5 w-3.5" />
											<span>{post.likes?.length || 0}</span>
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onSelectPost(post.id);
											}}
											className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
										>
											<MessageSquare className="h-3.5 w-3.5" />
											<span>{post.comments?.length || 0}</span>
										</button>
									</div>

									<span className="text-[11px] text-neutral-400 font-mono">
										{new Date(post.createdAt).toLocaleDateString("vi-VN")}
									</span>
								</div>
							</article>
						))}
					</div>

					{/* Bottom Invitation Banner */}
					<div className="rounded-3xl border border-neutral-200 bg-linear-to-r from-neutral-100 via-white to-amber-50/50 p-6 sm:p-10 text-center space-y-4 shadow-xs">
						<h3 className="text-lg sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
							Sẵn sàng chia sẻ cảm nhận về cuốn sách bạn vừa đọc?
						</h3>
						<p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
							Đăng nhập ngay hôm nay để bình luận, trao đổi cùng cộng đồng và xây dựng tủ sách tri thức mang dấu ấn cá nhân của bạn.
						</p>
						<div className="pt-2 flex justify-center gap-3">
							<Link
								href="/vi/channel-vnd/login"
								className="rounded-xl bg-neutral-950 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-colors"
							>
								Đăng nhập ngay
							</Link>
							<Link
								href="/vi/channel-vnd/register"
								className="rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs"
							>
								Tạo tài khoản
							</Link>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
