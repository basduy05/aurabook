import { NextResponse } from "next/server";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";
import { getCommunityUsers, getCommunityUserById } from "@/lib/community/storage";

export interface BookshelfItem {
	id: string;
	productId: string;
	productSlug: string;
	title: string;
	author?: string;
	categoryName: string;
	format: "EBOOK" | "AUDIOBOOK" | "DIGITAL_DRM";
	thumbnail: string;
	orderNumber: string;
	purchasedAt: string;
	license: {
		isGranted: boolean;
		status: "ACTIVE" | "REVOKED";
		type: string;
	};
	readingProgress: {
		currentPage: number;
		totalPages: number;
		percent: number;
		lastReadAt?: string;
	};
}

const SALEOR_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
const BACKEND_INTERNAL_URL = "http://localhost:8000";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const requestedUserId = searchParams.get("userId");

	let userEmail: string | null = null;

	// 1. Try resolving authenticated user via Saleor Auth session
	try {
		const authRes = await executeAuthenticatedGraphQL(CurrentUserDocument, { cache: "no-cache" });
		if (authRes.ok && authRes.data?.me) {
			userEmail = authRes.data.me.email;
		}
	} catch (e) {
		console.warn("[community/bookshelf] No active Saleor session:", e);
	}

	// 2. Fallback to community user profile if requested or found
	if (!userEmail && requestedUserId) {
		const commUser = getCommunityUserById(requestedUserId);
		if (commUser?.realAccount?.email) {
			userEmail = commUser.realAccount.email;
		}
	}

	if (!userEmail) {
		const allUsers = getCommunityUsers();
		if (requestedUserId) {
			const found = allUsers.find((u) => u.id === requestedUserId || u.username === requestedUserId);
			if (found?.realAccount?.email) {
				userEmail = found.realAccount.email;
			}
		}
	}

	// If unauthenticated or no email found
	if (!userEmail) {
		return NextResponse.json({
			isAuthenticated: false,
			books: [],
			stats: {
				totalBooks: 0,
				readingCount: 0,
				finishedCount: 0,
				notStartedCount: 0,
			},
		});
	}

	try {
		// 3. Fetch real reading progress from aurabook_apps.drm for this user
		interface LibraryProgress {
			product_id: string;
			current_page: number;
			total_pages: number;
			completion_percent: number;
			last_read_at?: string;
		}
		let libraryProgressList: LibraryProgress[] = [];
		try {
			const progRes = await fetch(
				`${BACKEND_INTERNAL_URL}/aurabook/reading/library?user_email=${encodeURIComponent(userEmail)}`,
				{ cache: "no-store" },
			);
			if (progRes.ok) {
				const progData = (await progRes.json()) as { library?: LibraryProgress[] };
				if (Array.isArray(progData.library)) {
					libraryProgressList = progData.library;
				}
			}
		} catch (err) {
			console.warn("[community/bookshelf] Failed to fetch reading progress:", err);
		}

		// 4. Query Saleor GraphQL for user's orders
		interface OrderNode {
			id: string;
			number: string;
			status: string;
			paymentStatus: string;
			created: string;
			lines: Array<{
				id: string;
				productName: string;
				variantName: string;
				quantity: number;
				isShippingRequired: boolean;
				variant?: {
					id: string;
					name: string;
					product?: {
						id: string;
						name: string;
						slug: string;
						description?: string;
						thumbnail?: { url: string; alt?: string };
						category?: { id: string; name: string; slug: string };
						productType?: { id: string; name: string; slug: string; isShippingRequired: boolean };
					};
				};
			}>;
		}

		let orders: OrderNode[] = [];

		const ordersQuery = `
			query CurrentUserBookshelfOrders {
				me {
					orders(first: 50) {
						edges {
							node {
								id
								number
								status
								paymentStatus
								created
								lines {
									id
									productName
									variantName
									quantity
									isShippingRequired
									variant {
										id
										name
										product {
											id
											name
											slug
											description
											thumbnail(size: 512, format: WEBP) {
												url
												alt
											}
											category {
												id
												name
												slug
											}
											productType {
												id
												name
												slug
												isShippingRequired
											}
										}
									}
								}
							}
						}
					}
				}
			}
		`;

		try {
			const ordersRes = await executeAuthenticatedGraphQL(
				{
					toString: () => ordersQuery,
				} as any,
				{ cache: "no-cache", variables: {} } as any,
			);

			if (ordersRes.ok && (ordersRes.data as any)?.me?.orders?.edges) {
				orders = (ordersRes.data as any).me.orders.edges.map((e: any) => e.node);
			}
		} catch (e) {
			console.warn("[community/bookshelf] Could not query me.orders directly:", e);
		}

		// 5. If orders list is empty but we have userEmail, check via backend app query
		if (orders.length === 0 && process.env.SALEOR_APP_TOKEN) {
			try {
				const appOrdersQuery = `
					query GetCustomerOrders($email: String!) {
						customers(filter: { search: $email }, first: 1) {
							edges {
								node {
									orders(first: 50) {
										edges {
											node {
												id
												number
												status
												paymentStatus
												created
												lines {
													id
													productName
													variantName
													quantity
													isShippingRequired
													variant {
														id
														name
														product {
															id
															name
															slug
															thumbnail(size: 512, format: WEBP) {
																url
																alt
															}
															category {
																id
																name
																slug
															}
															productType {
																id
																name
																slug
																isShippingRequired
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				`;
				const resp = await fetch(SALEOR_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
					},
					body: JSON.stringify({
						query: appOrdersQuery,
						variables: { email: userEmail },
					}),
				});
				const data = (await resp.json()) as any;
				const edges = data?.data?.customers?.edges?.[0]?.node?.orders?.edges;
				if (Array.isArray(edges)) {
					orders = edges.map((e: any) => e.node);
				}
			} catch (err) {
				console.warn("[community/bookshelf] App token customer query error:", err);
			}
		}

		// 6. Filter: CHỈ hiển thị sách ĐÃ MUA và ĐÃ CẤP PHÁT QUYỀN ĐỌC ĐIỆN TỬ
		const validBooksMap = new Map<string, BookshelfItem>();

		for (const order of orders) {
			// Check if order is paid
			const isPaid =
				order.paymentStatus === "FULLY_CHARGED" ||
				["PAID", "FULFILLED", "DELIVERED", "PARTIALLY_FULFILLED"].includes(order.status.toUpperCase());

			if (!isPaid) continue;

			for (const line of order.lines) {
				const product = line.variant?.product;
				if (!product) continue;

				// Check digital reading access criteria:
				const isDigital =
					line.isShippingRequired === false ||
					product.productType?.isShippingRequired === false ||
					product.productType?.slug === "audiobook" ||
					product.category?.slug === "books" ||
					product.category?.slug === "audiobooks" ||
					libraryProgressList.some((p) => {
						const rawId = product.id.includes(":")
							? Buffer.from(product.id, "base64").toString("ascii").split(":")[1]
							: product.id;
						return p.product_id === rawId || p.product_id === product.id;
					});

				if (!isDigital) {
					// Physical items without digital access are strictly excluded
					continue;
				}

				// Extract integer product id for progress matching
				let numericProdId = product.id;
				if (product.id.startsWith("UHJv")) {
					try {
						numericProdId = Buffer.from(product.id, "base64").toString("ascii").split(":")[1] || product.id;
					} catch {}
				}

				const progress = libraryProgressList.find(
					(p) => p.product_id === numericProdId || p.product_id === product.id,
				);

				const format: BookshelfItem["format"] =
					product.productType?.slug === "audiobook" ? "AUDIOBOOK" : "EBOOK";

				const item: BookshelfItem = {
					id: product.id,
					productId: numericProdId,
					productSlug: product.slug,
					title: product.name,
					author: "Aurabook Publishing",
					categoryName: product.category?.name || "Sách điện tử / Kỹ thuật số",
					format,
					thumbnail:
						product.thumbnail?.url ||
						"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
					orderNumber: order.number,
					purchasedAt: order.created,
					license: {
						isGranted: true,
						status: "ACTIVE",
						type: "DRM_SECURE_READ",
					},
					readingProgress: {
						currentPage: progress?.current_page || 1,
						totalPages: progress?.total_pages || 100,
						percent: progress?.completion_percent || 0,
						lastReadAt: progress?.last_read_at,
					},
				};

				if (!validBooksMap.has(product.id)) {
					validBooksMap.set(product.id, item);
				}
			}
		}

		// 7. Also check if there are digital books in libraryProgressList
		for (const prog of libraryProgressList) {
			const foundExisting = Array.from(validBooksMap.values()).some((b) => b.productId === prog.product_id);
			if (!foundExisting) {
				try {
					const relayId = Buffer.from(`Product:${prog.product_id}`).toString("base64");
					const prodQuery = `
						query GetProductDetails($id: ID!) {
							product(id: $id, channel: "channel-vnd") {
								id
								name
								slug
								thumbnail(size: 512, format: WEBP) { url }
								category { name slug }
								productType { name slug isShippingRequired }
							}
						}
					`;
					const pRes = await fetch(SALEOR_URL, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ query: prodQuery, variables: { id: relayId } }),
					});
					const pData = (await pRes.json()) as any;
					const prod = pData?.data?.product;
					if (prod) {
						validBooksMap.set(prod.id, {
							id: prod.id,
							productId: prog.product_id,
							productSlug: prod.slug,
							title: prod.name,
							author: "Aurabook Publishing",
							categoryName: prod.category?.name || "Sách điện tử / Kỹ thuật số",
							format: prod.productType?.slug === "audiobook" ? "AUDIOBOOK" : "EBOOK",
							thumbnail:
								prod.thumbnail?.url ||
								"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
							orderNumber: "DRM-LICENSED",
							purchasedAt: prog.last_read_at || new Date().toISOString(),
							license: {
								isGranted: true,
								status: "ACTIVE",
								type: "DRM_SECURE_READ",
							},
							readingProgress: {
								currentPage: prog.current_page,
								totalPages: prog.total_pages,
								percent: prog.completion_percent,
								lastReadAt: prog.last_read_at,
							},
						});
					}
				} catch (err) {
					console.warn("[community/bookshelf] Failed to fetch product for progress:", err);
				}
			}
		}

		const books = Array.from(validBooksMap.values());

		// Statistics
		const readingCount = books.filter(
			(b) => b.readingProgress.percent > 0 && b.readingProgress.percent < 100,
		).length;
		const finishedCount = books.filter((b) => b.readingProgress.percent >= 100).length;
		const notStartedCount = books.filter((b) => b.readingProgress.percent === 0).length;

		return NextResponse.json({
			isAuthenticated: true,
			userEmail,
			books,
			stats: {
				totalBooks: books.length,
				readingCount,
				finishedCount,
				notStartedCount,
			},
		});
	} catch (error) {
		console.error("[community/bookshelf] Error:", error);
		return NextResponse.json(
			{
				error: "Lỗi khi tải tủ sách cá nhân.",
				books: [],
				stats: { totalBooks: 0, readingCount: 0, finishedCount: 0, notStartedCount: 0 },
			},
			{ status: 500 },
		);
	}
}
