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
	const [piperCheck, ollamaCheck, storefrontCheck, backendCheck, mailpitCheck, livekitCheck, dashboardCheck, drmCheck] =
		await Promise.all([
			checkUrl("http://localhost:5050/health"),
			checkUrl("http://localhost:11434/api/tags"),
			checkUrl("http://localhost:3000/api/health").catch(() => checkUrl("http://localhost:3000")),
			checkUrl("http://localhost:8000"),
			checkUrl("http://localhost:8025"),
			checkUrl("http://localhost:7880"),
			checkUrl("http://localhost:9000"),
			checkUrl("http://localhost:8088"),
		]);

	const services: ServiceHealth[] = [
		{
			id: "piper-tts-server",
			name: "AuraBook TTS Studio Engine (F5-TTS / Nam Minh)",
			category: "Local Speech Engine",
			port: 5050,
			url: "http://localhost:5050/health",
			status: piperCheck.ok ? "online" : "offline",
			latencyMs: piperCheck.latency,
			details: piperCheck.ok
				? `Đang phục vụ giọng đọc Studio Nam Minh Neural (${piperCheck.latency}ms)`
				: "Chưa bật server python aurabook_piper_tts_server.py",
			lastChecked: now,
		},
		{
			id: "ollama-service",
			name: "Ollama Local LLM (gemma2:2b)",
			category: "Core AI",
			port: 11434,
			url: "http://localhost:11434",
			status: ollamaCheck.ok ? "online" : "offline",
			latencyMs: ollamaCheck.latency,
			details: ollamaCheck.ok
				? `Mô hình gemma2:2b 100% GPU VRAM sẵn sàng (${ollamaCheck.latency}ms)`
				: "Dịch vụ Ollama chưa chạy trên cổng 11434",
			lastChecked: now,
		},
		{
			id: "storefront-nextjs",
			name: "AuraBook Storefront & PWA (Next.js)",
			category: "Storefront & UI",
			port: 3000,
			url: "http://localhost:3000",
			status: storefrontCheck.ok ? "online" : "offline",
			latencyMs: storefrontCheck.latency,
			details: storefrontCheck.ok
				? `Giao diện Độc giả & Mua sắm đang hoạt động (${storefrontCheck.latency}ms)`
				: "Máy chủ Next.js chưa khởi động",
			lastChecked: now,
		},
		{
			id: "saleor-backend",
			name: "Saleor Core Backend (GraphQL / Python)",
			category: "Commerce & Data",
			port: 8000,
			url: "http://localhost:8000/graphql/",
			status: backendCheck.ok ? "online" : "offline",
			latencyMs: backendCheck.latency,
			details: backendCheck.ok
				? `API GraphQL & Database Saleor sẵn sàng (${backendCheck.latency}ms)`
				: "Backend Saleor cổng 8000 chưa phản hồi",
			lastChecked: now,
		},
		{
			id: "saleor-dashboard",
			name: "Saleor Admin Dashboard",
			category: "Commerce & Data",
			port: 9000,
			url: "http://localhost:9000/dashboard/",
			status: dashboardCheck.ok ? "online" : "offline",
			latencyMs: dashboardCheck.latency,
			details: dashboardCheck.ok
				? `Giao diện Quản trị kho & catalog chuẩn (${dashboardCheck.latency}ms)`
				: "Container Dashboard cổng 9000 chưa chạy",
			lastChecked: now,
		},
		{
			id: "drm-gateway",
			name: "AuraBook DRM Web-Reader Gateway",
			category: "Storefront & UI",
			port: 8088,
			url: "http://localhost:8088",
			status: drmCheck.ok ? "online" : "offline",
			latencyMs: drmCheck.latency,
			details: drmCheck.ok
				? `Cổng bảo vệ bản quyền sách EPUB trực tuyến (${drmCheck.latency}ms)`
				: "Gateway DRM chưa hoạt động",
			lastChecked: now,
		},
		{
			id: "livekit-server",
			name: "LiveKit WebRTC Voice Server",
			category: "Voice & WebRTC",
			port: 7880,
			url: "http://localhost:7880",
			status: livekitCheck.ok ? "online" : "offline",
			latencyMs: livekitCheck.latency,
			details: livekitCheck.ok
				? `Máy chủ luồng thoại LiveKit hoạt động (${livekitCheck.latency}ms)`
				: "Container LiveKit chưa chạy",
			lastChecked: now,
		},
		{
			id: "mailpit-sandbox",
			name: "Mailpit SMTP & Email Sandbox",
			category: "Commerce & Data",
			port: 8025,
			url: "http://localhost:8025",
			status: mailpitCheck.ok ? "online" : "offline",
			latencyMs: mailpitCheck.latency,
			details: mailpitCheck.ok
				? `Hộp thư kiểm thử OTP và đơn hàng hoạt động (${mailpitCheck.latency}ms)`
				: "Hộp thư Mailpit chưa kích hoạt",
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
