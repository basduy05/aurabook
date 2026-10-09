import { NextResponse } from "next/server";
import { getGHNShipmentByOrder, createGHNShipment, getAllGHNShipments } from "@/lib/shipping/ghn";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code") || searchParams.get("orderNumber") || searchParams.get("orderId");

	if (!code) {
		const all = getAllGHNShipments();
		return NextResponse.json({ shipments: all });
	}

	let shipment = getGHNShipmentByOrder(code);

	// If not yet generated for an existing order, create standard GHN shipment
	if (!shipment && (code.startsWith("order-") || !isNaN(Number(code)) || code.length > 5)) {
		shipment = createGHNShipment({
			orderId: code,
			orderNumber: code,
			recipientName: "Độc giả Aurabook",
			recipientPhone: "0912345678",
			recipientAddress: "Toàn quốc, Việt Nam",
			province: "Hà Nội",
			district: "Cầu Giấy",
			itemsSummary: "Đơn hàng sách Aurabook",
			weightGrams: 500,
			serviceType: "standard",
		});
	}

	if (!shipment) {
		return NextResponse.json(
			{ error: `Không tìm thấy thông tin vận đơn GHN cho mã: ${code}` },
			{ status: 404 },
		);
	}

	return NextResponse.json({ shipment });
}
