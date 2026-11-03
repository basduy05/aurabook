import { NextResponse } from "next/server";

interface CatalogBook {
	id: string;
	title: string;
	slug: string;
	price: string;
	author: string;
	thumbnail: string;
	rating: number;
	category?: string;
}

const AUTHOR_MAP: Record<string, string> = {
	"dac-nhan-tam": "Dale Carnegie",
	"bon-thoa-uoc": "Don Miguel Ruiz",
	"sapiens-luoc-su-loai-nguoi": "Yuval Noah Harari",
	"tri-tue-do-thai": "Eran Katz",
	"10-dieu-tao-nen-so-phan": "David Simon, M.D",
	"bi-mat-cua-mot-tri-nho-sieu-pham": "Eran Katz",
	"cach-nghi-de-thanh-cong": "Napoleon Hill",
	"cay-cam-ngot-cua-toi": "José Mauro de Vasconcelos",
	"chien-tranh-tien-te-tap-1": "Song Hongbing",
	"chien-tranh-tien-te-tap-2": "Song Hongbing",
	"chien-tranh-tien-te-tap-3": "Song Hongbing",
	"chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than": "William B. Irvine",
	"tu-duy-nhanh-va-cham": "Daniel Kahneman",
};

const FALLBACK_BOOKS: CatalogBook[] = [
	{
		id: "prod-1",
		title: "Đắc Nhân Tâm",
		slug: "dac-nhan-tam",
		price: "59.000 ₫",
		author: "Dale Carnegie",
		thumbnail: "http://localhost:8000/media/thumbnails/products/book-dac-nhan-tam-cover_thumbnail_256.jpg",
		rating: 4.9,
		category: "Nghệ Thuật Giao Tiếp & Ứng Xử",
	},
	{
		id: "prod-2",
		title: "Bốn Thỏa Ước",
		slug: "bon-thoa-uoc",
		price: "49.000 ₫",
		author: "Don Miguel Ruiz",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE0Mg==/256/",
		rating: 4.9,
		category: "Minh Triết Sống & Khai Phóng",
	},
	{
		id: "prod-3",
		title: "Sapiens: Lược Sử Loài Người",
		slug: "sapiens-luoc-su-loai-nguoi",
		price: "89.000 ₫",
		author: "Yuval Noah Harari",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE0Mw==/256/",
		rating: 5.0,
		category: "Lược Sử Nhân Loại & Nền Văn Minh",
	},
	{
		id: "prod-4",
		title: "Trí Tuệ Do Thái",
		slug: "tri-tue-do-thai",
		price: "69.000 ₫",
		author: "Eran Katz",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE0NA==/256/",
		rating: 4.8,
		category: "Trí Tuệ Do Thái & Danh Nhân",
	},
	{
		id: "prod-5",
		title: "10 Điều Tạo Nên Số Phận",
		slug: "10-dieu-tao-nen-so-phan",
		price: "49.000 ₫",
		author: "David Simon, M.D",
		thumbnail: "http://localhost:8000/media/thumbnails/products/book-10-dieu-tao-nen-so-phan-cover_thumbnail_256.jpeg",
		rating: 4.7,
		category: "Quản Trị Tâm Trí & Thói Quen",
	},
	{
		id: "prod-6",
		title: "Bí Mật Của Một Trí Nhớ Siêu Phàm",
		slug: "bi-mat-cua-mot-tri-nho-sieu-pham",
		price: "59.000 ₫",
		author: "Eran Katz",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE0Ng==/256/",
		rating: 4.8,
		category: "Trí Tuệ Do Thái & Danh Nhân",
	},
	{
		id: "prod-7",
		title: "Cách Nghĩ Để Thành Công",
		slug: "cach-nghi-de-thanh-cong",
		price: "59.000 ₫",
		author: "Napoleon Hill",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE0Nw==/256/",
		rating: 4.9,
		category: "Quản Trị Tâm Trí & Thói Quen",
	},
	{
		id: "prod-8",
		title: "Cây Cam Ngọt Của Tôi",
		slug: "cay-cam-ngot-cua-toi",
		price: "55.000 ₫",
		author: "José Mauro de Vasconcelos",
		thumbnail: "http://localhost:8000/media/thumbnails/products/book-cay-cam-ngot-cua-toi-cover_thumbnail_256.jpeg",
		rating: 4.9,
		category: "Văn Học Kinh Điển Thế Giới",
	},
	{
		id: "prod-9",
		title: "Chiến Tranh Tiền Tệ - Tập 1: Dòng Chảy Của Tiền Ngầm",
		slug: "chien-tranh-tien-te-tap-1",
		price: "69.000 ₫",
		author: "Song Hongbing",
		thumbnail: "http://localhost:8000/media/thumbnails/products/book-chien-tranh-tien-te-tap-1-cover_thumbnail_256.jpeg",
		rating: 4.9,
		category: "Tài Chính Cá Nhân & Đầu Tư",
	},
	{
		id: "prod-10",
		title: "Chiến Tranh Tiền Tệ - Tập 2: Sự Thống Trị Của Quyền Lực Vàng",
		slug: "chien-tranh-tien-te-tap-2",
		price: "69.000 ₫",
		author: "Song Hongbing",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE1MA==/256/",
		rating: 4.8,
		category: "Tài Chính Cá Nhân & Đầu Tư",
	},
	{
		id: "prod-11",
		title: "Chiến Tranh Tiền Tệ - Tập 3: Rừng Rậm Tài Chính",
		slug: "chien-tranh-tien-te-tap-3",
		price: "69.000 ₫",
		author: "Song Hongbing",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE1MQ==/256/",
		rating: 4.8,
		category: "Tài Chính Cá Nhân & Đầu Tư",
	},
	{
		id: "prod-12",
		title: "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản",
		slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than",
		price: "65.000 ₫",
		author: "William B. Irvine",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE1Mg==/256/",
		rating: 4.9,
		category: "Minh Triết Sống & Khai Phóng",
	},
	{
		id: "prod-13",
		title: "Tư Duy Nhanh Và Chậm",
		slug: "tu-duy-nhanh-va-cham",
		price: "79.000 ₫",
		author: "Daniel Kahneman",
		thumbnail: "http://localhost:8000/thumbnail/UHJvZHVjdE1lZGlhOjE1Mw==/256/",
		rating: 4.9,
		category: "Tư Duy Phản Biện & Nhận Thức",
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
				products(first: 50, channel: "channel-vnd", filter: { search: $search }) {
					edges {
						node {
							id
							name
							slug
							category {
								name
								slug
							}
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
								category?: {
									name?: string;
									slug?: string;
								} | null;
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

			const NON_BOOK_SLUGS = new Set([
				"dry-sunglasses",
				"monokai-dimmed-sunnies",
				"ascii-tee",
				"team-shirt",
				"blue-polygon-shirt",
				"dark-polygon-tee",
				"reversed-monotype-tee",
				"cubes-fountain-tee",
				"darko-polo",
				"blue-plimsolls",
				"balance-trail-720",
				"plimsolls",
				"canvas-sneakers",
				"dash-force",
				"pirates-beanie",
				"tactical-neck-warmer",
				"hoodie",
				"grey-hoodie",
				"t-shirt",
				"carrot-juice",
				"apple-juice",
				"bean-juice",
				"banana-juice",
				"mighty-mug",
				"the-dash-cushion",
				"white-parrot-cusion",
				"gift-card",
				"gift-card-500",
				"gift-card-50",
			]);

			const allEdges = data?.data?.products?.edges || [];
			// All products in channel-vnd that are not excluded non-book items are valid AuraBook books!
			const bookEdges = allEdges.filter(({ node }) => !NON_BOOK_SLUGS.has(node.slug.toLowerCase()));

			if (bookEdges.length > 0) {
				const saleorBooks: CatalogBook[] = bookEdges.map(({ node }) => {
					const amount = node.pricing?.priceRange?.start?.gross?.amount;
					const priceFormatted = amount
						? `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`
						: "69.000 ₫";

					// Format clean book name without parenthesis noise if needed
					const cleanName = node.name.replace(/\s*\([^)]*\)\s*$/, "").trim() || node.name;
					const author = AUTHOR_MAP[node.slug] || "Tác giả AuraBook";

					return {
						id: node.id,
						title: cleanName,
						slug: node.slug,
						price: priceFormatted,
						author,
						thumbnail:
							node.thumbnail?.url ||
							"http://localhost:8000/media/thumbnails/products/book-dac-nhan-tam-cover_thumbnail_256.jpg",
						rating: 4.9,
						category: node.category?.name || "Sách AuraBook",
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
					b.slug.includes(query) ||
					(b.category && b.category.toLowerCase().includes(query)),
			)
		: FALLBACK_BOOKS;

	return NextResponse.json({ books: filtered });
}
