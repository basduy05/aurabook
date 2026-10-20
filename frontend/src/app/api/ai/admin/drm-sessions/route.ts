import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DRM_STORAGE_FILE = path.resolve(
	process.cwd(),
	"../ecommerce-ai-platform/data/drm_reader_sessions.json",
);

interface DrmSession {
	id: string;
	userEmail: string;
	bookTitle: string;
	bookSlug: string;
	currentPage: number;
	totalPages: number;
	progressPercent: number;
	activeTabLock: boolean;
	deviceInfo: string;
	lastActive: string;
	lcpLicenseId: string;
}

const DEFAULT_SESSIONS: DrmSession[] = [
	{
		id: "drm-sess-01",
		userEmail: "admin@aurabook.vn",
		bookTitle: "Sapiens: Lược Sử Loài Người",
		bookSlug: "sapiens-luoc-su-loai-nguoi",
		currentPage: 48,
		totalPages: 320,
		progressPercent: 15,
		activeTabLock: true,
		deviceInfo: "Windows 11 / Chrome (Readium LCP Web)",
		lastActive: new Date().toISOString(),
		lcpLicenseId: "LCP-VN-2026-9921",
	},
	{
		id: "drm-sess-02",
		userEmail: "reader.vip@aurabook.vn",
		bookTitle: "Nhà Giả Kim (The Alchemist)",
		bookSlug: "nha-gia-kim",
		currentPage: 112,
		totalPages: 228,
		progressPercent: 49,
		activeTabLock: true,
		deviceInfo: "Android App / Reader LCP Mobile",
		lastActive: new Date(Date.now() - 1800000).toISOString(),
		lcpLicenseId: "LCP-VN-2026-8834",
	},
];

function readDrmSessions(): DrmSession[] {
	try {
		if (fs.existsSync(DRM_STORAGE_FILE)) {
			const data = fs.readFileSync(DRM_STORAGE_FILE, "utf-8");
			const parsed = JSON.parse(data) as DrmSession[];
			if (Array.isArray(parsed)) return parsed;
		}
	} catch (e) {
		console.warn("[DRM Session] Lỗi đọc file storage:", e);
	}
	return DEFAULT_SESSIONS;
}

function writeDrmSessions(sessions: DrmSession[]) {
	try {
		const dir = path.dirname(DRM_STORAGE_FILE);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(DRM_STORAGE_FILE, JSON.stringify(sessions, null, 2), "utf-8");
	} catch (e) {
		console.error("[DRM Session] Lỗi ghi file storage:", e);
	}
}

export async function GET() {
	const sessions = readDrmSessions();
	return NextResponse.json({
		totalActiveReaders: sessions.filter((s) => s.activeTabLock).length,
		totalLicensedBooks: sessions.length,
		sessions,
	});
}

export async function POST(req: Request) {
	const body = (await req.json().catch(() => ({}))) as {
		action?: string;
		sessionId?: string;
		session?: Partial<DrmSession>;
	};
	const { action, sessionId, session } = body;
	let sessions = readDrmSessions();

	if (action === "unlock") {
		sessions = sessions.map((s) => (s.id === sessionId ? { ...s, activeTabLock: false } : s));
		writeDrmSessions(sessions);
		return NextResponse.json({ success: true, message: "Đã mở khóa phiên đọc thành công." });
	}

	if (action === "revoke") {
		sessions = sessions.filter((s) => s.id !== sessionId);
		writeDrmSessions(sessions);
		return NextResponse.json({ success: true, message: "Đã thu hồi giấy phép đọc của phiên này." });
	}

	if (action === "sync" && session && session.id) {
		const idx = sessions.findIndex((s) => s.id === session.id);
		if (idx >= 0) {
			sessions[idx] = { ...sessions[idx], ...session, lastActive: new Date().toISOString() };
		} else {
			sessions.unshift({
				id: session.id,
				userEmail: session.userEmail || "anonymous@aurabook.vn",
				bookTitle: session.bookTitle || "Sách điện tử AuraBook",
				bookSlug: session.bookSlug || "ebook",
				currentPage: session.currentPage || 1,
				totalPages: session.totalPages || 100,
				progressPercent: session.progressPercent || 1,
				activeTabLock: session.activeTabLock ?? true,
				deviceInfo: session.deviceInfo || "Web Browser",
				lastActive: new Date().toISOString(),
				lcpLicenseId: session.lcpLicenseId || `LCP-VN-${Date.now()}`,
			});
		}
		writeDrmSessions(sessions);
		return NextResponse.json({ success: true, message: "Đã đồng bộ phiên đọc thành công." });
	}

	return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
