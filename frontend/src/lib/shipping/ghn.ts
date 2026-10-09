import fs from "fs";
import path from "path";

// =============================================================================
// GHN Configuration & Warehouse Origin (Hà Nội, Việt Nam)
// =============================================================================

export interface GHNWarehouse {
	name: string;
	address: string;
	wardName: string;
	wardCode: string;
	districtName: string;
	districtId: number;
	provinceName: string;
	provinceId: number;
	phone: string;
	email: string;
}

export const HANOI_ORIGIN_WAREHOUSE: GHNWarehouse = {
	name: "Kho Tổng Aurabook Hà Nội",
	address: "Số 12 Duy Tân, Phường Dịch Vọng Hậu",
	wardName: "Phường Dịch Vọng Hậu",
	wardCode: "1A0107",
	districtName: "Quận Cầu Giấy",
	districtId: 1442,
	provinceName: "Thành phố Hà Nội",
	provinceId: 201,
	phone: "0912345678",
	email: "khohanoi@aurabook.vn",
};

export type GHNStatusCode =
	| "ready_to_pick"
	| "picking"
	| "storing"
	| "delivering"
	| "delivered"
	| "cancel"
	| "returned";

export interface GHNTrackingCheckpoint {
	status: GHNStatusCode;
	statusName: string;
	description: string;
	time: string;
	location: string;
}

export interface GHNShipment {
	id: string;
	orderId: string;
	orderNumber: string;
	trackingCode: string;
	carrier: "Giao Hàng Nhanh (GHN)";
	serviceType: "standard" | "express";
	serviceName: string;
	fee: number;
	codAmount: number;
	weightGrams: number;
	status: GHNStatusCode;
	statusDisplay: string;
	sender: {
		name: string;
		phone: string;
		address: string;
		warehouseName: string;
	};
	recipient: {
		name: string;
		phone: string;
		address: string;
		province: string;
		district: string;
		ward?: string;
	};
	itemsSummary: string;
	createdAt: string;
	estimatedDeliveryDate: string;
	deliveredAt?: string;
	history: GHNTrackingCheckpoint[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const GHN_FILE = path.join(DATA_DIR, "ghn_shipments.json");

function loadShipments(): GHNShipment[] {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		if (!fs.existsSync(GHN_FILE)) {
			fs.writeFileSync(GHN_FILE, JSON.stringify([], null, 2), "utf8");
			return [];
		}
		const content = fs.readFileSync(GHN_FILE, "utf8");
		return JSON.parse(content) as GHNShipment[];
	} catch (e) {
		console.error("[GHN] Failed to load shipments:", e);
		return [];
	}
}

function saveShipments(shipments: GHNShipment[]) {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		fs.writeFileSync(GHN_FILE, JSON.stringify(shipments, null, 2), "utf8");
	} catch (e) {
		console.error("[GHN] Failed to save shipments:", e);
	}
}

// =============================================================================
// Automatic Shipping Fee Calculation based on Origin (Hà Nội) to Destination
// =============================================================================

export interface CalculateFeeInput {
	destinationProvince?: string;
	destinationDistrict?: string;
	destinationWard?: string;
	weightGrams?: number;
	orderValue?: number;
	serviceType?: "standard" | "express";
}

export interface CalculateFeeOutput {
	fee: number;
	serviceType: "standard" | "express";
	serviceName: string;
	estimatedDays: string;
	isFreeShipping: boolean;
	originWarehouse: string;
}

export function calculateGHNFee(input: CalculateFeeInput): CalculateFeeOutput {
	const weight = input.weightGrams || 500;
	const orderValue = input.orderValue || 0;
	const province = (input.destinationProvince || "").toLowerCase().trim();
	const district = (input.destinationDistrict || "").toLowerCase().trim();
	const isExpress = input.serviceType === "express";

	// Free shipping threshold: 500,000 VND
	if (orderValue >= 500000 && !isExpress) {
		return {
			fee: 0,
			serviceType: "standard",
			serviceName: "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Freeship)",
			estimatedDays: "1 - 3 ngày",
			isFreeShipping: true,
			originWarehouse: HANOI_ORIGIN_WAREHOUSE.name,
		};
	}

	let baseFee = 22000;
	let estimatedDays = "2 - 3 ngày";

	const isHanoi =
		province.includes("hà nội") ||
		province.includes("ha noi") ||
		province.includes("hanoi") ||
		district.includes("cầu giấy") ||
		district.includes("hoàn kiếm") ||
		district.includes("đống đa") ||
		district.includes("ba đình");

	const innerHanoiDistricts = [
		"cầu giấy",
		"hoàn kiếm",
		"ba đình",
		"đống đa",
		"hai bà trưng",
		"thanh xuân",
		"tây hồ",
		"hoàng mai",
		"long biên",
		"nam từ liêm",
		"bắc từ liêm",
		"hà đông",
	];

	if (isHanoi) {
		const isInnerHanoi = innerHanoiDistricts.some((d) => district.includes(d));
		if (isExpress) {
			baseFee = 35000;
			estimatedDays = "Giao trong 2 - 4 giờ (Hỏa tốc)";
		} else if (isInnerHanoi) {
			baseFee = 16500;
			estimatedDays = "Giao trong ngày hoặc ngày mai";
		} else {
			baseFee = 22000;
			estimatedDays = "1 - 2 ngày";
		}
	} else {
		// Other regions from Hanoi Origin
		const northProvinces = [
			"hải phòng",
			"quảng ninh",
			"bắc ninh",
			"hải dương",
			"hưng yên",
			"hà nam",
			"nam định",
			"thái bình",
			"ninh bình",
			"vĩnh phúc",
			"phú thọ",
			"thái nguyên",
			"bắc giang",
		];
		const isNorth = northProvinces.some((p) => province.includes(p));

		const centralProvinces = [
			"thanh hóa",
			"nghệ an",
			"hà tĩnh",
			"quảng bình",
			"quảng trị",
			"thừa thiên huế",
			"huế",
			"đà nẵng",
			"quảng nam",
			"quảng ngãi",
			"bình định",
			"phú yên",
			"khánh hòa",
			"nha trang",
		];
		const isCentral = centralProvinces.some((p) => province.includes(p));

		if (isNorth) {
			baseFee = isExpress ? 45000 : 26000;
			estimatedDays = isExpress ? "1 ngày" : "2 ngày";
		} else if (isCentral) {
			baseFee = isExpress ? 50000 : 32000;
			estimatedDays = isExpress ? "1 - 2 ngày" : "2 - 3 ngày";
		} else {
			// South / TP. Hồ Chí Minh / Mekong Delta
			baseFee = isExpress ? 55000 : 35000;
			estimatedDays = isExpress ? "1 - 2 ngày" : "3 - 4 ngày";
		}
	}

	// Weight surcharge for books: +2,500đ per extra 500g above 1kg
	if (weight > 1000) {
		const extraKg = Math.ceil((weight - 1000) / 500);
		baseFee += extraKg * 2500;
	}

	const serviceName = isExpress
		? "Giao Hàng Nhanh (GHN) - Hỏa Tốc (Kho Hà Nội)"
		: "Giao Hàng Nhanh (GHN) - Tiêu Chuẩn (Kho Hà Nội)";

	return {
		fee: baseFee,
		serviceType: isExpress ? "express" : "standard",
		serviceName,
		estimatedDays,
		isFreeShipping: false,
		originWarehouse: HANOI_ORIGIN_WAREHOUSE.name,
	};
}

// =============================================================================
// GHN Shipment Management (Create, Track, Complete)
// =============================================================================

export function createGHNShipment(params: {
	orderId: string;
	orderNumber: string;
	recipientName: string;
	recipientPhone: string;
	recipientAddress: string;
	province: string;
	district: string;
	ward?: string;
	itemsSummary?: string;
	weightGrams?: number;
	codAmount?: number;
	serviceType?: "standard" | "express";
}): GHNShipment {
	const shipments = loadShipments();

	// Check if shipment already created for this order
	const existing = shipments.find(
		(s) => s.orderId === params.orderId || s.orderNumber === params.orderNumber,
	);
	if (existing) {
		return existing;
	}

	const feeInfo = calculateGHNFee({
		destinationProvince: params.province,
		destinationDistrict: params.district,
		destinationWard: params.ward,
		weightGrams: params.weightGrams,
		serviceType: params.serviceType,
	});

	// Generate standard GHN tracking number format (e.g. GHN83921045VN)
	const randomNum = Math.floor(10000000 + Math.random() * 90000000);
	const trackingCode = `GHN${randomNum}VN`;
	const now = new Date().toISOString();

	const estimatedDate = new Date();
	estimatedDate.setDate(estimatedDate.getDate() + (params.serviceType === "express" ? 1 : 3));

	const newShipment: GHNShipment = {
		id: `ship-${Date.now()}`,
		orderId: params.orderId,
		orderNumber: params.orderNumber,
		trackingCode,
		carrier: "Giao Hàng Nhanh (GHN)",
		serviceType: params.serviceType || "standard",
		serviceName: feeInfo.serviceName,
		fee: feeInfo.fee,
		codAmount: params.codAmount || 0,
		weightGrams: params.weightGrams || 500,
		status: "ready_to_pick",
		statusDisplay: "Chờ lấy hàng tại Kho Hà Nội",
		sender: {
			name: "Nhà sách Aurabook",
			phone: HANOI_ORIGIN_WAREHOUSE.phone,
			address: HANOI_ORIGIN_WAREHOUSE.address,
			warehouseName: HANOI_ORIGIN_WAREHOUSE.name,
		},
		recipient: {
			name: params.recipientName,
			phone: params.recipientPhone,
			address: params.recipientAddress,
			province: params.province,
			district: params.district,
			ward: params.ward,
		},
		itemsSummary: params.itemsSummary || "Sách AuraBook",
		createdAt: now,
		estimatedDeliveryDate: estimatedDate.toISOString(),
		history: [
			{
				status: "ready_to_pick",
				statusName: "Chờ lấy hàng",
				description: "Đơn hàng đã được tạo. Chờ GHN điều phối tài xế đến lấy hàng tại Kho Tổng Aurabook Hà Nội.",
				time: now,
				location: "Kho Tổng Aurabook Hà Nội - 12 Duy Tân, Cầu Giấy",
			},
		],
	};

	shipments.unshift(newShipment);
	saveShipments(shipments);
	return newShipment;
}

export function getGHNShipmentByOrder(orderIdOrNumber: string): GHNShipment | null {
	const shipments = loadShipments();
	return (
		shipments.find(
			(s) => s.orderId === orderIdOrNumber || s.orderNumber === orderIdOrNumber || s.trackingCode === orderIdOrNumber,
		) || null
	);
}

export function getAllGHNShipments(): GHNShipment[] {
	return loadShipments();
}

/**
 * Update GHN shipment status & trigger completion when status is "delivered"
 */
export function updateGHNStatus(
	trackingCodeOrOrder: string,
	newStatus: GHNStatusCode,
	customDescription?: string,
): { shipment: GHNShipment; isCompleted: boolean } {
	const shipments = loadShipments();
	const target = shipments.find(
		(s) =>
			s.trackingCode === trackingCodeOrOrder ||
			s.orderId === trackingCodeOrOrder ||
			s.orderNumber === trackingCodeOrOrder,
	);

	if (!target) {
		throw new Error(`Không tìm thấy vận đơn GHN với mã: ${trackingCodeOrOrder}`);
	}

	const now = new Date().toISOString();
	target.status = newStatus;

	const statusMap: Record<GHNStatusCode, { display: string; desc: string; loc: string }> = {
		ready_to_pick: {
			display: "Chờ lấy hàng",
			desc: "Chờ tài xế GHN đến nhận kiện hàng tại Kho Tổng Aurabook Hà Nội.",
			loc: "Kho Tổng Aurabook Hà Nội",
		},
		picking: {
			display: "Đang lấy hàng",
			desc: "Tài xế GHN đã tiếp nhận và đang trên đường đến Kho Hà Nội lấy hàng.",
			loc: "Cầu Giấy, Hà Nội",
		},
		storing: {
			display: "Đã nhập kho phân loại",
			desc: "Kiện hàng đã nhập trung tâm khai thác GHN Hà Nội và đang được luân chuyển.",
			loc: "Bưu cục Trung tâm GHN Hà Nội",
		},
		delivering: {
			display: "Đang giao hàng",
			desc: "Kiện hàng đã tới bưu cục phát. Shipper GHN đang trên đường giao đến bạn.",
			loc: target.recipient.province || "Bưu cục phát GHN",
		},
		delivered: {
			display: "Giao hàng thành công (Completed)",
			desc: "Người nhận đã nhận hàng thành công và thanh toán. Đơn hàng hoàn tất.",
			loc: target.recipient.address || "Địa chỉ người nhận",
		},
		cancel: {
			display: "Đã hủy giao",
			desc: "Vận đơn GHN đã được hủy theo yêu cầu.",
			loc: "Hệ thống GHN",
		},
		returned: {
			display: "Chuyển hoàn",
			desc: "Kiện hàng đang được hoàn về Kho Hà Nội.",
			loc: "Bưu cục GHN",
		},
	};

	const meta = statusMap[newStatus];
	target.statusDisplay = meta.display;

	if (newStatus === "delivered") {
		target.deliveredAt = now;
	}

	target.history.unshift({
		status: newStatus,
		statusName: meta.display,
		description: customDescription || meta.desc,
		time: now,
		location: meta.loc,
	});

	saveShipments(shipments);
	return { shipment: target, isCompleted: newStatus === "delivered" };
}
