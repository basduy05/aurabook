import { NextResponse } from "next/server";
import { toggleLikePost } from "@/lib/community/storage";

export async function POST(
	request: Request,
	props: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await props.params;
		const { userId } = (await request.json()) as { userId?: string };
		const voterId = userId || request.headers.get("x-forwarded-for") || "anonymous-user";

		const result = toggleLikePost(id, voterId);
		return NextResponse.json(result);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Error liking post";
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}
