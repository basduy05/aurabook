import { redirect } from "next/navigation";

export default function DashboardRedirectPage() {
	redirect("http://localhost:9000/dashboard/");
}
