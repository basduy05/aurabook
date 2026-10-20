import { redirect } from "next/navigation";

export default function CommunityAdminPage() {
	redirect("/system-admin?tab=readers");
}
