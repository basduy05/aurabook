"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
	Home,
	BookOpen,
	Bookmark,
	BookMarked,
	Settings,
	Search,
	X,
	Bell,
	CheckCheck,
	Heart,
	MessageSquare,
	Sparkles,
} from "lucide-react";
import { type CommunityUser } from "@/lib/community/types";

export type CommunityNavTab = "feed" | "reviews" | "saved" | "bookshelf";

interface NotificationItem {
	id: string;
	title: string;
	content: string;
	time: string;
	isRead: boolean;
	icon: "like" | "comment" | "system";
}

interface CommunityLeftNavProps {
	activeNav: CommunityNavTab;
	onSelectNav: (tab: CommunityNavTab) => void;
	savedCount?: number;
	currentUser: CommunityUser | null;
	onOpenProfile: () => void;
	onOpenTerms: () => void;
	onViewSelfProfile?: () => void;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	onSearchSubmit?: (q: string) => void;
}

export function CommunityLeftNav({
	activeNav,
	onSelectNav,
	savedCount = 2,
	currentUser,
	onOpenProfile,
	onOpenTerms,
	onViewSelfProfile,
	searchQuery,
	onSearchChange,
	onSearchSubmit,
}: CommunityLeftNavProps) {
	const [showSettings, setShowSettings] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const profileClusterRef = useRef<HTMLDivElement>(null);

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

	// Close popups when clicking outside the profile cluster
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (profileClusterRef.current && !profileClusterRef.current.contains(e.target as Node)) {
				setShowSettings(false);
				setShowNotifications(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
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

	// Main navigation tabs (Groups removed as requested)
	const navItems: {
		id: CommunityNavTab;
		label: string;
		icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
		badge?: string | number;
	}[] = [
		{ id: "feed", label: "Bảng tin cộng đồng", icon: Home },
		{ id: "reviews", label: "Đánh giá & Nhận xét sách", icon: BookOpen },
		{ id: "saved", label: "Bài viết đã lưu", icon: Bookmark, badge: savedCount },
		{ id: "bookshelf", label: "Tủ sách của tôi", icon: BookMarked },
	];

	return (
		<div className="space-y-3">
			{/* Top Search Bar (Moved from right to top of left navigation) */}
			<div className="px-0.5">
				<form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
					<Search
						strokeWidth={1.75}
						className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
					/>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Tìm kiếm sách, bài viết..."
						className="w-full h-9 pl-9 pr-7 rounded-xl bg-muted/40 border border-border/70 text-[13px] text-foreground placeholder:text-muted-foreground placeholder:text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
							title="Xóa tìm kiếm"
						>
							<X strokeWidth={1.75} className="h-3.5 w-3.5" />
						</button>
					)}
				</form>
			</div>

			{/* Main Navigation Menu */}
			<nav className="space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = activeNav === item.id;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onSelectNav(item.id)}
							className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
								isActive
									? "bg-foreground text-background shadow-xs"
									: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
							}`}
						>
							<div className="flex items-center gap-3">
								<Icon
									strokeWidth={1.75}
									className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`}
								/>
								<span className="truncate">{item.label}</span>
							</div>
							{item.badge !== undefined && (
								<span
									className={`rounded-full px-2 py-0.5 text-[13px] font-bold shrink-0 ${
										isActive
											? "bg-background/20 text-background"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{item.badge}
								</span>
							)}
						</button>
					);
				})}
			</nav>

			{/* Divider Line between Navigation and Profile Cluster */}
			<div className="border-t border-border my-2.5 mx-1" />

			{/* Bottom User Profile Cluster with Circular Notification & Settings Buttons */}
			<div ref={profileClusterRef} className="relative space-y-1.5">
				<div className="rounded-2xl border border-border/80 bg-card p-2.5 shadow-2xs">
					<div className="flex items-center justify-between gap-1.5">
						{/* User Info (Clickable to open user profile view) */}
						<button
							type="button"
							onClick={onViewSelfProfile || onOpenProfile}
							className="flex items-center gap-2 min-w-0 text-left flex-1 hover:opacity-80 transition-opacity rounded-xl p-1"
							title="Bấm để xem trang cá nhân"
						>
							<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
								<Image
									src={
										currentUser?.avatar ||
										"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
									}
									alt={currentUser?.displayName || "Độc giả"}
									fill
									sizes="36px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-[13px] font-semibold text-foreground truncate">
									{currentUser?.displayName || "Độc giả Aurabook"}
								</div>
								<div className="text-[12px] text-muted-foreground truncate">
									{currentUser?.username || "@docgia"}
								</div>
							</div>
						</button>

						{/* Action Buttons: Explicitly Circular Shape (rounded-full) with comfortable spacing */}
						<div className="flex items-center gap-4 shrink-0">
							{/* Circular Notification Bell Button */}
							<button
								type="button"
								onClick={() => {
									setShowNotifications(!showNotifications);
									setShowSettings(false);
								}}
								className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors relative ${
									showNotifications
										? "bg-primary text-primary-foreground border-primary shadow-2xs"
										: "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
								title="Thông báo cộng đồng"
							>
								<Bell className="h-4 w-4" />
								{unreadCount > 0 && (
									<span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
										{unreadCount}
									</span>
								)}
							</button>

							{/* Circular Settings Gear Button */}
							<button
								type="button"
								onClick={() => {
									setShowSettings(!showSettings);
									setShowNotifications(false);
								}}
								className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
									showSettings
										? "bg-primary text-primary-foreground border-primary shadow-2xs"
										: "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
								title="Cài đặt & Tùy chọn"
							>
								<Settings className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Notification Dropdown Panel Opening Downwards */}
					{showNotifications && (
						<div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
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

					{/* Settings Dropdown Menu Opening Downwards (Clean text without icons, admin link hidden) */}
					{showSettings && (
						<div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 space-y-1 text-[13px]">
							<button
								type="button"
								onClick={() => {
									setShowSettings(false);
									onOpenProfile();
								}}
								className="w-full flex items-center rounded-xl px-3 py-2.5 text-left font-medium text-foreground hover:bg-muted/70 transition-colors"
							>
								<span className="truncate">Tùy chỉnh hồ sơ cá nhân</span>
							</button>

							<button
								type="button"
								onClick={() => {
									setShowSettings(false);
									onOpenTerms();
								}}
								className="w-full flex items-center rounded-xl px-3 py-2.5 text-left font-medium text-foreground hover:bg-muted/70 transition-colors"
							>
								<span className="truncate">Quy ước & Điều khoản</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
