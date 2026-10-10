import { NextResponse } from "next/server";
import { calculateGHNFeeAsync } from "@/lib/shipping/ghn";
import {
	findProvince,
	findDistrict,
	isInnerCityAddress,
} from "@/lib/vietnam-administrative/data";

export async function POST(request: Request) {
	try {
		const { latitude, longitude, orderValue } = (await request.json()) as {
			latitude: number;
			longitude: number;
			orderValue?: number;
		};

		if (!latitude || !longitude) {
			return NextResponse.json({ error: "Thiếu tọa độ GPS (latitude, longitude)" }, { status: 400 });
		}

		// Reverse geocode via OpenStreetMap Nominatim with Vietnamese language
		const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi&addressdetails=1`;
		
		let addressData: {
			city?: string;
			state?: string;
			county?: string;
			city_district?: string;
			suburb?: string;
			quarter?: string;
			neighbourhood?: string;
			road?: string;
			house_number?: string;
			postcode?: string;
			country_code?: string;
			display_name?: string;
			[key: string]: unknown;
		} = {};

		try {
			const res = await fetch(nominatimUrl, {
				headers: {
					"User-Agent": "Aurabook-Storefront/1.0 (contact@aurabook.vn)",
				},
				next: { revalidate: 3600 },
			});
			if (res.ok) {
				const json = (await res.json()) as any;
				addressData = json.address || {};
			}
		} catch (err) {
			console.warn("[geolocate] Nominatim lookup failed, falling back to bigdatacloud:", err);
			// Fallback to BigDataCloud free client API
			try {
				const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
				const bdcRes = await fetch(bdcUrl);
				if (bdcRes.ok) {
					const bdcJson = (await bdcRes.json()) as any;
					addressData = {
						state: bdcJson.principalSubdivision,
						city: bdcJson.city,
						suburb: bdcJson.locality,
						country_code: bdcJson.countryCode,
					};
				}
			} catch (fallbackErr) {
				console.error("[geolocate] All geocoders failed:", fallbackErr);
			}
		}

		// Parse Vietnamese administrative units (Chuẩn 2 cấp: Cấp 1 Tỉnh/Thành phố & Cấp 2 Quận/Huyện)
		// 1. Cấp 1: Tỉnh / Thành phố
		const rawProvinceCandidates = [
			addressData.state,
			addressData.city,
		].filter(Boolean) as string[];

		let detectedProv = findProvince(rawProvinceCandidates[0] || "");
		if (!detectedProv && addressData.display_name) {
			for (const p of ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"]) {
				if (addressData.display_name.includes(p)) {
					detectedProv = findProvince(p);
					break;
				}
			}
		}
		const province = detectedProv ? detectedProv.name : (rawProvinceCandidates[0] || "Thành phố Hà Nội");

		// 2. Cấp 2: Quận / Huyện / Thị xã / TP thuộc tỉnh
		const rawDistrictCandidates = [
			addressData.county,
			addressData.city_district,
			addressData.suburb,
		].filter(Boolean) as string[];

		let detectedDist: ReturnType<typeof findDistrict> | undefined;
		if (detectedProv) {
			for (const cand of rawDistrictCandidates) {
				detectedDist = findDistrict(detectedProv, cand);
				if (detectedDist) break;
			}
			if (!detectedDist && addressData.display_name) {
				for (const d of detectedProv.districts) {
					if (addressData.display_name.toLowerCase().includes(d.name.toLowerCase())) {
						detectedDist = d;
						break;
					}
				}
			}

			// Tra cứu dự phòng theo phường / đường phố nếu Nominatim không trả về quận huyện hoặc gán nhầm
			const textToScan = `${addressData.road || ""} ${addressData.suburb || ""} ${addressData.neighbourhood || ""} ${addressData.display_name || ""}`.toLowerCase();
			const isInnerHanoiCoords = detectedProv.name.includes("Hà Nội") && longitude > 105.70;
			const isSonTayCoords = detectedProv.name.includes("Hà Nội") && (longitude < 105.65 || /đường lâm|sơn tây/i.test(textToScan));

			if (detectedProv.name.includes("Hà Nội")) {
				// Nếu ở khu vực Sơn Tây / Đường Lâm (Kinh độ < 105.65 hoặc có từ khóa Đường Lâm/Sơn Tây)
				if (isSonTayCoords || /đường lâm|sơn tây|viên sơn|trung hưng|thanh mỹ|xuân khanh|kim sơn|sơn đông|cổ đông/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Thị xã Sơn Tây");
				} else if (isInnerHanoiCoords && /la thành|đê la thành/i.test(textToScan)) {
					// Chỉ gán Quận Đống Đa cho "La Thành" khi tọa độ thực sự ở vùng nội thành Hà Nội (Kinh độ > 105.70)
					detectedDist = findDistrict(detectedProv, "Quận Đống Đa");
				} else if (/ngọc hà|liễu giai|kim mã|giảng võ|điện biên|quán thánh|trúc bạch|cống vị|đội cấn|thành công|vĩnh phúc|phúc xá|ngọc khánh|hoàng hoa thám/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Ba Đình");
				} else if (/dịch vọng|mai dịch|nghĩa tân|nghĩa đô|yên hòa|trung hòa|quan hoa|duy tân|xuân thủy|cầu giấy|trần duy hưng|hoàng quốc việt/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Cầu Giấy");
				} else if (/hàng bạc|hàng đào|tràng tiền|lý thái tổ|đồng xuân|cửa nam|hoàn kiếm|đinh tiên hoàng|phố huế|bà triệu/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Hoàn Kiếm");
				} else if (/ô chợ dừa|láng hạ|láng thượng|văn miếu|quốc tử giám|khâm thiên|kim liên|đống đa|thái hà|thái thịnh|chùa bộc|hoàng cầu|tôn đức thắng/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Đống Đa");
				} else if (/bạch mai|bách khoa|minh khai|trương định|hai bà trưng|thanh nhàn|đại cồ việt/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Hai Bà Trưng");
				} else if (/khương trung|khương mai|nhân chính|thanh xuân|nguyễn trãi|nguyễn tuân|lê văn lương/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Thanh Xuân");
				} else if (/mỹ đình|mễ trì|cầu diễn|tây mỗ|đại mỗ|nam từ liêm|trung văn/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Nam Từ Liêm");
				} else if (/xuân đỉnh|cổ nhuế|đông ngạc|bắc từ liêm|thụy phương/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Bắc Từ Liêm");
				} else if (/quang trung|hà cầu|vạn phúc|mộ lao|văn quán|hà đông|la khê/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Hà Đông");
				} else if (/bưởi|thụy khuê|quảng an|xuân la|yên phụ|tây hồ|nhật tân/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Tây Hồ");
				} else if (/giáp bát|hoàng liệt|định công|tân mai|hoàng mai|linh đàm/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Hoàng Mai");
				} else if (/bồ đề|gia thụy|ngọc lâm|sài đồng|long biên|việt hưng/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận Long Biên");
				}
			} else if (detectedProv.name.includes("Hồ Chí Minh")) {
				if (/bến nghé|bến thành|cầu kho|đa kao|tân định/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Quận 1");
				} else if (/thảo điền|an phú|thủ thiêm|thủ đức/i.test(textToScan)) {
					detectedDist = findDistrict(detectedProv, "Thành phố Thủ Đức");
				}
			}
		}

		// Tuyệt đối không gán chuỗi cấp 3 (Phường/Xã) vào trường cấp 2 (Quận/Huyện)
		const fallbackDistrict = (detectedProv?.districts[0]?.name) || "Quận Cầu Giấy";
		const validCandidate = rawDistrictCandidates.find((c) => !c.startsWith("Phường") && !c.startsWith("Xã") && !c.startsWith("Thị trấn"));
		const district = detectedDist ? detectedDist.name : (validCandidate || fallbackDistrict);

		// 3. Đường / Phố & Số nhà (Địa chỉ cụ thể)
		const road: string =
			(typeof addressData.road === "string" ? addressData.road : "") ||
			(typeof addressData.pedestrian === "string" ? String(addressData.pedestrian) : "") ||
			(typeof addressData.street === "string" ? String(addressData.street) : "") ||
			"";
		let houseNumber = addressData.house_number || "";
		if (!houseNumber && addressData.display_name) {
			const numMatch = addressData.display_name.match(/^(\d+[A-Za-z]?)\s*,/);
			if (numMatch) {
				houseNumber = numMatch[1];
			}
		}

		// Địa chỉ chi tiết (streetAddress1): Số nhà + tên đường (tuyệt đối KHÔNG chứa Toàn quốc, Việt Nam)
		let streetAddress1 = "";
		if (houseNumber && road) {
			const prefix = houseNumber.toLowerCase().startsWith("số") ? houseNumber : `Số ${houseNumber}`;
			streetAddress1 = `${prefix} ${road}`;
		} else if (road) {
			streetAddress1 = road;
		} else if (houseNumber) {
			streetAddress1 = houseNumber.toLowerCase().startsWith("số") ? houseNumber : `Số ${houseNumber}`;
		}

		// Pre-calculate GHN shipping fee directly from GHN API
		const ghnFee = await calculateGHNFeeAsync({
			destinationProvince: province,
			destinationDistrict: district,
			orderValue: Number(orderValue) || 0,
			weightGrams: 500,
		});

		// 4. Kiểm tra điều kiện Nội thành (Level 2: Quận nội thành)
		const isInnerCity = detectedDist ? detectedDist.isInnerCity : isInnerCityAddress(province, district);
		const hasHouseNumber = Boolean(houseNumber && houseNumber.trim().length > 0);

		return NextResponse.json({
			success: true,
			address: {
				countryCode: "VN",
				countryName: "Việt Nam",
				countryArea: province, // Cấp 1: Tỉnh / Thành phố
				city: district, // Cấp 2: Quận / Huyện (Saleor city field)
				cityArea: "",
				streetAddress1,
				postalCode: addressData.postcode || "100000",
				latitude,
				longitude,
				houseNumber,
				road,
				hasHouseNumber,
				isInnerCity,
			},
			isInnerCity,
			hasHouseNumber,
			warningMessage: !hasHouseNumber
				? (road ? `Đã nhận diện đường ${road} — Vui lòng bổ sung Số nhà / Căn hộ cụ thể` : "Chưa nhận diện được số nhà — Vui lòng nhập bổ sung Số nhà, tên đường")
				: undefined,
			ghnShipping: ghnFee,
		});
	} catch (error) {
		console.error("[api/shipping/geolocate] Error:", error);
		return NextResponse.json({ error: "Lỗi định vị địa chỉ" }, { status: 500 });
	}
}
