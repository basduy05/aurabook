import type { Metadata } from "next";
import { Suspense } from "react";
import { SystemAdminDashboard } from "@/ui/components/system-admin/system-admin-dashboard";
import { Loader } from "@/ui/atoms/loader";

export const metadata: Metadata = {
	title: "Trung Tâm Quản Trị Hệ Thống | AuraBook Saleor Admin",
	description: "Bảng điều khiển quản trị hệ thống hợp nhất: Độc giả, Kiểm duyệt, Bản quyền DRM và Nền tảng AI Voice, GraphRAG.",
};

export default function SystemAdminPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<Suspense
				fallback={
					<div className="flex min-h-[500px] w-full items-center justify-center">
						<Loader size="lg" text="Đang tải Trung Tâm Quản Trị Hệ Thống Aurabook..." />
					</div>
				}
			>
				<SystemAdminDashboard />
			</Suspense>
		</main>
	);
}
