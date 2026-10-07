"use client";

import { useState } from "react";
import Image from "next/image";
import {
	Bell,
	Settings,
	ShieldCheck,
	User,
	Sparkles,
	BookOpen,
	CheckCheck,
	Heart,
	MessageSquare,
} from "lucide-react";
import { type CommunityUser } from "@/lib/community/types";

interface CommunityTopHeaderProps {
	currentUser: CommunityUser | null;
	onOpenProfile: () => void;
	onOpenTerms: () => void;
	onSelectNav?: (nav: string) => void;
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
	currentUser,
	onOpenProfile,
	onOpenTerms,
	onSelectNav,
}: CommunityTopHeaderProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const [showSettingsMenu, setShowSettingsMenu] = useState(false);
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
			content: "Chào mừng bạn đến với Mạng xã hội Độc giả AuraBook. Hãy cùng kết nối và chia sẻ!",
			time: "Hôm qua",
			isRead: true,
			icon: "system",
		},
	]);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const handleMarkAllRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
	};

	return (
		<header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/60 backdrop-blur-xs px-4 py-3 rounded-2xl shadow-xs">
			{/* Left: Brand / Title */}
			<div className="flex items-center gap-2.5">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
					<BookOpen className="h-5 w-5" />
				</div>
				<div>
					<h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
						Cộng đồng Độc giả AuraBook
					</h1>
					<p className="text-[11px] text-muted-foreground">
						Diễn đàn trao đổi tri thức & review tác phẩm văn học
					</p>
				</div>
			</div>

			{/* Right: Notifications, User Profile & Settings in top-right corner */}
			<div className="flex items-center gap-3">
				{/* Notification Bell with Dropdown */}
				<div className="relative">
					<button
						type="button"
						onClick={() => {
							setShowNotifications(!showNotifications);
							setShowSettingsMenu(false);
						}}
						className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						title="Thông báo"
					>
						<Bell className="h-5 w-5" />
						{unreadCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
								{unreadCount}
							</span>
						)}
					</button>

					{/* Notification Dropdown Panel */}
					{showNotifications && (
						<div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
							<div className="flex items-center justify-between border-b border-border pb-2 px-1">
								<div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
									<Bell className="h-3.5 w-3.5 text-primary" />
									<span>Thông báo ({unreadCount})</span>
								</div>
								{unreadCount > 0 && (
									<button
										type="button"
										onClick={handleMarkAllRead}
										className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
									>
										<CheckCheck className="h-3 w-3" />
										Đánh dấu đã đọc
									</button>
								)}
							</div>

							<div className="my-2 max-h-64 space-y-1.5 overflow-y-auto">
								{notifications.map((item) => (
									<div
										key={item.id}
										className={`rounded-xl p-2.5 text-xs transition-colors ${
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
													<span className="font-semibold text-foreground truncate">{item.title}</span>
													<span className="text-[10px] text-muted-foreground">{item.time}</span>
												</div>
												<p className="mt-0.5 text-muted-foreground leading-relaxed text-[11px]">
													{item.content}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="border-t border-border pt-2 text-center">
								<button
									type="button"
									onClick={() => setShowNotifications(false)}
									className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
								>
									Đóng thông báo
								</button>
							</div>
						</div>
					)}
				</div>

				{/* User Profile Pill in Top-Right Corner */}
				<button
					type="button"
					onClick={onOpenProfile}
					className="flex items-center gap-2.5 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-3 hover:bg-muted/80 transition-colors shadow-2xs"
					title="Bấm để xem & chỉnh sửa hồ sơ"
				>
					<div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border">
						<Image
							src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
							alt={currentUser?.displayName || "Độc giả"}
							fill
							sizes="28px"
							className="object-cover"
							unoptimized
						/>
					</div>
					<div className="text-left hidden sm:block">
						<div className="text-xs font-semibold text-foreground leading-none">
							{currentUser?.displayName || "Độc giả"}
						</div>
						<div className="text-[10px] text-muted-foreground leading-none mt-0.5">
							{currentUser?.username || "@docgia"}
						</div>
					</div>
				</button>

				{/* Settings Button with Dropdown (Rules & Guidelines moved inside here) */}
				<div className="relative">
					<button
						type="button"
						onClick={() => {
							setShowSettingsMenu(!showSettingsMenu);
							setShowNotifications(false);
						}}
						className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						title="Cài đặt cộng đồng & Quy ước"
					>
						<Settings className="h-5 w-5" />
					</button>

					{showSettingsMenu && (
						<div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 space-y-1 text-xs">
							<button
								type="button"
								onClick={() => {
									setShowSettingsMenu(false);
									onOpenProfile();
								}}
								className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium text-foreground hover:bg-muted transition-colors"
							>
								<User className="h-4 w-4 text-muted-foreground" />
								<span>Tùy chỉnh hồ sơ cá nhân</span>
							</button>

							<button
								type="button"
								onClick={() => {
									setShowSettingsMenu(false);
									onOpenTerms();
								}}
								className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium text-foreground hover:bg-muted transition-colors"
							>
								<ShieldCheck className="h-4 w-4 text-primary" />
								<span>Quy ước & Điều khoản cộng đồng</span>
							</button>

							{onSelectNav && (
								<button
									type="button"
									onClick={() => {
										setShowSettingsMenu(false);
										onSelectNav("bookshelf");
									}}
									className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium text-foreground hover:bg-muted transition-colors"
								>
									<BookOpen className="h-4 w-4 text-muted-foreground" />
									<span>Tủ sách của tôi</span>
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
