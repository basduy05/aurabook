import { NextResponse } from "next/server";
import { getCommunityUsers, toggleUserBlockedStatus } from "@/lib/community/storage";

export async function GET() {
	const users = getCommunityUsers();
	return NextResponse.json({ users });
}

export async function POST(request: Request) {
	try {
		const { userId } = (await request.json()) as { userId: string };
		if (!userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}
		const isBlocked = toggleUserBlockedStatus(userId);
		return NextResponse.json({ ok: true, isBlocked });
	} catch {
		return NextResponse.json({ error: "Lỗi cập nhật trạng thái người dùng" }, { status: 500 });
	}
}
