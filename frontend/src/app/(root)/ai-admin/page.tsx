import { redirect } from "next/navigation";

export default function StandaloneAIAdminPage() {
	redirect("/system-admin?tab=voice");
}
