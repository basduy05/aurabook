"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, CheckCircle2, MessageSquarePlus, X, PenLine } from "lucide-react";
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

	// Form state
	const [formRating, setFormRating] = useState(5);
	const [formHoverRating, setFormHoverRating] = useState<number | null>(null);
	const [formAuthor, setFormAuthor] = useState("");
	const [formTitle, setFormTitle] = useState("");
	const [formContent, setFormContent] = useState("");
	const [formSuccessMessage, setFormSuccessMessage] = useState(false);
	const [formError, setFormError] = useState("");

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
	}, [productSlug, initialData]);

	useEffect(() => {
		const handleOpenModal = () => setIsModalOpen(true);
		window.addEventListener("open-write-review-modal", handleOpenModal);
		return () => window.removeEventListener("open-write-review-modal", handleOpenModal);
	}, []);

	const filteredReviews = selectedStarFilter
		? reviews.filter((r) => r.rating === selectedStarFilter)
		: reviews;

	const handleHelpful = async (reviewId: string) => {
		if (helpfulVoted[reviewId]) return;
		try {
			setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
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
		if (!formAuthor.trim() || !formContent.trim()) {
			setFormError("Vui lòng nhập họ tên và nội dung đánh giá của bạn.");
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
					authorName: formAuthor,
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

			// Reset form after 2s and close modal
			setTimeout(() => {
				setIsModalOpen(false);
				setFormSuccessMessage(false);
				setFormAuthor("");
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
		<section id="customer-reviews" className="mt-16 border-t pt-12">
			<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Đánh giá & Nhận xét từ độc giả
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Những phản hồi chân thực từ bạn đọc đã mua & trải nghiệm cuốn sách này
					</p>
				</div>
				<button
					type="button"
					onClick={() => setIsModalOpen(true)}
					className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
				>
					<PenLine className="h-4 w-4" />
					Viết đánh giá
				</button>
			</div>

			{/* Review Summary Breakdown Box */}
			<div className="grid gap-6 rounded-2xl border bg-card p-6 shadow-xs md:grid-cols-12 md:p-8">
				{/* Overall score */}
				<div className="flex flex-col items-center justify-center border-b pb-6 text-center md:col-span-4 md:border-r md:border-b-0 md:pb-0 md:pr-6">
					<div className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
						{summary.averageRating.toFixed(1)}
					</div>
					<div className="my-2.5 flex items-center gap-1 text-amber-500">
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
					<p className="text-sm font-medium text-foreground">
						Dựa trên <span className="font-bold">{summary.totalReviews}</span> lượt đánh giá
					</p>
					{summary.recommendPercentage > 0 && (
						<p className="mt-1 text-xs text-emerald-600 font-medium">
							✓ {summary.recommendPercentage}% người mua khuyên đọc tác phẩm này
						</p>
					)}
				</div>

				{/* Star breakdown bars */}
				<div className="flex flex-col justify-center space-y-2.5 md:col-span-8 md:pl-2">
					{[5, 4, 3, 2, 1].map((star) => {
						const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
						const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
						const isSelected = selectedStarFilter === star;

						return (
							<button
								key={star}
								type="button"
								onClick={() => setSelectedStarFilter(isSelected ? null : star)}
								className={`group flex items-center gap-3 text-xs transition-colors hover:text-foreground ${
									isSelected ? "font-bold text-foreground" : "text-muted-foreground"
								}`}
							>
								<span className="flex w-12 items-center gap-1 shrink-0 font-medium">
									{star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
								</span>
								<div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-amber-400 transition-all duration-300 group-hover:bg-amber-500"
										style={{ width: `${percentage}%` }}
									/>
								</div>
								<span className="w-10 text-right shrink-0 tabular-nums">
									{count} ({percentage.toFixed(0)}%)
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="mt-8 flex flex-wrap items-center gap-2 border-b pb-4">
				<span className="mr-2 text-xs font-medium text-muted-foreground">Lọc theo:</span>
				<button
					type="button"
					onClick={() => setSelectedStarFilter(null)}
					className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
						onClick={() => setSelectedStarFilter(star)}
						className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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

			{/* Reviews List */}
			<div className="mt-6 space-y-4">
				{filteredReviews.length === 0 ? (
					<div className="rounded-xl border border-dashed p-8 text-center">
						<MessageSquarePlus className="mx-auto h-8 w-8 text-muted-foreground/50" />
						<p className="mt-2 text-sm font-medium text-foreground">Chưa có đánh giá nào</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này!
						</p>
						<button
							type="button"
							onClick={() => setIsModalOpen(true)}
							className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent"
						>
							<PenLine className="h-3.5 w-3.5" />
							Viết nhận xét ngay
						</button>
					</div>
				) : (
					filteredReviews.map((review) => {
						const dateStr = new Date(review.createdAt).toLocaleDateString("vi-VN", {
							year: "numeric",
							month: "long",
							day: "numeric",
						});
						const initial = review.authorName.charAt(0).toUpperCase() || "B";

						return (
							<div
								key={review.id}
								className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-xs"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
											{initial}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-semibold text-foreground text-sm">
													{review.authorName}
												</span>
												{review.isVerified && (
													<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
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
												<span className="text-[11px] text-muted-foreground">{dateStr}</span>
											</div>
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleHelpful(review.id)}
										disabled={helpfulVoted[review.id]}
										className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
											helpfulVoted[review.id]
												? "border-emerald-200 bg-emerald-50 text-emerald-700"
												: "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
										}`}
									>
										<ThumbsUp className="h-3.5 w-3.5" />
										<span>Hữu ích ({review.helpfulCount})</span>
									</button>
								</div>

								{review.title && (
									<h4 className="mt-3.5 font-semibold text-foreground text-sm">
										{review.title}
									</h4>
								)}
								<p className="mt-1 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
									{review.content}
								</p>
							</div>
						);
					})
				)}
			</div>

			{/* Write Review Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200">
						<button
							type="button"
							onClick={() => setIsModalOpen(false)}
							className="absolute top-5 right-5 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
							title="Đóng"
						>
							<X className="h-5 w-5" />
						</button>

						{formSuccessMessage ? (
							<div className="py-8 text-center">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
									<CheckCircle2 className="h-8 w-8" />
								</div>
								<h3 className="mt-4 text-xl font-bold text-foreground">Cảm ơn bạn đã đánh giá!</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Đánh giá của bạn đã được ghi nhận và hiển thị ngay trên sản phẩm.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmitReview} className="space-y-5">
								<div>
									<h3 className="text-xl font-bold text-foreground">Đánh giá sản phẩm</h3>
									<p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
										{productName}
									</p>
								</div>

								{formError && (
									<div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
										{formError}
									</div>
								)}

								{/* Star Picker */}
								<div>
									<label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Mức độ hài lòng của bạn <span className="text-destructive">*</span>
									</label>
									<div className="mt-2 flex items-center gap-2">
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
													className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
												>
													<Star
														className={`h-7 w-7 transition-colors ${
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

								{/* Author Name */}
								<div>
									<label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Họ và tên của bạn <span className="text-destructive">*</span>
									</label>
									<input
										type="text"
										required
										value={formAuthor}
										onChange={(e) => setFormAuthor(e.target.value)}
										placeholder="Ví dụ: Nguyễn Văn A"
										className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								{/* Title */}
								<div>
									<label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Tiêu đề nhận xét
									</label>
									<input
										type="text"
										value={formTitle}
										onChange={(e) => setFormTitle(e.target.value)}
										placeholder="Ví dụ: Sách rất hay, đóng gói cẩn thận"
										className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								{/* Content */}
								<div>
									<label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Nội dung đánh giá chi tiết <span className="text-destructive">*</span>
									</label>
									<textarea
										required
										rows={4}
										value={formContent}
										onChange={(e) => setFormContent(e.target.value)}
										placeholder="Chia sẻ cảm nhận của bạn về nội dung cuốn sách, chất lượng in ấn, thời gian giao hàng..."
										className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								<div className="flex justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
									>
										Hủy
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
									>
										{isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
