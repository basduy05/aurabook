import { NextResponse } from "next/server";
import { calculateGHNFeeAsync, type CalculateFeeInput } from "@/lib/shipping/ghn";

export async function POST(request: Request) {
	try {
		const raw = (await request.json()) as any;
		const input: CalculateFeeInput = {
			destinationProvince: raw.destinationProvince || raw.province || "",
			destinationDistrict: raw.destinationDistrict || raw.district || "",
			destinationWard: raw.destinationWard || raw.ward || undefined,
			orderValue: Number(raw.orderValue) || 0,
			weightGrams: Number(raw.weightGrams || raw.weight) || 500,
			serviceType: raw.serviceType || "standard",
		};
		const result = await calculateGHNFeeAsync(input);
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

	const result = await calculateGHNFeeAsync({
		destinationProvince: province,
		destinationDistrict: district,
		orderValue,
		weightGrams: weight,
		serviceType,
	});

	return NextResponse.json(result);
}
