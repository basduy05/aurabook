"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentCompletingScreen } from "@/checkout/views/saleor-checkout";

function PaymentResultForwarder() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("processingPayment", "true");
		const checkoutPath = sessionStorage.getItem("checkout_return_path") || "/checkout";
		window.location.replace(`${checkoutPath}?${params.toString()}`);
	}, [searchParams]);

	return <PaymentCompletingScreen />;
}

export default function PaymentResultPage() {
	return (
		<Suspense fallback={<PaymentCompletingScreen />}>
			<PaymentResultForwarder />
		</Suspense>
	);
}
