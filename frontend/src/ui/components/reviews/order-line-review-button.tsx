"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, CheckCircle2, X } from "lucide-react";

interface OrderLineReviewButtonProps {
	productSlug: string;
	productName: string;
	productId?: string;
}

const RATING_LABELS: Record<number, string> = {
	1: "Rất tệ",
	2: "Chưa hài lòng",
	3: "Bình thường",
	4: "Hài lòng",
	5: "Tuyệt vời & khuyên đọc",
};

export function OrderLineReviewButton({
	productSlug,
	productName,
	productId,
}: OrderLineReviewButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);
	const [rating, setRating] = useState(5);
	const [hoverRating, setHoverRating] = useState<number | null>(null);
	const [author, setAuthor] = useState("");
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!author.trim() || !content.trim()) {
			setError("Vui lòng nhập họ tên và nội dung đánh giá.");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const res = await fetch("/api/reviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productSlug,
					productId,
					authorName: author,
					rating,
					title: title || RATING_LABELS[rating],
					content,
					isVerified: true,
				}),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error || "Không thể gửi đánh giá.");
			}

			setIsSuccess(true);
			setTimeout(() => {
				setIsOpen(false);
				setIsSuccess(false);
			}, 2000);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
			>
				<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
				Đánh giá sản phẩm
			</button>

			{isOpen &&
				mounted &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						>
							<X className="h-5 w-5" />
						</button>

						{isSuccess ? (
							<div className="py-6 text-center">
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
									<CheckCircle2 className="h-6 w-6" />
								</div>
								<h3 className="mt-3 text-lg font-bold text-foreground">Đã gửi đánh giá thành công!</h3>
								<p className="mt-1 text-xs text-muted-foreground">
									Đánh giá của bạn đã được ghi nhận với huy hiệu ✓ Đã mua hàng.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<h3 className="text-lg font-bold text-foreground">Đánh giá sản phẩm đã mua</h3>
									<p className="mt-1 line-clamp-1 text-xs text-muted-foreground font-medium">
										{productName}
									</p>
								</div>

								{error && (
									<div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
										{error}
									</div>
								)}

								<div>
									<label className="block text-xs font-semibold uppercase text-muted-foreground">
										Chất lượng sản phẩm
									</label>
									<div className="mt-1.5 flex items-center gap-1.5">
										{[1, 2, 3, 4, 5].map((star) => {
											const activeLevel = hoverRating ?? rating;
											return (
												<button
													key={star}
													type="button"
													onMouseEnter={() => setHoverRating(star)}
													onMouseLeave={() => setHoverRating(null)}
													onClick={() => setRating(star)}
													className="p-1 transition-transform hover:scale-110"
												>
													<Star
														className={`h-6 w-6 ${
															star <= activeLevel
																? "fill-amber-400 text-amber-400"
																: "fill-muted text-muted-foreground/30"
														}`}
													/>
												</button>
											);
										})}
										<span className="ml-2 text-xs font-semibold text-amber-600">
											{RATING_LABELS[hoverRating ?? rating]}
										</span>
									</div>
								</div>

								<div>
									<label className="block text-xs font-semibold uppercase text-muted-foreground">
										Họ và tên của bạn *
									</label>
									<input
										type="text"
										required
										value={author}
										onChange={(e) => setAuthor(e.target.value)}
										placeholder="Ví dụ: Nguyễn Văn A"
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold uppercase text-muted-foreground">
										Tiêu đề
									</label>
									<input
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Ví dụ: Sách hay, đóng gói cẩn thận"
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold uppercase text-muted-foreground">
										Nhận xét của bạn *
									</label>
									<textarea
										required
										rows={3}
										value={content}
										onChange={(e) => setContent(e.target.value)}
										placeholder="Chia sẻ trải nghiệm đọc sách và sự hài lòng của bạn..."
										className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-primary/30"
									/>
								</div>

								<div className="flex justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsOpen(false)}
										className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-accent"
									>
										Hủy
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
		</>
	);
}
