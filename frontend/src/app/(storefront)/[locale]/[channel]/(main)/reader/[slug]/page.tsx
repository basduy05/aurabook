import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DRMWebReader } from "@/ui/components/reader/drm-web-reader";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserDocument, CurrentUserOrdersPaginatedDocument } from "@/gql/graphql";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";

const BOOK_CATALOG: Record<string, { title: string; epubUrl: string; author?: string }> = {
	"dac-nhan-tam": {
		title: "Đắc Nhân Tâm (How to Win Friends and Influence People)",
		epubUrl: "/books/dac-nhan-tam.epub",
		author: "Dale Carnegie",
	},
	"bon-thoa-uoc": {
		title: "Bốn Thỏa Ước (The Four Agreements)",
		epubUrl: "/books/bon-thoa-uoc.epub",
		author: "Don Miguel Ruiz",
	},
	"sapiens-luoc-su-loai-nguoi": {
		title: "Sapiens: Lược Sử Loài Người (A Brief History of Humankind)",
		epubUrl: "/books/sapiens-luoc-su-loai-nguoi.epub",
		author: "Yuval Noah Harari",
	},
	"tri-tue-do-thai": {
		title: "Trí Tuệ Do Thái (Jerome Becomes a Genius)",
		epubUrl: "/books/tri-tue-do-thai.epub",
		author: "Eran Katz",
	},
	"sample-book": {
		title: "Đắc Nhân Tâm (Bản Đọc Thử Tuyển Chọn)",
		epubUrl: "/books/dac-nhan-tam.epub",
		author: "Dale Carnegie",
	},
};

function resolveBookInfo(slug: string, explicitEpub?: string, explicitTitle?: string) {
	// If explicit epubUrl provided (e.g. from query param)
	if (explicitEpub) {
		const catalogEntry = BOOK_CATALOG[slug];
		return {
			title: explicitTitle || catalogEntry?.title || slug,
			epubUrl: explicitEpub,
		};
	}

	// Exact match in catalog
	if (BOOK_CATALOG[slug]) {
		const item = BOOK_CATALOG[slug];
		return {
			title: explicitTitle || item.title,
			epubUrl: item.epubUrl,
		};
	}

	// Partial match in catalog (e.g. "dac-nhan-tam-ebook" or slug contains book name)
	const partialKey = Object.keys(BOOK_CATALOG).find(
		(key) => key !== "sample-book" && (slug.includes(key) || key.includes(slug))
	);
	if (partialKey) {
		const item = BOOK_CATALOG[partialKey];
		return {
			title: explicitTitle || item.title,
			epubUrl: item.epubUrl,
		};
	}

	// Default fallback to /books/[slug].epub or dac-nhan-tam
	const formattedTitle = slug
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");

	return {
		title: explicitTitle || `Ấn phẩm: ${formattedTitle}`,
		epubUrl: `/books/${slug}.epub`,
	};
}

export async function generateMetadata(props: {
	params: Promise<{ locale: string; channel: string; slug: string }>;
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
	const { slug } = await props.params;
	const searchParams = props.searchParams ? await props.searchParams : {};
	const book = resolveBookInfo(slug, searchParams?.epub as string, searchParams?.title as string);

	return {
		title: `Đọc sách: ${book.title} | AuraBook DRM Web Reader`,
		description: "Trình đọc sách điện tử bảo mật chuẩn Readium LCP DRM trên AuraBook.",
	};
}

export default async function ReaderPage(props: {
	params: Promise<{ locale: string; channel: string; slug: string }>;
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { locale, channel, slug } = await props.params;
	const searchParams = props.searchParams ? await props.searchParams : {};

	const explicitTitle = (searchParams?.title as string) || "";
	const explicitEpub = (searchParams?.epub as string) || "";

	const book = resolveBookInfo(slug, explicitEpub, explicitTitle);
	const bookTitle = book.title;
	const epubUrl = book.epubUrl;

	// Query real user profile from Saleor session
	let realUserId = (searchParams?.userId as string) || "";
	let realUserName = (searchParams?.userName as string) || "";
	let realUserEmail = (searchParams?.email as string) || "";
	let realLicenseId = (searchParams?.license as string) || "";
	let isAuthenticated = false;

	let hasPurchased = false;

	try {
		const userRes = await executeAuthenticatedGraphQL(CurrentUserDocument, { cache: "no-cache" });
		if (userRes.ok && userRes.data?.me) {
			isAuthenticated = true;
			const me = userRes.data.me;
			realUserId = me.id;
			realUserName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email.split("@")[0];
			realUserEmail = me.email;
			const cleanId = me.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
			realLicenseId = `LCP-${cleanId || "AUR"}-${slug.substring(0, 6).toUpperCase()}`;

			// 1. Kiểm tra quyền sở hữu qua lịch sử đơn hàng của người dùng (Saleor GraphQL Orders)
			try {
				const ordersRes = await executeAuthenticatedGraphQL(CurrentUserOrdersPaginatedDocument, {
					variables: { first: 50, after: null, ...graphqlLanguageCodeVariables(locale || "vi") },
					cache: "no-cache",
				});
				if (ordersRes.ok && ordersRes.data?.me?.orders?.edges) {
					const normTargetSlug = slug.toLowerCase().trim();
					const normTargetTitle = bookTitle.toLowerCase().trim();
					for (const edge of ordersRes.data.me.orders.edges) {
						const order = edge.node;
						if (order.status?.toLowerCase() === "canceled") continue;
						for (const line of order.lines) {
							const pSlug = line.variant?.product?.slug?.toLowerCase().trim() || "";
							const pName = line.variant?.product?.name?.toLowerCase().trim() || (line as any).productName?.toLowerCase().trim() || "";
							const pId = line.variant?.product?.id?.toLowerCase().trim() || "";
							if (
								pSlug === normTargetSlug ||
								pId === normTargetSlug ||
								(pSlug && normTargetSlug.includes(pSlug)) ||
								(pSlug && pSlug.includes(normTargetSlug)) ||
								(pName && normTargetTitle && normTargetTitle.includes(pName)) ||
								(pName && normTargetTitle && pName.includes(normTargetTitle))
							) {
								hasPurchased = true;
								break;
							}
						}
						if (hasPurchased) break;
					}
				}
			} catch (orderErr) {
				console.warn("[ReaderPage] Could not query orders for purchase verification:", orderErr);
			}

			// 2. Kiểm tra qua cơ sở dữ liệu thư viện/tiến trình đọc nếu chưa tìm thấy trong orders
			if (!hasPurchased && realUserEmail) {
				try {
					const BACKEND_INTERNAL_URL = "http://localhost:8000";
					const progRes = await fetch(
						`${BACKEND_INTERNAL_URL}/aurabook/reading/library?user_email=${encodeURIComponent(realUserEmail)}`,
						{ cache: "no-store" },
					);
					if (progRes.ok) {
						const progData = (await progRes.json()) as any;
						if (Array.isArray(progData?.library)) {
							const normTargetSlug = slug.toLowerCase().trim();
							const inLibrary = progData.library.some((p: any) => {
								const pid = String(p.product_id || "").toLowerCase().trim();
								return pid === normTargetSlug || normTargetSlug.includes(pid) || pid.includes(normTargetSlug);
							});
							if (inLibrary) hasPurchased = true;
						}
					}
				} catch {}
			}
		}
	} catch (e) {
		console.warn("[ReaderPage] Unable to fetch authenticated user on server:", e);
	}

	// Người nào đã mua sách rồi nhưng nhấn đọc thử thì TUYỆT ĐỐI KHÔNG ĐƯỢC HIỆN LÀ ĐỌC THỬ NỮA
	const requestedTrial = searchParams?.mode === "trial" || searchParams?.trial === "true";
	const isTrial = requestedTrial && !hasPurchased;

	// Revoke access on server if logged out or unauthenticated (Chỉ khách hàng đã đăng ký mới đọc thử được)
	if (!isAuthenticated && !realUserId) {
		const queryParams = new URLSearchParams();
		if (isTrial) queryParams.set("mode", "trial");
		if (searchParams?.title) queryParams.set("title", searchParams.title as string);
		if (searchParams?.epub) queryParams.set("epub", searchParams.epub as string);
		const qs = queryParams.toString();
		const redirectTarget = `/${locale}/${channel}/reader/${slug}${qs ? `?${qs}` : ""}`;
		redirect(`/${locale}/${channel}/login?next=${encodeURIComponent(redirectTarget)}`);
	}

	const backUrl = (searchParams?.back as string) || "/community?tab=bookshelf";

	return (
		<div className="min-h-screen bg-background">
			<DRMWebReader
				bookTitle={bookTitle}
				bookSlug={slug}
				epubUrl={epubUrl}
				userEmail={realUserEmail}
				userId={realUserId}
				userName={realUserName}
				licenseId={realLicenseId}
				backUrl={backUrl}
				isTrial={isTrial}
			/>
		</div>
	);
}

