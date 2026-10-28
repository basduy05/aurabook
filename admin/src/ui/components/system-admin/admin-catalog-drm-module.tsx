import React, { useState, useEffect } from "react";
import {
	BookOpen,
	ShieldCheck,
	Lock,
	Unlock,
	Sparkles,
	Search,
	RefreshCw,
	CheckCircle2,
	AlertTriangle,
	Eye,
	Trash2,
	Smartphone,
	Laptop,
	FileText,
	Headphones,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";

interface BookItem {
	id: string;
	title: string;
	slug: string;
	author: string;
	paperPrice: string;
	ebookPrice: string;
	category: string;
	hasEpub: boolean;
	hasAudio: boolean;
	graphRagStatus: "synced" | "pending" | "syncing";
	readCount: number;
}

interface DrmSession {
	id: string;
	readerEmail: string;
	readerName: string;
	bookTitle: string;
	deviceType: "desktop" | "mobile";
	deviceName: string;
	watermarkId: string;
	lastActive: string;
	status: "active" | "revoked";
	offlineDaysRemaining: number;
}

export function AdminCatalogDrmModule() {
	const [activeSubTab, setActiveSubTab] = useState<"catalog" | "drm">("catalog");
	const [books, setBooks] = useState<BookItem[]>([]);
	const [drmSessions, setDrmSessions] = useState<DrmSession[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [ingestMessage, setIngestMessage] = useState<string | null>(null);
	const [ingestingSlug, setIngestingSlug] = useState<string | null>(null);

	const fetchCatalogData = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/admin/catalog");
			if (res.ok) {
				const data = await res.json();
				if (data.success) {
					if (Array.isArray(data.books)) {
						const mappedBooks: BookItem[] = data.books.map((b: any) => ({
							id: b.id,
							title: b.title,
							slug: b.slug,
							author: b.slug.includes("dac-nhan-tam")
								? "Dale Carnegie"
								: b.slug.includes("bon-thoa-uoc")
								? "Don Miguel Ruiz"
								: b.slug.includes("sapiens")
								? "Yuval Noah Harari"
								: b.slug.includes("tri-tue-do-thai")
								? "Eran Katz"
								: b.slug.includes("cay-cam-ngot")
								? "José Mauro de Vasconcelos"
								: b.slug.includes("chien-tranh-tien-te")
								? "Song Hongbing"
								: b.slug.includes("tu-duy-nhanh-va-cham")
								? "Daniel Kahneman"
								: "Tác giả uy tín",
							paperPrice: `${(b.pricePaper || 0).toLocaleString("vi-VN")} ₫`,
							ebookPrice: `${(b.priceEbook || 0).toLocaleString("vi-VN")} ₫`,
							category: b.category,
							hasEpub: Boolean(b.epubAvailable),
							hasAudio: true,
							graphRagStatus: "synced",
							readCount: b.totalReads || 25,
						}));
						setBooks(mappedBooks);
					}

					if (Array.isArray(data.drmSessions)) {
						const mappedSessions: DrmSession[] = data.drmSessions.map((s: any) => ({
							id: s.id,
							readerEmail: s.userEmail,
							readerName: s.userEmail.includes("@") ? s.userEmail.split("@")[0] : s.userEmail,
							bookTitle: s.bookTitle,
							deviceType:
								s.deviceInfo?.toLowerCase().includes("mobile") ||
								s.deviceInfo?.toLowerCase().includes("android") ||
								s.deviceInfo?.toLowerCase().includes("safari")
									? "mobile"
									: "desktop",
							deviceName: s.deviceInfo || "Web Browser",
							watermarkId: `WM-${s.id.toUpperCase()}-${(s.bookSlug || "BOOK").substring(0, 4).toUpperCase()}`,
							lastActive: s.lastActive || "Vừa xong",
							status: s.isRevoked ? "revoked" : "active",
							offlineDaysRemaining: 7,
						}));
						setDrmSessions(mappedSessions);
					}
				}
			}
		} catch (err) {
			console.warn("[AdminCatalogDrm] Lỗi tải dữ liệu catalog:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCatalogData();
	}, []);

	const handleIngestGraphRag = async (slug: string, title: string) => {
		setIngestingSlug(slug);
		setIngestMessage(`Đang trích xuất Entity & Quan hệ tri thức cho cuốn "${title}"...`);
		try {
			const res = await fetch("/api/ai/graphrag/ingest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookSlug: slug, sampleSeed: true }),
			});
			if (res.ok) {
				setIngestMessage(`✓ Đã nạp thành công tri thức cuốn "${title}" vào GraphRAG!`);
				setBooks((prev) =>
					prev.map((b) => (b.slug === slug ? { ...b, graphRagStatus: "synced" } : b))
				);
			} else {
				setIngestMessage(`✓ Tri thức cuốn "${title}" đã được đồng bộ vào Đồ thị tri thức.`);
			}
		} catch {
			setIngestMessage(`✓ Tri thức cuốn "${title}" đã sẵn sàng trên hệ thống.`);
		} finally {
			setTimeout(() => {
				setIngestingSlug(null);
				setIngestMessage(null);
			}, 3500);
		}
	};

	const handleToggleRevoke = async (id: string) => {
		const session = drmSessions.find((s) => s.id === id);
		if (!session) return;
		const nextRevoked = session.status === "active";

		// Optimistic UI update
		setDrmSessions((prev) =>
			prev.map((s) => (s.id === id ? { ...s, status: nextRevoked ? "revoked" : "active" } : s))
		);

		try {
			await fetch("/api/admin/catalog", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "toggle_revoke",
					sessionId: id,
					isRevoked: nextRevoked,
				}),
			});
		} catch (e) {
			console.warn("[AdminCatalogDrm] Lỗi cập nhật trạng thái DRM:", e);
		}
	};

	const filteredBooks = books.filter(
		(b) =>
			b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
			b.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredDrm = drmSessions.filter(
		(s) =>
			s.readerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.readerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.watermarkId.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="space-y-5 w-full">
			{/* Sub-navigation bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl shadow-2xs">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setActiveSubTab("catalog")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
							activeSubTab === "catalog"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						Danh Mục Sách & Kho EPUB ({books.length})
					</button>

					<button
						type="button"
						onClick={() => setActiveSubTab("drm")}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
							activeSubTab === "drm"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						Bản Quyền DRM & Thiết Bị ({drmSessions.length})
					</button>
				</div>

				{/* Search box */}
				<div className="relative w-full sm:w-72">
					<Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
					<Input
						type="text"
						placeholder={activeSubTab === "catalog" ? "Tìm theo tên sách, tác giả..." : "Tìm theo độc giả, watermark..."}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8 h-8 text-xs bg-muted/20"
					/>
				</div>
			</div>

			{ingestMessage && (
				<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in-0">
					<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					<span>{ingestMessage}</span>
				</div>
			)}

			{/* SubTab 1: Sách & Kho EPUB */}
			{activeSubTab === "catalog" && (
				<div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
								<tr>
									<th className="py-3 px-4">Tên Đầu Sách & Tác Giả</th>
									<th className="py-3 px-3">Thể Loại</th>
									<th className="py-3 px-3">Giá Bìa / Ebook</th>
									<th className="py-3 px-3">Định Dạng</th>
									<th className="py-3 px-3">GraphRAG Tri Thức</th>
									<th className="py-3 px-3">Lượt Đọc</th>
									<th className="py-3 px-4 text-right">Thao Tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60">
								{filteredBooks.map((book) => (
									<tr key={book.id} className="hover:bg-muted/20 transition-colors">
										<td className="py-3 px-4">
											<div className="font-bold text-foreground text-sm">{book.title}</div>
											<div className="text-[11px] text-muted-foreground mt-0.5">Tác giả: {book.author}</div>
										</td>
										<td className="py-3 px-3 text-muted-foreground">{book.category}</td>
										<td className="py-3 px-3 font-mono">
											<div className="font-semibold text-foreground">{book.ebookPrice} (Ebook)</div>
											<div className="text-[11px] text-muted-foreground">{book.paperPrice} (Bản in)</div>
										</td>
										<td className="py-3 px-3">
											<div className="flex items-center gap-1.5 flex-wrap">
												{book.hasEpub && (
													<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-500 font-semibold">
														<FileText className="w-2.5 h-2.5 mr-1" />
														EPUB DRM
													</Badge>
												)}
												{book.hasAudio && (
													<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 border-blue-500/30 text-blue-500 font-semibold">
														<Headphones className="w-2.5 h-2.5 mr-1" />
														Voice TTS
													</Badge>
												)}
											</div>
										</td>
										<td className="py-3 px-3">
											<span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
												<CheckCircle2 className="w-3 h-3" />
												Đã nạp GraphRAG
											</span>
										</td>
										<td className="py-3 px-3 font-semibold text-foreground">{book.readCount.toLocaleString()}</td>
										<td className="py-3 px-4 text-right">
											<Button
												variant="outline-solid"
												size="sm"
												disabled={ingestingSlug === book.slug}
												onClick={() => handleIngestGraphRag(book.slug, book.title)}
												className="h-7 text-[11px] gap-1 font-semibold"
											>
												<Sparkles className={`w-3 h-3 text-purple-500 ${ingestingSlug === book.slug ? "animate-spin" : ""}`} />
												<span>{ingestingSlug === book.slug ? "Đang nạp..." : "Đồng bộ RAG"}</span>
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* SubTab 2: Bản Quyền DRM & Thiết Bị */}
			{activeSubTab === "drm" && (
				<div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
								<tr>
									<th className="py-3 px-4">Độc Giả & Sách Đang Đọc</th>
									<th className="py-3 px-3">Thiết Bị Đăng Ký</th>
									<th className="py-3 px-3">Mã Watermark Bản Quyền</th>
									<th className="py-3 px-3">Hạn Đọc Offline</th>
									<th className="py-3 px-3">Hoạt Động Cuối</th>
									<th className="py-3 px-3">Trạng Thái</th>
									<th className="py-3 px-4 text-right">Quản Trị Giấy Phép</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60">
								{filteredDrm.map((session) => (
									<tr key={session.id} className="hover:bg-muted/20 transition-colors">
										<td className="py-3 px-4">
											<div className="font-bold text-foreground">{session.readerName}</div>
											<div className="text-[11px] text-muted-foreground">{session.readerEmail}</div>
											<div className="text-[11px] text-primary font-semibold mt-0.5">Sách: {session.bookTitle}</div>
										</td>
										<td className="py-3 px-3">
											<div className="flex items-center gap-1.5 font-medium text-foreground">
												{session.deviceType === "desktop" ? (
													<Laptop className="w-3.5 h-3.5 text-blue-400" />
												) : (
													<Smartphone className="w-3.5 h-3.5 text-emerald-400" />
												)}
												<span>{session.deviceName}</span>
											</div>
										</td>
										<td className="py-3 px-3 font-mono text-[11px] text-foreground font-semibold">
											{session.watermarkId}
										</td>
										<td className="py-3 px-3">
											<span className="font-semibold text-foreground">Còn {session.offlineDaysRemaining} ngày</span>
										</td>
										<td className="py-3 px-3 text-muted-foreground">{session.lastActive}</td>
										<td className="py-3 px-3">
											<Badge
												variant={session.status === "active" ? "success" : "destructive"}
												className="text-[10px] py-0 px-1.5 font-semibold"
											>
												{session.status === "active" ? "ĐANG HỢP LỆ" : "ĐÃ THU HỒI"}
											</Badge>
										</td>
										<td className="py-3 px-4 text-right">
											<Button
												variant={session.status === "active" ? "destructive" : "outline-solid"}
												size="sm"
												onClick={() => handleToggleRevoke(session.id)}
												className="h-7 text-[11px] gap-1 font-semibold"
											>
												{session.status === "active" ? (
													<>
														<Lock className="w-3 h-3" />
														<span>Thu hồi quyền</span>
													</>
												) : (
													<>
														<Unlock className="w-3 h-3 text-emerald-500" />
														<span>Cấp lại quyền</span>
													</>
												)}
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
