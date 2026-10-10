"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, CheckCircle2, X } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Badge } from "@/ui/components/ui/badge";

interface OrderLineReviewButtonProps {
	productSlug: string;
	productName: string;
	productId?: string;
	defaultAuthorName?: string;
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
	defaultAuthorName = "",
}: OrderLineReviewButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [rating, setRating] = useState(5);
	const [hoverRating, setHoverRating] = useState<number | null>(null);
	const [author, setAuthor] = useState(defaultAuthorName);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		setMounted(true);
	}, []);

	// Auto-fill author name from prop or from user session / profile
	useEffect(() => {
		if (defaultAuthorName && !author) {
			setAuthor(defaultAuthorName);
		}
	}, [defaultAuthorName, author]);

	useEffect(() => {
		if (!author && isOpen) {
			fetch("/api/community/profile")
				.then((res) => (res.ok ? (res.json() as Promise<any>) : null))
				.then((data: any) => {
					if (data?.user?.displayName) {
						setAuthor(data.user.displayName);
					}
				})
				.catch(() => {});
		}
	}, [author, isOpen]);

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
			<Button
				type="button"
				variant="outline-solid"
				size="sm"
				onClick={() => setIsOpen(true)}
				className="gap-1.5 h-8 px-2.5 text-xs font-semibold cursor-pointer border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
			>
				<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
				<span>Đánh giá sản phẩm</span>
			</Button>

			{isOpen &&
				mounted &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
						<div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
								aria-label="Đóng"
							>
								<X className="h-4 w-4" />
							</button>

							{isSuccess ? (
								<div className="py-6 text-center space-y-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
										<CheckCircle2 className="h-6 w-6" />
									</div>
									<h3 className="text-lg font-bold text-foreground">Đã gửi đánh giá thành công!</h3>
									<p className="text-xs text-muted-foreground">
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
										<div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
											{error}
										</div>
									)}

									<div className="space-y-1.5">
										<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
											Chất lượng sản phẩm
										</Label>
										<div className="flex items-center gap-1.5 pt-0.5">
											{[1, 2, 3, 4, 5].map((star) => {
												const activeLevel = hoverRating ?? rating;
												return (
													<button
														key={star}
														type="button"
														onMouseEnter={() => setHoverRating(star)}
														onMouseLeave={() => setHoverRating(null)}
														onClick={() => setRating(star)}
														className="p-1 transition-transform hover:scale-110 cursor-pointer"
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
											<Badge variant="outline-solid" className="ml-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
												{RATING_LABELS[hoverRating ?? rating]}
											</Badge>
										</div>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="review-author" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
											Họ và tên của bạn *
										</Label>
										<Input
											id="review-author"
											type="text"
											required
											value={author}
											onChange={(e) => setAuthor(e.target.value)}
											placeholder="Ví dụ: Nguyễn Văn A"
											className="h-10 text-sm"
										/>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="review-title" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
											Tiêu đề
										</Label>
										<Input
											id="review-title"
											type="text"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											placeholder="Ví dụ: Sách hay, đóng gói cẩn thận"
											className="h-10 text-sm"
										/>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="review-content" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
											Nhận xét của bạn *
										</Label>
										<textarea
											id="review-content"
											required
											rows={3}
											value={content}
											onChange={(e) => setContent(e.target.value)}
											placeholder="Chia sẻ trải nghiệm đọc sách và sự hài lòng của bạn..."
											className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										/>
									</div>

									<div className="flex justify-end gap-2.5 pt-2">
										<Button
											type="button"
											variant="outline-solid"
											size="sm"
											onClick={() => setIsOpen(false)}
											className="cursor-pointer"
										>
											Hủy
										</Button>
										<Button
											type="submit"
											variant="default"
											size="sm"
											disabled={isSubmitting}
											className="min-w-[100px] cursor-pointer"
										>
											{isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
										</Button>
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
