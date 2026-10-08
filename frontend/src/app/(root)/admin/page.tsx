import { redirect } from "next/navigation";

export default function AdminRedirectPage() {
	redirect("http://localhost:9000/dashboard/");
}
