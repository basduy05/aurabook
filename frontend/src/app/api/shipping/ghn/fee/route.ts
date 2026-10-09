import { NextResponse } from "next/server";
import { calculateGHNFee, type CalculateFeeInput } from "@/lib/shipping/ghn";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as CalculateFeeInput;
		const result = calculateGHNFee(body);
		return NextResponse.json(result);
	} catch (error) {
		console.error("[api/shipping/ghn/fee] Error calculating fee:", error);
		return NextResponse.json(
			{ error: "Không thể tính phí vận chuyển GHN" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const province = searchParams.get("province") || "";
	const district = searchParams.get("district") || "";
	const orderValue = Number(searchParams.get("orderValue") || 0);
	const weight = Number(searchParams.get("weight") || 500);
	const serviceType = (searchParams.get("serviceType") as "standard" | "express") || "standard";

	const result = calculateGHNFee({
		destinationProvince: province,
		destinationDistrict: district,
		orderValue,
		weightGrams: weight,
		serviceType,
	});

	return NextResponse.json(result);
}
