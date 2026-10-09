import { NextResponse } from "next/server";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserDocument, CurrentUserOrdersPaginatedDocument } from "@/gql/graphql";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const productSlug = searchParams.get("productSlug")?.toLowerCase().trim();

	try {
		// Check current user session
		const userRes = await executeAuthenticatedGraphQL(CurrentUserDocument, { cache: "no-cache" });
		if (!userRes.ok || !userRes.data?.me) {
			return NextResponse.json({
				isLoggedIn: false,
				hasPurchased: false,
				name: "",
			});
		}

		const me = userRes.data.me;
		const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email.split("@")[0];

		// Check orders history for this customer
		const ordersRes = await executeAuthenticatedGraphQL(CurrentUserOrdersPaginatedDocument, {
			variables: { first: 50, after: null, ...graphqlLanguageCodeVariables("vi") },
			cache: "no-cache",
		});

		let hasPurchased = false;
		if (ordersRes.ok && ordersRes.data?.me?.orders?.edges) {
			for (const edge of ordersRes.data.me.orders.edges) {
				const order = edge.node;
				if (order.status?.toLowerCase() === "canceled") continue;
				// check line items
				for (const line of order.lines) {
					const slug = line.variant?.product?.slug?.toLowerCase().trim();
					const name = line.variant?.product?.name?.toLowerCase().trim();
					if (productSlug && (slug === productSlug || name === productSlug)) {
						hasPurchased = true;
						break;
					}
				}
				if (hasPurchased) break;
			}
		}

		return NextResponse.json({
			isLoggedIn: true,
			hasPurchased,
			name,
			email: me.email,
		});
	} catch (e) {
		console.error("[check-eligibility] error:", e);
		return NextResponse.json({
			isLoggedIn: false,
			hasPurchased: false,
			name: "",
		});
	}
}
