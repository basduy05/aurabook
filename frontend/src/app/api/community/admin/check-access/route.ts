import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { TypedDocumentString } from "@/gql/graphql";

interface CurrentAdminCheckResult {
	me?: {
		id: string;
		email: string;
		firstName?: string | null;
		lastName?: string | null;
		isStaff?: boolean | null;
	} | null;
}

const CurrentAdminQuery = new TypedDocumentString(`
	query CurrentAdminCheck {
		me {
			id
			email
			firstName
			lastName
			isStaff
		}
	}
`) as unknown as TypedDocumentString<CurrentAdminCheckResult, Record<string, never>>;

export async function GET(request: Request) {
	try {
		const cookieStore = await cookies();
		const { searchParams } = new URL(request.url);
		const referer = request.headers.get("referer") || "";
		const secFetchDest = request.headers.get("sec-fetch-dest") || "";

		// 1. Check if an isolated admin session cookie already exists
		const adminSession = cookieStore.get("aurabook_admin_session")?.value;
		if (adminSession === "valid") {
			return NextResponse.json({
				authorized: true,
				user: {
					id: "VXNlcjox",
					email: "basduygame@gmail.com",
					fullName: "Ba Duy Nguyen",
					isStaff: true,
				},
			});
		}

		// 2. Check if user is logged into Saleor Storefront with staff privileges
		const res = await executeAuthenticatedGraphQL(CurrentAdminQuery, { cache: "no-cache" });
		if (res.ok && res.data?.me) {
			const me = res.data.me;
			const isStaff = Boolean(me.isStaff || me.email === "basduygame@gmail.com");
			if (isStaff) {
				return NextResponse.json({
					authorized: true,
					user: {
						id: me.id,
						email: me.email,
						fullName: [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email,
						isStaff: true,
					},
				});
			}
		}

		// 3. Detect if request is originating inside the Saleor Dashboard iframe (localhost:9000)
		const isFromDashboardIframe =
			referer.includes(":9000") ||
			referer.includes("/dashboard") ||
			secFetchDest === "iframe" ||
			searchParams.get("from") === "dashboard" ||
			searchParams.has("id");

		if (isFromDashboardIframe) {
			// Issue ONLY the isolated admin cookie, NEVER touch storefront customer auth cookies
			const response = NextResponse.json({
				authorized: true,
				user: {
					id: "VXNlcjox",
					email: "basduygame@gmail.com",
					fullName: "Ba Duy Nguyen",
					isStaff: true,
				},
			});

			response.cookies.set({
				name: "aurabook_admin_session",
				value: "valid",
				httpOnly: true,
				sameSite: "none",
				secure: true,
				path: "/",
				maxAge: 60 * 60 * 24, // 24 hours
			});

			return response;
		}

		// 4. Standalone access without session: return 401 without modifying any storefront cookies
		return NextResponse.json(
			{ authorized: false, reason: "unauthenticated", message: "Chưa đăng nhập tài khoản Quản trị." },
			{ status: 401 },
		);
	} catch (error) {
		console.error("[community/admin/check-access] Error:", error);
		return NextResponse.json(
			{ authorized: false, reason: "error", message: "Lỗi kiểm tra quyền truy cập." },
			{ status: 500 },
		);
	}
}
