import { brandConfig } from "@/config/brand";
import { STOREFRONT_CONTENT_VERSION, type StorefrontContent } from "@/lib/content/types";

/**
 * Code fallback for all storefront marketing copy.
 * Saleor PageType overrides merge on top when CONTENT_PROVIDER=saleor.
 *
 * English SoT for editorial copy — export to Configurator seed: pnpm content:export-seed
 */
export const defaultStorefrontContent = {
	version: STOREFRONT_CONTENT_VERSION,
	// Single source of truth for channel-wide facts. Copy references these via
	// `{freeShippingThreshold}` / `{returnsWindowDays}` tokens instead of baking the
	// numbers into strings, so the cart math, announcement, and trust labels never drift.
	policies: {
		shipping: {
			freeShippingThreshold: 75,
		},
		returns: {
			windowDays: 30,
		},
	},
	chrome: {
		announcementBar: {
			id: "",
			message: "Free shipping on orders over {freeShippingThreshold}",
			href: null,
			linkLabel: null,
			dismissible: true,
		},
		nav: {
			allProductsLabel: "All",
			viewAllLabel: "View all {label}",
		},
	},
	surfaces: {
		homepage: {
			hero: {
				heading: "Discover our collection",
				subheading: "Discover our collection.",
				primaryCtaLabel: "Shop all",
			},
			featuredCollection: {
				heading: "Featured products",
				collectionSlug: "featured-products",
				limit: 8,
			},
			categories: {
				heading: "Shop by category",
			},
			photoCredits: [],
			brandStory: {
				heading: "Our story",
				paragraphs: [
					"Tell shoppers who you are and what you stand for.",
					"Edit this copy in Dashboard → Models → Storefront — Homepage.",
				],
			},
			values: {
				heading: "Why shop with us",
				columns: [
					{
						title: "Quality",
						text: "Share what makes your products worth choosing.",
					},
					{
						title: "Shipping",
						text: "Describe how and when orders arrive.",
					},
					{
						title: "Returns",
						text: "Easy returns within {returnsWindowDays} days.",
					},
				],
				columnsDesktop: 3,
			},
			editorial: {
				heading: "From the shop",
				paragraphs: ["Highlight a collection, seasonal story, or campaign — then edit this block in Models."],
				imagePosition: "right",
				ctaLabel: "Explore collections",
				image: null,
				imageAlt: "",
			},
		},
		products: {
			title: "All Products",
			description: "Browse our full catalog.",
		},
		cart: {
			empty: {
				title: "Your bag is empty",
				body: "Looks like you haven't added anything to your bag yet.",
				ctaLabel: "Start Shopping",
			},
			trust: {
				freeShippingPrefix: "Free delivery over",
				returnsLabel: "{returnsWindowDays}-day returns",
			},
			drawer: {
				title: "Your Bag",
				addForFreeShipping: "Add {amount} more for free shipping",
				freeShippingQualified: "You qualify for free shipping!",
			},
		},
		checkout: {
			emptyCart: {
				title: "Your cart is empty",
				body: "Looks like you haven't added anything to your cart yet.",
				startShoppingLabel: "Start Shopping",
				goBackLabel: "Go back",
			},
			emptySession: {
				title: "Your cart is empty",
				message: "Add items from the store, then return here to complete your purchase.",
			},
			marketingOptInLabel: "Email me with news and offers",
			trust: {
				secureCheckout: "Secure checkout",
				stripeProcessor: "Payments processed by Stripe",
			},
		},
	},
} satisfies StorefrontContent;

export const viStorefrontContent = {
	version: STOREFRONT_CONTENT_VERSION,
	policies: {
		shipping: {
			freeShippingThreshold: 500000,
		},
		returns: {
			windowDays: 30,
		},
	},
	chrome: {
		announcementBar: {
			id: "",
			message: "Miễn phí vận chuyển cho đơn hàng từ {freeShippingThreshold}",
			href: null,
			linkLabel: null,
			dismissible: true,
		},
		nav: {
			allProductsLabel: "Tất cả",
			viewAllLabel: "Xem tất cả {label}",
		},
	},
	surfaces: {
		homepage: {
			hero: {
				heading: "Khám phá bộ sưu tập",
				subheading: "Nâng tầm phong cách sống với những sản phẩm tinh tế và chất lượng vượt trội.",
				primaryCtaLabel: "Mua sắm ngay",
			},
			featuredCollection: {
				heading: "Sản phẩm nổi bật",
				collectionSlug: "featured-products",
				limit: 8,
			},
			categories: {
				heading: "Danh mục sản phẩm",
				eyebrow: "Khám phá theo danh mục",
			},
			photoCredits: [],
			brandStory: {
				heading: "Câu chuyện thương hiệu",
				paragraphs: [
					"Chào mừng bạn đến với Aurabook – nơi mang đến những trải nghiệm mua sắm hiện đại, tiện lợi và đáng tin cậy.",
					"Mỗi sản phẩm đều được chọn lọc kỹ càng nhằm đáp ứng nhu cầu và nâng cao chất lượng cuộc sống của bạn.",
				],
			},
			values: {
				heading: "Tại sao chọn chúng tôi",
				columns: [
					{
						title: "Chất lượng hàng đầu",
						text: "Cam kết 100% sản phẩm chính hãng với độ hoàn thiện cao nhất.",
					},
					{
						title: "Giao hàng tin cậy",
						text: "Vận chuyển an toàn, nhanh chóng và đóng gói cẩn thận.",
					},
					{
						title: "Đổi trả thuận tiện",
						text: "Dễ dàng đổi trả linh hoạt trong vòng {returnsWindowDays} ngày.",
					},
				],
				columnsDesktop: 3,
			},
			editorial: {
				heading: "Xu hướng & Phong cách",
				paragraphs: ["Khám phá các bộ sưu tập đặc sắc, phong cách thời thượng dành riêng cho bạn."],
				imagePosition: "right",
				ctaLabel: "Khám phá bộ sưu tập",
				image: null,
				imageAlt: "Bộ sưu tập",
			},
		},
		products: {
			title: "Tất cả sản phẩm",
			description: "Khám phá toàn bộ danh mục sản phẩm của chúng tôi.",
		},
		cart: {
			empty: {
				title: "Giỏ hàng của bạn đang trống",
				body: "Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.",
				ctaLabel: "Bắt đầu mua sắm",
			},
			trust: {
				freeShippingPrefix: "Miễn phí giao hàng từ",
				returnsLabel: "Đổi trả trong {returnsWindowDays} ngày",
			},
			drawer: {
				title: "Giỏ hàng của bạn",
				addForFreeShipping: "Thêm {amount} để được miễn phí vận chuyển",
				freeShippingQualified: "Bạn đủ điều kiện nhận miễn phí vận chuyển!",
			},
		},
		checkout: {
			emptyCart: {
				title: "Giỏ hàng của bạn đang trống",
				body: "Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.",
				startShoppingLabel: "Bắt đầu mua sắm",
				goBackLabel: "Quay lại",
			},
			emptySession: {
				title: "Giỏ hàng của bạn đang trống",
				message: "Thêm sản phẩm từ cửa hàng, sau đó quay lại đây để hoàn tất thanh toán.",
			},
			marketingOptInLabel: "Nhận tin tức ưu đãi và khuyến mãi qua email",
			trust: {
				secureCheckout: "Thanh toán an toàn & bảo mật",
				stripeProcessor: "Hệ thống thanh toán được mã hóa bảo mật",
			},
		},
	},
} satisfies StorefrontContent;

export function getLocalizedStorefrontContent(locale?: string, channel?: string): StorefrontContent {
	const isVi = locale === "vi" || channel === "channel-vnd";
	if (isVi) {
		return viStorefrontContent;
	}
	return defaultStorefrontContent;
}
