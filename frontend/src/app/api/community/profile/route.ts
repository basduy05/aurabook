import { NextResponse } from "next/server";
import { executeAuthenticatedGraphQL } from "@/lib/graphql";
import { CurrentUserDocument, CurrentUserOrdersPaginatedDocument } from "@/gql/graphql";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";
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
			// Query real orders from Saleor
			let realOrdersCount = 0;
			let realTotalSpentAmount = 0;
			try {
				const ordersRes = await executeAuthenticatedGraphQL(CurrentUserOrdersPaginatedDocument, {
					variables: { first: 50, after: null, ...graphqlLanguageCodeVariables("vi") },
					cache: "no-cache",
				});
				if (ordersRes.ok && ordersRes.data?.me?.orders) {
					realOrdersCount = ordersRes.data.me.orders.totalCount || ordersRes.data.me.orders.edges.length;
					for (const edge of ordersRes.data.me.orders.edges) {
						if (edge.node.total?.gross?.amount) {
							realTotalSpentAmount += edge.node.total.gross.amount;
						}
					}
				}
			} catch (err) {
				console.error("[community/profile] Failed to query user orders:", err);
			}

			const formattedSpent = realTotalSpentAmount > 0
				? `${new Intl.NumberFormat("vi-VN").format(realTotalSpentAmount)} ₫`
				: "0 ₫";

			const existingUser = getCommunityUsers().find(
				(u) => u.realAccount?.email?.toLowerCase() === me.email.toLowerCase() || u.realAccount?.id === me.id,
			);

			if (existingUser) {
				if (existingUser.realAccount) {
					existingUser.realAccount.ordersCount = realOrdersCount;
					existingUser.realAccount.totalSpent = formattedSpent;
					saveCommunityUserWithPropagation(existingUser);
				}
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
					ordersCount: realOrdersCount,
					totalSpent: formattedSpent,
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

		let targetUsername = user.username;
		let usernameChanged = false;

		if (body.username) {
			const rawClean = body.username.replace(/^@+/, "").trim().toLowerCase();
			if (!rawClean) {
				return NextResponse.json({ error: "ID người dùng không được để trống." }, { status: 400 });
			}
			if (!/^[a-z0-9_]{3,30}$/.test(rawClean)) {
				return NextResponse.json(
					{ error: "ID người dùng chỉ được chứa chữ cái không dấu, số và dấu gạch dưới (3 - 30 ký tự)." },
					{ status: 400 }
				);
			}
			const formattedUsername = `@${rawClean}`;
			if (formattedUsername.toLowerCase() !== user.username.toLowerCase()) {
				// 1. Check 7-day cooldown
				if (user.lastUsernameChange) {
					const lastChangeTime = new Date(user.lastUsernameChange).getTime();
					const now = Date.now();
					const diffMs = now - lastChangeTime;
					const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
					if (diffMs < sevenDaysMs) {
						const remainingDays = Math.ceil((sevenDaysMs - diffMs) / (24 * 60 * 60 * 1000));
						return NextResponse.json(
							{
								error: `Bạn chỉ có thể thay đổi ID người dùng sau mỗi 7 ngày. Vui lòng thử lại sau ${remainingDays} ngày nữa.`,
								cooldownDaysLeft: remainingDays,
							},
							{ status: 400 }
						);
					}
				}

				// 2. Check collision against all other users (case-insensitive)
				const allUsers = getCommunityUsers();
				const isTaken = allUsers.some(
					(u) => u.id !== user.id && u.username.toLowerCase() === formattedUsername.toLowerCase()
				);
				if (isTaken) {
					return NextResponse.json(
						{ error: `ID người dùng ${formattedUsername} đã có người sử dụng. Vui lòng chọn ID khác.` },
						{ status: 400 }
					);
				}

				targetUsername = formattedUsername;
				usernameChanged = true;
			}
		}

		const updatedUser: CommunityUser = {
			...user,
			username: targetUsername,
			displayName: body.displayName?.trim() || user.displayName,
			avatar: body.avatar || user.avatar,
			bio: body.bio ? body.bio.trim().slice(0, 150) : user.bio,
			favoriteGenre: body.favoriteGenre?.trim() ?? user.favoriteGenre,
			hasAcceptedTerms: body.hasAcceptedTerms ?? user.hasAcceptedTerms,
			lastUsernameChange: usernameChanged ? new Date().toISOString() : user.lastUsernameChange,
		};

		const saved = saveCommunityUserWithPropagation(updatedUser);
		return NextResponse.json({ user: saved });
	} catch (error) {
		console.error("[community/profile] Error saving profile:", error);
		return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật hồ sơ." }, { status: 500 });
	}
}
