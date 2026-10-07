import { NextResponse } from "next/server";
import { getCommunityPosts, createCommunityPost } from "@/lib/community/storage";
import { type CommunityPost } from "@/lib/community/types";

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

		const post = createCommunityPost(body);
		return NextResponse.json({ post }, { status: 201 });
	} catch (error) {
		console.error("[api/community/posts] Error creating post:", error);
		return NextResponse.json({ error: "Lỗi hệ thống khi đăng bài viết." }, { status: 500 });
	}
}
