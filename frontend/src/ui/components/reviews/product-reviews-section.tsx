"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Star, ThumbsUp, CheckCircle2, MessageSquarePlus, X, PenLine, ChevronLeft, ChevronRight, Lock, EyeOff } from "lucide-react";
import { type Review, type ReviewSummary } from "@/lib/reviews/types";

interface ProductReviewsSectionProps {
	productSlug: string;
	productId?: string;
	productName: string;
	initialData?: {
		reviews: Review[];
		summary: ReviewSummary;
	};
}

const RATING_LABELS: Record<number, string> = {
	1: "Rất tệ",
	2: "Chưa hài lòng",
	3: "Bình thường",
	4: "Hài lòng",
	5: "Tuyệt vời & khuyên đọc",
};

const REVIEWS_PER_PAGE = 3;

export function ProductReviewsSection({
	productSlug,
	productId,
	productName,
	initialData,
}: ProductReviewsSectionProps) {
	const [reviews, setReviews] = useState<Review[]>(initialData?.reviews ?? []);
	const [summary, setSummary] = useState<ReviewSummary>(
		initialData?.summary ?? {
			averageRating: 5.0,
			totalReviews: 0,
			recommendPercentage: 100,
			distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
		},
	);
	const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

	// User auth / eligibility state
	const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; hasPurchased?: boolean } | null>(null);
	const [showIneligibleNotice, setShowIneligibleNotice] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Form state
	const [formRating, setFormRating] = useState(5);
	const [formHoverRating, setFormHoverRating] = useState<number | null>(null);
	const [formAuthor, setFormAuthor] = useState("");
	const [formIsAnonymous, setFormIsAnonymous] = useState(false);
	const [formTitle, setFormTitle] = useState("");
	const [formContent, setFormContent] = useState("");
	const [formSuccessMessage, setFormSuccessMessage] = useState(false);
	const [formError, setFormError] = useState("");

	// Load reviews & voted state
	useEffect(() => {
		async function loadReviews() {
			try {
				const res = await fetch(`/api/reviews?productSlug=${encodeURIComponent(productSlug)}`);
				if (res.ok) {
					const data = (await res.json()) as { reviews: Review[]; summary: ReviewSummary };
					setReviews(data.reviews);
					setSummary(data.summary);
				}
			} catch (e) {
				console.error("[reviews] Failed to load reviews:", e);
			}
		}
		if (!initialData) {
			loadReviews();
		}

		// Load helpful votes from localStorage so user can only like ONCE
		try {
			const savedVotes = localStorage.getItem("aurabook_helpful_votes");
			if (savedVotes) {
				setHelpfulVoted(JSON.parse(savedVotes) as Record<string, boolean>);
			}
		} catch {
			// ignore
		}

		// Check current user & eligibility
		async function checkUser() {
			try {
				const res = await fetch(`/api/reviews/check-eligibility?productSlug=${encodeURIComponent(productSlug)}`);
				if (res.ok) {
					const data = (await res.json()) as { name?: string; email?: string; hasPurchased?: boolean };
					setCurrentUser(data);
					if (data.name) {
						setFormAuthor(data.name);
					}
				}
			} catch {
				// ignore
			}
		}
		checkUser();
	}, [productSlug, initialData]);

	useEffect(() => {
		const handleOpenModal = () => handleOpenReviewModal();
		window.addEventListener("open-write-review-modal", handleOpenModal);
		return () => window.removeEventListener("open-write-review-modal", handleOpenModal);
	}, [currentUser]);

	const handleOpenReviewModal = () => {
		// Enforce rule: Only purchasers can review
		if (currentUser && !currentUser.hasPurchased) {
			setShowIneligibleNotice(true);
			return;
		}
		setIsModalOpen(true);
	};

	const filteredReviews = useMemo(() => {
		if (!selectedStarFilter) return reviews;
		return reviews.filter((r) => r.rating === selectedStarFilter);
	}, [reviews, selectedStarFilter]);

	// Reset to page 1 on filter change
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedStarFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
	const paginatedReviews = useMemo(() => {
		const start = (currentPage - 1) * REVIEWS_PER_PAGE;
		return filteredReviews.slice(start, start + REVIEWS_PER_PAGE);
	}, [filteredReviews, currentPage]);

	const handleHelpful = async (reviewId: string) => {
		if (helpfulVoted[reviewId]) return; // strictly 1 like per user
		try {
			const updated = { ...helpfulVoted, [reviewId]: true };
			setHelpfulVoted(updated);
			localStorage.setItem("aurabook_helpful_votes", JSON.stringify(updated));

			setReviews((prev) =>
				prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r)),
			);
			await fetch("/api/reviews/helpful", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reviewId }),
			});
		} catch {
			// silently ignore
		}
	};

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		const finalAuthorName = formIsAnonymous
			? "Độc giả ẩn danh"
			: formAuthor.trim() || currentUser?.name || "Khách hàng Aurabook";

		if (!formContent.trim()) {
			setFormError("Vui lòng nhập nội dung đánh giá của bạn.");
			return;
		}

		setIsSubmitting(true);
		setFormError("");

		try {
			const res = await fetch("/api/reviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productSlug,
					productId,
					authorName: finalAuthorName,
					rating: formRating,
					title: formTitle || RATING_LABELS[formRating],
					content: formContent,
					isVerified: true,
				}),
			});

			if (!res.ok) {
				const errData = (await res.json()) as { error?: string };
				throw new Error(errData.error || "Gửi đánh giá thất bại.");
			}

			const data = (await res.json()) as { review: Review; summary: ReviewSummary };
			setReviews((prev) => [data.review, ...prev]);
			setSummary(data.summary);
			setFormSuccessMessage(true);

			setTimeout(() => {
				setIsModalOpen(false);
				setFormSuccessMessage(false);
				setFormTitle("");
				setFormContent("");
				setFormRating(5);
			}, 1800);
		} catch (err: unknown) {
			setFormError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section id="customer-reviews" className="mx-auto mt-16 max-w-4xl border-t pt-10">
			{/* Compact Section Header */}
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Đánh giá & Nhận xét từ độc giả
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Phản hồi thực tế từ độc giả đã mua & trải nghiệm sản phẩm này
					</p>
				</div>
				<button
					type="button"
					onClick={handleOpenReviewModal}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
				>
					<PenLine className="h-4 w-4" />
					Viết đánh giá
				</button>
			</div>

			{/* Compact Summary Box with integrated Filter */}
			<div className="rounded-xl border bg-card p-6 shadow-xs">
				<div className="grid gap-6 md:grid-cols-12 md:items-center">
					{/* Overall Score */}
					<div className="flex flex-col items-center justify-center border-b pb-4 text-center md:col-span-4 md:border-r md:border-b-0 md:pb-0 md:pr-6">
						<div className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
							{summary.averageRating.toFixed(1)}
						</div>
						<div className="my-2 flex items-center gap-1 text-amber-500">
							{[1, 2, 3, 4, 5].map((s) => (
								<Star
									key={s}
									className={`h-5 w-5 ${
										s <= Math.round(summary.averageRating)
											? "fill-amber-400 text-amber-400"
											: "fill-muted text-muted-foreground/30"
									}`}
								/>
							))}
						</div>
						<p className="text-[13px] font-medium text-foreground">
							Dựa trên <span className="font-bold">{summary.totalReviews}</span> lượt đánh giá
						</p>
						{summary.recommendPercentage > 0 && (
							<p className="mt-1 text-[13px] font-semibold text-emerald-600">
								✓ {summary.recommendPercentage}% độc giả khuyên đọc
							</p>
						)}
					</div>

					{/* Star breakdown bars - compact and no line wraps */}
					<div className="flex flex-col justify-center space-y-2 md:col-span-8 md:pl-4">
						{[5, 4, 3, 2, 1].map((star) => {
							const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
							const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
							const isSelected = selectedStarFilter === star;

							return (
								<button
									key={star}
									type="button"
									onClick={() => setSelectedStarFilter(isSelected ? null : star)}
									className={`group flex items-center gap-3 text-[13px] transition-colors hover:text-foreground ${
										isSelected ? "font-bold text-foreground" : "text-muted-foreground"
									}`}
									title={`Lọc đánh giá ${star} sao`}
								>
									<span className="flex w-11 items-center gap-1 shrink-0 font-medium text-[13px]">
										{star} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									</span>
									<div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-amber-400 transition-all duration-300 group-hover:bg-amber-500"
											style={{ width: `${percentage}%` }}
										/>
									</div>
									{/* Fixed width with whitespace-nowrap prevents line jump bug */}
									<span className="w-20 shrink-0 text-right text-[13px] tabular-nums whitespace-nowrap font-medium text-muted-foreground">
										{count} ({percentage.toFixed(0)}%)
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Integrated filter row inside the card */}
				<div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-[13px]">
					<span className="mr-1 text-[13px] font-semibold text-muted-foreground">Lọc theo:</span>
					<button
						type="button"
						onClick={() => setSelectedStarFilter(null)}
						className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
							selectedStarFilter === null
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}
					>
						Tất cả ({reviews.length})
					</button>
					{[5, 4, 3, 2, 1].map((star) => (
						<button
							key={star}
							type="button"
							onClick={() => setSelectedStarFilter(selectedStarFilter === star ? null : star)}
							className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
								selectedStarFilter === star
									? "bg-primary text-primary-foreground"
									: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
							}`}
						>
							{star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> (
							{summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0})
						</button>
					))}
				</div>
			</div>

			{/* Reviews List */}
			<div className="mt-6 space-y-4">
				{paginatedReviews.length === 0 ? (
					<div className="rounded-xl border border-dashed p-8 text-center">
						<MessageSquarePlus className="mx-auto h-8 w-8 text-muted-foreground/40" />
						<p className="mt-2 text-[15px] font-semibold text-foreground">Chưa có đánh giá phù hợp</p>
						<p className="mt-1 text-[13px] text-muted-foreground">
							{selectedStarFilter
								? `Chưa có đánh giá ${selectedStarFilter} sao nào.`
								: "Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này!"}
						</p>
					</div>
				) : (
					paginatedReviews.map((review) => {
						const dateStr = new Date(review.createdAt).toLocaleDateString("vi-VN", {
							year: "numeric",
							month: "numeric",
							day: "numeric",
						});
						const initial = review.authorName.charAt(0).toUpperCase() || "B";
						const isLiked = Boolean(helpfulVoted[review.id]);

						return (
							<div
								key={review.id}
								className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-xs"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
											{initial}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="text-[13px] font-semibold text-foreground">
													{review.authorName}
												</span>
												{review.isVerified && (
													<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[13px] font-semibold text-emerald-700">
														<CheckCircle2 className="h-3 w-3 text-emerald-600" />
														Đã mua hàng
													</span>
												)}
											</div>
											<div className="mt-1 flex items-center gap-2">
												<div className="flex items-center text-amber-500">
													{[1, 2, 3, 4, 5].map((s) => (
														<Star
															key={s}
															className={`h-3.5 w-3.5 ${
																s <= review.rating
																	? "fill-amber-400 text-amber-400"
																	: "fill-muted text-muted-foreground/30"
															}`}
														/>
													))}
												</div>
												<span className="text-[13px] text-muted-foreground">{dateStr}</span>
											</div>
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleHelpful(review.id)}
										disabled={isLiked}
										className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[13px] font-medium transition-colors ${
											isLiked
												? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
												: "bg-background text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
										}`}
										title={isLiked ? "Bạn đã bấm thích đánh giá này" : "Bấm thích đánh giá"}
									>
										<ThumbsUp className="h-3.5 w-3.5" />
										<span>{isLiked ? "Đã thích" : "Hữu ích"} ({review.helpfulCount})</span>
									</button>
								</div>

								{review.title && (
									<h4 className="mt-3 text-[15px] font-semibold text-foreground">
										{review.title}
									</h4>
								)}
								<p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90 whitespace-pre-line">
									{review.content}
								</p>
							</div>
						);
					})
				)}
			</div>

			{/* Pagination Controls (when more than 1 review exists) */}
			{reviews.length > 1 && totalPages > 1 && (
				<div className="mt-5 flex items-center justify-between border-t pt-3 text-[13px]">
					<span className="text-[13px] text-muted-foreground">
						Hiển thị {(currentPage - 1) * REVIEWS_PER_PAGE + 1} -{" "}
						{Math.min(currentPage * REVIEWS_PER_PAGE, filteredReviews.length)} trong{" "}
						{filteredReviews.length} đánh giá
					</span>

					<div className="flex items-center gap-1">
						<button
							type="button"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
							title="Trang trước"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</button>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
							<button
								key={pageNum}
								type="button"
								onClick={() => setCurrentPage(pageNum)}
								className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
									currentPage === pageNum
										? "bg-primary text-primary-foreground font-semibold"
										: "border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
								}`}
							>
								{pageNum}
							</button>
						))}

						<button
							type="button"
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
							title="Trang sau"
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			)}

			{/* Ineligible Notice Modal */}
			{showIneligibleNotice &&
				mounted &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
						<div className="relative w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-xl">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
								<Lock className="h-6 w-6" />
							</div>
							<h3 className="mt-3 text-base font-bold text-foreground">
								Quyền đánh giá bị giới hạn
							</h3>
							<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
								Để đảm bảo tính khách quan và trung thực, chỉ những độc giả đã mua sản phẩm này tại Aurabook mới có thể gửi đánh giá.
							</p>
							<button
								type="button"
								onClick={() => setShowIneligibleNotice(false)}
								className="mt-5 w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
							>
								Đã hiểu
							</button>
						</div>
					</div>,
					document.body,
				)}

			{/* Write Review Modal */}
			{isModalOpen &&
				mounted &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="relative w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl sm:p-6 animate-in zoom-in-95 duration-200">
						<button
							type="button"
							onClick={() => setIsModalOpen(false)}
							className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
							title="Đóng"
						>
							<X className="h-4 w-4" />
						</button>

						{formSuccessMessage ? (
							<div className="py-6 text-center">
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
									<CheckCircle2 className="h-7 w-7" />
								</div>
								<h3 className="mt-3 text-lg font-bold text-foreground">Cảm ơn bạn đã đánh giá!</h3>
								<p className="mt-1 text-xs text-muted-foreground">
									Đánh giá của bạn đã được ghi nhận và hiển thị ngay trên sản phẩm & cộng đồng.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmitReview} className="space-y-4">
								<div>
									<h3 className="text-lg font-bold text-foreground">Viết đánh giá sản phẩm</h3>
									<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground font-medium">
										{productName}
									</p>
								</div>

								{formError && (
									<div className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
										{formError}
									</div>
								)}

								{/* Star Picker */}
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Chất lượng sản phẩm <span className="text-destructive">*</span>
									</label>
									<div className="mt-1.5 flex items-center gap-1.5">
										{[1, 2, 3, 4, 5].map((star) => {
											const activeLevel = formHoverRating ?? formRating;
											const isFilled = star <= activeLevel;
											return (
												<button
													key={star}
													type="button"
													onMouseEnter={() => setFormHoverRating(star)}
													onMouseLeave={() => setFormHoverRating(null)}
													onClick={() => setFormRating(star)}
													className="p-0.5 transition-transform hover:scale-110 focus:outline-hidden"
												>
													<Star
														className={`h-6 w-6 transition-colors ${
															isFilled
																? "fill-amber-400 text-amber-400"
																: "fill-muted text-muted-foreground/30"
														}`}
													/>
												</button>
											);
										})}
										<span className="ml-2 text-xs font-semibold text-amber-600">
											{RATING_LABELS[formHoverRating ?? formRating]}
										</span>
									</div>
								</div>

								{/* Author & Anonymous option */}
								<div>
									<div className="flex items-center justify-between">
										<label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
											Tên hiển thị <span className="text-destructive">*</span>
										</label>
										<label className="flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
											<input
												type="checkbox"
												checked={formIsAnonymous}
												onChange={(e) => setFormIsAnonymous(e.target.checked)}
												className="rounded border-border"
											/>
											<EyeOff className="h-3 w-3" />
											<span>Đánh giá ẩn danh</span>
										</label>
									</div>
									<input
										type="text"
										required={!formIsAnonymous}
										disabled={formIsAnonymous}
										value={formIsAnonymous ? "Độc giả ẩn danh" : formAuthor}
										onChange={(e) => setFormAuthor(e.target.value)}
										placeholder="Ví dụ: Nguyễn Văn A"
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
									/>
								</div>

								{/* Title */}
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Tiêu đề nhận xét
									</label>
									<input
										type="text"
										value={formTitle}
										onChange={(e) => setFormTitle(e.target.value)}
										placeholder="Ví dụ: Sách rất hay, đóng gói cẩn thận"
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								{/* Content */}
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Nội dung đánh giá chi tiết <span className="text-destructive">*</span>
									</label>
									<textarea
										required
										rows={3}
										value={formContent}
										onChange={(e) => setFormContent(e.target.value)}
										placeholder="Chia sẻ cảm nhận chân thực của bạn về chất lượng sách, nội dung, dịch vụ..."
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								<div className="flex justify-end gap-2.5 pt-1">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-accent"
									>
										Hủy
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
									>
										{isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>,
				document.body,
			)}
		</section>
	);
}
