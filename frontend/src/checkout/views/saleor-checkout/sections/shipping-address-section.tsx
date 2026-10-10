"use client";

import { useState, useMemo, useEffect, type FC } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Loader2, CheckCircle2, Truck, AlertCircle, Building2 } from "lucide-react";
import { Label } from "@/ui/components/ui/label";
import { Badge } from "@/ui/components/ui/badge";
import { Button } from "@/ui/components/ui/button";
import { isInnerCityAddress } from "@/lib/vietnam-administrative/data";
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
		isInnerCity?: boolean;
		hasHouseNumber?: boolean;
		warningMessage?: string;
	} | null>(null);

	// Real-time live GHN fee query directly from backend/GHN API
	const [liveGHNFee, setLiveGHNFee] = useState<{
		fee: number;
		serviceName: string;
		estimatedDays: string;
		isFreeShipping: boolean;
		isInnerCity: boolean;
	} | null>(null);

	const manualIsInnerCity = useMemo(() => {
		if (countryCode !== "VN" || !formData.countryArea) return false;
		return isInnerCityAddress(formData.countryArea, formData.city || "");
	}, [countryCode, formData.countryArea, formData.city]);

	// Tự động tính cước GHN theo thời gian thực khi địa chỉ thay đổi, không bao giờ bị cố định số tiền
	useEffect(() => {
		if (countryCode !== "VN" || !formData.countryArea || !formData.city) {
			setLiveGHNFee(null);
			return;
		}

		let isSubscribed = true;
		const timer = setTimeout(() => {
			fetch("/api/shipping/ghn/fee", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destinationProvince: formData.countryArea,
					destinationDistrict: formData.city,
					orderValue: checkoutSubtotal || 0,
					weightGrams: 500,
				}),
			})
				.then((res) => (res.ok ? (res.json() as Promise<any>) : null))
				.then((data: any) => {
					if (!isSubscribed || !data) return;
					const isInner = isInnerCityAddress(formData.countryArea, formData.city);
					setLiveGHNFee({
						fee: data.fee,
						serviceName: data.serviceName,
						estimatedDays: data.estimatedDays,
						isFreeShipping: data.isFreeShipping,
						isInnerCity: isInner,
					});

					// Đồng bộ trạng thái cước hiển thị cho vị trí hiện tại
					setLocationStatus((prev) => {
						if (!prev) return null;
						return {
							...prev,
							ghnFee: data.fee,
							isInnerCity: isInner,
							detectedInfo: [formData.streetAddress1, formData.city, formData.countryArea]
								.filter(Boolean)
								.join(", "),
						};
					});
				})
				.catch(() => {});
		}, 300);

		return () => {
			isSubscribed = false;
			clearTimeout(timer);
		};
	}, [countryCode, formData.countryArea, formData.city, checkoutSubtotal, formData.streetAddress1]);

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
							detectedInfo: [addr.streetAddress1, addr.city, addr.countryArea].filter(Boolean).join(", "),
							ghnFee: isFreeShipping ? 0 : data.ghnShipping?.fee,
							isInnerCity: data.isInnerCity,
							hasHouseNumber: data.hasHouseNumber,
							warningMessage: data.warningMessage,
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
							<Button
								type="button"
								variant="default"
								size="sm"
								onClick={handleDetectLocation}
								disabled={isLocating}
								className="cursor-pointer gap-2 shrink-0 font-semibold rounded-xl"
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
							</Button>
						</div>

						{locationStatus && (
							<div
								className={`rounded-lg p-3 text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200 border ${
									locationStatus.type === "success"
										? "bg-success/10 border-success/30 text-foreground"
										: locationStatus.type === "prompt"
										? "bg-secondary border-border text-foreground"
										: "bg-destructive/10 border-destructive/20 text-destructive"
								}`}
							>
								{locationStatus.type === "success" && (
									<CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
								)}
								{locationStatus.type === "prompt" && (
									<Loader2 className="h-4 w-4 text-primary animate-spin shrink-0 mt-0.5" />
								)}
								{locationStatus.type === "error" && (
									<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
								)}
								<div className="space-y-1.5 flex-1">
									<p className="font-semibold">{locationStatus.message}</p>
									{locationStatus.detectedInfo && (
										<p className="text-[11px] text-muted-foreground">
											📍 {locationStatus.detectedInfo}
										</p>
									)}
									{locationStatus.warningMessage && (
										<div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
											<AlertCircle className="h-3.5 w-3.5 shrink-0" />
											<span>{locationStatus.warningMessage}</span>
										</div>
									)}
									{locationStatus.isInnerCity !== undefined && (
										<div className="flex items-center gap-1.5 text-[11px] font-medium pt-0.5">
											{locationStatus.isInnerCity ? (
												<span className="inline-flex items-center gap-1 text-success font-semibold">
													<Building2 className="h-3.5 w-3.5" />
													<span>Khu vực Nội thành — Hỗ trợ GHN Giao Hỏa Tốc (2 - 4h)</span>
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-muted-foreground">
													<Truck className="h-3.5 w-3.5" />
													<span>Khu vực Ngoại thành / Tỉnh — Áp dụng GHN Tiêu Chuẩn (1 - 3 ngày)</span>
												</span>
											)}
										</div>
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

					{/* Real-time Inner City & House Number Indicator for Vietnam */}
					{countryCode === "VN" && formData.countryArea && (
						<div className="space-y-3 pt-1">
							<div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 text-xs animate-in fade-in-0 duration-200">
								<div className="flex items-center gap-2.5">
									<Building2 className="h-4 w-4 text-primary shrink-0" />
									<div>
										<span className="font-semibold text-foreground">
											{manualIsInnerCity ? "Địa chỉ thuộc Khu vực Nội thành" : "Địa chỉ thuộc Khu vực Ngoại thành / Tỉnh"}
										</span>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											{manualIsInnerCity
												? "Đủ điều kiện chọn phương thức vận chuyển Giao Hỏa Tốc (Nội thành) ở bước tiếp theo."
												: "Địa chỉ này áp dụng phương thức Giao Hàng Nhanh (GHN) Tiêu Chuẩn."}
										</p>
									</div>
								</div>
								<Badge variant={manualIsInnerCity ? "success" : "outline-solid"} className="shrink-0 text-[11px] font-medium">
									{manualIsInnerCity ? "Nội thành" : "Ngoại thành / Tỉnh"}
								</Badge>
							</div>

							{/* Live Real-time GHN Shipping Fee confirmation card */}
							{liveGHNFee && (
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs animate-in fade-in-0 duration-200 text-card-foreground">
									<div className="flex items-center gap-2.5">
										<Truck className="h-4 w-4 text-primary shrink-0" />
										<div>
											<div className="flex items-center gap-2 font-semibold text-foreground">
												<span>{liveGHNFee.serviceName}</span>
												{liveGHNFee.isFreeShipping && (
													<Badge variant="success" className="px-1.5 py-0 text-[10px]">Freeship</Badge>
												)}
											</div>
											<p className="text-[11px] text-muted-foreground mt-0.5">
												Xuất phát: Kho Tổng Aurabook Hà Nội • Dự kiến: {liveGHNFee.estimatedDays}
											</p>
										</div>
									</div>
									<div className="sm:text-right shrink-0">
										<span className="text-sm font-bold text-primary tabular-nums">
											{liveGHNFee.isFreeShipping
												? "0 ₫ (Miễn phí)"
												: `${new Intl.NumberFormat("vi-VN").format(liveGHNFee.fee)} ₫`}
										</span>
									</div>
								</div>
							)}
						</div>
					)}
				</>
			)}
		</section>
	);
};
