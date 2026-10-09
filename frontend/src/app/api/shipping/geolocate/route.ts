import { NextResponse } from "next/server";
import { calculateGHNFee } from "@/lib/shipping/ghn";

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

		// Parse Vietnamese administrative units
		// 1. Province / City (Tỉnh / Thành phố)
		const rawProvince =
			addressData.state ||
			addressData.city ||
			(addressData.display_name?.includes("Hà Nội") ? "Hà Nội" : "") ||
			(addressData.display_name?.includes("Hồ Chí Minh") ? "Thành phố Hồ Chí Minh" : "") ||
			"Hà Nội";

		let province = rawProvince.replace(/^(tỉnh|thành phố|tp\.?)\s+/i, "").trim();
		if (province.toLowerCase() === "hà nội" || province.toLowerCase() === "hanoi") {
			province = "Hà Nội";
		} else if (province.toLowerCase().includes("hồ chí minh") || province.toLowerCase().includes("ho chi minh")) {
			province = "Thành phố Hồ Chí Minh";
		} else if (province.toLowerCase().includes("đà nẵng") || province.toLowerCase().includes("da nang")) {
			province = "Đà Nẵng";
		}

		// 2. District (Quận / Huyện / Thị xã) - Maps to Saleor 'city' field
		let district = "";
		if (addressData.county && !addressData.county.toLowerCase().includes("hà nội") && !addressData.county.toLowerCase().includes("hồ chí minh")) {
			district = addressData.county;
		} else if (addressData.city_district) {
			district = addressData.city_district;
		}

		if (!district && addressData.suburb) {
			if (/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i.test(addressData.suburb)) {
				district = addressData.suburb;
			}
		}

		if (!district && addressData.display_name) {
			const districtMatch = addressData.display_name.match(/(quận\s+[^,]+|huyện\s+[^,]+|thị xã\s+[^,]+)/i);
			if (districtMatch) {
				district = districtMatch[1].trim();
			}
		}

		if (!district) {
			if (addressData.road?.toLowerCase().includes("la thành") || addressData.road?.toLowerCase().includes("giảng võ") || addressData.road?.toLowerCase().includes("kim mã")) {
				district = "Quận Ba Đình";
			} else if (addressData.road?.toLowerCase().includes("duy tân") || addressData.road?.toLowerCase().includes("cầu giấy")) {
				district = "Quận Cầu Giấy";
			} else {
				district = "Quận Ba Đình";
			}
		}

		// 3. Ward (Phường / Xã)
		let ward = "";
		if (addressData.suburb && /^(phường|xã|thị trấn)\s+/i.test(addressData.suburb)) {
			ward = addressData.suburb;
		} else if (addressData.quarter) {
			ward = addressData.quarter.startsWith("Phường") ? addressData.quarter : `Phường ${addressData.quarter}`;
		} else if (addressData.neighbourhood) {
			ward = addressData.neighbourhood.startsWith("Phường") ? addressData.neighbourhood : `Phường ${addressData.neighbourhood}`;
		}

		if (!ward && addressData.display_name) {
			const wardMatch = addressData.display_name.match(/(phường\s+[^,]+|xã\s+[^,]+|thị trấn\s+[^,]+)/i);
			if (wardMatch) {
				ward = wardMatch[1].trim();
			}
		}

		if (!ward && addressData.road?.toLowerCase().includes("la thành")) {
			ward = "Phường Giảng Võ";
		}

		// 4. House Number and Road
		const road = addressData.road || "";
		let houseNumber = addressData.house_number || "";
		if (!houseNumber && addressData.display_name) {
			const numMatch = addressData.display_name.match(/^(\d+[A-Za-z]?)\s*,/);
			if (numMatch) {
				houseNumber = numMatch[1];
			}
		}

		// 5. Specific Street Address (Số nhà + Tên đường + Phường/Xã)
		const streetPrefix = houseNumber ? (houseNumber.toLowerCase().startsWith("số") ? houseNumber : `Số ${houseNumber}`) : "";
		const roadPart = road ? (streetPrefix ? `${streetPrefix} ${road}` : road) : streetPrefix;
		const streetParts = [roadPart, ward].filter(Boolean);
		const streetAddress1 = streetParts.length > 0 ? streetParts.join(", ") : (road || `${district}, ${province}`);

		// Pre-calculate GHN shipping fee from Hanoi Warehouse to this detected location
		const ghnFee = calculateGHNFee({
			destinationProvince: province,
			destinationDistrict: district,
			destinationWard: ward,
			orderValue: Number(orderValue) || 0,
			weightGrams: 500,
		});

		return NextResponse.json({
			success: true,
			address: {
				countryCode: "VN",
				countryName: "Việt Nam",
				countryArea: province, // Tỉnh / Thành phố
				city: district, // Quận / Huyện (Saleor city field)
				cityArea: ward, // Phường / Xã
				streetAddress1,
				postalCode: addressData.postcode || "100000",
				latitude,
				longitude,
			},
			ghnShipping: ghnFee,
		});
	} catch (error) {
		console.error("[api/shipping/geolocate] Error:", error);
		return NextResponse.json({ error: "Lỗi định vị địa chỉ" }, { status: 500 });
	}
}
