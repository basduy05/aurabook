"use client";

import { useState, useMemo, useEffect, type FC } from "react";
import { useTranslations } from "next-intl";
import { MapPin, CheckCircle2, Truck, AlertCircle, Building2 } from "lucide-react";
import { Label } from "@/ui/components/ui/label";
import { Badge } from "@/ui/components/ui/badge";
import { Button } from "@/ui/components/ui/button";
import { Loader } from "@/ui/atoms/loader";
import { cn } from "@/lib/utils";
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
									<MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>Tự động nhận diện địa chỉ nhận hàng</span>
								</div>
								<p className="text-[12px] text-muted-foreground">
									Hệ thống định vị vị trí hiện tại để tự động điền địa chỉ và tính cước GHN từ Kho Hà Nội.
								</p>
							</div>
							<Button
								type="button"
								variant="outline-solid"
								size="sm"
								onClick={handleDetectLocation}
								disabled={isLocating}
								className="cursor-pointer gap-2 shrink-0 font-medium rounded-lg text-xs"
							>
								{isLocating ? (
									<>
										<Loader size="sm" className="mr-1" />
										<span>Đang xác định...</span>
									</>
								) : (
									<>
										<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
										<span>Lấy vị trí hiện tại</span>
									</>
								)}
							</Button>
						</div>

						{locationStatus && (
							<div
								className={cn(
									"rounded-xl border p-3.5 text-xs flex items-start gap-3 animate-in fade-in-0 duration-200",
									locationStatus.type === "success"
										? "border-border bg-secondary/40 text-foreground"
										: locationStatus.type === "prompt"
										? "border-border bg-secondary/30 text-foreground"
										: "border-destructive/30 bg-destructive/10 text-destructive",
								)}
							>
								{locationStatus.type === "success" && (
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
										<CheckCircle2 className="h-4 w-4" />
									</div>
								)}
								{locationStatus.type === "prompt" && (
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<Loader size="sm" />
									</div>
								)}
								{locationStatus.type === "error" && (
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
										<AlertCircle className="h-4 w-4" />
									</div>
								)}
								<div className="space-y-1.5 flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<p className="font-semibold text-foreground">{locationStatus.message}</p>
										<button
											type="button"
											onClick={() => setLocationStatus(null)}
											className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
										>
											Đóng
										</button>
									</div>
									{locationStatus.detectedInfo && (
										<p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
											<MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
											<span className="truncate">{locationStatus.detectedInfo}</span>
										</p>
									)}
									{locationStatus.warningMessage && (
										<div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
											<AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
											<span>{locationStatus.warningMessage}</span>
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

					{/* Real-time GHN Shipping Fee confirmation card */}
					{countryCode === "VN" && formData.countryArea && (
						<div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm text-card-foreground animate-in fade-in-0 duration-200">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Truck className="h-4 w-4" />
									</div>
									<div className="space-y-0.5">
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold text-foreground">
												{liveGHNFee?.serviceName || "Giao Hàng Nhanh (GHN)"}
											</span>
											<Badge
												variant={manualIsInnerCity ? "default" : "secondary"}
												className="text-[10px] font-medium"
											>
												{manualIsInnerCity ? "Nội thành" : "Ngoại thành / Tỉnh"}
											</Badge>
										</div>
										<p className="text-[11px] text-muted-foreground">
											Xuất phát: Kho Tổng Aurabook Hà Nội • Thời gian:{" "}
											{liveGHNFee?.estimatedDays || (manualIsInnerCity ? "1 - 2 ngày" : "2 - 3 ngày")}
										</p>
									</div>
								</div>
								<div className="text-right shrink-0">
									<span className="text-base font-bold text-foreground tabular-nums">
										{liveGHNFee?.isFreeShipping
											? "0 ₫"
											: liveGHNFee?.fee != null
											? `${new Intl.NumberFormat("vi-VN").format(liveGHNFee.fee)} ₫`
											: "16.500 ₫"}
									</span>
									{liveGHNFee?.isFreeShipping && (
										<p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
											Miễn phí vận chuyển
										</p>
									)}
								</div>
							</div>
							{manualIsInnerCity && (
								<p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 flex items-center gap-1.5">
									<Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
									<span>Đủ điều kiện chọn thêm phương thức Giao Hỏa Tốc (2 - 4h) ở bước tiếp theo.</span>
								</p>
							)}
						</div>
					)}
				</>
			)}
		</section>
	);
};
