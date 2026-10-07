import type { Metadata } from "next";
import { CommunityAdminDashboard } from "@/ui/components/community/admin/community-admin-dashboard";

export const metadata: Metadata = {
	title: "Quản trị Cộng đồng & Độc giả | Saleor Admin",
	description: "Bảng điều khiển quản trị mạng xã hội, kiểm duyệt bài viết và quản lý người dùng AuraBook theo chuẩn Saleor Dashboard.",
};

export default function StandaloneCommunityAdminPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<CommunityAdminDashboard />
		</main>
	);
}
