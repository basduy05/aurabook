"use client";

import {
	Home,
	BookOpen,
	Users2,
	Bookmark,
	Library,
	Hash,
	Sparkles,
} from "lucide-react";
import { Input } from "@/ui/components/ui/input";

export type CommunityNavTab = "feed" | "reviews" | "groups" | "saved" | "bookshelf";

interface CommunityLeftNavProps {
	activeNav: CommunityNavTab;
	onSelectNav: (tab: CommunityNavTab) => void;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	savedCount?: number;
}

export function CommunityLeftNav({
	activeNav,
	onSelectNav,
	searchQuery,
	onSearchChange,
	savedCount = 2,
}: CommunityLeftNavProps) {
	const navItems: { id: CommunityNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
		{ id: "feed", label: "Bảng tin cộng đồng", icon: Home },
		{ id: "reviews", label: "Đánh giá & Nhận xét sách", icon: BookOpen },
		{ id: "groups", label: "Nhóm & Câu lạc bộ bạn đọc", icon: Users2, badge: "3 mới" },
		{ id: "saved", label: "Bài viết đã lưu", icon: Bookmark, badge: savedCount },
		{ id: "bookshelf", label: "Tủ sách của tôi", icon: Library },
	];

	const clubs = [
		{ name: "CLB Đắc Nhân Tâm & Kỹ năng", members: "1.4k bạn đọc" },
		{ name: "Hội Mọt Sách Kinh Điển", members: "890 bạn đọc" },
		{ name: "Mỗi ngày 30 trang sách", members: "2.8k bạn đọc" },
	];

	const trendingTags = [
		"#review_sach",
		"#dac_nhan_tam",
		"#phat_trien_ban_than",
		"#sach_hay_moi_ngay",
		"#nha_gia_kim",
	];

	return (
		<aside className="space-y-6">
			{/* Search Box */}
			<div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
				<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 px-1">
					Tìm kiếm trong cộng đồng
				</label>
				<Input
					type="text"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Tìm bài viết, sách, tác giả..."
					className="h-9 text-xs"
				/>
			</div>

			{/* Main Navigation Menu */}
			<nav className="rounded-2xl border border-border bg-card p-2 shadow-xs space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = activeNav === item.id;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onSelectNav(item.id)}
							className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
								isActive
									? "bg-foreground text-background shadow-xs"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							<div className="flex items-center gap-3">
								<Icon className={`h-4 w-4 ${isActive ? "text-background" : "text-muted-foreground"}`} />
								<span>{item.label}</span>
							</div>
							{item.badge !== undefined && (
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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

			{/* Book Clubs & Groups */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
				<div className="flex items-center justify-between px-1">
					<div className="flex items-center gap-2 text-xs font-bold text-foreground">
						<Users2 className="h-4 w-4 text-primary" />
						<span>Nhóm bạn đọc gợi ý</span>
					</div>
					<button
						type="button"
						onClick={() => onSelectNav("groups")}
						className="text-[11px] text-primary hover:underline font-medium"
					>
						Xem tất cả
					</button>
				</div>
				<div className="space-y-2">
					{clubs.map((club, idx) => (
						<div
							key={idx}
							onClick={() => onSelectNav("groups")}
							className="rounded-xl border border-border/60 bg-muted/20 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
						>
							<div className="font-semibold text-xs text-foreground truncate">
								{club.name}
							</div>
							<div className="text-[10px] text-muted-foreground mt-0.5">
								{club.members}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Trending Hashtags */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
				<div className="flex items-center gap-2 text-xs font-bold text-foreground px-1">
					<Sparkles className="h-4 w-4 text-primary" />
					<span>Chủ đề nổi bật</span>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{trendingTags.map((tag) => (
						<button
							key={tag}
							type="button"
							onClick={() => onSearchChange(tag.replace("#", ""))}
							className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
						>
							{tag}
						</button>
					))}
				</div>
			</div>
		</aside>
	);
}
