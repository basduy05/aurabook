"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { type ReviewSummary } from "@/lib/reviews/types";

export function ProductRatingSummary({
	productSlug,
	initialSummary,
}: {
	productSlug: string;
	initialSummary?: ReviewSummary;
}) {
	const [summary, setSummary] = useState<ReviewSummary | undefined>(initialSummary);

	useEffect(() => {
		async function fetchSummary() {
			try {
				const res = await fetch(`/api/reviews?productSlug=${encodeURIComponent(productSlug)}`);
				if (res.ok) {
					const data = (await res.json()) as { summary: ReviewSummary };
					setSummary(data.summary);
				}
			} catch {
				// use default/initial
			}
		}
		if (!initialSummary) {
			fetchSummary();
		}
	}, [productSlug, initialSummary]);

	const scrollToReviews = () => {
		const el = document.getElementById("customer-reviews");
		if (el) {
			el.scrollIntoView({ behavior: "smooth" });
		}
	};

	const rating = summary?.averageRating ?? 5.0;
	const count = summary?.totalReviews ?? 0;

	return (
		<div className="order-2 my-2 flex flex-wrap items-center gap-2 text-sm">
			<button
				type="button"
				onClick={scrollToReviews}
				className="group flex items-center gap-1.5 transition-opacity hover:opacity-85"
				title="Xem đánh giá của độc giả"
			>
				<div className="flex items-center text-amber-500">
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							className={`h-4 w-4 ${
								star <= Math.round(rating)
									? "fill-amber-400 text-amber-400"
									: "fill-muted text-muted-foreground/30"
							}`}
						/>
					))}
				</div>
				<span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
				<span className="text-muted-foreground underline-offset-4 group-hover:underline">
					({count} đánh giá)
				</span>
			</button>

			<span className="text-muted-foreground/40">•</span>

			<button
				type="button"
				onClick={() => {
					scrollToReviews();
					window.dispatchEvent(new CustomEvent("open-write-review-modal"));
				}}
				className="text-xs font-medium text-primary hover:underline"
			>
				Viết đánh giá
			</button>
		</div>
	);
}
