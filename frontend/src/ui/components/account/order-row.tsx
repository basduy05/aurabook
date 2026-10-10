import Image from "next/image";
import { ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { type OrderDetailsFragment } from "@/gql/graphql";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import { isLocalImageUrl } from "@/lib/images";
import { resolveLocaleFromSlug } from "@/config/locale";
import { getGHNShipmentByOrder } from "@/lib/shipping/ghn";
import { Badge } from "@/ui/components/ui/badge";
import { orderStatusStyle, defaultStatusStyle } from "./order-status-config";
import { type OrderRowLabels } from "./order-row-labels";
import { accountRoutes } from "./routes";

type Props = {
	order: OrderDetailsFragment;
	localeSlug: string;
	labels: OrderRowLabels;
};

export function OrderRow({ order, localeSlug, labels }: Props) {
	const intlLocale = resolveLocaleFromSlug(localeSlug).bcp47;
	const ghnShipment = getGHNShipmentByOrder(order.number);
	const isCompleted = ghnShipment?.status === "delivered";

	const thumbnails = order.lines
		.filter((l) => l.variant?.product.thumbnail)
		.map((l) => l.variant!.product.thumbnail!)
		.slice(0, 3);

	const style = orderStatusStyle[order.status] ?? defaultStatusStyle;
	const StatusIcon = style.icon;

	return (
		<LinkWithChannel
			href={accountRoutes.orderDetail(order.number)}
			className="hover:bg-secondary/30 flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors"
		>
			<div className="flex -space-x-3">
				{thumbnails.map((thumb, i) => (
					<div
						key={i}
						className="bg-secondary/40 h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-background"
					>
						<Image
							src={thumb.url}
							alt={thumb.alt ?? ""}
							width={96}
							height={96}
							unoptimized={isLocalImageUrl(thumb.url)}
							className="h-full w-full object-contain"
						/>
					</div>
				))}
				{thumbnails.length === 0 && (
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
						#
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-sm font-semibold">{labels.orderNumber}</p>
					{ghnShipment && (
						<Badge variant="outline-solid" className="gap-1 px-2 py-0.5 text-[11px] font-medium font-mono">
							<Truck className="h-3 w-3 text-muted-foreground" />
							GHN: {ghnShipment.trackingCode}
						</Badge>
					)}
				</div>
				<p className="text-[13px] text-muted-foreground mt-0.5">
					<time dateTime={order.created}>{formatDate(new Date(order.created), undefined, intlLocale)}</time>
					{" · "}
					{labels.itemCount}
				</p>
			</div>

			<div className="flex items-center gap-4">
				{isCompleted ? (
					<Badge variant="success" className="gap-1.5 px-2.5 py-1 text-xs">
						<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
						<span className="hidden sm:inline">Hoàn tất (Completed)</span>
					</Badge>
				) : ghnShipment ? (
					<Badge variant="outline-solid" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
						<Truck className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
						<span className="hidden sm:inline">{ghnShipment.statusDisplay}</span>
					</Badge>
				) : (
					<Badge variant="outline-solid" className={cn("gap-1.5 px-2.5 py-1 text-xs font-medium", style.className)}>
						<StatusIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
						<span className="hidden sm:inline">{labels.statusLabel}</span>
					</Badge>
				)}
				<span className="text-sm font-semibold tabular-nums">
					{formatMoney(order.total.gross.amount, order.total.gross.currency, intlLocale)}
				</span>
				<ArrowRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</LinkWithChannel>
	);
}
