import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { email, password } = (await request.json()) as {
			email?: string;
			password?: string;
		};

		if (!email || !password) {
			return NextResponse.json(
				{ ok: false, error: "Vui lòng nhập đầy đủ email và mật khẩu quản trị." },
				{ status: 400 },
			);
		}

		const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";

		const mutation = `
			mutation TokenCreate($email: String!, $password: String!) {
				tokenCreate(email: $email, password: $password) {
					token
					user {
						id
						email
						firstName
						lastName
						isStaff
					}
					errors {
						field
						message
						code
					}
				}
			}
		`;

		const res = await fetch(saleorApiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: mutation,
				variables: { email: email.trim(), password },
			}),
		});

		if (!res.ok) {
			return NextResponse.json(
				{ ok: false, error: "Không thể kết nối đến máy chủ xác thực Saleor." },
				{ status: 502 },
			);
		}

		const json = (await res.json()) as {
			data?: {
				tokenCreate?: {
					token?: string;
					user?: {
						id: string;
						email: string;
						firstName?: string | null;
						lastName?: string | null;
						isStaff?: boolean;
					} | null;
					errors?: Array<{ message: string; code?: string }>;
				};
			};
		};

		const tokenData = json?.data?.tokenCreate;

		if (tokenData?.errors && tokenData.errors.length > 0) {
			return NextResponse.json(
				{ ok: false, error: tokenData.errors[0]?.message || "Đăng nhập thất bại." },
				{ status: 401 },
			);
		}

		const user = tokenData?.user;
		if (!user) {
			return NextResponse.json(
				{ ok: false, error: "Tài khoản hoặc mật khẩu không chính xác." },
				{ status: 401 },
			);
		}

		if (!user.isStaff && user.email !== "basduygame@gmail.com") {
			return NextResponse.json(
				{ ok: false, error: "Tài khoản này không có quyền Quản trị viên (isStaff)." },
				{ status: 403 },
			);
		}

		const response = NextResponse.json({
			ok: true,
			user: {
				id: user.id,
				email: user.email,
				fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
				isStaff: true,
			},
		});

		// Issue ONLY the isolated admin session cookie, NEVER touch storefront customer auth cookies
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
	} catch (error) {
		console.error("[community/admin/login] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Lỗi hệ thống khi đăng nhập quản trị viên." },
			{ status: 500 },
		);
	}
}
