export function formatCommunityExactTime(dateStr?: string): string {
	if (!dateStr) return "Vừa xong";
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const hours = d.getHours().toString().padStart(2, "0");
		const minutes = d.getMinutes().toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const year = d.getFullYear();
		return `${hours}:${minutes} • ${day}/${month}/${year}`;
	} catch {
		return dateStr;
	}
}

export function formatCommunityTimeShort(dateStr?: string): string {
	if (!dateStr) return "Vừa xong";
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);

		if (diffMins < 1) return "Vừa xong";
		if (diffMins < 60) return `${diffMins} phút trước`;
		if (diffHours < 24 && now.getDate() === d.getDate()) {
			const hours = d.getHours().toString().padStart(2, "0");
			const minutes = d.getMinutes().toString().padStart(2, "0");
			return `${hours}:${minutes} hôm nay`;
		}

		const hours = d.getHours().toString().padStart(2, "0");
		const minutes = d.getMinutes().toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const year = d.getFullYear();
		return `${hours}:${minutes}, ${day}/${month}/${year}`;
	} catch {
		return dateStr;
	}
}
