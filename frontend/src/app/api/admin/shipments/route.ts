import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { updateGHNStatus, type GHNStatusCode } from "@/lib/shipping/ghn";

const SHIPMENTS_FILE = path.resolve(process.cwd(), "data/ghn_shipments.json");

function readShipments(): any[] {
	try {
		if (fs.existsSync(SHIPMENTS_FILE)) {
			return JSON.parse(fs.readFileSync(SHIPMENTS_FILE, "utf-8"));
		}
	} catch (e) {
		console.error("[Admin Shipments] Error reading:", e);
	}
	return [];
}

export async function GET() {
	const shipments = readShipments();
	return NextResponse.json({
		success: true,
		total: shipments.length,
		shipments,
	});
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			code: string;
			status: GHNStatusCode;
			description?: string;
		};

		if (!body.code || !body.status) {
			return NextResponse.json(
				{ success: false, error: "Thiếu mã vận đơn hoặc trạng thái" },
				{ status: 400 },
			);
		}

		const result = updateGHNStatus(body.code, body.status, body.description);
		return NextResponse.json({
			success: true,
			shipment: result.shipment,
			isCompleted: result.isCompleted,
			message: `Đã cập nhật trạng thái vận đơn thành công: ${result.shipment.statusDisplay}`,
		});
	} catch (err: any) {
		return NextResponse.json(
			{ success: false, error: err?.message || "Lỗi cập nhật vận đơn" },
			{ status: 500 },
		);
	}
}
