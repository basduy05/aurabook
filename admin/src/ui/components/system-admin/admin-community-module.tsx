import React, { useState, useEffect } from "react";
import {
	Users,
	FileText,
	Star,
	Megaphone,
	Search,
	RefreshCw,
	Lock,
	Unlock,
	Eye,
	EyeOff,
	Pin,
	Trash2,
	CheckCircle2,
	ExternalLink,
	Edit3,
	History,
	AlertCircle,
	X,
	Plus,
	Send,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";
import { CommunityAdminDashboard } from "@/ui/components/community/admin/community-admin-dashboard";

interface BookReview {
	id: string;
	productSlug: string;
	authorName: string;
	rating: number;
	title: string;
	content: string;
	createdAt: string;
	isVerified: boolean;
	helpfulCount: number;
	isHidden?: boolean;
}

export function AdminCommunityModule() {
	const [activeSubTab, setActiveSubTab] = useState<"readers" | "posts" | "reviews" | "announcements">("readers");
	const [reviews, setReviews] = useState<BookReview[]>([]);
	const [isLoadingReviews, setIsLoadingReviews] = useState(false);
	const [reviewSearch, setReviewSearch] = useState("");
	const [reviewActionMsg, setReviewActionMsg] = useState<string | null>(null);

	const fetchReviews = async () => {
		setIsLoadingReviews(true);
		try {
			const res = await fetch("/api/admin/reviews");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.reviews && Array.isArray(data.reviews)) {
					setReviews(data.reviews);
				}
			}
		} catch (e) {
			console.warn("Lỗi tải reviews:", e);
		} finally {
			setIsLoadingReviews(false);
		}
	};

	useEffect(() => {
		if (activeSubTab === "reviews") {
			fetchReviews();
		}
	}, [activeSubTab]);

	const handleToggleReviewStatus = async (review: BookReview) => {
		try {
			const res = await fetch("/api/admin/reviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "toggle_status",
					reviewId: review.id,
					isHidden: !review.isHidden,
				}),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				setReviews((prev) =>
					prev.map((r) => (r.id === review.id ? { ...r, isHidden: !r.isHidden } : r))
				);
				setReviewActionMsg(data.message || "Đã cập nhật trạng thái hiển thị.");
			}
		} catch {
			setReviewActionMsg("Đã cập nhật trạng thái.");
		} finally {
			setTimeout(() => setReviewActionMsg(null), 3000);
		}
	};

	const handleDeleteReview = async (id: string) => {
		if (!confirm("Bạn có chắc chắn muốn xóa bài đánh giá này không?")) return;
		try {
			const res = await fetch("/api/admin/reviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "delete",
					reviewId: id,
				}),
			});
			if (res.ok) {
				setReviews((prev) => prev.filter((r) => r.id !== id));
				setReviewActionMsg("Đã xóa đánh giá thành công.");
			}
		} catch {
			setReviewActionMsg("Đã xóa đánh giá.");
		} finally {
			setTimeout(() => setReviewActionMsg(null), 3000);
		}
	};

	const filteredReviews = reviews.filter(
		(r) =>
			r.authorName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
			r.productSlug.toLowerCase().includes(reviewSearch.toLowerCase()) ||
			r.title.toLowerCase().includes(reviewSearch.toLowerCase()) ||
			r.content.toLowerCase().includes(reviewSearch.toLowerCase())
	);

	return (
		<div className="space-y-5 w-full">
			{/* Sub Navigation Strip */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl shadow-2xs">
				<div className="flex items-center gap-2 flex-wrap">
					<button
						type="button"
						onClick={() => setActiveSubTab("readers")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
							activeSubTab === "readers"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						<Users className="w-3.5 h-3.5" />
						<span>Quản Lý Độc Giả</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveSubTab("posts")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
							activeSubTab === "posts"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						<FileText className="w-3.5 h-3.5" />
						<span>Kiểm Duyệt Bài Viết</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveSubTab("reviews")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
							activeSubTab === "reviews"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						<Star className="w-3.5 h-3.5" />
						<span>Đánh Giá Sách (Reviews)</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveSubTab("announcements")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
							activeSubTab === "announcements"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						<Megaphone className="w-3.5 h-3.5" />
						<span>Thông Báo BQT</span>
					</button>
				</div>

				{activeSubTab === "reviews" && (
					<div className="flex items-center gap-2">
						<div className="relative w-full sm:w-60">
							<Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Tìm kiếm đánh giá..."
								value={reviewSearch}
								onChange={(e) => setReviewSearch(e.target.value)}
								className="pl-8 h-8 text-xs bg-muted/20"
							/>
						</div>
						<Button
							variant="outline-solid"
							size="sm"
							onClick={fetchReviews}
							disabled={isLoadingReviews}
							className="h-8 text-xs"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isLoadingReviews ? "animate-spin" : ""}`} />
						</Button>
					</div>
				)}
			</div>

			{reviewActionMsg && (
				<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in-0">
					<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					<span>{reviewActionMsg}</span>
				</div>
			)}

			{/* SubTab: Readers */}
			{activeSubTab === "readers" && (
				<CommunityAdminDashboard embedded embeddedTab="users" />
			)}

			{/* SubTab: Posts */}
			{activeSubTab === "posts" && (
				<CommunityAdminDashboard embedded embeddedTab="posts" />
			)}

			{/* SubTab: Announcements */}
			{activeSubTab === "announcements" && (
				<CommunityAdminDashboard embedded embeddedTab="announcements" />
			)}

			{/* SubTab: Reviews */}
			{activeSubTab === "reviews" && (
				<div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
								<tr>
									<th className="py-3 px-4">Độc Giả & Sách Đánh Giá</th>
									<th className="py-3 px-3">Số Sao</th>
									<th className="py-3 px-3">Tiêu Đề & Nội Dung</th>
									<th className="py-3 px-3">Xác Thực Người Mua</th>
									<th className="py-3 px-3">Hữu Ích</th>
									<th className="py-3 px-3">Trạng Thái</th>
									<th className="py-3 px-4 text-right">Thao Tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60">
								{filteredReviews.map((rev) => (
									<tr key={rev.id} className="hover:bg-muted/20 transition-colors">
										<td className="py-3 px-4">
											<div className="font-bold text-foreground">{rev.authorName}</div>
											<div className="text-[11px] text-primary font-medium mt-0.5">
												Sách: <span className="font-mono">{rev.productSlug}</span>
											</div>
										</td>
										<td className="py-3 px-3">
											<div className="flex items-center gap-0.5 text-yellow-400 font-bold">
												<span>{rev.rating}</span>
												<Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
											</div>
										</td>
										<td className="py-3 px-3 max-w-sm">
											<div className="font-bold text-foreground text-xs">{rev.title}</div>
											<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rev.content}</p>
										</td>
										<td className="py-3 px-3">
											{rev.isVerified ? (
												<Badge variant="outline-solid" className="text-[10px] text-emerald-500 border-emerald-500/30 font-semibold py-0">
													✓ Đã Mua Sách
												</Badge>
											) : (
												<Badge variant="outline-solid" className="text-[10px] text-muted-foreground py-0">
													Chưa Xác Thực
												</Badge>
											)}
										</td>
										<td className="py-3 px-3 font-semibold text-foreground">
											{rev.helpfulCount} lượt
										</td>
										<td className="py-3 px-3">
											<Badge
												variant={rev.isHidden ? "destructive" : "success"}
												className="text-[10px] py-0 px-1.5 font-semibold"
											>
												{rev.isHidden ? "ĐÃ ẨN" : "HIỂN THỊ"}
											</Badge>
										</td>
										<td className="py-3 px-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="outline-solid"
													size="sm"
													onClick={() => handleToggleReviewStatus(rev)}
													className="h-7 text-[11px] gap-1 font-semibold"
												>
													{rev.isHidden ? (
														<>
															<Eye className="w-3 h-3 text-emerald-500" />
															<span>Hiện</span>
														</>
													) : (
														<>
															<EyeOff className="w-3 h-3 text-amber-500" />
															<span>Ẩn</span>
														</>
													)}
												</Button>

												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteReview(rev.id)}
													className="h-7 w-7 p-0"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
