import { NextResponse } from "next/server";
import { getAllSessions, saveOrUpdateSession, VoiceSessionRecord } from "@/lib/voice-sessions-store";

export async function GET() {
	try {
		const sessions = getAllSessions();
		return NextResponse.json({
			success: true,
			total: sessions.length,
			sessions,
		});
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, message: error.message || "Lỗi truy xuất lịch sử phiên" },
			{ status: 500 },
		);
	}
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as VoiceSessionRecord;

		if (!body || !body.id) {
			return NextResponse.json(
				{ success: false, message: "Thiếu session ID" },
				{ status: 400 },
			);
		}

		const updated = saveOrUpdateSession(body);
		return NextResponse.json({
			success: true,
			session: updated,
		});
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, message: error.message || "Lỗi lưu phiên hội thoại" },
			{ status: 500 },
		);
	}
}
