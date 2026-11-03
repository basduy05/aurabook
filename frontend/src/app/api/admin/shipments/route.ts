import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { queryDb } from "@/lib/server-db";
import { updateGHNStatus, calculateGHNFee, type GHNStatusCode } from "@/lib/shipping/ghn";

const SHIPMENTS_FILE = path.resolve(process.cwd(), "data/ghn_shipments.json");

function readStoredShipments(): any[] {
	try {
		if (fs.existsSync(SHIPMENTS_FILE)) {
			return JSON.parse(fs.readFileSync(SHIPMENTS_FILE, "utf-8"));
		}
	} catch (e) {
		console.error("[Admin Shipments] Error reading:", e);
	}
	return [];
}

function writeStoredShipments(shipments: any[]) {
	try {
		const dir = path.dirname(SHIPMENTS_FILE);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(SHIPMENTS_FILE, JSON.stringify(shipments, null, 2), "utf-8");
	} catch (e) {
		console.error("[Admin Shipments] Error writing:", e);
	}
}

export async function GET() {
	try {
		// 1. Lấy toàn bộ đơn hàng thực tế từ cơ sở dữ liệu PostgreSQL của Saleor
		const ordersQuery = `
			SELECT 
				o.id AS order_id,
				o.number AS order_number,
				o.status AS order_status,
				o.created_at,
				o.total_gross_amount,
				o.user_email,
				COALESCE(NULLIF(sa.first_name, ''), NULLIF(ba.first_name, ''), '') AS first_name,
				COALESCE(NULLIF(sa.last_name, ''), NULLIF(ba.last_name, ''), '') AS last_name,
				COALESCE(NULLIF(sa.phone, ''), NULLIF(ba.phone, ''), '') AS phone,
				COALESCE(NULLIF(sa.street_address_1, ''), NULLIF(ba.street_address_1, ''), '') AS street_address,
				COALESCE(NULLIF(sa.city, ''), NULLIF(ba.city, ''), 'Hà Nội') AS city,
				COALESCE(NULLIF(sa.country_area, ''), NULLIF(ba.country_area, ''), 'Thành phố Hà Nội') AS province,
				COALESCE(
					json_agg(
						json_build_object(
							'product_name', l.product_name,
							'product_sku', l.product_sku,
							'quantity', l.quantity,
							'unit_price', l.unit_price_gross_amount
						)
					) FILTER (WHERE l.id IS NOT NULL),
					'[]'
				) AS items
			FROM order_order o
			LEFT JOIN account_address sa ON o.shipping_address_id = sa.id
			LEFT JOIN account_address ba ON o.billing_address_id = ba.id
			LEFT JOIN order_orderline l ON l.order_id = o.id
			GROUP BY o.id, o.number, o.status, o.created_at, o.total_gross_amount, o.user_email,
			         sa.first_name, sa.last_name, sa.phone, sa.street_address_1, sa.city, sa.country_area,
			         ba.first_name, ba.last_name, ba.phone, ba.street_address_1, ba.city, ba.country_area
			ORDER BY o.created_at DESC;
		`;

		let dbOrders: any[] = [];
		try {
			dbOrders = await queryDb(ordersQuery);
		} catch (dbErr) {
			console.error("[Admin Shipments] DB Query failed:", dbErr);
		}

		const storedShipments = readStoredShipments();
		let hasChanges = false;

		// 2. Đồng bộ từng đơn hàng trong Database với danh sách Vận đơn GHN
		const syncedShipments: any[] = [];

		for (const order of dbOrders) {
			const orderNumStr = String(order.order_number);
			let shipment = storedShipments.find(
				(s: any) => String(s.orderNumber) === orderNumStr || s.orderId === order.order_id,
			);

			// Tạo họ tên đầy đủ
			const fullName = [order.first_name, order.last_name].filter(Boolean).join(" ").trim() ||
				(order.user_email ? order.user_email.split("@")[0] : "Khách hàng");
			const phone = order.phone || "0912345678";
			const address = order.street_address || "Địa chỉ mặc định";
			const province = order.province || "Hà Nội";
			const district = order.city || "Hà Nội";

			// Tổng hợp sản phẩm
			const items: any[] = Array.isArray(order.items) ? order.items : [];
			const itemsSummary = items.length > 0
				? items.map((i: any) => `${i.product_name} (x${i.quantity})`).join(", ")
				: `Đơn hàng #${orderNumStr}`;

			// Phân loại đơn hàng số (Sách điện tử Ebook DRM) vs Đơn hàng vật lý (Sách giấy giao GHN)
			const isPureDigital = items.length > 0 && items.every((i: any) => {
				const sku = (i.product_sku || i.sku || "").toUpperCase();
				const name = (i.product_name || "").toLowerCase();
				return sku.startsWith("EB-") || name.includes("ebook") || name.includes("sách điện tử");
			});

			if (!shipment) {
				if (isPureDigital) {
					// Đơn hàng Ebook: Không phát sinh vận chuyển GHN vật lý
					shipment = {
						id: `ship-order-${orderNumStr}`,
						orderId: order.order_id,
						orderNumber: orderNumStr,
						orderStatus: order.order_status,
						trackingCode: "DRM-EBOOK-ONLINE",
						carrier: "Phân phối số (Aura DRM Web Reader)",
						serviceType: "digital",
						serviceName: "Kích hoạt nội dung số trực tuyến",
						fee: 0,
						codAmount: 0,
						totalAmount: Number(order.total_gross_amount) || 0,
						weightGrams: 0,
						status: "delivered",
						statusDisplay: "Đã kích hoạt tủ sách",
						isDigital: true,
						sender: {
							name: "Kho Sách Số AuraBook",
							phone: "0912345678",
							address: "Nền tảng xuất bản số AuraBook DRM Gateway",
							district: "Cầu Giấy",
							province: "Hà Nội",
						},
						recipient: {
							name: fullName,
							phone,
							address: "Tài khoản độc giả trực tuyến",
							district: "Online",
							province: "Online",
						},
						items: items.length > 0 ? items : [{ name: `Ebook #${orderNumStr}`, quantity: 1, weightGrams: 0 }],
						itemsSummary,
						logs: [
							{
								status: "delivered",
								statusDisplay: "Bản quyền Readium LCP đã cấp phát cho tài khoản",
								location: "AuraBook DRM Web Reader Gateway",
								timestamp: order.created_at || new Date().toISOString(),
								note: "Đơn hàng sách điện tử thanh toán hoàn tất, kích hoạt tự động vào Tủ sách",
							},
						],
					};
				} else {
					// Đơn hàng Sách giấy vật lý: Tự động sinh mã vận đơn chuẩn GHN
					const hashNum = Math.abs(
						orderNumStr.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7911),
					);
					const randomNum = 10000000 + (hashNum % 90000000);
					const trackingCode = `GHN${randomNum}VN`;

					let initialStatus: GHNStatusCode = "ready_to_pick";
					let initialDisplay = "Chờ lấy hàng";
					if (order.order_status === "canceled") {
						initialStatus = "cancel";
						initialDisplay = "Đã hủy đơn hàng";
					} else if (order.order_status === "fulfilled") {
						initialStatus = "delivered";
						initialDisplay = "Giao thành công";
					}

					const feeInfo = calculateGHNFee({
						destinationProvince: province,
						destinationDistrict: district,
					});

					shipment = {
						id: `ship-order-${orderNumStr}`,
						orderId: order.order_id,
						orderNumber: orderNumStr,
						orderStatus: order.order_status,
						trackingCode,
						carrier: "Giao Hàng Nhanh (GHN)",
						serviceType: "standard",
						serviceName: feeInfo.serviceName || "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Kho Hà Nội)",
						fee: feeInfo.fee || 22000,
						codAmount: 0,
						totalAmount: Number(order.total_gross_amount) || 0,
						weightGrams: 500,
						status: initialStatus,
						statusDisplay: initialDisplay,
						isDigital: false,
					sender: {
						name: "Nhà sách Aurabook",
						phone: "0912345678",
						address: "Số 12 Duy Tân, Phường Dịch Vọng Hậu",
						warehouseName: "Kho Tổng Aurabook Hà Nội",
					},
					recipient: {
						name: fullName,
						phone,
						address,
						province,
						district,
					},
					itemsSummary,
					createdAt: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
					history: [
						{
							status: initialStatus,
							statusName: initialDisplay,
							description: order.order_status === "canceled"
								? "Đơn hàng đã được hủy trên hệ thống AuraBook."
								: "Đơn hàng đã được tạo và đồng bộ với hệ thống Giao Hàng Nhanh.",
							time: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
							location: "Kho Tổng Aurabook Hà Nội - 12 Duy Tân, Cầu Giấy",
						},
					],
				};
				}
				storedShipments.unshift(shipment);
				hasChanges = true;
			} else {
				// Cập nhật thông tin mới nhất từ DB vào shipment
				shipment.orderStatus = order.order_status;
				shipment.totalAmount = Number(order.total_gross_amount) || shipment.totalAmount || 0;
				if (isPureDigital) {
					shipment.isDigital = true;
					shipment.trackingCode = "DRM-EBOOK-ONLINE";
					shipment.carrier = "Phân phối số (Aura DRM Web Reader)";
					shipment.serviceType = "digital";
					shipment.serviceName = "Kích hoạt nội dung số trực tuyến";
					shipment.fee = 0;
					shipment.codAmount = 0;
					if (shipment.status === "ready_to_pick" || shipment.status === "picking") {
						shipment.status = "delivered";
						shipment.statusDisplay = "Đã kích hoạt tủ sách";
					}
					if (shipment.recipient) {
						shipment.recipient.address = "Tài khoản độc giả trực tuyến (DRM Web Reader)";
					}
					hasChanges = true;
				}
				shipment.isDigital = isPureDigital;
				if (isPureDigital) {
					shipment.trackingCode = "DRM-EBOOK-ONLINE";
					shipment.carrier = "Phân phối số (Aura DRM Web Reader)";
					shipment.serviceType = "digital";
					shipment.serviceName = "Kích hoạt nội dung số trực tuyến";
					shipment.fee = 0;
					shipment.weightGrams = 0;
					shipment.status = "delivered";
					shipment.statusDisplay = "Đã kích hoạt tủ sách";
				}
				if (itemsSummary && itemsSummary !== `Đơn hàng #${orderNumStr}`) {
					shipment.itemsSummary = itemsSummary;
				}
				if (fullName && (!shipment.recipient.name || shipment.recipient.name === "Khách hàng")) {
					shipment.recipient.name = fullName;
				}
				if (phone && (!shipment.recipient.phone || shipment.recipient.phone === "0912345678")) {
					shipment.recipient.phone = phone;
				}

				// Đồng bộ trạng thái: nếu đơn hàng bị hủy trong Saleor thì trạng thái GHN chuyển sang cancel
				if (order.order_status === "canceled" && shipment.status !== "cancel") {
					shipment.status = "cancel";
					shipment.statusDisplay = "Đã hủy đơn hàng";
					shipment.history = shipment.history || [];
					shipment.history.unshift({
						status: "cancel",
						statusName: "Đã hủy đơn hàng",
						description: "Đơn hàng đã hủy trên hệ thống AuraBook, vận đơn GHN tự động ngừng xử lý.",
						time: new Date().toISOString(),
						location: "Hệ thống Quản trị AuraBook",
					});
					hasChanges = true;
				} else if (order.order_status === "fulfilled" && shipment.status === "ready_to_pick") {
					shipment.status = "delivered";
					shipment.statusDisplay = "Giao thành công";
					hasChanges = true;
				}
			}

			syncedShipments.push(shipment);
		}

		if (hasChanges) {
			writeStoredShipments(storedShipments);
		}

		// Trả về danh sách đã sắp xếp mới nhất
		return NextResponse.json({
			success: true,
			total: syncedShipments.length,
			shipments: syncedShipments,
		});
	} catch (err: any) {
		console.error("[Admin Shipments GET] Error:", err);
		// Fallback sang đọc file nếu có lỗi DB
		const fallback = readStoredShipments();
		return NextResponse.json({
			success: true,
			total: fallback.length,
			shipments: fallback,
		});
	}
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

		// 1. Cập nhật trạng thái GHN trong file JSON
		const result = updateGHNStatus(body.code, body.status, body.description);
		const shipment = result.shipment;

		// 2. Đồng bộ 2 chiều sang cơ sở dữ liệu Saleor PostgreSQL
		if (shipment && shipment.orderNumber) {
			try {
				if (body.status === "cancel") {
					// Nếu hủy vận đơn -> cập nhật đơn hàng thành canceled
					await queryDb("UPDATE order_order SET status = 'canceled' WHERE number = $1", [
						String(shipment.orderNumber),
					]);
				} else if (body.status === "delivered") {
					// Nếu giao thành công -> cập nhật đơn hàng thành fulfilled
					await queryDb("UPDATE order_order SET status = 'fulfilled' WHERE number = $1", [
						String(shipment.orderNumber),
					]);
				} else if (
					body.status === "ready_to_pick" ||
					body.status === "picking" ||
					body.status === "delivering" ||
					body.status === "storing"
				) {
					// Đang xử lý / Chờ xuất kho
					await queryDb("UPDATE order_order SET status = 'unfulfilled' WHERE number = $1 AND status != 'canceled'", [
						String(shipment.orderNumber),
					]);
				}
			} catch (dbSyncErr) {
				console.warn("[Admin Shipments POST] Đồng bộ DB Saleor cảnh báo:", dbSyncErr);
			}
		}

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
