import { NextResponse } from "next/server";
import * as Checkout from "@/lib/checkout";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CheckoutAddLineDocument } from "@/gql/graphql";

// Bản đồ Variant chuẩn Saleor cho các đầu sách AuraBook
const SALEOR_VARIANT_MAP: Record<string, { ebook: string; physical: string }> = {
	"dac-nhan-tam": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NDQ=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NDU=",
	},
	"bon-thoa-uoc": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NDY=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NDc=",
	},
	"sapiens-luoc-su-loai-nguoi": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NDg=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NDk=",
	},
	"tri-tue-do-thai": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NTA=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NTE=",
	},
	"10-dieu-tao-nen-so-phan": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NTI=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NTM=",
	},
	"bi-mat-cua-mot-tri-nho-sieu-pham": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NTQ=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NTU=",
	},
	"cach-nghi-de-thanh-cong": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NTY=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NTc=",
	},
	"cay-cam-ngot-cua-toi": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NTg=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NTk=",
	},
	"chien-tranh-tien-te-tap-1": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NjA=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NjE=",
	},
	"chien-tranh-tien-te-tap-2": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NjI=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NjM=",
	},
	"chien-tranh-tien-te-tap-3": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NjQ=",
		physical: "UHJvZHVjdFZhcmlhbnQ6NjU=",
	},
	"chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6NjY=",
		physical: "UHJvZHVjdFZhcmlhbnQ6Njc=",
	},
	"tu-duy-nhanh-va-cham": {
		ebook: "UHJvZHVjdFZhcmlhbnQ6Njg=",
		physical: "UHJvZHVjdFZhcmlhbnQ6Njk=",
	},
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as any;
		const {
			bookSlug = "",
			edition = "ebook",
			variantId = "",
			channel = "channel-vnd",
			localeSlug = "vi",
		} = body || {};

		let targetVariantId: string = variantId;

		// 1. Phân giải VariantId từ bảng tra cứu nhanh
		if (!targetVariantId && bookSlug) {
			const mapped = SALEOR_VARIANT_MAP[bookSlug];
			if (mapped) {
				targetVariantId = edition === "physical" ? mapped.physical : mapped.ebook;
			}
		}

		if (!targetVariantId) {
			return NextResponse.json(
				{ error: "Không tìm thấy phiên bản phát hành phù hợp cho ấn phẩm này." },
				{ status: 400 },
			);
		}

		// 2. Khởi tạo hoặc tìm Checkout hiện tại của độc giả
		const currentCheckoutId = await Checkout.getIdFromCookies(channel);
		const checkout = await Checkout.findOrCreate({
			checkoutId: currentCheckoutId,
			channel,
			localeSlug,
		});

		if (!checkout) {
			return NextResponse.json(
				{ error: "Không thể khởi tạo phiên thanh toán giỏ hàng (Checkout)." },
				{ status: 500 },
			);
		}

		// Lưu Checkout ID vào Cookies
		await Checkout.saveIdToCookie(channel, checkout.id);

		// 3. Thêm sản phẩm vào giỏ hàng Saleor
		const addResult = await executeAuthenticatedGraphQL(CheckoutAddLineDocument, {
			variables: {
				id: checkout.id,
				productVariantId: decodeURIComponent(targetVariantId),
			},
			cache: "no-cache",
		});

		if (!addResult.ok) {
			console.error("[Cart Add-Line Error]:", addResult.error?.message);
			return NextResponse.json(
				{ error: addResult.error?.message || "Lỗi khi thêm sản phẩm vào giỏ hàng." },
				{ status: 400 },
			);
		}

		if (addResult.data?.checkoutLinesAdd?.errors?.length) {
			const errors = addResult.data.checkoutLinesAdd.errors;
			console.error("[Cart Add-Line Error]:", errors);
			return NextResponse.json(
				{ error: errors[0]?.message || "Lỗi khi thêm sản phẩm vào giỏ hàng." },
				{ status: 400 },
			);
		}

		const updatedCheckout = addResult.data?.checkoutLinesAdd?.checkout;
		const totalCount =
			updatedCheckout?.lines?.reduce((acc: number, line: any) => acc + (line.quantity || 1), 0) || 1;

		return NextResponse.json({
			success: true,
			checkoutId: checkout.id,
			totalCount,
			message: "Đã thêm ấn phẩm vào giỏ hàng thành công!",
		});
	} catch (error: any) {
		console.error("[Cart Add-Line Uncaught Error]:", error);
		return NextResponse.json(
			{ error: error?.message || "Lỗi máy chủ nội bộ khi cập nhật giỏ hàng." },
			{ status: 500 },
		);
	}
}
