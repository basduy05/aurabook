"use client";

import Image from "next/image";
import {
	Sparkles,
	Star,
	TrendingUp,
} from "lucide-react";
import { type TrendingBookItem, type ActiveReaderItem } from "@/lib/community/storage";

interface CommunityRightNavProps {
	trendingBooks: TrendingBookItem[];
	topReaders: ActiveReaderItem[];
	isLoading?: boolean;
	onSelectBook?: (title: string) => void;
	onSelectReader?: (name: string) => void;
}

export function CommunityRightNav({
	trendingBooks,
	topReaders,
	isLoading = false,
	onSelectBook,
	onSelectReader,
}: CommunityRightNavProps) {
	return (
		<div className="space-y-3">
			{/* Real Trending Books Section */}
			<div className="space-y-1.5">
				<div className="flex items-center gap-2 text-[15px] font-semibold text-foreground px-3.5 py-1">
					<TrendingUp strokeWidth={1.75} className="h-4 w-4 text-primary shrink-0" />
					<span>Tác phẩm đang được quan tâm</span>
				</div>

				<div className="space-y-1">
					{isLoading && trendingBooks.length === 0 ? (
						<div className="p-4 text-center text-[13px] text-muted-foreground">
							Đang tải tác phẩm...
						</div>
					) : trendingBooks.length === 0 ? (
						<div className="p-4 text-center text-[13px] text-muted-foreground">
							Chưa có tác phẩm nào
						</div>
					) : (
						trendingBooks.map((b, idx) => (
							<button
								key={b.slug || idx}
								type="button"
								onClick={() => onSelectBook?.(b.title)}
								className="w-full text-left rounded-xl px-3.5 py-2.5 hover:bg-muted/70 transition-all block group"
								title={`Bấm để tìm bài viết về "${b.title}"`}
							>
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0 flex-1">
										<div className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
											{b.title}
										</div>
										<div className="text-[13px] text-muted-foreground mt-0.5 truncate">
											{b.author}
										</div>
									</div>
								</div>
								<div className="mt-1 flex items-center justify-between text-[13px]">
									<span className="flex items-center gap-1 text-amber-500 font-semibold">
										<Star strokeWidth={1.75} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
										{b.rating}
									</span>
									<span className="text-muted-foreground font-medium">
										{b.reviewsCount} thảo luận & đánh giá
									</span>
								</div>
							</button>
						))
					)}
				</div>
			</div>

			{/* Divider Line */}
			<div className="border-t border-border my-2.5 mx-1" />

			{/* Real Top Active Readers Section */}
			<div className="space-y-1.5">
				<div className="flex items-center gap-2 text-[15px] font-semibold text-foreground px-3.5 py-1">
					<Sparkles strokeWidth={1.75} className="h-4 w-4 text-primary shrink-0" />
					<span>Độc giả tích cực</span>
				</div>

				<div className="space-y-1">
					{isLoading && topReaders.length === 0 ? (
						<div className="p-4 text-center text-[13px] text-muted-foreground">
							Đang tải độc giả...
						</div>
					) : topReaders.length === 0 ? (
						<div className="p-4 text-center text-[13px] text-muted-foreground">
							Chưa có dữ liệu độc giả
						</div>
					) : (
						topReaders.map((r, idx) => (
							<button
								key={r.username || idx}
								type="button"
								onClick={() => onSelectReader?.(r.name)}
								className="w-full text-left flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 hover:bg-muted/70 transition-all group"
								title={`Bấm để tìm bài viết của ${r.name}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className="relative w-8 h-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
										<Image
											src={r.avatar}
											alt={r.name}
											fill
											sizes="32px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="min-w-0">
										<div className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
											{r.name}
										</div>
										<div className="text-[12px] text-muted-foreground truncate mt-0.5">
											{r.username}
										</div>
									</div>
								</div>
								<span className="shrink-0 text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
									{r.reviews} bài
								</span>
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
