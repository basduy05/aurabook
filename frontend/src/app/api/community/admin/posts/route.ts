import { NextResponse } from "next/server";
import { deleteCommunityPost, togglePinCommunityPost } from "@/lib/community/storage";

export async function POST(request: Request) {
	try {
		const { action, postId } = (await request.json()) as { action: "delete" | "pin"; postId: string };
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

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch {
		return NextResponse.json({ error: "Lỗi xử lý bài viết" }, { status: 500 });
	}
}
