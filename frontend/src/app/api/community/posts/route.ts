import { NextResponse } from "next/server";
import { getCommunityPosts, createCommunityPost } from "@/lib/community/storage";
import { type CommunityPost } from "@/lib/community/types";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserOrdersPaginatedDocument } from "@/gql/graphql";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") || undefined;
	const bookSlug = searchParams.get("bookSlug") || undefined;

	const posts = getCommunityPosts({ search, bookSlug });
	return NextResponse.json({ posts });
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Omit<CommunityPost, "id" | "createdAt" | "likes" | "comments">;

		if (!body.title?.trim() || !body.content?.trim() || !body.author?.displayName) {
			return NextResponse.json(
				{ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết." },
				{ status: 400 },
			);
		}

		// Server-side validation: Only buyers can get isVerifiedBuyer: true and rating
		if (body.book?.slug) {
			let isVerified = false;
			try {
				const ordersRes = await executeAuthenticatedGraphQL(CurrentUserOrdersPaginatedDocument, {
					variables: { first: 50, after: null, ...graphqlLanguageCodeVariables("vi") },
					cache: "no-cache",
				});
				if (ordersRes.ok && ordersRes.data?.me?.orders?.edges) {
					for (const edge of ordersRes.data.me.orders.edges) {
						const order = edge.node;
						if (order.status?.toLowerCase() === "canceled") continue;
						for (const line of order.lines) {
							const slug = line.variant?.product?.slug?.toLowerCase().trim();
							const name = line.variant?.product?.name?.toLowerCase().trim();
							const target = body.book.slug.toLowerCase().trim();
							if (slug === target || name === target) {
								isVerified = true;
								break;
							}
						}
						if (isVerified) break;
					}
				}
			} catch (e) {
				console.error("[api/community/posts] Verify error:", e);
			}

			body.author.isVerifiedBuyer = isVerified;
			if (!isVerified && body.book) {
				delete body.book.rating;
			}
		} else {
			body.author.isVerifiedBuyer = false;
		}

		const post = createCommunityPost(body);
		return NextResponse.json({ post }, { status: 201 });
	} catch (error) {
		console.error("[api/community/posts] Error creating post:", error);
		return NextResponse.json({ error: "Lỗi hệ thống khi đăng bài viết." }, { status: 500 });
	}
}
