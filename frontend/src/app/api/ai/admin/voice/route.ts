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

import { getAllSessions } from "@/lib/voice-sessions-store";

export async function GET() {
	const cfg = readAiConfig();
	const voice = cfg?.voice || {};
	const allSessions = getAllSessions();

	const activeRooms = allSessions
		.filter((s) => s.status === "in_progress")
		.map((s) => ({
			roomName: `aurabook-${s.contactMethod}-${s.id}`,
			numParticipants: 2,
			durationSec: s.durationSeconds || 1,
			status: "ongoing",
			clientDevice: s.contactMethod === "call" ? "WebRTC Voice Call" : "Live Chat Web",
		}));

	const recentCalls = allSessions.slice(0, 15).map((s) => {
		const mins = Math.floor((s.durationSeconds || 0) / 60);
		const secs = (s.durationSeconds || 0) % 60;
		const durStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		let sentiment = "neutral";
		if (s.rating && s.rating >= 4) sentiment = "positive";
		else if (s.rating && s.rating <= 2) sentiment = "negative";

		const custTitle = [s.customerGender, s.customerName].filter(Boolean).join(" ");

		return {
			id: s.id,
			customer: s.customerPhone ? `${custTitle} (${s.customerPhone})` : custTitle || "Khách vãng lai",
			topic: s.topic,
			duration: durStr,
			timestamp: s.startedAt,
			sentiment,
			resolved: s.status === "completed",
			contactMethod: s.contactMethod,
			rating: s.rating,
		};
	});

	return NextResponse.json({
		livekit: {
			serverUrl: voice.livekitUrl || "ws://localhost:7880",
			apiKey: voice.livekitApiKey || "devkey",
			apiSecret: voice.livekitApiSecret ? "••••••" : "secret",
			connectedWorkers: 1,
			workerScript: "vietnamese_cskh_agent.py",
			workerStatus: "active",
		},
		voiceConfig: {
			sttProvider: voice.sttProvider || "whisper-local",
			sttModel: voice.sttModel || "Systran/faster-whisper-small",
			sttBaseUrl: voice.sttBaseUrl || "http://localhost:8000/v1",
			sttApiKey: voice.sttApiKey ? "••••••" : "",
			llmProvider: voice.llmProvider || "ollama",
			llmModel: voice.llmModel || "deepseek-r1:1.5b",
			llmBaseUrl: voice.llmBaseUrl || "http://localhost:11434/v1",
			llmApiKey: voice.llmApiKey ? "••••••" : "",
			ttsProvider: voice.ttsProvider || "piper-local",
			ttsVoice: voice.ttsVoice || "vi_VN-hoaimy-aurabook",
			ttsBaseUrl: voice.ttsBaseUrl || "http://localhost:5050/v1",
			ttsSpeed: voice.ttsSpeed || 1.0,
			language: voice.language || "vi-VN",
			temperature: voice.temperature || 0.7,
			systemPrompt:
				voice.systemPrompt ||
				"Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu thân thiện, ấm áp, trả lời ngắn gọn và tra cứu sách chính xác.",
		},
		activePreset: cfg?.activePreset || "local-free",
		activeRooms,
		recentCalls,
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
		currentConfig.updatedAt = new Date().toISOString();

		fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), "utf-8");

		return NextResponse.json({
			success: true,
			message: "Đã cập nhật cấu hình Voice Agent thành công! Đã đồng bộ sang vietnamese_cskh_agent.py.",
			voiceConfig: currentConfig.voice,
		});
	} catch (e: any) {
		return NextResponse.json({ success: false, message: e?.message }, { status: 500 });
	}
}
