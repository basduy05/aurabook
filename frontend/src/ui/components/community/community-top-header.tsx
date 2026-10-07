"use client";

import { useState, useEffect, useRef } from "react";
import {
	Bell,
	BookOpen,
	CheckCheck,
	Heart,
	MessageSquare,
	Search,
	Sparkles,
	X,
} from "lucide-react";
import { type CommunityUser } from "@/lib/community/types";

interface CommunityTopHeaderProps {
	currentUser?: CommunityUser | null;
	onOpenProfile?: () => void;
	onOpenTerms?: () => void;
	onSelectNav?: (nav: string) => void;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	onSearchSubmit?: (q: string) => void;
}

interface NotificationItem {
	id: string;
	title: string;
	content: string;
	time: string;
	isRead: boolean;
	icon: "like" | "comment" | "system";
}

export function CommunityTopHeader({
	searchQuery,
	onSearchChange,
	onSearchSubmit,
}: CommunityTopHeaderProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const [notifications, setNotifications] = useState<NotificationItem[]>([
		{
			id: "1",
			title: "Lượt thích mới",
			content: "Minh Tuấn đã thích bài cảm nhận của bạn về cuốn Đắc Nhân Tâm.",
			time: "15 phút trước",
			isRead: false,
			icon: "like",
		},
		{
			id: "2",
			title: "Bình luận mới",
			content: "Thu Hà đã bình luận: 'Hoàn toàn đồng ý với góc nhìn của bạn!'",
			time: "1 giờ trước",
			isRead: false,
			icon: "comment",
		},
		{
			id: "3",
			title: "Chào mừng bạn mới",
			content: "Chào mừng bạn đến với Mạng xã hội Độc giả Aurabook. Hãy cùng kết nối và chia sẻ!",
			time: "Hôm qua",
			isRead: true,
			icon: "system",
		},
	]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleDocumentClick = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setShowNotifications(false);
			}
		};
		document.addEventListener("mousedown", handleDocumentClick);
		return () => document.removeEventListener("mousedown", handleDocumentClick);
	}, []);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const handleMarkAllRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (onSearchSubmit) {
			onSearchSubmit(searchQuery);
		}
	};

	return (
		<div className="sticky top-16 z-30 w-full bg-background/95 backdrop-blur-md transition-all">
			<div
				ref={containerRef}
				className="w-full max-w-[1840px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-2 flex items-center justify-between gap-4"
			>
				{/* Left: Community Brand & Section Identity */}
				<div className="flex items-center gap-2.5 min-w-0">
					<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
						<BookOpen className="h-4 w-4" />
					</div>
					<div className="min-w-0">
						<div className="text-[15px] font-bold text-foreground leading-tight tracking-tight truncate">
							Cộng đồng Độc giả Aurabook
						</div>
						<div className="text-[12px] text-muted-foreground leading-none mt-0.5 truncate hidden sm:block">
							Không gian giao lưu & chia sẻ góc nhìn về sách
						</div>
					</div>
				</div>

				{/* Right: Search Bar (without 'Tìm' button) & Notification Bell */}
				<div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
					{/* Streamlined Search Bar on Top-Right */}
					<form onSubmit={handleSearchSubmit} className="relative w-56 sm:w-64 md:w-72 shrink-0 flex items-center">
						<Search strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Tìm kiếm sách, bài viết..."
							className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/40 border border-border/70 text-[13px] text-foreground placeholder:text-muted-foreground placeholder:text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => onSearchChange("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
								title="Xóa tìm kiếm"
							>
								<X strokeWidth={1.75} className="h-3.5 w-3.5" />
							</button>
						)}
					</form>

					{/* Notification Bell with Dropdown */}
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowNotifications(!showNotifications)}
							className="relative rounded-full border border-border/80 bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
							title="Thông báo cộng đồng"
						>
							<Bell className="h-4 w-4" />
							{unreadCount > 0 && (
								<span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
									{unreadCount}
								</span>
							)}
						</button>

						{/* Notification Dropdown Panel */}
						{showNotifications && (
							<div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
								<div className="flex items-center justify-between border-b border-border pb-2 px-1">
									<div className="flex items-center gap-1.5 font-bold text-[15px] text-foreground">
										<Bell className="h-4 w-4 text-primary" />
										<span>Thông báo ({unreadCount})</span>
									</div>
									{unreadCount > 0 && (
										<button
											type="button"
											onClick={handleMarkAllRead}
											className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium"
										>
											<CheckCheck className="h-3.5 w-3.5" />
											Đánh dấu đã đọc
										</button>
									)}
								</div>

								<div className="my-2 max-h-72 space-y-2 overflow-y-auto pr-1">
									{notifications.map((item) => (
										<div
											key={item.id}
											className={`rounded-xl p-2.5 text-[13px] transition-colors ${
												item.isRead ? "bg-card hover:bg-muted/30" : "bg-muted/50 hover:bg-muted/80 font-medium"
											}`}
										>
											<div className="flex items-start gap-2">
												<div className="mt-0.5 shrink-0">
													{item.icon === "like" && <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
													{item.icon === "comment" && <MessageSquare className="h-3.5 w-3.5 text-primary" />}
													{item.icon === "system" && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center justify-between">
														<span className="font-semibold text-[13px] text-foreground truncate">{item.title}</span>
														<span className="text-[12px] text-muted-foreground">{item.time}</span>
													</div>
													<p className="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">
														{item.content}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>

								<div className="border-t border-border pt-1.5 text-center">
									<button
										type="button"
										onClick={() => setShowNotifications(false)}
										className="text-[13px] text-muted-foreground hover:text-foreground font-medium"
									>
										Đóng thông báo
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
