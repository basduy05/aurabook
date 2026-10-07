"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function ConditionalFooter({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isCommunity = pathname?.includes("/community");

	if (isCommunity) {
		return null;
	}

	return <>{children}</>;
}
