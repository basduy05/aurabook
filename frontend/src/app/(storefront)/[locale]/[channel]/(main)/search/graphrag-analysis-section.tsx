"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { BookRecommendationDetail } from "@/lib/graphrag/graph-store";

interface GraphRAGAnalysisSectionProps {
	query: string;
	totalCount: number;
	matchedConcepts: string[];
	queryInterpretation: string;
	reasoningSummary: string;
	recommendations: BookRecommendationDetail[];
	supplementaryRecommendations?: BookRecommendationDetail[];
	hasDirectMatch?: boolean;
}

interface ItemFeedbackState {
	action: "like" | "dislike" | null;
	likesCount: number;
	dislikesCount: number;
	isSubmitting?: boolean;
}

export function GraphRAGAnalysisSection({
	query,
	totalCount: _totalCount,
	matchedConcepts: _matchedConcepts,
	queryInterpretation: _queryInterpretation,
	reasoningSummary: _reasoningSummary,
	recommendations,
	supplementaryRecommendations = [],
	hasDirectMatch: _hasDirectMatch = true,
}: GraphRAGAnalysisSectionProps) {
	// 1. Tác phẩm tương đồng nhất (Luôn luôn cố định ở Cột 1)
	const bestMatchBook = recommendations[0] || supplementaryRecommendations[0] || null;

	// 2. Danh sách các tác phẩm tham khảo: TUYỆT ĐỐI LOẠI BỎ TÁC PHẨM ĐANG CỐ ĐỊNH Ở CỘT 1
	const referenceBooks = useMemo(() => {
		if (!bestMatchBook) return [];

		const list: BookRecommendationDetail[] = [];
		const seenSlugs = new Set<string>([bestMatchBook.slug]);
		if (bestMatchBook.id) seenSlugs.add(bestMatchBook.id);

		// Thêm các tác phẩm còn lại trong recommendations
		for (let i = 1; i < recommendations.length; i++) {
			const b = recommendations[i];
			if (b.slug !== bestMatchBook.slug && b.id !== bestMatchBook.id && !seenSlugs.has(b.slug)) {
				seenSlugs.add(b.slug);
				list.push(b);
			}
		}

		// Thêm toàn bộ các tác phẩm trong supplementaryRecommendations (loại bỏ hoàn toàn tác phẩm cố định)
		for (const b of supplementaryRecommendations) {
			if (b.slug !== bestMatchBook.slug && b.id !== bestMatchBook.id && !seenSlugs.has(b.slug)) {
				seenSlugs.add(b.slug);
				list.push(b);
			}
		}

		return list;
	}, [recommendations, supplementaryRecommendations, bestMatchBook]);

	// Quản lý phản hồi Like/Dislike cho từng cuốn sách
	const [feedbackMap, setFeedbackMap] = useState<Record<string, ItemFeedbackState>>(() => {
		const initial: Record<string, ItemFeedbackState> = {};
		const all = [bestMatchBook, ...referenceBooks].filter(Boolean) as BookRecommendationDetail[];
		for (const item of all) {
			initial[item.slug] = {
				action: null,
				likesCount: item.likesCount || 0,
				dislikesCount: item.dislikesCount || 0,
			};
		}
		return initial;
	});

	// Phân trang cho các tác phẩm tham khảo (Mỗi lần hiển thị đúng 2 tác phẩm tham khảo kết hợp với 1 tác phẩm cố định thành đúng 3 cột)
	const REF_PAGE_SIZE = 2;
	const totalRefBooks = referenceBooks.length;
	const totalPages = Math.max(1, Math.ceil(totalRefBooks / REF_PAGE_SIZE));
	const [currentPage, setCurrentPage] = useState(0);
	const [isFading, setIsFading] = useState(false);

	// Ref lưu trạng thái để sự kiện lăn chuột luôn nhận giá trị mới nhất mà không gây re-attach
	const booksContainerRef = useRef<HTMLDivElement>(null);
	const currentPageRef = useRef(currentPage);
	currentPageRef.current = currentPage;
	const totalPagesRef = useRef(totalPages);
	totalPagesRef.current = totalPages;
	const wheelLockRef = useRef(false);

	// Lấy chính xác 2 tác phẩm tham khảo hiển thị cho trang hiện tại (không bao giờ trùng với tác phẩm cố định)
	const visibleReferenceBooks = useMemo(() => {
		if (totalRefBooks <= REF_PAGE_SIZE) {
			return referenceBooks;
		}
		const startIdx = currentPage * REF_PAGE_SIZE;
		if (startIdx + REF_PAGE_SIZE <= totalRefBooks) {
			return referenceBooks.slice(startIdx, startIdx + REF_PAGE_SIZE);
		}
		// Đảm bảo luôn luôn hiển thị đủ 2 tác phẩm tham khảo ở các cột bên phải
		return referenceBooks.slice(Math.max(0, totalRefBooks - REF_PAGE_SIZE), totalRefBooks);
	}, [referenceBooks, currentPage, totalRefBooks]);

	// Chuyển trang mượt mà với fade nhẹ nhàng, cập nhật ngay lập tức ref để chống race-condition
	const changePageWithFade = (newPage: number) => {
		currentPageRef.current = newPage;
		setIsFading(true);
		setTimeout(() => {
			setCurrentPage(newPage);
			setIsFading(false);
		}, 120);
	};

	const handleNext = () => {
		const next = (currentPageRef.current + 1) % totalPages;
		changePageWithFade(next);
	};

	const handlePrev = () => {
		const prev = (currentPageRef.current - 1 + totalPages) % totalPages;
		changePageWithFade(prev);
	};

	// XỬ LÝ LĂN CHUỘT: CỐ ĐỊNH HOÀN TOÀN VỊ TRÍ ("TREO"), KHÔNG XÊ DỊCH, CHUYỂN QUA LẠI CÁC TÁC PHẨM
	useEffect(() => {
		const el = booksContainerRef.current;
		if (!el) return;

		const handleWheel = (e: WheelEvent) => {
			if (totalPagesRef.current <= 1) return;

			// Tính độ lệch cuộn (hỗ trợ cả con lăn dọc deltaY và vuốt ngang deltaX trên trackpad)
			const isVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
			const delta = isVertical ? e.deltaY : e.deltaX;

			// Bỏ qua chuyển động rung chuột quá nhỏ
			if (Math.abs(delta) < 16) return;

			// LUÔN LUÔN CHẶN CUỘN TRANG MẶC ĐỊNH KHI RÊ CHUỘT TRÊN KHUNG HIỂN THỊ
			// Giúp toàn bộ khung sách luôn được "treo" cố định 100% tại chỗ, không bao giờ bị xê dịch hay nhảy màn hình
			e.preventDefault();

			if (wheelLockRef.current) return;

			if (delta > 0) {
				// Lăn chuột xuống / vuốt sang phải: chuyển tiếp trang (vòng lặp mượt mà)
				wheelLockRef.current = true;
				const next = (currentPageRef.current + 1) % totalPagesRef.current;
				changePageWithFade(next);

				setTimeout(() => {
					wheelLockRef.current = false;
				}, 320);
			} else if (delta < 0) {
				// Lăn chuột lên / vuốt sang trái: quay lại trang trước (vòng lặp mượt mà)
				wheelLockRef.current = true;
				const prev = (currentPageRef.current - 1 + totalPagesRef.current) % totalPagesRef.current;
				changePageWithFade(prev);

				setTimeout(() => {
					wheelLockRef.current = false;
				}, 320);
			}
		};

		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", handleWheel);
		};
	}, []);

	// Gửi phản hồi Like / Dislike (RLHF)
	const handleFeedback = async (bookSlug: string, action: "like" | "dislike") => {
		const current = feedbackMap[bookSlug] || {
			action: null,
			likesCount: 0,
			dislikesCount: 0,
		};

		if (current.isSubmitting || current.action === action) return;

		const previousAction = current.action;
		let newLikes = current.likesCount;
		let newDislikes = current.dislikesCount;

		if (action === "like") {
			newLikes += 1;
			if (previousAction === "dislike") newDislikes = Math.max(0, newDislikes - 1);
		} else {
			newDislikes += 1;
			if (previousAction === "like") newLikes = Math.max(0, newLikes - 1);
		}

		setFeedbackMap((prev) => ({
			...prev,
			[bookSlug]: {
				action,
				likesCount: newLikes,
				dislikesCount: newDislikes,
				isSubmitting: true,
			},
		}));

		try {
			const res = await fetch("/api/ai/graphrag/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query,
					bookSlug,
					action,
				}),
			});

			if (res.ok) {
				const data = (await res.json()) as any;
				setFeedbackMap((prev) => ({
					...prev,
					[bookSlug]: {
						action,
						likesCount: typeof data.likesCount === "number" ? data.likesCount : newLikes,
						dislikesCount: typeof data.dislikesCount === "number" ? data.dislikesCount : newDislikes,
						isSubmitting: false,
					},
				}));
			} else {
				setFeedbackMap((prev) => ({
					...prev,
					[bookSlug]: {
						...(prev[bookSlug] || current),
						isSubmitting: false,
					},
				}));
			}
		} catch (error) {
			console.error("[GraphRAG Feedback Error]:", error);
			setFeedbackMap((prev) => ({
				...prev,
				[bookSlug]: {
					...(prev[bookSlug] || current),
					isSubmitting: false,
				},
			}));
		}
	};

	// RENDER THẺ SÁCH: HIỂN THỊ TRỌN VẸN 100% LÝ DO & ĐIỂM SÁNG, KHÔNG CẮT CHỮ
	const renderBookCard = (item: BookRecommendationDetail, isFixedPrimary = false) => {
		const fb = feedbackMap[item.slug] || {
			action: null,
			likesCount: item.likesCount || 0,
			dislikesCount: item.dislikesCount || 0,
		};

		return (
			<div
				key={isFixedPrimary ? `primary-book-${item.slug || item.id}` : `ref-book-${item.slug || item.id}`}
				className={`flex flex-col justify-between rounded-xl border p-5 transition-colors bg-card h-full ${
					isFixedPrimary
						? "border-foreground/30 shadow-xs"
						: "border-border hover:border-foreground/20 shadow-2xs"
				}`}
			>
				<div className="space-y-4">
					{/* Header thẻ: Huy hiệu phân loại & Điểm tương đồng % */}
					<div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
						<span
							className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-tight uppercase ${
								isFixedPrimary
									? "bg-foreground text-background"
									: "bg-secondary text-foreground border border-border"
							}`}
						>
							{isFixedPrimary ? "Tác phẩm tương đồng nhất" : "Tác phẩm tham khảo"}
						</span>
						<span className="text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
							{item.similarityScore > 1 ? Math.round(item.similarityScore) : Math.round(item.similarityScore * 100)}%
						</span>
					</div>

					{/* Thông tin sách: Ảnh bìa + Tiêu đề + Tác giả + Giá */}
					<div className="flex items-start gap-3.5">
						{item.coverImage ? (
							<div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted shadow-2xs">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={item.coverImage}
									alt={item.title}
									className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
								/>
							</div>
						) : (
							<div className="flex h-24 w-18 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/60 text-muted-foreground text-xs font-semibold">
								Sách
							</div>
						)}
						<div className="min-w-0 flex-1 space-y-1">
							<Link
								href={item.href}
								className="block font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2 hover:underline hover:text-primary transition-colors"
								title={item.title}
							>
								{item.title}
							</Link>
							<p className="text-xs text-muted-foreground line-clamp-1">{item.author || "Nhiều tác giả"}</p>
							{item.price ? (
								<p className="text-sm font-bold text-foreground pt-0.5">
									{typeof item.price === "number" ? `${item.price.toLocaleString("vi-VN")}đ` : item.price}
								</p>
							) : (
								<p className="text-xs text-muted-foreground pt-0.5">Giá cập nhật</p>
							)}
						</div>
					</div>

					{/* Lý do tương đồng: Hiển thị 100% nội dung */}
					<div className="rounded-lg bg-secondary/40 p-3.5 border border-border/50 text-left">
						<span className="text-xs font-bold text-foreground block mb-1 uppercase tracking-wider">
							{isFixedPrimary ? "Lý do tương đồng nhất:" : "Lý do đồng tham khảo:"}
						</span>
						<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{item.recommendationReason}
						</p>
					</div>

					{/* Điểm sáng tri thức: Hiển thị 100% nội dung */}
					{item.coreInsight && (
						<div className="rounded-lg bg-secondary/20 p-3.5 border border-border/40 text-left">
							<span className="text-xs font-bold text-foreground block mb-1 uppercase tracking-wider">
								Điểm sáng:
							</span>
							<p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
								{item.coreInsight}
							</p>
						</div>
					)}
				</div>

				{/* Footer của Card: Feedback Like/Dislike & Link khám phá */}
				<div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => handleFeedback(item.slug, "like")}
							disabled={fb.isSubmitting}
							className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
								fb.action === "like"
									? "bg-foreground text-background border-foreground shadow-2xs"
									: "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-secondary/80 hover:border-foreground/30"
							}`}
							title="Rất phù hợp (AI được cộng điểm)"
						>
							<span>Hữu ích</span>
							{fb.likesCount > 0 && <span className="ml-1 opacity-80">({fb.likesCount})</span>}
						</button>

						<button
							type="button"
							onClick={() => handleFeedback(item.slug, "dislike")}
							disabled={fb.isSubmitting}
							className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
								fb.action === "dislike"
									? "bg-foreground text-background border-foreground shadow-2xs"
									: "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-secondary/80 hover:border-foreground/30"
							}`}
							title="Chưa phù hợp (AI bị trừ điểm)"
						>
							<span>Chưa đúng</span>
							{fb.dislikesCount > 0 && <span className="ml-1 opacity-80">({fb.dislikesCount})</span>}
						</button>
					</div>

					<Link
						href={item.href}
						className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
					>
						<span>Khám phá sách</span>
						<ArrowRight className="h-3.5 w-3.5 shrink-0" />
					</Link>
				</div>
			</div>
		);
	};

	return (
		<div
			ref={booksContainerRef}
			id="graphrag-books-showcase"
			className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs select-none mb-8"
		>
			{/* THANH ĐIỀU HƯỚNG TRÊN CÙNG CỦA CÁC THẺ SÁCH */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-3 border-b border-border/50 mb-5">
				{/* TRÊN CỘT 1: ĐỀ XUẤT TRỌNG TÂM */}
				<div className="flex items-center gap-2">
					<span className="text-sm sm:text-base font-bold text-foreground tracking-tight">
						Đề xuất trọng tâm
					</span>
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
						Khớp cao nhất
					</span>
				</div>

				{/* TRÊN CỘT 2 VÀ CỘT 3: SÁCH THAM KHẢO VÀ NÚT CHUYỂN QUA LẠI */}
				<div className="md:col-span-2 flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-sm sm:text-base font-bold text-foreground tracking-tight">
							Sách tham khảo liên quan
						</span>
						<span className="text-xs text-muted-foreground font-normal">
							({totalRefBooks} tác phẩm)
						</span>
						{totalPages > 1 && (
							<span className="hidden lg:inline-flex items-center text-[11px] text-muted-foreground/80 font-normal">
								• Lăn chuột để chuyển qua lại các tác phẩm
							</span>
						)}
					</div>

					{/* NÚT CHUYỂN QUA LẠI NẰM NGAY TRÊN CỘT SÁCH THAM KHẢO */}
					{totalPages > 1 && (
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={handlePrev}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shadow-2xs"
								title="Xem tác phẩm tham khảo trước"
								aria-label="Tác phẩm trước"
							>
								<ChevronLeft className="h-4 w-4 shrink-0" />
							</button>

							<span className="px-2.5 py-1 rounded-md bg-secondary text-xs sm:text-sm font-bold text-foreground border border-border select-none min-w-[50px] text-center">
								{currentPage + 1} / {totalPages}
							</span>

							<button
								type="button"
								onClick={handleNext}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shadow-2xs"
								title="Xem tác phẩm tham khảo tiếp theo"
								aria-label="Tác phẩm tiếp theo"
							>
								<ChevronRight className="h-4 w-4 shrink-0" />
							</button>
						</div>
					)}
				</div>
			</div>

			{/* LƯỚI CARD 1 HÀNG 3 CỘT: CỘT 1 CỐ ĐỊNH, CỘT 2 VÀ 3 THAM KHẢO */}
			{bestMatchBook && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
					{/* CỘT 1: TÁC PHẨM TƯƠNG ĐỒNG NHẤT */}
					{renderBookCard(bestMatchBook, true)}

					{/* CỘT 2 VÀ CỘT 3: CÁC TÁC PHẨM THAM KHẢO */}
					<div
						className={`contents transition-opacity duration-200 ${
							isFading ? "opacity-30" : "opacity-100"
						}`}
					>
						{visibleReferenceBooks.map((refBook) => renderBookCard(refBook, false))}
					</div>
				</div>
			)}
		</div>
	);
}
