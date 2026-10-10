import type { DeliveryOption, ServerCheckout } from "@/checkout/lib/checkout-types";

export function shippingDeliveriesCacheKey(checkout: ServerCheckout): string | null {
	const addressId = checkout.shippingAddress?.id;
	if (!addressId) return null;
	return `${checkout.id}:${addressId}`;
}

/** Pick a delivery id from user selection, free shipping eligibility, saved checkout, or first available option. */
export function resolveSelectedDeliveryId(
	current: string | undefined,
	deliveries: DeliveryOption[],
	savedDeliveryId: string | undefined,
): string | undefined {
	if (current && deliveries.some((d) => d.id === current)) return current;
	// Prioritize free shipping if eligible
	const freeOption = deliveries.find((d) => d.shippingMethod?.price?.amount === 0);
	if (freeOption) return freeOption.id;
	if (savedDeliveryId && deliveries.some((d) => d.id === savedDeliveryId)) return savedDeliveryId;
	return deliveries[0]?.id;
}
