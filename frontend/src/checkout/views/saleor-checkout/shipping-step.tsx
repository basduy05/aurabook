"use client";

import { useState, useCallback, useMemo, type FC } from "react";
import { Truck, Clock, Leaf, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { cn } from "@/lib/utils";
import { updateCheckoutDeliveryMethod } from "@/app/(checkout)/actions";
import { availabilityIssueFromFieldErrors } from "@/checkout/lib/checkout-availability";
import { validateCheckoutFulfillment } from "@/checkout/lib/validate-checkout-fulfillment";
import { useCheckoutAvailability } from "@/checkout/providers/checkout-availability";
import { type CheckoutFragment } from "@/checkout/graphql";
import type { DeliveryOption, ServerCheckout } from "@/checkout/lib/checkout-types";
import { hasDeliveryProblem } from "@/checkout/lib/delivery-problems";
import { resolveSelectedDeliveryId } from "@/checkout/lib/shipping-deliveries";
import {
	CheckoutSummaryContext,
	buildShippingSummaryRows,
	useCheckoutSummaryLabels,
} from "./checkout-summary-context";
import { formatShippingPrice } from "@/checkout/lib/utils/money";
import { MobileStickyAction } from "./mobile-sticky-action";
import { useCheckoutStepNumber } from "@/checkout/hooks/use-checkout-steps";
import { useTranslations } from "next-intl";

interface ShippingStepProps {
	checkout: CheckoutFragment;
	deliveries: DeliveryOption[];
	isLoadingDeliveries: boolean;
	onBack: () => void;
	onComplete: (checkout: ServerCheckout) => void;
}

export const ShippingStep: FC<ShippingStepProps> = ({
	checkout,
	deliveries,
	isLoadingDeliveries,
	onBack,
	onComplete,
}) => {
	const t = useTranslations("checkout");
	const tActions = useTranslations("checkout.actions");
	const shippingStep = useCheckoutStepNumber("SHIPPING", true);
	const summaryLabels = useCheckoutSummaryLabels();
	const summaryRows = useMemo(
		() => buildShippingSummaryRows(checkout, summaryLabels),
		[checkout, summaryLabels],
	);
	const hasShippingAddress = !!checkout.shippingAddress;
	const savedDeliveryId = checkout.delivery?.id;

	const isVietnam = checkout.shippingAddress?.country?.code === "VN";
	const filteredDeliveries = useMemo(() => {
		if (!isVietnam) return deliveries;
		// For Vietnam, prioritize Vietnamese domestic shipping methods (GHN) and hide demo foreign options
		const domestic = deliveries.filter((d) => {
			const name = (d.shippingMethod?.name || "").toLowerCase();
			return (
				name.includes("ghn") ||
				name.includes("giao hàng") ||
				name.includes("tiêu chuẩn") ||
				name.includes("hỏa tốc")
			);
		});
		return domestic.length > 0 ? domestic : deliveries;
	}, [deliveries, isVietnam]);

	const [userSelectedMethod, setUserSelectedMethod] = useState<string | undefined>();
	const selectedMethod = resolveSelectedDeliveryId(userSelectedMethod, filteredDeliveries, savedDeliveryId);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { availabilityIssue, setAvailabilityIssue } = useCheckoutAvailability();

	const showInvalidWarning =
		hasDeliveryProblem(checkout, "CheckoutProblemDeliveryMethodInvalid") &&
		selectedMethod === savedDeliveryId;

	const handleSubmit = useCallback(
		async (event?: React.FormEvent) => {
			event?.preventDefault();
			if (isSubmitting) return;

			if (!selectedMethod) {
				setError(t("errors.selectShippingMethod"));
				(document.querySelector('input[name="shipping"]') as HTMLElement | null)?.focus();
				return;
			}

			setIsSubmitting(true);
			setError(null);
			setAvailabilityIssue(null);

			try {
				let nextCheckout = checkout;
				if (selectedMethod !== savedDeliveryId) {
					const result = await updateCheckoutDeliveryMethod(checkout.id, selectedMethod);
					if (!result.ok) {
						const issue = result.fieldErrors?.length
							? availabilityIssueFromFieldErrors(checkout.lines, result.fieldErrors)
							: null;
						if (issue) {
							setAvailabilityIssue(issue);
						} else {
							setError(
								result.error ?? result.fieldErrors?.[0]?.message ?? t("errors.updateShippingMethodFailed"),
							);
						}
						setIsSubmitting(false);
						return;
					}
					nextCheckout = result.checkout;
				}

				const fulfillment = await validateCheckoutFulfillment(
					nextCheckout,
					t("errors.fulfillmentCheckFailed"),
				);
				if (!fulfillment.ok) {
					if (fulfillment.reason === "availability") {
						setAvailabilityIssue(fulfillment.issue);
					} else {
						setError(fulfillment.error);
					}
					setIsSubmitting(false);
					return;
				}

				onComplete(nextCheckout);
			} catch {
				setError(t("errors.fulfillmentCheckFailed"));
				setIsSubmitting(false);
			}
		},
		[selectedMethod, savedDeliveryId, onComplete, checkout, isSubmitting, setAvailabilityIssue, t],
	);

	const showSpinner = isLoadingDeliveries && !isSubmitting && filteredDeliveries.length === 0;
	const canContinue =
		!isSubmitting && filteredDeliveries.length > 0 && !!selectedMethod && !showSpinner && !availabilityIssue;
	const buttonText = isSubmitting
		? tActions("saving")
		: showSpinner
			? tActions("loading")
			: tActions("continueToPayment");

	return (
		<form className="space-y-8" onSubmit={handleSubmit}>
			<CheckoutSummaryContext checkout={checkout} rows={summaryRows} onGoToStep={onBack} />

			{showInvalidWarning ? (
				<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
					<p className="text-sm text-amber-800">
						Your previously selected shipping method is no longer available. Please select a new one.
					</p>
				</div>
			) : null}

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">{t("shipping.methodTitle")}</h2>

				{error ? <p className="text-sm text-destructive">{error}</p> : null}

				{showSpinner ? (
					<div className="flex items-center gap-3 rounded-lg border border-border p-4">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
						<p className="text-sm text-muted-foreground">{t("shipping.loadingMethods")}</p>
					</div>
				) : filteredDeliveries.length === 0 ? (
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
						<p className="text-sm text-amber-800">
							{!hasShippingAddress
								? t("shipping.noAddressYet")
								: `No shipping methods available for ${
										checkout.shippingAddress?.country?.country || "your address"
									}. Please check your address or contact support.`}
						</p>
					</div>
				) : (
					<div className={cn("space-y-3", isSubmitting && "pointer-events-none opacity-60")}>
						{filteredDeliveries.map((delivery) => {
							const method = delivery.shippingMethod;
							if (!method) return null;

							const isSelected = selectedMethod === delivery.id;
							const name = method.name.toLowerCase();
							const Icon =
								name.includes("express") || name.includes("fast")
									? Clock
									: name.includes("eco") || name.includes("green")
										? Leaf
										: Truck;
							const isEco = name.includes("eco") || name.includes("green");
							const isFree = method.price?.amount === 0;

							return (
								<label
									key={delivery.id}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
										"focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2",
										isSelected
											? "border-foreground bg-secondary/50"
											: "border-border hover:border-muted-foreground/50",
									)}
								>
									<input
										type="radio"
										name="shipping"
										value={delivery.id}
										checked={isSelected}
										onChange={() => {
											setUserSelectedMethod(delivery.id);
											setError(null);
										}}
										className="sr-only"
									/>
									<div
										className={cn(
											"flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
											isSelected ? "border-foreground" : "border-muted-foreground/50",
										)}
									>
										{isSelected ? <div className="h-2.5 w-2.5 rounded-full bg-foreground" /> : null}
									</div>
									{method.name.includes("GHN") ? (
										<img
											src="/images/ghn-logo.webp"
											alt="GHN"
											className="h-6 w-auto object-contain bg-white rounded px-1 py-0.5 border border-border/40 shrink-0"
										/>
									) : (
										<Icon className={cn("h-5 w-5", isEco ? "text-green-600" : "text-muted-foreground")} />
									)}
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium">{method.name}</span>
											{method.name.includes("GHN") && (
												<span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
													GHN Express
												</span>
											)}
											{isFree && (
												<span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
													Miễn phí vận chuyển
												</span>
											)}
											{isEco ? (
												<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
													Eco
												</span>
											) : null}
										</div>
										{method.name.includes("GHN") ? (
											<p className="text-xs text-muted-foreground mt-0.5">
												Xuất phát từ Kho Tổng Aurabook (12 Duy Tân, Cầu Giấy, Hà Nội) • {method.minimumDeliveryDays || 1}-{method.maximumDeliveryDays || 3} ngày{isFree ? " • Ưu đãi đơn hàng từ 500.000 ₫" : ""}
											</p>
										) : method.minimumDeliveryDays && method.maximumDeliveryDays ? (
											<p className="text-sm text-muted-foreground">
												{method.minimumDeliveryDays}-{method.maximumDeliveryDays} business days
											</p>
										) : null}
									</div>
									<span className={cn("font-medium", isFree && "font-semibold text-emerald-600 dark:text-emerald-400")}>
										{formatShippingPrice(method.price)}
									</span>
								</label>
							);
						})}
					</div>
				)}
			</section>

			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ChevronLeft className="h-4 w-4" />
					{tActions("returnToInformation")}
				</button>
				<Button type="submit" disabled={!canContinue} className="hidden h-12 px-8 md:flex">
					{buttonText}
				</Button>
			</div>

			<MobileStickyAction
				step={shippingStep}
				isShippingRequired={true}
				type="submit"
				isLoading={showSpinner || isSubmitting}
				disabled={!canContinue}
				loadingText={isSubmitting ? tActions("saving") : tActions("loading")}
			/>
		</form>
	);
};
