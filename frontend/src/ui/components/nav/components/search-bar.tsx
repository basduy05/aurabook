"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, BookOpen, ArrowRight } from "lucide-react";
import { Loader } from "@/ui/atoms/loader";
import { buildStorefrontPath } from "@/lib/storefront-path";

interface SearchSuggestion {
	id: string;
	name: string;
	slug: string;
	brand?: string | null;
	price: number;
	image: string;
	badge?: string | null;
	category?: { name?: string } | null;
}

export const SearchBar = ({
	locale,
	channel,
	placeholder,
	srOnlyLabel,
}: {
	locale: string;
	channel: string;
	placeholder: string;
	srOnlyLabel: string;
}) => {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [isGraphRAG, setIsGraphRAG] = useState(false);
	const [matchedConcepts, setMatchedConcepts] = useState<string[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Tự động tìm kiếm gợi ý bằng ngôn ngữ tự nhiên / GraphRAG khi gõ
	useEffect(() => {
		const q = searchQuery.trim();
		if (q.length < 2) {
			setSuggestions([]);
			setIsOpen(false);
			setIsLoading(false);
			return;
		}

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

interface SearchApiResponse {
	isGraphRAG?: boolean;
	total?: number;
	matchedConcepts?: string[];
	products?: SearchSuggestion[];
}

		debounceTimerRef.current = setTimeout(async () => {
			setIsLoading(true);
			try {
				const res = await fetch(
					`/api/ai/graphrag/search?query=${encodeURIComponent(q)}&channel=${encodeURIComponent(channel)}&locale=${encodeURIComponent(locale)}`,
				);
				if (res.ok) {
					const data = (await res.json()) as SearchApiResponse;
					setSuggestions((data.products || []).slice(0, 4));
					setIsGraphRAG(!!data.isGraphRAG);
					setMatchedConcepts(data.matchedConcepts || []);
					setIsOpen((data.products || []).length > 0);
				}
			} catch (e) {
				console.warn("[SearchBar] Lỗi tìm kiếm gợi ý:", e);
			} finally {
				setIsLoading(false);
			}
		}, 260);

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [searchQuery, channel, locale]);

	// Đóng dropdown khi click ra ngoài
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const q = searchQuery.trim();
		if (q.length > 0) {
			setIsOpen(false);
			router.push(`${buildStorefrontPath(locale, channel, "/search")}?query=${encodeURIComponent(q)}`);
		}
	};

	const handleSelectBook = (slug: string) => {
		setIsOpen(false);
		router.push(buildStorefrontPath(locale, channel, `/products/${slug}`));
	};

	const displayPlaceholder =
		placeholder || "Tìm sách, tác giả hoặc theo ngữ cảnh AI (vd: sách giao tiếp, thói quen tốt)...";

	return (
		<div ref={containerRef} className="group relative w-full max-w-md">
			<form onSubmit={handleSubmit} className="relative block">
				<span className="sr-only">{srOnlyLabel}</span>
				{/* Search icon */}
				<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
					<SearchIcon
						className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground"
						aria-hidden
					/>
				</span>

				{/* Input */}
				<input
					type="text"
					name="search"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => {
						if (suggestions.length > 0) setIsOpen(true);
					}}
					placeholder={displayPlaceholder}
					autoComplete="off"
					className="hover:bg-secondary/80 focus:outline-hidden h-10 w-full rounded-lg border border-transparent bg-secondary py-2 pl-10 pr-12 text-sm text-foreground transition-all placeholder:text-muted-foreground hover:border-border focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring"
				/>

				{/* AI & Loading indicator */}
				<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
					{isLoading ? (
						<Loader size={16} />
					) : (
						<span
							className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20"
							title="Tìm kiếm thông minh hỗ trợ ngôn ngữ tự nhiên GraphRAG"
						>
							AI
						</span>
					)}
				</div>
			</form>

			{/* POPUP GỢI Ý NGỮ NGHĨA GRAPHRAG THỜI GIAN THỰC */}
			{isOpen && suggestions.length > 0 && (
				<div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card p-2 text-card-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
					{/* Header thông báo chế độ tìm kiếm */}
					<div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium border-b border-border/60 text-muted-foreground">
						<span className="flex items-center gap-1.5">
							{isGraphRAG ? (
								<span className="font-semibold text-primary">Gợi ý theo ngữ cảnh GraphRAG</span>
							) : (
								<>
									<BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
									<span>Ấn phẩm phù hợp trong kho</span>
								</>
							)}
						</span>
						<span className="text-[10px] text-muted-foreground/80">Nhấn Enter để xem toàn bộ</span>
					</div>

					{/* Tag từ khóa ngữ nghĩa nhận diện được */}
					{matchedConcepts.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 border-b border-border/40">
							<span className="text-[10px] font-semibold text-muted-foreground">Chủ đề:</span>
							{matchedConcepts.slice(0, 4).map((concept) => (
								<span
									key={concept}
									className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/20"
								>
									#{concept}
								</span>
							))}
						</div>
					)}

					{/* Danh sách các cuốn sách gợi ý - Tắt bỏ hoàn toàn thanh scroll */}
					<div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto pt-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						{suggestions.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => handleSelectBook(item.slug)}
								className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-secondary/70 transition-colors group/item"
							>
								<div className="relative h-12 w-9 shrink-0 overflow-hidden rounded border border-border bg-secondary shadow-2xs">
									<img
										src={item.image || "/products/book-dac-nhan-tam-cover.jpg"}
										alt={item.name}
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<h4 className="text-xs font-semibold text-foreground truncate group-hover/item:text-primary transition-colors">
										{item.name}
									</h4>
									<p className="text-[11px] text-muted-foreground truncate">{item.brand || "AuraBook"}</p>
									<div className="flex items-center gap-2 mt-0.5">
										<span className="text-xs font-bold text-foreground">
											{new Intl.NumberFormat("vi-VN").format(item.price)}₫
										</span>
										{item.category?.name && (
											<span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded border border-border/50 truncate max-w-[120px]">
												{item.category.name}
											</span>
										)}
									</div>
								</div>
								<ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:text-primary transition-all shrink-0" />
							</button>
						))}
					</div>

					{/* Footer xem toàn bộ kết quả */}
					<div className="mt-1 pt-1.5 border-t border-border/60 px-1">
						<button
							type="button"
							onClick={handleSubmit}
							className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
						>
							<span>Xem toàn bộ kết quả cho "{searchQuery}"</span>
							<ArrowRight className="h-3 w-3" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
