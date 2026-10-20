import { NextResponse } from "next/server";
import { AccessToken, type VideoGrant } from "livekit-server-sdk";

export async function POST(req: Request) {
	try {
		const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";
		const API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
		const API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";

		let roomName = "";
		let participantName = "Khách hàng AuraBook";

		try {
			const body = (await req.json()) as Record<string, unknown> | null;
			if (body && typeof body === "object") {
				if (body.roomName) roomName = String(body.roomName);
				if (body.participantName) participantName = String(body.participantName);
			}
		} catch {
			// Body is optional
		}

		if (!roomName) {
			roomName = `aurabook_cskh_${Math.floor(Math.random() * 100000)}`;
		}

		const participantIdentity = `user_${Math.random().toString(36).substring(2, 9)}`;

		const at = new AccessToken(API_KEY, API_SECRET, {
			identity: participantIdentity,
			name: participantName,
			ttl: "1h",
		});

		const grant: VideoGrant = {
			room: roomName,
			roomJoin: true,
			canPublish: true,
			canPublishData: true,
			canSubscribe: true,
		};
		at.addGrant(grant);

		const participantToken = await at.toJwt();

		return NextResponse.json(
			{
				serverUrl: LIVEKIT_URL,
				roomName,
				participantName,
				participantToken,
			},
			{
				headers: {
					"Cache-Control": "no-store, max-age=0",
				},
			},
		);
	} catch (error) {
		console.error("Lỗi tạo LiveKit token:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function GET(req: Request) {
	return POST(req);
}
