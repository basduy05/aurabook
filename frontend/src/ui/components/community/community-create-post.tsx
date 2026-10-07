"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Send, Book, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityUser, type CommunityPost } from "@/lib/community/types";

const POPULAR_BOOKS = [
	{ title: "Đắc Nhân Tâm", slug: "dac-nhan-tam" },
	{ title: "Nhà Giả Kim", slug: "nha-gia-kim" },
	{ title: "Tuổi Trẻ Đáng Giá Bao Nhiêu", slug: "tuoi-tre-dang-gia-bao-nhieu" },
	{ title: "Tư Duy Nhanh Và Chậm", slug: "tu-duy-nhanh-va-cham" },
	{ title: "Cây Cam Ngọt Của Tôi", slug: "cay-cam-ngot-cua-toi" },
];

interface CommunityCreatePostProps {
	currentUser: CommunityUser | null;
	onPostCreated: (post: CommunityPost) => void;
	onRequireTermsOrProfile: () => void;
}

export function CommunityCreatePost({
	currentUser,
	onPostCreated,
	onRequireTermsOrProfile,
}: CommunityCreatePostProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [bookTitle, setBookTitle] = useState("");
	const [bookSlug, setBookSlug] = useState("");
	const [rating, setRating] = useState<number>(5);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleStartCreate = () => {
		if (!currentUser?.hasAcceptedTerms) {
			onRequireTermsOrProfile();
			return;
		}
		setIsExpanded(true);
	};

	const handleSelectBook = (book: { title: string; slug: string }) => {
		setBookTitle(book.title);
		setBookSlug(book.slug);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentUser) {
			onRequireTermsOrProfile();
			return;
		}

		if (!title.trim() || !content.trim()) {
			setError("Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const res = await fetch("/api/community/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					author: {
						id: currentUser.id,
						username: currentUser.username,
						displayName: currentUser.displayName,
						avatar: currentUser.avatar,
						isVerifiedBuyer: true,
					},
					book: bookTitle.trim()
						? {
								title: bookTitle.trim(),
								slug: bookSlug.trim() || bookTitle.toLowerCase().replace(/\s+/g, "-"),
								rating: rating || 5,
							}
						: undefined,
					title: title.trim(),
					content: content.trim(),
				}),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error || "Không thể đăng bài viết");
			}

			const data = (await res.json()) as { post: CommunityPost };
			onPostCreated(data.post);

			// Reset form
			setTitle("");
			setContent("");
			setBookTitle("");
			setBookSlug("");
			setRating(5);
			setIsExpanded(false);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng bài";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all">
			{!isExpanded ? (
				<div className="flex items-center gap-3">
					<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
						<Image
							src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
							alt="User Avatar"
							fill
							sizes="40px"
							className="object-cover"
							unoptimized
						/>
					</div>
					<button
						type="button"
						onClick={handleStartCreate}
						className="flex-1 rounded-full border border-input bg-muted/30 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
					>
						Bạn đang đọc cuốn sách gì? Chia sẻ cảm nhận với cộng đồng...
					</button>
					<Button
						type="button"
						onClick={handleStartCreate}
						className="gap-1.5 shrink-0 px-4 py-2 text-xs"
					>
						<Sparkles className="h-3.5 w-3.5" />
						Viết bài
					</Button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in-0">
					<div className="flex items-center justify-between border-b border-border pb-3">
						<div className="flex items-center gap-2.5">
							<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
								<Image
									src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
									alt="User Avatar"
									fill
									sizes="36px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div>
								<div className="text-xs font-semibold text-foreground">
									{currentUser?.displayName || "Độc giả AuraBook"}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{currentUser?.username || "@docgia"}
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setIsExpanded(false)}
							className="text-xs text-muted-foreground hover:text-foreground"
						>
							Thu gọn
						</button>
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
							<AlertCircle className="h-4 w-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{/* Book Selector / Input */}
					<div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
						<label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
							<Book className="h-3.5 w-3.5 text-primary" />
							<span>Cuốn sách bạn muốn review / thảo luận:</span>
						</label>
						<Input
							type="text"
							value={bookTitle}
							onChange={(e) => {
								setBookTitle(e.target.value);
								setBookSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
							}}
							placeholder="VD: Đắc Nhân Tâm, Cây Cam Ngọt Của Tôi..."
							className="h-8 text-xs"
						/>
						{/* Quick suggestions */}
						<div className="flex flex-wrap items-center gap-1.5 pt-1">
							<span className="text-[10px] text-muted-foreground">Gợi ý:</span>
							{POPULAR_BOOKS.map((b) => (
								<button
									key={b.slug}
									type="button"
									onClick={() => handleSelectBook(b)}
									className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
										bookSlug === b.slug
											? "bg-primary text-primary-foreground font-medium"
											: "bg-muted text-muted-foreground hover:text-foreground"
									}`}
								>
									{b.title}
								</button>
							))}
						</div>

						{/* Star rating for book */}
						{bookTitle.trim() && (
							<div className="flex items-center gap-3 pt-1">
								<span className="text-xs text-foreground font-medium">Đánh giá sao:</span>
								<div className="flex items-center gap-1">
									{[1, 2, 3, 4, 5].map((s) => (
										<button
											key={s}
											type="button"
											onClick={() => setRating(s)}
											className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
										>
											<Star
												className={`h-4 w-4 ${
													s <= rating ? "fill-amber-400 text-amber-400" : "text-border"
												}`}
											/>
										</button>
									))}
								</div>
								<span className="text-xs font-semibold text-muted-foreground">
									{rating}/5 sao
								</span>
							</div>
						)}
					</div>

					{/* Title & Content */}
					<div>
						<Input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Tiêu đề bài viết (VD: Trải nghiệm khó quên sau khi đọc xong chương cuối...)"
							className="text-sm font-medium"
							required
						/>
					</div>

					<div>
						<textarea
							rows={4}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Viết cảm nhận, những câu trích dẫn tâm đắc hoặc bài học bạn rút ra từ cuốn sách..."
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
							required
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="outline-solid"
							onClick={() => setIsExpanded(false)}
							disabled={isSubmitting}
							className="text-xs h-8"
						>
							Hủy bỏ
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="gap-1.5 text-xs h-8 px-4 font-medium"
						>
							<Send className="h-3.5 w-3.5" />
							{isSubmitting ? "Đang đăng bài..." : "Đăng bài viết"}
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}
