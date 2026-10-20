import { redirect } from "next/navigation";

export default function StandaloneCommunityAdminPage() {
	redirect("/system-admin?tab=readers");
}
