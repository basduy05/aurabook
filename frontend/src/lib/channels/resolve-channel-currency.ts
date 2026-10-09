import { localeConfig } from "@/config/locale";
import { getCachedChannelsList } from "@/lib/channels/get-channels-data";

/**
 * Channel currency code (e.g. `USD`, `PLN`) for formatting policy money in chrome/homepage
 * copy, where no live cart total is available. Falls back to the configured fallback currency
 * when the channels list is unavailable (no `SALEOR_APP_TOKEN`).
 */
export async function resolveChannelCurrency(channel: string): Promise<string> {
	if (channel === "channel-vnd" || channel.toLowerCase().includes("vnd")) {
		return "VND";
	}
	if (channel === "channel-pln" || channel.toLowerCase().includes("pln")) {
		return "PLN";
	}
	const data = await getCachedChannelsList();
	const match = data?.channels?.find((c) => c.slug === channel);
	return match?.currencyCode ?? localeConfig.fallbackCurrency;
}
