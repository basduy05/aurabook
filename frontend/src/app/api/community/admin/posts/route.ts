import { NextResponse } from "next/server";
import {
	getCommunityPosts,
	deleteCommunityPost,
	togglePinCommunityPost,
	toggleHideCommunityPost,
	editCommunityPost,
} from "@/lib/community/storage";

export async function GET() {
	const posts = getCommunityPosts({ includeHidden: true });
	return NextResponse.json({ posts });
}

export async function POST(request: Request) {
	try {
		const { action, postId, title, content } = (await request.json()) as {
			action: "delete" | "pin" | "hide" | "edit";
			postId: string;
			title?: string;
			content?: string;
		};
		if (!postId) {
			return NextResponse.json({ error: "Missing postId" }, { status: 400 });
		}

		if (action === "delete") {
			const ok = deleteCommunityPost(postId);
			return NextResponse.json({ ok });
		}

		if (action === "pin") {
			const isPinned = togglePinCommunityPost(postId);
			return NextResponse.json({ ok: true, isPinned });
		}

		if (action === "hide") {
			const isHidden = toggleHideCommunityPost(postId);
			return NextResponse.json({ ok: true, isHidden });
		}

		if (action === "edit") {
			if (!title?.trim() || !content?.trim()) {
				return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
			}
			const post = editCommunityPost(postId, title, content, {
				id: "admin",
				displayName: "Quản trị viên Aurabook",
			});
			return NextResponse.json({ ok: true, post });
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error: any) {
		console.error("[api/community/admin/posts] Error:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi xử lý bài viết" },
			{ status: 500 },
		);
	}
}
