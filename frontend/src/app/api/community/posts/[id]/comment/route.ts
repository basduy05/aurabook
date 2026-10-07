import { NextResponse } from "next/server";
import { addCommentToPost } from "@/lib/community/storage";
import { type CommunityPost } from "@/lib/community/types";

export async function POST(
	request: Request,
	props: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await props.params;
		const body = (await request.json()) as {
			author: CommunityPost["author"];
			content: string;
			parentId?: string;
		};

		if (!body.content?.trim()) {
			return NextResponse.json({ error: "Nội dung bình luận không được để trống." }, { status: 400 });
		}

		const comment = addCommentToPost(id, body);
		return NextResponse.json({ comment }, { status: 201 });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Error commenting on post";
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}
