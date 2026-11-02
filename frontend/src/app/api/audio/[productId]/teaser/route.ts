import { NextResponse } from "next/server";
import { getFixedPreviewChapterInfo } from "@/lib/fixed-preview-chapters";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function GET(
	_request: Request,
	props: { params: Promise<{ productId: string }> },
) {
	const { productId } = await props.params;

	try {
		// 1. Thử tải từ backend lưu trữ nếu đã có file audio gốc
		const backendRes = await fetch(
			`${BACKEND_INTERNAL_URL}/aurabook/audio/${encodeURIComponent(productId)}/teaser`,
			{
				cache: "no-store",
				headers: { Accept: "*/*" },
			},
		);

		if (backendRes.ok) {
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
		}
	} catch (error) {
		console.warn("[api/audio/teaser] Backend audio teaser unreachable, falling back to TTS:", error);
	}

	// 2. Fallback tự động tổng hợp âm thanh 60s cho chương ngẫu nhiên cố định bằng TTS engine
	try {
		const previewInfo = getFixedPreviewChapterInfo(productId);
		const outroText =
			"Đã hết phần nghe thử, để có thể có một trải nghiệm tốt hơn, kính mời anh chị tiến hành đặt hàng để có trải nghiệm nghe sách trọn vẹn!";
		const fullPreviewText = `Bạn đang lắng nghe trích đoạn 60 giây sách nói của chương: ${previewInfo.chapterTitle}. ${previewInfo.teaserText} ${outroText}`;

		const piperUrl = process.env.PIPER_TTS_URL || "http://127.0.0.1:5050/api/tts";
		let ttsRes = await fetch(piperUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				text: fullPreviewText,
				speed: 1.0,
				voice: "vi_VN-hoaimy-aurabook",
				format: "base64",
			}),
		}).catch(() => null);

		if (!ttsRes || !ttsRes.ok) {
			ttsRes = await fetch("http://localhost:3000/api/ai/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: fullPreviewText,
					speed: 1.0,
				}),
			}).catch(() => null);
		}

		if (ttsRes && ttsRes.ok) {
			const data = (await ttsRes.json()) as any;
			if (data?.audioBase64) {
				const buffer = Buffer.from(data.audioBase64, "base64");
				const mime = data.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg";
				return new NextResponse(buffer, {
					status: 200,
					headers: {
						"Content-Type": mime,
						"Accept-Ranges": "bytes",
						"Cache-Control": "public, max-age=3600",
					},
				});
			}
		}
	} catch (ttsErr) {
		console.warn("[api/audio/teaser] Fallback TTS synthesis error:", ttsErr);
	}

	return new NextResponse(null, { status: 404 });
}
