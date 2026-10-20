"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function ConditionalHeader({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isReader = pathname?.includes("/reader");

	if (isReader) {
		return null;
	}

	return <>{children}</>;
}
