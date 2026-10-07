import { NextResponse } from "next/server";
import { editCommunityPost, deleteCommunityPost, toggleHideCommunityPost } from "@/lib/community/storage";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;
		if (!postId) {
			return NextResponse.json({ error: "Missing postId" }, { status: 400 });
		}
		const body = (await request.json().catch(() => ({}))) as { action?: string };
		if (body.action === "toggleHide" || !body.action) {
			const isHidden = toggleHideCommunityPost(postId);
			return NextResponse.json({ ok: true, isHidden });
		}
		return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
	} catch (error: any) {
		console.error("[api/community/posts/[id]] Error toggle hide post:", error);
		return NextResponse.json(
			{ error: error?.message || "Không thể thực hiện ẩn/hiện bài viết." },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;
		const { title, content, editorUser } = (await request.json()) as {
			title: string;
			content: string;
			editorUser?: { id: string; displayName: string };
		};

		if (!postId || !title?.trim() || !content?.trim()) {
			return NextResponse.json(
				{ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung." },
				{ status: 400 },
			);
		}

		const updatedPost = editCommunityPost(postId, title, content, editorUser);
		return NextResponse.json({ post: updatedPost });
	} catch (error: any) {
		console.error("[api/community/posts/[id]] Error editing post:", error);
		return NextResponse.json(
			{ error: error?.message || "Không thể chỉnh sửa bài viết." },
			{ status: 400 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;
		if (!postId) {
			return NextResponse.json({ error: "Missing postId" }, { status: 400 });
		}
		const ok = deleteCommunityPost(postId);
		return NextResponse.json({ ok });
	} catch (error: any) {
		console.error("[api/community/posts/[id]] Error deleting post:", error);
		return NextResponse.json(
			{ error: error?.message || "Không thể xóa bài viết." },
			{ status: 500 },
		);
	}
}
