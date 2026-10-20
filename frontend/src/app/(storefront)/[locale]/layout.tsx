import "../../globals.css";
import { type ReactNode } from "react";
import { type Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { rootMetadata } from "@/lib/seo";
import { getConfiguredLocaleChannelPairs } from "@/config/locale-channel";
import {
	getDefaultLocaleSlug,
	getDefaultTimeZone,
	getStorefrontLocaleSlugs,
	isStorefrontLocaleSlug,
	resolveLocaleFromSlug,
} from "@/config/locale";
import { PersistBrowseLocaleCookie } from "@/ui/components/persist-browse-locale-cookie";
import { getRootHtmlFontProps } from "@/lib/fonts";
import { saleorMediaPreconnectOrigin } from "@/lib/images";
import { speedInsightsSampleRate } from "@/lib/speed-insights";
import { webAnalyticsEnabled } from "@/lib/analytics/web-analytics";
import { AnalyticsMount } from "@/ui/components/analytics-mount";
import { WebAnalytics } from "@/ui/components/web-analytics";

/**
 * Root defaults + `og:locale` derived from the URL locale segment. Params-only, so it
 * stays static under PPR. Browse pages that build their own OpenGraph block
 * (`buildBrowsePageMetadata`) replace this wholesale; everything else (login, account,
 * cart, …) inherits a locale-correct default instead of a hardcoded `en_US`.
 */
export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const definition = resolveLocaleFromSlug(isStorefrontLocaleSlug(locale) ? locale : getDefaultLocaleSlug());

	if (!rootMetadata.openGraph) return rootMetadata;
	return {
		...rootMetadata,
		openGraph: { ...rootMetadata.openGraph, locale: definition.ogLocale },
	};
}

export function generateStaticParams() {
	const pairs = getConfiguredLocaleChannelPairs();
	if (pairs) {
		const locales = [...new Set(pairs.map((pair) => pair.locale))];
		return locales.map((locale) => ({ locale }));
	}

	return getStorefrontLocaleSlugs().map((locale) => ({ locale }));
}

/**
 * Storefront root layout — renders `<html lang>` server-side from the URL locale segment.
 *
 * Invalid locale slugs fall back to the default `htmlLang` here so the not-found boundary
 * still has an HTML shell; the actual `notFound()` for invalid pairs lives in `[channel]/layout`.
 */
export default async function LocaleRootLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const localeSlug = isStorefrontLocaleSlug(locale) ? locale : getDefaultLocaleSlug();
	const htmlLang = resolveLocaleFromSlug(localeSlug).htmlLang;

	// Code-owned UI strings (next-intl). Locale comes from the URL segment (ADR 0001/0002),
	// not next-intl routing. `setRequestLocale` seeds the request config from our param so
	// message resolution stays static (no `headers()`) — preserves PPR / Cache Components.
	setRequestLocale(localeSlug);
	const messages = await getMessages();
	const htmlProps = getRootHtmlFontProps(htmlLang);
	const mediaOrigin = saleorMediaPreconnectOrigin();

	return (
		<html {...htmlProps}>
			<head>
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=aurabook5" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=aurabook5" />
				<link rel="shortcut icon" href="/favicon.ico?v=aurabook5" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=aurabook5" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap"
				/>
				{mediaOrigin && <link rel="preconnect" href={mediaOrigin} />}
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								if (typeof window === 'undefined') return;
								var origConsoleError = window.console.error;
								window.console.error = function() {
									var args = arguments;
									if (args.length === 0 || args[0] === undefined || args[0] === null || String(args[0]) === 'undefined' || String(args[0]).indexOf('UtilityScript') !== -1 || String(args[0]).indexOf('There is no child at offset') !== -1 || String(args[0]).indexOf("Failed to execute 'setEnd' on 'Range'") !== -1) {
										return;
									}
									try {
										var stack = new Error().stack || '';
										if (stack.indexOf('UtilityScript') !== -1) return;
									} catch(e) {}
									if (origConsoleError) origConsoleError.apply(console, args);
								};

								window.addEventListener('error', function(event) {
									var msg = (event && (event.message || (event.error && event.error.message))) || String((event && event.error) || '');
									if (!msg || msg === 'undefined' || msg.indexOf('UtilityScript') !== -1 || msg.indexOf("Failed to execute 'setEnd' on 'Range'") !== -1 || msg.indexOf("Failed to execute 'setStart' on 'Range'") !== -1 || msg.indexOf("There is no child at offset") !== -1 || (event && event.error && event.error.name === 'IndexSizeError')) {
										if (event.preventDefault) event.preventDefault();
										if (event.stopImmediatePropagation) event.stopImmediatePropagation();
										return true;
									}
								}, true);

								window.addEventListener('unhandledrejection', function(event) {
									var reason = event && event.reason;
									var reasonStr = String((reason && reason.message) || reason || '');
									if (!reason || reasonStr === 'undefined' || reasonStr === '' || reasonStr.indexOf('UtilityScript') !== -1 || reasonStr.indexOf("Failed to execute 'setEnd' on 'Range'") !== -1 || reasonStr.indexOf("There is no child at offset") !== -1 || (reason && reason.name === 'IndexSizeError')) {
										if (event.preventDefault) event.preventDefault();
										if (event.stopImmediatePropagation) event.stopImmediatePropagation();
									}
								}, true);
							})();
						`,
					}}
				/>
			</head>
			<body className="min-h-dvh font-sans">
				<NextIntlClientProvider locale={localeSlug} messages={messages} timeZone={getDefaultTimeZone()}>
					<PersistBrowseLocaleCookie locale={localeSlug} />
					{children}
					{/* Sampled — unsampled Speed Insights dominates the Vercel bill at scale. */}
					<SpeedInsights sampleRate={speedInsightsSampleRate()} />
					{/* Unsampled page views — the denominator; URLs are redacted in beforeSend. */}
					{webAnalyticsEnabled() && <WebAnalytics />}
				</NextIntlClientProvider>
				<AnalyticsMount />
			</body>
		</html>
	);
}
