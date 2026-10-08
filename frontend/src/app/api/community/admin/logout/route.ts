import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signOutSession } from "@/lib/auth/bff-server";

export async function POST() {
	try {
		const cookieStore = await cookies();
		// Delete isolated admin session
		cookieStore.delete("aurabook_admin_session");
		
		// Also clean any storefront auth session if requested
		await signOutSession();

		const response = NextResponse.json({ ok: true, message: "Đã đăng xuất phiên quản trị thành công." });
		response.cookies.delete("aurabook_admin_session");

		return response;
	} catch (error) {
		console.error("[community/admin/logout] Error:", error);
		return NextResponse.json({ error: "Lỗi đăng xuất" }, { status: 500 });
	}
}
