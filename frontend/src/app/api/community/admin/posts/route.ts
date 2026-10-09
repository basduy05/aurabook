import { NextResponse } from "next/server";
import {
	getCommunityPosts,
	deleteCommunityPost,
	togglePinCommunityPost,
	toggleHideCommunityPost,
	editCommunityPost,
	createCommunityPost,
} from "@/lib/community/storage";

export async function GET() {
	const posts = getCommunityPosts({ includeHidden: true });
	return NextResponse.json({ posts });
}

export async function POST(request: Request) {
	try {
		const { action, postId, title, content, isPinned, category } = (await request.json()) as {
			action: "delete" | "pin" | "hide" | "edit" | "create" | "create_admin_post";
			postId?: string;
			title?: string;
			content?: string;
			isPinned?: boolean;
			category?: string;
		};

		if (action === "create" || action === "create_admin_post") {
			if (!title?.trim() || !content?.trim()) {
				return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung thông báo." }, { status: 400 });
			}

			const formattedTitle = category && category !== "default"
				? `[${category.toUpperCase()}] ${title.trim()}`
				: title.trim();

			const post = createCommunityPost({
				author: {
					id: "admin-aurabook",
					username: "@aurabook_admin",
					displayName: "Quản trị viên Aurabook",
					avatar: "/android-chrome-512x512.png",
					isVerifiedBuyer: false,
				},
				title: formattedTitle,
				content: content.trim(),
				book: null,
				isPinned: isPinned !== undefined ? isPinned : true,
			});
			return NextResponse.json({ ok: true, post }, { status: 201 });
		}

		if (!postId) {
			return NextResponse.json({ error: "Missing postId" }, { status: 400 });
		}

		if (action === "delete") {
			const ok = deleteCommunityPost(postId);
			return NextResponse.json({ ok });
		}

		if (action === "pin") {
			const pinned = togglePinCommunityPost(postId);
			return NextResponse.json({ ok: true, isPinned: pinned });
		}

		if (action === "hide") {
			const isHidden = toggleHideCommunityPost(postId);
			return NextResponse.json({ ok: true, isHidden });
		}

		if (action === "edit") {
			if (!title?.trim() || !content?.trim()) {
				return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung." }, { status: 400 });
			}
			const post = editCommunityPost(postId, title.trim(), content.trim(), {
				id: "admin",
				displayName: "Ban Quản Trị Aurabook",
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
