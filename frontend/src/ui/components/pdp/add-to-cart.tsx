"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { ShoppingBag, BookOpen, ShieldCheck } from "lucide-react";
import { bumpChromeVersion } from "@/lib/chrome-sync";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { DiscountPercentLabel } from "@/ui/components/ui/sale-label";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import { Loader } from "@/ui/atoms/loader";
import { AudioTeaserPlayer } from "./audio-teaser-player";
import { cn } from "@/lib/utils";

interface AddToCartProps {
	price: string;
	compareAtPrice?: string | null;
	discountPercent?: number | null;
	disabled?: boolean;
	disabledReason?: "no-selection" | "out-of-stock";
	secureCheckoutLabel: string;
	freeShippingTrustLabel?: string | null;
	productSlug?: string;
	productName?: string;
}

function AddToCartButton({
	disabled,
	disabledReason,
}: {
	disabled?: boolean;
	disabledReason?: "no-selection" | "out-of-stock";
}) {
	const { pending } = useFormStatus();
	const t = useTranslations("pdp");

	// The add-to-cart action re-renders this tab via `refresh()`; other tabs sync
	// their cart chrome on next focus. Bump on the pending→idle edge — the form
	// action API gives the client no other completion callback.
	const wasPending = useRef(false);
	useEffect(() => {
		if (wasPending.current && !pending) {
			bumpChromeVersion();
		}
		wasPending.current = pending;
	}, [pending]);

	const getButtonText = () => {
		if (pending) return t("adding");
		if (!disabled) return t("addToBag");
		if (disabledReason === "out-of-stock") return t("outOfStock");
		return t("selectOptions");
	};

	return (
		<Button
			type="submit"
			size="lg"
			disabled={disabled || pending}
			className={cn("h-14 w-full text-base font-medium transition-all duration-200", pending && "opacity-80")}
		>
			{pending ? (
				<Loader key="cart-loader" size="sm" className="mr-2 text-primary-foreground fill-primary-foreground" />
			) : (
				<ShoppingBag key="cart-icon" className={cn("mr-2 h-5 w-5 transition-transform", pending && "scale-90")} />
			)}
			<span key="cart-text">{getButtonText()}</span>
		</Button>
	);
}

export function AddToCart({
	price,
	compareAtPrice,
	discountPercent,
	disabled = false,
	disabledReason,
	secureCheckoutLabel,
	freeShippingTrustLabel,
	productSlug,
	productName,
}: AddToCartProps) {
	const defaultEpubMap: Record<string, string> = {
		"dac-nhan-tam": "/books/dac-nhan-tam.epub",
		"bon-thoa-uoc": "/books/bon-thoa-uoc.epub",
		"sapiens-luoc-su-loai-nguoi": "/books/sapiens-luoc-su-loai-nguoi.epub",
		"tri-tue-do-thai": "/books/tri-tue-do-thai.epub",
	};
	const resolvedEpub =
		(productSlug && defaultEpubMap[productSlug]) ||
		(productSlug ? `/books/${productSlug}.epub` : "/books/dac-nhan-tam.epub");
	const trialLink = `/reader/${productSlug || "sample-book"}?mode=trial&epub=${encodeURIComponent(resolvedEpub)}${productName ? `&title=${encodeURIComponent(productName)}` : ""}`;

	return (
		<div className="space-y-4">
			<div className="flex items-baseline gap-3">
				<span className="text-2xl font-semibold tabular-nums tracking-tight">{price}</span>
				{compareAtPrice && (
					<>
						<span className="text-lg tabular-nums text-muted-foreground line-through">{compareAtPrice}</span>
						{discountPercent ? <DiscountPercentLabel percent={discountPercent} /> : null}
					</>
				)}
			</div>

			<AddToCartButton disabled={disabled} disabledReason={disabledReason} />

			{/* Reader DRM 15-Page Preview Action */}
			<div className="flex items-center justify-between gap-3 rounded-card border border-border bg-muted/40 p-3 text-xs transition-colors hover:bg-muted/60">
				<LinkWithChannel
					href={trialLink}
					className="flex items-center gap-2 font-medium text-foreground hover:underline"
				>
					<BookOpen className="h-4 w-4 text-primary" />
					<span>Đọc thử 15 trang đầu (Tài khoản đã đăng ký)</span>
				</LinkWithChannel>
				<Badge variant="success" className="gap-1 text-[11px]">
					<ShieldCheck className="h-3 w-3" />
					<span>Bản quyền DRM</span>
				</Badge>
			</div>

			{/* Audiobook Teaser Audio Preview (aurabook_apps.audio) */}
			<AudioTeaserPlayer />

			<div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
					{secureCheckoutLabel}
				</span>
				{freeShippingTrustLabel ? (
					<span className="flex items-center gap-1.5">
						<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path d="M9 22V12h6v10" />
						</svg>
						{freeShippingTrustLabel}
					</span>
				) : null}
			</div>
		</div>
	);
}
