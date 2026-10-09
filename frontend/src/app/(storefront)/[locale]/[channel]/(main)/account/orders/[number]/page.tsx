import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, CreditCard, BookOpen, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OrderByNumberDocument } from "@/gql/graphql";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { hasAuthSession } from "@/lib/auth/has-auth-session";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";
import { resolveLocaleFromSlug } from "@/config/locale";
import { pickTranslatedName } from "@/lib/saleor-translations";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import { formatDate, formatMoney } from "@/lib/utils";
import { isLocalImageUrl } from "@/lib/images";
import { OrderTimeline } from "@/ui/components/account/order-timeline";
import { OrderStatusBadge } from "@/ui/components/account/order-status-badge";
import { AccountOrderDetailSkeleton } from "@/ui/components/account/account-skeleton";
import { type AddressDetailsFragment } from "@/gql/graphql";
import { OrderLineReviewButton } from "@/ui/components/reviews/order-line-review-button";
import { GHNOrderTracking } from "@/ui/components/account/ghn-order-tracking";
import { getGHNShipmentByOrder } from "@/lib/shipping/ghn";

type Props = {
	params: Promise<{ locale: string; number: string }>;
};

export default function OrderDetailPage({ params }: Props) {
	return (
		<Suspense fallback={<AccountOrderDetailSkeleton />}>
			<OrderDetailContent params={params} />
		</Suspense>
	);
}

async function OrderDetailContent({ params }: Props) {
	const { number, locale } = await params;
	const intlLocale = resolveLocaleFromSlug(locale).bcp47;
	const t = await getTranslations({ locale, namespace: "account.orderDetail" });
	const tCommon = await getTranslations({ locale, namespace: "account.common" });
	const tOrders = await getTranslations({ locale, namespace: "account.orders" });

	if (!(await hasAuthSession())) {
		return <p className="text-sm text-muted-foreground">{t("signInRequired")}</p>;
	}

	const result = await executeAuthenticatedGraphQL(OrderByNumberDocument, {
		variables: { first: 100, ...graphqlLanguageCodeVariables(locale) },
		cache: "no-cache",
	});

	if (!result.ok) {
		return <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>;
	}

	if (!result.data.me) {
		return <p className="text-sm text-muted-foreground">{t("signInRequired")}</p>;
	}

	const orders = result.data.me.orders?.edges ?? [];
	const order = orders.find(({ node }) => node.number === number)?.node;

	if (!order) {
		notFound();
	}

	const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
	const placedDate = formatDate(new Date(order.created), undefined, intlLocale);
	const ghnShipment = getGHNShipmentByOrder(order.number);
	const isCompleted = ghnShipment?.status === "delivered";

	const isDigitalOrder =
		!order.shippingAddress ||
		order.lines.every((line) => {
			const name = (line.variant?.product?.name || "").toLowerCase();
			return (
				name.includes("audiobook") ||
				name.includes("ebook") ||
				name.includes("điện tử") ||
				name.includes("sách số")
			);
		});

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-balance text-h1">{tOrders("orderNumber", { number: order.number })}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{t("placedOn", { date: placedDate })}</p>
				</div>
				<OrderStatusBadge
					status={order.status}
					statusDisplay={order.statusDisplay}
					localeSlug={locale}
					isCompleted={isCompleted}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<div className="space-y-6">
					{isDigitalOrder ? (
						<div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
								<div className="flex items-center gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<BookOpen className="h-6 w-6" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-bold text-foreground text-base">Cấp phát quyền sử dụng ấn phẩm điện tử</h3>
											<span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-500/20">
												Bản quyền số
											</span>
										</div>
										<p className="text-xs text-muted-foreground mt-0.5">
											Đơn hàng bao gồm ấn phẩm điện tử (Ebook / Audiobook) — Không yêu cầu vận chuyển bưu kiện vật lý
										</p>
									</div>
								</div>
								<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
									<CheckCircle2 className="h-3.5 w-3.5" />
									Đã cấp quyền truy cập
								</span>
							</div>

							<div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
								<div className="rounded-lg border border-border bg-muted/20 p-3">
									<div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
										<Sparkles className="h-3.5 w-3.5 text-primary" />
										<span>Phương thức cấp phát:</span>
									</div>
									<p className="font-medium text-foreground">Kích hoạt trực tiếp vào Thư viện tài khoản Aurabook</p>
									<p className="text-muted-foreground mt-0.5">Quyền đọc trực tuyến và tải về không giới hạn thời gian</p>
								</div>

								<div className="rounded-lg border border-border bg-muted/20 p-3">
									<div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
										<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
										<span>Bảo vệ quyền tác giả (DRM):</span>
									</div>
									<p className="font-medium text-foreground">Đã gắn mã số bản quyền cá nhân</p>
									<p className="text-muted-foreground mt-0.5">Tương thích với ứng dụng Aurabook Reader và trình duyệt web</p>
								</div>
							</div>
						</div>
					) : (
						<GHNOrderTracking
							orderNumber={order.number}
							initialShipment={ghnShipment as any}
						/>
					)}

					<div className="rounded-xl border">
						<div className="border-b px-5 py-4">
							<h2 className="text-sm font-semibold">{t("items", { count: itemCount })}</h2>
						</div>
						<div className="divide-y">
							{order.lines.map((line) => {
								if (!line.variant) return null;
								const variant = line.variant;
								const product = variant.product;
								const productName = pickTranslatedName(product);
								const variantName = pickTranslatedName(variant);
								const lineTotal = variant.pricing?.price?.gross
									? variant.pricing.price.gross.amount * line.quantity
									: null;
								const currency = variant.pricing?.price?.gross.currency;
								return (
									<div key={line.id} className="flex items-center gap-4 px-5 py-4">
										{product.thumbnail && (
											<div className="bg-secondary/30 h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
												<Image
													src={product.thumbnail.url}
													alt={product.thumbnail.alt ?? productName}
													width={128}
													height={128}
													unoptimized={isLocalImageUrl(product.thumbnail.url)}
													className="h-full w-full object-contain"
												/>
											</div>
										)}
										<div className="min-w-0 flex-1">
											<LinkWithChannel
												href={`/products/${product.slug}`}
												className="text-sm font-medium hover:underline"
											>
												{productName}
											</LinkWithChannel>
											{variantName !== variant.id && Boolean(variantName) && (
												<p className="text-[13px] text-muted-foreground">{variantName}</p>
											)}
											<p className="text-[13px] text-muted-foreground">
												{tCommon("qty", { count: line.quantity })}
											</p>
											<div className="mt-2">
												<OrderLineReviewButton
													productSlug={product.slug}
													productName={productName}
													productId={product.id}
												/>
											</div>
										</div>
										{lineTotal != null && currency && (
											<span className="text-sm font-medium tabular-nums">
												{formatMoney(lineTotal, currency, intlLocale)}
											</span>
										)}
									</div>
								);
							})}
						</div>

						<div className="border-t px-5 py-4">
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">{t("subtotal")}</dt>
									<dd className="tabular-nums">
										{formatMoney(order.subtotal.gross.amount, order.subtotal.gross.currency, intlLocale)}
									</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">{t("shipping")}</dt>
									<dd className="tabular-nums">
										{order.shippingPrice.gross.amount === 0
											? tCommon("free")
											: formatMoney(
													order.shippingPrice.gross.amount,
													order.shippingPrice.gross.currency,
													intlLocale,
												)}
									</dd>
								</div>
								{order.total.tax.amount > 0 && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">{t("tax")}</dt>
										<dd className="tabular-nums">
											{formatMoney(order.total.tax.amount, order.total.tax.currency, intlLocale)}
										</dd>
									</div>
								)}
								<div className="flex justify-between border-t pt-2 font-semibold">
									<dt>{t("total")}</dt>
									<dd className="tabular-nums">
										{formatMoney(order.total.gross.amount, order.total.gross.currency, intlLocale)}
									</dd>
								</div>
							</dl>
						</div>
					</div>

					<OrderTimeline order={order} localeSlug={locale} />
				</div>

				<div className="space-y-4">
					{order.shippingAddress && (
						<OrderAddress title={t("shippingAddress")} address={order.shippingAddress} />
					)}
					{order.billingAddress && (
						<OrderAddress title={t("billingAddress")} address={order.billingAddress} />
					)}

					{order.isPaid && (
						<div className="rounded-xl border px-5 py-4">
							<h3 className="mb-3 text-sm font-semibold">{t("paymentMethod")}</h3>
							<div className="flex items-center gap-3">
								<CreditCard className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">
									{order.paymentStatus === "FULLY_CHARGED" ? t("paid") : order.paymentStatus}
								</span>
							</div>
						</div>
					)}

					<LinkWithChannel
						href="/contact"
						className="hover:bg-secondary/50 block w-full rounded-xl border px-5 py-3 text-center text-sm font-medium transition-colors"
					>
						{t("needHelp")}
					</LinkWithChannel>
				</div>
			</div>
		</div>
	);
}

function OrderAddress({ title, address }: { title: string; address: AddressDetailsFragment }) {
	return (
		<div className="rounded-xl border px-5 py-4">
			<h3 className="mb-3 text-sm font-semibold">{title}</h3>
			<div className="flex gap-3">
				<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
				<div className="text-sm leading-relaxed">
					<p className="font-medium">
						{address.firstName} {address.lastName}
					</p>
					<p className="text-muted-foreground">{address.streetAddress1}</p>
					{address.streetAddress2 && <p className="text-muted-foreground">{address.streetAddress2}</p>}
					<p className="text-muted-foreground">
						{address.postalCode} {address.city}
					</p>
					<p className="text-muted-foreground">{address.country.country}</p>
				</div>
			</div>
		</div>
	);
}
