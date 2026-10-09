/**
 * Pick Saleor translation fields with fallback to the default (channel) language.
 */

type TranslationRecord = Record<string, string | null | undefined> | null | undefined;

export function pickTranslatedField(
	translation: TranslationRecord,
	field: string,
	fallback: string | null | undefined,
): string | null | undefined {
	const value = translation?.[field];
	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}
	return fallback;
}

export const VI_NAME_FALLBACKS: Record<string, string> = {
	"Sneakers": "Giày thể thao",
	"Sweatshirts": "Áo nỉ",
	"Headware": "Mũ nón",
	"Beanies": "Mũ len",
	"Scarfs": "Khăn choàng",
	"Sunglasses": "Kính râm",
	"Shirts": "Áo sơ mi",
	"T-shirts": "Áo thun",
	"Polo shirts": "Áo polo",
	"Juices": "Nước ép",
	"Books": "Sách",
	"Default Category": "Danh mục mặc định",
	"Quản lý sách": "Sách",
	"Apparel": "Quần áo",
	"Accessories": "Phụ kiện",
	"Audiobooks": "Sách nói",
	"Homewares": "Đồ gia dụng",
	"Groceries": "Cửa hàng tạp hóa",
	"Gift cards": "Thẻ quà tặng",
};

export function pickTranslatedName(
	entity: {
		name: string;
		translation?: { name?: string | null } | null;
	},
	locale?: string,
): string {
	const raw = pickTranslatedField(entity.translation, "name", entity.name) ?? entity.name;
	if (locale && locale !== "vi") {
		return raw;
	}
	return VI_NAME_FALLBACKS[raw] ?? raw;
}

/**
 * Locale-canonical catalog URL slug. Keeps `entity.slug` (primary) untouched for
 * cache tags / webhooks — use this only when building browse paths.
 *
 * @see docs/adr/0004-translatable-slugs.md
 */
export function pickTranslatedSlug(entity: {
	slug: string;
	translation?: { slug?: string | null } | null;
}): string {
	return pickTranslatedField(entity.translation, "slug", entity.slug) ?? entity.slug;
}

export function pickTranslatedTitle(entity: {
	title: string;
	translation?: { title?: string | null } | null;
}): string {
	return pickTranslatedField(entity.translation, "title", entity.title) ?? entity.title;
}

export function pickTranslatedDescription(entity: {
	description?: string | null;
	translation?: { description?: string | null } | null;
}): string | null | undefined {
	return pickTranslatedField(entity.translation, "description", entity.description);
}

export function pickTranslatedSeoTitle(entity: {
	seoTitle?: string | null;
	translation?: { seoTitle?: string | null } | null;
}): string | null | undefined {
	return pickTranslatedField(entity.translation, "seoTitle", entity.seoTitle);
}

export function pickTranslatedSeoDescription(entity: {
	seoDescription?: string | null;
	translation?: { seoDescription?: string | null } | null;
}): string | null | undefined {
	return pickTranslatedField(entity.translation, "seoDescription", entity.seoDescription);
}

export function pickTranslatedContent(entity: {
	content?: string | null;
	translation?: { content?: string | null } | null;
}): string | null | undefined {
	return pickTranslatedField(entity.translation, "content", entity.content);
}

type TranslatableCategory = {
	name: string;
	description?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	translation?: {
		name?: string | null;
		description?: string | null;
		seoTitle?: string | null;
		seoDescription?: string | null;
		slug?: string | null;
	} | null;
};

/** Apply Saleor translations to category/collection display fields. */
export function withTranslatedCategoryFields<T extends TranslatableCategory>(entity: T, locale?: string): T {
	return {
		...entity,
		name: pickTranslatedName(entity, locale),
		description: pickTranslatedDescription(entity) ?? entity.description,
		seoTitle: pickTranslatedSeoTitle(entity) ?? entity.seoTitle,
		seoDescription: pickTranslatedSeoDescription(entity) ?? entity.seoDescription,
	};
}

type TranslatablePage = {
	title: string;
	content?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	translation?: {
		title?: string | null;
		content?: string | null;
		seoTitle?: string | null;
		seoDescription?: string | null;
		slug?: string | null;
	} | null;
};

export function withTranslatedPageFields<T extends TranslatablePage>(page: T): T {
	return {
		...page,
		title: pickTranslatedTitle(page),
		content: pickTranslatedContent(page) ?? page.content,
		seoTitle: pickTranslatedSeoTitle(page) ?? page.seoTitle,
		seoDescription: pickTranslatedSeoDescription(page) ?? page.seoDescription,
	};
}

type TranslatableProduct = {
	name: string;
	description?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	translation?: {
		name?: string | null;
		description?: string | null;
		seoTitle?: string | null;
		seoDescription?: string | null;
		slug?: string | null;
	} | null;
	category?: {
		name: string;
		slug?: string;
		translation?: { name?: string | null; slug?: string | null } | null;
	} | null;
	variants?: Array<{
		name: string;
		translation?: { name?: string | null } | null;
	}> | null;
};

export function withTranslatedProductFields<T extends TranslatableProduct>(product: T, locale?: string): T {
	return {
		...product,
		name: pickTranslatedName(product, locale),
		description: pickTranslatedDescription(product) ?? product.description,
		seoTitle: pickTranslatedSeoTitle(product) ?? product.seoTitle,
		seoDescription: pickTranslatedSeoDescription(product) ?? product.seoDescription,
		category: product.category
			? {
					...product.category,
					name: pickTranslatedName(product.category, locale),
				}
			: null,
		variants:
			product.variants?.map((variant) => ({
				...variant,
				name: pickTranslatedName(variant, locale),
			})) ?? null,
	};
}
