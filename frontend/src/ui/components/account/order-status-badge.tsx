import { Circle, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { type OrderStatus } from "@/gql/graphql";
import { Badge } from "@/ui/components/ui/badge";
import { orderStatusBadgeStyle } from "./order-status-config";
import { getCustomerOrderStatusLabel } from "./order-status-labels";

type Props = {
	status: OrderStatus | string;
	statusDisplay: string;
	localeSlug: string;
	isCompleted?: boolean;
};

export async function OrderStatusBadge({ status, statusDisplay, localeSlug, isCompleted }: Props) {
	const tStatus = await getTranslations({ locale: localeSlug, namespace: "account.orderStatus" });
	
	if (isCompleted || status === "COMPLETED") {
		return (
			<Badge variant="success" className="gap-1.5 px-3 py-1 text-sm font-semibold">
				<CheckCircle2 className="h-4 w-4" strokeWidth={2} />
				{tStatus("COMPLETED")}
			</Badge>
		);
	}

	const config = orderStatusBadgeStyle[status as OrderStatus] ?? {
		icon: Circle,
		badgeClassName: "text-muted-foreground bg-secondary border-border",
	};
	const Icon = config.icon;

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${config.badgeClassName}`}
		>
			<Icon className="h-4 w-4" strokeWidth={1.75} />
			{getCustomerOrderStatusLabel(tStatus, status, statusDisplay)}
		</span>
	);
}
