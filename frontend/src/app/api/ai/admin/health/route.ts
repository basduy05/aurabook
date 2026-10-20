import { NextResponse } from "next/server";

interface ServiceHealth {
	id: string;
	name: string;
	category: "Core AI" | "Voice & WebRTC" | "Storefront & UI" | "Commerce & Data" | "Local Speech Engine";
	port: number;
	url: string;
	status: "online" | "offline" | "degraded";
	latencyMs: number;
	details: string;
	lastChecked: string;
}

async function checkUrl(url: string, timeoutMs = 2500): Promise<{ ok: boolean; latency: number; details: string }> {
	const start = Date.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
		clearTimeout(timeout);
		const latency = Date.now() - start;
		return {
			ok: res.status < 500,
			latency,
			details: `HTTP ${res.status} (${res.statusText || "OK"})`,
		};
	} catch (err: any) {
		const latency = Date.now() - start;
		const msg = err?.name === "AbortError" ? "Hết thời gian chờ (Timeout)" : "Chưa khởi động (Connection refused)";
		return {
			ok: false,
			latency,
			details: msg,
		};
	}
}

export async function GET() {
	const now = new Date().toISOString();

	// Kiểm tra song song các cổng dịch vụ thực tế đang chạy trên máy
	const [piperCheck, ollamaCheck, storefrontCheck, backendCheck, mailpitCheck, difyCheck, livekitCheck] =
		await Promise.all([
			checkUrl("http://localhost:5050/health"),
			checkUrl("http://localhost:11434/api/tags"),
			checkUrl("http://localhost:3000/api/health").catch(() => checkUrl("http://localhost:3000")),
			checkUrl("http://localhost:8000"),
			checkUrl("http://localhost:8025"),
			checkUrl("http://localhost:8080"),
			checkUrl("http://localhost:7880"),
		]);

	const services: ServiceHealth[] = [
		{
			id: "piper-tts-server",
			name: "AuraBook Piper TTS Server (Mô hình Hoài My 1000-Epoch)",
			category: "Local Speech Engine",
			port: 5050,
			url: "http://localhost:5050/health",
			status: piperCheck.ok ? "online" : "offline",
			latencyMs: piperCheck.latency,
			details: piperCheck.ok
				? `Đang phục vụ giọng đọc studio Hoài My (${piperCheck.latency}ms)`
				: "Chưa bật server python aurabook_piper_tts_server.py",
			lastChecked: now,
		},
		{
			id: "ollama-service",
			name: "Ollama Local LLM Daemon (qwen2.5:3b)",
			category: "Core AI",
			port: 11434,
			url: "http://localhost:11434",
			status: ollamaCheck.ok ? "online" : "offline",
			latencyMs: ollamaCheck.latency,
			details: ollamaCheck.ok
				? `Mô hình qwen2.5:3b sẵn sàng phản hồi (${ollamaCheck.latency}ms)`
				: "Dịch vụ Ollama chưa chạy trên cổng 11434",
			lastChecked: now,
		},
		{
			id: "storefront-nextjs",
			name: "AuraBook Storefront & Web Reader (Next.js)",
			category: "Storefront & UI",
			port: 3000,
			url: "http://localhost:3000",
			status: storefrontCheck.ok ? "online" : "offline",
			latencyMs: storefrontCheck.latency,
			details: storefrontCheck.ok
				? `Ứng dụng Next.js đang hoạt động mượt mà (${storefrontCheck.latency}ms)`
				: "Máy chủ Next.js chưa khởi động",
			lastChecked: now,
		},
		{
			id: "saleor-backend",
			name: "Saleor Core Backend (Python / Django)",
			category: "Commerce & Data",
			port: 8000,
			url: "http://localhost:8000",
			status: backendCheck.ok ? "online" : "offline",
			latencyMs: backendCheck.latency,
			details: backendCheck.ok
				? `API GraphQL & CSDL sách sẵn sàng (${backendCheck.latency}ms)`
				: "Backend Saleor cổng 8000 chưa phản hồi",
			lastChecked: now,
		},
		{
			id: "mailpit-sandbox",
			name: "Mailpit SMTP & Email Testing Sandbox",
			category: "Commerce & Data",
			port: 8025,
			url: "http://localhost:8025",
			status: mailpitCheck.ok ? "online" : "offline",
			latencyMs: mailpitCheck.latency,
			details: mailpitCheck.ok
				? `Dịch vụ gửi nhận thư thử nghiệm hoạt động (${mailpitCheck.latency}ms)`
				: "Hộp thư Mailpit chưa kích hoạt",
			lastChecked: now,
		},
		{
			id: "dify-rag",
			name: "Dify Core RAG Knowledge Base",
			category: "Core AI",
			port: 8080,
			url: "http://localhost:8080",
			status: difyCheck.ok ? "online" : "offline",
			latencyMs: difyCheck.latency,
			details: difyCheck.ok
				? `Hệ thống Dify RAG đang kết nối (${difyCheck.latency}ms)`
				: "Container Dify chưa khởi chạy (Chế độ Ollama nội bộ đang thay thế)",
			lastChecked: now,
		},
		{
			id: "livekit-server",
			name: "LiveKit WebRTC Server",
			category: "Voice & WebRTC",
			port: 7880,
			url: "http://localhost:7880",
			status: livekitCheck.ok ? "online" : "offline",
			latencyMs: livekitCheck.latency,
			details: livekitCheck.ok
				? `Máy chủ luồng thoại LiveKit hoạt động (${livekitCheck.latency}ms)`
				: "Container LiveKit chưa chạy (Chế độ Audio Stream HTTP đang phục vụ)",
			lastChecked: now,
		},
	];

	const overallOnline = services.filter((s) => s.status === "online").length;
	const systemStatus = overallOnline >= 4 ? "healthy" : overallOnline >= 2 ? "degraded" : "down";

	return NextResponse.json({
		systemStatus,
		onlineCount: overallOnline,
		totalCount: services.length,
		services,
		timestamp: now,
	});
}
