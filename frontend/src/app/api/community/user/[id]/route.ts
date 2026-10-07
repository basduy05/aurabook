import { NextResponse } from "next/server";
import {
	getUserActivity,
	toggleFollowUser,
	toggleSaveUserPost,
	getCommunityUserById,
} from "@/lib/community/storage";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: rawId } = await params;
		const userIdOrUsername = decodeURIComponent(rawId);
		const { searchParams } = new URL(request.url);
		const viewerId = searchParams.get("viewerId") || undefined;
		const activity = getUserActivity(userIdOrUsername, viewerId);

		if (!activity.user) {
			const fallbackUser = getCommunityUserById(userIdOrUsername);
			if (!fallbackUser) {
				return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
			}
			return NextResponse.json({
				user: fallbackUser,
				posts: [],
				comments: [],
				savedPosts: [],
				followersUsers: [],
				followingUsers: [],
			});
		}

		return NextResponse.json({
			user: activity.user,
			posts: activity.posts,
			comments: activity.comments,
			savedPosts: activity.savedPosts || [],
			followersUsers: activity.followersUsers || [],
			followingUsers: activity.followingUsers || [],
		});
	} catch (error: any) {
		console.error("[api/community/user/[id]] Error:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi tải thông tin hồ sơ người dùng." },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: rawId } = await params;
		const targetUserId = decodeURIComponent(rawId);
		const body = (await request.json()) as {
			action?: "follow" | "save";
			currentUserId?: string;
			postId?: string;
		};

		if (body.action === "save" && body.postId) {
			const result = toggleSaveUserPost(targetUserId, body.postId);
			return NextResponse.json(result);
		}

		const currentUserId = body.currentUserId;
		if (!currentUserId || !targetUserId) {
			return NextResponse.json({ error: "Thiếu thông tin người dùng" }, { status: 400 });
		}

		const result = toggleFollowUser(currentUserId, targetUserId);
		return NextResponse.json(result);
	} catch (error: any) {
		console.error("[api/community/user/[id]] Follow/save error:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi xử lý yêu cầu." },
			{ status: 400 },
		);
	}
}
