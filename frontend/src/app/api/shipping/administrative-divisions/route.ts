import { NextResponse } from "next/server";
import {
	VIETNAM_PROVINCES,
	findProvince,
	isInnerCityAddress,
} from "@/lib/vietnam-administrative/data";

/**
 * API Danh mục địa danh hành chính Việt Nam chuẩn 2 cấp:
 * - Cấp 1: 63 Tỉnh / Thành phố trực thuộc Trung ương
 * - Cấp 2: Quận / Huyện / Thị xã / Thành phố thuộc tỉnh
 * - Trạng thái: Nội thành (Inner City) vs Ngoại thành / Tỉnh
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const province = searchParams.get("province");
	const district = searchParams.get("district");

	// 1. Kiểm tra trạng thái Nội thành trực tiếp (Cấp 1 & Cấp 2)
	if (province && district) {
		const isInnerCity = isInnerCityAddress(province, district);
		if (searchParams.get("checkInnerCity") === "true") {
			return NextResponse.json({
				success: true,
				province,
				district,
				isInnerCity,
			});
		}
	}

	// 2. Tra cứu danh sách Quận / Huyện theo Tỉnh / Thành phố (Cấp 2)
	if (province) {
		const foundProv = findProvince(province);
		if (!foundProv) {
			return NextResponse.json({ success: false, error: "Không tìm thấy Tỉnh / Thành phố" }, { status: 404 });
		}
		return NextResponse.json({
			success: true,
			province: foundProv.name,
			districts: foundProv.districts.map((d) => ({
				code: d.code,
				name: d.name,
				isInnerCity: d.isInnerCity,
			})),
		});
	}

	// 3. Mặc định trả về danh sách 63 Tỉnh / Thành phố (Cấp 1)
	return NextResponse.json({
		success: true,
		provinces: VIETNAM_PROVINCES.map((p) => ({
			code: p.code,
			name: p.name,
			type: p.type,
			districtCount: p.districts.length,
		})),
	});
}
