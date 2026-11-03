import { redirect } from "next/navigation";

export default function AuraDashboardRedirectPage() {
	redirect("http://localhost:9000/dashboard/");
}
