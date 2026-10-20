import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { searchProducts, parseSearchSortParam } from "@/lib/search";
import { SearchCommerceEvent } from "@/ui/components/search-commerce-event";
import { SearchResults } from "@/ui/components/search-results";
import { Pagination } from "@/ui/components/pagination";
import { ProductsGridSkeleton } from "@/ui/components/plp";
import { SearchSort } from "./search-sort";
import { SearchIcon } from "lucide-react";
import { buttonClassName } from "@/ui/components/ui/button";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { graphRAGStore, type BookRecommendationDetail } from "@/lib/graphrag/graph-store";
import { GraphRAGAnalysisSection } from "./graphrag-analysis-section";

// Prefetch: default (auto). Search is reached via form submit, not `prefetch={true}` links.

/**
 * Search results are query-dependent and thin — keep them out of the index.
 * Title falls back to the brand template (`%s | Saleor Store`).
 */
export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const t = await getTranslations({ locale: params.locale, namespace: "search" });

	return {
		title: t("title"),
		description: t("description"),
		robots: { index: false, follow: true },
	};
}

type SearchParams = {
	query?: string | string[];
	cursor?: string | string[];
	direction?: string | string[];
	sort?: string | string[];
};

/**
 * Search page with Cache Components.
 * Static shell renders immediately, search results stream in.
 */
export default function Page(props: {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: string; channel: string }>;
}) {
	return (
		<section className="container-content py-8">
			<Suspense fallback={<SearchSkeleton />}>
				<SearchContent searchParams={props.searchParams} params={props.params} />
			</Suspense>
		</section>
	);
}

/**
 * Dynamic search content - reads searchParams at request time.
 */
async function SearchContent({
	searchParams: searchParamsPromise,
	params: paramsPromise,
}: {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: string; channel: string }>;
}) {
	const [searchParams, params] = await Promise.all([searchParamsPromise, paramsPromise]);
	const t = await getTranslations({ locale: params.locale, namespace: "search" });

	// Extract and validate query
	const queryParam = searchParams.query;
	if (!queryParam) {
		notFound();
	}

	// Handle array values (redirect to first valid)
	const query = Array.isArray(queryParam) ? queryParam.find((v) => v.length > 0) : queryParam;

	if (!query) {
		notFound();
	}

	if (Array.isArray(queryParam)) {
		redirect(
			`${buildStorefrontPath(params.locale, params.channel, "/search")}?query=${encodeURIComponent(query)}`,
		);
	}

	// Parse pagination
	const cursor = Array.isArray(searchParams.cursor) ? searchParams.cursor[0] : searchParams.cursor;
	const direction = searchParams.direction === "backward" ? "backward" : "forward";

	// Parse sort
	const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
	const sortBy = parseSearchSortParam(sortParam);

	// 1. Tìm kiếm bình thường bằng Saleor GraphQL
	const result = await searchProducts({
		query,
		channel: params.channel,
		locale: params.locale,
		limit: 20,
		cursor,
		direction,
		sortBy,
	});

	let { products, pagination } = result;
	let isGraphRAGResult = false;
	let graphRAGInfo: {
		reasoningSummary: string;
		matchedConcepts: string[];
		queryInterpretation: string;
		recommendations: BookRecommendationDetail[];
		supplementaryRecommendations?: BookRecommendationDetail[];
		hasDirectMatch?: boolean;
	} | null = null;

	// 2. NẾU KHÔNG TÌM THẤY KẾT QUẢ THƯỜNG -> CHUYỂN NGAY LẬP TỨC SANG GRAPHRAG THEO NGỮ CẢNH
	if (pagination.totalCount === 0 || products.length === 0) {
		const ragResult = graphRAGStore.searchProductsByContext(query, {
			channel: params.channel,
			locale: params.locale,
		});

		if (ragResult.products.length > 0) {
			products = ragResult.products;
			pagination = { totalCount: ragResult.totalCount };
			isGraphRAGResult = true;
			graphRAGInfo = {
				reasoningSummary: ragResult.reasoningSummary,
				matchedConcepts: ragResult.matchedConcepts,
				queryInterpretation: ragResult.queryInterpretation,
				recommendations: ragResult.recommendations,
				supplementaryRecommendations: ragResult.supplementaryRecommendations,
				hasDirectMatch: ragResult.hasDirectMatch,
			};
		}
	}

	const isFirstPage = !cursor;

	if (pagination.totalCount === 0) {
		return (
			<>
				{isFirstPage && <SearchCommerceEvent channel={params.channel} zero />}
				<EmptyState
					title={t("noResultsTitle", { query })}
					body={t("noResultsBody")}
					browseAllProducts={t("browseAllProducts")}
					goToHomepage={t("goToHomepage")}
				/>
			</>
		);
	}

	return (
		<div>
			{isFirstPage && <SearchCommerceEvent channel={params.channel} zero={false} />}
			{/* Header with count and sort */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0 flex-1">
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
						{isGraphRAGResult
							? graphRAGInfo?.hasDirectMatch === false
								? `Chưa có sách về "${query}" - Gợi ý khám phá:`
								: `Kết quả tìm kiếm ngữ cảnh: "${query}"`
							: t("resultsFor", { query })}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{isGraphRAGResult
							? graphRAGInfo?.hasDirectMatch === false
								? `Kho sách hiện chưa có ấn phẩm chuyên đề này. Dưới đây là các đầu sách nổi bật hiện có trong kho:`
								: `Tìm thấy ${pagination.totalCount} ấn phẩm tri thức phù hợp theo ngữ cảnh tự do qua GraphRAG AI`
							: t("resultCount", { count: pagination.totalCount })}
					</p>
				</div>
				<SearchSort />
			</div>

			{/* KẾT QUẢ TÌM KIẾM NGỮ CẢNH GRAPHRAG */}
			{isGraphRAGResult && graphRAGInfo ? (
				<GraphRAGAnalysisSection
					query={query}
					totalCount={pagination.totalCount}
					matchedConcepts={graphRAGInfo.matchedConcepts}
					queryInterpretation={graphRAGInfo.queryInterpretation}
					reasoningSummary={graphRAGInfo.reasoningSummary}
					recommendations={graphRAGInfo.recommendations}
					supplementaryRecommendations={graphRAGInfo.supplementaryRecommendations}
					hasDirectMatch={graphRAGInfo.hasDirectMatch}
				/>
			) : (
				<>
					{/* Results grid thông thường cho các từ khóa tìm kiếm */}
					<section id="search-results-grid" className="scroll-mt-24 pt-6 mt-4 border-t border-border/60 transition-all">
						<div className="mb-6">
							<h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
								Kho ấn phẩm ({pagination.totalCount})
							</h2>
							<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
								{t("resultsFor", { query })}
							</p>
						</div>
						<SearchResults products={products} />
					</section>

					{/* Pagination */}
					{(pagination.hasNextPage || pagination.hasPreviousPage) && (
						<Pagination
							pageInfo={{
								hasNextPage: pagination.hasNextPage ?? false,
								hasPreviousPage: pagination.hasPreviousPage ?? false,
								startCursor: pagination.prevCursor,
								endCursor: pagination.nextCursor,
							}}
						/>
					)}
				</>
			)}
		</div>
	);
}

/**
 * Search skeleton with delayed visibility.
 * Matches SearchResults/SearchResultCard dimensions to prevent layout shift.
 */
function SearchSkeleton() {
	return (
		<div className="animate-skeleton-delayed opacity-0">
			<div className="mb-8">
				<div className="h-8 w-64 animate-pulse rounded bg-muted" />
				<div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
			</div>
			<ProductsGridSkeleton className="mx-0 max-w-none px-0 py-0" desktopColumns={3} itemCount={6} />
		</div>
	);
}

function EmptyState({
	title,
	body,
	browseAllProducts,
	goToHomepage,
}: {
	title: string;
	body: string;
	browseAllProducts: string;
	goToHomepage: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<SearchIcon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h1 className="text-balance text-h1">{title}</h1>
			<p className="mt-2 max-w-md text-muted-foreground">{body}</p>
			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<LinkWithChannel
					href="/products"
					className={buttonClassName({ asLink: true, className: "rounded-lg px-6 py-3" })}
				>
					{browseAllProducts}
				</LinkWithChannel>
				<LinkWithChannel
					href="/"
					className={buttonClassName({
						asLink: true,
						variant: "outline-solid",
						className: "rounded-lg px-6 py-3 hover:bg-muted",
					})}
				>
					{goToHomepage}
				</LinkWithChannel>
			</div>
		</div>
	);
}
