import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function GET(
	_request: Request,
	props: { params: Promise<{ productId: string }> },
) {
	try {
		const { productId } = await props.params;

		const backendRes = await fetch(
			`${BACKEND_INTERNAL_URL}/aurabook/audio/${encodeURIComponent(productId)}/teaser`,
			{
				cache: "no-store",
				headers: {
					Accept: "*/*",
				},
			},
		);

		if (!backendRes.ok) {
			return new NextResponse(null, { status: 404 });
		}

		const audioBuffer = await backendRes.arrayBuffer();
		const contentType = backendRes.headers.get("Content-Type") || "audio/wav";

		return new NextResponse(audioBuffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Accept-Ranges": "bytes",
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		console.warn("[api/audio/teaser] Backend audio teaser unreachable:", error);
		return new NextResponse(null, { status: 404 });
	}
}
