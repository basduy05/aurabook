import { NextResponse } from "next/server";
import { exec } from "child_process";
import { updateGHNStatus, type GHNStatusCode } from "@/lib/shipping/ghn";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			trackingCode?: string;
			orderNumber?: string;
			orderId?: string;
			status: GHNStatusCode;
			description?: string;
		};

		const code = body.trackingCode || body.orderNumber || body.orderId;
		if (!code || !body.status) {
			return NextResponse.json(
				{ error: "Thiếu mã vận đơn (trackingCode/orderNumber) hoặc trạng thái mới." },
				{ status: 400 },
			);
		}

		const result = updateGHNStatus(code, body.status, body.description);

		// Synchronize to Saleor backend database
		if (result.shipment.orderNumber) {
			try {
				const cmd = `docker exec aurabook-backend python sync_ghn_saleor.py ${result.shipment.orderNumber} ${body.status}`;
				exec(cmd, (err, stdout) => {
					if (err) {
						console.warn("[GHN Sync to Saleor DB]", err.message);
					} else {
						console.log("[GHN Sync to Saleor DB Success]", stdout.trim());
					}
				});
			} catch (e) {
				console.warn("[GHN Sync to Saleor Error]", e);
			}
		}

		return NextResponse.json({
			ok: true,
			shipment: result.shipment,
			isCompleted: result.isCompleted,
			message:
				result.isCompleted
					? "GHN đã giao hàng thành công! Đơn hàng đã được đánh dấu là Hoàn tất (Completed)."
					: `Đã cập nhật trạng thái vận đơn GHN thành công: ${result.shipment.statusDisplay}`,
		});
	} catch (error) {
		console.error("[api/shipping/ghn/update-status] Error:", error);
		const msg = error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái GHN";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
