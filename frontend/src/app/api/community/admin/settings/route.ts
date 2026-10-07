import { NextResponse } from "next/server";
import { getCommunitySettings, saveCommunitySettings } from "@/lib/community/storage";
import { type CommunityAdminSettings } from "@/lib/community/types";

export async function GET() {
	const settings = getCommunitySettings();
	return NextResponse.json({ settings });
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<CommunityAdminSettings>;
		const updatedSettings = saveCommunitySettings(body);
		return NextResponse.json({ settings: updatedSettings });
	} catch (error: any) {
		console.error("[api/community/admin/settings] Error:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi lưu cấu hình quản trị." },
			{ status: 500 },
		);
	}
}
