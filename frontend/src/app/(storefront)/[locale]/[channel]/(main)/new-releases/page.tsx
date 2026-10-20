import { Suspense } from "react";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { OrderDirection, ProductOrderField } from "@/gql/graphql";
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
		title: isVi ? "Sách Mới Phát Hành | AuraBook" : "New Releases | AuraBook",
		description: isVi
			? "Cập nhật những cuốn sách mới xuất bản, những ấn phẩm mới nhất vừa cập bến nhà sách AuraBook."
			: "Discover newly published books and latest releases at AuraBook.",
		locale: params.locale,
		channel: params.channel,
		pathSuffix: "/new-releases",
	});
}

type PageProps = {
	params: Promise<{ locale: string; channel: string }>;
};

export default async function NewReleasesPage(props: PageProps) {
	const params = await props.params;
	const isVi = params.locale === "vi";

	const breadcrumbs = [
		{ label: isVi ? "Trang chủ" : "Home", href: buildStorefrontPath(params.locale, params.channel) },
		{
			label: isVi ? "Sách mới phát hành" : "New Releases",
			href: buildStorefrontPath(params.locale, params.channel, "/new-releases"),
		},
	];

	return (
		<>
			<CategoryHero
				title={isVi ? "Sách Mới Phát Hành" : "New Releases"}
				description={
					isVi
						? "Chào đón những ấn phẩm mới nhất vừa cập bến kệ sách AuraBook — nơi khơi nguồn cảm hứng và mở ra những chân trời tư duy mới lạ."
						: "Explore the latest book arrivals fresh off the press, curated to ignite curiosity and creative thought."
				}
				breadcrumbs={breadcrumbs}
				breadcrumbAriaLabel={isVi ? "Đường dẫn" : "Breadcrumbs"}
			/>
			<Suspense fallback={<ProductsGridSkeleton />}>
				<NewReleasesContent params={props.params} />
			</Suspense>
		</>
	);
}

async function NewReleasesContent({
	params: paramsPromise,
}: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const params = await paramsPromise;
	let products = await getProductListingPage(params.channel, params.locale, {
		field: ProductOrderField.Date,
		direction: OrderDirection.Desc,
	});

	if (!products) {
		products = await getProductListingPage(params.channel, params.locale, undefined);
	}

	if (!products) {
		notFound();
	}

	const productCards = products.edges.map((e) => toProductCardData(e.node, params.locale, params.channel));

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
