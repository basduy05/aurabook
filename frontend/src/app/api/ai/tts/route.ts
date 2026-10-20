import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getConfig() {
	const possiblePaths = [
		path.resolve(process.cwd(), "../ecommerce-ai-platform/ai_platform_config.json"),
		path.resolve(process.cwd(), "ai_platform_config.json"),
		"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/ai_platform_config.json",
	];
	for (const p of possiblePaths) {
		if (fs.existsSync(p)) {
			try {
				return JSON.parse(fs.readFileSync(p, "utf-8"));
			} catch {}
		}
	}
	return null;
}

export async function GET() {
	const cfg = getConfig() as any;
	const availableVoices = cfg?.voice?.availableVoices || [
		{
			id: "vi_VN-hoaimy-aurabook",
			name: "Hoài My (1000 Epochs - VTV MC Studio)",
			engine: "piper-vits",
			gender: "Female",
			description: "Giọng MC đài truyền hình chuẩn, phát âm tròn vành rõ chữ.",
		},
		{
			id: "mailinh",
			name: "Mai Linh (beyoru/MaiLinh-TTS-CoreML)",
			engine: "piper-onnx",
			gender: "Female",
			description: "Model VITS/Piper ONNX giọng nữ nhẹ nhàng, phát âm tự nhiên, ngắt câu chuẩn.",
		},
		{
			id: "f5-tts-vietnamese",
			name: "F5-TTS Vietnamese (zalopay/hynt ViVoice)",
			engine: "flow-matching",
			gender: "Clonable / Multi",
			description: "Mô hình Flow Matching mã nguồn mở. Zero-shot voice cloning từ mẫu 5-10s.",
		},
		{
			id: "vixtts",
			name: "viXTTS (XTTS-v2 Tiếng Việt)",
			engine: "xtts-v2",
			gender: "Expressive Female/Male",
			description: "Hỗ trợ cross-lingual và zero-shot voice cloning, độ vang, hơi thở câu văn tuyệt hảo.",
		},
		{
			id: "viettts",
			name: "VietTTS (dangvansam/viet-tts)",
			engine: "fastspeech2-hifigan",
			gender: "Male",
			description: "Pipeline FastSpeech2 kết hợp HiFi-GAN gọn nhẹ chuyên biệt cho tiếng Việt ngữ điệu miền Bắc (Nam phát thanh viên).",
		},
	];

	return NextResponse.json({
		status: "online",
		defaultVoice: cfg?.voice?.ttsVoice || "vi_VN-hoaimy-aurabook",
		voices: availableVoices,
	});
}

import crypto from "crypto";

const DISK_CACHE_PATHS = [
	path.resolve(process.cwd(), "../ecommerce-ai-platform/data/audio_cache"),
	path.resolve(process.cwd(), "data/audio_cache"),
	"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/data/audio_cache",
];

function getCacheDir(): string {
	for (const p of DISK_CACHE_PATHS) {
		if (fs.existsSync(p)) return p;
	}
	const defaultPath = DISK_CACHE_PATHS[0];
	try {
		fs.mkdirSync(defaultPath, { recursive: true });
	} catch {}
	return defaultPath;
}

export async function POST(req: Request) {
	try {
		const cfg = getConfig() as any;
		const body = ((await req.json()) || {}) as any;
		const text = body.text || body.prompt || "";
		const speed = typeof body.speed === "number" ? body.speed : 1.0;
		const voice = body.voice || body.model || cfg?.voice?.ttsVoice || "vi_VN-hoaimy-aurabook";

		if (!text.trim() || !/[a-zA-Z0-9\u00C0-\u1EF9]/.test(text)) {
			// Trả về khoảng lặng 0.1s cho câu không chứa từ ngữ (chỉ có dấu câu)
			const sampleRate = 22050;
			const numSamples = Math.floor(sampleRate * 0.1);
			const dataSize = numSamples * 2;
			const buffer = Buffer.alloc(44 + dataSize);
			buffer.write("RIFF", 0);
			buffer.writeUInt32LE(36 + dataSize, 4);
			buffer.write("WAVE", 8);
			buffer.write("fmt ", 12);
			buffer.writeUInt32LE(16, 16);
			buffer.writeUInt16LE(1, 20); // PCM
			buffer.writeUInt16LE(1, 22); // Mono
			buffer.writeUInt32LE(sampleRate, 24);
			buffer.writeUInt32LE(sampleRate * 2, 28);
			buffer.writeUInt16LE(2, 32);
			buffer.writeUInt16LE(16, 34);
			buffer.write("data", 36);
			buffer.writeUInt32LE(dataSize, 40);
			return NextResponse.json({
				status: "silent",
				audioBase64: buffer.toString("base64"),
				voice,
				originalText: text,
			});
		}

		// 1. Kiểm tra bộ nhớ đệm dùng chung (Shared Global Disk Cache) - Giúp mọi người dùng nghe tức thì 0ms
		const cacheDir = getCacheDir();
		const hash = crypto.createHash("sha256").update(text.trim()).digest("hex");
		const cacheKey = `${voice}_${speed.toFixed(2)}_${hash}`;
		const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

		if (fs.existsSync(cacheFile)) {
			try {
				const cached: any = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
				if (cached?.audioBase64) {
					return NextResponse.json(cached);
				}
			} catch {}
		}

		const TTS_URL = process.env.PIPER_TTS_URL || "http://localhost:5050/api/tts";

		try {
			const res = await fetch(TTS_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, speed, voice, format: "base64" }),
			});

			if (res.ok) {
				const data: any = await res.json();
				// Lưu cache bất đồng bộ để người nghe sau được thưởng thức ngay lập tức
				if (data?.audioBase64) {
					try {
						fs.writeFile(cacheFile, JSON.stringify(data), () => {});
					} catch {}
				}
				return NextResponse.json(data);
			}
		} catch (fetchErr) {
			console.warn("[TTS API] Không thể kết nối tới Piper TTS Server tại port 5050:", fetchErr);
		}

		// Fallback nếu server port 5050 chưa bật
		return NextResponse.json(
			{
				status: "offline",
				message: "AuraBook TTS Server (port 5050) đang khởi động. Vui lòng thử lại sau giây lát.",
			},
			{ status: 503 },
		);
	} catch (error) {
		console.error("[TTS API Route Error]:", error);
		return NextResponse.json({ error: "Lỗi xử lý yêu cầu TTS" }, { status: 500 });
	}
}
