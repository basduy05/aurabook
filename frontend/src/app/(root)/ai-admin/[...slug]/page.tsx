import type { Metadata } from "next";
import { AIAdminDashboard } from "@/ui/components/ai-admin/ai-admin-dashboard";

export const metadata: Metadata = {
	title: "Trung Tâm Quản Trị AI & DRM Platform | AuraBook Saleor Admin",
	description: "Bảng điều khiển quản lý và giám sát hệ sinh thái AI: Dify Core RAG, LiveKit Voice Agent, LCP DRM và Ragas Evaluation.",
};

export default function StandaloneAIAdminSlugPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<AIAdminDashboard />
		</main>
	);
}
