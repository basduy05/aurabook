"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function ConditionalFooter({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isImmersive =
		pathname?.includes("/community") ||
		pathname?.includes("/reader") ||
		pathname?.includes("/search");

	if (isImmersive) {
		return null;
	}

	return <>{children}</>;
}
