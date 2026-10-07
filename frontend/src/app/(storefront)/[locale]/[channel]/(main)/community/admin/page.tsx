import type { Metadata } from "next";
import { CommunityAdminDashboard } from "@/ui/components/community/admin/community-admin-dashboard";

export const metadata: Metadata = {
	title: "Quản trị Cộng đồng & Người dùng | AuraBook Admin",
	description: "Bảng điều khiển quản trị mạng xã hội, kiểm duyệt bài viết và quản lý người dùng AuraBook.",
};

export default function CommunityAdminPage() {
	return <CommunityAdminDashboard />;
}
