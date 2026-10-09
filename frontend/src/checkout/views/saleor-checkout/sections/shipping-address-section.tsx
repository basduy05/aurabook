"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Loader2, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { Label } from "@/ui/components/ui/label";
import { FormSelect, FieldError, AddressFields } from "../address-form-fields";
import { HybridAddressSelector } from "@/checkout/components/shipping-address";
import type { ShippingCountryOption } from "@/checkout/lib/checkout-types";
import type { CountryCode, AddressFragment } from "@/checkout/graphql";
import type { AddressField } from "@/checkout/components/address-form/types";

// =============================================================================
// Types
// =============================================================================

interface ShippingAddressSectionProps {
	/** True while session refresh is in flight after sign-in (avoids guest form flash) */
	isLoading?: boolean;

	// Auth state
	isAuthenticated: boolean;
	userAddresses: AddressFragment[];
	defaultAddressId?: string;

	// Address selection (logged-in users)
	selectedAddressId: string | null;
	onSelectAddress: (id: string | null) => void;
	showNewAddressForm: boolean;
	onShowNewAddressForm: (show: boolean) => void;

	// Address form (guests/new address)
	countryCode: CountryCode;
	onCountryChange: (code: string) => void;
	availableCountries: ShippingCountryOption[];
	formData: Record<string, string>;
	onFieldChange: (field: string, value: string) => void;
	errors: Record<string, string>;

	// Address field configuration (from useAddressFormUtils)
	orderedAddressFields: AddressField[];
	getFieldLabel: (field: AddressField) => string;
	isRequiredField: (field: AddressField) => boolean;
	countryAreaChoices?: Array<{ raw?: unknown; verbose?: unknown }>;
	checkoutSubtotal?: number;
}

// =============================================================================
// Component
// =============================================================================

export const ShippingAddressSection: FC<ShippingAddressSectionProps> = ({
	isLoading = false,
	isAuthenticated,
	userAddresses,
	defaultAddressId,
	selectedAddressId,
	onSelectAddress,
	showNewAddressForm,
	onShowNewAddressForm,
	countryCode,
	onCountryChange,
	availableCountries,
	formData,
	onFieldChange,
	errors,
	checkoutSubtotal,
	orderedAddressFields,
	getFieldLabel,
	isRequiredField,
	countryAreaChoices,
}) => {
	const t = useTranslations("checkout.shipping");
	const hasAddresses = userAddresses.length > 0;
	const showAddressList = isAuthenticated && hasAddresses && !showNewAddressForm;

	const [isLocating, setIsLocating] = useState(false);
	const [locationStatus, setLocationStatus] = useState<{
		type: "success" | "error" | "prompt";
		message: string;
		detectedInfo?: string;
		ghnFee?: number;
	} | null>(null);

	const handleDetectLocation = () => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			setLocationStatus({
				type: "error",
				message: "Trình duyệt của bạn không hỗ trợ định vị GPS.",
			});
			return;
		}

		setIsLocating(true);
		setLocationStatus({
			type: "prompt",
			message: "Đang yêu cầu quyền truy cập vị trí. Vui lòng nhấn 'Cho phép' trên trình duyệt...",
		});

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				try {
					const res = await fetch("/api/shipping/geolocate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							latitude,
							longitude,
							orderValue: checkoutSubtotal || 0,
						}),
					});

					if (!res.ok) {
						throw new Error("Không thể phân tích địa chỉ từ tọa độ.");
					}

					const data = (await res.json()) as any;
					if (data.success && data.address) {
						const addr = data.address;
						if (countryCode !== "VN") onCountryChange("VN");

						// Match province with Saleor countryAreaChoices
						let matchedCountryArea = addr.countryArea;
						if (countryAreaChoices && countryAreaChoices.length > 0) {
							const norm = (s: string) => s.toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, "").trim();
							const target = norm(addr.countryArea);
							const found = countryAreaChoices.find((c) => {
								const rawStr = typeof c.raw === "string" ? c.raw : "";
								const verboseStr = typeof c.verbose === "string" ? c.verbose : "";
								return (
									norm(rawStr) === target ||
									norm(verboseStr) === target ||
									rawStr.toLowerCase().includes(target) ||
									verboseStr.toLowerCase().includes(target)
								);
							});
							if (found && typeof found.raw === "string") {
								matchedCountryArea = found.raw;
							}
						}

						if (matchedCountryArea) onFieldChange("countryArea", matchedCountryArea);
						if (addr.city) onFieldChange("city", addr.city);
						if (addr.cityArea) onFieldChange("cityArea", addr.cityArea);
						if (addr.streetAddress1) onFieldChange("streetAddress1", addr.streetAddress1);
						if (addr.postalCode) onFieldChange("postalCode", addr.postalCode);

						const isFreeShipping =
							(checkoutSubtotal != null && checkoutSubtotal >= 500000) ||
							data.ghnShipping?.isFreeShipping ||
							data.ghnShipping?.fee === 0;

						const feeFormatted = isFreeShipping
							? "Miễn phí (Freeship)"
							: typeof data.ghnShipping?.fee === "number"
								? new Intl.NumberFormat("vi-VN").format(data.ghnShipping.fee) + " ₫"
								: "22.000 ₫";

						setLocationStatus({
							type: "success",
							message: `Đã tự động điền địa chỉ nhận hàng chính xác! (Cước GHN: ${feeFormatted})`,
							detectedInfo: `${addr.streetAddress1}, ${addr.city}, ${addr.countryArea}`,
							ghnFee: isFreeShipping ? 0 : data.ghnShipping?.fee,
						});
					} else {
						throw new Error("Không nhận diện được địa chỉ.");
					}
				} catch (err) {
					console.error("Geolocate error:", err);
					setLocationStatus({
						type: "error",
						message: "Không thể lấy thông tin địa chỉ từ vị trí GPS. Vui lòng nhập thủ công.",
					});
				} finally {
					setIsLocating(false);
				}
			},
			(geoError) => {
				setIsLocating(false);
				if (geoError.code === geoError.PERMISSION_DENIED) {
					setLocationStatus({
						type: "error",
						message: "Bạn đã từ chối quyền vị trí. Vui lòng nhập địa chỉ nhận hàng bên dưới.",
					});
				} else {
					setLocationStatus({
						type: "error",
						message: "Không thể định vị GPS. Vui lòng nhập địa chỉ nhận hàng bằng tay.",
					});
				}
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
		);
	};

	if (isLoading) {
		return (
			<section className="space-y-4">
				<div className="h-7 w-40 animate-pulse rounded bg-muted" />
				<div className="h-24 animate-pulse rounded-lg bg-muted" />
			</section>
		);
	}

	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">{t("addressTitle")}</h2>

			{showAddressList ? (
				<>
					<HybridAddressSelector
						addresses={userAddresses}
						selectedAddressId={selectedAddressId}
						onSelectAddress={onSelectAddress}
						defaultAddressId={defaultAddressId}
						emptyMessage={t("emptySavedShipping")}
						addressType="SHIPPING"
						sheetTitle={t("selectShippingAddressSheet")}
						onAddNew={() => onShowNewAddressForm(true)}
					/>
					{errors.address && <FieldError error={errors.address} />}
				</>
			) : (
				<>
					{/* Back to saved addresses link (for logged-in users) */}
					{isAuthenticated && hasAddresses && showNewAddressForm && (
						<button
							type="button"
							onClick={() => onShowNewAddressForm(false)}
							className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground hover:no-underline"
						>
							{t("backToSavedAddresses")}
						</button>
					)}

					{/* Auto-detect Location with GPS permission prompt & GHN calculation */}
					<div className="rounded-xl border border-border bg-card p-4 space-y-3 text-card-foreground shadow-sm transition-all">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div className="space-y-0.5">
								<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
									<MapPin className="h-4 w-4 text-primary shrink-0" />
									<span>Tự động nhận diện địa chỉ nhận hàng</span>
								</div>
								<p className="text-[12px] text-muted-foreground">
									Hệ thống sẽ định vị GPS để tự động điền địa chỉ nhận hàng chính xác và tính cước GHN từ Kho Hà Nội.
								</p>
							</div>
							<button
								type="button"
								onClick={handleDetectLocation}
								disabled={isLocating}
								className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-60 shrink-0 cursor-pointer"
							>
								{isLocating ? (
									<>
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
										<span>Đang xác định vị trí...</span>
									</>
								) : (
									<>
										<MapPin className="h-3.5 w-3.5" />
										<span>Lấy vị trí hiện tại</span>
									</>
								)}
							</button>
						</div>

						{locationStatus && (
							<div
								className={`rounded-lg p-3 text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200 border ${
									locationStatus.type === "success"
										? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
										: locationStatus.type === "prompt"
										? "bg-secondary border-border text-foreground"
										: "bg-destructive/10 border-destructive/20 text-destructive"
								}`}
							>
								{locationStatus.type === "success" && (
									<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
								)}
								{locationStatus.type === "prompt" && (
									<Loader2 className="h-4 w-4 text-primary animate-spin shrink-0 mt-0.5" />
								)}
								{locationStatus.type === "error" && (
									<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
								)}
								<div className="space-y-1 flex-1">
									<p className="font-semibold">{locationStatus.message}</p>
									{locationStatus.detectedInfo && (
										<p className="text-[11px] text-muted-foreground">
											📍 {locationStatus.detectedInfo}
										</p>
									)}
									{locationStatus.ghnFee !== undefined && (
										<div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary pt-0.5">
											<Truck className="h-3 w-3" />
											<span>
												Ước tính cước GHN từ Kho Hà Nội:{" "}
												{new Intl.NumberFormat("vi-VN").format(locationStatus.ghnFee)} ₫
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Country selector */}
					<div className="space-y-2">
						<Label htmlFor="country" className="text-sm font-medium">
							{t("countryRegion")}
						</Label>
						<FormSelect
							id="country"
							name="countryCode"
							value={countryCode}
							onChange={onCountryChange}
							error={errors.countryCode}
							placeholder={t("selectCountry")}
							autoComplete="shipping country"
							options={availableCountries.map(({ code, label }) => ({
								value: code,
								label,
							}))}
						/>
						<FieldError error={errors.countryCode} />
					</div>

					{/* Dynamic address fields */}
					<AddressFields
						orderedFields={orderedAddressFields}
						getFieldLabel={getFieldLabel}
						isRequiredField={isRequiredField}
						formData={formData}
						errors={errors}
						onFieldChange={onFieldChange}
						countryAreaChoices={countryAreaChoices}
					/>
				</>
			)}
		</section>
	);
};
