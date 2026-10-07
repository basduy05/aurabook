import { NextResponse } from "next/server";
import {
	getNotificationsForUser,
	markNotificationRead,
	markAllNotificationsRead,
	getCommunityUsers,
} from "@/lib/community/storage";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		let userId = searchParams.get("userId");

		if (!userId) {
			const users = getCommunityUsers();
			userId = users[0]?.id || "user-1";
		}

		const data = getNotificationsForUser(userId);
		return NextResponse.json(data);
	} catch (error: any) {
		console.error("[api/community/notifications] GET error:", error);
		return NextResponse.json({ error: error?.message || "Lỗi tải thông báo" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			notificationId?: string;
			markAll?: boolean;
			userId?: string;
		};

		const users = getCommunityUsers();
		const userId = body.userId || users[0]?.id || "user-1";

		if (body.markAll) {
			markAllNotificationsRead(userId);
			return NextResponse.json({ ok: true, message: "Đã đánh dấu tất cả đã đọc" });
		}

		if (body.notificationId) {
			const success = markNotificationRead(body.notificationId);
			return NextResponse.json({ ok: success });
		}

		return NextResponse.json({ error: "Thiếu tham số notificationId hoặc markAll" }, { status: 400 });
	} catch (error: any) {
		console.error("[api/community/notifications] POST error:", error);
		return NextResponse.json({ error: error?.message || "Lỗi cập nhật thông báo" }, { status: 500 });
	}
}
