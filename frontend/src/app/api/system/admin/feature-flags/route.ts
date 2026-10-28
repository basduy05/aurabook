import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLAGS_FILE = path.resolve(process.cwd(), "data/feature_flags.json");

export interface SystemFeatureFlags {
	enableVoiceAgentWidget: boolean;
	enableGuestReadingTrial: boolean;
	enablePublicReviews: boolean;
	enableOfflineDrm: boolean;
	enableSimulatedPayments: boolean;
	maxOfflineDays: number;
	maxDrmDevices: number;
	updatedAt?: string;
}

const DEFAULT_FLAGS: SystemFeatureFlags = {
	enableVoiceAgentWidget: true,
	enableGuestReadingTrial: true,
	enablePublicReviews: true,
	enableOfflineDrm: true,
	enableSimulatedPayments: true,
	maxOfflineDays: 7,
	maxDrmDevices: 2,
	updatedAt: new Date().toISOString(),
};

function getFlags(): SystemFeatureFlags {
	try {
		if (fs.existsSync(FLAGS_FILE)) {
			const data = JSON.parse(fs.readFileSync(FLAGS_FILE, "utf-8"));
			return { ...DEFAULT_FLAGS, ...data };
		}
	} catch (e) {
		console.warn("[FeatureFlags] Lỗi đọc file:", e);
	}
	return DEFAULT_FLAGS;
}

function saveFlags(flags: Partial<SystemFeatureFlags>): SystemFeatureFlags {
	const current = getFlags();
	const updated: SystemFeatureFlags = {
		...current,
		...flags,
		updatedAt: new Date().toISOString(),
	};
	try {
		const dir = path.dirname(FLAGS_FILE);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(FLAGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
	} catch (e) {
		console.error("[FeatureFlags] Lỗi ghi file:", e);
	}
	return updated;
}

export async function GET() {
	return NextResponse.json({
		success: true,
		flags: getFlags(),
	});
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<SystemFeatureFlags>;
		const updated = saveFlags(body);
		return NextResponse.json({
			success: true,
			flags: updated,
			message: "Đã cập nhật cờ tính năng hệ thống thành công.",
		});
	} catch (err: any) {
		return NextResponse.json(
			{ success: false, error: err?.message || "Lỗi cập nhật feature flags" },
			{ status: 500 },
		);
	}
}
