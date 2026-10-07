/**
 * Exchange rates to VND (Vietnamese Dong).
 * Used when paying via Vietnamese payment gateways (VNPAY, MoMo)
 * which require integer VND currency amounts.
 */
export const EXCHANGE_RATES_TO_VND: Record<string, number> = {
	VND: 1,
	USD: 25400,
	EUR: 27500,
	GBP: 32500,
	JPY: 170,
	KRW: 19,
	AUD: 16500,
	SGD: 19000,
	CAD: 18500,
	PLN: 6400,
};

/**
 * Convert any currency amount to integer VND.
 * - If already VND (case-insensitive), returns Math.round(amount).
 * - If another currency (e.g. USD), multiplies by exchange rate and rounds to integer VND.
 */
export function convertToVnd(amount: number, currency: string = "VND"): number {
	const code = (currency || "VND").trim().toUpperCase();
	if (code === "VND") {
		return Math.round(amount);
	}
	const rate = EXCHANGE_RATES_TO_VND[code] ?? 25400;
	return Math.round(amount * rate);
}

/**
 * Format a number as VND currency string (e.g. "508.000 ₫")
 */
export function formatVnd(amount: number): string {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		maximumFractionDigits: 0,
	}).format(Math.round(amount));
}
