import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Locate the shared ai_platform_config.json
function getConfigPath(): string {
	const possiblePaths = [
		path.resolve(process.cwd(), "../ecommerce-ai-platform/ai_platform_config.json"),
		path.resolve(process.cwd(), "ai_platform_config.json"),
		"c:/Users/basduy05/Downloads/aurabook/ecommerce-ai-platform/ai_platform_config.json",
	];

	for (const p of possiblePaths) {
		if (fs.existsSync(p)) {
			return p;
		}
	}
	return possiblePaths[0];
}

const DEFAULT_CONFIG: any = {
	activePreset: "local-free",
	voice: {
		sttProvider: "whisper-local",
		sttModel: "Systran/faster-whisper-small",
		sttBaseUrl: "http://localhost:8000/v1",
		sttApiKey: "",
		llmProvider: "ollama",
		llmModel: "gemma2:2b",
		llmBaseUrl: "http://localhost:11434/v1",
		llmApiKey: "ollama",
		temperature: 0.7,
		ttsProvider: "edge-tts",
		ttsVoice: "vi-VN-HoaiMyNeural",
		ttsBaseUrl: "http://localhost:5050/v1",
		ttsApiKey: "",
		ttsSpeed: 1.0,
		systemPrompt:
			"Bạn là Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu thân thiện, ấm áp, trả lời ngắn gọn và tra cứu giá sách chính xác từ Dify RAG.",
		language: "vi-VN",
		livekitUrl: "ws://localhost:7880",
		livekitApiKey: "devkey",
		livekitApiSecret: "secret",
	},
	rag: {
		apiUrl: "http://localhost:8080/v1",
		apiKey: "app-aurabook-rag-dev-key",
		datasetId: "",
		knowledgeBase: "AuraBook Literature & Policy Dataset (KB-01)",
		topK: 4,
		scoreThreshold: 0.65,
	},
	drm: {
		lcpServerUrl: "http://localhost:8989",
		singleTabLock: true,
	},
	updatedAt: new Date().toISOString(),
};

export async function GET(req: Request) {
	const url = new URL(req.url);
	const action = url.searchParams.get("action");

	if (action === "scan-ollama-models") {
		const ollamaBase = (url.searchParams.get("url") || "http://localhost:11434").replace(/\/v1\/?$/, "");
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);
			const res = await fetch(`${ollamaBase}/api/tags`, { signal: controller.signal, cache: "no-store" });
			clearTimeout(timeout);
			if (res.ok) {
				const data = (await res.json()) as any;
				const modelNames = (data.models || []).map((m: any) => m.name);
				return NextResponse.json({
					success: true,
					models: modelNames.length > 0 ? modelNames : ["deepseek-r1:1.5b", "qwen2.5:3b"],
					message: `Đã tìm thấy ${modelNames.length} mô hình Ollama sẵn sàng.`,
				});
			}
		} catch (err: any) {
			return NextResponse.json({
				success: false,
				models: ["deepseek-r1:1.5b", "qwen2.5:3b"],
				message: `Không thể quét Ollama: ${err?.message || "Ollama offline"}`,
			});
		}
	}

	const configPath = getConfigPath();
	try {
		if (fs.existsSync(configPath)) {
			const data = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
			return NextResponse.json({ success: true, config: data, path: configPath });
		}
	} catch (e: any) {
		console.error("Lỗi đọc cấu hình AI:", e);
	}

	return NextResponse.json({ success: true, config: DEFAULT_CONFIG, path: configPath });
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as any;
		const configPath = getConfigPath();

		// Handle connection test action
		if (body.action === "test-connection") {
			const targetUrl = body.url;
			if (!targetUrl) {
				return NextResponse.json({ success: false, message: "URL kiểm tra không được để trống" }, { status: 400 });
			}

			const start = Date.now();
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 3000);
				const res = await fetch(targetUrl, { signal: controller.signal, cache: "no-store" });
				clearTimeout(timeout);
				const latency = Date.now() - start;

				return NextResponse.json({
					success: true,
					ok: res.status < 500,
					status: res.status,
					statusText: res.statusText,
					latencyMs: latency,
					message: `Kết nối thành công tới ${targetUrl} (${res.status} ${res.statusText}) - Độ trễ: ${latency}ms`,
				});
			} catch (err: any) {
				return NextResponse.json({
					success: false,
					ok: false,
					latencyMs: Date.now() - start,
					message: `Không thể kết nối tới ${targetUrl}: ${err?.message || "Connection refused / Timeout"}`,
				});
			}
		}

		// Handle scan ollama models
		if (body.action === "scan-ollama-models") {
			const ollamaBase = (body.url || "http://localhost:11434").replace(/\/v1\/?$/, "");
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 3000);
				const res = await fetch(`${ollamaBase}/api/tags`, { signal: controller.signal, cache: "no-store" });
				clearTimeout(timeout);
				if (res.ok) {
					const data = (await res.json()) as any;
					const modelNames = (data.models || []).map((m: any) => m.name);
					return NextResponse.json({
						success: true,
						models: modelNames.length > 0 ? modelNames : ["qwen2.5:3b"],
						message: `Đã tìm thấy ${modelNames.length} mô hình Ollama sẵn sàng.`,
					});
				}
			} catch (err: any) {
				return NextResponse.json({
					success: false,
					models: ["qwen2.5:3b"],
					message: `Không thể quét Ollama: ${err?.message || "Ollama offline"}`,
				});
			}
		}

		// Handle preset switch or full config update
		let currentConfig: any = DEFAULT_CONFIG;
		if (fs.existsSync(configPath)) {
			try {
				currentConfig = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
			} catch {
				// use default
			}
		}

		let updatedConfig: any = { ...currentConfig, ...body, updatedAt: new Date().toISOString() };

		// If applying a known preset
		if (body.preset) {
			const savedVoice = currentConfig.voice?.ttsVoice || "vi_VN-hoaimy-aurabook";
			if (body.preset === "local-free") {
				updatedConfig = {
					...updatedConfig,
					activePreset: "local-free",
					voice: {
						...updatedConfig.voice,
						sttProvider: "whisper-local",
						sttModel: "Systran/faster-whisper-small",
						sttBaseUrl: "http://localhost:8000/v1",
						llmProvider: "ollama",
						llmModel: "gemma2:2b",
						llmBaseUrl: "http://localhost:11434/v1",
						llmApiKey: "ollama",
						ttsProvider: "piper-local",
						ttsVoice: body.voice?.ttsVoice || savedVoice,
						ttsBaseUrl: "http://localhost:5050/v1",
					},
				};
			} else if (body.preset === "hybrid-free") {
				updatedConfig = {
					...updatedConfig,
					activePreset: "hybrid-free",
					voice: {
						...updatedConfig.voice,
						sttProvider: "groq",
						sttModel: "whisper-large-v3-turbo",
						sttBaseUrl: "https://api.groq.com/openai/v1",
						llmProvider: "groq",
						llmModel: "llama-3.3-70b-versatile",
						llmBaseUrl: "https://api.groq.com/openai/v1",
						ttsProvider: "piper-local",
						ttsVoice: body.voice?.ttsVoice || savedVoice,
						ttsBaseUrl: "http://localhost:5050/v1",
					},
				};
			} else if (body.preset === "commercial") {
				updatedConfig = {
					...updatedConfig,
					activePreset: "commercial",
					voice: {
						...updatedConfig.voice,
						sttProvider: "deepgram",
						sttModel: "nova-3",
						llmProvider: "openai",
						llmModel: "gpt-4o-mini",
						llmBaseUrl: "https://api.openai.com/v1",
						ttsProvider: "openai",
						ttsVoice: body.voice?.ttsVoice || savedVoice || "alloy",
						ttsBaseUrl: "https://api.openai.com/v1",
					},
				};
			}
		}

		// Ensure directory exists and write
		const dir = path.dirname(configPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");

		return NextResponse.json({
			success: true,
			message: "Đã lưu cấu hình AI Platform thành công! Mọi thay đổi áp dụng tức thì cho Voice Agent và Dify.",
			config: updatedConfig,
		});
	} catch (e: any) {
		console.error("Lỗi cập nhật cấu hình AI:", e);
		return NextResponse.json({ success: false, message: `Lỗi: ${e?.message}` }, { status: 500 });
	}
}
