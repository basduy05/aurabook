import { NextResponse } from "next/server";

interface CatalogBook {
	id: string;
	title: string;
	slug: string;
	price: string;
	author: string;
	thumbnail: string;
	rating: number;
}

const FALLBACK_BOOKS: CatalogBook[] = [
	{
		id: "prod-1",
		title: "Đắc Nhân Tâm (Khổ Lớn - Tái Bản)",
		slug: "dac-nhan-tam",
		price: "86.000 ₫",
		author: "Dale Carnegie",
		thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
		rating: 4.9,
	},
	{
		id: "prod-2",
		title: "Nhà Giả Kim (Bìa Mềm)",
		slug: "nha-gia-kim",
		price: "79.000 ₫",
		author: "Paulo Coelho",
		thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80",
		rating: 4.8,
	},
	{
		id: "prod-3",
		title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
		slug: "tuoi-tre-dang-gia-bao-nhieu",
		price: "75.000 ₫",
		author: "Rosie Nguyễn",
		thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80",
		rating: 4.7,
	},
	{
		id: "prod-4",
		title: "Tư Duy Nhanh Và Chậm",
		slug: "tu-duy-nhanh-va-cham",
		price: "189.000 ₫",
		author: "Daniel Kahneman",
		thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80",
		rating: 4.9,
	},
	{
		id: "prod-5",
		title: "Cây Cam Ngọt Của Tôi",
		slug: "cay-cam-ngot-cua-toi",
		price: "98.000 ₫",
		author: "José Mauro de Vasconcelos",
		thumbnail: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&auto=format&fit=crop&q=80",
		rating: 4.9,
	},
	{
		id: "prod-6",
		title: "Hành Trình Về Phương Đông",
		slug: "hanh-trinh-ve-phuong-dong",
		price: "115.000 ₫",
		author: "Baird T. Spalding",
		thumbnail: "https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=300&auto=format&fit=crop&q=80",
		rating: 4.8,
	},
	{
		id: "prod-7",
		title: "Muôn Kiếp Nhân Sinh (Tập 1)",
		slug: "muon-kiep-nhan-sinh",
		price: "148.000 ₫",
		author: "Nguyên Phong",
		thumbnail: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&auto=format&fit=crop&q=80",
		rating: 4.9,
	},
	{
		id: "prod-8",
		title: "Sức Mạnh Của Hiện Tại",
		slug: "suc-manh-cua-hien-tai",
		price: "105.000 ₫",
		author: "Eckhart Tolle",
		thumbnail: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80",
		rating: 4.8,
	},
];

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = (searchParams.get("q") || "").toLowerCase().trim();

	try {
		// Attempt to query real products from Saleor GraphQL backend
		const saleorUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
		const gqlQuery = `
			query SearchBooks($search: String) {
				products(first: 20, channel: "channel-vnd", filter: { search: $search }) {
					edges {
						node {
							id
							name
							slug
							thumbnail(size: 256) {
								url
							}
							pricing {
								priceRange {
									start {
										gross {
											amount
											currency
										}
									}
								}
							}
						}
					}
				}
			}
		`;

		const res = await fetch(saleorUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: gqlQuery,
				variables: { search: query || null },
			}),
			next: { revalidate: 60 },
		});

		if (res.ok) {
			const data = (await res.json()) as {
				data?: {
					products?: {
						edges?: Array<{
							node: {
								id: string;
								name: string;
								slug: string;
								pricing?: {
									priceRange?: {
										start?: {
											gross?: {
												amount: number;
											};
										};
									};
								};
								thumbnail?: {
									url: string;
								};
							};
						}>;
					};
				};
			};
			const edges = data?.data?.products?.edges || [];
			if (edges.length > 0) {
				const saleorBooks: CatalogBook[] = edges.map(({ node }) => {
					const amount = node.pricing?.priceRange?.start?.gross?.amount;
					const priceFormatted = amount
						? `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`
						: "120.000 ₫";

					return {
						id: node.id,
						title: node.name,
						slug: node.slug,
						price: priceFormatted,
						author: "Tác giả AuraBook",
						thumbnail:
							node.thumbnail?.url ||
							"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
						rating: 4.8,
					};
				});

				return NextResponse.json({ books: saleorBooks });
			}
		}
	} catch (e) {
		console.warn("[api/community/books] Could not fetch from Saleor, using fallback catalog:", e);
	}

	// Filter fallback books if query exists
	const filtered = query
		? FALLBACK_BOOKS.filter(
				(b) =>
					b.title.toLowerCase().includes(query) ||
					b.author.toLowerCase().includes(query) ||
					b.slug.includes(query),
			)
		: FALLBACK_BOOKS;

	return NextResponse.json({ books: filtered });
}
