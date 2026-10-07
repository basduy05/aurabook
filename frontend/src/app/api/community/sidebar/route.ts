import { NextResponse } from "next/server";
import { getCommunitySidebarData } from "@/lib/community/storage";

export async function GET() {
	try {
		const data = getCommunitySidebarData();
		return NextResponse.json(data);
	} catch (error) {
		console.error("[api/community/sidebar] Error:", error);
		return NextResponse.json(
			{ trendingBooks: [], topReaders: [] },
			{ status: 500 },
		);
	}
}
