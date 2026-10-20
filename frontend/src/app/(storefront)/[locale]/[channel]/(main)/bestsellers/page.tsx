import { Suspense } from "react";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { buildBrowsePageMetadata } from "@/lib/seo";
import { getProductListingPage } from "@/lib/catalog/get-product-listing";
import { CategoryHero, PlpListingClient, ProductsGridSkeleton, toProductCardData } from "@/ui/components/plp";
import { buildStorefrontPath } from "@/lib/storefront-path";

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const isVi = params.locale === "vi";

	return buildBrowsePageMetadata({
		title: isVi ? "Sách Bán Chạy Nhất | AuraBook" : "Bestselling Books | AuraBook",
		description: isVi
			? "Khám phá danh sách những tựa sách bán chạy nhất tại AuraBook. Tuyển chọn các tác phẩm kinh điển, phát triển bản thân, văn học và nghệ thuật được độc giả săn đón."
			: "Explore bestselling books at AuraBook. Handpicked literature, personal growth, and arts acclaimed by readers.",
		locale: params.locale,
		channel: params.channel,
		pathSuffix: "/bestsellers",
	});
}

type PageProps = {
	params: Promise<{ locale: string; channel: string }>;
};

export default async function BestsellersPage(props: PageProps) {
	const params = await props.params;
	const isVi = params.locale === "vi";

	const breadcrumbs = [
		{ label: isVi ? "Trang chủ" : "Home", href: buildStorefrontPath(params.locale, params.channel) },
		{
			label: isVi ? "Sách bán chạy" : "Bestsellers",
			href: buildStorefrontPath(params.locale, params.channel, "/bestsellers"),
		},
	];

	return (
		<>
			<CategoryHero
				title={isVi ? "Sách Bán Chạy Nhất" : "Bestselling Books"}
				description={
					isVi
						? "Tuyển tập những tác phẩm được cộng đồng độc giả đón nhận nồng nhiệt nhất, liên tục dẫn đầu danh sách tìm kiếm và đánh giá cao tại AuraBook."
						: "Curated collection of the most sought-after and beloved titles across our literary ecosystem."
				}
				breadcrumbs={breadcrumbs}
				breadcrumbAriaLabel={isVi ? "Đường dẫn" : "Breadcrumbs"}
			/>
			<Suspense fallback={<ProductsGridSkeleton />}>
				<BestsellersContent params={props.params} />
			</Suspense>
		</>
	);
}

async function BestsellersContent({
	params: paramsPromise,
}: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const params = await paramsPromise;
	const products = await getProductListingPage(params.channel, params.locale, undefined);

	if (!products) {
		notFound();
	}

	const productCards = products.edges.map((e) => toProductCardData(e.node, params.locale, params.channel));

	// Prioritize products marked as bestseller
	productCards.sort((a, b) => {
		const aScore = a.isBestseller ? 2 : a.badge === "Sale" ? 1 : 0;
		const bScore = b.isBestseller ? 2 : b.badge === "Sale" ? 1 : 0;
		return bScore - aScore;
	});

	return (
		<PlpListingClient
			surface="all"
			locale={params.locale}
			channel={params.channel}
			products={productCards}
			pageInfo={products.pageInfo}
			totalCount={products.totalCount ?? productCards.length}
			enableCategoryFilter
		/>
	);
}
