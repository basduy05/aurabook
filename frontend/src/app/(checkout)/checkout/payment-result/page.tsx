"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SaleorThrobber } from "@/checkout/ui-kit/saleor-throbber";

function PaymentResultLoading() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-secondary p-4">
			<div
				className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-sm md:p-12"
				role="status"
				aria-live="polite"
				aria-busy="true"
			>
				<SaleorThrobber size={40} className="text-muted-foreground" />
				<h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground md:text-xl">
					Đang hoàn tất thanh toán...
				</h1>
				<p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
					Vui lòng chờ trong giây lát trong khi chúng tôi ghi nhận kết quả thanh toán của bạn.
				</p>
			</div>
		</main>
	);
}

function PaymentResultForwarder() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("processingPayment", "true");
		const checkoutPath = sessionStorage.getItem("checkout_return_path") || "/checkout";
		window.location.replace(`${checkoutPath}?${params.toString()}`);
	}, [searchParams]);

	return <PaymentResultLoading />;
}

export default function PaymentResultPage() {
	return (
		<Suspense fallback={<PaymentResultLoading />}>
			<PaymentResultForwarder />
		</Suspense>
	);
}
