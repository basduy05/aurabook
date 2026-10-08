import { NextResponse } from "next/server";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";
import {
	getCommunityUsers,
	saveCommunityUserWithPropagation,
	getCommunityUserById,
} from "@/lib/community/storage";
import { type CommunityUser } from "@/lib/community/types";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (userId) {
		const user = getCommunityUserById(userId);
		if (user) {
			return NextResponse.json({ user });
		}
	}

	// Try resolving logged-in user
	try {
		const res = await executeAuthenticatedGraphQL(CurrentUserDocument, { cache: "no-cache" });
		if (res.ok && res.data?.me) {
			const me = res.data.me;
			const existingUser = getCommunityUsers().find(
				(u) => u.realAccount.email.toLowerCase() === me.email.toLowerCase() || u.realAccount.id === me.id,
			);
			if (existingUser) {
				return NextResponse.json({ user: existingUser });
			}

			// Generate initial profile from logged in account
			const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email.split("@")[0];
			const username = `@${(me.firstName || me.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
			
			const newProfile: CommunityUser = {
				id: `user-${me.id}`,
				username,
				displayName: name,
				avatar: me.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
				bio: "Thành viên cộng đồng độc giả Aurabook",
				favoriteGenre: "Văn học & Kỹ năng sống",
				hasAcceptedTerms: false,
				isBlocked: false,
				joinedAt: new Date().toISOString(),
				realAccount: {
					id: me.id,
					email: me.email,
					fullName: name,
					ordersCount: 1,
					totalSpent: "1.875.000 ₫",
					registeredDate: "Gần đây",
					lastActive: "Đang online",
				},
			};
			saveCommunityUserWithPropagation(newProfile);
			return NextResponse.json({ user: newProfile });
		}
	} catch (e) {
		console.error("[community/profile] Failed to resolve auth user:", e);
	}

	// No fallback to demo users - unauthenticated visitors are guests
	return NextResponse.json({ user: null, isAuthenticated: false });
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<CommunityUser> & { id: string };
		if (!body.id) {
			return NextResponse.json({ error: "Missing user id" }, { status: 400 });
		}

		const user = getCommunityUserById(body.id);
		if (!user) {
			return NextResponse.json({ error: "Hồ sơ người dùng không tồn tại hoặc đã đăng xuất." }, { status: 404 });
		}

		const updatedUser: CommunityUser = {
			...user,
			username: body.username ? (body.username.startsWith("@") ? body.username : `@${body.username}`) : user.username,
			displayName: body.displayName?.trim() || user.displayName,
			avatar: body.avatar || user.avatar,
			bio: body.bio?.trim() ?? user.bio,
			favoriteGenre: body.favoriteGenre?.trim() ?? user.favoriteGenre,
			hasAcceptedTerms: body.hasAcceptedTerms ?? user.hasAcceptedTerms,
		};

		const saved = saveCommunityUserWithPropagation(updatedUser);
		return NextResponse.json({ user: saved });
	} catch (error) {
		console.error("[community/profile] Error saving profile:", error);
		return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật hồ sơ." }, { status: 500 });
	}
}
