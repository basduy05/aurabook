"use client";

import { useMemo, type FC, type ReactNode } from "react";
import { User, MapPin, Building, Phone, type LucideIcon } from "lucide-react";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { cn } from "@/lib/utils";
import { type AddressField } from "@/checkout/components/address-form/types";
import {
	formatAddressAutocomplete,
	inputModeTags,
	type AddressAutocompleteSection,
	typeTags,
} from "@/checkout/lib/consts/input-attributes";
import { uniqueSelectOptions } from "@/checkout/lib/unique-select-options";
import { findProvince, VIETNAM_PROVINCES } from "@/lib/vietnam-administrative/data";

// =============================================================================
// Constants
// =============================================================================

/** Icon mapping for address fields */
export const addressFieldIcons: Partial<Record<AddressField, LucideIcon>> = {
	firstName: User,
	streetAddress1: MapPin,
	streetAddress2: Building,
	companyName: Building,
	phone: Phone,
};

/** Fields that should be grouped in a 2-column row */
export const addressFieldPairs: [AddressField, AddressField][] = [
	["firstName", "lastName"],
	["city", "postalCode"],
];

// =============================================================================
// Shared Components
// =============================================================================

export const FieldError: FC<{ error?: string }> = ({ error }) =>
	error ? <p className="text-sm text-destructive">{error}</p> : null;

interface FormSelectProps {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
	options: Array<{ value: string; label: string }>;
	autoComplete?: string;
	name?: string;
}

export const FormSelect: FC<FormSelectProps> = ({
	id,
	value,
	onChange,
	error,
	placeholder,
	options,
	autoComplete,
	name,
}) => {
	const uniqueOptions = uniqueSelectOptions(options);

	return (
		<select
			id={id}
			name={name}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			autoComplete={autoComplete}
			className={cn(
				"flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
				"ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				error && "border-destructive",
			)}
		>
			{placeholder && (
				<option value="" disabled>
					{placeholder}
				</option>
			)}
			{uniqueOptions.map((option, idx) => (
				<option key={`${option.value || "opt"}-${idx}`} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
};

interface FormInputProps {
	id: string;
	type?: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	icon?: LucideIcon;
	maxLength?: number;
	className?: string;
	autoComplete?: string;
	name?: string;
	inputMode?: "text" | "tel" | "numeric" | "email";
}

export const FormInput: FC<FormInputProps> = ({
	id,
	type = "text",
	placeholder,
	value,
	onChange,
	error,
	icon: Icon,
	maxLength,
	className,
	autoComplete,
	name,
	inputMode,
}) => (
	<div className="relative">
		{Icon && <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
		<Input
			id={id}
			name={name}
			type={type}
			inputMode={inputMode}
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			maxLength={maxLength}
			autoComplete={autoComplete}
			className={cn("h-12", Icon && "pl-10", error && "border-destructive", className)}
		/>
	</div>
);

// =============================================================================
// Address Fields Renderer
// =============================================================================

interface AddressFieldsProps {
	/** Ordered list of fields to render */
	orderedFields: AddressField[];
	/** Function to get field label */
	getFieldLabel: (field: AddressField) => string;
	/** Function to check if field is required */
	isRequiredField: (field: AddressField) => boolean;
	/** Current form values */
	formData: Record<string, string>;
	/** Validation errors */
	errors: Record<string, string>;
	/** Callback when field value changes */
	onFieldChange: (field: string, value: string) => void;
	/** Country area choices for state/province dropdown */
	countryAreaChoices?: Array<{ raw?: unknown; verbose?: unknown }>;
	/** ID prefix for form fields (e.g., "billing-") */
	idPrefix?: string;
	/** Scopes autofill tokens for shipping vs billing address sections */
	autocompleteSection?: AddressAutocompleteSection;
}

export const AddressFields: FC<AddressFieldsProps> = ({
	orderedFields,
	getFieldLabel,
	isRequiredField,
	formData,
	errors,
	onFieldChange,
	countryAreaChoices,
	idPrefix = "",
	autocompleteSection = "shipping",
}) => {
	const isVietnam = Boolean(
		countryAreaChoices?.length ||
			formData.countryArea ||
			formData.countryCode === "VN" ||
			formData.country === "VN" ||
			!formData.countryCode,
	);

	// Ensure province choices always exist for Vietnam
	const effectiveProvinceChoices = useMemo(() => {
		if (countryAreaChoices && countryAreaChoices.length > 0) {
			return countryAreaChoices;
		}
		if (isVietnam) {
			return VIETNAM_PROVINCES.map((p) => ({
				raw: p.name,
				verbose: p.name,
			}));
		}
		return [];
	}, [countryAreaChoices, isVietnam]);

	// Pairs grouping: Vietnam groups Province + District together on one row
	const fieldPairs: [AddressField, AddressField][] = isVietnam
		? [
				["firstName", "lastName"],
				["countryArea", "city"],
				["phone", "postalCode"],
		  ]
		: addressFieldPairs;

	// Proper field ordering for Vietnam
	const sortedFields = useMemo(() => {
		if (!isVietnam) return orderedFields;
		const priority: Record<string, number> = {
			firstName: 1,
			lastName: 2,
			countryArea: 3,
			city: 4,
			streetAddress1: 5,
			streetAddress2: 6,
			phone: 7,
			postalCode: 8,
			companyName: 9,
		};
		// Include countryArea if missing from orderedFields for Vietnam
		const fields = [...orderedFields];
		if (!fields.includes("countryArea" as AddressField)) {
			fields.push("countryArea" as AddressField);
		}
		return fields.sort((a, b) => (priority[a] || 99) - (priority[b] || 99));
	}, [orderedFields, isVietnam]);

	const renderField = (field: AddressField): ReactNode => {
		if (field === "countryCode") return null;

		let label = getFieldLabel(field);
		let isRequired = isRequiredField(field);

		if (isVietnam) {
			if (field === "countryArea") {
				label = "Tỉnh / Thành phố";
				isRequired = true;
			} else if (field === "city") {
				label = "Quận / Huyện / Thị xã";
				isRequired = true;
			} else if (field === "streetAddress1") {
				label = "Địa chỉ chi tiết (Số nhà, tên đường)";
				isRequired = true;
			} else if (field === "streetAddress2") {
				label = "Số nhà, căn hộ bổ sung";
				isRequired = false;
			} else if (field === "postalCode") {
				label = "Mã bưu chính";
				isRequired = false;
			} else if (field === "phone") {
				label = "Số điện thoại";
			}
		}

		const error = errors[field];
		const Icon = addressFieldIcons[field];
		const fieldId = `${idPrefix}${field}`;
		const autoComplete = formatAddressAutocomplete(field, autocompleteSection);
		const inputType = typeTags[field] || "text";
		const inputMode = inputModeTags[field];

		// Label with optional indicator
		const fieldLabel = (
			<Label htmlFor={fieldId} className="text-sm font-medium">
				{label}
				{!isRequired && <span className="ml-1 font-normal text-muted-foreground">(tùy chọn)</span>}
			</Label>
		);

		// State/Province dropdown (Cấp 1: Tỉnh / Thành phố)
		if (field === "countryArea" && effectiveProvinceChoices.length > 0) {
			return (
				<div key={field} className="space-y-1.5">
					{fieldLabel}
					<FormSelect
						id={fieldId}
						name={field}
						value={formData[field] || ""}
						onChange={(value) => {
							onFieldChange(field, value);
							// Khi đổi Tỉnh/Thành phố, reset Quận/Huyện để tính cước lại chính xác
							onFieldChange("city", "");
						}}
						error={error}
						placeholder="Chọn Tỉnh / Thành phố"
						autoComplete={autoComplete}
						options={effectiveProvinceChoices.map(({ raw, verbose }) => ({
							value: typeof raw === "string" ? raw : "",
							label: typeof verbose === "string" ? verbose : "",
						}))}
					/>
					<FieldError error={error} />
				</div>
			);
		}

		// District dropdown (Cấp 2: Quận / Huyện / Thị xã / TP thuộc tỉnh)
		if (field === "city") {
			const provinceInfo = formData.countryArea ? findProvince(formData.countryArea) : undefined;
			if (provinceInfo && provinceInfo.districts?.length > 0) {
				return (
					<div key={field} className="space-y-1.5">
						{fieldLabel}
						<FormSelect
							id={fieldId}
							name={field}
							value={formData[field] || ""}
							onChange={(value) => onFieldChange(field, value)}
							error={error}
							placeholder="Chọn Quận / Huyện / Thị xã"
							autoComplete={autoComplete}
							options={provinceInfo.districts.map((d) => ({
								value: d.name,
								label: d.isInnerCity ? `${d.name} (Nội thành)` : d.name,
							}))}
						/>
						<FieldError error={error} />
					</div>
				);
			} else if (isVietnam && !formData.countryArea) {
				return (
					<div key={field} className="space-y-1.5">
						{fieldLabel}
						<FormSelect
							id={fieldId}
							name={field}
							value=""
							onChange={() => {}}
							error={error}
							placeholder="Vui lòng chọn Tỉnh / Thành phố trước"
							options={[]}
						/>
						<FieldError error={error} />
					</div>
				);
			}
		}

		// Text input
		return (
			<div key={field} className="space-y-1.5">
				{fieldLabel}
				<FormInput
					id={fieldId}
					name={field}
					type={inputType}
					inputMode={inputMode}
					placeholder={label}
					value={formData[field] || ""}
					onChange={(value) => onFieldChange(field, value)}
					error={error}
					icon={Icon}
					autoComplete={autoComplete}
				/>
				<FieldError error={error} />
			</div>
		);
	};

	const rendered = new Set<string>();
	const elements: ReactNode[] = [];

	sortedFields.forEach((field) => {
		if (field === "countryCode") return;

		const pair = fieldPairs.find((p) => p.includes(field));
		if (pair) {
			const pairKey = pair.join("-");
			if (rendered.has(pairKey)) return;
			rendered.add(pairKey);

			const [f1, f2] = pair;
			const has1 = sortedFields.includes(f1);
			const has2 = sortedFields.includes(f2);

			if (has1 && has2) {
				elements.push(
					<div key={pairKey} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{renderField(f1)}
						{renderField(f2)}
					</div>,
				);
			} else {
				if (has1) elements.push(renderField(f1));
				if (has2) elements.push(renderField(f2));
			}
		} else {
			elements.push(renderField(field));
		}
	});

	return <>{elements}</>;
};
