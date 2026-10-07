import type { Metadata } from "next";
import { CommunityFeed } from "@/ui/components/community/community-feed";

export const metadata: Metadata = {
	title: "Cộng đồng Độc giả | AuraBook",
	description: "Không gian giao lưu, chia sẻ cảm nhận sách và kết nối bạn đọc yêu tri thức AuraBook.",
};

export default function CommunityPage() {
	return <CommunityFeed />;
}
