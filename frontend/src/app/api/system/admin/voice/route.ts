import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getConfigPath(): string {
	const possiblePaths = [
		path.resolve(process.cwd(), "../ecommerce-ai-platform/ai_platform_config.json"),
		path.resolve(process.cwd(), "ai_platform_config.json"),
		"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/ai_platform_config.json",
	];

	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}
	return possiblePaths[0];
}

function readAiConfig(): any {
	const p = getConfigPath();
	if (fs.existsSync(p)) {
		try {
			return JSON.parse(fs.readFileSync(p, "utf-8")) as any;
		} catch {}
	}
	return null;
}

export async function GET() {
	const cfg = readAiConfig();
	const voice = cfg?.voice || {};

	return NextResponse.json({
		success: true,
		voiceConfig: {
			ttsVoice: voice.ttsVoice || "vi_VN-hoaimy-aurabook",
			ttsSpeed: voice.ttsSpeed || 1.0,
			ttsProvider: voice.ttsProvider || "piper-local",
			ttsBaseUrl: voice.ttsBaseUrl || "http://localhost:5050/v1",
			availableVoices: voice.availableVoices || [],
		},
		activeVoice: voice.ttsVoice || "vi_VN-hoaimy-aurabook",
	});
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as any;
		const configPath = getConfigPath();
		let currentConfig: any = {};

		if (fs.existsSync(configPath)) {
			try {
				currentConfig = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
			} catch {}
		}

		currentConfig.voice = {
			...(currentConfig.voice || {}),
			...body,
		};
		const selectedVoice = body.ttsVoice || body.voiceId || body.voice;
		if (selectedVoice) {
			currentConfig.voice.ttsVoice = selectedVoice;
		}
		currentConfig.updatedAt = new Date().toISOString();

		const dir = path.dirname(configPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), "utf-8");

		return NextResponse.json({
			success: true,
			message: `Đã lưu thành công giọng đọc [${currentConfig.voice.ttsVoice}] làm mặc định cho toàn bộ hệ thống!`,
			activeVoice: currentConfig.voice.ttsVoice,
			voiceConfig: currentConfig.voice,
		});
	} catch (e: any) {
		console.error("[System Admin Voice API Error]:", e);
		return NextResponse.json({ success: false, message: e?.message }, { status: 500 });
	}
}
