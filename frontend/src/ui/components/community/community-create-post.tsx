"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Send, Book, AlertCircle, Search, X, ExternalLink } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityUser, type CommunityPost } from "@/lib/community/types";
import { RichToolbar, MentionDropdown } from "./community-rich-editor";

interface BookResult {
	id: string;
	title: string;
	slug: string;
	price: string;
	author: string;
	thumbnail: string;
	rating: number;
}

interface CommunityCreatePostProps {
	currentUser: CommunityUser | null;
	onPostCreated: (post: CommunityPost) => void;
	onRequireTermsOrProfile?: () => void;
}

export function CommunityCreatePost({
	currentUser,
	onPostCreated,
	onRequireTermsOrProfile,
}: CommunityCreatePostProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	// Book search & selection
	const [bookSearch, setBookSearch] = useState("");
	const [bookResults, setBookResults] = useState<BookResult[]>([]);
	const [isSearchingBooks, setIsSearchingBooks] = useState(false);
	const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
	const [showBookDropdown, setShowBookDropdown] = useState(false);
	const bookSearchRef = useRef<HTMLDivElement>(null);

	const [rating, setRating] = useState<number>(5);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	// Rich text & Mentions
	const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [mentionQuery, setMentionQuery] = useState("");
	const [showMentionDropdown, setShowMentionDropdown] = useState(false);

	const handleContentChange = (val: string) => {
		setContent(val);
		const textarea = contentTextareaRef.current;
		if (textarea) {
			const cursor = textarea.selectionStart;
			const textBeforeCursor = val.slice(0, cursor);
			const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
			if (match) {
				setMentionQuery(match[1]);
				setShowMentionDropdown(true);
			} else {
				setShowMentionDropdown(false);
			}
		}
	};

	const handleSelectMentionUser = (selectedUsername: string) => {
		const textarea = contentTextareaRef.current;
		if (!textarea) return;
		const cursor = textarea.selectionStart;
		const textBeforeCursor = content.slice(0, cursor);
		const textAfterCursor = content.slice(cursor);
		const tag = selectedUsername.startsWith("@") ? selectedUsername : `@${selectedUsername}`;
		const replacedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_]*)$/, `${tag} `);
		const newContent = replacedBefore + textAfterCursor;
		setContent(newContent);
		setShowMentionDropdown(false);
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(replacedBefore.length, replacedBefore.length);
		}, 0);
	};

	// Search real books from catalog
	useEffect(() => {
		let isMounted = true;
		const searchBooks = async () => {
			setIsSearchingBooks(true);
			try {
				const res = await fetch(`/api/community/books?q=${encodeURIComponent(bookSearch.trim())}`);
				if (res.ok) {
					const data = (await res.json()) as { books: BookResult[] };
					if (isMounted) setBookResults(data.books || []);
				}
			} catch (e) {
				console.error("Failed to query catalog books:", e);
			} finally {
				if (isMounted) setIsSearchingBooks(false);
			}
		};

		const debounce = setTimeout(searchBooks, 250);
		return () => {
			isMounted = false;
			clearTimeout(debounce);
		};
	}, [bookSearch]);

	// Close dropdown when clicked outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (bookSearchRef.current && !bookSearchRef.current.contains(e.target as Node)) {
				setShowBookDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleStartCreate = () => {
		setIsExpanded(true);
		if (onRequireTermsOrProfile && !currentUser?.hasAcceptedTerms) {
			onRequireTermsOrProfile();
		}
	};

	const handleSelectBook = (book: BookResult) => {
		setSelectedBook(book);
		setShowBookDropdown(false);
		setBookSearch("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim() || !content.trim()) {
			setError("Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const authorPayload = {
				id: currentUser?.id || "user-1",
				username: currentUser?.username || "@basduy",
				displayName: currentUser?.displayName || "Duy Nguyễn",
				avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
				isVerifiedBuyer: true,
			};

			const res = await fetch("/api/community/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					author: authorPayload,
					book: selectedBook
						? {
								title: selectedBook.title,
								slug: selectedBook.slug,
								price: selectedBook.price,
								thumbnail: selectedBook.thumbnail,
								author: selectedBook.author,
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
			setSelectedBook(null);
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
		<div className="rounded-xl border border-border bg-card p-4 transition-all shadow-2xs">
			{!isExpanded ? (
				<div className="flex items-center gap-2.5">
					<div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
						<Image
							src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
							alt="User Avatar"
							fill
							sizes="36px"
							className="object-cover"
							unoptimized
						/>
					</div>
					<button
						type="button"
						onClick={handleStartCreate}
						className="flex-1 rounded-full border border-border/80 bg-muted/30 px-3.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-muted/60 transition-colors"
					>
						Bạn đang đọc cuốn sách nào? Chia sẻ cảm nhận & góc nhìn...
					</button>
					<Button
						type="button"
						onClick={handleStartCreate}
						className="gap-1.5 shrink-0 px-3.5 py-1.5 h-8 text-[13px] font-semibold"
					>
						<Send className="h-3.5 w-3.5" />
						Đăng bài
					</Button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in-0">
					<div className="flex items-center justify-between border-b border-border pb-2.5">
						<div className="flex items-center gap-2">
							<div className="relative w-8 h-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
								<Image
									src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
									alt="User Avatar"
									fill
									sizes="32px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div>
								<div className="text-[13px] font-semibold text-foreground leading-none">
									{currentUser?.displayName || "Độc giả Aurabook"}
								</div>
								<div className="text-[12px] text-muted-foreground leading-none mt-1">
									{currentUser?.username || "@docgia"}
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setIsExpanded(false)}
							className="text-[13px] text-muted-foreground hover:text-foreground font-medium"
						>
							Thu gọn
						</button>
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-[13px] text-destructive">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{/* Real Book Selector & Link Attachment */}
					<div ref={bookSearchRef} className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2 relative">
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
								<Book className="h-3.5 w-3.5 text-primary" />
								<span>Gắn liên kết cuốn sách trong hệ thống:</span>
							</label>
							{selectedBook && (
								<button
									type="button"
									onClick={() => setSelectedBook(null)}
									className="text-[13px] text-destructive hover:underline font-medium"
								>
									Đổi sách khác
								</button>
							)}
						</div>

						{selectedBook ? (
							/* Selected Book Pill / Card */
							<div className="rounded-lg border border-border bg-card p-2.5 flex items-center justify-between gap-3 shadow-2xs">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="relative w-11 h-16 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted">
										<Image
											src={selectedBook.thumbnail}
											alt={selectedBook.title}
											fill
											sizes="44px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="min-w-0">
										<div className="font-semibold text-[13px] text-foreground truncate">
											{selectedBook.title}
										</div>
										<div className="text-[13px] text-muted-foreground truncate mt-0.5">
											{selectedBook.author}
										</div>
										<div className="text-[13px] font-bold text-primary mt-0.5">
											{selectedBook.price}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<Link
										href={`/vi/channel-vnd/products/${selectedBook.slug}`}
										target="_blank"
										className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
										title="Xem trang sản phẩm"
									>
										<ExternalLink className="h-4 w-4" />
									</Link>
									<button
										type="button"
										onClick={() => setSelectedBook(null)}
										className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
										title="Xóa đính kèm"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>
						) : (
							/* Search Real Catalog Books */
							<div className="relative">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
									<Input
										type="text"
										value={bookSearch}
										onFocus={() => setShowBookDropdown(true)}
										onChange={(e) => {
											setBookSearch(e.target.value);
											setShowBookDropdown(true);
										}}
										placeholder="Gõ tên cuốn sách để tìm chính xác link trong hệ thống..."
										className="h-9.5 pl-10 pr-3 text-[13px] rounded-lg"
									/>
								</div>

								{/* Autocomplete Dropdown List */}
								{showBookDropdown && (
									<div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg z-30 divide-y divide-border/60">
										{isSearchingBooks ? (
											<div className="p-3 text-center text-[13px] text-muted-foreground">
												Đang tìm kiếm sách...
											</div>
										) : bookResults.length === 0 ? (
											<div className="p-3 text-center text-[13px] text-muted-foreground">
												Không tìm thấy sách phù hợp
											</div>
										) : (
											bookResults.map((b) => (
												<button
													key={b.id || b.slug}
													type="button"
													onClick={() => handleSelectBook(b)}
													className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2.5 rounded-lg group"
												>
													<div className="flex items-center gap-2.5 min-w-0">
														<div className="relative w-10 h-14 shrink-0 overflow-hidden rounded border border-border/80 bg-muted">
															<Image
																src={b.thumbnail}
																alt={b.title}
																fill
																sizes="40px"
																className="object-cover"
																unoptimized
															/>
														</div>
														<div className="min-w-0">
															<div className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
																{b.title}
															</div>
															<div className="text-[13px] text-muted-foreground truncate">
																{b.author}
															</div>
														</div>
													</div>
													<div className="text-right shrink-0">
														<span className="text-[13px] font-bold text-primary block">
															{b.price}
														</span>
														<span className="text-[13px] text-muted-foreground">
															{b.rating} ★
														</span>
													</div>
												</button>
											))
										)}
									</div>
								)}
							</div>
						)}

						{/* Star rating for book */}
						{selectedBook && (
							<div className="flex items-center gap-2 pt-1 border-t border-border/60">
								<span className="text-[13px] text-foreground font-medium">Đánh giá sao:</span>
								<div className="flex items-center gap-0.5">
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
								<span className="text-[13px] font-semibold text-muted-foreground">
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
							className="text-[15px] font-semibold h-10"
							required
						/>
					</div>

					<div className="space-y-2 relative">
						<div className="flex items-center justify-between">
							<RichToolbar
								textareaRef={contentTextareaRef}
								value={content}
								onChange={setContent}
								onOpenMention={() => setShowMentionDropdown(true)}
								size="sm"
							/>
							<span className="text-[11px] text-muted-foreground">
								Hỗ trợ in đậm, in nghiêng, trích dẫn, danh sách & @tag
							</span>
						</div>

						<textarea
							ref={contentTextareaRef}
							rows={4}
							value={content}
							onChange={(e) => handleContentChange(e.target.value)}
							placeholder="Viết cảm nhận, câu trích dẫn tâm đắc hoặc bài học từ sách... Gõ @ để nhắc đến bạn bè"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
							required
						/>

						<MentionDropdown
							isOpen={showMentionDropdown}
							query={mentionQuery}
							onSelectUser={handleSelectMentionUser}
							onClose={() => setShowMentionDropdown(false)}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-2.5 pt-1">
						<Button
							type="button"
							variant="outline-solid"
							onClick={() => setIsExpanded(false)}
							disabled={isSubmitting}
							className="text-[13px] h-9.5 px-5 rounded-xl font-medium"
						>
							Hủy
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="gap-2 text-[13px] h-9.5 px-6 font-semibold whitespace-nowrap shrink-0 rounded-xl shadow-xs"
						>
							<Send className="h-3.5 w-3.5" />
							{isSubmitting ? "Đang đăng..." : "Đăng bài viết"}
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}
