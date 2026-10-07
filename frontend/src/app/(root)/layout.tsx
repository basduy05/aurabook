import "../globals.css";
import { type ReactNode } from "react";
import { rootMetadata } from "@/lib/seo";
import { getDefaultLocaleSlug, resolveLocaleFromSlug } from "@/config/locale";
import { getRootHtmlFontProps } from "@/lib/fonts";

export const metadata = rootMetadata;

/**
 * Root layout for locale-less top-level routes (`/` redirect and global fallbacks).
 *
 * One of the app's multiple root layouts: storefront (`[locale]`) and checkout each render
 * their own `<html>`. This one uses the default locale's `htmlLang` since it has no segment.
 */
export default function RootGroupLayout({ children }: { children: ReactNode }) {
	const htmlLang = resolveLocaleFromSlug(getDefaultLocaleSlug()).htmlLang;
	const htmlProps = getRootHtmlFontProps(htmlLang);

	return (
		<html {...htmlProps}>
			<head>
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=aurabook5" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=aurabook5" />
				<link rel="shortcut icon" href="/favicon.ico?v=aurabook5" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=aurabook5" />
			</head>
			<body className="min-h-dvh font-sans">{children}</body>
		</html>
	);
}
